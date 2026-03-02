You are a senior frontend designer-developer. Generate a production-quality React + Tailwind homepage for "Love Languages" — a language learning app for couples.

## Design Direction: "Clean Vertical"

Follow Duolingo's DESIGN PRINCIPLES (not gamification):
- Illustration-first — visuals tell the story, not text paragraphs
- Single clear action per screen
- Generous whitespace — breathing room everywhere
- Simple vertical scroll — no carousels, split-screens, or bottom sheets

## Layout (top to bottom)

1. **Sticky header**: Logo + Learn/Teach toggle (compact, `bg-white/80 backdrop-blur`)
2. **Hero section**: Big headline + subtitle + large IllustrationPlaceholder + CTA button that scrolls to signup
3. **Language selection**: NativeLanguagePill + LanguageGrid (use the existing components)
4. **Feature highlights**: 3 cards in a `grid-cols-1 md:grid-cols-3` — each has an icon from ICONS + a single line of text
5. **Signup**: CompactLoginForm centered in a white card
6. **FAQ + Footer**: Reuse HeroFAQ and HeroFooter

The whole page should feel clean, open, and unhurried. Think: Apple product page meets Duolingo simplicity.

## Technical Requirements

This component MUST:
1. `import { useHeroLogic } from '../../hooks/useHeroLogic'` and call: `const logic = useHeroLogic()`
2. `import CompactLoginForm from './shared/CompactLoginForm'` and render: `<CompactLoginForm logic={logic} />`
3. Be a single default-exported React functional component
4. Use Tailwind CSS (mobile-first with `md:` breakpoint at 768px)
5. Be responsive — same component for mobile and desktop (NO separate mobile layout)
6. Fonts: Quicksand for headers (`font-header` class), Outfit for body (default)
7. Brand colors from the hook: `logic.accentColor`, `logic.bgColor`, `logic.accentShadow`
8. `logic.isStudent` toggles coral pink vs teal green accent
9. Include a Learn/Teach role toggle via `logic.selectedRole` / `logic.setSelectedRole`
10. Include language selection via `logic.handleTargetSelect`, `logic.nativeLanguage`, etc.

## Illustration Placeholders

We don't have illustrations yet. Create branded placeholder areas:
```tsx
<div
  className="w-full aspect-video rounded-2xl flex items-center justify-center"
  style={{ backgroundColor: `${logic.accentColor}10` }}
>
  <p className="text-gray-400 text-sm font-semibold">Illustration: couple learning together on couch</p>
</div>
```
Be specific about what illustration should go in each placeholder.

