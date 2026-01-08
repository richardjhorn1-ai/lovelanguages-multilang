import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { speakPolish } from '../../../../services/audio';

interface LearnLoveStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const LearnLoveStep: React.FC<LearnLoveStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [hasListened, setHasListened] = useState(false);

  const playAudio = () => {
    speakPolish('Kocham cię');
    setHasListened(true);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">💕</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          Now, the most important phrase...
        </h1>
        <p className="text-gray-500">
          The one {partnerName} will never forget
        </p>
      </div>

      <div className="bg-gradient-to-br from-[var(--accent-light)] to-pink-50 rounded-3xl p-8 shadow-lg border border-[var(--accent-border)] mb-6">
        <div className="text-center">
          <div className="text-4xl font-black mb-2" style={{ color: accentColor }}>
            Kocham cię
          </div>
          <div className="text-gray-400 text-lg mb-4">
            [KOH-ham chyeh]
          </div>
          <div className="text-gray-600 font-medium text-xl mb-6">
            "I love you"
          </div>

          <button
            onClick={playAudio}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl transition-all ${
              hasListened
                ? 'bg-[var(--accent-light)] hover:bg-[var(--accent-light)]'
                : 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white'
            }`}
          >
            <ICONS.Volume2 className={`w-6 h-6 ${hasListened ? 'text-[var(--accent-color)]' : 'text-white'}`} />
            <span className={`font-bold ${hasListened ? 'text-[var(--accent-text)]' : 'text-white'}`}>
              {hasListened ? 'Listen again' : 'Hear it'}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-xl">💡</span>
          <div className="text-sm text-amber-800">
            <strong>Pro tip:</strong> The "ch" in "Kocham" is soft, like the "h" in "huge".
            The "cię" sounds like "chyeh" - let it flow!
          </div>
        </div>
      </div>

      <NextButton
        onClick={onNext}
        disabled={!hasListened}
        accentColor={accentColor}
      >
        {hasListened ? 'I\'m ready!' : 'Listen first'}
      </NextButton>
    </OnboardingStep>
  );
};
