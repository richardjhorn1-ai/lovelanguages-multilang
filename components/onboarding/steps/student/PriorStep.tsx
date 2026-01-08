import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';

interface PriorStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (prior: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const PriorStep: React.FC<PriorStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [hasTried, setHasTried] = useState<boolean | null>(
    initialValue === 'yes' ? true : initialValue === 'no' ? false : null
  );

  const handleNext = () => {
    if (hasTried === null) return;
    onNext(hasTried ? 'yes' : 'no');
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Have you tried learning Polish before?
        </h1>
        <p className="text-gray-500">
          This helps us start at the right place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setHasTried(true)}
          className={`p-6 rounded-2xl border-2 transition-all ${
            hasTried === true
              ? 'border-green-300 bg-green-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <span className="text-3xl block mb-2">👍</span>
          <span className={`font-bold ${hasTried === true ? 'text-green-600' : 'text-gray-700'}`}>
            Yes, a bit
          </span>
        </button>
        <button
          onClick={() => setHasTried(false)}
          className={`p-6 rounded-2xl border-2 transition-all ${
            hasTried === false
              ? 'border-gray-200'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
          style={hasTried === false ? {
            borderColor: `${accentColor}60`,
            backgroundColor: `${accentColor}10`
          } : undefined}
        >
          <span className="text-3xl block mb-2">🆕</span>
          <span
            className="font-bold"
            style={{ color: hasTried === false ? accentColor : '#374151' }}
          >
            Complete beginner
          </span>
        </button>
      </div>

      <NextButton
        onClick={handleNext}
        disabled={hasTried === null}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
