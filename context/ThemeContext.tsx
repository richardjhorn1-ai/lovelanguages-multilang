import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import {
  ThemeSettings,
  AccentColor,
  DarkModeStyle,
  FontSize,
  FontPreset,
  FontWeight,
  BackgroundStyle,
  DEFAULT_THEME,
  ACCENT_COLORS,
  FONT_WEIGHTS,
  applyTheme,
  setupResponsiveTextScale,
  migrateAccentColor,
} from '../services/theme';
import { supabase } from '../services/supabase';

interface ThemeContextType {
  theme: ThemeSettings;
  setAccentColor: (color: AccentColor) => void;
  setDarkMode: (style: DarkModeStyle) => void;
  setFontSize: (size: FontSize) => void;
  setFontPreset: (preset: FontPreset) => void;
  setFontWeight: (weight: FontWeight) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  accentHex: string;
  secondaryHex: string;
  isDark: boolean;
  iconWeight: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  userId?: string;
  profileTheme?: {
    accent_color?: string;  // Accepts old keys too — migration handled by migrateAccentColor()
    dark_mode?: DarkModeStyle;
    font_size?: FontSize;
    font_preset?: FontPreset;
    font_weight?: FontWeight;
    background_style?: BackgroundStyle;
  } | null;
}

export function ThemeProvider({ children, userId, profileTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme: Profile is source of truth for logged-in users
  useEffect(() => {
    if (userId && profileTheme) {
      // Logged in: Use profile values (source of truth)
      // Migrate old accent colour keys (blush→coral, lavender→ocean, teal→mint)
      const userTheme: ThemeSettings = {
        accentColor: migrateAccentColor(profileTheme.accent_color),
        darkMode: profileTheme.dark_mode || DEFAULT_THEME.darkMode,
        fontSize: profileTheme.font_size || DEFAULT_THEME.fontSize,
        fontPreset: profileTheme.font_preset || DEFAULT_THEME.fontPreset,
        fontWeight: profileTheme.font_weight || DEFAULT_THEME.fontWeight,
        backgroundStyle: profileTheme.background_style || DEFAULT_THEME.backgroundStyle,
      };
      setTheme(userTheme);
      applyTheme(userTheme);
      setupResponsiveTextScale(userTheme.fontSize);
    } else if (!userId) {
      // Not logged in: Use defaults (Hero applies its own curated theme)
      setTheme(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME);
      setupResponsiveTextScale(DEFAULT_THEME.fontSize);
    }
    setIsLoaded(true);
  }, [userId, profileTheme?.accent_color, profileTheme?.dark_mode, profileTheme?.font_size, profileTheme?.font_preset, profileTheme?.font_weight, profileTheme?.background_style]);

  // Debounced sync to Supabase — prevents rapid-fire updates when toggling settings
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Apply theme to DOM immediately
    applyTheme(theme);
    setupResponsiveTextScale(theme.fontSize);

    // Debounce Supabase sync (500ms)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      supabase
        .from('profiles')
        .update({
          accent_color: theme.accentColor,
          dark_mode: theme.darkMode,
          font_size: theme.fontSize,
          font_preset: theme.fontPreset,
          font_weight: theme.fontWeight,
          background_style: theme.backgroundStyle,
        })
        .eq('id', userId)
        .then(() => {
          // Silent update
        });
    }, 500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [theme, userId, isLoaded]);

  // Stable setter callbacks — only depend on setTheme which is stable
  const setAccentColor = useCallback((color: AccentColor) => {
    setTheme(prev => ({ ...prev, accentColor: color }));
  }, []);

  const setDarkMode = useCallback((style: DarkModeStyle) => {
    setTheme(prev => ({ ...prev, darkMode: style }));
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setTheme(prev => ({ ...prev, fontSize: size }));
  }, []);

  const setFontPreset = useCallback((preset: FontPreset) => {
    setTheme(prev => ({ ...prev, fontPreset: preset }));
  }, []);

  const setFontWeight = useCallback((weight: FontWeight) => {
    setTheme(prev => ({ ...prev, fontWeight: weight }));
  }, []);

  const setBackgroundStyle = useCallback((style: BackgroundStyle) => {
    setTheme(prev => ({ ...prev, backgroundStyle: style }));
  }, []);

  // Memoized computed values — only recompute when theme changes
  const accentHex = useMemo(() => ACCENT_COLORS[theme.accentColor].primary, [theme.accentColor]);
  const secondaryHex = useMemo(() => ACCENT_COLORS[theme.accentColor].secondary.primary, [theme.accentColor]);
  const isDark = useMemo(() => theme.darkMode !== 'off', [theme.darkMode]);
  const iconWeight = useMemo(() => FONT_WEIGHTS[theme.fontWeight].iconWeight, [theme.fontWeight]);

  // Memoized provider value — prevents unnecessary re-renders of all useTheme() consumers
  const value = useMemo(() => ({
    theme,
    setAccentColor,
    setDarkMode,
    setFontSize,
    setFontPreset,
    setFontWeight,
    setBackgroundStyle,
    accentHex,
    secondaryHex,
    isDark,
    iconWeight,
  }), [theme, setAccentColor, setDarkMode, setFontSize, setFontPreset, setFontWeight, setBackgroundStyle, accentHex, secondaryHex, isDark, iconWeight]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
