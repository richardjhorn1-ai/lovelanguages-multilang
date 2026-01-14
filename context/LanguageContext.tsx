// context/LanguageContext.tsx

import React, { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import { LANGUAGE_CONFIGS, LanguageConfig } from '../constants/language-config';
import { Profile } from '../types';

// Default fallback (backward compatibility with Polish-learning English speakers)
const DEFAULT_TARGET = 'pl';
const DEFAULT_NATIVE = 'en';

interface LanguageOverride {
  targetLanguage?: string;
  nativeLanguage?: string;
}

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
  // Override function for onboarding - allows temporary language changes before profile is saved
  setLanguageOverride: (override: LanguageOverride | null) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  profile: Profile | null;
}

export function LanguageProvider({ children, profile }: LanguageProviderProps) {
  // Override state for onboarding - takes precedence over profile when set
  const [override, setOverride] = useState<LanguageOverride | null>(null);

  const setLanguageOverride = useCallback((newOverride: LanguageOverride | null) => {
    setOverride(newOverride);
  }, []);

  const value = useMemo(() => {
    // Priority: Override (during onboarding) > Profile > Default
    // This allows onboarding to temporarily set languages before saving to profile
    const targetLanguage = override?.targetLanguage || profile?.active_language || DEFAULT_TARGET;
    const nativeLanguage = override?.nativeLanguage || profile?.native_language || DEFAULT_NATIVE;

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
      isLoading: !profile && !override,
      setLanguageOverride,
    };
  }, [profile?.active_language, profile?.native_language, profile, override, setLanguageOverride]);

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
