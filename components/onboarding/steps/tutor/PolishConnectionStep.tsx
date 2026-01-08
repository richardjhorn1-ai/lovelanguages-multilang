import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface PolishConnectionStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (connection: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const CONNECTION_OPTIONS = [
  { id: 'native', label: 'Native speaker', description: 'Born and raised in Poland', emoji: '🇵🇱' },
  { id: 'heritage', label: 'Heritage speaker', description: 'Polish family background', emoji: '🏠' },
  { id: 'fluent', label: 'Fluent speaker', description: 'Learned and mastered Polish', emoji: '📚' },
  { id: 'bilingual', label: 'Bilingual', description: 'Grew up speaking Polish and another language', emoji: '🗣️' },
];

export const PolishConnectionStep: React.FC<PolishConnectionStepProps> = ({
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
          <span className="text-3xl">🇵🇱</span>
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          What's your connection to Polish?
        </h1>
        <p className="text-gray-500">
          Help us understand your language background
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {CONNECTION_OPTIONS.map((option) => (
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
