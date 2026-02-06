import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';

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
  const { t } = useTranslation();
  const { targetLanguage } = useLanguage();
  const targetName = LANGUAGE_CONFIGS[targetLanguage]?.name || 'the language';
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
          {t('onboarding.student.prior.title', { language: targetName })}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.student.prior.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setHasTried(true)}
          className={`p-6 rounded-2xl border-2 transition-all ${
            hasTried !== true
              ? 'border-gray-100 bg-white hover:border-gray-200'
              : ''
          }`}
          style={hasTried === true ? { borderColor: `${accentColor}60`, backgroundColor: `${accentColor}10` } : undefined}
        >
          <span className="text-3xl block mb-2">👍</span>
          <span className="font-bold" style={{ color: hasTried === true ? accentColor : '#374151' }}>
            {t('onboarding.student.prior.yes')}
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
            {t('onboarding.student.prior.beginner')}
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
