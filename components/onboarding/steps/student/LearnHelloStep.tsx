import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface LearnHelloStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const LearnHelloStep: React.FC<LearnHelloStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [hasListened, setHasListened] = useState(false);

  const playAudio = () => {
    // Use Web Speech API for pronunciation
    const utterance = new SpeechSynthesisUtterance('Cześć');
    utterance.lang = 'pl-PL';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
    setHasListened(true);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          Let's learn your first word!
        </h1>
        <p className="text-gray-500">
          Say hello to {partnerName} in Polish
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 mb-8">
        <div className="text-center">
          <div className="text-5xl font-black mb-2" style={{ color: accentColor }}>
            Cześć
          </div>
          <div className="text-gray-400 text-lg mb-6">
            [cheshch]
          </div>
          <div className="text-gray-600 font-medium mb-6">
            "Hi" / "Hello" / "Bye"
          </div>

          <button
            onClick={playAudio}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <ICONS.Volume2 className="w-6 h-6 text-gray-600" />
            <span className="font-bold text-gray-700">Listen</span>
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-400 mb-6">
        💡 Poles use "Cześć" for both hello AND goodbye with close friends
      </div>

      <NextButton
        onClick={onNext}
        disabled={!hasListened}
        accentColor={accentColor}
      >
        {hasListened ? 'Got it!' : 'Listen first'}
      </NextButton>
    </OnboardingStep>
  );
};
