// Shared constants and utilities for Hero page components

// Fixed brand colors for landing page
export const BRAND = {
  primary: '#FF4761',
  primaryHover: '#E63E56',
  light: '#FFF0F3',
  border: '#FECDD3',
  shadow: 'rgba(255, 71, 97, 0.25)',
  teal: '#5568af',
  tealHover: '#475a9d',
  tealLight: '#edf0f8',
  tealShadow: 'rgba(85, 104, 175, 0.25)',
};

// Types
export type HeroRole = 'student' | 'tutor';
export type SelectionStep = 'language' | 'marketing';

// Popular languages shown first (rest hidden behind "Show all")
export const POPULAR_LANGUAGES = ['en', 'es', 'fr', 'de', 'pl', 'it', 'pt', 'nl'];
