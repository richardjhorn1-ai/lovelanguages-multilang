import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface RelationStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  initialValue?: string;
  onNext: (relation: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const RELATION_OPTIONS = [
  { id: 'partner', label: 'Partner', emoji: '💑' },
  { id: 'spouse', label: 'Spouse', emoji: '💍' },
  { id: 'friend', label: 'Friend', emoji: '🤝' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
];

export const RelationStep: React.FC<RelationStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
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
          <ICONS.Users className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          What's your relationship with {learnerName}?
        </h1>
        <p className="text-gray-500">
          This helps us personalize your teaching experience
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {RELATION_OPTIONS.map((option) => (
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
            <span className={`font-bold ${selected === option.id ? 'text-rose-700' : 'text-gray-700'}`}>
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
