import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { GameStage, StreakIndicator } from '../components';
import { speak } from '../../../services/audio';
import { haptics } from '../../../services/haptics';
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
  targetLanguage,
  targetLanguageName,
  currentWordStreak,
  onAnswer,
  onNext,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Cleanup timeout on unmount to prevent updating unmounted component
  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const currentWord = words[currentIndex];
  const isLastWord = currentIndex >= words.length - 1;

  const handleResponse = useCallback((isCorrect: boolean) => {
    // Haptic feedback — satisfying tap for correct, error buzz for hard
    haptics.trigger(isCorrect ? 'correct' : 'incorrect');

    // Report answer to parent
    onAnswer({
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      questionType: 'flashcard',
      isCorrect,
    });

    // Flip back and advance
    setIsFlipped(false);

    if (isLastWord) {
      // Small delay to let flip animation complete (cleaned up on unmount)
      advanceTimeoutRef.current = setTimeout(() => onComplete(), 300);
    } else {
      advanceTimeoutRef.current = setTimeout(() => onNext(), 300);
    }
  }, [currentWord, isLastWord, onAnswer, onNext, onComplete]);

  if (!currentWord) return null;

  return (
    <GameStage
      tone="warm"
      layout="compact"
      eyebrow={t('play.hub.warmupEyebrow')}
      title={t('play.games.flashcards')}
      className="max-w-2xl mx-auto"
    >
      <div
        onClick={() => { setIsFlipped(!isFlipped); haptics.trigger('selection'); }}
        className="relative w-full aspect-[4/5] cursor-pointer perspective-1000 group"
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front - Word */}
          <div
            className="absolute inset-0 rounded-[30px] p-8 md:p-10 flex flex-col items-center justify-center text-center backface-hidden border"
            style={{
              background:
                'radial-gradient(circle at top left, color-mix(in srgb, var(--game-accent-soft) 56%, transparent), transparent 40%), linear-gradient(145deg, rgba(255,255,255,0.95), color-mix(in srgb, var(--game-accent-soft) 24%, white), rgba(255,255,255,0.86))',
              borderColor: 'var(--game-accent-border)',
              boxShadow: '0 24px 44px -28px var(--game-accent-shadow)',
            }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-black mb-6 md:mb-8 bg-white/80 border"
              style={{ borderColor: 'var(--game-accent-border)', color: 'var(--game-accent-deep)' }}
            >
              <span>{t('play.flashcard.word', { language: targetLanguageName.toUpperCase() })}</span>
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-4xl md:text-5xl font-black font-header text-[var(--text-primary)] tracking-tight">
                {currentWord.word}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentWord.word, targetLanguage);
                }}
                className="p-3 rounded-full border transition-colors bg-white/82 hover:bg-white"
                style={{ borderColor: 'var(--game-accent-border)' }}
                title={t('play.flashcard.listen')}
              >
                <ICONS.Volume2 className="w-6 h-6 text-[var(--game-accent-deep)]" />
              </button>
            </div>
            {currentWordStreak > 0 && (
              <div className="mt-4">
                <StreakIndicator streak={currentWordStreak} />
              </div>
            )}
            <button
              type="button"
              className="mt-8 md:mt-10 inline-flex items-center gap-2 rounded-full px-4 py-2 font-black text-sm text-white"
              style={{
                background: 'var(--game-accent-color)',
                boxShadow: '0 18px 34px -24px var(--game-accent-shadow)',
              }}
            >
              <ICONS.Sparkles className="w-4 h-4" />
              {t('play.flashcard.tapToReveal')}
            </button>
          </div>

          {/* Back - Translation */}
          <div
            className="absolute inset-0 text-white rounded-[30px] p-8 md:p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180 border"
            style={{
              background:
                'linear-gradient(145deg, color-mix(in srgb, var(--game-accent-color) 86%, white), color-mix(in srgb, var(--game-accent-deep) 64%, var(--game-accent-color)))',
              borderColor: 'var(--game-accent-border)',
              boxShadow: '0 28px 46px -24px var(--game-accent-shadow)',
            }}
          >
            <span className="text-[10px] uppercase tracking-widest text-white/65 font-black mb-8">
              {t('play.flashcard.translation')}
            </span>
            <h3 className="text-4xl md:text-5xl font-black font-header tracking-tight">{currentWord.translation}</h3>
            <div className="mt-12 grid grid-cols-2 gap-3 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResponse(false);
                }}
                className="bg-white/10 hover:bg-white/16 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/18 text-scale-caption font-black uppercase tracking-widest transition-colors"
              >
                <ICONS.X className="w-4 h-4" /> {t('play.flashcard.hard')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResponse(true);
                }}
                className="p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-scale-caption shadow-lg transition-all active:scale-95"
                style={{
                  color: 'var(--game-accent-deep)',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98), color-mix(in srgb, var(--game-accent-soft) 24%, white))',
                }}
              >
                <ICONS.Check className="w-4 h-4" /> {t('play.flashcard.gotIt')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </GameStage>
  );
};

export default Flashcards;
