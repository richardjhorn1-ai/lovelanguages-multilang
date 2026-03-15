import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import { shuffleArray } from '../../../utils/array';
import { haptics } from '../../../services/haptics';
import { speak } from '../../../services/audio';
import { GameStage } from '../components';
import type { AnswerResult } from './types';

type MatchLength = 10 | 20 | 'all';
type MatchPhase = 'ready' | 'playing' | 'finished';

interface SpeedMatchProps {
  words: DictionaryEntry[];
  targetLanguage: string;
  targetLanguageName: string;
  nativeLanguageName: string;
  accentColor?: string;
  onAnswer: (result: AnswerResult) => void;
  onComplete: (results: {
    answers: AnswerResult[];
    score: { correct: number; incorrect: number };
    totalWords: number;
    elapsedMs: number;
  }) => void;
  onStart?: (totalWords: number) => void;
  onProgress?: (completed: number, total: number) => void;
}

const formatElapsed = (elapsedMs: number) => {
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const centiseconds = Math.floor((elapsedMs % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
};

export const SpeedMatch: React.FC<SpeedMatchProps> = ({
  words,
  targetLanguage,
  targetLanguageName,
  nativeLanguageName,
  accentColor = '#f97316',
  onAnswer,
  onComplete,
  onStart,
  onProgress,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<MatchPhase>('ready');
  const [matchLength, setMatchLength] = useState<MatchLength>(10);
  const [sessionWords, setSessionWords] = useState<DictionaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [localShake, setLocalShake] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<number>(0);
  const answersRef = useRef<AnswerResult[]>([]);
  const scoreRef = useRef({ correct: 0, incorrect: 0 });
  const onAnswerRef = useRef(onAnswer);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentWord = sessionWords[currentIndex];
  const currentOptions = useMemo(() => {
    if (!currentWord) return [];
    const otherTranslations = words
      .filter((entry) => entry.id !== currentWord.id)
      .map((entry) => entry.translation);
    return shuffleArray([currentWord.translation, ...shuffleArray(otherTranslations).slice(0, 3)]);
  }, [currentWord, words]);

  const selectedWordCount = matchLength === 'all' ? words.length : Math.min(matchLength, words.length);

  const startGame = useCallback(() => {
    const totalWords = matchLength === 'all' ? words.length : Math.min(matchLength, words.length);
    const nextWords = shuffleArray([...words]).slice(0, totalWords);
    setSessionWords(nextWords);
    setCurrentIndex(0);
    setElapsedMs(0);
    setSelectedOption(null);
    setFeedback(null);
    setLocalShake(false);
    answersRef.current = [];
    scoreRef.current = { correct: 0, incorrect: 0 };
    onProgressRef.current?.(0, Math.max(totalWords, 1));
    onStart?.(Math.max(totalWords, 1));
    setPhase('playing');

    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 50);
  }, [matchLength, onStart, words]);

  const finishGame = useCallback((totalWords: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalElapsed = Date.now() - startTimeRef.current;
    setElapsedMs(finalElapsed);
    setPhase('finished');
    onCompleteRef.current({
      answers: answersRef.current,
      score: scoreRef.current,
      totalWords,
      elapsedMs: finalElapsed,
    });
  }, []);

  const handleSelect = useCallback((option: string) => {
    if (!currentWord || feedback) return;

    const isCorrect = option === currentWord.translation;
    setSelectedOption(option);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    const result: AnswerResult = {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect,
    };

    answersRef.current = [...answersRef.current, result];
    scoreRef.current = {
      correct: scoreRef.current.correct + (isCorrect ? 1 : 0),
      incorrect: scoreRef.current.incorrect + (isCorrect ? 0 : 1),
    };
    onAnswerRef.current(result);

    if (!isCorrect) {
      haptics.trigger('incorrect');
      setLocalShake(true);
      window.setTimeout(() => {
        setLocalShake(false);
        setFeedback(null);
        setSelectedOption(null);
      }, 360);
      return;
    }

    haptics.trigger('correct');
    const completedWords = currentIndex + 1;
    const totalWords = sessionWords.length;
    onProgressRef.current?.(completedWords, Math.max(totalWords, 1));

    window.setTimeout(() => {
      if (completedWords >= totalWords) {
        finishGame(totalWords);
        return;
      }
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    }, 220);
  }, [currentIndex, currentWord, feedback, finishGame, sessionWords.length]);

  if (phase === 'ready') {
    return (
      <GameStage
        tone="bright"
        eyebrow={t('play.hub.fastBadge')}
        title={t('play.games.speedMatch')}
        description={t('play.speedMatch.description')}
        className="max-w-xl mx-auto"
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([10, 20, 'all'] as MatchLength[]).map((option) => {
            const actualCount = option === 'all' ? words.length : Math.min(option, words.length);
            const isSelected = matchLength === option;
            return (
              <button
                key={option}
                onClick={() => setMatchLength(option)}
                className={`rounded-[22px] border-2 p-4 text-center transition-all ${
                  isSelected
                    ? 'border-[var(--game-accent-color)] bg-[var(--game-accent-soft)]'
                    : 'border-[var(--border-color)] bg-white/75 hover:border-[var(--game-accent-color)]/50'
                }`}
              >
                <div className="text-2xl font-black font-header text-[var(--text-primary)]">{actualCount}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  {option === 'all' ? t('play.speedMatch.allLabel') : t('play.speedMatch.wordsLabel')}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[24px] border p-5 mb-5 bg-white/72" style={{ borderColor: 'var(--game-accent-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(145deg, var(--game-accent-color), var(--game-accent-deep))' }}>
              <ICONS.Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{t('play.speedMatch.howItWorksTitle')}</p>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('play.speedMatch.howItWorksCopy')}</p>
            </div>
          </div>
          <p className="text-scale-caption text-[var(--text-secondary)]">
            {t('play.speedMatch.readyMeta', {
              count: selectedWordCount,
              target: targetLanguageName,
              native: nativeLanguageName,
            })}
          </p>
        </div>

        <button
          onClick={startGame}
          disabled={words.length < 4}
          className="w-full py-4 rounded-[22px] text-white font-black uppercase tracking-[0.18em] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(145deg, var(--game-accent-color), var(--game-accent-deep))',
            boxShadow: '0 22px 40px -24px var(--game-accent-shadow)',
          }}
        >
          {t('play.speedMatch.start')}
        </button>

        {words.length < 4 && (
          <p className="text-scale-caption text-[var(--color-incorrect)] mt-3 text-center">
            {t('play.speedMatch.needAtLeast4')}
          </p>
        )}
      </GameStage>
    );
  }

  if (phase === 'playing' && currentWord) {
    return (
      <GameStage
        tone="bright"
        layout="compact"
        eyebrow={t('play.hub.fastBadge')}
        title={t('play.games.speedMatch')}
        className={`max-w-2xl mx-auto ${localShake ? 'animate-shake' : ''}`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center rounded-full px-3 py-1.5 bg-white/80 border text-scale-caption font-bold" style={{ borderColor: 'var(--game-accent-border)', color: 'var(--game-accent-deep)' }}>
            {currentIndex + 1} / {sessionWords.length}
          </span>
          <span className="text-xl md:text-2xl font-black font-header text-[var(--game-accent-deep)]">
            {formatElapsed(elapsedMs)}
          </span>
        </div>

        <div
          className="rounded-[24px] border p-5 md:p-6 mb-5"
          style={{
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--game-accent-soft) 46%, transparent), transparent 42%), linear-gradient(145deg, rgba(255,255,255,0.95), color-mix(in srgb, var(--game-accent-soft) 24%, white))',
            borderColor: 'var(--game-accent-border)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--game-accent-deep)]">
              {t('play.directions.targetToNative', {
                target: targetLanguageName,
                native: nativeLanguageName,
              })}
            </span>
            <button
              onClick={() => speak(currentWord.word, targetLanguage)}
              className="p-2 rounded-full border bg-white/82 hover:bg-white transition-colors"
              style={{ borderColor: 'var(--game-accent-border)' }}
              title={t('play.flashcard.listen')}
            >
              <ICONS.Volume2 className="w-5 h-5 text-[var(--game-accent-deep)]" />
            </button>
          </div>
          <h3 className="text-3xl md:text-4xl font-black font-header text-[var(--text-primary)] tracking-tight">
            {currentWord.word}
          </h3>
        </div>

        <div className="grid gap-3">
          {currentOptions.map((option, index) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentWord.translation;
            const buttonStyle = feedback
              ? feedback === 'correct' && isCorrect
                ? 'border-[var(--color-correct)] bg-[var(--color-correct-bg)] text-[var(--color-correct)]'
                : feedback === 'incorrect' && isSelected
                  ? 'border-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)] text-[var(--color-incorrect)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] bg-white/55'
              : 'border-[var(--border-color)] hover:border-[var(--game-accent-color)]/60 text-[var(--text-primary)] bg-white/82';

            return (
              <button
                key={`${option}-${index}`}
                onClick={() => handleSelect(option)}
                disabled={!!feedback}
                className={`w-full rounded-[22px] border-2 p-4 text-left font-bold transition-all shadow-[0_16px_34px_-28px_rgba(41,47,54,0.24)] ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-black"
                    style={{
                      background: 'linear-gradient(145deg, color-mix(in srgb, var(--game-accent-soft) 54%, white), white)',
                      color: 'var(--game-accent-deep)',
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </GameStage>
    );
  }

  return null;
};

export default SpeedMatch;
