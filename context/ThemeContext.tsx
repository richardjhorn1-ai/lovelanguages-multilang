import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ThemeSettings,
  AccentColor,
  DarkModeStyle,
  FontSize,
  FontPreset,
  FontWeight,
  DEFAULT_THEME,
  ACCENT_COLORS,
  FONT_WEIGHTS,
  applyTheme,
  setupResponsiveTextScale
} from '../services/theme';
import { supabase } from '../services/supabase';

interface ThemeContextType {
  theme: ThemeSettings;
  setAccentColor: (color: AccentColor) => void;
  setDarkMode: (style: DarkModeStyle) => void;
  setFontSize: (size: FontSize) => void;
  setFontPreset: (preset: FontPreset) => void;
  setFontWeight: (weight: FontWeight) => void;
  accentHex: string;
  isDark: boolean;
  iconWeight: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  userId?: string;
  profileTheme?: {
    accent_color?: AccentColor;
    dark_mode?: DarkModeStyle;
    font_size?: FontSize;
    font_preset?: FontPreset;
    font_weight?: FontWeight;
  } | null;
}

export function ThemeProvider({ children, userId, profileTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme: Profile is source of truth for logged-in users
  useEffect(() => {
    if (userId && profileTheme) {
      // Logged in: Use profile values (source of truth)
      const userTheme: ThemeSettings = {
        accentColor: profileTheme.accent_color || DEFAULT_THEME.accentColor,
        darkMode: profileTheme.dark_mode || DEFAULT_THEME.darkMode,
        fontSize: profileTheme.font_size || DEFAULT_THEME.fontSize,
        fontPreset: profileTheme.font_preset || DEFAULT_THEME.fontPreset,
        fontWeight: profileTheme.font_weight || DEFAULT_THEME.fontWeight,
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
  }, [userId, profileTheme?.accent_color, profileTheme?.dark_mode, profileTheme?.font_size, profileTheme?.font_preset, profileTheme?.font_weight]);

  // Sync theme changes to Supabase when user modifies theme
  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Apply theme to DOM
    applyTheme(theme);
    setupResponsiveTextScale(theme.fontSize);

    // Sync to Supabase (profile is source of truth)
    supabase
      .from('profiles')
      .update({
        accent_color: theme.accentColor,
        dark_mode: theme.darkMode,
        font_size: theme.fontSize,
        font_preset: theme.fontPreset,
        font_weight: theme.fontWeight,
      })
      .eq('id', userId)
      .then(() => {
        // Silent update
      });
  }, [theme, userId, isLoaded]);

  const setAccentColor = (color: AccentColor) => {
    setTheme(prev => ({ ...prev, accentColor: color }));
  };

  const setDarkMode = (style: DarkModeStyle) => {
    setTheme(prev => ({ ...prev, darkMode: style }));
  };

  const setFontSize = (size: FontSize) => {
    setTheme(prev => ({ ...prev, fontSize: size }));
  };

  const setFontPreset = (preset: FontPreset) => {
    setTheme(prev => ({ ...prev, fontPreset: preset }));
  };

  const setFontWeight = (weight: FontWeight) => {
    setTheme(prev => ({ ...prev, fontWeight: weight }));
  };

  const accentHex = ACCENT_COLORS[theme.accentColor].primary;
  const isDark = theme.darkMode !== 'off';
  const iconWeight = FONT_WEIGHTS[theme.fontWeight].iconWeight;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setAccentColor,
        setDarkMode,
        setFontSize,
        setFontPreset,
        setFontWeight,
        accentHex,
        isDark,
        iconWeight,
      }}
    >
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
