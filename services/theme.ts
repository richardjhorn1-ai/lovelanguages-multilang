// Theme types and constants

export type AccentColor = 'rose' | 'blush' | 'lavender' | 'wine' | 'teal' | 'honey';
export type DarkModeStyle = 'off' | 'midnight' | 'charcoal' | 'black';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeSettings {
  accentColor: AccentColor;
  darkMode: DarkModeStyle;
  fontSize: FontSize;
}

// Accent color palette with variants for full theming
export const ACCENT_COLORS: Record<AccentColor, {
  name: string;
  primary: string;      // Main accent (buttons, active states)
  primaryHover: string; // Hover state
  light: string;        // Light backgrounds (light mode)
  lightHover: string;   // Light background hover
  dark: string;         // Dark mode accent backgrounds
  darkHover: string;    // Dark mode hover
  text: string;         // Text on light backgrounds
  border: string;       // Border color (light mode)
  borderDark: string;   // Border color (dark mode)
  shadow: string;       // Shadow color
}> = {
  rose: {
    name: 'Rose',
    primary: '#FF4761',
    primaryHover: '#E63E56',
    light: '#FFF0F3',
    lightHover: '#FFE4E9',
    dark: 'rgba(255, 71, 97, 0.15)',
    darkHover: 'rgba(255, 71, 97, 0.25)',
    text: '#BE123C',
    border: '#FECDD3',
    borderDark: '#9F1239',
    shadow: 'rgba(255, 71, 97, 0.25)',
  },
  blush: {
    name: 'Blush',
    primary: '#EC4899',
    primaryHover: '#DB2777',
    light: '#FDF2F8',
    lightHover: '#FCE7F3',
    dark: 'rgba(236, 72, 153, 0.15)',
    darkHover: 'rgba(236, 72, 153, 0.25)',
    text: '#BE185D',
    border: '#FBCFE8',
    borderDark: '#9D174D',
    shadow: 'rgba(236, 72, 153, 0.25)',
  },
  lavender: {
    name: 'Lavender',
    primary: '#A855F7',
    primaryHover: '#9333EA',
    light: '#FAF5FF',
    lightHover: '#F3E8FF',
    dark: 'rgba(168, 85, 247, 0.15)',
    darkHover: 'rgba(168, 85, 247, 0.25)',
    text: '#7E22CE',
    border: '#E9D5FF',
    borderDark: '#6B21A8',
    shadow: 'rgba(168, 85, 247, 0.25)',
  },
  wine: {
    name: 'Wine',
    primary: '#BE123C',
    primaryHover: '#9F1239',
    light: '#FFF1F2',
    lightHover: '#FFE4E6',
    dark: 'rgba(190, 18, 60, 0.15)',
    darkHover: 'rgba(190, 18, 60, 0.25)',
    text: '#881337',
    border: '#FECDD3',
    borderDark: '#881337',
    shadow: 'rgba(190, 18, 60, 0.25)',
  },
  teal: {
    name: 'Teal',
    primary: '#14B8A6',
    primaryHover: '#0D9488',
    light: '#F0FDFA',
    lightHover: '#CCFBF1',
    dark: 'rgba(20, 184, 166, 0.15)',
    darkHover: 'rgba(20, 184, 166, 0.25)',
    text: '#0F766E',
    border: '#99F6E4',
    borderDark: '#115E59',
    shadow: 'rgba(20, 184, 166, 0.25)',
  },
  honey: {
    name: 'Honey',
    primary: '#F59E0B',
    primaryHover: '#D97706',
    light: '#FFFBEB',
    lightHover: '#FEF3C7',
    dark: 'rgba(245, 158, 11, 0.15)',
    darkHover: 'rgba(245, 158, 11, 0.25)',
    text: '#B45309',
    border: '#FDE68A',
    borderDark: '#92400E',
    shadow: 'rgba(245, 158, 11, 0.25)',
  },
};

