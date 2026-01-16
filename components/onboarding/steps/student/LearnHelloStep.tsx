import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
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
  accentColor = '#FF4761'
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
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          {t('onboarding.student.learnHello.title')}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.student.learnHello.subtitle', { name: partnerName, language: targetName })}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 mb-8">
        <div className="text-center">
          <div className="text-5xl font-black mb-4" style={{ color: accentColor }}>
            {helloWord}
          </div>
          <div className="text-gray-600 font-medium mb-6">
            "{helloTranslation}"
          </div>

          <button
            onClick={playAudio}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <ICONS.Volume2 className="w-6 h-6 text-gray-600" />
            <span className="font-bold text-gray-700">{t('onboarding.student.learnHello.listen')}</span>
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
