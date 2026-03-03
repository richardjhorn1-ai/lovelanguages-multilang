'use client';

import React from 'react';

interface LanguageInfo {
  flag: string;
  name: string;
  nativeName: string;
}

interface Props {
  currentNativeLang: string;
  targetLang: string;
  languageInfo: Record<string, LanguageInfo>;
  availableNativeLanguages?: string[];
}

// Supported native languages for content (only languages with article content)
const SUPPORTED_NATIVE_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

export default function NativeLanguageSelector({
  currentNativeLang,
  targetLang,
  languageInfo,
  availableNativeLanguages = SUPPORTED_NATIVE_LANGS,
}: Props) {
  // Filter to only show available native languages (can't learn your own language)
  const nativeLanguageOptions = availableNativeLanguages
    .filter(code => code !== targetLang && languageInfo[code])
    .map(code => ({ code, info: languageInfo[code] }));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNativeLang = e.target.value;
    window.location.href = `/learn/${newNativeLang}/${targetLang}/`;
  };

  return (
    <div className="native-lang-select inline-flex items-center gap-2">
      <span className="text-sm text-gray-500">Articles in:</span>
      <select
        id="native-lang-dropdown"
        className="native-dropdown px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer border-none outline-none appearance-none pr-8"
        value={currentNativeLang}
        onChange={handleChange}
      >
        {nativeLanguageOptions.map(({ code, info }) => (
          <option key={code} value={code}>
            {info.flag} {info.nativeName}
          </option>
        ))}
      </select>
      <svg className="w-3 h-3 text-gray-400 -ml-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
