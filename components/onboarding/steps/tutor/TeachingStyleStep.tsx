import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TeachingStyleStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (style: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const STYLE_OPTIONS = [
  { id: 'patient', label: 'Patient & Gentle', description: 'Slow and steady wins the race', emoji: '🐢' },
  { id: 'playful', label: 'Playful & Fun', description: 'Learning through games and humor', emoji: '🎮' },
  { id: 'structured', label: 'Structured', description: 'Organized lessons with clear goals', emoji: '📋' },
  { id: 'immersive', label: 'Immersive', description: 'Dive in and learn by doing', emoji: '🏊' },
];

export const TeachingStyleStep: React.FC<TeachingStyleStepProps> = ({
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
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <ICONS.Sparkles className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Your teaching style?
        </h1>
        <p className="text-gray-500">
          How do you naturally help someone learn?
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected === option.id
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-2xl">{option.emoji}</span>
            <div className="text-left">
              <span className={`font-bold block ${selected === option.id ? 'text-rose-700' : 'text-gray-700'}`}>
                {option.label}
              </span>
              <span className="text-sm text-gray-500">{option.description}</span>
            </div>
          </button>
        ))}
      </div>

      <NextButton
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
