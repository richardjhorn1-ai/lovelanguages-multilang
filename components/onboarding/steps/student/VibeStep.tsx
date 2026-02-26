import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';

interface VibeStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  initialValue?: string;
  onNext: (vibe: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const VibeStep: React.FC<VibeStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initialValue);

  // Vibes array inside component to access t()
  const vibes = [
    { id: 'passionate', emoji: '🔥', label: t('onboarding.student.vibe.passionate') },
    { id: 'playful', emoji: '😜', label: t('onboarding.student.vibe.playful') },
    { id: 'growing', emoji: '🌱', label: t('onboarding.student.vibe.growing') },
    { id: 'forever', emoji: '💍', label: t('onboarding.student.vibe.forever') },
    { id: 'longdistance', emoji: '🌍', label: t('onboarding.student.vibe.longDistance') },
    { id: 'newlove', emoji: '🦋', label: t('onboarding.student.vibe.newLove') },
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
          {t('onboarding.student.vibe.title', { name: partnerName })}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.vibe.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {vibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => setSelected(vibe.id)}
            className="p-4 transition-all text-left"
            style={ONBOARDING_OPTION(selected === vibe.id, accentColor)}
          >
            <span className="text-2xl mb-2 block">{vibe.emoji}</span>
            <span
              className="font-bold"
              style={{ color: selected === vibe.id ? accentColor : 'var(--text-primary)' }}
            >
              {vibe.label}
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
