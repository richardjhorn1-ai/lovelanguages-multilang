import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { speak } from '../../../../services/audio';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';

interface LearnLoveStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const LearnLoveStep: React.FC<LearnLoveStepProps> = ({
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
  const lovePhrase = LANGUAGE_CONFIGS[targetLanguage]?.examples.iLoveYou || 'I love you';
  const loveTranslation = LANGUAGE_CONFIGS[nativeLanguage]?.examples.iLoveYou || 'I love you';

  const playAudio = () => {
    speak(lovePhrase, targetLanguage);
    setHasListened(true);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">💕</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          {t('onboarding.student.learnLove.title')}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.student.learnLove.subtitle', { name: partnerName })}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[var(--accent-light)] to-pink-50 rounded-3xl p-8 shadow-lg border border-[var(--accent-border)] mb-6">
        <div className="text-center">
          <div className="text-4xl font-black mb-4" style={{ color: accentColor }}>
            {lovePhrase}
          </div>
          <div className="text-gray-600 font-medium text-xl mb-6">
            "{loveTranslation}"
          </div>

          <button
            onClick={playAudio}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl transition-all ${
              hasListened
                ? 'bg-[var(--accent-light)] hover:bg-[var(--accent-light)]'
                : 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white'
            }`}
          >
            <ICONS.Volume2 className={`w-6 h-6 ${hasListened ? 'text-[var(--accent-color)]' : 'text-white'}`} />
            <span className={`font-bold ${hasListened ? 'text-[var(--accent-text)]' : 'text-white'}`}>
              {hasListened ? t('onboarding.student.learnLove.listenAgain') : t('onboarding.student.learnLove.hearIt')}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-xl">💡</span>
          <div
            className="text-sm text-amber-800"
            dangerouslySetInnerHTML={{
              __html: t('onboarding.student.learnLove.proTip', { name: partnerName, language: targetName })
            }}
          />
        </div>
      </div>

      <NextButton
        onClick={onNext}
        disabled={!hasListened}
        accentColor={accentColor}
      >
        {hasListened ? t('onboarding.student.learnLove.ready') : t('onboarding.student.learnLove.listenFirst')}
      </NextButton>
    </OnboardingStep>
  );
};
