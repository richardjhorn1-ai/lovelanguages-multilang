import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_GLASS } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { speak } from '../../../../services/audio';
import { sounds } from '../../../../services/sounds';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';

interface LearnHelloStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const LearnHelloStep: React.FC<LearnHelloStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const [hasListened, setHasListened] = useState(false);
  const { targetLanguage, nativeLanguage, targetName } = useLanguage();
  const helloWord = LANGUAGE_CONFIGS[targetLanguage]?.examples.hello || 'Hello';
  const helloTranslation = LANGUAGE_CONFIGS[nativeLanguage]?.examples.hello || 'Hello';

  const playAudio = () => {
    speak(helloWord, targetLanguage);
    if (!hasListened) {
      sounds.play('notification');
    }
    setHasListened(true);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.MessageCircle className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
          {t('onboarding.student.learnHello.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.learnHello.subtitle', { name: partnerName, language: targetName })}
        </p>
      </div>

      <div className="p-8 mb-8" style={ONBOARDING_GLASS}>
        <div className="text-center">
          <div className="text-5xl font-black mb-4" style={{ color: accentColor }}>
            {helloWord}
          </div>
          <div className="text-[var(--text-secondary)] font-medium mb-6">
            "{helloTranslation}"
          </div>

          <button
            onClick={playAudio}
            className="inline-flex items-center gap-3 px-8 py-4 transition-all"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '16px' }}
          >
            <ICONS.Volume2 className="w-6 h-6 text-[var(--text-secondary)]" />
            <span className="font-bold text-[var(--text-primary)]">{t('onboarding.student.learnHello.listen')}</span>
          </button>
        </div>
      </div>

      <div className="text-center text-scale-label text-gray-400 mb-6">
        {t('onboarding.student.learnHello.tip', { language: targetName })}
      </div>

      <NextButton
        onClick={onNext}
        disabled={!hasListened}
        accentColor={accentColor}
      >
        {hasListened ? t('onboarding.student.learnHello.gotIt') : t('onboarding.student.learnHello.listenFirst')}
      </NextButton>
    </OnboardingStep>
  );
};
