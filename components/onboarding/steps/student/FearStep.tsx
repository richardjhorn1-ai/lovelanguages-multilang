import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';

interface FearStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (fear: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const FEAR_OPTIONS = [
  { id: 'pronunciation', emoji: '🗣️', label: 'Pronunciation', description: 'Sounding wrong or silly' },
  { id: 'grammar', emoji: '📚', label: 'Grammar rules', description: 'Cases, conjugations, gender' },
  { id: 'silly', emoji: '😅', label: 'Sounding silly', description: 'Making mistakes in front of others' },
  { id: 'forgetting', emoji: '🧠', label: 'Forgetting everything', description: "Learning but not retaining" },
];

export const FearStep: React.FC<FearStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [selected, setSelected] = useState(initialValue);

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          What's your biggest fear about learning Polish?
        </h1>
        <p className="text-gray-500">
          Everyone has one. Let's tackle yours together.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {FEAR_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected === option.id
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-2xl">{option.emoji}</span>
            <div className="text-left">
              <div className={`font-bold ${selected === option.id ? 'text-purple-600' : 'text-gray-700'}`}>
                {option.label}
              </div>
              <div className="text-sm text-gray-400">{option.description}</div>
            </div>
          </button>
        ))}
      </div>

      <NextButton
        onClick={() => onNext(selected)}
        disabled={!selected}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
