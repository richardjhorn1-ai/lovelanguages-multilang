import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ThemeSettings,
  AccentColor,
  DarkModeStyle,
  FontSize,
  DEFAULT_THEME,
  ACCENT_COLORS,
  applyTheme
} from '../services/theme';
import { supabase } from '../services/supabase';

interface ThemeContextType {
  theme: ThemeSettings;
  setAccentColor: (color: AccentColor) => void;
  setDarkMode: (style: DarkModeStyle) => void;
  setFontSize: (size: FontSize) => void;
  accentHex: string;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  userId?: string;
  profileTheme?: { accent_color?: AccentColor; dark_mode?: DarkModeStyle; font_size?: FontSize } | null;
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
      };
      setTheme(userTheme);
      applyTheme(userTheme);
    } else if (!userId) {
      // Not logged in: Use defaults (Hero applies its own curated theme)
      setTheme(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME);
    }
    setIsLoaded(true);
  }, [userId, profileTheme?.accent_color, profileTheme?.dark_mode, profileTheme?.font_size]);

  // Sync theme changes to Supabase when user modifies theme
  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Apply theme to DOM
    applyTheme(theme);

    // Sync to Supabase (profile is source of truth)
    supabase
      .from('profiles')
      .update({
        accent_color: theme.accentColor,
        dark_mode: theme.darkMode,
        font_size: theme.fontSize,
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

  const accentHex = ACCENT_COLORS[theme.accentColor].primary;
  const isDark = theme.darkMode !== 'off';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setAccentColor,
        setDarkMode,
        setFontSize,
        accentHex,
        isDark
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