## useHeroLogic hook (you MUST use this):
```typescript
/**
 * Shared hook for all Hero page variants.
 * Encapsulates auth, language selection, analytics, i18n, and role logic.
 *
 * Critical contracts preserved:
 * 1. Stores languages to localStorage before auth
 * 2. Stores role + languages in Supabase user_metadata during signup
 * 3. Stores intended_role in localStorage before OAuth
 * 4. Fires analytics.trackSignupStarted before auth
 * 5. Calls i18n.changeLanguage when native language changes
 * 6. Uses honeypot anti-bot protection
 * 7. Supports OAuth redirect flow
 * 8. Supports URL-based language pre-selection via useParams
 * 9. Handles useTranslation for hero i18n keys
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';
import { DEFAULT_THEME, applyTheme } from '../services/theme';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../constants/language-config';
import { useHoneypot } from './useHoneypot';
import { BRAND } from '../components/hero/heroConstants';
import type { HeroRole, SelectionStep } from '../components/hero/heroConstants';

export type { HeroRole, SelectionStep };

export interface UseHeroLogicReturn {
  // Auth state
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  message: string;
  setMessage: (v: string) => void;
  oauthLoading: 'google' | 'apple' | null;

  // Auth handlers
  handleAuth: (e: React.FormEvent) => Promise<void>;
  handleOAuthSignIn: (provider: 'google' | 'apple') => Promise<void>;
  handleForgotPassword: () => Promise<void>;

  // Modern login flow
  emailStep: 'initial' | 'existing' | 'new';
  setEmailStep: (step: 'initial' | 'existing' | 'new') => void;
  handleEmailContinue: () => Promise<void>;
  handleMagicLink: () => Promise<void>;
  magicLinkSent: boolean;

  // Honeypot
  honeypotProps: ReturnType<typeof useHoneypot>['honeypotProps'];
  honeypotStyles: string;

  // Role
  selectedRole: HeroRole;
  setSelectedRole: (role: HeroRole) => void;
  isStudent: boolean;
  accentColor: string;
  accentHover: string;
  accentShadow: string;
  bgColor: string;

  // Language selection
  nativeLanguage: string | null;
  selectedTargetLanguage: string | null;
  handleNativeSelect: (code: string) => Promise<void>;
  handleTargetSelect: (code: string) => Promise<void>;
  nativeAutoDetected: boolean;

  // Navigation step
  currentStep: SelectionStep;
  setCurrentStep: (step: SelectionStep) => void;

  // i18n
  t: TFunction;

  // Error helpers
  isCredentialsError: boolean;
  hasError: boolean;
}

export function useHeroLogic(): UseHeroLogicReturn {
  const { t, i18n } = useTranslation();
  const { targetLang } = useParams<{ targetLang?: string }>();

  // Apply default theme on mount
  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);

  // ─── Auth state ───
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<HeroRole>('student');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  // ─── Modern login flow ───
  const [emailStep, setEmailStep] = useState<'initial' | 'existing' | 'new'>('initial');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // ─── Honeypot ───
  const { honeypotProps, honeypotStyles, isBot } = useHoneypot();

  // ─── Language state ───
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<SelectionStep>('language');
  const nativeAutoDetectedRef = useRef(false);

  // ─── Computed ───
  const isStudent = selectedRole === 'student';
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentHover = isStudent ? BRAND.primaryHover : BRAND.tealHover;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;
  const bgColor = isStudent ? BRAND.light : BRAND.tealLight;

  // Error helpers
  const isCredentialsError = !!(message && (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('credentials') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no user')
  ));
  const hasError = !!(message && !message.toLowerCase().includes('check'));

  // ─── Initialize from localStorage, URL param, browser language ───
  useEffect(() => {
    const savedNative = localStorage.getItem('preferredNativeLanguage') || localStorage.getItem('preferredLanguage');
    const savedTarget = localStorage.getItem('preferredTargetLanguage');

    // URL param takes priority for target language
    const urlTarget = targetLang && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(targetLang) ? targetLang : null;

    // Browser language for first-time visitors
    const browserLang = navigator.language.split('-')[0];
    const validBrowserLang = (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(browserLang) ? browserLang : 'en';

    // Set native language
    let effectiveNative: string;
    if (savedNative && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedNative)) {
      effectiveNative = savedNative;
    } else {
      effectiveNative = validBrowserLang;
      nativeAutoDetectedRef.current = true;
    }
    setNativeLanguage(effectiveNative);
    i18n.changeLanguage(effectiveNative);

    // Set target language
    let effectiveTarget: string | null = null;
    if (urlTarget) {
      effectiveTarget = urlTarget;
      localStorage.setItem('preferredTargetLanguage', urlTarget);
    } else if (savedTarget && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedTarget)) {
      effectiveTarget = savedTarget;
    }

    // Edge case: auto-detected native === target → clear target
    if (effectiveTarget && effectiveTarget === effectiveNative) {
      effectiveTarget = null;
      localStorage.removeItem('preferredTargetLanguage');
    }

    if (effectiveTarget) {
      setSelectedTargetLanguage(effectiveTarget);
    }

    // Determine starting step
    if (effectiveNative && effectiveTarget) {
      setCurrentStep('marketing');
    }
  }, [targetLang, i18n]);

  // ─── Language handlers ───
  const handleNativeSelect = useCallback(async (code: string) => {
    setNativeLanguage(code);
    if (selectedTargetLanguage === code) {
      setSelectedTargetLanguage(null);
      localStorage.removeItem('preferredTargetLanguage');
    }

    // Update localStorage BEFORE i18n change to prevent race condition
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem('preferredNativeLanguage', code);
    }
    await i18n.changeLanguage(code);
  }, [selectedTargetLanguage, i18n]);

  const handleTargetSelect = useCallback(async (code: string) => {
    setSelectedTargetLanguage(code);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem('preferredTargetLanguage', code);
    }
    setCurrentStep('marketing');
  }, []);

  // ─── Auth handlers ───
  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Honeypot check
    if (isBot()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isSignUp) {
        setMessage(t('hero.login.checkEmail'));
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      analytics.trackSignupStarted('email');
    }

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              intended_role: selectedRole,
              native_language: nativeLanguage || 'en',
              target_language: selectedTargetLanguage || 'pl'
            }
          }
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else if (isSignUp) {
      setMessage(t('hero.login.checkEmail'));
    }

    setLoading(false);
  }, [email, password, isSignUp, selectedRole, nativeLanguage, selectedTargetLanguage, isBot, t]);

  const handleOAuthSignIn = useCallback(async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');

    analytics.trackSignupStarted(provider);
    localStorage.setItem('intended_role', selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(null);
    }
  }, [selectedRole]);

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setMessage(t('hero.login.enterEmailFirst'));
      return;
    }
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(t('hero.login.resetEmailSent'));
    }
  }, [email, t]);

  // ─── Modern login: email-first detection ───
  const handleEmailContinue = useCallback(async () => {
    if (!email || !email.includes('@')) {
      setMessage(t('hero.login.enterEmailFirst', 'Please enter your email first'));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      setEmailStep(data.exists ? 'existing' : 'new');
      setIsSignUp(!data.exists);
    } catch {
      // On network error, default to showing both options
      setEmailStep('new');
      setIsSignUp(true);
    }

    setLoading(false);
  }, [email, t]);

  // ─── Modern login: magic link ───
  const handleMagicLink = useCallback(async () => {
    if (!email || !email.includes('@')) {
      setMessage(t('hero.login.enterEmailFirst', 'Please enter your email first'));
      return;
    }

    setLoading(true);
    setMessage('');

    // Store preferences before magic link (same pattern as OAuth)
    localStorage.setItem('intended_role', selectedRole);
    if (nativeLanguage) localStorage.setItem('preferredNativeLanguage', nativeLanguage);
    if (selectedTargetLanguage) localStorage.setItem('preferredTargetLanguage', selectedTargetLanguage);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          intended_role: selectedRole,
          native_language: nativeLanguage || 'en',
          target_language: selectedTargetLanguage || 'pl'
        }
      }
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMagicLinkSent(true);
      setMessage(t('hero.login.magicLinkSent', 'Check your email for a login link!'));
    }
  }, [email, selectedRole, nativeLanguage, selectedTargetLanguage, t]);

  return {
    // Auth state
    email, setEmail,
    password, setPassword,
    loading,
    isSignUp, setIsSignUp,
    message, setMessage,
    oauthLoading,

    // Auth handlers
    handleAuth,
    handleOAuthSignIn,
    handleForgotPassword,

    // Modern login flow
    emailStep, setEmailStep,
    handleEmailContinue,
    handleMagicLink,
    magicLinkSent,

    // Honeypot
    honeypotProps,
    honeypotStyles,

    // Role
    selectedRole, setSelectedRole,
    isStudent,
    accentColor,
    accentHover,
    accentShadow,
    bgColor,

    // Language
    nativeLanguage,
    selectedTargetLanguage,
    handleNativeSelect,
    handleTargetSelect,
    nativeAutoDetected: nativeAutoDetectedRef.current,

    // Navigation
    currentStep, setCurrentStep,

    // i18n
    t,

    // Error helpers
    isCredentialsError,
    hasError,
  };
}

export default useHeroLogic;

```

