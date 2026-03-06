'use client';

import React from 'react';

interface Props {
  nativeLang?: string;
  targetLang?: string;
}

// Supported native languages for content (only languages with article content)
const SUPPORTED_NATIVE_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

const LANGUAGE_INFO: Record<string, { flag: string; nativeName: string }> = {
  en: { flag: '\u{1F1EC}\u{1F1E7}', nativeName: 'English' },
  es: { flag: '\u{1F1EA}\u{1F1F8}', nativeName: 'Espa\u00f1ol' },
  fr: { flag: '\u{1F1EB}\u{1F1F7}', nativeName: 'Fran\u00e7ais' },
  de: { flag: '\u{1F1E9}\u{1F1EA}', nativeName: 'Deutsch' },
  it: { flag: '\u{1F1EE}\u{1F1F9}', nativeName: 'Italiano' },
  pt: { flag: '\u{1F1F5}\u{1F1F9}', nativeName: 'Portugu\u00eas' },
  nl: { flag: '\u{1F1F3}\u{1F1F1}', nativeName: 'Nederlands' },
  pl: { flag: '\u{1F1F5}\u{1F1F1}', nativeName: 'Polski' },
  ru: { flag: '\u{1F1F7}\u{1F1FA}', nativeName: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  uk: { flag: '\u{1F1FA}\u{1F1E6}', nativeName: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430' },
  tr: { flag: '\u{1F1F9}\u{1F1F7}', nativeName: 'T\u00fcrk\u00e7e' },
  ro: { flag: '\u{1F1F7}\u{1F1F4}', nativeName: 'Rom\u00e2n\u0103' },
  sv: { flag: '\u{1F1F8}\u{1F1EA}', nativeName: 'Svenska' },
  no: { flag: '\u{1F1F3}\u{1F1F4}', nativeName: 'Norsk' },
  da: { flag: '\u{1F1E9}\u{1F1F0}', nativeName: 'Dansk' },
  cs: { flag: '\u{1F1E8}\u{1F1FF}', nativeName: '\u010ce\u0161tina' },
  el: { flag: '\u{1F1EC}\u{1F1F7}', nativeName: '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac' },
  hu: { flag: '\u{1F1ED}\u{1F1FA}', nativeName: 'Magyar' },
};

// Navigation UI translations
const NAV_TRANSLATIONS: Record<string, { compareApps: string; startLearning: string }> = {
  en: { compareApps: 'Compare Apps', startLearning: 'Start Learning' },
  es: { compareApps: 'Comparar Apps', startLearning: 'Empezar' },
  fr: { compareApps: 'Comparer', startLearning: 'Commencer' },
  de: { compareApps: 'Vergleichen', startLearning: 'Starten' },
  it: { compareApps: 'Confronta', startLearning: 'Inizia' },
  pt: { compareApps: 'Comparar', startLearning: 'Come\u00e7ar' },
  nl: { compareApps: 'Vergelijk', startLearning: 'Start' },
  pl: { compareApps: 'Por\u00f3wnaj', startLearning: 'Zacznij' },
  ru: { compareApps: '\u0421\u0440\u0430\u0432\u043d\u0438\u0442\u044c', startLearning: '\u041d\u0430\u0447\u0430\u0442\u044c' },
  uk: { compareApps: '\u041f\u043e\u0440\u0456\u0432\u043d\u044f\u0442\u0438', startLearning: '\u041f\u043e\u0447\u0430\u0442\u0438' },
  tr: { compareApps: 'Kar\u015f\u0131la\u015ft\u0131r', startLearning: 'Ba\u015fla' },
  ro: { compareApps: 'Compar\u0103', startLearning: '\u00cencepe' },
  sv: { compareApps: 'J\u00e4mf\u00f6r', startLearning: 'B\u00f6rja' },
  no: { compareApps: 'Sammenlign', startLearning: 'Start' },
  da: { compareApps: 'Sammenlign', startLearning: 'Start' },
  cs: { compareApps: 'Porovnat', startLearning: 'Za\u010d\u00edt' },
  el: { compareApps: '\u03a3\u03cd\u03b3\u03ba\u03c1\u03b9\u03c3\u03b7', startLearning: '\u039e\u03b5\u03ba\u03b9\u03bd\u03ae\u03c3\u03c4\u03b5' },
  hu: { compareApps: '\u00d6sszehasonl\u00edt\u00e1s', startLearning: 'Kezd\u00e9s' },
};

export default function BlogNavigation({ nativeLang = 'en', targetLang }: Props) {
  const navText = NAV_TRANSLATIONS[nativeLang] || NAV_TRANSLATIONS.en;

  // Build logo href - go to current language hub page
  const logoHref = `/learn/${nativeLang}/`;

  // Get native language options (exclude target language if set - can't learn your own language)
  const nativeLanguageOptions = SUPPORTED_NATIVE_LANGS
    .filter(code => (!targetLang || code !== targetLang) && LANGUAGE_INFO[code])
    .map(code => ({ code, ...LANGUAGE_INFO[code] }));

  const handleNativeLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    window.location.href = `/learn/${e.target.value}/`;
  };

  const handleCompareChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const comparison = e.target.value;
    if (comparison) {
      window.location.href = `/compare/${nativeLang}/${comparison}/`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 blog-glass-nav">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Native Language Selector + Logo */}
          <div className="flex items-center gap-3">
            {/* Native Language Dropdown - shows when we have multiple language options */}
            {nativeLanguageOptions.length > 1 && (
              <select
                id="nav-native-lang"
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer border-none outline-none"
                value={nativeLang}
                onChange={handleNativeLangChange}
              >
                {nativeLanguageOptions.map(({ code, flag, nativeName }) => (
                  <option key={code} value={code}>
                    {flag} {nativeName}
                  </option>
                ))}
              </select>
            )}

            {/* Logo */}
            <a href={logoHref} className="flex items-center gap-2 text-accent font-bold font-header text-lg hover:opacity-80 transition-opacity">
              <img src="/favicon.svg" alt="Love Languages" className="w-6 h-6" />
              <span className="hidden sm:inline">Love Languages</span>
            </a>
          </div>

          {/* Right: Compare Dropdown + CTA */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <select
                id="nav-compare"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer border-none outline-none appearance-none pr-8"
                defaultValue=""
                onChange={handleCompareChange}
              >
                <option value="" disabled>{navText.compareApps}</option>
                <option value="love-languages-vs-duolingo">vs Duolingo</option>
                <option value="love-languages-vs-babbel">vs Babbel</option>
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-accent text-white font-bold rounded-full hover:bg-accent/90 hover:shadow-md transition-all text-sm"
            >
              {navText.startLearning}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
