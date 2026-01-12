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
    // Simple priority: Profile is source of truth for logged-in users
    // localStorage is ONLY used before login (Hero page selection)
    // Once profile exists, always use profile values
    const targetLanguage = profile?.active_language || DEFAULT_TARGET;
    const nativeLanguage = profile?.native_language || DEFAULT_NATIVE;

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
