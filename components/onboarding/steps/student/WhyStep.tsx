import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface WhyStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  initialValue?: string;
  onNext: (reason: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const WhyStep: React.FC<WhyStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [reason, setReason] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (reason.trim()) {
      onNext(reason.trim());
    }
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <ICONS.Sparkles className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Why do you want to learn Polish for {partnerName}?
        </h1>
        <p className="text-gray-500">
          This becomes your personal reminder on your journey.
        </p>
      </div>

      <div className="space-y-6">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="I want to surprise them when we visit their family... I want to whisper sweet nothings... I want to understand their world..."
          autoFocus
          rows={4}
          className="w-full px-6 py-4 rounded-2xl bg-white border-2 focus:outline-none text-lg font-medium text-gray-800 placeholder:text-gray-300 transition-all resize-none"
          style={{
            borderColor: isFocused ? `${accentColor}60` : '#f3f4f6'
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <NextButton
          onClick={handleSubmit}
          disabled={!reason.trim()}
          accentColor={accentColor}
        />
      </div>
    </OnboardingStep>
  );
};
