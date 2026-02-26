import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, SkipButton, ONBOARDING_INPUT } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';

interface DreamPhraseStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  initialValue?: string;
  onNext: (phrase: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const DreamPhraseStep: React.FC<DreamPhraseStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetLanguage, targetName } = useLanguage();
  const defaultPhrase = LANGUAGE_CONFIGS[targetLanguage]?.examples.iLoveYou || 'I love you';

  const [phrase, setPhrase] = useState(initialValue);

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.Heart className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.tutor.dreamPhrase.title')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.tutor.dreamPhrase.subtitle', { name: learnerName, language: targetName })}
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={t('onboarding.tutor.dreamPhrase.placeholder')}
          autoFocus
          className="w-full px-5 py-4 focus:outline-none text-[var(--text-primary)] placeholder:text-gray-300 transition-all text-center"
          style={ONBOARDING_INPUT(!!phrase.trim(), accentColor)}
          onFocus={(e) => e.target.style.borderColor = `${accentColor}60`}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
        />
        <p className="text-scale-label text-gray-400 mt-2 text-center">
          {t('onboarding.tutor.dreamPhrase.note')}
        </p>
      </div>

      <NextButton
        onClick={() => onNext(phrase.trim() || defaultPhrase)}
        accentColor={accentColor}
      >
        {phrase.trim() ? t('onboarding.step.continue') : t('onboarding.step.skipForNow')}
      </NextButton>
    </OnboardingStep>
  );
};
