import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';

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
  accentColor = '#FF4761'
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
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.student.vibe.title', { name: partnerName })}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.student.vibe.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {vibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => setSelected(vibe.id)}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              selected === vibe.id
                ? 'border-[var(--accent-border)] bg-[var(--accent-light)]'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-2xl mb-2 block">{vibe.emoji}</span>
            <span className={`font-bold ${selected === vibe.id ? 'text-[var(--accent-color)]' : 'text-gray-700'}`}>
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
