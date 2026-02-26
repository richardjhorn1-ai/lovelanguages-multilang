// Shared constants and utilities for Hero page components

// Fixed brand colors for landing page
export const BRAND = {
  primary: '#F9B0C9',
  primaryHover: '#E89BB5',
  light: '#FBDCE8',
  border: '#FCDCE7',
  shadow: 'rgba(249, 176, 201, 0.25)',
  teal: '#B1C870',
  tealHover: '#99B058',
  tealLight: '#E4EDC8',
  tealShadow: 'rgba(177, 200, 112, 0.25)',
};

// Types
export type HeroRole = 'student' | 'tutor';
export type SelectionStep = 'language' | 'marketing';

// Popular languages shown first (rest hidden behind "Show all")
export const POPULAR_LANGUAGES = ['en', 'es', 'fr', 'de', 'pl', 'it', 'pt', 'nl'];
