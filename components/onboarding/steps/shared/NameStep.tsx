import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_INPUT } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface NameStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (name: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const NameStep: React.FC<NameStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValue);

  const handleSubmit = () => {
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      canGoBack={true}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-6">
          <ICONS.Heart className="w-8 h-8 text-[var(--accent-color)]" />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.name.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.name.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('onboarding.name.placeholder')}
          autoFocus
          className="w-full px-6 py-4 focus:outline-none text-scale-heading font-medium text-[var(--text-primary)] placeholder:text-gray-300 transition-all"
          style={ONBOARDING_INPUT(!!name.trim(), accentColor)}
          onFocus={(e) => e.target.style.borderColor = `${accentColor}60`}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleSubmit()}
        />

        <NextButton
          onClick={handleSubmit}
          disabled={!name.trim()}
          accentColor={accentColor}
        />
      </div>
    </OnboardingStep>
  );
};
