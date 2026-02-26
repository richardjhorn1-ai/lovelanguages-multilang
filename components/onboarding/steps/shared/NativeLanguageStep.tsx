import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, ONBOARDING_OPTION } from '../../OnboardingStep';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../../../../constants/language-config';
import { POPULAR_LANGUAGES } from '../../../hero/heroConstants';

interface NativeLanguageStepProps {
  currentStep: number;
  totalSteps: number;
  role: 'student' | 'tutor';
  initialNative?: string;
  onNext: (nativeLanguage: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const NativeLanguageStep: React.FC<NativeLanguageStepProps> = ({
  currentStep,
  totalSteps,
  role,
  initialNative,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t, i18n } = useTranslation();

  // Pre-select from saved preference or browser language
  const [selected, setSelected] = useState<string>(() => {
    if (initialNative) return initialNative;
    const saved = localStorage.getItem('preferredNativeLanguage')
      || localStorage.getItem('preferredLanguage');
    if (saved && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(saved)) return saved;
    const browser = navigator.language.split('-')[0];
    if ((SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(browser)) return browser;
    return 'en';
  });

  const [showAll, setShowAll] = useState(false);

  // All supported languages
  const allLanguages = SUPPORTED_LANGUAGE_CODES as readonly string[];
  const displayedLanguages = showAll ? [...allLanguages] : POPULAR_LANGUAGES;

  // Handle language selection
  const handleSelect = (code: string) => {
    setSelected(code);
    // Switch UI language immediately so the user sees the change
    i18n.changeLanguage(code);
    localStorage.setItem('preferredNativeLanguage', code);
    // Small delay so user sees the selection highlight
    setTimeout(() => {
      onNext(code);
    }, 200);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.nativeLanguage.title', 'What language do you speak?')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.nativeLanguage.subtitle', "We'll show everything in your language")}
        </p>
      </div>

      {/* Language grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {displayedLanguages.map((code, idx) => {
          const lang = LANGUAGE_CONFIGS[code];
          if (!lang) return null;
          const isSelected = code === selected;
          return (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="p-4 flex flex-col items-center gap-2 animate-reveal"
              style={{
                ...ONBOARDING_OPTION(isSelected, accentColor),
                animationDelay: `${0.03 * idx}s`,
              }}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span
                className="text-scale-label font-bold text-center leading-tight"
                style={{ color: isSelected ? accentColor : 'var(--text-primary)' }}
              >
                {lang.nativeName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show all / Show less toggle */}
      {!showAll && allLanguages.length > POPULAR_LANGUAGES.length && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-center font-bold transition-all hover:opacity-70"
          style={{ color: accentColor }}
        >
          {t('onboarding.language.showAll', 'Show all languages')} ({allLanguages.length})
        </button>
      )}
      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-3 text-center font-bold transition-all hover:opacity-70"
          style={{ color: accentColor }}
        >
          {t('onboarding.language.showLess', 'Show popular')}
        </button>
      )}
    </OnboardingStep>
  );
};
