import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface RoleStepProps {
  currentStep: number;
  totalSteps: number;
  initialValue?: string;
  onNext: (role: 'student' | 'tutor') => void;
  onBack?: () => void;
  accentColor?: string;
}

export const RoleStep: React.FC<RoleStepProps> = ({
  currentStep,
  totalSteps,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<'student' | 'tutor' | ''>(
    initialValue === 'student' || initialValue === 'tutor' ? initialValue : ''
  );

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      canGoBack={false}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.Heart className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.role.title', 'I want to...')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.role.subtitle', 'Choose how you\'d like to use Love Languages')}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Student card */}
        <button
          onClick={() => setSelected('student')}
          className="w-full p-6 transition-all text-left animate-reveal stagger-1"
          style={ONBOARDING_OPTION(selected === 'student', '#FF4761')}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: selected === 'student' ? '#FF476120' : 'rgba(255,255,255,0.4)' }}
            >
              <ICONS.Heart className="w-7 h-7" style={{ color: selected === 'student' ? '#FF4761' : '#9ca3af' }} />
            </div>
            <div>
              <div
                className="text-xl font-black font-header"
                style={{ color: selected === 'student' ? '#FF4761' : 'var(--text-primary)' }}
              >
                {t('onboarding.role.learn', 'Learn a language')}
              </div>
              <div className="text-scale-label text-[var(--text-secondary)] mt-1">
                {t('onboarding.role.learnDesc', 'Learn the language of someone you love')}
              </div>
            </div>
          </div>
        </button>

        {/* Tutor card */}
        <button
          onClick={() => setSelected('tutor')}
          className="w-full p-6 transition-all text-left animate-reveal stagger-2"
          style={ONBOARDING_OPTION(selected === 'tutor', '#5568af')}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: selected === 'tutor' ? '#5568af20' : 'rgba(255,255,255,0.4)' }}
            >
              <ICONS.Sparkles className="w-7 h-7" style={{ color: selected === 'tutor' ? '#5568af' : '#9ca3af' }} />
            </div>
            <div>
              <div
                className="text-xl font-black font-header"
                style={{ color: selected === 'tutor' ? '#5568af' : 'var(--text-primary)' }}
              >
                {t('onboarding.role.teach', 'Teach a language')}
              </div>
              <div className="text-scale-label text-[var(--text-secondary)] mt-1">
                {t('onboarding.role.teachDesc', 'Help someone you love learn your language')}
              </div>
            </div>
          </div>
        </button>
      </div>

      <NextButton
        onClick={() => selected && onNext(selected as 'student' | 'tutor')}
        disabled={!selected}
        accentColor={selected === 'tutor' ? '#5568af' : accentColor}
      />
    </OnboardingStep>
  );
};