## CompactLoginForm (you MUST render this):
```typescript
/**
 * Modern login form with:
 * - OAuth-dominant (Google + Apple at top)
 * - Email-first progressive disclosure
 * - Magic link option
 * - Honeypot anti-bot protection
 *
 * Used by all homepage redesign concepts.
 */

import React from 'react';
import type { UseHeroLogicReturn } from '../../../hooks/useHeroLogic';

interface CompactLoginFormProps {
  logic: UseHeroLogicReturn;
  className?: string;
}

// Apple logo SVG path
const AppleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

// Google logo SVG
const GoogleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const CompactLoginForm: React.FC<CompactLoginFormProps> = ({ logic, className = '' }) => {
  const {
    t, email, setEmail, password, setPassword, loading, isSignUp, setIsSignUp,
    message, setMessage, oauthLoading, handleAuth, handleOAuthSignIn,
    handleForgotPassword, handleEmailContinue, handleMagicLink, magicLinkSent,
    emailStep, setEmailStep, isStudent, accentColor, accentHover, accentShadow,
    honeypotProps, honeypotStyles, isCredentialsError, hasError,
  } = logic;

  const showPasswordField = emailStep === 'existing' || emailStep === 'new';

  return (
    <div className={`w-full max-w-md ${className}`}>
      {/* ─── OAuth buttons (prominent, at top) ─── */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading || oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-scale-label transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
        >
          {oauthLoading === 'google' ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <GoogleLogo className="w-5 h-5" />
          )}
          <span>{t('hero.login.continueWithGoogle')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthSignIn('apple')}
          disabled={loading || oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-scale-label transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
        >
          {oauthLoading === 'apple' ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <AppleLogo className="w-5 h-5" />
          )}
          <span>{t('hero.login.continueWithApple', 'Continue with Apple')}</span>
        </button>
      </div>

      {/* ─── Divider ─── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-scale-caption font-bold uppercase tracking-widest text-gray-400">
          {t('hero.login.orContinueWith', 'or')}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ─── Error message ─── */}
      {hasError && (
        <div className="flex items-center gap-2 text-red-500 text-scale-label font-semibold mb-4 animate-shake">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* ─── Magic link success ─── */}
      {magicLinkSent && message?.toLowerCase().includes('check') && (
        <div className="p-4 rounded-2xl text-scale-label font-bold text-center bg-green-50 text-green-700 mb-4">
          {message}
        </div>
      )}

      {/* ─── Email form ─── */}
      <style dangerouslySetInnerHTML={{ __html: honeypotStyles }} />
      <form onSubmit={showPasswordField ? handleAuth : (e) => { e.preventDefault(); handleEmailContinue(); }} className="space-y-3">
        {/* Honeypot */}
        <input {...honeypotProps} />

        {/* Email input */}
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (message) setMessage('');
            // Reset email step if email changes
            if (emailStep !== 'initial') setEmailStep('initial');
          }}
          required
          className="w-full px-5 py-3.5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
          style={{
            backgroundColor: '#ffffff',
            color: '#1a1a2e',
            borderColor: hasError ? '#ef4444' : '#e5e7eb'
          }}
          onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentColor}
          onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#e5e7eb'}
          placeholder={t('hero.login.emailPlaceholder')}
        />

        {/* Step label when email detected */}
        {emailStep === 'existing' && (
          <p className="text-scale-caption font-bold ml-1" style={{ color: accentColor }}>
            {t('hero.login.welcomeBack', 'Welcome back!')}
          </p>
        )}
        {emailStep === 'new' && (
          <p className="text-scale-caption font-bold ml-1" style={{ color: accentColor }}>
            {t('hero.login.createYourAccount', 'Create your account')}
          </p>
        )}

        {/* Password field — appears after email detection */}
        {showPasswordField && (
          <input
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
            required
            className="w-full px-5 py-3.5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
            style={{
              backgroundColor: '#ffffff',
              color: '#1a1a2e',
              borderColor: hasError ? '#ef4444' : '#e5e7eb',
              animation: 'reveal-up 0.3s ease-out'
            }}
            onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentColor}
            onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#e5e7eb'}
            placeholder={isSignUp
              ? t('hero.login.createPassword', 'Create a password')
              : t('hero.login.passwordPlaceholder')
            }
          />
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || oauthLoading !== null}
          className="w-full text-white font-black py-3.5 rounded-2xl shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 text-scale-label uppercase tracking-[0.12em] hover:scale-[1.01]"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 12px 24px -6px ${accentShadow}`
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
        >
          {loading
            ? t('hero.login.entering')
            : showPasswordField
              ? (isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn'))
              : t('hero.login.continueWithEmail', 'Continue with email')
          }
        </button>

        {/* Free tier text */}
        {isSignUp && showPasswordField && (
          <p className="text-center text-scale-micro text-gray-500">
            {isStudent
              ? t('signup.freeStartLearning', 'Start learning for $0.00')
              : t('signup.freeStartTeaching', 'Start teaching for $0.00')
            }
          </p>
        )}
      </form>

      {/* ─── Secondary actions (below form) ─── */}
      {showPasswordField && (
        <div className="mt-4 space-y-2 text-center">
          {/* Magic link option */}
          {!magicLinkSent && (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading}
              className="text-scale-caption font-semibold transition-all hover:opacity-70 disabled:opacity-50"
              style={{ color: accentColor }}
            >
              {t('hero.login.emailMeLink', 'Email me a login link instead')}
            </button>
          )}

          {/* Forgot password (sign-in only) */}
          {emailStep === 'existing' && (
            <div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-scale-caption font-semibold transition-all hover:opacity-70 disabled:opacity-50"
                style={{ color: '#9ca3af' }}
              >
                {t('hero.login.forgotPassword')}
              </button>
            </div>
          )}

          {/* Switch sign-in / sign-up */}
          <div>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmailStep(isSignUp ? 'existing' : 'new');
                setMessage('');
              }}
              className={`text-scale-caption font-bold transition-all hover:opacity-70 ${
                isCredentialsError && !isSignUp ? 'animate-pulse-glow' : ''
              }`}
              style={{
                color: accentColor,
                textShadow: isCredentialsError && !isSignUp ? `0 0 15px ${accentColor}` : 'none'
              }}
            >
              {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
            </button>
          </div>
        </div>
      )}

      {/* ─── Success messages ─── */}
      {!magicLinkSent && message && message.toLowerCase().includes('check') && (
        <div className="mt-4 p-3 rounded-2xl text-scale-label font-bold text-center bg-green-50 text-green-700">
          {message}
        </div>
      )}
    </div>
  );
};

