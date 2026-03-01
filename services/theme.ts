// Theme types and constants

export type AccentColor = 'rose' | 'coral' | 'honey' | 'mint' | 'ocean' | 'wine';
export type DarkModeStyle = 'off' | 'midnight' | 'charcoal' | 'black';
export type FontSize = 'small' | 'medium' | 'large';
export type FontPreset = 'classic' | 'modern' | 'playful';
export type FontWeight = 'light' | 'regular' | 'bold';
export type BackgroundStyle = 'tinted' | 'clean';

export interface ThemeSettings {
  accentColor: AccentColor;
  darkMode: DarkModeStyle;
  fontSize: FontSize;
  fontPreset: FontPreset;
  fontWeight: FontWeight;
  backgroundStyle: BackgroundStyle;
}

// Colour variant shape — shared by primary and secondary
interface ColorVariants {
  primary: string;
  primaryHover: string;
  light: string;
  lightHover: string;
  dark: string;
  darkHover: string;
  text: string;
  border: string;
  borderDark: string;
  shadow: string;
}

// Accent color palette with primary + secondary colour pairs
export const ACCENT_COLORS: Record<AccentColor, {
  name: string;
} & ColorVariants & {
  secondary: ColorVariants;
}> = {
  rose: {
    name: 'Rose & Gold',
    // Primary: warm pink
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
    // Secondary: gold
    secondary: {
      primary: '#FFD93B',
      primaryHover: '#E8C535',
      light: '#FFFBEB',
      lightHover: '#FEF3C7',
      dark: 'rgba(255, 217, 59, 0.15)',
      darkHover: 'rgba(255, 217, 59, 0.25)',
      text: '#A16207',
      border: '#FDE68A',
      borderDark: '#854D0E',
      shadow: 'rgba(255, 217, 59, 0.25)',
    },
  },
  coral: {
    name: 'Coral & Pink',
    // Primary: coral/orange-red
    primary: '#FF5831',
    primaryHover: '#E84F2C',
    light: '#FFF4F1',
    lightHover: '#FFE6E0',
    dark: 'rgba(255, 88, 49, 0.15)',
    darkHover: 'rgba(255, 88, 49, 0.25)',
    text: '#C2410C',
    border: '#FDBA9A',
    borderDark: '#9A3412',
    shadow: 'rgba(255, 88, 49, 0.25)',
    // Secondary: bubblegum pink
    secondary: {
      primary: '#FF7BDD',
      primaryHover: '#E86FC8',
      light: '#FFF0FB',
      lightHover: '#FFE4F7',
      dark: 'rgba(255, 123, 221, 0.15)',
      darkHover: 'rgba(255, 123, 221, 0.25)',
      text: '#A8329A',
      border: '#F9C4ED',
      borderDark: '#86198F',
      shadow: 'rgba(255, 123, 221, 0.25)',
    },
  },
  honey: {
    name: 'Gold & Orange',
    // Primary: warm gold
    primary: '#FFD93B',
    primaryHover: '#E8C535',
    light: '#FFFBEB',
    lightHover: '#FEF3C7',
    dark: 'rgba(255, 217, 59, 0.15)',
    darkHover: 'rgba(255, 217, 59, 0.25)',
    text: '#A16207',
    border: '#FDE68A',
    borderDark: '#854D0E',
    shadow: 'rgba(255, 217, 59, 0.25)',
    // Secondary: tangerine orange
    secondary: {
      primary: '#FF8B0D',
      primaryHover: '#E87E0C',
      light: '#FFF7ED',
      lightHover: '#FFEDD5',
      dark: 'rgba(255, 139, 13, 0.15)',
      darkHover: 'rgba(255, 139, 13, 0.25)',
      text: '#C2410C',
      border: '#FDBA74',
      borderDark: '#9A3412',
      shadow: 'rgba(255, 139, 13, 0.25)',
    },
  },
  mint: {
    name: 'Mint & Ice',
    // Primary: mint green
    primary: '#31DB92',
    primaryHover: '#2CC583',
    light: '#ECFDF5',
    lightHover: '#D1FAE5',
    dark: 'rgba(49, 219, 146, 0.15)',
    darkHover: 'rgba(49, 219, 146, 0.25)',
    text: '#047857',
    border: '#A7F3D0',
    borderDark: '#065F46',
    shadow: 'rgba(49, 219, 146, 0.25)',
    // Secondary: ice blue
    secondary: {
      primary: '#96DEEA',
      primaryHover: '#7BCAD6',
      light: '#F0FAFB',
      lightHover: '#E0F5F8',
      dark: 'rgba(150, 222, 234, 0.15)',
      darkHover: 'rgba(150, 222, 234, 0.25)',
      text: '#0E7490',
      border: '#A5F3FC',
      borderDark: '#155E75',
      shadow: 'rgba(150, 222, 234, 0.25)',
    },
  },
  ocean: {
    name: 'Blue & Lilac',
    // Primary: royal blue
    primary: '#1569FF',
    primaryHover: '#1260E6',
    light: '#EFF6FF',
    lightHover: '#DBEAFE',
    dark: 'rgba(21, 105, 255, 0.15)',
    darkHover: 'rgba(21, 105, 255, 0.25)',
    text: '#1D4ED8',
    border: '#93C5FD',
    borderDark: '#1E40AF',
    shadow: 'rgba(21, 105, 255, 0.25)',
    // Secondary: soft lilac
    secondary: {
      primary: '#9292FF',
      primaryHover: '#7A7AE6',
      light: '#F5F3FF',
      lightHover: '#EDE9FE',
      dark: 'rgba(146, 146, 255, 0.15)',
      darkHover: 'rgba(146, 146, 255, 0.25)',
      text: '#5B21B6',
      border: '#C4B5FD',
      borderDark: '#6D28D9',
      shadow: 'rgba(146, 146, 255, 0.25)',
    },
  },
  wine: {
    name: 'Wine & Rose',
    // Primary: deep wine red
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
    // Secondary: bubblegum pink
    secondary: {
      primary: '#FF7BDD',
      primaryHover: '#E86FC8',
      light: '#FFF0FB',
      lightHover: '#FFE4F7',
      dark: 'rgba(255, 123, 221, 0.15)',
      darkHover: 'rgba(255, 123, 221, 0.25)',
      text: '#A8329A',
      border: '#F9C4ED',
      borderDark: '#86198F',
      shadow: 'rgba(255, 123, 221, 0.25)',
    },
  },
};

