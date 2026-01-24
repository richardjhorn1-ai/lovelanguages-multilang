import React from 'react';
import { BRAND } from './heroConstants';

// Highlight component for colored keywords - SUBTLE glow
export const Highlight: React.FC<{
  children: React.ReactNode;
  isStudent: boolean;
  glow?: boolean;
  underline?: boolean;
}> = ({ children, isStudent, glow, underline }) => (
  <span
    className="transition-all duration-300 relative inline"
    style={{
      color: isStudent ? BRAND.primary : BRAND.teal,
      textShadow: glow
        ? `0 0 20px ${isStudent ? 'rgba(255, 71, 97, 0.25)' : 'rgba(20, 184, 166, 0.25)'}`
        : 'none',
      fontWeight: 'inherit',
    }}
  >
    {children}
    {underline && (
      <span
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
        style={{
          background: `linear-gradient(90deg, ${isStudent ? BRAND.primary : BRAND.teal}, ${isStudent ? '#FF6B81' : '#2dd4bf'})`,
          animation: 'underline-draw 0.8s ease-out 0.3s forwards',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
        }}
      />
    )}
  </span>
);

// Helper to render text with multiple highlights and optional links
export const renderWithHighlights = (
  text: string,
  highlights: string[],
  isStudent: boolean,
  underlinedPhrase?: string,
  links?: Record<string, string> // Maps text to URL
): React.ReactNode => {
  if (!highlights.length && !underlinedPhrase) return text;

  // Build regex pattern for all highlights
  const allPatterns = [...highlights];
  if (underlinedPhrase && !highlights.includes(underlinedPhrase)) {
    allPatterns.push(underlinedPhrase);
  }

  // Sort by length (longest first) to avoid partial matches
  allPatterns.sort((a, b) => b.length - a.length);

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${allPatterns.map(escapeRegex).join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isHighlight = allPatterns.some(h => h.toLowerCase() === part.toLowerCase());
    const isUnderlined = underlinedPhrase && part.toLowerCase() === underlinedPhrase.toLowerCase();

    // Check if this part has a link
    const linkUrl = links ? Object.entries(links).find(([linkText]) =>
      linkText.toLowerCase() === part.toLowerCase()
    )?.[1] : undefined;

    if (isHighlight) {
      const highlighted = (
        <Highlight key={i} isStudent={isStudent} glow underline={isUnderlined}>
          {part}
        </Highlight>
      );

      if (linkUrl) {
        return (
          <a
            key={i}
            href={linkUrl}
            className="hover:opacity-80 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            {highlighted}
          </a>
        );
      }
      return highlighted;
    }
    return part;
  });
};
