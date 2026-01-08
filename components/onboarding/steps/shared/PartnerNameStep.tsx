import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface PartnerNameStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  role: 'student' | 'tutor';
  initialValue?: string;
  onNext: (partnerName: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const PartnerNameStep: React.FC<PartnerNameStepProps> = ({
  currentStep,
  totalSteps,
  userName,
  role,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [partnerName, setPartnerName] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (partnerName.trim()) {
      onNext(partnerName.trim());
    }
  };

  const isStudent = role === 'student';

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <ICONS.Users className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {isStudent
            ? `Who are you learning Polish for, ${userName}?`
            : `Who are you helping learn Polish, ${userName}?`}
        </h1>
        <p className="text-gray-500">
          {isStudent
            ? "This is who you'll be surprising with your new skills."
            : "This is who you'll be guiding through Polish."}
        </p>
      </div>

      <div className="space-y-6">
        <input
          type="text"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder={isStudent ? "Their name" : "Their name"}
          autoFocus
          className="w-full px-6 py-4 rounded-2xl bg-white border-2 focus:outline-none text-lg font-medium text-gray-800 placeholder:text-gray-300 transition-all"
          style={{
            borderColor: isFocused ? `${accentColor}60` : '#f3f4f6'
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && partnerName.trim() && handleSubmit()}
        />

        <NextButton
          onClick={handleSubmit}
          disabled={!partnerName.trim()}
          accentColor={accentColor}
        />
      </div>
    </OnboardingStep>
  );
};
