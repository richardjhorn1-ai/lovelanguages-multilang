import React from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TutorStartStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  learnerName: string;
  onComplete: () => void;
  accentColor?: string;
  loading?: boolean;
  error?: string | null;
}

export const TutorStartStep: React.FC<TutorStartStepProps> = ({
  currentStep,
  totalSteps,
  userName,
  learnerName,
  onComplete,
  accentColor = '#FF4761',
  loading = false,
  error = null
}) => {
  const { t } = useTranslation();

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      canGoBack={false}
      accentColor={accentColor}
    >
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
          <ICONS.Heart className="w-10 h-10 text-white fill-white" />
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-4 font-header">
          {t('onboarding.tutor.start.title', { learnerName, userName })}
        </h1>

        <p className="text-scale-heading text-gray-600 mb-6">
          {t('onboarding.tutor.start.subtitle')}
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="font-bold text-red-800 mb-1">
              {t('onboarding.errors.title', { defaultValue: 'Something went wrong' })}
            </p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* What's unlocked */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <div className="text-scale-label font-bold text-gray-500 uppercase tracking-wider mb-4">
            {t('onboarding.tutor.start.toolkitTitle')}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                <ICONS.MessageCircle className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <span className="font-medium text-gray-700">{t('onboarding.tutor.start.feature1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <ICONS.TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-medium text-gray-700">{t('onboarding.tutor.start.feature2', { learnerName })}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <ICONS.Gift className="w-4 h-4 text-purple-500" />
              </div>
              <span className="font-medium text-gray-700">{t('onboarding.tutor.start.feature3')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <ICONS.Users className="w-4 h-4 text-rose-500" />
              </div>
              <span className="font-medium text-gray-700">{t('onboarding.tutor.start.feature4')}</span>
            </div>
          </div>
        </div>

        <NextButton
          onClick={onComplete}
          accentColor={accentColor}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('onboarding.tutor.start.activating', { defaultValue: 'Starting your trial...' })}
            </span>
          ) : (
            t('onboarding.tutor.start.button', { learnerName })
          )}
        </NextButton>
      </div>
    </OnboardingStep>
  );
};
