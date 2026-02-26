import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TeachingStyleStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (style: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TeachingStyleStep: React.FC<TeachingStyleStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();

  // Style options inside component to access t()
  const styleOptions = [
    { id: 'patient', label: t('onboarding.tutor.style.patient'), description: t('onboarding.tutor.style.patientDesc'), emoji: '🐢' },
    { id: 'playful', label: t('onboarding.tutor.style.playful'), description: t('onboarding.tutor.style.playfulDesc'), emoji: '🎮' },
    { id: 'structured', label: t('onboarding.tutor.style.structured'), description: t('onboarding.tutor.style.structuredDesc'), emoji: '📋' },
    { id: 'immersive', label: t('onboarding.tutor.style.immersive'), description: t('onboarding.tutor.style.immersiveDesc'), emoji: '🏊' },
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
          <ICONS.Sparkles className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.tutor.style.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.tutor.style.subtitle')}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {styleOptions.map((option, index) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className="w-full p-4 transition-all flex items-center gap-4 animate-reveal"
            style={{ ...ONBOARDING_OPTION(selected === option.id, accentColor), animationDelay: `${0.1 * index}s` }}
          >
            <span className="text-2xl">{option.emoji}</span>
            <div className="text-left">
              <span
                className="font-bold block"
                style={{ color: selected === option.id ? accentColor : 'var(--text-primary)' }}
              >
                {option.label}
              </span>
              <span className="text-scale-label text-[var(--text-secondary)]">{option.description}</span>
            </div>
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
