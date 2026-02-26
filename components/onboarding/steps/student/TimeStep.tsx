import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TimeStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (time: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TimeStep: React.FC<TimeStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initialValue);

  // Time options array inside component to access t()
  const timeOptions = [
    { id: 'quick', emoji: '💋', label: t('onboarding.student.time.quick'), description: t('onboarding.student.time.quickDesc') },
    { id: 'coffee', emoji: '☕', label: t('onboarding.student.time.coffee'), description: t('onboarding.student.time.coffeeDesc') },
    { id: 'walk', emoji: '🚶', label: t('onboarding.student.time.walk'), description: t('onboarding.student.time.walkDesc') },
  ];

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <ICONS.Clock className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.student.time.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.time.subtitle')}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {timeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className="w-full p-5 transition-all flex items-center gap-4"
            style={ONBOARDING_OPTION(selected === option.id, accentColor)}
          >
            <span className="text-3xl">{option.emoji}</span>
            <div className="text-left">
              <div
                className="font-bold"
                style={{ color: selected === option.id ? accentColor : 'var(--text-primary)' }}
              >
                {option.label}
              </div>
              <div className="text-scale-label text-gray-400">{option.description}</div>
            </div>
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
