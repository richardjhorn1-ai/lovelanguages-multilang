'use client';

// Initialize i18n (side-effect import — must be before any useTranslation() calls)
import '../i18n';

import { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { useI18nSync } from '../hooks/useI18nSync';
import { Profile } from '../types';

/**
 * I18nSync — syncs i18n language with user's native language.
 * Must be inside LanguageProvider.
 */
function I18nSync({ children }: { children: ReactNode }) {
  useI18nSync();
  return <>{children}</>;
}

interface ProvidersProps {
  children: ReactNode;
  userId?: string;
  profile?: Profile | null;
  profileTheme?: {
    accent_color?: string;
    dark_mode?: any;
    font_size?: any;
    font_preset?: any;
    font_weight?: any;
    background_style?: any;
  } | null;
}

/**
 * App-wide client providers.
 * Wraps the component tree with Theme, Language, and i18n providers.
 *
 * Usage in app/layout.tsx:
 *   <Providers>
 *     {children}
 *   </Providers>
 *
 * Phase 3 will wire userId/profile from auth state.
 * For now, defaults work for unauthenticated landing page.
 */
export function Providers({ children, userId, profile, profileTheme }: ProvidersProps) {
  return (
    <ThemeProvider userId={userId} profileTheme={profileTheme}>
      <LanguageProvider profile={profile ?? null}>
        <I18nSync>
          {children}
        </I18nSync>
      </LanguageProvider>
    </ThemeProvider>
  );
}
