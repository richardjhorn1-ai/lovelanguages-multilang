'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import { haptics } from '../../../services/haptics';
import type { TutorAnswerResult } from './types';

interface TutorQuickFireProps {
  /** Words to practice */
  words: DictionaryEntry[];
  /** Time limit in seconds (default 60) */
  timeLimit?: number;
  /** Called when user answers */
  onAnswer: (result: TutorAnswerResult) => void;
  /** Called when game completes (time up or all words done) */
  onComplete: (results: {
    answers: TutorAnswerResult[];
    score: { correct: number; incorrect: number };
    timeRemaining: number;
  }) => void;
  /** Called to exit/cancel game */
  onExit: () => void;
  /** Optional smart validation function */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    word: DictionaryEntry
  ) => Promise<{ accepted: boolean; explanation: string }>;
}

/**
 * TutorQuickFire - Timed quick-fire game mode for tutor/partner practice.
 * Self-contained: manages timer, answers, and completion internally.
 */
export const TutorQuickFire: React.FC<TutorQuickFireProps> = ({
  words,
  timeLimit = 60,
  onAnswer,
  onComplete,
  onExit,
  validateAnswer,
}) => {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [answers, setAnswers] = useState<TutorAnswerResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const answersRef = useRef(answers);
  const scoreRef = useRef(score);

  // Keep refs updated
  useEffect(() => {
    answersRef.current = answers;
    scoreRef.current = score;
  }, [answers, score]);

  const currentWord = words[currentIndex];
  const isComplete = currentIndex >= words.length || timeLeft <= 0;

  // Timer effect
  useEffect(() => {
    if (!started || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, isComplete]);

  // Handle completion
  useEffect(() => {
    if (started && isComplete) {
      onComplete({
        answers: answersRef.current,
        score: scoreRef.current,
        timeRemaining: timeLeft,
      });
    }
  }, [started, isComplete, timeLeft, onComplete]);

  const handleAnswer = useCallback(async () => {
    if (!input.trim() || !currentWord || isValidating) return;

    setIsValidating(true);

    let isCorrect: boolean;
    let explanation = '';

    if (validateAnswer) {
      const result = await validateAnswer(input, currentWord.translation, currentWord);
      isCorrect = result.accepted;
      explanation = result.explanation;
    } else {
      isCorrect = input.trim().toLowerCase() === currentWord.translation.toLowerCase();
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    setIsValidating(false);
    haptics.trigger(isCorrect ? 'correct' : 'incorrect');

    const result: TutorAnswerResult = {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: input,
      questionType: 'quick_fire',
      isCorrect,
      explanation,
    };

    setAnswers(prev => [...prev, result]);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    onAnswer(result);

    setInput('');
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [input, currentWord, isValidating, validateAnswer, currentIndex, words.length, onAnswer]);

  // Start screen
  if (!started) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl text-center max-w-sm w-full">
          <div className="mb-4"><ICONS.Zap className="w-16 h-16 text-[var(--accent-color)] mx-auto" /></div>
          <h2 className="text-2xl font-black font-header text-[var(--text-primary)] mb-2">
            {t('tutorGames.quickFireGame.title')}
          </h2>
          <p className="text-[var(--text-secondary)] text-scale-body mb-6">
            {t('tutorGames.quickFireGame.description')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onExit}
              className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
            >
              {t('tutorGames.quickFireGame.cancel')}
            </button>
            <button
              onClick={() => setStarted(true)}
              className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)]"
            >
              {t('tutorGames.quickFireGame.start')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game complete - parent handles results screen
  if (isComplete) {
    return null;
  }

  // Active game
  return (
    <div className="h-full flex flex-col p-4">
      <div className="max-w-md mx-auto w-full">
        {/* Timer Bar */}
        <div className="h-3 bg-[var(--bg-primary)] rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft > 20 ? 'bg-[var(--color-warning)]' :
              timeLeft > 10 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-incorrect)]'
            }`}
            style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <span className="text-scale-label font-bold text-[var(--text-secondary)]">
            {currentIndex + 1} / {words.length}
          </span>
          <span className={`text-3xl font-black ${timeLeft <= 10 ? 'text-[var(--color-incorrect)] animate-pulse' : 'text-[var(--color-warning)]'}`}>
            {timeLeft}s
          </span>
        </div>

        {/* Word */}
        <div className="bg-[var(--accent-light)] p-8 rounded-2xl mb-6 text-center">
          <p className="text-4xl font-black text-[var(--accent-color)]">
            {currentWord?.word}
          </p>
        </div>

        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnswer()}
          placeholder={t('tutorGames.quickFireGame.typeTranslation')}
          disabled={isValidating}
          autoFocus
          className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-scale-heading font-bold focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />

        {/* Score */}
        <div className="mt-4 flex justify-center gap-6">
          <span className="text-[var(--color-correct)] font-bold">✓ {score.correct}</span>
          <span className="text-[var(--color-incorrect)] font-bold">✗ {score.incorrect}</span>
        </div>
      </div>
    </div>
  );
};

export default TutorQuickFire;
