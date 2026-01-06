import React, { useState, useEffect } from 'react';
import { DemoWord, generateMCOptions, DEMO_WORDS } from './demoData';

interface DemoMultipleChoiceProps {
  word: DemoWord;
  accentColor: string;
  onComplete: (correct: boolean) => void;
}

export const DemoMultipleChoice: React.FC<DemoMultipleChoiceProps> = ({
  word,
  accentColor,
  onComplete,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setOptions(generateMCOptions(word.translation, DEMO_WORDS, true));
    setSelected(null);
    setShowFeedback(false);
  }, [word]);

  const handleSelect = (option: string) => {
    if (showFeedback) return;

    setSelected(option);
    setShowFeedback(true);

    const isCorrect = option === word.translation;

    setTimeout(() => {
      onComplete(isCorrect);
    }, isCorrect ? 800 : 1200);
  };

  return (
    <div
      className="rounded-[2rem] p-6 shadow-lg border flex flex-col"
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', width: '300px', height: '380px' }}
    >
      <span
        className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        Polish → English
      </span>

      <h3 className="text-2xl font-black text-[#1a1a2e] mb-6 text-center">
        {word.word}
      </h3>

      <div className="space-y-2">
        {options.map((option, idx) => {
          const isCorrect = option === word.translation;
          const isSelected = selected === option;

          let buttonStyle: React.CSSProperties = {
            borderColor: '#e5e7eb',
            backgroundColor: '#ffffff',
            color: '#1a1a2e',
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
                borderColor: '#e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#9ca3af',
              };
            }
          } else if (isSelected) {
            buttonStyle = {
              borderColor: accentColor,
              backgroundColor: `${accentColor}10`,
              color: '#1a1a2e',
            };
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={showFeedback}
              className="w-full p-3 rounded-xl text-left font-medium transition-all border-2 text-sm"
              style={buttonStyle}
            >
              <span className="text-xs font-bold mr-2" style={{ color: '#9ca3af' }}>
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
