'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import { haptics } from '../../../services/haptics';
import { isCorrectAnswer } from '../../../utils/answer-helpers';
import type { TutorAnswerResult } from './types';

interface TutorTypeItProps {
  /** Words to practice */
  words: DictionaryEntry[];
  /** Current word index */
  currentIndex: number;
  /** Current score */
  score: { correct: number; incorrect: number };
  /** Target language name */
  targetLanguageName: string;
  /** Native language name */
  nativeLanguageName: string;
  /** Called when user submits answer */
  onAnswer: (result: TutorAnswerResult, isCorrect: boolean) => void;
  /** Called when user clicks Next after feedback */
  onNext: () => void;
  /** Called to exit game */
  onExit: () => void;
  /** Optional smart validation function */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    word: DictionaryEntry
  ) => Promise<{ accepted: boolean; explanation: string }>;
}

/**
 * TutorTypeIt - Type-in answer game mode for tutor/partner practice.
 */
export const TutorTypeIt: React.FC<TutorTypeItProps> = ({
  words,
  currentIndex,
  score,
  targetLanguageName,
  nativeLanguageName,
  onAnswer,
  onNext,
  onExit,
  validateAnswer,
}) => {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const currentWord = words[currentIndex];

  // Reset state when word changes
  useEffect(() => {
    setAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setExplanation('');
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    if (!currentWord) return;

    // If already submitted, move to next
    if (submitted) {
      onNext();
      return;
    }

    if (!answer.trim() || isValidating) return;

    setIsValidating(true);

    let correct: boolean;
    let exp = '';

    if (validateAnswer) {
      const result = await validateAnswer(answer, currentWord.translation, currentWord);
      correct = result.accepted;
      exp = result.explanation;
    } else {
      // Diacritic-normalized comparison
      correct = isCorrectAnswer(answer, currentWord.translation);
      exp = correct ? 'Exact match' : 'No match';
    }

    setIsValidating(false);
    setSubmitted(true);
    setIsCorrect(correct);
    setExplanation(exp);
    haptics.trigger(correct ? 'correct' : 'incorrect');

    onAnswer({
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: answer,
      questionType: 'type_it',
      isCorrect: correct,
      explanation: exp,
    }, correct);
  }, [currentWord, submitted, answer, isValidating, validateAnswer, onAnswer, onNext]);

  if (!currentWord) return null;

  return (
    <div className="h-full flex flex-col p-4">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <span className="text-scale-label font-bold text-[var(--text-secondary)]">
            {currentIndex + 1} / {words.length}
          </span>
          <div className="flex gap-2">
            <span className="text-[var(--color-correct)] font-bold">{score.correct}</span>
            <span className="text-[var(--text-secondary)]">/</span>
            <span className="text-[var(--color-incorrect)] font-bold">{score.incorrect}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-[var(--bg-primary)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-[var(--accent-color)] transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="glass-card rounded-2xl p-8">
          <span className="text-scale-micro font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6 bg-[var(--accent-light)] text-[var(--accent-color)]">
            {targetLanguageName} → {nativeLanguageName}
          </span>

          <h3 className="text-3xl font-black font-header text-[var(--text-primary)] mb-2 text-center">
            {currentWord.word}
          </h3>

          {submitted && (
            <div className={`text-center mb-4 p-3 rounded-xl ${
              isCorrect
                ? 'bg-[var(--color-correct-bg)] border border-[var(--color-correct)] text-[var(--color-correct)]'
                : 'bg-[var(--color-incorrect-bg)] border border-[var(--color-incorrect)] text-[var(--color-incorrect)]'
            }`}>
              {isCorrect ? (
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <ICONS.Check className="w-5 h-5" />
                    <span className="font-bold">{t('tutorGames.typeItGame.correct')}</span>
                  </div>
                  {explanation && explanation !== 'Exact match' && (
                    <p className="text-scale-label mt-1 opacity-80">{explanation}</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ICONS.X className="w-5 h-5" />
                    <span className="font-bold">{t('tutorGames.typeItGame.notQuite')}</span>
                  </div>
                  <p className="text-scale-label">
                    {t('tutorGames.typeItGame.correctAnswer', { answer: currentWord.translation })}
                  </p>
                  {explanation && explanation !== 'No match' && (
                    <p className="text-scale-label mt-1 opacity-80">{explanation}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('tutorGames.typeItGame.typeIn', { language: nativeLanguageName })}
              disabled={submitted || isValidating}
              className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-scale-heading font-medium text-center bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!answer.trim() && !submitted) || isValidating}
            className="w-full mt-6 py-4 rounded-2xl font-black text-white text-scale-label uppercase tracking-widest disabled:opacity-50 transition-all bg-[var(--accent-color)] hover:bg-[var(--accent-hover)]"
          >
            {isValidating
              ? t('tutorGames.typeItGame.checking', 'Checking...')
              : submitted
              ? t('tutorGames.typeItGame.next')
              : t('tutorGames.typeItGame.check')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorTypeIt;
