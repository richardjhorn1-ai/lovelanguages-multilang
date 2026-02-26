import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, SkipButton, ONBOARDING_GLASS } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';
import { sounds } from '../../../../services/sounds';

interface TryItStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TryItStep: React.FC<TryItStepProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const { targetLanguage } = useLanguage();
  const languageConfig = LANGUAGE_CONFIGS[targetLanguage];
  const lovePhrase = languageConfig?.examples.iLoveYou || 'I love you';

  const [isRecording, setIsRecording] = useState(false);
  const [hasTried, setHasTried] = useState(false);

  const handleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setHasTried(true);
      sounds.play('correct');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Auto-stop after 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        setHasTried(true);
        sounds.play('correct');
      }, 3000);
    } catch {
      // Mic denied - that's okay, skip to success
      setHasTried(true);
      sounds.play('correct');
    }
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎤</div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
          {t('onboarding.student.tryIt.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.tryIt.subtitle')}
        </p>
      </div>

      <div className="text-center mb-8">
        <div className="text-3xl font-black mb-2" style={{ color: accentColor }}>
          {lovePhrase}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleRecord}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 animate-pulse scale-110'
              : hasTried
              ? 'bg-green-500'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          style={{
            boxShadow: isRecording
              ? '0 0 30px rgba(239, 68, 68, 0.4)'
              : hasTried
              ? '0 0 20px rgba(34, 197, 94, 0.3)'
              : '0 4px 20px -4px rgba(0,0,0,0.1)'
          }}
        >
          {hasTried ? (
            <ICONS.Check className="w-10 h-10 text-white" />
          ) : (
            <ICONS.Mic className={`w-10 h-10 ${isRecording ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
          )}
        </button>
      </div>

      {isRecording && (
        <div className="text-center text-[var(--text-secondary)] mb-6 animate-pulse">
          {t('onboarding.student.tryIt.listening')}
        </div>
      )}

      {hasTried && (
        <div className="text-center text-green-600 font-bold mb-6">
          {t('onboarding.student.tryIt.success')}
        </div>
      )}

      <NextButton
        onClick={onNext}
        disabled={false}
        accentColor={accentColor}
      >
        {hasTried ? t('onboarding.step.continue') : t('onboarding.step.skipForNow')}
      </NextButton>

      {!hasTried && (
        <div className="text-center">
          <SkipButton onClick={onNext}>
            {t('onboarding.student.tryIt.practiceLater')}
          </SkipButton>
        </div>
      )}
    </OnboardingStep>
  );
};
