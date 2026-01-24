import React from 'react';
import { BRAND } from './heroConstants';
import { renderWithHighlights } from './heroHighlighting';
import { LOGO_PATH } from './Section';

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
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

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
