import React, { useState } from 'react';
import { OnboardingStep, NextButton, SkipButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface DreamPhraseStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  initialValue?: string;
  onNext: (phrase: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const DreamPhraseStep: React.FC<DreamPhraseStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#14B8A6'
}) => {
  const [phrase, setPhrase] = useState(initialValue);

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
          <ICONS.Heart className="w-8 h-8 text-teal-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Dream moment 💭
        </h1>
        <p className="text-gray-500">
          What's the first thing you want to hear {learnerName} say in Polish?
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={`e.g., "Kocham cię" or "Dzień dobry, mamo"`}
          autoFocus
          className="w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-100 focus:border-teal-200 focus:outline-none text-gray-800 placeholder:text-gray-300 transition-all text-center"
        />
        <p className="text-sm text-gray-400 mt-2 text-center">
          This becomes your first teaching goal together
        </p>
      </div>

      <NextButton
        onClick={() => onNext(phrase.trim() || 'Kocham cię')}
        accentColor={accentColor}
      >
        {phrase.trim() ? 'Continue' : 'Skip for now'}
      </NextButton>
    </OnboardingStep>
  );
};
