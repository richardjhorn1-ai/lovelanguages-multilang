// context/LanguageContext.tsx

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { LANGUAGE_CONFIGS, LanguageConfig } from '../constants/language-config';
import { Profile } from '../types';

// Default fallback (backward compatibility with Polish-learning English speakers)
const DEFAULT_TARGET = 'pl';
const DEFAULT_NATIVE = 'en';

interface LanguageContextType {
  targetLanguage: string;
  nativeLanguage: string;
  targetConfig: LanguageConfig;
  nativeConfig: LanguageConfig;
  targetFlag: string;
  targetName: string;
  nativeFlag: string;
  nativeName: string;
  languageParams: { targetLanguage: string; nativeLanguage: string };
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  profile: Profile | null;
}

export function LanguageProvider({ children, profile }: LanguageProviderProps) {
  const value = useMemo(() => {
    // Priority logic:
    // 1) If profile has non-default values, use profile (user already updated their languages)
    // 2) If profile has database defaults AND localStorage has different selection, prefer localStorage
    //    (this handles the race condition where Hero updates profile AFTER auth listener fires)
    // 3) Fall back to defaults
    const storedTarget = typeof window !== 'undefined' ? localStorage.getItem('preferredTargetLanguage') : null;
    const storedNative = typeof window !== 'undefined' ? localStorage.getItem('preferredLanguage') : null;

    // Check if profile still has database defaults (pl/en)
    const profileHasDefaults = profile?.active_language === DEFAULT_TARGET && profile?.native_language === DEFAULT_NATIVE;
    // Check if user selected different languages in Hero
    const userSelectedDifferentTarget = storedTarget && storedTarget !== DEFAULT_TARGET;
    const userSelectedDifferentNative = storedNative && storedNative !== DEFAULT_NATIVE;

    // If profile has defaults but user selected something else, prefer localStorage
    // This fixes the race condition between Hero profile update and App.tsx fetchProfile
    const targetLanguage = (profileHasDefaults && userSelectedDifferentTarget)
      ? storedTarget
      : profile?.active_language || storedTarget || DEFAULT_TARGET;

    const nativeLanguage = (profileHasDefaults && userSelectedDifferentNative)
      ? storedNative
      : profile?.native_language || storedNative || DEFAULT_NATIVE;

    const targetConfig = LANGUAGE_CONFIGS[targetLanguage] || LANGUAGE_CONFIGS[DEFAULT_TARGET];
    const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage] || LANGUAGE_CONFIGS[DEFAULT_NATIVE];

    return {
      targetLanguage,
      nativeLanguage,
      targetConfig,
      nativeConfig,
      targetFlag: targetConfig.flag,
      targetName: targetConfig.name,
      nativeFlag: nativeConfig.flag,
      nativeName: nativeConfig.name,
      languageParams: { targetLanguage, nativeLanguage },
      isLoading: !profile,
    };
  }, [profile?.active_language, profile?.native_language, profile]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
