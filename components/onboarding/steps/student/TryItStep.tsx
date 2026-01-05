import React, { useState } from 'react';
import { OnboardingStep, NextButton, SkipButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TryItStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TryItStep: React.FC<TryItStepProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasTried, setHasTried] = useState(false);

  const handleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setHasTried(true);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Auto-stop after 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        setHasTried(true);
      }, 3000);
    } catch {
      // Mic denied - that's okay, skip to success
      setHasTried(true);
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
        <div className="text-6xl mb-4">🎤</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          Try saying it!
        </h1>
        <p className="text-gray-500">
          Don't worry, only you can hear yourself.
        </p>
      </div>

      <div className="text-center mb-8">
        <div className="text-3xl font-black mb-2" style={{ color: accentColor }}>
          Kocham cię
        </div>
        <div className="text-gray-400 text-lg">
          [KOH-ham chyeh]
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleRecord}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 animate-pulse scale-110'
              : hasTried
              ? 'bg-green-500'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {hasTried ? (
            <ICONS.Check className="w-10 h-10 text-white" />
          ) : (
            <ICONS.Mic className={`w-10 h-10 ${isRecording ? 'text-white' : 'text-gray-500'}`} />
          )}
        </button>
      </div>

      {isRecording && (
        <div className="text-center text-gray-500 mb-6 animate-pulse">
          Listening... Tap to stop
        </div>
      )}

      {hasTried && (
        <div className="text-center text-green-600 font-bold mb-6">
          Amazing! You said it! 🎉
        </div>
      )}

      <NextButton
        onClick={onNext}
        disabled={false}
        accentColor={accentColor}
      >
        {hasTried ? 'Continue' : 'Skip for now'}
      </NextButton>

      {!hasTried && (
        <div className="text-center">
          <SkipButton onClick={onNext}>
            I'll practice later
          </SkipButton>
        </div>
      )}
    </OnboardingStep>
  );
};