export default CompactLoginForm;

```

## Brand constants:
```typescript
// Shared constants and utilities for Hero page components

// Fixed brand colors for landing page
export const BRAND = {
  primary: '#FF4761',
  primaryHover: '#E63E56',
  light: '#FFF0F3',
  border: '#FECDD3',
  shadow: 'rgba(255, 71, 97, 0.25)',
  teal: '#14b8a6',
  tealHover: '#0d9488',
  tealLight: '#ccfbf1',
  tealShadow: 'rgba(20, 184, 166, 0.25)',
};

// Types
export type HeroRole = 'student' | 'tutor';
export type SelectionStep = 'language' | 'marketing';

// Popular languages shown first (rest hidden behind "Show all")
export const POPULAR_LANGUAGES = ['en', 'es', 'fr', 'de', 'pl', 'it', 'pt', 'nl'];

```

## Available Reusable Components (import, don't recreate)

| Component | Import | Props |
|-----------|--------|-------|
| NativeLanguagePill | `from '../hero/NativeLanguagePill'` | `{ nativeLanguage, isStudent, onSelect }` |
| LanguageGrid | `from '../hero/LanguageGrid'` | `{ onSelect, selectedCode, excludeCode, isStudent, title, subtitle }` |
| GameShowcase | `{ GameShowcase } from '../hero/GameShowcase'` | `{ isStudent, accentColor, sectionIndex, isMobile?, targetLanguage, nativeLanguage }` |
| HeroFAQ | `{ HeroFAQ } from '../hero/HeroBottomSections'` | `{ isStudent, sectionIndex, isVisible }` |
| HeroFooter | `{ HeroFooter } from '../hero/HeroBottomSections'` | `{ isStudent, sectionIndex, isVisible }` |
| LOGO_PATH, LOGO_DETAIL_PATHS | `from '../hero/Section'` | SVG path data for logo |
| ICONS | `from '../../constants'` | Heart, Sparkles, ChevronLeft, ChevronRight, etc. |
| LANGUAGE_CONFIGS | `from '../../constants/language-config'` | `{ code, flag, nativeName, name }` per language |
| BRAND | `from '../hero/heroConstants'` | primary, teal, light, tealLight, shadow, etc. |

## Logo

**See the attached logo.svg file** for the visual reference of the Love Languages logo (a bird with hearts). The logo SVG is also available as code via `LOGO_PATH` and `LOGO_DETAIL_PATHS` constants.

Logo usage in code:
```tsx
<svg viewBox="0 0 600.000000 600.000000" fill={logic.accentColor} className="w-12 h-12">
  <g transform="translate(0,600) scale(0.1,-0.1)" stroke="none">
    <path d={LOGO_PATH} />
    {LOGO_DETAIL_PATHS.map((d, i) => <path key={i} d={d} />)}
  </g>
