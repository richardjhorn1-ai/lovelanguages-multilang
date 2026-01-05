import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  ThemeSettings,
  AccentColor,
  DarkModeStyle,
  FontSize,
  DEFAULT_THEME,
  ACCENT_COLORS,
  loadTheme,
  saveTheme,
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
}

export function ThemeProvider({ children, userId }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);
  const isSyncing = useRef(false);

  // Load theme: from Supabase if logged in, otherwise localStorage
  useEffect(() => {
    const loadInitialTheme = async () => {
      // Always start with localStorage for immediate display
      const localTheme = loadTheme();
      setTheme(localTheme);
      applyTheme(localTheme);

      // If logged in, fetch from Supabase and use that if available
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('accent_color, dark_mode, font_size')
          .eq('id', userId)
          .single();

        if (data && (data.accent_color || data.dark_mode || data.font_size)) {
          const supabaseTheme: ThemeSettings = {
            accentColor: (data.accent_color as AccentColor) || localTheme.accentColor,
            darkMode: (data.dark_mode as DarkModeStyle) || localTheme.darkMode,
            fontSize: (data.font_size as FontSize) || localTheme.fontSize,
          };
          setTheme(supabaseTheme);
          applyTheme(supabaseTheme);
          saveTheme(supabaseTheme); // Sync to localStorage
        }
      }
      setIsLoaded(true);
    };

    loadInitialTheme();
  }, [userId]);

  // Save theme changes to localStorage and Supabase
  useEffect(() => {
    if (!isLoaded || isSyncing.current) return;

    applyTheme(theme);
    saveTheme(theme);

    // Sync to Supabase if logged in
    if (userId) {
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
    }
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
