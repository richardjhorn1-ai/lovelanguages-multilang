import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { useLanguage } from '../../../../context/LanguageContext';

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
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();
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
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.student.prior.title', { language: targetName })}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.prior.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setHasTried(true)}
          className="p-6 transition-all"
          style={ONBOARDING_OPTION(hasTried === true, accentColor)}
        >
          <span className="text-3xl block mb-2">👍</span>
          <span className="font-bold" style={{ color: hasTried === true ? accentColor : 'var(--text-primary)' }}>
            {t('onboarding.student.prior.yes')}
          </span>
        </button>
        <button
          onClick={() => setHasTried(false)}
          className="p-6 transition-all"
          style={ONBOARDING_OPTION(hasTried === false, accentColor)}
        >
          <span className="text-3xl block mb-2">🆕</span>
          <span
            className="font-bold"
            style={{ color: hasTried === false ? accentColor : 'var(--text-primary)' }}
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
