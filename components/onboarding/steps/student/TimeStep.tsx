import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TimeStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (time: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const TIME_OPTIONS = [
  { id: 'quick', emoji: '💋', label: 'A quick kiss', description: '5 minutes' },
  { id: 'coffee', emoji: '☕', label: 'A coffee date', description: '10 minutes' },
  { id: 'walk', emoji: '🚶', label: 'A long walk', description: '20+ minutes' },
];

export const TimeStep: React.FC<TimeStepProps> = ({
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
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <ICONS.Clock className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          How much time can you dedicate daily?
        </h1>
        <p className="text-gray-500">
          Even small moments add up to big progress.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {TIME_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected === option.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <div className="text-left">
              <div className={`font-bold ${selected === option.id ? 'text-blue-600' : 'text-gray-700'}`}>
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
