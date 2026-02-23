'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import type { TutorAnswerResult } from './types';

interface TutorMultipleChoiceProps {
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
  /** Called when user answers - parent should advance index after delay */
  onAnswer: (result: TutorAnswerResult, isCorrect: boolean) => void;
  /** Called to exit game */
  onExit: () => void;
}

// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * TutorMultipleChoice - Multiple choice game mode for tutor/partner practice.
 */
export const TutorMultipleChoice: React.FC<TutorMultipleChoiceProps> = ({
  words,
  currentIndex,
  score,
  targetLanguageName,
  nativeLanguageName,
  onAnswer,
  onExit,
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentWord = words[currentIndex];

  // Generate options when word changes
  useEffect(() => {
    if (!currentWord) return;

    const otherTranslations = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.translation);

    const newOptions = shuffleArray([
      currentWord.translation,
      ...shuffleArray(otherTranslations).slice(0, 3)
    ]);

    setOptions(newOptions);
    setSelected(null);
    setShowFeedback(false);
  }, [currentWord, words]);

  const handleSelect = useCallback((option: string) => {
    if (showFeedback) return;

    setSelected(option);
    setShowFeedback(true);

    const isCorrect = option === currentWord.translation;

    onAnswer({
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect,
    }, isCorrect);
  }, [showFeedback, currentWord, onAnswer]);

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

        {/* Question Card */}
        <div className="glass-card rounded-[2rem] p-8">
          <span className="text-scale-micro font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6 bg-[var(--accent-light)] text-[var(--accent-color)]">
            {targetLanguageName} → {nativeLanguageName}
          </span>

          <h3 className="text-3xl font-black font-header text-[var(--text-primary)] mb-8 text-center">
            {currentWord.word}
          </h3>

          <div className="space-y-3">
            {options.map((option, idx) => {
              const isCorrect = option === currentWord.translation;
              const isSelected = selected === option;

              let buttonStyle = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
              if (showFeedback) {
                if (isCorrect) {
                  buttonStyle = 'border-green-400 bg-green-500/10 border-green-500/30 text-green-500';
                } else if (isSelected && !isCorrect) {
                  buttonStyle = 'border-red-400 bg-red-500/10 border-red-500/30 text-red-500';
                } else {
                  buttonStyle = 'border-[var(--border-color)] text-[var(--text-secondary)]';
                }
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
        </div>
      </div>
    </div>
  );
};

export default TutorMultipleChoice;
