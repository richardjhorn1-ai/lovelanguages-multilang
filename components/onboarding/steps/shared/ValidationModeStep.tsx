import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';

interface ValidationModeStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: boolean;
  onNext: (smartValidation: boolean) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const ValidationModeStep: React.FC<ValidationModeStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = true, // Default to smart mode
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<boolean | null>(initialValue);

  // Options array inside component to access t()
  const validationOptions = [
    {
      id: 'smart',
      value: true,
      emoji: '🧠',
      label: t('onboarding.validation.smart.label'),
      tag: t('onboarding.validation.smart.tag'),
      description: t('onboarding.validation.smart.description'),
      details: [
        t('onboarding.validation.smart.detail1'),
        t('onboarding.validation.smart.detail2'),
        t('onboarding.validation.smart.detail3'),
        t('onboarding.validation.smart.detail4')
      ]
    },
    {
      id: 'strict',
      value: false,
      emoji: '🎯',
      label: t('onboarding.validation.strict.label'),
      tag: t('onboarding.validation.strict.tag'),
      description: t('onboarding.validation.strict.description'),
      details: [
        t('onboarding.validation.strict.detail1'),
        t('onboarding.validation.strict.detail2'),
        t('onboarding.validation.strict.detail3'),
        t('onboarding.validation.strict.detail4')
      ]
    }
  ];

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.validation.title')}
        </h1>
        <p className="text-[var(--text-secondary)] text-scale-label">
          {t('onboarding.validation.subtitle')}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {validationOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.value)}
            className="w-full p-4 md:p-5 transition-all text-left"
            style={ONBOARDING_OPTION(selected === option.value, accentColor)}
          >
            <div className="flex items-start gap-3 md:gap-4">
              <span className="text-2xl md:text-3xl">{option.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-bold text-scale-body"
                    style={{ color: selected === option.value ? accentColor : 'var(--text-primary)' }}
                  >
                    {option.label}
                  </span>
                  <span
                    className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: option.id === 'smart' ? `${accentColor}20` : '#f3f4f6',
                      color: option.id === 'smart' ? accentColor : '#6b7280'
                    }}
                  >
                    {option.tag}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm mb-2">{option.description}</p>
                <ul className="space-y-1">
                  {option.details.map((detail, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selected === option.value ? accentColor : '#d1d5db' }}
                      />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mb-4">
        {t('onboarding.validation.changeInSettings')}
      </p>

      <NextButton
        onClick={() => onNext(selected ?? true)}
        disabled={selected === null}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
