import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';

interface GoalStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  initialValue?: string;
  onNext: (goal: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const GoalStep: React.FC<GoalStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();

  // Goal options array inside component to access t()
  const goalOptions = [
    { id: 'love', label: t('onboarding.student.goal.love'), emoji: '💕' },
    { id: 'phrases', label: t('onboarding.student.goal.phrases'), emoji: '💬' },
    { id: 'surprise', label: t('onboarding.student.goal.surprise', { language: targetName }), emoji: '🎁' },
    { id: 'custom', label: t('onboarding.student.goal.custom'), emoji: '✏️' },
  ];

  const goalOptionIds = goalOptions.map(o => o.id);
  const isCustomValue = initialValue && !goalOptionIds.includes(initialValue);
  const [selected, setSelected] = useState(isCustomValue ? 'custom' : (initialValue || ''));
  const [customGoal, setCustomGoal] = useState(isCustomValue ? initialValue : '');

  const handleNext = () => {
    if (selected === 'custom' && customGoal.trim()) {
      onNext(customGoal.trim());
    } else if (selected && selected !== 'custom') {
      onNext(selected);
    }
  };

  const canContinue = selected && (selected !== 'custom' || customGoal.trim());

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <ICONS.Target className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.student.goal.title')}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.student.goal.subtitle', { name: partnerName })}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {goalOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected === option.id
                ? 'border-gray-200'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={selected === option.id ? {
              borderColor: `${accentColor}60`,
              backgroundColor: `${accentColor}10`
            } : undefined}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span
              className="font-bold text-left"
              style={{ color: selected === option.id ? accentColor : '#374151' }}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {selected === 'custom' && (
        <div className="mb-6 animate-fadeIn">
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={t('onboarding.student.goal.customPlaceholder', { language: targetName })}
            autoFocus
            className="w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-100 focus:outline-none text-gray-800 placeholder:text-gray-300 transition-all"
            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            onFocus={(e) => e.target.style.borderColor = `${accentColor}60`}
            onBlur={(e) => e.target.style.borderColor = '#f3f4f6'}
          />
        </div>
      )}

      <NextButton
        onClick={handleNext}
        disabled={!canContinue}
        accentColor={accentColor}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </OnboardingStep>
  );
};
