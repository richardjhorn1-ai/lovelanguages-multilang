import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, ONBOARDING_OPTION } from '../../OnboardingStep';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../../../../constants/language-config';
import { POPULAR_LANGUAGES } from '../../../hero/heroConstants';

interface LanguageStepProps {
  currentStep: number;
  totalSteps: number;
  role: 'student' | 'tutor';
  initialNative?: string;
  initialTarget?: string;
  onNext: (targetLanguage: string, nativeLanguage: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const LanguageStep: React.FC<LanguageStepProps> = ({
  currentStep,
  totalSteps,
  role,
  initialNative,
  initialTarget,
  onNext,
  onBack,
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const { setLanguageOverride } = useLanguage();
  const isStudent = role === 'student';

  // Native language — set by NativeLanguageStep (previous step), guaranteed present
  const nativeLanguage = initialNative || 'en';

  // Target language
  const [selectedTarget, setSelectedTarget] = useState<string>(initialTarget || '');
  const [showAll, setShowAll] = useState(false);

  // Build language grid — exclude native language
  const allLanguages = (SUPPORTED_LANGUAGE_CODES as readonly string[]).filter(
    code => code !== nativeLanguage
  );
  const popularLanguages = POPULAR_LANGUAGES.filter(
    code => code !== nativeLanguage
  );
  const displayedLanguages = showAll ? allLanguages : popularLanguages;

  // Handle target language selection — immediately advance
  const handleSelectTarget = (code: string) => {
    setSelectedTarget(code);
    // Set language override so useLanguage() works for subsequent steps
    setLanguageOverride({ nativeLanguage, targetLanguage: code });
    // Small delay so user sees the selection highlight
    setTimeout(() => {
      onNext(code, nativeLanguage);
    }, 200);
  };

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      {/* Heading with role-aware framing */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {isStudent
            ? t('onboarding.language.studentTitle', 'What language does someone you love speak?')
            : t('onboarding.language.tutorTitle', 'What language do you want to teach?')
          }
        </h1>
        <p className="text-[var(--text-secondary)]">
          {isStudent
            ? t('onboarding.language.studentSubtitle', 'We\'ll help you learn their language')
            : t('onboarding.language.tutorSubtitle', 'Choose the language you\'ll teach')
          }
        </p>
      </div>

      {/* Language grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {displayedLanguages.map((code, idx) => {
          const lang = LANGUAGE_CONFIGS[code];
          if (!lang) return null;
          const isSelected = code === selectedTarget;
          return (
            <button
              key={code}
              onClick={() => handleSelectTarget(code)}
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
      {!showAll && allLanguages.length > popularLanguages.length && (
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
