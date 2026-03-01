import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_GLASS } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { speak } from '../../../../services/audio';
import { sounds } from '../../../../services/sounds';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';
import { escapeHtml } from '../../../../utils/sanitize';

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
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.Heart className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
          {t('onboarding.student.learnLove.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.student.learnLove.subtitle', { name: partnerName })}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[var(--accent-light)] to-pink-50 rounded-3xl p-8 shadow-lg border border-[var(--accent-border)] mb-6">
        <div className="text-center">
          <div className="text-4xl font-black mb-4" style={{ color: accentColor }}>
            {lovePhrase}
          </div>
          <div className="text-[var(--text-secondary)] font-medium text-scale-heading mb-6">
            "{loveTranslation}"
          </div>

          <button
            onClick={playAudio}
            className={`inline-flex items-center gap-3 px-8 py-4 transition-all ${
              hasListened
                ? ''
                : 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white'
            }`}
            style={hasListened ? { backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '16px' } : { borderRadius: '16px' }}
          >
            <ICONS.Volume2 className={`w-6 h-6 ${hasListened ? 'text-[var(--accent-color)]' : 'text-white'}`} />
            <span className={`font-bold ${hasListened ? 'text-[var(--accent-text)]' : 'text-white'}`}>
              {hasListened ? t('onboarding.student.learnLove.listenAgain') : t('onboarding.student.learnLove.hearIt')}
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 mb-6" style={{ ...ONBOARDING_GLASS, backgroundColor: 'rgba(255, 191, 0, 0.08)' }}>
        <div className="flex gap-3">
          <ICONS.Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div
            className="text-scale-label text-amber-800"
            dangerouslySetInnerHTML={{
              __html: t('onboarding.student.learnLove.proTip', { name: escapeHtml(partnerName), language: targetName })
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
