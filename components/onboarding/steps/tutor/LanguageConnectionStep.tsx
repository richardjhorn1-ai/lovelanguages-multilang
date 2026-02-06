import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { useLanguage } from '../../../../context/LanguageContext';

interface LanguageConnectionStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (connection: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const LanguageConnectionStep: React.FC<LanguageConnectionStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initialValue);
  const { targetName, targetFlag } = useLanguage();

  const CONNECTION_OPTIONS = [
    { id: 'native', label: t('onboarding.tutor.connection.native'), description: t('onboarding.tutor.connection.nativeDesc', { language: targetName }), emoji: targetFlag },
    { id: 'heritage', label: t('onboarding.tutor.connection.heritage'), description: t('onboarding.tutor.connection.heritageDesc', { language: targetName }), emoji: '🏠' },
    { id: 'fluent', label: t('onboarding.tutor.connection.fluent'), description: t('onboarding.tutor.connection.fluentDesc', { language: targetName }), emoji: '📚' },
    { id: 'bilingual', label: t('onboarding.tutor.connection.bilingual'), description: t('onboarding.tutor.connection.bilingualDesc', { language: targetName }), emoji: '🗣️' },
  ];

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${accentColor}15` }}>
          <span className="text-3xl">{targetFlag}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.tutor.connection.title', { language: targetName })}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.tutor.connection.subtitle')}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {CONNECTION_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected !== option.id
                ? 'border-gray-100 bg-white hover:border-gray-200'
                : ''
            }`}
            style={selected === option.id ? { borderColor: `${accentColor}60`, backgroundColor: `${accentColor}10` } : undefined}
          >
            <span className="text-2xl">{option.emoji}</span>
            <div className="text-left">
              <span className="font-bold block" style={{ color: selected === option.id ? accentColor : '#374151' }}>
                {option.label}
              </span>
              <span className="text-scale-label text-gray-500">{option.description}</span>
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
