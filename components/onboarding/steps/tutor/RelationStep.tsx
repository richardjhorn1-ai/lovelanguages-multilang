import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface RelationStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  initialValue?: string;
  onNext: (relation: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const RelationStep: React.FC<RelationStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();

  // Relation options inside component to access t()
  const relationOptions = [
    { id: 'partner', label: t('onboarding.tutor.relation.partner'), emoji: '💑' },
    { id: 'spouse', label: t('onboarding.tutor.relation.spouse'), emoji: '💍' },
    { id: 'friend', label: t('onboarding.tutor.relation.friend'), emoji: '🤝' },
    { id: 'family', label: t('onboarding.tutor.relation.family'), emoji: '👨‍👩‍👧' },
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
          <ICONS.Users className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.tutor.relation.title', { name: learnerName })}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.tutor.relation.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {relationOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              selected !== option.id
                ? 'border-gray-100 bg-white hover:border-gray-200'
                : ''
            }`}
            style={selected === option.id ? { borderColor: `${accentColor}60`, backgroundColor: `${accentColor}10` } : undefined}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className="font-bold" style={{ color: selected === option.id ? accentColor : '#374151' }}>
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
