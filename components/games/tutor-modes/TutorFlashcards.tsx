'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import type { TutorAnswerResult } from './types';

interface TutorFlashcardsProps {
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
  /** Called when user answers */
  onAnswer: (result: TutorAnswerResult, isCorrect: boolean) => void;
  /** Called to exit game */
  onExit: () => void;
}

/**
 * TutorFlashcards - Flashcard game mode for tutor/partner practice.
 * Shows word on front, translation on back with Got it / Hard buttons.
 */
export const TutorFlashcards: React.FC<TutorFlashcardsProps> = ({
  words,
  currentIndex,
  score,
  targetLanguageName,
  nativeLanguageName,
  onAnswer,
  onExit,
}) => {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  const currentWord = words[currentIndex];

  const handleResponse = useCallback((isCorrect: boolean) => {
    onAnswer({
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      questionType: 'flashcard',
      isCorrect,
    }, isCorrect);

    setFlipped(false);
  }, [currentWord, onAnswer]);

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
            <span className="text-green-500 font-bold">{score.correct}</span>
            <span className="text-[var(--text-secondary)]">/</span>
            <span className="text-red-400 font-bold">{score.incorrect}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-[var(--bg-primary)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-[var(--accent-color)] transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(!flipped)}
          className="relative aspect-[4/5] cursor-pointer perspective-1000"
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center backface-hidden">
              <span className="text-scale-micro uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-4">
                {targetLanguageName}
              </span>
              <h2 className="text-4xl font-black font-header text-[var(--accent-color)] text-center">
                {currentWord.word}
              </h2>
              <p className="text-[var(--text-secondary)] text-scale-label mt-8">
                {t('tutorGames.flashcard.tapToReveal')}
              </p>
            </div>
            {/* Back */}
            <div className="absolute inset-0 bg-[var(--accent-color)] text-white rounded-[2rem] p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180">
              <span className="text-scale-micro uppercase tracking-widest text-white/60 font-bold mb-4">
                {nativeLanguageName}
              </span>
              <h2 className="text-4xl font-black font-header text-center">
                {currentWord.translation}
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); handleResponse(false); }}
                  className="py-3 bg-white/20 rounded-xl font-bold text-scale-label hover:bg-white/30"
                >
                  ❌ {t('tutorGames.flashcard.hard')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleResponse(true); }}
                  className="py-3 glass-card rounded-xl font-bold text-scale-label text-[var(--accent-color)]"
                >
                  ✓ {t('tutorGames.flashcard.gotIt')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default TutorFlashcards;
