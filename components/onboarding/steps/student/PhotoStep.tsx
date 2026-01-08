import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import AvatarUpload from '../../../AvatarUpload';

interface PhotoStepProps {
  currentStep: number;
  totalSteps: number;
  userId: string;
  userName: string;
  initialValue?: string | null;
  onNext: (photoUrl: string | null) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const PhotoStep: React.FC<PhotoStepProps> = ({
  currentStep,
  totalSteps,
  userId,
  userName,
  initialValue,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialValue ?? null);

  const handleUploadComplete = (url: string) => {
    setUploadedUrl(url);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div className="mb-6">
          <AvatarUpload
            userId={userId}
            currentAvatarUrl={uploadedUrl}
            userName={userName}
            size="lg"
            accentHex={accentColor}
            onUploadComplete={handleUploadComplete}
            editable={true}
          />
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Add your photo
        </h1>
        <p className="text-gray-500 mb-2">
          {uploadedUrl
            ? "Looking good! This will appear on your profile."
            : "A photo helps make your profile feel more personal."
          }
        </p>
      </div>

      <div className="space-y-4">
        <NextButton
          onClick={() => onNext(uploadedUrl)}
          accentColor={accentColor}
        >
          {uploadedUrl ? 'Continue' : 'Skip for now'}
        </NextButton>
      </div>
    </OnboardingStep>
  );
};
