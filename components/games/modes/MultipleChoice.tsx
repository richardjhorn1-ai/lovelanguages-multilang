import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { GameStage, StreakIndicator } from '../components';
import { shuffleArray } from '../../../utils/array';
import { speak } from '../../../services/audio';
import { haptics } from '../../../services/haptics';
import type { InteractiveGameModeProps } from './types';

interface MultipleChoiceProps extends InteractiveGameModeProps {
  /** Number of options to show (default: 4) */
  optionCount?: number;
  /** Delay after correct answer before advancing (ms) */
  correctDelay?: number;
  /** Delay after incorrect answer before advancing (ms) */
  incorrectDelay?: number;
}

/**
 * Multiple choice game mode - select the correct translation.
 * Generates random options from the word deck.
 */
export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  words,
  currentIndex,
  accentColor,
  targetLanguage,
  targetLanguageName,
  nativeLanguageName,
  currentWordStreak,
  showIncorrectShake = false,
  onAnswer,
  onNext,
  onComplete,
  optionCount = 4,
  correctDelay = 800,
  incorrectDelay = 1500,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [localShake, setLocalShake] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const currentWord = words[currentIndex];
  const isLastWord = currentIndex >= words.length - 1;

  // Generate options with useMemo (stable per word ID)
  const options = useMemo(() => {
    if (!currentWord || words.length < optionCount) return [];

    // Get wrong options from other words
    const otherTranslations = words
      .filter((w) => w.id !== currentWord.id)
      .map((w) => w.translation);

    const wrongOptions = shuffleArray(otherTranslations).slice(0, optionCount - 1);
    return shuffleArray([currentWord.translation, ...wrongOptions]);
  }, [currentWord?.id, words.length, optionCount]);

  // Reset interaction state when word changes
  useEffect(() => {
    setSelected(null);
    setShowFeedback(false);
  }, [currentIndex]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (option: string) => {
      if (showFeedback) return;

      setSelected(option);
      setShowFeedback(true);

      const isCorrect = option === currentWord.translation;

      // Haptic + visual feedback
      haptics.trigger(isCorrect ? 'correct' : 'incorrect');

      // Trigger shake animation for incorrect answers
      if (!isCorrect) {
        setLocalShake(true);
        shakeTimeoutRef.current = setTimeout(() => setLocalShake(false), 500);
      }

      // Report answer to parent
      onAnswer({
        wordId: currentWord.id,
        wordText: currentWord.word,
        correctAnswer: currentWord.translation,
        userAnswer: option,
        questionType: 'multiple_choice',
        isCorrect,
      });

      // Auto-advance after delay (with cleanup)
      const delay = isCorrect ? correctDelay : incorrectDelay;
      timeoutRef.current = setTimeout(() => {
        if (isLastWord) {
          onComplete();
        } else {
          onNext();
        }
      }, delay);
    },
    [
      showFeedback,
      currentWord,
      isLastWord,
      onAnswer,
      onNext,
      onComplete,
      correctDelay,
      incorrectDelay,
    ]
  );

  if (!currentWord) return null;

  return (
    <GameStage
      tone="bright"
      layout="compact"
      eyebrow={t('play.hub.pickEyebrow')}
      title={t('play.games.multiChoice')}
      className={`max-w-2xl mx-auto ${localShake || showIncorrectShake ? 'animate-shake' : ''}`}
    >
      {/* Direction indicator */}
      <span
        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-flex items-center mb-4"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--game-accent-soft) 64%, white), rgba(255,255,255,0.92))',
          color: 'var(--game-accent-deep)',
          border: '1px solid var(--game-accent-border)',
        }}
      >
        {t('play.directions.targetToNative', {
          target: targetLanguageName,
          native: nativeLanguageName,
        })}
      </span>

      {/* Word to translate */}
      <div
        className="text-center mb-6 rounded-[28px] p-5 md:p-7 border"
        style={{
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--game-accent-soft) 50%, transparent), transparent 46%), linear-gradient(145deg, rgba(255,255,255,0.96), color-mix(in srgb, var(--game-accent-soft) 24%, white))',
          borderColor: 'var(--game-accent-border)',
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-3xl md:text-4xl font-black font-header text-[var(--text-primary)] tracking-tight">
            {currentWord.word}
          </h3>
          <button
            onClick={() => speak(currentWord.word, targetLanguage)}
            className="p-2.5 rounded-full border bg-white/82 hover:bg-white transition-colors"
            style={{ borderColor: 'var(--game-accent-border)' }}
            title={t('play.flashcard.listen')}
          >
            <ICONS.Volume2 className="w-5 h-5 text-[var(--game-accent-deep)]" />
          </button>
        </div>
        {currentWordStreak > 0 && (
          <div className="mt-3">
            <StreakIndicator streak={currentWordStreak} />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, idx) => {
          const isCorrect = option === currentWord.translation;
          const isSelected = selected === option;

          let buttonStyle =
            'border-[var(--border-color)] hover:border-[var(--game-accent-border)] text-[var(--text-primary)] bg-white/82';

          if (showFeedback) {
            if (isCorrect) {
              buttonStyle =
                'border-[var(--color-correct)] bg-[var(--color-correct-bg)] text-[var(--color-correct)]';
            } else if (isSelected && !isCorrect) {
              buttonStyle =
                'border-[var(--color-incorrect)] bg-[var(--color-incorrect-bg)] text-[var(--color-incorrect)]';
            } else {
              buttonStyle = 'border-[var(--border-color)] text-[var(--text-secondary)] bg-white/55';
            }
          } else if (isSelected) {
            buttonStyle =
              'border-[var(--game-accent-color)] bg-[var(--game-accent-soft)] text-[var(--game-accent-deep)]';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={showFeedback}
              className={`w-full p-4 md:p-5 rounded-[24px] text-left font-medium transition-all border-2 shadow-[0_18px_36px_-30px_rgba(41,47,54,0.22)] ${buttonStyle}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center text-sm font-black"
                  style={{
                    background: showFeedback && isCorrect
                      ? 'var(--color-correct-bg)'
                      : showFeedback && isSelected && !isCorrect
                        ? 'var(--color-incorrect-bg)'
                        : 'linear-gradient(145deg, color-mix(in srgb, var(--game-accent-soft) 54%, white), white)',
                    color: showFeedback && isCorrect
                      ? 'var(--color-correct)'
                      : showFeedback && isSelected && !isCorrect
                        ? 'var(--color-incorrect)'
                        : 'var(--game-accent-deep)',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
                {showFeedback && isCorrect && (
                  <ICONS.Check className="w-5 h-5 text-[var(--color-correct)]" />
                )}
                {showFeedback && isSelected && !isCorrect && (
                  <ICONS.X className="w-5 h-5 text-[var(--color-incorrect)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </GameStage>
  );
};

export default MultipleChoice;
