'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LanguageInfo {
  flag: string;
  name: string;
  nativeName: string;
}

interface Props {
  currentLang: string;
  nativeLang?: string;
  languageInfo: Record<string, LanguageInfo>;
  languageCounts: Record<string, number>;
}

export default function LanguageSelector({ currentLang, nativeLang = 'en', languageInfo, languageCounts }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const currentInfo = languageInfo[currentLang];

  // Sort languages: those with articles first, then alphabetically
  // Filter out the native language (can't learn your own language)
  const sortedLanguages = Object.entries(languageInfo)
    .filter(([code]) => code !== nativeLang)
    .sort(([codeA], [codeB]) => {
      const countA = languageCounts[codeA] || 0;
      const countB = languageCounts[codeB] || 0;
      // Languages with articles come first
      if (countA > 0 && countB === 0) return -1;
      if (countB > 0 && countA === 0) return 1;
      // Then sort by name
      return languageInfo[codeA].name.localeCompare(languageInfo[codeB].name);
    });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`language-selector relative inline-block${isOpen ? ' open' : ''}`} ref={selectorRef}>
      <button
        type="button"
        className="selector-trigger flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-accent hover:shadow-md transition-all cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleDropdown}
      >
        <span className="text-xl">{currentInfo.flag}</span>
        <span className="font-medium text-gray-800">{currentInfo.name}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform chevron${isOpen ? ' rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`selector-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl transition-all z-50 max-h-96 overflow-y-auto ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Select Language
          </div>

          {sortedLanguages.map(([code, info]) => {
            const count = languageCounts[code] || 0;
            const isActive = code === currentLang;
            const hasArticles = count > 0;

            return (
              <a
                key={code}
                href={`/learn/${nativeLang}/${code}/`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : hasArticles
                      ? 'hover:bg-gray-50 text-gray-700'
                      : 'hover:bg-gray-50 text-gray-400'
                }`}
              >
                <span className="text-2xl">{info.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isActive ? 'text-accent' : ''}`}>
                    {info.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {info.nativeName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {count > 0 ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count} {count === 1 ? 'article' : 'articles'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">Coming soon</span>
                  )}
                  {isActive && (
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </a>
            );
          })}
        </div>

        <div className="border-t border-gray-100 p-3">
          <a
            href="/learn/"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View All Languages
          </a>
        </div>
      </div>

      <style>{`
        .selector-dropdown {
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }

        .selector-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .selector-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .selector-dropdown::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