</svg>
```

The logo should be colored with `logic.accentColor` (coral for students, teal for tutors). Keep it prominent in the header.

## Design System

### Colors
# Color Palette

## Core Colors

Defined in `constants/colors.ts`:

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#FF6B6B` | Coral red — primary actions, branding |
| Secondary | `#4ECDC4` | Teal — secondary actions, accents |
| Accent | `#FFE66D` | Golden yellow — highlights, rewards |
| Background | `#F7FFF7` | Mint white — light backgrounds |
| Text | `#292F36` | Near black — body text |
| Soft Pink | `#FFF0F3` | Subtle pink tints |
| Soft Blue | `#E7F5FF` | Subtle blue tints |

## App Background

`#fdfcfd` (warm off-white) — the primary app background color.

## Target Word Highlight

`#FF4761` — used consistently for all target language vocabulary words. Do not use other colors for this.

## Tier Colors

Each proficiency tier has a distinct color defined in `constants/levels.ts`. Always use `tierColor` from level info, never hardcode tier colors.

## Scrollbar

Custom pink-themed scrollbar (desktop only, hidden on mobile):
- Track: transparent
- Thumb: `#fecdd3` (soft pink)
- Thumb hover: `#fb7185` (rose)

## Usage Patterns

- Use arbitrary Tailwind values: `bg-[#fdfcfd]`, `text-[#FF4761]`
- Use `style={}` prop when color comes from JavaScript variables
- Badges/pills: background at 15% opacity (`${tierColor}15`) with full color text


