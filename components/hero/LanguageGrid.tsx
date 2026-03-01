import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND, POPULAR_LANGUAGES } from './heroConstants';
import { ICONS } from '../../constants';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';

interface LanguageGridProps {
  onSelect: (code: string) => void;
  selectedCode?: string | null;
  excludeCode?: string | null;
  isStudent: boolean;
  title: string;
  subtitle: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const LanguageGrid: React.FC<LanguageGridProps> = ({
  onSelect,
  selectedCode,
  excludeCode,
  isStudent,
  title,
  subtitle,
  onBack,
  showBackButton
}) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;
  const accentLight = isStudent ? BRAND.light : BRAND.tealLight;

  // Filter out excluded language
  const availableLanguages = Object.values(LANGUAGE_CONFIGS).filter(
    lang => lang.code !== excludeCode
  );

  // Split into popular and other, always showing exactly 8 in the top grid
  const VISIBLE_COUNT = 8;
  const popular = availableLanguages.filter(lang => POPULAR_LANGUAGES.includes(lang.code));
  const other = availableLanguages.filter(lang => !POPULAR_LANGUAGES.includes(lang.code));
  // If excluding a popular language leaves fewer than 8, pull from other to fill
  const popularLanguages = popular.length >= VISIBLE_COUNT
    ? popular.slice(0, VISIBLE_COUNT)
    : [...popular, ...other.slice(0, VISIBLE_COUNT - popular.length)];
  const otherLanguages = availableLanguages.filter(lang => !popularLanguages.includes(lang));

  return (
    <div className="w-full max-w-xl mx-auto">
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-scale-label font-bold transition-all hover:opacity-70"
          style={{ color: accentColor }}
        >
          <ICONS.ChevronLeft className="w-4 h-4" />
          {t('hero.languageSelector.back')}
        </button>
      )}

      <h2 className="text-2xl md:text-3xl font-black font-header mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <p className="text-scale-body mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>
        {subtitle}
      </p>

      {/* Popular languages - always visible */}
      <div className="grid grid-cols-4 gap-2.5">
        {popularLanguages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105"
            style={{
              borderColor: selectedCode === lang.code ? accentColor : 'var(--border-color)',
              backgroundColor: selectedCode === lang.code ? accentLight : 'var(--bg-card)',
              boxShadow: selectedCode === lang.code ? `0 4px 12px ${accentShadow}, 0 0 0 2px ${accentColor}` : 'none',
            }}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-scale-micro font-bold text-[var(--text-primary)]">{t(`languageNames.${lang.code}`)}</span>
          </button>
        ))}
      </div>

      {/* Show more button - styled pill */}
      {otherLanguages.length > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-5 mx-auto flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all duration-300 hover:scale-105 group"
          style={{
            borderColor: accentColor,
            backgroundColor: 'transparent',
          }}
        >
          <span className="text-scale-label font-bold" style={{ color: accentColor }}>
            {t('hero.languageSelector.showAll')}
          </span>
          <span className="text-scale-caption font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: accentLight, color: accentColor }}>
            +{otherLanguages.length}
          </span>
          <ICONS.ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" style={{ color: accentColor }} />
        </button>
      )}

      {/* Expanded languages - smooth slide down */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          showAll ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Divider with label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('hero.languageSelector.moreLanguages')}</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {/* Other languages grid */}
        <div className="grid grid-cols-5 gap-2">
          {otherLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105"
              style={{
                borderColor: selectedCode === lang.code ? accentColor : 'var(--border-color)',
                backgroundColor: selectedCode === lang.code ? accentLight : 'var(--bg-card)',
                boxShadow: selectedCode === lang.code ? `0 2px 8px ${accentShadow}, 0 0 0 2px ${accentColor}` : 'none',
              }}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-scale-micro font-bold text-[var(--text-secondary)] truncate w-full text-center">{t(`languageNames.${lang.code}`)}</span>
            </button>
          ))}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 hover:opacity-70"
          style={{ backgroundColor: accentLight, color: accentColor }}
        >
          <span className="text-scale-caption font-bold">{t('hero.languageSelector.showLess')}</span>
          <ICONS.ChevronUp className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default LanguageGrid;
