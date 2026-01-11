import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';

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
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetLanguage } = useLanguage();
  const targetName = LANGUAGE_CONFIGS[targetLanguage]?.name || 'the language';

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
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <ICONS.Star className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.tutor.origin.title', { language: targetName })}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.tutor.origin.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {originOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              selected === option.id
                ? 'border-rose-300 bg-rose-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className={`font-bold text-center ${selected === option.id ? 'text-rose-700' : 'text-gray-700'}`}>
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