### Typography
# Typography

## Fonts

Configured in `index.html` via Google Fonts:

| Font | Role | Usage |
|------|------|-------|
| **Outfit** | Body text | Clean, modern, slightly warm. Default for all text. |
| **Quicksand** | Headers | Rounded, friendly, distinctive. Use `font-header` Tailwind class. |

## Rules

- Never introduce new font families (Inter, Roboto, Arial, etc.)
- Use `font-header` class for any heading or display text that should use Quicksand
- Body text uses Outfit automatically (set on `body` element)


### Mobile
# Mobile Design

## Breakpoint

Uses Tailwind's `md:` breakpoint (768px). Pattern: `mobile-value md:desktop-value`

```tsx
className="px-3 md:px-4 py-2 md:py-3"  // Responsive padding
className="text-xs md:text-sm"           // Responsive text
className="hidden md:flex"               // Hide on mobile
className="md:hidden"                    // Show only on mobile
```

## Core Principles

1. **Compact but not cramped** — Reduce padding/margins ~30-40% from desktop
2. **Touch-friendly** — Minimum 32px tap targets
3. **Hidden chrome** — Remove scrollbars, chevrons, decorative waste
4. **Inline over stacked** — Combine elements horizontally where possible
5. **Progressive disclosure** — Slide-in panels instead of always-visible sidebars

## Size Scale

| Element | Mobile | Desktop |
|---------|--------|---------|
| Container padding | `p-2`, `p-3` | `p-4`, `p-6` |
| Card padding | `p-2.5`, `p-3` | `p-4`, `p-5` |
| Button padding | `px-2 py-1.5` | `px-3 py-2` |
| Icon size | `w-3.5 h-3.5`, `w-4 h-4` | `w-4 h-4`, `w-5 h-5` |
| Avatar size | `w-8 h-8` | `w-9 h-9`, `w-10 h-10` |
| Text body | `text-xs` | `text-sm` |
| Text label | `text-[9px]`, `text-[10px]` | `text-[10px]`, `text-xs` |
| Gaps | `gap-1.5`, `gap-2` | `gap-3`, `gap-4` |
| Border radius | `rounded-lg`, `rounded-xl` | `rounded-xl`, `rounded-2xl` |

