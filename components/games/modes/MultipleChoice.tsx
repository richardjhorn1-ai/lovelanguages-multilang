import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { StreakIndicator } from '../components';
import { shuffleArray } from '../../../utils/array';
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
    <div
      className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${
        localShake || showIncorrectShake ? 'animate-shake' : ''
      }`}
    >
      {/* Direction indicator */}
      <span
        className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        {t('play.directions.targetToNative', {
          target: targetLanguageName,
          native: nativeLanguageName,
        })}
      </span>

      {/* Word to translate */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-black text-[var(--text-primary)]">
          {currentWord.word}
        </h3>
        {currentWordStreak > 0 && (
          <div className="mt-2">
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
            'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';

          if (showFeedback) {
            if (isCorrect) {
              buttonStyle =
                'border-green-400 bg-green-500/10 border-green-500/30 text-green-500';
            } else if (isSelected && !isCorrect) {
              buttonStyle =
                'border-red-400 bg-red-500/10 border-red-500/30 text-red-500';
            } else {
              buttonStyle = 'border-[var(--border-color)] text-[var(--text-secondary)]';
            }
          } else if (isSelected) {
            buttonStyle =
              'border-[var(--text-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)]';
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${buttonStyle}`}
            >
              <span className="text-scale-caption font-bold text-[var(--text-secondary)] mr-3">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
              {showFeedback && isCorrect && (
                <ICONS.Check className="w-5 h-5 float-right text-green-500" />
              )}
              {showFeedback && isSelected && !isCorrect && (
                <ICONS.X className="w-5 h-5 float-right text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MultipleChoice;
