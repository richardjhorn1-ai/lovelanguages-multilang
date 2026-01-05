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
  const [details, setDetails] = useState('');

  const handleNext = () => {
    if (hasTried === null) return;
    const value = hasTried ? `yes: ${details || 'no details'}` : 'no';
    onNext(value);
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
              ? 'border-teal-300 bg-teal-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <span className="text-3xl block mb-2">👍</span>
          <span className={`font-bold ${hasTried === true ? 'text-teal-600' : 'text-gray-700'}`}>
            Yes, a bit
          </span>
        </button>
        <button
          onClick={() => setHasTried(false)}
          className={`p-6 rounded-2xl border-2 transition-all ${
            hasTried === false
              ? 'border-teal-300 bg-teal-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <span className="text-3xl block mb-2">🆕</span>
          <span className={`font-bold ${hasTried === false ? 'text-teal-600' : 'text-gray-700'}`}>
            Complete beginner
          </span>
        </button>
      </div>

      {hasTried === true && (
        <div className="mb-6 animate-fadeIn">
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What did you try? (apps, classes, etc.)"
            className="w-full px-5 py-3 rounded-xl bg-white border-2 border-gray-100 focus:border-teal-200 focus:outline-none text-gray-800 placeholder:text-gray-300 transition-all"
          />
        </div>
      )}

      <NextButton
        onClick={handleNext}
        disabled={hasTried === null}
        accentColor={accentColor}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </OnboardingStep>
  );
};