## Navigation (Mobile)

- 3 centered nav buttons (Chat, Love Log, Play) — evenly spaced
- Logo on left (icon only, no text)
- Profile avatar on right (no chevron, compact)
- Progress/Help/Notifications hidden — accessible via profile dropdown

## Profile Dropdown (Mobile)

Narrower (`w-48` vs `w-56`), smaller text (`text-xs`), reduced padding (`px-3 py-2`), smaller icons (`w-3.5 h-3.5`), tighter gaps (`gap-2`).

## Panels & Overlays

Slide-in panels for secondary content:
- Semi-transparent backdrop (`bg-black/30`) that closes on tap
- Panel width: `w-72 max-w-[85vw]`
- Header with title + close button
- Scrollable content area
- Left slide for conversation index, right slide for notifications

## Scrollbar

Completely hidden on mobile (< 768px):
```css
@media (max-width: 767px) {
  * { -ms-overflow-style: none; scrollbar-width: none; }
  *::-webkit-scrollbar { display: none; }
}
```

## Grid Layouts

- **Love Log**: `grid-cols-2` (vs 3-5 desktop)
- **Play games**: `grid-cols-2`, centered content, hidden descriptions
- **Card heights**: Reduced (e.g., `h-[200px]` vs `h-[280px]`)

## Mobile UX Patterns

1. Remove decorative chevrons — waste space on touch
2. Truncate long text — use `truncate` class
3. Badges over text — show counts, not "X requests"
4. Tap to expand — hide secondary info behind taps
5. Full-width touch targets — buttons span full width in lists


### Motion
# Motion & Animation

## CSS-Only Preference

Prioritize CSS-only solutions over JavaScript animation libraries.

## Baseline

Use `transition-all duration-200` as the default transition.

## High-Impact Moments

Focus animation effort on moments that create delight:

- **Page load** — Staggered reveals using `animation-delay`
- **State transitions** — Mode switches, card flips
- **Micro-interactions** — Button hover/active/press feedback

One well-orchestrated reveal creates more delight than scattered animations throughout the interface.

## Rules

- Don't animate everything — be intentional
- Keep durations short (150-300ms for interactions, up to 500ms for reveals)
- Use easing that feels natural (`ease-out` for enters, `ease-in` for exits)
- Test on mobile — animations should feel smooth, not janky


### Principles
# Design Principles

## Minimalism Over Engineering

Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused.

- Don't add features, refactor code, or make "improvements" beyond what was asked
- Don't add error handling or validation for scenarios that can't happen
- Don't create helpers or abstractions for one-time operations
- Reuse existing abstractions. Follow DRY.

## Avoid "AI Slop" Aesthetics

Generic, on-distribution outputs create the telltale "AI-generated" look. Make distinctive choices that feel genuinely designed for this romantic, couples-focused learning context.

**Avoid:**
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (purple gradients on white backgrounds)
- Predictable layouts and cookie-cutter component patterns
- Safe, timid design choices that lack character

**Instead:**
- Commit to the established warm, romantic aesthetic
- Make bold color choices — dominant colors with sharp accents
- Vary approaches between components; not everything needs the same pattern

## When Adding New UI

1. **Match the existing aesthetic** — Warm tones, rounded shapes, playful but not childish
2. **Use established colors** — Don't introduce new brand colors without reason
3. **Follow existing patterns** — Look at similar components first
4. **Keep it simple** — Resist adding visual complexity for its own sake
5. **Test the feel** — Does it feel like the same app? Does it feel designed, not generated?


## Rules
- 200-400 lines of clean React + Tailwind
- Use existing i18n keys where available: `logic.t('hero.login.signIn')`
- Hardcode English with `// TODO: i18n` comment for new copy
- CSS-only animations (no libraries)
- No new npm dependencies
- No marketing AI slop copy


## Output

Return a single complete React component file (CleanVertical.tsx). Default export. No other files.
