import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
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
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <ICONS.Sparkles className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.tutor.style.title')}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.tutor.style.subtitle')}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {styleOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected === option.id
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-2xl">{option.emoji}</span>
            <div className="text-left">
              <span className={`font-bold block ${selected === option.id ? 'text-rose-700' : 'text-gray-700'}`}>
                {option.label}
              </span>
              <span className="text-sm text-gray-500">{option.description}</span>
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
