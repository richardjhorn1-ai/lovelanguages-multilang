import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';

interface WhenStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (when: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const WhenStep: React.FC<WhenStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initialValue);

  // When options array inside component to access t()
  const whenOptions = [
    { id: 'morning', emoji: '🌅', label: t('onboarding.student.when.morning') },
    { id: 'afternoon', emoji: '☀️', label: t('onboarding.student.when.afternoon') },
    { id: 'evening', emoji: '🌙', label: t('onboarding.student.when.evening') },
    { id: 'whenever', emoji: '🎲', label: t('onboarding.student.when.whenever') },
  ];

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.student.when.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.when.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {whenOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className="p-5 transition-all"
            style={ONBOARDING_OPTION(selected === option.id, accentColor)}
          >
            <span className="text-3xl block mb-2">{option.emoji}</span>
            <span
              className="font-bold"
              style={{ color: selected === option.id ? accentColor : 'var(--text-primary)' }}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>

      <NextButton
        onClick={() => onNext(selected)}
        disabled={!selected}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
