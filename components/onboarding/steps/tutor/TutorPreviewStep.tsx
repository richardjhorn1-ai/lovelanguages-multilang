import React from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_GLASS } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TutorPreviewStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TutorPreviewStep: React.FC<TutorPreviewStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
          <ICONS.Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.tutor.preview.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.tutor.preview.subtitle', { name: learnerName })}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="p-4 flex items-center gap-4 animate-reveal" style={{ ...ONBOARDING_GLASS, animationDelay: '0.1s' }}>
          <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
            <ICONS.MessageCircle className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">{t('onboarding.tutor.preview.coachMode')}</h3>
            <p className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.tutor.preview.coachModeDesc', { name: learnerName })}</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-4 animate-reveal" style={{ ...ONBOARDING_GLASS, animationDelay: '0.2s' }}>
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ICONS.TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">{t('onboarding.tutor.preview.progressTracking')}</h3>
            <p className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.tutor.preview.progressTrackingDesc', { name: learnerName })}</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-4 animate-reveal" style={{ ...ONBOARDING_GLASS, animationDelay: '0.3s' }}>
          <div className="w-8 h-8 rounded-full bg-[var(--secondary-light)] flex items-center justify-center flex-shrink-0">
            <ICONS.Gift className="w-5 h-5 text-[var(--secondary-color)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">{t('onboarding.tutor.preview.wordGifts')}</h3>
            <p className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.tutor.preview.wordGiftsDesc', { name: learnerName })}</p>
          </div>
        </div>
      </div>

      <NextButton onClick={onNext} accentColor={accentColor}>
        {t('onboarding.tutor.preview.button')}
      </NextButton>
    </OnboardingStep>
  );
};
