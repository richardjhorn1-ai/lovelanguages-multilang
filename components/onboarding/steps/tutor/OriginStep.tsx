import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface OriginStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (origin: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const ORIGIN_OPTIONS = [
  { id: 'poland', label: 'Grew up in Poland', emoji: '🏘️' },
  { id: 'family', label: 'From family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'school', label: 'Studied formally', emoji: '🎓' },
  { id: 'self', label: 'Self-taught', emoji: '📖' },
];

export const OriginStep: React.FC<OriginStepProps> = ({
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
          <ICONS.Star className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          How did you learn Polish?
        </h1>
        <p className="text-gray-500">
          Your journey helps us suggest teaching approaches
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {ORIGIN_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              selected === option.id
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className={`font-bold text-center ${selected === option.id ? 'text-rose-700' : 'text-gray-700'}`}>
              {option.label}
            </span>
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
