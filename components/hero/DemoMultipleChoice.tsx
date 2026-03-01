import React, { useState, useEffect } from 'react';
import { DemoWord, generateMCOptions } from './demoData';
import { sounds } from '../../services/sounds';

interface DemoMultipleChoiceProps {
  word: DemoWord;
  accentColor: string;
  onComplete: (correct: boolean) => void;
  targetName: string;
  nativeName: string;
  allWords: DemoWord[];
}

export const DemoMultipleChoice: React.FC<DemoMultipleChoiceProps> = ({
  word,
  accentColor,
  onComplete,
  targetName,
  nativeName,
  allWords,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setOptions(generateMCOptions(word.translation, allWords, true));
    setSelected(null);
    setShowFeedback(false);
  }, [word, allWords]);

  const handleSelect = (option: string) => {
    if (showFeedback) return;

    setSelected(option);
    setShowFeedback(true);

    const isCorrect = option === word.translation;

    // Play feedback sound
    sounds.play('correct');

    setTimeout(() => {
      onComplete(isCorrect);
    }, isCorrect ? 800 : 1200);
  };

  return (
    <div
      className="rounded-2xl p-6 shadow-lg border flex flex-col"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', width: '300px', height: '380px' }}
    >
      <span
        className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        {targetName} → {nativeName}
      </span>

      <h3 className="text-2xl font-black font-header text-[var(--text-primary)] mb-6 text-center">
        {word.word}
      </h3>

      <div className="space-y-2">
        {options.map((option, idx) => {
          const isCorrect = option === word.translation;
          const isSelected = selected === option;

          let buttonStyle: React.CSSProperties = {
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          };

          if (showFeedback) {
            if (isCorrect) {
              buttonStyle = {
                borderColor: '#4ade80',
                backgroundColor: '#dcfce7',
                color: '#166534',
              };
            } else if (isSelected && !isCorrect) {
              buttonStyle = {
                borderColor: '#f87171',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
              };
            } else {
              buttonStyle = {
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
              };
            }
          } else if (isSelected) {
            buttonStyle = {
              borderColor: accentColor,
              backgroundColor: `${accentColor}15`,
              color: 'var(--text-primary)',
            };
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={showFeedback}
              className="w-full p-3 rounded-xl text-left font-medium transition-all border-2 text-scale-label"
              style={buttonStyle}
            >
              <span className="text-scale-caption font-bold mr-2" style={{ color: 'var(--text-secondary)' }}>
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
              {showFeedback && isCorrect && (
                <span className="float-right text-green-500">✓</span>
              )}
              {showFeedback && isSelected && !isCorrect && (
                <span className="float-right text-red-500">✗</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
