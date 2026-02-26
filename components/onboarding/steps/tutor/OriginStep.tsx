import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';

interface OriginStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (origin: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const OriginStep: React.FC<OriginStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();

  // Origin options inside component to access t()
  const originOptions = [
    { id: 'country', label: t('onboarding.tutor.origin.country'), emoji: '🏘️' },
    { id: 'family', label: t('onboarding.tutor.origin.family'), emoji: '👨‍👩‍👧‍👦' },
    { id: 'school', label: t('onboarding.tutor.origin.school'), emoji: '🎓' },
    { id: 'self', label: t('onboarding.tutor.origin.self'), emoji: '📖' },
  ];

  const [selected, setSelected] = useState(initialValue);

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.Star className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.tutor.origin.title', { language: targetName })}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.tutor.origin.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {originOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className="p-4 transition-all flex flex-col items-center gap-2"
            style={ONBOARDING_OPTION(selected === option.id, accentColor)}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className="font-bold text-center" style={{ color: selected === option.id ? accentColor : 'var(--text-primary)' }}>
              {option.label}
            </span>
          </button>
        ))}
      </div>

      <NextButton
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
