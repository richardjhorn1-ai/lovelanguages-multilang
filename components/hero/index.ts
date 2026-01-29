// Hero sub-components - extracted for readability
// Main Hero.tsx imports these components

export { BRAND, POPULAR_LANGUAGES } from './heroConstants';
export type { HeroRole, SelectionStep } from './heroConstants';

export { Highlight, renderWithHighlights } from './heroHighlighting';

export { default as InteractiveHearts } from './InteractiveHearts';
export { default as WordParticleEffect } from './WordParticleEffect';
export { default as Section, LOGO_PATH, LOGO_DETAIL_PATHS } from './Section';
export { default as MobileSection } from './MobileSection';
export { default as LanguageGrid } from './LanguageGrid';
export { default as LoginForm } from './LoginForm';
export { default as LanguageIndicator } from './LanguageIndicator';

// Re-export existing hero components
export { GameShowcase } from './GameShowcase';
export { HeroFAQ, HeroRALL, HeroBlog, HeroFooter } from './HeroBottomSections';
