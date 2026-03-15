import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import { shuffleArray } from '../../../utils/array';
import { isCorrectAnswer } from '../../../utils/answer-helpers';
import { speak } from '../../../services/audio';
import { haptics } from '../../../services/haptics';
import { GameStage } from '../components';
import type { AnswerResult } from './types';

interface QuickFireProps {
  /** Full word deck to sample from */
  words: DictionaryEntry[];
  /** Target language code for TTS */
  targetLanguage: string;
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
  targetLanguage,
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
  const lastHapticRef = useRef<number>(0);

  // Refs for callbacks to avoid stale closures in timer/handlers
  const onCompleteRef = useRef(onComplete);
  const onAnswerRef = useRef(onAnswer);

  const currentWord = gameWords[currentIndex];
  const isLastWord = currentIndex >= gameWords.length - 1;

  // Keep callback refs current
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

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
          // Use ref to avoid stale closure
          onCompleteRef.current({
            answers: answersRef.current,
            score: scoreRef.current,
            timeRemaining: 0,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [words, maxWords, timeLimit, onStart]); // Removed onComplete - using ref

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
      explanation = '';
    } else {
      // Default: diacritic-normalized comparison
      accepted = isCorrectAnswer(input, currentWord.translation);
      explanation = '';
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
    onAnswerRef.current(answerResult); // Use ref to avoid stale closure

    // Update score (use ref to avoid stale state with rapid answers)
    const newScore = {
      correct: scoreRef.current.correct + (accepted ? 1 : 0),
      incorrect: scoreRef.current.incorrect + (accepted ? 0 : 1),
    };
    setScore(newScore);
    scoreRef.current = newScore;

    // Haptic + visual feedback — throttled to 300ms to prevent continuous buzz on rapid taps
    const now = Date.now();
    if (now - lastHapticRef.current >= 300) {
      haptics.trigger(accepted ? 'correct' : 'incorrect');
      lastHapticRef.current = now;
    }
    setFeedback(accepted ? 'correct' : 'wrong');
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 500);

    // Clear input and advance
    setInput('');

    if (isLastWord) {
      // All words done
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('finished');
      onCompleteRef.current({
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
    isLastWord,
    timeLeft,
  ]); // Removed score, onAnswer, onComplete - using refs

  // Ready screen
  if (phase === 'ready') {
    return (
      <GameStage
        tone="blend"
        eyebrow={t('play.hub.intensityEyebrow')}
        title={t('play.quickFire.title')}
        description={t('play.quickFire.description')}
        className="max-w-xl mx-auto text-center"
      >
        <div
          className="rounded-[28px] p-6 md:p-8 border"
          style={{
            background:
              'radial-gradient(circle at top left, color-mix(in srgb, var(--game-accent-soft) 48%, transparent), transparent 42%), linear-gradient(145deg, rgba(255,255,255,0.94), color-mix(in srgb, var(--game-accent-soft) 24%, white))',
            borderColor: 'var(--game-accent-border)',
          }}
        >
          <div
            className="w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 mx-auto mb-5 rounded-[28px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, var(--game-accent-color), var(--game-accent-deep))',
              boxShadow: '0 20px 40px -24px var(--game-accent-shadow)',
            }}
          >
            <ICONS.Zap className="w-9 h-9 md:w-10 md:h-10 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/82 border font-black text-sm mb-6" style={{ borderColor: 'var(--game-accent-border)', color: 'var(--game-accent-deep)' }}>
            <ICONS.Zap className="w-4 h-4" />
            {t('play.quickFire.wordsAvailable', { count: words.length })}
          </div>
          <p className="text-scale-label text-[var(--text-secondary)] mb-6">
            {t('play.quickFire.upTo20')}
          </p>
          <button
            onClick={startGame}
            disabled={words.length < 5}
            className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-scale-label disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              background: 'linear-gradient(145deg, var(--game-accent-color), var(--game-accent-deep))',
              boxShadow: '0 22px 42px -24px var(--game-accent-shadow)',
            }}
          >
            {t('play.quickFire.start')}
          </button>
          {words.length < 5 && (
            <p className="text-scale-label text-[var(--color-incorrect)] mt-3">
              {t('play.quickFire.needAtLeast5')}
            </p>
          )}
        </div>
      </GameStage>
    );
  }

  // Playing screen
  if (phase === 'playing' && currentWord) {
    return (
      <GameStage
        tone="blend"
        eyebrow={t('play.hub.fastBadge')}
        title={t('play.games.quickFire')}
        layout="compact"
        className={`w-full max-w-xl mx-auto transition-colors duration-200 ${
          feedback === 'correct'
            ? 'bg-[var(--color-correct-bg)] animate-correct-glow'
            : feedback === 'wrong'
            ? 'bg-[var(--color-incorrect-bg)] animate-incorrect-flash'
            : ''
        }`}
      >
        {/* Timer Bar */}
        <div className="h-3 bg-[var(--border-color)]/60 rounded-full mb-5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft > 30
                ? 'bg-[var(--game-accent-color)]'
                : timeLeft > 15
                ? 'bg-[var(--color-warning)]'
                : 'bg-[var(--color-incorrect)]'
            }`}
            style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="inline-flex items-center rounded-full px-3 py-1.5 bg-white/75 border text-scale-label font-bold" style={{ borderColor: 'var(--game-accent-border)', color: 'var(--game-accent-deep)' }}>
            {currentIndex + 1} / {gameWords.length}
          </span>
          <span
            className={`text-3xl md:text-4xl font-black font-header ${
              timeLeft > 10 ? 'text-[var(--game-accent-color)]' : 'text-red-500 animate-pulse'
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        {/* Word */}
        <div
          className="p-8 rounded-[28px] mb-6 text-center border"
          style={{
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--game-accent-soft) 48%, transparent), transparent 42%), linear-gradient(145deg, rgba(255,255,255,0.95), color-mix(in srgb, var(--game-accent-soft) 28%, white))',
            borderColor: 'var(--game-accent-border)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <p className="text-4xl md:text-5xl font-black font-header text-[var(--game-accent-deep)] tracking-tight">
              {currentWord.word}
            </p>
            <button
              onClick={() => speak(currentWord.word, targetLanguage)}
              className="p-3 rounded-full border bg-white/82 hover:bg-white transition-colors"
              style={{ borderColor: 'var(--game-accent-border)' }}
              title={t('play.flashcard.listen')}
            >
              <ICONS.Volume2 className="w-6 h-6 text-[var(--game-accent-deep)]" />
            </button>
          </div>
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
          className="w-full p-4 border-2 rounded-[24px] text-center text-scale-heading font-bold focus:outline-none bg-white/86 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          style={{ borderColor: 'var(--game-accent-border)' }}
        />

        {/* Progress */}
        <div className="mt-4 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--game-accent-color)] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / gameWords.length) * 100}%` }}
          />
        </div>
      </GameStage>
    );
  }

  // Finished - parent handles results display
  return null;
};

export default QuickFire;
