import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { StreakIndicator } from '../components';
import { shuffleArray } from '../../../utils/array';
import { DictionaryEntry } from '../../../types';
import type { GameModeProps, AnswerResult } from './types';

type TypeItDirection = 'target_to_native' | 'native_to_target';

interface TypeItQuestion {
  word: DictionaryEntry;
  direction: TypeItDirection;
}

interface TypeItProps extends GameModeProps {
  /** Called when user submits an answer */
  onAnswer: (result: AnswerResult & { explanation?: string }) => void;
  /** Called to move to next word */
  onNext: () => void;
  /** Called when game is complete */
  onComplete: () => void;
  /** Validate answer (async) - returns { accepted, explanation } */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    context: { word: DictionaryEntry; direction: TypeItDirection }
  ) => Promise<{ accepted: boolean; explanation: string }>;
  /** Simple validation fallback */
  simpleValidate?: (userAnswer: string, correctAnswer: string) => boolean;
}

/**
 * Type It game mode - type the translation.
 * Supports bidirectional practice (target→native and native→target).
 */
export const TypeIt: React.FC<TypeItProps> = ({
  words,
  currentIndex,
  accentColor,
  targetLanguageName,
  nativeLanguageName,
  currentWordStreak,
  showIncorrectShake = false,
  onAnswer,
  onNext,
  onComplete,
  validateAnswer,
  simpleValidate,
}) => {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [localShake, setLocalShake] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Generate questions with random directions
  const questions = useMemo(() => {
    return words.map((word) => ({
      word,
      direction: (Math.random() > 0.5 ? 'target_to_native' : 'native_to_target') as TypeItDirection,
    }));
  }, [words]); // Regenerate when words array changes

  const question = questions[currentIndex];
  const isTargetToNative = question?.direction === 'target_to_native';
  const prompt = isTargetToNative ? question?.word.word : question?.word.translation;
  const correctAnswer = isTargetToNative ? question?.word.translation : question?.word.word;
  const isLastWord = currentIndex >= words.length - 1;

  // Reset state when word changes
  useEffect(() => {
    setAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setExplanation('');
    setShowHint(false);
  }, [currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  const getHint = useCallback(() => {
    if (!correctAnswer) return '';
    return correctAnswer.charAt(0) + '...';
  }, [correctAnswer]);

  const handleSubmit = useCallback(async () => {
    if (!question) return;

    // If already submitted, move to next
    if (submitted) {
      if (isLastWord) {
        onComplete();
      } else {
        onNext();
      }
      return;
    }

    if (!answer.trim()) return;

    setIsValidating(true);

    // Validate answer
    let accepted: boolean;
    let explanationText = '';

    if (validateAnswer) {
      const result = await validateAnswer(answer, correctAnswer, {
        word: question.word,
        direction: question.direction,
      });
      accepted = result.accepted;
      explanationText = result.explanation;
    } else if (simpleValidate) {
      accepted = simpleValidate(answer, correctAnswer);
      explanationText = accepted ? 'Exact match' : 'No match';
    } else {
      // Default: case-insensitive trim comparison
      accepted = answer.trim().toLowerCase() === correctAnswer.toLowerCase();
      explanationText = accepted ? 'Exact match' : 'No match';
    }

    setIsValidating(false);
    setSubmitted(true);
    setIsCorrect(accepted);
    setExplanation(explanationText);

    // Shake on incorrect
    if (!accepted) {
      setLocalShake(true);
      shakeTimeoutRef.current = setTimeout(() => setLocalShake(false), 500);
    }

    // Report answer to parent
    onAnswer({
      wordId: question.word.id,
      wordText: question.word.word,
      correctAnswer,
      userAnswer: answer,
      questionType: 'type_it',
      isCorrect: accepted,
      explanation: explanationText,
    });
  }, [
    question,
    answer,
    submitted,
    correctAnswer,
    isLastWord,
    validateAnswer,
    simpleValidate,
    onAnswer,
    onNext,
    onComplete,
  ]);

  if (!question) return null;

  return (
    <div
      className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${
        localShake || showIncorrectShake ? 'animate-shake' : ''
      }`}
    >
      {/* Direction indicator */}
      <span
        className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        {isTargetToNative
          ? t('play.directions.targetToNative', {
              target: targetLanguageName,
              native: nativeLanguageName,
            })
          : t('play.directions.nativeToTarget', {
              native: nativeLanguageName,
              target: targetLanguageName,
            })}
      </span>

      {/* Prompt */}
      <div className="text-center mb-2">
        <h3 className="text-3xl font-black text-[var(--text-primary)]">{prompt}</h3>
        {currentWordStreak > 0 && (
          <div className="mt-2">
            <StreakIndicator streak={currentWordStreak} />
          </div>
        )}
      </div>

      {/* Hint */}
      {showHint && !submitted && (
        <p className="text-center text-[var(--text-secondary)] text-scale-label mb-4">
          {t('play.typeIt.hint')} {getHint()}
        </p>
      )}

      {/* Feedback */}
      {submitted && (
        <div
          className={`text-center mb-4 p-3 rounded-xl ${
            isCorrect
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {isCorrect ? (
            <div>
              <div className="flex items-center justify-center gap-2">
                <ICONS.Check className="w-5 h-5" />
                <span className="font-bold">{t('play.typeIt.correct')}</span>
              </div>
              {explanation && explanation !== 'Exact match' && (
                <p className="text-scale-label mt-1 opacity-80">{explanation}</p>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <ICONS.X className="w-5 h-5" />
                <span className="font-bold">{t('play.typeIt.notQuite')}</span>
              </div>
              <p className="text-scale-label">
                {t('play.typeIt.correctAnswer')}{' '}
                <span className="font-black">{correctAnswer}</span>
              </p>
              {explanation && explanation !== 'No match' && (
                <p className="text-scale-label mt-1 opacity-80">{explanation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="mt-6">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={
            isTargetToNative
              ? t('play.typeIt.typeIn', { language: nativeLanguageName })
              : t('play.typeIt.typeIn', { language: targetLanguageName })
          }
          disabled={submitted || isValidating}
          className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-scale-heading font-medium text-center bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          autoFocus
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {!submitted && (
          <button
            onClick={() => setShowHint(true)}
            className="px-4 py-3 rounded-xl font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] text-scale-label"
            disabled={showHint}
          >
            {showHint ? t('play.typeIt.hintShown') : t('play.typeIt.showHint')}
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={(!answer.trim() && !submitted) || isValidating}
          className="flex-1 py-4 rounded-2xl font-black text-white text-scale-label uppercase tracking-widest disabled:opacity-50 transition-all"
          style={{ backgroundColor: accentColor }}
        >
          {isValidating
            ? t('play.typeIt.checking', 'Checking...')
            : submitted
            ? t('play.typeIt.next')
            : t('play.typeIt.check')}
        </button>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TypeIt;
