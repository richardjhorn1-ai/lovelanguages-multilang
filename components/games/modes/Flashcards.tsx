import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { StreakIndicator } from '../components';
import type { InteractiveGameModeProps } from './types';

interface FlashcardsProps extends InteractiveGameModeProps {}

/**
 * Flashcard game mode - tap to flip, self-grade.
 * Shows word on front, translation on back with Got It / Hard buttons.
 */
export const Flashcards: React.FC<FlashcardsProps> = ({
  words,
  currentIndex,
  accentColor,
  targetLanguageName,
  currentWordStreak,
  onAnswer,
  onNext,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const currentWord = words[currentIndex];
  const isLastWord = currentIndex >= words.length - 1;

  const handleResponse = useCallback((isCorrect: boolean) => {
    // Report answer to parent
    onAnswer({
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      isCorrect,
    });

    // Flip back and advance
    setIsFlipped(false);

    if (isLastWord) {
      // Small delay to let flip animation complete
      setTimeout(() => onComplete(), 300);
    } else {
      setTimeout(() => onNext(), 300);
    }
  }, [currentWord, isLastWord, onAnswer, onNext, onComplete]);

  if (!currentWord) return null;

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="relative w-full aspect-[4/5] cursor-pointer perspective-1000 group"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front - Word */}
        <div className="absolute inset-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-8">
            {t('play.flashcard.word', { language: targetLanguageName.toUpperCase() })}
          </span>
          <h3 className="text-4xl font-black text-[var(--text-primary)]">
            {currentWord.word}
          </h3>
          {currentWordStreak > 0 && (
            <div className="mt-4">
              <StreakIndicator streak={currentWordStreak} />
            </div>
          )}
          <p className="mt-8 text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest animate-pulse">
            {t('play.flashcard.tapToReveal')}
          </p>
        </div>

        {/* Back - Translation */}
        <div
          className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180"
          style={{ backgroundColor: accentColor }}
        >
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">
            {t('play.flashcard.translation')}
          </span>
          <h3 className="text-4xl font-black">{currentWord.translation}</h3>
          <div className="mt-12 grid grid-cols-2 gap-3 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResponse(false);
              }}
              className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-scale-caption font-black uppercase tracking-widest transition-colors"
            >
              <ICONS.X className="w-4 h-4" /> {t('play.flashcard.hard')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResponse(true);
              }}
              className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-scale-caption shadow-lg transition-all active:scale-95"
              style={{ color: accentColor }}
            >
              <ICONS.Check className="w-4 h-4" /> {t('play.flashcard.gotIt')}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for 3D flip effect */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default Flashcards;
