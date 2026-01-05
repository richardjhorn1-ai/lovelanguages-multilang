import React from 'react';
import { OnboardingStep, NextButton, SkipButton } from '../../OnboardingStep';
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
  // For now, we'll skip photo upload and just allow skipping
  // Photo upload would require Supabase Storage setup

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
          Add a photo of you & {partnerName}
        </h1>
        <p className="text-gray-500">
          A little reminder of why you're doing this. (Optional)
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => {
            // TODO: Implement photo upload with Supabase Storage
            // For now, skip to next
            onNext(null);
          }}
          className="w-full py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-600 font-bold text-lg hover:border-gray-300 transition-all flex items-center justify-center gap-3"
        >
          <ICONS.Upload className="w-5 h-5" />
          Upload photo
        </button>

        <div className="text-center">
          <SkipButton onClick={() => onNext(null)}>
            Skip for now
          </SkipButton>
        </div>
      </div>
    </OnboardingStep>
  );
};
