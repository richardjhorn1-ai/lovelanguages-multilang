import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';

interface WhenStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (when: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const WHEN_OPTIONS = [
  { id: 'morning', emoji: '🌅', label: 'Morning' },
  { id: 'afternoon', emoji: '☀️', label: 'Afternoon' },
  { id: 'evening', emoji: '🌙', label: 'Evening' },
  { id: 'whenever', emoji: '🎲', label: 'Whenever' },
];

export const WhenStep: React.FC<WhenStepProps> = ({
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
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          When do you prefer to practice?
        </h1>
        <p className="text-gray-500">
          We'll remind you at the perfect moment.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {WHEN_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`p-5 rounded-2xl border-2 transition-all ${
              selected === option.id
                ? 'border-[var(--accent-border)] bg-[var(--accent-light)]'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-3xl block mb-2">{option.emoji}</span>
            <span className={`font-bold ${selected === option.id ? 'text-[var(--accent-color)]' : 'text-gray-700'}`}>
              {option.label}
            </span>
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
