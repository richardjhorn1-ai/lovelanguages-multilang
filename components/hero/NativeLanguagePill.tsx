import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../../constants/language-config';
import { BRAND } from './heroConstants';
import { ICONS } from '../../constants';

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
        <ICONS.ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 w-64 max-h-72 overflow-y-auto rounded-2xl border shadow-xl bg-[var(--bg-card)] py-2"
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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-[var(--bg-primary)]"
                style={{
                  backgroundColor: isSelected ? (isStudent ? BRAND.light : BRAND.tealLight) : undefined,
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-scale-label text-[var(--text-primary)]">{lang.nativeName}</span>
                {isSelected && (
                  <ICONS.Check className="w-4 h-4 ml-auto" style={{ color: accentColor }} />
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
