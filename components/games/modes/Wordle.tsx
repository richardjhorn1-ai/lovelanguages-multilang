import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DictionaryEntry } from '../../../types';
import { haptics } from '../../../services/haptics';
import { shuffleArray } from '../../../utils/array';
import { GameStage } from '../components';
import type { AnswerResult } from './types';

interface WordleProps {
  words: DictionaryEntry[];
  targetLanguage: string;
  accentColor?: string;
  targetLanguageName: string;
  nativeLanguageName: string;
  maxRounds?: number;
  maxAttempts?: number;
  onAnswer: (result: AnswerResult) => void;
  onComplete: (results: {
    answers: AnswerResult[];
    score: { correct: number; incorrect: number };
  }) => void;
  onStart?: () => void;
}

type LetterState = 'correct' | 'present' | 'absent';

interface GuessRow {
  guess: string;
  states: LetterState[];
}

const toLocaleLower = (value: string, locale: string) => {
  try {
    return value.toLocaleLowerCase(locale);
  } catch {
    return value.toLocaleLowerCase();
  }
};

const getNormalizedLetterArray = (value: string, locale: string) => {
  try {
    return Array.from(value.trim().normalize('NFC'))
      .filter((char) => /\p{L}/u.test(char))
      .map((char) => char.toLocaleLowerCase(locale));
  } catch {
    return Array.from(value.trim().normalize('NFC'))
      .filter((char) => /\p{L}/u.test(char))
      .map((char) => char.toLocaleLowerCase());
  }
};

const normalizeWordForLocale = (value: string, locale: string) => toLocaleLower(value.trim().normalize('NFC'), locale);

const isEligibleWord = (entry: DictionaryEntry, locale: string) => {
  const normalized = entry.word.trim().normalize('NFC');
  if (!/^\p{L}+$/u.test(normalized)) return false;

  const letters = getNormalizedLetterArray(normalized, locale);
  return letters.length >= 4 && letters.length <= 8;
};

const scoreWordCandidate = (entry: DictionaryEntry, locale: string) => {
  const letters = getNormalizedLetterArray(entry.word, locale);
  const uniqueLetters = new Set(letters).size;
  const repeatPenalty = letters.length - uniqueLetters;
  const lengthBonus = 6 - Math.abs(5 - letters.length);
  return uniqueLetters * 4 + lengthBonus - repeatPenalty * 2;
};

const buildGuessStates = (guess: string[], answer: string[]): LetterState[] => {
  const states: LetterState[] = Array(guess.length).fill('absent');
  const remaining = new Map<string, number>();

  answer.forEach((letter, index) => {
    if (guess[index] === letter) {
      states[index] = 'correct';
    } else {
      remaining.set(letter, (remaining.get(letter) || 0) + 1);
    }
  });

  guess.forEach((letter, index) => {
    if (states[index] === 'correct') return;
    const count = remaining.get(letter) || 0;
    if (count > 0) {
      states[index] = 'present';
      remaining.set(letter, count - 1);
    }
  });

  return states;
};

