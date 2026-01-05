import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';

interface VibeStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  initialValue?: string;
  onNext: (vibe: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const VIBES = [
  { id: 'passionate', emoji: '🔥', label: 'Passionate' },
  { id: 'playful', emoji: '😜', label: 'Playful' },
  { id: 'growing', emoji: '🌱', label: 'Growing' },
  { id: 'forever', emoji: '💍', label: 'Forever' },
  { id: 'longdistance', emoji: '🌍', label: 'Long-distance' },
  { id: 'newlove', emoji: '🦋', label: 'New love' },
];

export const VibeStep: React.FC<VibeStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
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
          One word for your relationship with {partnerName}
        </h1>
        <p className="text-gray-500">
          Pick the vibe that feels most true.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {VIBES.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => setSelected(vibe.id)}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              selected === vibe.id
                ? 'border-[var(--accent-border)] bg-[var(--accent-light)]'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-2xl mb-2 block">{vibe.emoji}</span>
            <span className={`font-bold ${selected === vibe.id ? 'text-[var(--accent-color)]' : 'text-gray-700'}`}>
              {vibe.label}
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
