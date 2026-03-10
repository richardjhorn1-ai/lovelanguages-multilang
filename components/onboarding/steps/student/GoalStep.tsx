import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GoalPreset } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';
import { ICONS } from '../../../../constants';
import { NextButton, ONBOARDING_INPUT, ONBOARDING_OPTION, OnboardingStep } from '../../OnboardingStep';

interface GoalStepProps {
  currentStep: number;
  totalSteps: number;
  initialGoalPreset?: GoalPreset;
  initialGoalText?: string;
  onNext: (goalPreset: GoalPreset, firstGoal: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const GoalStep: React.FC<GoalStepProps> = ({
  currentStep,
  totalSteps,
  initialGoalPreset,
  initialGoalText = '',
  onNext,
  onBack,
  accentColor = '#FF4761',
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [goalPreset, setGoalPreset] = useState<GoalPreset | ''>(initialGoalPreset || '');
  const [customGoal, setCustomGoal] = useState(initialGoalPreset === 'custom' ? initialGoalText : '');

  const options = useMemo(() => ([
    { id: 'love' as const, icon: <ICONS.Heart className="w-5 h-5" />, label: t('onboarding.goal.love') },
    { id: 'phrases' as const, icon: <ICONS.MessageCircle className="w-5 h-5" />, label: t('onboarding.goal.phrases') },
    { id: 'surprise' as const, icon: <ICONS.Sparkles className="w-5 h-5" />, label: t('onboarding.goal.surprise') },
    { id: 'custom' as const, icon: <ICONS.Pencil className="w-5 h-5" />, label: t('onboarding.goal.custom') },
  ]), [t]);

  const resolvedGoalText = goalPreset === 'custom'
    ? customGoal.trim()
    : goalPreset
      ? t(`onboarding.goal.${goalPreset}`)
      : '';

  const canContinue = Boolean(goalPreset) && resolvedGoalText.length > 0;

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.goal.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.goal.subtitle', { language: targetName })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option) => {
          const selected = goalPreset === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setGoalPreset(option.id)}
              className="p-4 text-left transition-all"
              style={ONBOARDING_OPTION(selected, accentColor)}
            >
              <span className="flex items-center gap-2 mb-2" style={{ color: selected ? accentColor : '#6b7280' }}>
                {option.icon}
                <span className="text-scale-label font-bold">{option.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {goalPreset === 'custom' && (
        <div className="mb-8">
          <label className="block text-scale-label font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">
            {t('onboarding.goal.custom')}
          </label>
          <textarea
            value={customGoal}
            onChange={(event) => setCustomGoal(event.target.value)}
            placeholder={t('onboarding.goal.customPlaceholder')}
            rows={4}
            className="w-full px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none"
            style={ONBOARDING_INPUT(customGoal.trim().length > 0, accentColor)}
          />
        </div>
      )}

      <NextButton
        onClick={() => {
          if (!goalPreset || !resolvedGoalText) {
            return;
          }

          onNext(goalPreset, resolvedGoalText);
        }}
        disabled={!canContinue}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
