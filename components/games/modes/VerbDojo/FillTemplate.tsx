import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../../constants';
import { speak } from '../../../../services/audio';
import { DictionaryEntry } from '../../../../types';
import { VerbTense } from '../../../../constants/language-config';
import { FillTemplateQuestion } from './types';

interface FillTemplateProps {
  question: FillTemplateQuestion;
  targetLanguage: string;
  accentColor: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    context: { verb: DictionaryEntry; tense: VerbTense; person: string }
  ) => Promise<{ accepted: boolean; explanation: string }>;
}

export const FillTemplate: React.FC<FillTemplateProps> = ({
  question,
  targetLanguage,
  accentColor,
  onAnswer,
  onNext,
  validateAnswer,
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get the correct answer (handle gendered)
  const correctAnswer =
    typeof question.correctAnswer === 'object'
      ? question.correctAnswer.masculine // Default to masculine for display
      : question.correctAnswer;

  // All valid answers (for gendered tenses)
  const validAnswers =
    typeof question.correctAnswer === 'object'
      ? [question.correctAnswer.masculine, question.correctAnswer.feminine].filter(Boolean)
      : [question.correctAnswer];

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || submitted || isValidating) return;

    setIsValidating(true);

    try {
      let accepted = false;
      let explanationText = '';

      if (validateAnswer) {
        // Use AI validation
        const result = await validateAnswer(input.trim(), correctAnswer, {
          verb: question.verb,
          tense: question.tense,
          person: question.personKey,
        });
        accepted = result.accepted;
        explanationText = result.explanation;
      } else {
        // Simple validation - check against all valid answers
        const userInput = input.trim().toLowerCase();
        accepted = validAnswers.some((ans) => ans.toLowerCase() === userInput);
        explanationText = accepted ? '' : `Correct answer: ${validAnswers.join(' / ')}`;
      }

      setIsCorrect(accepted);
      setExplanation(explanationText);
      setSubmitted(true);
      onAnswer(accepted);
    } catch (error) {
      console.error('Validation error:', error);
      // Fallback to simple validation
      const userInput = input.trim().toLowerCase();
      const accepted = validAnswers.some((ans) => ans.toLowerCase() === userInput);
      setIsCorrect(accepted);
      setExplanation(accepted ? '' : `Correct answer: ${validAnswers.join(' / ')}`);
      setSubmitted(true);
      onAnswer(accepted);
    } finally {
      setIsValidating(false);
    }
  }, [input, submitted, isValidating, validateAnswer, correctAnswer, validAnswers, question, onAnswer]);

  const handleNext = useCallback(() => {
    setInput('');
    setSubmitted(false);
    setIsCorrect(false);
    setExplanation(null);
    onNext();
  }, [onNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (submitted) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div>
      {/* Question card */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}
      >
        <p className="text-scale-caption font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
          {question.tense} tense
        </p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-2xl font-black text-[var(--text-primary)]">{question.verb.word}</h3>
          <button
            onClick={() => speak(question.verb.word, targetLanguage)}
            className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors"
          >
            <ICONS.Volume2 className="w-5 h-5" style={{ color: accentColor }} />
          </button>
        </div>
        <p className="text-[var(--text-secondary)] italic text-center mb-4">"{question.verb.translation}"</p>

        {/* Fill template */}
        <div className="bg-[var(--bg-card)] p-4 rounded-xl text-center">
          <span className="text-xl font-bold" style={{ color: accentColor }}>
            {question.personLabel}
          </span>
          <span className="text-xl text-[var(--text-primary)]"> ___</span>
          <p className="text-scale-caption text-[var(--text-secondary)] mt-1">({question.nativeLabel})</p>
        </div>
      </div>

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('play.verbDojo.typeAnswer', 'Type the conjugation...')}
        autoFocus
        disabled={submitted || isValidating}
        className="w-full p-4 mb-4 border-2 border-[var(--border-color)] rounded-xl text-center text-xl font-bold focus:outline-none bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] disabled:opacity-50"
        style={{ borderColor: submitted ? (isCorrect ? '#22c55e' : '#ef4444') : undefined }}
      />

      {/* Feedback */}
      {submitted && (
        <div className={`p-4 rounded-xl mb-4 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <span className="text-green-600 font-bold">✓ Correct!</span>
                <button
                  onClick={() => speak(correctAnswer, targetLanguage)}
                  className="p-1 rounded-full hover:bg-green-500/20 transition-colors"
                >
                  <ICONS.Volume2 className="w-4 h-4 text-green-600" />
                </button>
              </>
            ) : (
              <span className="text-red-600 font-bold">✗ Incorrect</span>
            )}
          </div>
          {!isCorrect && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-primary)]">
                Correct: <strong>{validAnswers.join(' / ')}</strong>
              </span>
              <button
                onClick={() => speak(correctAnswer, targetLanguage)}
                className="p-1 rounded-full hover:bg-red-500/20 transition-colors"
              >
                <ICONS.Volume2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
          {explanation && <p className="text-scale-caption text-[var(--text-secondary)] mt-2">{explanation}</p>}
        </div>
      )}

      {/* Submit / Next button */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isValidating}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {isValidating ? t('play.verbDojo.checking', 'Checking...') : t('play.verbDojo.submit', 'Submit')}
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all"
          style={{ backgroundColor: accentColor }}
        >
          {t('play.verbDojo.next', 'Next')}
        </button>
      )}
    </div>
  );
};
