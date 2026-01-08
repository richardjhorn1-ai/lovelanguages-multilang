import React from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface PhotoStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: (photoUrl: string | null) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const PhotoStep: React.FC<PhotoStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 border-4 border-dashed border-gray-200">
          <ICONS.Camera className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Photo of you & {partnerName}
        </h1>
        <p className="text-gray-500 mb-2">
          A little reminder of why you're doing this.
        </p>
        <p className="text-sm text-gray-400 italic">
          Photo upload coming soon!
        </p>
      </div>

      <div className="space-y-4">
        <NextButton onClick={() => onNext(null)} accentColor={accentColor}>
          Continue
        </NextButton>
      </div>
    </OnboardingStep>
  );
};
