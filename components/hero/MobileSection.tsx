import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND } from './heroConstants';
import { renderWithHighlights } from './heroHighlighting';
import { LOGO_PATH, LOGO_DETAIL_PATHS } from './Section';
import { StoryContent, OfferContent } from './HeroBottomSections';
import { ICONS } from '../../constants';

interface MobileSectionProps {
  headline: string;
  headlineHighlights: string[];
  subhead?: string;
  copy: string;
  copyHighlights?: string[];
  underlinedPhrase?: string;
  copyLinks?: Record<string, string>;
  index: number;
  isStudent: boolean;
  showLogo?: boolean;
}

const MobileSection: React.FC<MobileSectionProps> = ({
  headline,
  headlineHighlights,
  subhead,
  copy,
  copyHighlights,
  underlinedPhrase,
  copyLinks,
  index,
  isStudent,
  showLogo
}) => {
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  // Tab state for section 0
  const [activeTab, setActiveTab] = useState<'method' | 'story' | 'offer'>('method');
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Auto-hide scroll hint after 3 seconds
  useEffect(() => {
    if (index !== 0) return;
    const timer = setTimeout(() => setShowScrollHint(false), 3000);
    return () => clearTimeout(timer);
  }, [index]);

  const tabs = [
    { key: 'method' as const, label: t('hero.bottomSections.rall.tabs.method') },
    { key: 'story' as const, label: t('hero.bottomSections.rall.tabs.story') },
    { key: 'offer' as const, label: t('hero.bottomSections.rall.tabs.offer') },
  ];

  // Section 0 gets the tabbed layout
  if (index === 0) {
    return (
      <div
        data-section={index}
        className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-between px-6 py-4 relative overflow-hidden"
        style={{ scrollSnapAlign: 'start' }}
      >
        <div className="section-content visible overflow-hidden flex-1 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-12 h-12 shrink-0"
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d={LOGO_PATH} />
                {LOGO_DETAIL_PATHS.map((d, i) => <path key={i} d={d} />)}
              </g>
            </svg>
            <h1 className="text-xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>

          {/* Content Area - Changes based on tab */}
          <div className="flex-1 flex flex-col justify-center">
            {activeTab === 'method' && (
              <div>
                <h2
                  className="text-2xl font-black font-header leading-[1.15] mb-3 tracking-tight"
                  style={{ color: '#1a1a2e' }}
                >
                  {renderWithHighlights(headline, headlineHighlights, isStudent)}
                </h2>
                <p className="text-scale-label leading-relaxed font-medium" style={{ color: '#4b5563' }}>
                  {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase, copyLinks)}
                </p>
                <div
                  className="mt-4 h-1 w-16 rounded-full"
                  style={{ backgroundColor: accentColor, opacity: 0.3 }}
                />
              </div>
            )}
            {activeTab === 'story' && <StoryContent accentColor={accentColor} t={t} />}
            {activeTab === 'offer' && <OfferContent accentColor={accentColor} t={t} isStudent={isStudent} />}
          </div>
        </div>

        {/* Segmented Control + Scroll Hint - BOTTOM */}
        <div className="pt-2 pb-1 flex flex-col items-center">
          {/* Segmented Control */}
          <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#f3f4f6' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={activeTab === tab.key
                  ? { backgroundColor: accentColor, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                  : { color: '#6b7280' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scroll Hint */}
          {showScrollHint && (
            <div className="flex flex-col items-center mt-2 animate-bounce">
              <span className="text-[10px] font-medium mb-0.5" style={{ color: '#9ca3af' }}>
                {t('hero.bottomSections.rall.scrollHint')}
              </span>
              <ICONS.ChevronDown className="w-3 h-3" style={{ color: '#9ca3af' }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-section={index}
      className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center px-6 py-4 relative overflow-hidden"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="section-content visible overflow-hidden">
        {/* Show logo only on first section */}
        {showLogo && (
          <div className="flex items-center gap-3 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-16 h-16 shrink-0"
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d={LOGO_PATH} />
                {LOGO_DETAIL_PATHS.map((d, i) => <path key={i} d={d} />)}
              </g>
            </svg>
            <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>
        )}

        <h2
          className="text-2xl font-black font-header leading-[1.15] mb-3 tracking-tight"
          style={{ color: '#1a1a2e' }}
        >
          {renderWithHighlights(headline, headlineHighlights, isStudent)}
        </h2>

        {subhead && (
          <p className="text-scale-body mb-3 font-semibold italic" style={{ color: accentColor }}>
            {subhead}
          </p>
        )}

        <p className="text-scale-label leading-relaxed font-medium" style={{ color: '#4b5563' }}>
          {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase, copyLinks)}
        </p>

        {/* Visual accent bar */}
        <div
          className="mt-4 h-1 w-16 rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.3 }}
        />
      </div>
    </div>
  );
};

export default MobileSection;