export const Wordle: React.FC<WordleProps> = ({
  words,
  targetLanguage,
  accentColor = '#f97316',
  targetLanguageName,
  nativeLanguageName,
  maxRounds = 5,
  maxAttempts = 3,
  onAnswer,
  onComplete,
  onStart,
}) => {
  const { t } = useTranslation();
  const eligibleWords = useMemo(() => {
    const seen = new Set<string>();

    return words
      .filter((entry) => {
        if (!isEligibleWord(entry, targetLanguage)) return false;
        const key = normalizeWordForLocale(entry.word, targetLanguage);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => scoreWordCandidate(b, targetLanguage) - scoreWordCandidate(a, targetLanguage));
  }, [targetLanguage, words]);
  const [sessionWords, setSessionWords] = useState<DictionaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessRows, setGuessRows] = useState<GuessRow[]>([]);
  const [input, setInput] = useState('');
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const answersRef = useRef<AnswerResult[]>([]);
  const scoreRef = useRef({ correct: 0, incorrect: 0 });
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onCompleteRef = useRef(onComplete);
  const onAnswerRef = useRef(onAnswer);

  const currentWord = sessionWords[currentIndex];
  const currentAnswerLetters = useMemo(
    () => (currentWord ? getNormalizedLetterArray(currentWord.word, targetLanguage) : []),
    [currentWord, targetLanguage]
  );
  const isLastRound = currentIndex >= sessionWords.length - 1;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    const poolSize = Math.min(eligibleWords.length, Math.max(maxRounds * 3, maxRounds));
    const selected = shuffleArray([...eligibleWords.slice(0, poolSize)]).slice(0, Math.min(maxRounds, eligibleWords.length));
    setSessionWords(selected);
    setCurrentIndex(0);
    setGuessRows([]);
    setInput('');
    setRevealedAnswer(null);
    setFeedback(null);
    answersRef.current = [];
    scoreRef.current = { correct: 0, incorrect: 0 };
    onStart?.();
  }, [eligibleWords, maxRounds, onStart]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const advanceRound = useCallback(() => {
    setGuessRows([]);
    setInput('');
    setRevealedAnswer(null);
    setFeedback(null);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const finishRound = useCallback((guess: string, isCorrect: boolean) => {
    if (!currentWord) return;

    const answerResult: AnswerResult = {
      wordId: currentWord.id,
      wordText: currentWord.translation,
      correctAnswer: currentWord.word,
      userAnswer: guess,
      questionType: 'type_it',
      isCorrect,
    };

    const nextAnswers = [...answersRef.current, answerResult];
    const nextScore = {
      correct: scoreRef.current.correct + (isCorrect ? 1 : 0),
      incorrect: scoreRef.current.incorrect + (isCorrect ? 0 : 1),
    };

    answersRef.current = nextAnswers;
    scoreRef.current = nextScore;
    onAnswerRef.current(answerResult);
    setRevealedAnswer(currentWord.word);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (!isCorrect) {
      haptics.trigger('incorrect');
    }

    if (isLastRound) {
      completionTimeoutRef.current = setTimeout(() => {
        onCompleteRef.current({
          answers: nextAnswers,
          score: nextScore,
        });
      }, 900);
      return;
    }

    advanceTimeoutRef.current = setTimeout(() => {
      advanceRound();
    }, 900);
  }, [advanceRound, currentWord, isLastRound]);

  const submitGuess = useCallback(() => {
    if (!currentWord || !currentAnswerLetters.length) return;

    const normalizedGuess = getNormalizedLetterArray(input, targetLanguage);
    if (normalizedGuess.length !== currentAnswerLetters.length) return;

    const guessString = normalizedGuess.join('');
    const answerString = currentAnswerLetters.join('');
    const states = buildGuessStates(normalizedGuess, currentAnswerLetters);
    const nextRows = [...guessRows, { guess: guessString, states }];
    setGuessRows(nextRows);
    setInput('');

    const isCorrect = guessString === answerString;
    if (isCorrect || nextRows.length >= maxAttempts) {
      finishRound(guessString, isCorrect);
    }
  }, [currentWord, currentAnswerLetters, input, guessRows, maxAttempts, finishRound]);

  const currentLength = currentAnswerLetters.length;
  const remainingAttempts = Math.max(maxAttempts - guessRows.length, 0);
  const visibleRows = useMemo(() => {
    const rows = [...guessRows];
    while (rows.length < maxAttempts) {
      const preview = rows.length === guessRows.length && !revealedAnswer
        ? getNormalizedLetterArray(input, targetLanguage).slice(0, currentLength).join('')
        : '';
      rows.push({ guess: preview, states: [] });
    }
    return rows;
  }, [currentLength, guessRows, input, maxAttempts, revealedAnswer]);

  if (eligibleWords.length === 0) {
    return (
        <GameStage
        tone="blend"
        layout="compact"
        eyebrow={t('play.hub.spellEyebrow')}
        title={t('play.games.wordle')}
        className="max-w-xl mx-auto"
      >
        <p className="text-sm md:text-base text-[var(--text-secondary)]">
          {t('play.wordle.needEligibleWords')}
        </p>
      </GameStage>
    );
  }

  if (!currentWord) return null;

  return (
    <GameStage
      tone="blend"
      layout="compact"
      eyebrow={t('play.hub.spellEyebrow')}
      title={t('play.games.wordle')}
      className="max-w-2xl mx-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center rounded-full px-3 py-1.5 bg-white/80 border text-scale-caption font-bold" style={{ borderColor: 'var(--game-accent-border)', color: 'var(--game-accent-deep)' }}>
          {currentIndex + 1} / {sessionWords.length}
        </span>
        <span className="text-scale-caption text-[var(--text-secondary)]">
          {t('play.wordle.attemptsLeft', { count: remainingAttempts })}
        </span>
      </div>

      <div
        className="rounded-[24px] border p-4 md:p-5 mb-5"
          style={{
            background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--game-accent-soft) 46%, transparent), transparent 42%), linear-gradient(145deg, rgba(255,255,255,0.94), color-mix(in srgb, var(--game-accent-soft) 22%, white))',
          borderColor: 'var(--game-accent-border)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--game-accent-deep)]">
            {t('play.wordle.clueLabel', { language: nativeLanguageName })}
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] bg-white/80 border" style={{ borderColor: 'var(--game-accent-border)', color: 'var(--game-accent-deep)' }}>
            {currentLength} {t('play.wordle.letters')}
          </span>
        </div>
        <h3 className="text-2xl md:text-3xl font-black font-header text-[var(--text-primary)] leading-tight">
          {currentWord.translation}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-5">
        {visibleRows.map((row, rowIndex) => {
          const letters = Array.from({ length: currentLength }, (_, index) => row.guess[index] || '');
          return (
            <div key={`${rowIndex}-${row.guess}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${currentLength}, minmax(0, 1fr))` }}>
              {letters.map((letter, letterIndex) => {
                const state = row.states[letterIndex];
                const surfaceStyle =
                  state === 'correct'
                    ? {
                        background: 'linear-gradient(145deg, var(--color-correct), color-mix(in srgb, var(--color-correct) 72%, black))',
                        borderColor: 'var(--color-correct)',
                        color: '#ffffff',
                      }
                    : state === 'present'
                      ? {
                          background: 'linear-gradient(145deg, var(--color-warning), color-mix(in srgb, var(--color-warning) 72%, black))',
                          borderColor: 'var(--color-warning)',
                          color: '#ffffff',
                        }
                      : row.states.length > 0
                        ? {
                            background: 'rgba(41, 47, 54, 0.08)',
                            borderColor: 'rgba(41, 47, 54, 0.08)',
                            color: 'var(--text-primary)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.72)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          };

                return (
                  <div
                    key={`${rowIndex}-${letterIndex}`}
                    className="aspect-square rounded-[18px] border-2 flex items-center justify-center text-lg md:text-xl font-black uppercase shadow-[0_14px_28px_-24px_rgba(41,47,54,0.25)]"
                    style={surfaceStyle}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {revealedAnswer && (
        <div
          className={`rounded-[22px] p-4 mb-4 border ${
            feedback === 'correct'
              ? 'bg-[var(--color-correct-bg)] border-[var(--color-correct)]/30 text-[var(--color-correct)]'
              : 'bg-[var(--color-incorrect-bg)] border-[var(--color-incorrect)]/30 text-[var(--color-incorrect)]'
          }`}
        >
          <p className="font-bold">
            {feedback === 'correct'
              ? t('play.wordle.correctReveal', {
                  word: revealedAnswer,
                })
              : t('play.wordle.incorrectReveal', {
                  word: revealedAnswer,
                })}
          </p>
        </div>
      )}

      {!revealedAnswer && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(event) => {
              const nextLetters = getNormalizedLetterArray(event.target.value, targetLanguage).slice(0, currentLength).join('');
              setInput(nextLetters);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitGuess();
            }}
            className="flex-1 p-4 border-2 rounded-[22px] bg-white/86 text-[var(--text-primary)] text-center text-lg md:text-xl font-black uppercase tracking-[0.14em] focus:outline-none"
            style={{ borderColor: 'var(--game-accent-border)' }}
            placeholder={t('play.wordle.inputPlaceholder', {
              language: targetLanguageName,
            })}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={submitGuess}
            disabled={getNormalizedLetterArray(input, targetLanguage).length !== currentLength}
            className="sm:min-w-[10rem] px-5 py-4 rounded-[22px] text-white font-black uppercase tracking-[0.18em] disabled:opacity-45 disabled:cursor-not-allowed transition-all"
            style={{
              background: 'linear-gradient(145deg, var(--game-accent-color), var(--game-accent-deep))',
              boxShadow: '0 22px 40px -24px var(--game-accent-shadow)',
            }}
          >
            {t('play.wordle.submit')}
          </button>
        </div>
      )}
    </GameStage>
  );
};

export default Wordle;
