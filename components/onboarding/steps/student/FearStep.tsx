import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { useLanguage } from '../../../../context/LanguageContext';

interface FearStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (fear: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const FearStep: React.FC<FearStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [selected, setSelected] = useState(initialValue);

  // Fear options array inside component to access t()
  const fearOptions = [
    { id: 'pronunciation', emoji: '🗣️', label: t('onboarding.student.fear.pronunciation'), description: t('onboarding.student.fear.pronunciationDesc') },
    { id: 'grammar', emoji: '📚', label: t('onboarding.student.fear.grammar'), description: t('onboarding.student.fear.grammarDesc') },
    { id: 'silly', emoji: '😅', label: t('onboarding.student.fear.silly'), description: t('onboarding.student.fear.sillyDesc') },
    { id: 'forgetting', emoji: '🧠', label: t('onboarding.student.fear.forgetting'), description: t('onboarding.student.fear.forgettingDesc') },
  ];

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.student.fear.title', { language: targetName })}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.fear.subtitle')}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {fearOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className="w-full p-4 transition-all flex items-center gap-4"
            style={ONBOARDING_OPTION(selected === option.id, accentColor)}
          >
            <span className="text-2xl">{option.emoji}</span>
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