// Dark mode background colors
export const DARK_MODE_STYLES: Record<DarkModeStyle, {
  name: string;
  bgPrimary: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}> = {
  off: {
    name: 'Light',
    bgPrimary: '#fdfcfd',
    bgCard: '#ffffff',
    textPrimary: '#292F36',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
  },
  midnight: {
    name: 'Midnight',
    bgPrimary: '#1a1a2e',
    bgCard: '#2d2d44',
    textPrimary: '#f5f5f5',
    textSecondary: '#a1a1aa',
    border: '#3d3d5c',
  },
  charcoal: {
    name: 'Charcoal',
    bgPrimary: '#1f1f1f',
    bgCard: '#2a2a2a',
    textPrimary: '#f5f5f5',
    textSecondary: '#a1a1aa',
    border: '#3a3a3a',
  },
  black: {
    name: 'Black',
    bgPrimary: '#000000',
    bgCard: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    border: '#2a2a2a',
  },
};

// Font size values
export const FONT_SIZES: Record<FontSize, { name: string; base: string }> = {
  small: { name: 'Small', base: '14px' },
  medium: { name: 'Medium', base: '16px' },
  large: { name: 'Large', base: '18px' },
};

// Default theme settings
export const DEFAULT_THEME: ThemeSettings = {
  accentColor: 'rose',
  darkMode: 'off',
  fontSize: 'medium',
};

// localStorage key
export const THEME_STORAGE_KEY = 'love_languages_theme';

// Load theme from localStorage
export function loadTheme(): ThemeSettings {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that stored values are valid keys in their respective objects
      // This handles migration from old color schemes (coral, gold, sage, etc.)
      const accentColor = parsed.accentColor && ACCENT_COLORS[parsed.accentColor as AccentColor]
        ? (parsed.accentColor as AccentColor)
        : DEFAULT_THEME.accentColor;
      const darkMode = parsed.darkMode && DARK_MODE_STYLES[parsed.darkMode as DarkModeStyle]
        ? (parsed.darkMode as DarkModeStyle)
        : DEFAULT_THEME.darkMode;
      const fontSize = parsed.fontSize && FONT_SIZES[parsed.fontSize as FontSize]
        ? (parsed.fontSize as FontSize)
        : DEFAULT_THEME.fontSize;
      return { accentColor, darkMode, fontSize };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_THEME;
}

// Save theme to localStorage
export function saveTheme(theme: ThemeSettings): void {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

// Apply theme CSS variables to document
export function applyTheme(theme: ThemeSettings): void {
  const root = document.documentElement;
  const accent = ACCENT_COLORS[theme.accentColor];
  const darkMode = DARK_MODE_STYLES[theme.darkMode];
  const fontSize = FONT_SIZES[theme.fontSize];
  const isDark = theme.darkMode !== 'off';

  // Accent color palette
  root.style.setProperty('--accent-color', accent.primary);
  root.style.setProperty('--accent-hover', accent.primaryHover);
  root.style.setProperty('--accent-light', isDark ? accent.dark : accent.light);
  root.style.setProperty('--accent-light-hover', isDark ? accent.darkHover : accent.lightHover);
  root.style.setProperty('--accent-text', isDark ? accent.primary : accent.text);
  root.style.setProperty('--accent-border', isDark ? accent.borderDark : accent.border);
  root.style.setProperty('--accent-shadow', accent.shadow);

  // Background and text colors
  root.style.setProperty('--bg-primary', darkMode.bgPrimary);
  root.style.setProperty('--bg-card', darkMode.bgCard);
  root.style.setProperty('--text-primary', darkMode.textPrimary);
  root.style.setProperty('--text-secondary', darkMode.textSecondary);
  root.style.setProperty('--border-color', darkMode.border);

  // Font size
  root.style.setProperty('--font-size-base', fontSize.base);
  root.style.fontSize = fontSize.base;

  // Add/remove dark class for components that need it
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
