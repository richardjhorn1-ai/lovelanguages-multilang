// Theme types and constants

export type AccentColor = 'rose' | 'blush' | 'lavender' | 'wine' | 'teal' | 'honey';
export type DarkModeStyle = 'off' | 'midnight' | 'charcoal' | 'black';
export type FontSize = 'small' | 'medium' | 'large';
export type FontPreset = 'classic' | 'modern' | 'playful';
export type FontWeight = 'light' | 'regular' | 'bold';

export interface ThemeSettings {
  accentColor: AccentColor;
  darkMode: DarkModeStyle;
  fontSize: FontSize;
  fontPreset: FontPreset;
  fontWeight: FontWeight;
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
    primary: '#C14060',
    primaryHover: '#A33652',
    light: '#F8D5DD',
    lightHover: '#F2C4CF',
    dark: 'rgba(193, 64, 96, 0.15)',
    darkHover: 'rgba(193, 64, 96, 0.25)',
    text: '#8B2D44',
    border: '#F5CDD6',
    borderDark: '#7A2338',
    shadow: 'rgba(193, 64, 96, 0.25)',
  },
  blush: {
    name: 'Blush',
    primary: '#F9B0C9',
    primaryHover: '#E89BB5',
    light: '#FBDCE8',
    lightHover: '#F7CCDD',
    dark: 'rgba(249, 176, 201, 0.15)',
    darkHover: 'rgba(249, 176, 201, 0.25)',
    text: '#A8607A',
    border: '#FCDCE7',
    borderDark: '#B8718A',
    shadow: 'rgba(249, 176, 201, 0.25)',
  },
  lavender: {
    name: 'Lavender',
    primary: '#A8B9E8',
    primaryHover: '#8FA3D9',
    light: '#DDE4F5',
    lightHover: '#CDD7F0',
    dark: 'rgba(168, 185, 232, 0.15)',
    darkHover: 'rgba(168, 185, 232, 0.25)',
    text: '#6B7DB8',
    border: '#D4DCEF',
    borderDark: '#5C6FA8',
    shadow: 'rgba(168, 185, 232, 0.25)',
  },
  wine: {
    name: 'Peach',
    primary: '#F0A878',
    primaryHover: '#E08F5C',
    light: '#FADDC8',
    lightHover: '#F5CEBA',
    dark: 'rgba(240, 168, 120, 0.15)',
    darkHover: 'rgba(240, 168, 120, 0.25)',
    text: '#C07040',
    border: '#FBDCC8',
    borderDark: '#A05830',
    shadow: 'rgba(240, 168, 120, 0.25)',
  },
  teal: {
    name: 'Sage',
    primary: '#B1C870',
    primaryHover: '#99B058',
    light: '#E4EDC8',
    lightHover: '#D8E5B8',
    dark: 'rgba(177, 200, 112, 0.15)',
    darkHover: 'rgba(177, 200, 112, 0.25)',
    text: '#7A9038',
    border: '#DBEAB8',
    borderDark: '#687D30',
    shadow: 'rgba(177, 200, 112, 0.25)',
  },
  honey: {
    name: 'Gold',
    primary: '#F9C870',
    primaryHover: '#E8B458',
    light: '#FAECC8',
    lightHover: '#F5DEB8',
    dark: 'rgba(249, 200, 112, 0.15)',
    darkHover: 'rgba(249, 200, 112, 0.25)',
    text: '#C09030',
    border: '#FDE8B8',
    borderDark: '#A07828',
    shadow: 'rgba(249, 200, 112, 0.25)',
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
  accentColor: 'blush',
  darkMode: 'off',
  fontSize: 'medium',
  fontPreset: 'classic',
  fontWeight: 'regular',
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
      const fontPreset = parsed.fontPreset && FONT_PRESETS[parsed.fontPreset as FontPreset]
        ? (parsed.fontPreset as FontPreset)
        : DEFAULT_THEME.fontPreset;
      const fontWeight = parsed.fontWeight && FONT_WEIGHTS[parsed.fontWeight as FontWeight]
        ? (parsed.fontWeight as FontWeight)
        : DEFAULT_THEME.fontWeight;
      return { accentColor, darkMode, fontSize, fontPreset, fontWeight };
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
  const fontPreset = FONT_PRESETS[theme.fontPreset];
  const fontWeight = FONT_WEIGHTS[theme.fontWeight];
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
