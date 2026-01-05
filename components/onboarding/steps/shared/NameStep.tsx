import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface NameStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (name: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const NameStep: React.FC<NameStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [name, setName] = useState(initialValue);

  const handleSubmit = () => {
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      canGoBack={currentStep > 1}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-6">
          <ICONS.Heart className="w-8 h-8 text-[var(--accent-color)]" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          What should Cupid call you?
        </h1>
        <p className="text-gray-500">
          Your name helps make this journey personal.
        </p>
      </div>

      <div className="space-y-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-[var(--accent-border)] focus:outline-none text-lg font-medium text-gray-800 placeholder:text-gray-300 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleSubmit()}
        />

        <NextButton
          onClick={handleSubmit}
          disabled={!name.trim()}
          accentColor={accentColor}
        />
      </div>
    </OnboardingStep>
  );
};
