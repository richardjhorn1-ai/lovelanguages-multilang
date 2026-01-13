import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS, getAllLanguages } from '../../../../constants/language-config';
import { ICONS } from '../../../../constants';

interface LanguageConfirmStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  role: 'student' | 'tutor';
  onNext: (nativeLanguage: string, targetLanguage: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

type LanguageType = 'native' | 'target';

export const LanguageConfirmStep: React.FC<LanguageConfirmStepProps> = ({
  currentStep,
  totalSteps,
  userName,
  role,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { nativeLanguage: contextNative, targetLanguage: contextTarget } = useLanguage();

  const [nativeLanguage, setNativeLanguage] = useState(contextNative);
  const [targetLanguage, setTargetLanguage] = useState(contextTarget);
  const [activeDropdown, setActiveDropdown] = useState<LanguageType | null>(null);

  const nativeRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const allLanguages = getAllLanguages();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        nativeRef.current && !nativeRef.current.contains(e.target as Node) &&
        targetRef.current && !targetRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (type: LanguageType, code: string) => {
    if (type === 'native') {
      setNativeLanguage(code);
      // If selecting same as target, swap them
      if (code === targetLanguage) {
        setTargetLanguage(nativeLanguage);
      }
    } else {
      setTargetLanguage(code);
      // If selecting same as native, swap them
      if (code === nativeLanguage) {
        setNativeLanguage(targetLanguage);
      }
    }
    setActiveDropdown(null);
  };

  const handleSubmit = () => {
    onNext(nativeLanguage, targetLanguage);
  };

  const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];
  const targetConfig = LANGUAGE_CONFIGS[targetLanguage];

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      canGoBack={currentStep > 1}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🌍</span>
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          {t('onboarding.languageConfirm.title', { name: userName })}
        </h1>
        <p className="text-gray-500">
          {t('onboarding.languageConfirm.subtitle')}
        </p>
      </div>

      <div className="space-y-5">
        {/* Native Language Selector */}
        <div ref={nativeRef} className="relative">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
            {t(role === 'tutor' ? 'onboarding.languageConfirm.theySpeak' : 'onboarding.languageConfirm.iSpeak')}
          </label>
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'native' ? null : 'native')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-200 bg-white hover:shadow-md active:scale-[0.99]"
            style={{
              borderColor: activeDropdown === 'native' ? accentColor : '#e5e7eb',
              boxShadow: activeDropdown === 'native' ? `0 4px 12px -2px ${accentColor}30` : undefined
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{nativeConfig?.flag}</span>
              <div className="text-left">
                <div className="font-bold text-gray-800">{nativeConfig?.nativeName}</div>
                <div className="text-xs text-gray-400">{nativeConfig?.name}</div>
              </div>
            </div>
            <ICONS.ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${activeDropdown === 'native' ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Native Dropdown */}
          {activeDropdown === 'native' && (
            <div
              className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-fadeIn"
              style={{ maxHeight: '280px' }}
            >
              <div className="overflow-y-auto max-h-[280px] py-2">
                {allLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect('native', lang.code)}
                    className={`w-full flex items-center gap-3 px-5 py-3 transition-all hover:bg-gray-50 ${
                      lang.code === nativeLanguage ? 'bg-[var(--accent-light)]' : ''
                    }`}
                    style={{
                      backgroundColor: lang.code === nativeLanguage ? `${accentColor}12` : undefined
                    }}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-800">{lang.nativeName}</div>
                      <div className="text-xs text-gray-400">{lang.name}</div>
                    </div>
                    {lang.code === nativeLanguage && (
                      <ICONS.Check className="w-5 h-5" style={{ color: accentColor }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>

        {/* Target Language Selector */}
        <div ref={targetRef} className="relative">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
            {t(role === 'tutor' ? 'onboarding.languageConfirm.iTeach' : 'onboarding.languageConfirm.iWantToLearn')}
          </label>
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'target' ? null : 'target')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-200 bg-white hover:shadow-md active:scale-[0.99]"
            style={{
              borderColor: activeDropdown === 'target' ? accentColor : '#e5e7eb',
              boxShadow: activeDropdown === 'target' ? `0 4px 12px -2px ${accentColor}30` : undefined
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{targetConfig?.flag}</span>
              <div className="text-left">
                <div className="font-bold text-gray-800">{targetConfig?.nativeName}</div>
                <div className="text-xs text-gray-400">{targetConfig?.name}</div>
              </div>
            </div>
            <ICONS.ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${activeDropdown === 'target' ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Target Dropdown */}
          {activeDropdown === 'target' && (
            <div
              className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-fadeIn"
              style={{ maxHeight: '280px' }}
            >
              <div className="overflow-y-auto max-h-[280px] py-2">
                {allLanguages
                  .filter(lang => lang.code !== nativeLanguage)
                  .map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect('target', lang.code)}
                      className={`w-full flex items-center gap-3 px-5 py-3 transition-all hover:bg-gray-50 ${
                        lang.code === targetLanguage ? 'bg-[var(--accent-light)]' : ''
                      }`}
                      style={{
                        backgroundColor: lang.code === targetLanguage ? `${accentColor}12` : undefined
                      }}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-800">{lang.nativeName}</div>
                        <div className="text-xs text-gray-400">{lang.name}</div>
                      </div>
                      {lang.code === targetLanguage && (
                        <ICONS.Check className="w-5 h-5" style={{ color: accentColor }} />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary text */}
        <div className="text-center py-3">
          <p className="text-sm text-gray-500">
            {t(role === 'tutor' ? 'onboarding.languageConfirm.tutorSummary' : 'onboarding.languageConfirm.summary', {
              native: nativeConfig?.name,
              target: targetConfig?.name
            })}
          </p>
        </div>

        <NextButton
          onClick={handleSubmit}
          accentColor={accentColor}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </OnboardingStep>
  );
};