// Migration map: old accent keys → new accent keys
const ACCENT_MIGRATION: Record<string, AccentColor> = {
  blush: 'coral',
  lavender: 'ocean',
  teal: 'mint',
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

// Text scale type for mobile and desktop values
interface TextScale {
  micro: string;
  caption: string;
  label: string;
  button: string;
  body: string;
  heading: string;
}

// Font size values with full text scale system
// Each theme size defines mobile and desktop text scales
// Desktop adds approximately +2px to each category for better readability on larger screens
export const FONT_SIZES: Record<FontSize, {
  name: string;
  base: string;
  mobile: TextScale;
  desktop: TextScale;
}> = {
  small: {
    name: 'Small',
    base: '14px',
    mobile: {
      micro: '10px',
      caption: '11px',
      label: '13px',
      button: '14px',
      body: '14px',
      heading: '18px',
    },
    desktop: {
      micro: '12px',
      caption: '13px',
      label: '15px',
      button: '16px',
      body: '16px',
      heading: '20px',
    },
  },
  medium: {
    name: 'Medium',
    base: '16px',
    mobile: {
      micro: '11px',
      caption: '12px',
      label: '14px',
      button: '15px',
      body: '16px',
      heading: '20px',
    },
    desktop: {
      micro: '13px',
      caption: '14px',
      label: '16px',
      button: '17px',
      body: '18px',
      heading: '22px',
    },
  },
  large: {
    name: 'Large',
    base: '18px',
    mobile: {
      micro: '12px',
      caption: '14px',
      label: '16px',
      button: '17px',
      body: '18px',
      heading: '24px',
    },
    desktop: {
      micro: '14px',
      caption: '16px',
      label: '18px',
      button: '19px',
      body: '20px',
      heading: '26px',
    },
  },
};

// Font presets - all support Latin, Cyrillic, Greek (18 languages)
export const FONT_PRESETS: Record<FontPreset, {
  name: string;
  header: string;
  body: string;
}> = {
  classic: {
    name: 'Classic',
    header: "'Nunito', sans-serif",
    body: "'Manrope', sans-serif",
  },
  modern: {
    name: 'Modern',
    header: "'Montserrat', sans-serif",
    body: "'Inter', sans-serif",
  },
  playful: {
    name: 'Playful',
    header: "'Quicksand', sans-serif",
    body: "'Source Sans 3', sans-serif",
  },
};

// Font weight values (affects text and icons)
export const FONT_WEIGHTS: Record<FontWeight, {
  name: string;
  textWeight: number;
  iconWeight: string;
}> = {
  light: { name: 'Light', textWeight: 400, iconWeight: 'light' },
  regular: { name: 'Regular', textWeight: 500, iconWeight: 'regular' },
  bold: { name: 'Bold', textWeight: 700, iconWeight: 'bold' },
};

// Default theme settings
export const DEFAULT_THEME: ThemeSettings = {
  accentColor: 'rose',
  darkMode: 'off',
  fontSize: 'medium',
  fontPreset: 'classic',
  fontWeight: 'regular',
  backgroundStyle: 'tinted',
};

// localStorage key
export const THEME_STORAGE_KEY = 'love_languages_theme';

// Load theme from localStorage
export function loadTheme(): ThemeSettings {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migrate old accent keys to new ones
      let rawAccent = parsed.accentColor as string;
      if (rawAccent && ACCENT_MIGRATION[rawAccent]) {
        rawAccent = ACCENT_MIGRATION[rawAccent];
      }

      const accentColor = rawAccent && ACCENT_COLORS[rawAccent as AccentColor]
        ? (rawAccent as AccentColor)
        : DEFAULT_THEME.accentColor;
      const darkMode = parsed.darkMode && DARK_MODE_STYLES[parsed.darkMode as DarkModeStyle]
        ? (parsed.darkMode as DarkModeStyle)
        : DEFAULT_THEME.darkMode;
      const fontSize = parsed.fontSize && FONT_SIZES[parsed.fontSize as FontSize]
        ? (parsed.fontSize as FontSize)
        : DEFAULT_THEME.fontSize;
      const fontPreset = parsed.fontPreset && FONT_PRESETS[parsed.fontPreset as FontPreset]
        ? (parsed.fontPreset as FontPreset)
        : DEFAULT_THEME.fontPreset;
      const fontWeight = parsed.fontWeight && FONT_WEIGHTS[parsed.fontWeight as FontWeight]
        ? (parsed.fontWeight as FontWeight)
        : DEFAULT_THEME.fontWeight;
      const backgroundStyle = parsed.backgroundStyle === 'clean' ? 'clean' as BackgroundStyle : 'tinted' as BackgroundStyle;

      return { accentColor, darkMode, fontSize, fontPreset, fontWeight, backgroundStyle };
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

// Migrate old accent colour values from Supabase profiles
export function migrateAccentColor(raw: string | undefined): AccentColor {
  if (!raw) return DEFAULT_THEME.accentColor;
  if (ACCENT_MIGRATION[raw]) return ACCENT_MIGRATION[raw];
  if (ACCENT_COLORS[raw as AccentColor]) return raw as AccentColor;
  return DEFAULT_THEME.accentColor;
}

// Apply theme CSS variables to document
export function applyTheme(theme: ThemeSettings): void {
  const root = document.documentElement;
  const accent = ACCENT_COLORS[theme.accentColor];
  const secondary = accent.secondary;
  const darkMode = DARK_MODE_STYLES[theme.darkMode];
  const fontSize = FONT_SIZES[theme.fontSize];
  const fontPreset = FONT_PRESETS[theme.fontPreset];
  const fontWeight = FONT_WEIGHTS[theme.fontWeight];
  const isDark = theme.darkMode !== 'off';

  // Primary accent palette
  root.style.setProperty('--accent-color', accent.primary);
  root.style.setProperty('--accent-hover', accent.primaryHover);
  root.style.setProperty('--accent-light', isDark ? accent.dark : accent.light);
  root.style.setProperty('--accent-light-hover', isDark ? accent.darkHover : accent.lightHover);
  root.style.setProperty('--accent-text', isDark ? accent.primary : accent.text);
  root.style.setProperty('--accent-border', isDark ? accent.borderDark : accent.border);
  root.style.setProperty('--accent-shadow', accent.shadow);

  // Secondary accent palette
  root.style.setProperty('--secondary-color', secondary.primary);
  root.style.setProperty('--secondary-hover', secondary.primaryHover);
  root.style.setProperty('--secondary-light', isDark ? secondary.dark : secondary.light);
  root.style.setProperty('--secondary-light-hover', isDark ? secondary.darkHover : secondary.lightHover);
  root.style.setProperty('--secondary-text', isDark ? secondary.primary : secondary.text);
  root.style.setProperty('--secondary-border', isDark ? secondary.borderDark : secondary.border);
  root.style.setProperty('--secondary-shadow', secondary.shadow);

  // Semantic feedback colours (fixed — not theme-dependent)
  root.style.setProperty('--color-correct', '#10B981');
  root.style.setProperty('--color-correct-bg', isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)');
  root.style.setProperty('--color-incorrect', '#EF4444');
  root.style.setProperty('--color-incorrect-bg', isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)');
  root.style.setProperty('--color-warning', '#F59E0B');
  root.style.setProperty('--color-warning-bg', isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)');

  // App background mode
  root.style.setProperty('--bg-app',
    theme.backgroundStyle === 'clean'
      ? darkMode.bgPrimary
      : (isDark ? `color-mix(in srgb, ${accent.primary} 6%, ${darkMode.bgPrimary})` : accent.light)
  );
  root.dataset.bgStyle = theme.backgroundStyle;

  // Background and text colors
  root.style.setProperty('--bg-primary', darkMode.bgPrimary);
  root.style.setProperty('--bg-card', darkMode.bgCard);
  root.style.setProperty('--text-primary', darkMode.textPrimary);
  root.style.setProperty('--text-secondary', darkMode.textSecondary);
  root.style.setProperty('--border-color', darkMode.border);

  // Font size base
  root.style.setProperty('--font-size-base', fontSize.base);
  root.style.fontSize = fontSize.base;

  // Text scale system - apply values based on screen size
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const scale = isDesktop ? fontSize.desktop : fontSize.mobile;
  root.style.setProperty('--text-micro', scale.micro);
  root.style.setProperty('--text-caption', scale.caption);
  root.style.setProperty('--text-label', scale.label);
  root.style.setProperty('--text-button', scale.button);
  root.style.setProperty('--text-body', scale.body);
  root.style.setProperty('--text-heading', scale.heading);

  // Font preset (header and body fonts)
  root.style.setProperty('--font-header', fontPreset.header);
  root.style.setProperty('--font-body', fontPreset.body);

  // Font weight (affects text and icons)
  root.style.setProperty('--font-weight-base', String(fontWeight.textWeight));
  root.dataset.iconWeight = fontWeight.iconWeight;

  // Add/remove dark class for components that need it
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Helper to update only text scale values (for resize events)
function applyTextScale(fontSize: FontSize): void {
  const root = document.documentElement;
  const fontSizeConfig = FONT_SIZES[fontSize];
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const scale = isDesktop ? fontSizeConfig.desktop : fontSizeConfig.mobile;

  root.style.setProperty('--text-micro', scale.micro);
  root.style.setProperty('--text-caption', scale.caption);
  root.style.setProperty('--text-label', scale.label);
  root.style.setProperty('--text-button', scale.button);
  root.style.setProperty('--text-body', scale.body);
  root.style.setProperty('--text-heading', scale.heading);
}

// Set up responsive text scale listener
// Call this once on app initialization to handle screen resize
let resizeCleanup: (() => void) | null = null;

export function setupResponsiveTextScale(fontSize: FontSize): void {
  // Clean up previous listener if exists
  if (resizeCleanup) {
    resizeCleanup();
  }

  const mediaQuery = window.matchMedia('(min-width: 768px)');

  const handleChange = () => {
    applyTextScale(fontSize);
  };

  // Use addEventListener for better browser support
  mediaQuery.addEventListener('change', handleChange);

  resizeCleanup = () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}
