import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DictionaryEntry } from '../../../types';
import { shuffleArray } from '../../../utils/array';
import type { AnswerResult } from './types';

interface QuickFireProps {
  /** Full word deck to sample from */
  words: DictionaryEntry[];
  /** Accent color for styling */
  accentColor?: string;
  /** Time limit in seconds (default: 60) */
  timeLimit?: number;
  /** Max words to practice (default: 20) */
  maxWords?: number;
  /** Called when user submits an answer */
  onAnswer: (result: AnswerResult & { explanation?: string }) => void;
  /** Called when game ends (time up or all words done) */
  onComplete: (results: {
    answers: (AnswerResult & { explanation?: string })[];
    score: { correct: number; incorrect: number };
    timeRemaining: number;
  }) => void;
  /** Called when game starts */
  onStart?: () => void;
  /** Validate answer - returns { accepted, explanation } */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    word: DictionaryEntry
  ) => Promise<{ accepted: boolean; explanation: string }>;
  /** Simple validation fallback */
  simpleValidate?: (userAnswer: string, correctAnswer: string) => boolean;
}

type GamePhase = 'ready' | 'playing' | 'finished';
type FeedbackType = 'correct' | 'wrong' | null;

/**
 * Quick Fire game mode - timed translation challenge.
 * Answer as many words as possible before time runs out.
 */
export const QuickFire: React.FC<QuickFireProps> = ({
  words,
  accentColor = '#f59e0b', // amber-500
  timeLimit = 60,
  maxWords = 20,
  onAnswer,
  onComplete,
  onStart,
  validateAnswer,
  simpleValidate,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [gameWords, setGameWords] = useState<DictionaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Refs for timer callback access (avoid stale closures)
  const answersRef = useRef<(AnswerResult & { explanation?: string })[]>([]);
  const scoreRef = useRef({ correct: 0, incorrect: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const currentWord = gameWords[currentIndex];
  const isLastWord = currentIndex >= gameWords.length - 1;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    // Shuffle and take up to maxWords
    const shuffled = shuffleArray([...words]).slice(0, maxWords);
    setGameWords(shuffled);
    setCurrentIndex(0);
    setInput('');
    setTimeLeft(timeLimit);
    setScore({ correct: 0, incorrect: 0 });
    scoreRef.current = { correct: 0, incorrect: 0 };
    answersRef.current = [];
    setPhase('playing');

    onStart?.();

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('finished');
          onComplete({
            answers: answersRef.current,
            score: scoreRef.current,
            timeRemaining: 0,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [words, maxWords, timeLimit, onStart, onComplete]);

  const handleAnswer = useCallback(async () => {
    if (!input.trim() || !currentWord || isValidating) return;

    setIsValidating(true);

    // Validate answer
    let accepted: boolean;
    let explanation = '';

    if (validateAnswer) {
      const result = await validateAnswer(input, currentWord.translation, currentWord);
      accepted = result.accepted;
      explanation = result.explanation;
    } else if (simpleValidate) {
      accepted = simpleValidate(input, currentWord.translation);
      explanation = accepted ? 'Exact match' : 'No match';
    } else {
      // Default: case-insensitive comparison
      accepted = input.trim().toLowerCase() === currentWord.translation.toLowerCase();
      explanation = accepted ? 'Exact match' : 'No match';
    }

    setIsValidating(false);

    // Record answer
    const answerResult: AnswerResult & { explanation?: string } = {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: input,
      questionType: 'type_it',
      isCorrect: accepted,
      explanation,
    };
    answersRef.current = [...answersRef.current, answerResult];
    onAnswer(answerResult);

    // Update score
    const newScore = {
      correct: score.correct + (accepted ? 1 : 0),
      incorrect: score.incorrect + (accepted ? 0 : 1),
    };
    setScore(newScore);
    scoreRef.current = newScore;

    // Show feedback briefly
    setFeedback(accepted ? 'correct' : 'wrong');
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 200);

    // Clear input and advance
    setInput('');

    if (isLastWord) {
      // All words done
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('finished');
      onComplete({
        answers: answersRef.current,
        score: newScore,
        timeRemaining: timeLeft,
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [
    input,
    currentWord,
    isValidating,
    validateAnswer,
    simpleValidate,
    score,
    isLastWord,
    timeLeft,
    onAnswer,
    onComplete,
  ]);

  // Ready screen
  if (phase === 'ready') {
    return (
      <div className="w-full text-center">
        <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-lg border border-[var(--border-color)] max-w-md mx-auto">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
            {t('play.quickFire.title')}
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            {t('play.quickFire.description')}
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-2xl mb-6">
            <p className="text-scale-heading font-bold text-amber-600 dark:text-amber-400">
              🔥 {t('play.quickFire.wordsAvailable', { count: words.length })}
            </p>
            <p className="text-scale-label text-[var(--text-secondary)] mt-1">
              {t('play.quickFire.upTo20')}
            </p>
          </div>
          <button
            onClick={startGame}
            disabled={words.length < 5}
            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-scale-label bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('play.quickFire.start')}
          </button>
          {words.length < 5 && (
            <p className="text-scale-label text-red-500 mt-3">
              {t('play.quickFire.needAtLeast5')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Playing screen
  if (phase === 'playing' && currentWord) {
    return (
      <div
        className={`w-full max-w-md mx-auto transition-colors duration-200 ${
          feedback === 'correct'
            ? 'bg-green-500/20 rounded-3xl'
            : feedback === 'wrong'
            ? 'bg-red-500/20 rounded-3xl'
            : ''
        }`}
      >
        {/* Timer Bar */}
        <div className="h-3 bg-[var(--border-color)] rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft > 30
                ? 'bg-amber-500'
                : timeLeft > 15
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-scale-label font-bold text-[var(--text-secondary)]">
            {currentIndex + 1} / {gameWords.length}
          </span>
          <span
            className={`text-3xl font-black ${
              timeLeft > 10 ? 'text-amber-500' : 'text-red-500 animate-pulse'
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        {/* Word */}
        <div className="bg-amber-50 dark:bg-amber-900/30 p-8 rounded-2xl mb-6 text-center">
          <p className="text-4xl font-black text-amber-600 dark:text-amber-400">
            {currentWord.word}
          </p>
        </div>

        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
          placeholder={t('play.quickFire.typeTranslation')}
          autoFocus
          disabled={isValidating}
          className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-scale-heading font-bold focus:outline-none focus:border-amber-500 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />

        {/* Progress */}
        <div className="mt-4 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / gameWords.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Finished - parent handles results display
  return null;
};

export default QuickFire;
