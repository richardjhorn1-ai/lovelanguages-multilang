import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../../constants/language-config';
import { BRAND } from './heroConstants';

interface NativeLanguagePillProps {
  nativeLanguage: string | null;
  isStudent: boolean;
  onSelect: (code: string) => void;
}

const NativeLanguagePill: React.FC<NativeLanguagePillProps> = ({
  nativeLanguage,
  isStudent,
  onSelect,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  const currentLang = nativeLanguage ? LANGUAGE_CONFIGS[nativeLanguage] : LANGUAGE_CONFIGS['en'];

  // Close on outside click and touchstart
  useEffect(() => {
    if (!open) return;

    const handleClose = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
    };
  }, [open]);

  const handleSelect = (code: string) => {
    // Close dropdown BEFORE triggering i18n change to avoid UI flash
    setOpen(false);
    onSelect(code);
  };

  return (
    <div ref={containerRef} className="relative inline-block" style={{ zIndex: 30 }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all font-bold text-scale-label"
        style={{
          borderColor: open ? accentColor : '#e5e7eb',
          backgroundColor: open ? (isStudent ? BRAND.light : BRAND.tealLight) : '#ffffff',
          color: '#374151',
        }}
      >
        <span>{t('onboarding.languageConfirm.iSpeak')}</span>
        <span className="text-lg">{currentLang?.flag}</span>
        <span className="font-bold">{currentLang?.nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-64 max-h-72 overflow-y-auto rounded-2xl border shadow-xl bg-white py-2"
          style={{ borderColor: '#e5e7eb', zIndex: 31 }}
        >
          {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map(code => {
            const lang = LANGUAGE_CONFIGS[code];
            if (!lang) return null;
            const isSelected = code === nativeLanguage;
            return (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: isSelected ? (isStudent ? BRAND.light : BRAND.tealLight) : undefined,
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-scale-label text-gray-700">{lang.nativeName}</span>
                {isSelected && (
                  <svg className="w-4 h-4 ml-auto" fill={accentColor} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NativeLanguagePill;
