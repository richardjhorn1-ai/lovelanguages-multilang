import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';
import { useHoneypot } from '../hooks/useHoneypot';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { BRAND } from './hero/heroConstants';
import { LOGO_PATH, LOGO_DETAIL_PATHS } from './hero/Section';
import InteractiveHearts from './hero/InteractiveHearts';
import WordParticleEffect from './hero/WordParticleEffect';
import { SUPPORTED_LANGUAGE_CODES, LANGUAGE_CONFIGS } from '../constants/language-config';
import { ICONS } from '../constants';
import { APP_URL } from '../services/api-config';
import { FeatureCard, STUDENT_FEATURES, TUTOR_FEATURES } from './landing/FeatureTile';
import FeatureShowcase from './landing/FeatureShowcase';
import MobileGameShowcase from './landing/MobileGameShowcase';
import type { LanguageCode } from '../constants/language-config';


// ============================================
// Brand SVG Icons (not available in Phosphor)
// ============================================
const AppleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const TikTokIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.19a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.62z"/>
  </svg>
);

const XTwitterIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// BeforeInstallPrompt type for PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Landing — Full-page bento grid homepage
 *
 * Desktop (≥1024px): Viewport-filling 3-column bento. Auth = featured hero card.
 * Mobile (<1024px): Auth above fold, visual feature grid + content below.
 *
 * Design: Duolingo personality + Apple polish
 */

// ============================================
// Shared constants
// ============================================
type HeroRole = 'student' | 'tutor';

const ROLE_HEADLINES: Record<HeroRole, { headline: string; highlights: string[] }> = {
  student: { headline: 'hero.landing.student.headline', highlights: ['hero.landing.student.highlight1', 'hero.landing.student.highlight2'] },
  tutor: { headline: 'hero.landing.tutor.headline', highlights: ['hero.landing.tutor.highlight1', 'hero.landing.tutor.highlight2'] },
};


function renderHighlightedText(
  text: string,
  highlights: string[],
  accentColor: string,
): (string | React.ReactElement)[] {
  const glowColor = accentColor === BRAND.teal
    ? 'rgba(20, 184, 166, 0.25)'
    : 'rgba(255, 71, 97, 0.25)';
  let parts: (string | React.ReactElement)[] = [text];
  highlights.forEach((highlight) => {
    const next: (string | React.ReactElement)[] = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') { next.push(part); return; }
      const idx = part.toLowerCase().indexOf(highlight.toLowerCase());
      if (idx === -1) { next.push(part); return; }
      if (idx > 0) next.push(part.slice(0, idx));
      next.push(
        <span
          key={highlight}
          className="font-black"
          style={{ color: accentColor, textShadow: `0 0 20px ${glowColor}` }}
        >
          {part.slice(idx, idx + highlight.length)}
        </span>
      );
      if (idx + highlight.length < part.length) next.push(part.slice(idx + highlight.length));
    });
    parts = next;
  });
  return parts;
}

// ============================================
// Role Toggle
// ============================================
const RoleToggle: React.FC<{
  role: HeroRole;
  onToggle: (r: HeroRole) => void;
}> = ({ role, onToggle }) => {
  const { t } = useTranslation();
  const isStudent = role === 'student';
  const activeColor = isStudent ? BRAND.primary : BRAND.teal;
  const activeShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;
  return (
    <div className="flex rounded-full p-1" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
      <button
        type="button"
        onClick={() => onToggle('student')}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300"
        style={isStudent
          ? { backgroundColor: activeColor, color: '#fff', boxShadow: `0 4px 12px -2px ${activeShadow}` }
          : { color: '#9ca3af' }}
      >
        <ICONS.Heart className="w-3.5 h-3.5" />
        {t('hero.toggle.learn', 'Learn')}
      </button>
      <button
        type="button"
        onClick={() => onToggle('tutor')}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300"
        style={!isStudent
          ? { backgroundColor: activeColor, color: '#fff', boxShadow: `0 4px 12px -2px ${activeShadow}` }
          : { color: '#9ca3af' }}
      >
        <ICONS.Sparkles className="w-3.5 h-3.5" />
        {t('hero.toggle.teach', 'Teach')}
      </button>
    </div>
  );
};

// ============================================
// Testimonials Card (expand on hover/tap)
// ============================================
const TESTIMONIALS = [
  { quoteKey: 'hero.testimonials.1.quote', quoteFallback: 'This is SO COOL', nameKey: 'hero.testimonials.1.name', nameFallback: 'Alessia', contextKey: 'hero.testimonials.1.context', contextFallback: 'Learning for her partner Tomas' },
  { quoteKey: 'hero.testimonials.2.quote', quoteFallback: 'Dude this app is amazing', nameKey: 'hero.testimonials.2.name', nameFallback: 'Alessandra', contextKey: 'hero.testimonials.2.context', contextFallback: 'Learning for her boyfriend Miki' },
  { quoteKey: 'hero.testimonials.3.quote', quoteFallback: 'This feels like something couples will actually use', nameKey: 'hero.testimonials.3.name', nameFallback: 'Charlotte', contextKey: 'hero.testimonials.3.context', contextFallback: 'capwave.ai' },
];

const TestimonialsCard: React.FC<{
  isDesktop: boolean;
  accentColor: string;
  className?: string;
  delay?: number;
}> = ({ isDesktop, accentColor, className = '', delay }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % TESTIMONIALS.length);
        setIsTransitioning(false);
      }, 400);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const item = TESTIMONIALS[currentIndex];

  return (
    <div
      className={`glass-card rounded-[20px] ${className}`}
      style={{
        borderLeft: `3px solid ${accentColor}`,
        ...(isDesktop && delay !== undefined ? { animation: `reveal-up 0.5s ease-out ${delay}s both` } : {}),
      }}
    >
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(4px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      >
        {/* Large decorative open-quote */}
        <div
          className={`${isDesktop ? 'text-4xl' : 'text-3xl'} font-black leading-none -mb-2`}
          style={{ color: accentColor, opacity: 0.2 }}
        >
          &ldquo;
        </div>

        {/* Quote text — larger */}
        <p className={`${isDesktop ? 'text-base' : 'text-sm'} font-semibold italic text-[var(--text-primary)] leading-snug`}>
          {t(item.quoteKey, item.quoteFallback)}
        </p>

        {/* Author line with initials avatar + stars */}
        <div className="flex items-center gap-2 mt-3">
          <div
            className={`${isDesktop ? 'w-7 h-7 text-[10px]' : 'w-6 h-6 text-[9px]'} rounded-full flex items-center justify-center font-black text-white flex-shrink-0`}
            style={{ backgroundColor: accentColor }}
          >
            {t(item.nameKey, item.nameFallback).charAt(0)}
          </div>
          <div className="min-w-0">
            <p className={`${isDesktop ? 'text-xs' : 'text-[11px]'} font-bold text-[var(--text-primary)]`}>
              {t(item.nameKey, item.nameFallback)}
            </p>
            <p className={`${isDesktop ? 'text-[10px]' : 'text-[9px]'} text-[var(--text-secondary)]`}>
              {t(item.contextKey, item.contextFallback)}
            </p>
          </div>
          <div className="flex gap-0.5 ml-auto flex-shrink-0">
            {Array.from({ length: 5 }, (_, i) => (
              <ICONS.Star
                key={i}
                weight="fill"
                className={`${isDesktop ? 'w-3.5 h-3.5' : 'w-3 h-3'}`}
                style={{ color: '#FBBF24' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-1.5 justify-center mt-3">
        {TESTIMONIALS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i === currentIndex ? accentColor : 'rgba(0,0,0,0.12)',
              transform: i === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Founder Card (expand on hover/tap)
// ============================================
// ============================================
// Auth Card Component (unchanged from before)
// ============================================
const AuthCard: React.FC<{
  showBranding: boolean;
  accentColor: string;
  accentHover: string;
  accentShadow: string;
  accentBorder: string;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  oauthLoading: 'google' | 'apple' | null;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  message: string;
  setMessage: (v: string) => void;
  showEmailForm: boolean;
  setShowEmailForm: (v: boolean) => void;
  showForgotPassword: boolean;
  setShowForgotPassword: (v: boolean) => void;
  resetLoading: boolean;
  handleOAuthSignIn: (p: 'google' | 'apple') => void;
  handleEmailAuth: (e: React.FormEvent) => void;
  handleForgotPassword: () => void;
  honeypotProps: any;
  honeypotStyles: string;
  hasError: boolean | string;
  isCredentialsError: boolean | string;
}> = ({
  showBranding, accentColor, accentHover, accentShadow, accentBorder,
  email, setEmail, password, setPassword,
  loading, oauthLoading, isSignUp, setIsSignUp, message, setMessage,
  showEmailForm, setShowEmailForm, showForgotPassword, setShowForgotPassword,
  resetLoading, handleOAuthSignIn, handleEmailAuth, handleForgotPassword,
  honeypotProps, honeypotStyles, hasError, isCredentialsError,
}) => {
  const { t } = useTranslation();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmPasswordError('');
    if (isSignUp && password !== confirmPassword) {
      setConfirmPasswordError(t('hero.login.passwordsMismatch', { defaultValue: 'Passwords don\'t match' }));
      return;
    }
    handleEmailAuth(e);
  };

  return (
  <div className="rounded-3xl p-6 lg:px-0 lg:py-0">
    {/* Logo + Headline (mobile only) */}
    {showBranding && (
      <div className="text-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600.000000 600.000000"
          preserveAspectRatio="xMidYMid meet"
          fill={accentColor}
          className="w-16 h-16 mx-auto mb-2"
        >
          <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
            <path d={LOGO_PATH} />
            {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
          </g>
        </svg>
        <h1 className="text-2xl font-black font-header mb-1" style={{ color: '#1a1a2e' }}>
          Love Languages
        </h1>
        <p className="text-xs font-bold" style={{ color: accentColor }}>
          {t('hero.subtitle', 'The only language app designed for couples')}
        </p>
      </div>
    )}

    {/* ─── View A: OAuth buttons (default) ─── */}
    {!showEmailForm && (
      <>
        <div className="space-y-3">
          {/* Google button */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading || oauthLoading !== null}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border glass-card font-semibold transition-all active:scale-[0.98] hover:brightness-105 disabled:opacity-50"
            style={{ borderColor: accentBorder, color: 'var(--text-primary)' }}
          >
            {oauthLoading === 'google' ? (
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: accentBorder, borderTopColor: accentColor }} />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-scale-body">{t('hero.login.continueWithGoogle')}</span>
          </button>

          {/* Apple button */}
          <button
            type="button"
            onClick={() => handleOAuthSignIn('apple')}
            disabled={loading || oauthLoading !== null}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-black text-white font-semibold transition-all active:scale-[0.98] hover:bg-gray-900 disabled:opacity-50"
          >
            {oauthLoading === 'apple' ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            <span className="text-scale-body">{t('hero.login.continueWithApple', 'Continue with Apple')}</span>
          </button>
        </div>

        {/* Free tier reassurance */}
        <p className="text-center text-scale-caption mt-3 font-bold" style={{ color: accentColor, opacity: 0.7 }}>
          {t('signup.freeStartLearning', 'Start learning for $0.00')}
        </p>

        {/* Divider — switch to email */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 h-px" style={{ backgroundColor: accentBorder }} />
          <button
            type="button"
            onClick={() => { setShowEmailForm(true); setMessage(''); }}
            className="text-scale-caption font-bold uppercase tracking-widest hover:opacity-70 transition-colors whitespace-nowrap"
            style={{ color: '#9ca3af' }}
          >
            {t('hero.login.orContinueWithEmail', 'or continue with email')}
          </button>
          <div className="flex-1 h-px" style={{ backgroundColor: accentBorder }} />
        </div>
      </>
    )}

    {/* ─── View B: Email/Password form ─── */}
    {showEmailForm && (
      <>
        <form onSubmit={handleFormSubmit} className="space-y-2.5">
          <style>{honeypotStyles}</style>
          <input {...honeypotProps} />

          {/* Inline error */}
          {hasError && (
            <div className="flex items-center gap-2 text-red-500 text-scale-label font-semibold">
              <ICONS.X className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label
              className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-1.5 ml-1"
              style={{ color: hasError ? '#ef4444' : '#9ca3af' }}
            >
              {t('hero.login.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-[var(--text-secondary)] font-bold text-scale-body"
              style={{
                backgroundColor: '#ffffff',
                color: '#1a1a2e',
                borderColor: hasError ? '#ef4444' : accentBorder,
              }}
              onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentColor}
              onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentBorder}
              placeholder={t('hero.login.emailPlaceholder')}
            />
          </div>

          <div>
            <label
              className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-1.5 ml-1"
              style={{ color: hasError ? '#ef4444' : '#9ca3af' }}
            >
              {t('hero.login.passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); setConfirmPasswordError(''); }}
                required={!showForgotPassword}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-[var(--text-secondary)] font-bold text-scale-body"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1a1a2e',
                  borderColor: hasError ? '#ef4444' : accentBorder,
                }}
                onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentColor}
                onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentBorder}
                placeholder={t('hero.login.passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:opacity-80 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.484 4.484l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="mt-1.5 text-scale-caption font-semibold transition-all hover:opacity-70"
                style={{ color: accentColor }}
              >
                {showForgotPassword ? t('hero.login.backToLogin') : t('hero.login.forgotPassword')}
              </button>
            )}
          </div>

          {/* Confirm Password (sign-up only) */}
          {isSignUp && (
            <div>
              <label
                className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-1.5 ml-1"
                style={{ color: confirmPasswordError ? '#ef4444' : '#9ca3af' }}
              >
                {t('hero.login.confirmPasswordLabel', { defaultValue: 'Confirm Password' })}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(''); }}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-[var(--text-secondary)] font-bold text-scale-body"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1a1a2e',
                    borderColor: confirmPasswordError ? '#ef4444' : accentBorder,
                  }}
                  onFocus={(e) => e.target.style.borderColor = confirmPasswordError ? '#ef4444' : accentColor}
                  onBlur={(e) => e.target.style.borderColor = confirmPasswordError ? '#ef4444' : accentBorder}
                  placeholder={t('hero.login.confirmPasswordPlaceholder', { defaultValue: 'Confirm your password' })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:opacity-80 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.484 4.484l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1.5 text-sm font-semibold text-red-500">{confirmPasswordError}</p>
              )}
            </div>
          )}

          {/* Submit / Reset button */}
          {showForgotPassword ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading || !email}
              className="w-full text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em]"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentShadow}`, transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
            >
              {resetLoading ? t('hero.login.sending') : t('hero.login.sendResetLink')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em]"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentShadow}`, transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
            >
              {loading ? t('hero.login.entering') : (
                isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')
              )}
            </button>
          )}
        </form>

        {/* Divider — switch back to OAuth */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 h-px" style={{ backgroundColor: accentBorder }} />
          <button
            type="button"
            onClick={() => { setShowEmailForm(false); setMessage(''); }}
            className="text-scale-caption font-bold uppercase tracking-widest hover:opacity-70 transition-colors whitespace-nowrap"
            style={{ color: '#9ca3af' }}
          >
            {t('hero.login.orSignInWith', 'or sign in with')}
          </button>
          <div className="flex-1 h-px" style={{ backgroundColor: accentBorder }} />
        </div>

        {/* Success messages */}
        {message && message.toLowerCase().includes('check') && (
          <div className="mt-3 p-3 rounded-2xl text-scale-label font-bold text-center bg-green-50 text-green-700">
            {message}
          </div>
        )}

        {/* Sign-up / Sign-in toggle */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setConfirmPassword(''); setConfirmPasswordError(''); }}
            className={`text-scale-label font-black uppercase tracking-widest transition-all hover:opacity-70 ${
              isCredentialsError && !isSignUp ? 'animate-pulse' : ''
            }`}
            style={{ color: accentColor }}
          >
            {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
            {isCredentialsError && !isSignUp && ' \u2190'}
          </button>
        </div>
      </>
    )}
  </div>
  );
};

// ============================================
// Scroll Reveal Hook (mobile)
// ============================================
function useScrollReveal() {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    refs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return { setRef };
}

// ============================================
// Main Landing Component
// ============================================
const Landing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { setRef } = useScrollReveal();

  // Student / Tutor role toggle
  const [selectedRole, setSelectedRole] = useState<HeroRole>(() => {
    try {
      const saved = localStorage.getItem('intended_role');
      return saved === 'tutor' ? 'tutor' : 'student';
    } catch { return 'student'; }
  });

  useEffect(() => {
    try { localStorage.setItem('intended_role', selectedRole); } catch {}
  }, [selectedRole]);

  const accentColor = selectedRole === 'student' ? BRAND.primary : BRAND.teal;
  const accentHover = selectedRole === 'student' ? BRAND.primaryHover : BRAND.tealHover;
  const accentShadow = selectedRole === 'student' ? BRAND.shadow : BRAND.tealShadow;
  const accentBorder = selectedRole === 'student' ? BRAND.border : '#99f6e4';
  const secondaryColor = selectedRole === 'student' ? BRAND.gold : BRAND.ice;
  const bgColor = selectedRole === 'student' ? BRAND.light : BRAND.tealLight;

  // Native language
  const [nativeLanguage, setNativeLanguage] = useState<string>('en');

  // Demo language for showcase (auto-detect from browser, fallback to 'en')
  const [demoLanguage, setDemoLanguage] = useState<LanguageCode>(() => {
    const browserLang = navigator.language.split('-')[0];
    return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(browserLang)
      ? browserLang as LanguageCode
      : 'en' as LanguageCode;
  });

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { honeypotProps, honeypotStyles, isBot } = useHoneypot();

  // PWA Install prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();

  useEffect(() => {
    if (isNativeApp) return;
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handleBeforeInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent); };
    const handleAppInstalled = () => { setInstallPrompt(null); setIsInstalled(true); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', handleBeforeInstall); window.removeEventListener('appinstalled', handleAppInstalled); };
  }, [isNativeApp]);

  // App Store waitlist email capture
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistClosing, setWaitlistClosing] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const closeWaitlistModal = useCallback(() => {
    setWaitlistClosing(true);
    setTimeout(() => { setWaitlistOpen(false); setWaitlistClosing(false); }, 200);
  }, []);

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    setWaitlistLoading(true);
    try {
      await supabase.from('app_store_waitlist').insert({ email: waitlistEmail, platform: 'ios', created_at: new Date().toISOString() });
      setWaitlistSubmitted(true);
      setWaitlistEmail('');
      setTimeout(() => { closeWaitlistModal(); setWaitlistSubmitted(false); }, 2500);
    } catch { /* silently fail */ }
    setWaitlistLoading(false);
  };

  // Auto-detect native language
  useEffect(() => {
    const saved = localStorage.getItem('preferredNativeLanguage')
      || localStorage.getItem('preferredLanguage');
    if (saved && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(saved)) {
      setNativeLanguage(saved);
      i18n.changeLanguage(saved);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if ((SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(browserLang)) {
        setNativeLanguage(browserLang);
        i18n.changeLanguage(browserLang);
      }
    }
  }, [i18n]);

  // OAuth sign-in
  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');
    // Only track signup_started for new signups, not returning user logins
    if (isSignUp) {
      analytics.trackSignupStarted(provider);
    }

    if (provider === 'apple' && Capacitor.getPlatform() === 'ios') {
      try {
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
        const { generateNonce } = await import('../utils/apple-auth');
        const { rawNonce, hashedNonce } = await generateNonce();
        const result = await SignInWithApple.authorize({
          clientId: 'com.lovelanguages.app',
          redirectURI: '',
          scopes: 'email name',
          nonce: hashedNonce,
        });
        if (result.response.givenName || result.response.familyName) {
          const appleName = [result.response.givenName, result.response.familyName]
            .filter(Boolean).join(' ');
          localStorage.setItem('apple_display_name', appleName);
        }
        const { error: tokenError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: result.response.identityToken,
          nonce: rawNonce,
        });
        if (tokenError) {
          setMessage(tokenError.message);
          setOauthLoading(null);
        }
      } catch (err: any) {
        if (err?.message?.includes('cancelled') || err?.code === '1001') {
          setOauthLoading(null);
        } else {
          console.error('[Landing] Native Apple Sign In error:', err);
          setMessage(err?.message || 'Apple Sign In failed. Please try again.');
          setOauthLoading(null);
        }
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${APP_URL}/` },
    });
    if (error) {
      setMessage(error.message);
      setOauthLoading(null);
    }
  };

  // Email/password auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (isBot()) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1000));
      setMessage(t('hero.login.resetEmailSent'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage('');
    // Only track signup_started for new signups, not returning user logins
    if (isSignUp) {
      analytics.trackSignupStarted('email');
    }
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { native_language: nativeLanguage || 'en' } },
      });
      setLoading(false);
      if (error) setMessage(error.message);
      else setMessage(t('hero.login.checkEmail'));
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setMessage(error.message);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email) { setMessage(t('hero.login.enterEmailFirst')); return; }
    setResetLoading(true);
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/#/reset-password`,
    });
    setResetLoading(false);
    if (error) setMessage(error.message);
    else { setMessage(t('hero.login.resetEmailSent')); setShowForgotPassword(false); }
  };

  // Error helpers
  const isCredentialsError = message && (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('credentials') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no user')
  );
  const hasError = message && !message.toLowerCase().includes('check');

  const authCardProps = {
    accentColor, accentHover, accentShadow, accentBorder,
    email, setEmail, password, setPassword, loading, oauthLoading,
    isSignUp, setIsSignUp, message, setMessage, showEmailForm, setShowEmailForm,
    showForgotPassword, setShowForgotPassword, resetLoading,
    handleOAuthSignIn, handleEmailAuth, handleForgotPassword,
    honeypotProps, honeypotStyles, hasError, isCredentialsError,
  };

  // Headline
  const headlineData = ROLE_HEADLINES[selectedRole];
  const headlineText = t(headlineData.headline);
  const headlineHighlights = headlineData.highlights.map(k => t(k));
  const headlineParts = renderHighlightedText(headlineText, headlineHighlights, accentColor);
  const footerText = t('hero.bottomSections.rall.story.paragraph6', "We built this for every couple who already has something beautiful.").split('. ')[0] + '.';

  const FooterLinks = () => (
    <div className="text-center space-x-4">
      <a href="/#/terms" className="text-scale-caption font-semibold transition-colors" style={{ color: '#b4899a' }}>
        {t('footer.terms', 'Terms of Service')}
      </a>
      <span style={{ color: BRAND.border }}>|</span>
      <a href="/#/privacy" className="text-scale-caption font-semibold transition-colors" style={{ color: '#b4899a' }}>
        {t('footer.privacy', 'Privacy Policy')}
      </a>
    </div>
  );

  // ============================================
  // Render
  // ============================================
  return (
    <div
      ref={containerRef}
      className="h-screen relative overflow-x-hidden overflow-y-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Hidden SVG defs for heart-shaped clip path */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,1 C0.5,1 0,0.7 0,0.35 C0,0.15 0.15,0 0.3,0 C0.4,0 0.48,0.05 0.5,0.14 C0.52,0.05 0.6,0 0.7,0 C0.85,0 1,0.15 1,0.35 C1,0.7 0.5,1 0.5,1 Z" />
          </clipPath>
        </defs>
      </svg>
      {/* Background layer */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundColor: bgColor, transition: 'background-color 0.4s ease', zIndex: 0 }}
      />

      {/* Abstract romantic gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            top: '-10%', right: '-5%',
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
            filter: 'blur(60px)',
            transition: 'background 0.4s ease',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '400px', height: '400px',
            bottom: '10%', left: '-8%',
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
            filter: 'blur(50px)',
            transition: 'background 0.4s ease',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '300px', height: '300px',
            top: '40%', right: '20%',
            background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transition: 'background 0.4s ease',
          }}
        />
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes auth-glow {
          0%, 100% { box-shadow: 0 8px 32px -8px rgba(0,0,0,0.08), 0 0 0 1px ${accentBorder}, 0 0 20px -8px ${accentShadow}; }
          50% { box-shadow: 0 8px 32px -8px rgba(0,0,0,0.08), 0 0 0 1px ${accentBorder}, 0 0 40px -4px ${accentShadow}; }
        }
        /* Waitlist modal animations */
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes modal-scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modal-scale-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(8px); }
        }

        /* Mobile scroll reveal */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .scroll-reveal-d1 { transition-delay: 0.08s; }
        .scroll-reveal-d2 { transition-delay: 0.16s; }
        .scroll-reveal-d3 { transition-delay: 0.24s; }

        /* Flags marquee */
        .flags-marquee-track { overflow: hidden; }
        .flags-marquee-content {
          display: flex;
          animation: flags-marquee 20s linear infinite;
          width: fit-content;
          will-change: transform;
        }
        .flags-marquee-track:hover .flags-marquee-content {
          animation-play-state: paused;
        }
        @keyframes flags-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flags-marquee-content { animation: none; }
        }
      `}</style>

      {/* Floating hearts background */}
      <InteractiveHearts
        accentColor={accentColor}
        activeSection={0}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        isMobile={isMobile}
      />

      {/* Word particle effect — desktop only */}
      {isDesktop && (
        <WordParticleEffect
          accentColor={BRAND.primary}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      )}

      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT (≥ lg) — Full-Viewport Bento
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col h-screen max-w-[1400px] mx-auto px-8 xl:px-12 py-5 relative z-10">

        {/* Nav row: Logo + RoleToggle */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0" style={{ animation: 'reveal-up 0.5s ease-out both' }}>
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-10 h-10"
              style={{ transition: 'fill 0.3s ease' }}
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d={LOGO_PATH} />
                {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
              </g>
            </svg>
            <span className="text-xl font-black font-header" style={{ color: '#1a1a2e' }}>
              Love Languages
            </span>
          </div>
          <RoleToggle role={selectedRole} onToggle={setSelectedRole} />
        </div>

        {/* Bento Grid — 3-column asymmetric with grid-template-areas */}
        <div key={selectedRole} className="flex-1 grid gap-2.5 min-h-0" style={{
          gridTemplateColumns: '5fr 3fr 4fr',
          gridTemplateRows: 'repeat(9, 1fr) auto auto',
          gridTemplateAreas: showEmailForm ? `
            "headline   tagline    auth"
            "headline   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   testimonials"
            "bottomleft blog       testimonials"
            "flags      flags      flags"
            "footer     footer     footer"
          ` : `
            "headline   tagline    auth"
            "headline   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   auth"
            "showcase   founders   startfree"
            "showcase   founders   testimonials"
            "showcase   founders   testimonials"
            "bottomleft blog       testimonials"
            "flags      flags      flags"
            "footer     footer     footer"
          `,
        }}>

          {/* Headline — top-left hero */}
          <div
            className="p-3 flex flex-col justify-center glass-card rounded-[20px]"
            style={{ gridArea: 'headline', animation: 'reveal-up 0.5s ease-out 0.05s both' }}
          >
            <h2 className="text-xl xl:text-2xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1] font-header">
              {headlineParts}
            </h2>
            <p className="text-xs xl:text-sm text-[var(--text-secondary)] font-medium mt-2 leading-relaxed">
              {t('hero.shared.section0.copy', 'Built on Relationship-Aware Language Learning (RALL), Love Languages helps couples bridge the language gap—one meaningful word at a time.')}
            </p>
          </div>

          {/* Tagline — medium accent card */}
          <div
            className="py-2 px-3 flex flex-col justify-center items-center text-center"
            style={{
              gridArea: 'tagline',
              backgroundColor: accentColor,
              borderRadius: '20px',
              animation: 'reveal-up 0.5s ease-out 0.06s both',
            }}
          >
            <p className="text-xs italic tracking-wide font-bold text-white leading-snug">
              {t('hero.landing.tagline.pre', 'The')} <span className="uppercase text-sm font-black not-italic">{t('hero.landing.tagline.only', 'only')}</span> {t('hero.landing.tagline.post', 'language app designed for couples')}
            </p>
          </div>

          {/* Auth Card — right column hero */}
          <div
            className="flex flex-col overflow-y-auto"
            style={{
              gridArea: 'auth',
              backgroundColor: 'rgba(255, 255, 255, 0.72)',
              border: `1px solid ${accentBorder}`,
              borderRadius: '20px',
              animation: `reveal-up 0.5s ease-out 0.11s both, auth-glow 4s ease-in-out 1s infinite`,
              willChange: 'transform, opacity',
            }}
          >
            <div className="flex-1 flex flex-col justify-center px-5 py-2">
              {/* Auth header — slides up and fades out when email form is active */}
              <div
                className={`text-center overflow-hidden transition-all duration-300 ease-out ${
                  showEmailForm
                    ? 'max-h-0 opacity-0 mb-0'
                    : 'max-h-24 opacity-100 mb-2'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  {selectedRole === 'student'
                    ? <ICONS.Heart className="w-5 h-5" style={{ color: accentColor }} />
                    : <ICONS.Lightbulb className="w-5 h-5" style={{ color: accentColor }} />
                  }
                </div>
                <h3 className="text-base font-black tracking-tight font-header" style={{ color: '#1a1a2e' }}>
                  {selectedRole === 'student' ? t('hero.login.startLearning', 'Start Learning') : t('hero.login.startTeaching', 'Start Teaching')}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {t('hero.login.joinCouples', 'Join couples learning together')}
                </p>
              </div>
              <AuthCard showBranding={false} {...authCardProps} />
            </div>
          </div>

          {/* Start Today — hidden when email form is active, auth absorbs its row */}
          {!showEmailForm && (
            <div
              className="p-3 flex flex-col justify-center items-center text-center"
              style={{
                gridArea: 'startfree',
                backgroundColor: selectedRole === 'student' ? accentColor : BRAND.ice,
                borderRadius: '20px',
                animation: 'reveal-up 0.5s ease-out 0.13s both',
              }}
            >
              <p className="text-sm font-black tracking-wide" style={{ color: selectedRole === 'student' ? '#ffffff' : '#1a1a2e' }}>
                {t('hero.landing.startFree', 'Start today for')} <span className="text-base">$0.00</span>
              </p>
            </div>
          )}

          {/* Feature Showcase — spans rows 2-3, interactive demos */}
          <div
            className="glass-card rounded-[20px]"
            style={{ gridArea: 'showcase', animation: 'reveal-up 0.5s ease-out 0.14s both' }}
          >
            <FeatureShowcase
              role={selectedRole}
              accentColor={accentColor}
              demoLanguage={demoLanguage}
              onDemoLanguageChange={setDemoLanguage}
            />
          </div>

          {/* Founders — spans rows 2-3, tall narrative */}
          <div
            className="flex flex-col overflow-hidden min-h-0 glass-card rounded-[20px]"
            style={{ gridArea: 'founders', animation: 'reveal-up 0.5s ease-out 0.08s both' }}
          >
            <div className="p-5 flex flex-col justify-center h-full overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/founders.jpg"
                  alt="Richard & Misia"
                  className="w-16 h-16 object-cover flex-shrink-0"
                  style={{ clipPath: 'url(#heart-clip)', filter: `drop-shadow(0 4px 12px ${accentColor}40)` }}
                />
                <div>
                  <p className="font-bold text-base text-[var(--text-primary)] font-header">
                    {t('hero.bottomSections.rall.story.names', 'Richard & Misia')}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                    {t('hero.bottomSections.rall.story.title', 'Founders')}
                  </p>
                </div>
              </div>
              <div className="border-l-[2px] pl-3 space-y-2" style={{ borderColor: accentColor }}>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph3', 'We tried the apps everyone recommends. But it was always just me and a screen. Misia couldn\'t see where I was stuck. She couldn\'t help where it mattered.')}
                </p>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph4', 'So I built something to catch the words she taught me. Then to practice them. Then to feel a little more ready for the moments that mattered most.')}
                </p>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph6', 'We built this for every couple who already has something beautiful. Now imagine understanding every word, every joke, every part of their world. Their language isn\'t just how they speak — it\'s who they are.')}
                </p>
              </div>
            </div>
          </div>

          {/* Free Learning Material — column 2, row 9 */}
          <a
            href={`/learn/${nativeLanguage}/`}
            className="flex items-center gap-3 px-4 py-2.5 overflow-hidden no-underline hover:scale-[1.01] transition-transform glass-card rounded-[20px]"
            style={{ gridArea: 'blog', animation: 'reveal-up 0.5s ease-out 0.18s both' }}
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                <span className="text-sm">📚</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black font-header text-[var(--text-primary)]">{t('hero.landing.learn.title', 'Free Learning Material')}</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>{t('hero.landing.learn.count', '11,500+')}</span>
              </div>
              <p className="text-[9px] text-[var(--text-secondary)] truncate mt-0.5">{t('hero.landing.learn.topics', 'Pet names · Date phrases · Grammar · Culture')}</p>
            </div>
            <span className="text-[10px] font-bold flex-shrink-0" style={{ color: accentColor }}>→</span>
          </a>

          {/* Testimonials — row 3 right */}
          <div style={{ gridArea: 'testimonials', overflow: 'hidden' }}>
            <TestimonialsCard isDesktop={true} accentColor={accentColor} className="p-4 flex flex-col justify-center h-full" delay={0.2} />
          </div>

          {/* Bottom-left: Install + App Store + Socials — all side-by-side in column 1 */}
          <div
            className="flex flex-row gap-2"
            style={{ gridArea: 'bottomleft', animation: 'reveal-up 0.5s ease-out 0.16s both' }}
          >
            {/* Install App */}
            <button
              onClick={() => installPrompt?.prompt()}
              disabled={!installPrompt && !isInstalled}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-2.5 cursor-pointer transition-all hover:scale-[1.02] glass-card rounded-[20px]"
              style={{
                opacity: (!installPrompt && !isInstalled) ? 0.5 : 1,
              }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <ICONS.Download size={14} color={accentColor} weight="bold" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-[var(--text-primary)]">
                  {isInstalled ? t('hero.landing.installed', 'Installed') : t('hero.landing.installApp', 'Install App')}
                </p>
                <p className="text-[9px] text-[var(--text-secondary)]">{t('hero.landing.addToHome', 'Add to home screen')}</p>
              </div>
            </button>

            {/* App Store */}
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2 px-2.5 cursor-pointer transition-all hover:scale-[1.02] text-left glass-card rounded-[20px]"
              onClick={() => setWaitlistOpen(true)}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <AppleIcon size={14} className="text-[var(--text-primary)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-primary)]">{t('hero.landing.appStore', 'App Store')}</p>
                <p className="text-[9px] text-[var(--text-secondary)]">{t('hero.landing.comingSoon', 'Coming Soon')}</p>
              </div>
            </button>

            {/* Socials */}
            <div
              className="flex-1 flex items-center justify-center py-2 px-2.5 gap-2 glass-card rounded-[20px]"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] leading-tight">
                {t('hero.landing.followSocials', 'Follow\nSocials').split('\n').map((line: string, i: number) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}
              </p>
              <div className="flex flex-row gap-1 items-center">
                {[
                  { icon: <ICONS.Instagram size={14} weight="regular" />, href: 'https://instagram.com/lovelanguages.xyz', label: 'Instagram', color: '#E4405F' },
                  { icon: <TikTokIcon size={13} />, href: 'https://tiktok.com/@lovelanguages.xyz', label: 'TikTok', color: 'var(--text-primary)' },
                  { icon: <XTwitterIcon size={13} />, href: 'https://x.com/lovelanguagesio', label: 'X', color: 'var(--text-primary)' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-transform hover:scale-110"
                    style={{ color: s.color, backgroundColor: 'rgba(0,0,0,0.04)' }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Flags marquee (full width) */}
          <div
            className="py-2 overflow-hidden glass-card rounded-[20px]"
            style={{ gridArea: 'flags', animation: 'reveal-up 0.5s ease-out 0.3s both' }}
          >
            <div className="flags-marquee-track">
              <div className="flags-marquee-content">
                {[...Array(4)].map((_, dup) => (
                  <React.Fragment key={dup}>
                    {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map(code => {
                      const lang = LANGUAGE_CONFIGS[code];
                      const isSelected = code === demoLanguage;
                      return lang ? (
                        <button
                          key={`${dup}-${code}`}
                          className="text-2xl mx-2 inline-block transition-transform duration-200"
                          style={{
                            transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                            filter: isSelected ? `drop-shadow(0 0 6px ${accentColor})` : 'none',
                          }}
                          title={lang.nativeName}
                          onClick={() => setDemoLanguage(code as LanguageCode)}
                        >
                          {lang.flag}
                        </button>
                      ) : null;
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div
            className="py-1 text-center"
            style={{ gridArea: 'footer', animation: 'reveal-up 0.5s ease-out 0.35s both' }}
          >
            <FooterLinks />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT (< lg) — Auth Above Fold
          ══════════════════════════════════════════ */}
      <div className="lg:hidden relative z-10">

        {/* ─── ABOVE THE FOLD: Auth Section ─── */}
        <div className="min-h-[100dvh] flex flex-col px-4 py-4 max-w-md mx-auto">

          {/* Role toggle — top right */}
          <div className="flex justify-end mb-2 flex-shrink-0">
            <RoleToggle role={selectedRole} onToggle={setSelectedRole} />
          </div>

          {/* Top spacer — pushes content toward vertical center */}
          <div className="flex-1 min-h-4" />

          {/* Centered branding + headline */}
          <div key={selectedRole} className="text-center mb-5" style={{ animation: 'reveal-up 0.5s ease-out both' }}>
            <div className="flex flex-col items-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 600.000000 600.000000"
                preserveAspectRatio="xMidYMid meet"
                fill={accentColor}
                className="w-[120px] h-[120px] mb-2"
                style={{ transition: 'fill 0.3s ease' }}
              >
                <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                  <path d={LOGO_PATH} />
                  {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
                </g>
              </svg>
              <span className="text-[2.5rem] font-black font-header leading-tight" style={{ color: '#1a1a2e' }}>
                Love Languages
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1] font-header">
              {headlineParts}
            </h2>
          </div>

          {/* Auth Card — featured with glow */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${accentBorder}`,
              borderRadius: '20px',
              animation: 'reveal-up 0.5s ease-out 0.15s both, auth-glow 4s ease-in-out 1.5s infinite',
            }}
          >
            <AuthCard showBranding={false} {...authCardProps} />
          </div>

          {/* Bottom spacer — balances with top spacer */}
          <div className="flex-1 min-h-4" />
          <div className="flex justify-center py-2 flex-shrink-0">
            <ICONS.ChevronDown className="w-5 h-5 animate-bounce" style={{ color: accentColor, opacity: 0.4 }} />
          </div>
        </div>

        {/* ─── BELOW THE FOLD: Features + Content ─── */}
        <div className="px-4 pb-6 max-w-md mx-auto space-y-3">

          {/* Feature card — static open (no flip on mobile) */}
          <div
            ref={setRef('features')}
            className="scroll-reveal glass-card rounded-[20px]"
          >
            <MobileGameShowcase
              role={selectedRole}
              accentColor={accentColor}
              demoLanguage={demoLanguage}
              onDemoLanguageChange={setDemoLanguage}
            />
          </div>

          {/* Tagline Card — bright accent */}
          <div
            className="py-1.5 px-3 text-center"
            style={{ backgroundColor: accentColor, borderRadius: '20px' }}
          >
            <p className="text-[11px] italic tracking-wide font-bold text-white leading-snug">
              {t('hero.landing.tagline.pre', 'The')} <span className="uppercase text-xs font-black not-italic">{t('hero.landing.tagline.only', 'only')}</span> {t('hero.landing.tagline.post', 'language app designed for couples')}
            </p>
          </div>

          {/* Download Row */}
          <div className="flex gap-2">
            {/* PWA Install */}
            <button
              onClick={() => installPrompt?.prompt()}
              disabled={!installPrompt && !isInstalled}
              className="flex-1 flex items-center gap-2.5 p-3 glass-card rounded-[20px]"
              style={{ opacity: (!installPrompt && !isInstalled) ? 0.5 : 1 }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <ICONS.Download size={16} color={accentColor} weight="bold" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">{isInstalled ? t('hero.landing.installed', 'Installed') : t('hero.landing.installApp', 'Install App')}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{t('hero.landing.addToHome', 'Add to home screen')}</p>
              </div>
            </button>
            {/* App Store → opens modal */}
            <button
              className="flex-1 flex items-center gap-2.5 p-3 cursor-pointer text-left glass-card rounded-[20px]"
              onClick={() => setWaitlistOpen(true)}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <AppleIcon size={16} className="text-[var(--text-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)]">{t('hero.landing.appStore', 'App Store')}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{t('hero.landing.comingSoon', 'Coming Soon')}</p>
              </div>
            </button>
          </div>

          {/* Social Icons — Combined Card */}
          <div className="p-3 flex flex-col items-center gap-2 glass-card rounded-[20px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{t('hero.landing.followSocials', 'Follow our socials')}</p>
            <div className="flex gap-4">
              {[
                { icon: <ICONS.Instagram size={20} weight="regular" />, href: 'https://instagram.com/lovelanguages.xyz', label: 'Instagram', color: '#E4405F' },
                { icon: <TikTokIcon size={18} />, href: 'https://tiktok.com/@lovelanguages.xyz', label: 'TikTok', color: 'var(--text-primary)' },
                { icon: <XTwitterIcon size={17} />, href: 'https://x.com/lovelanguagesio', label: 'X', color: 'var(--text-primary)' },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className="transition-transform hover:scale-110"
                  style={{ color: s.color }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Testimonials — auto-cycling */}
          <div ref={setRef('testim')} className="scroll-reveal scroll-reveal-d1">
            <TestimonialsCard isDesktop={false} accentColor={accentColor} className="p-3" />
          </div>

          {/* Flags marquee */}
          <div
            ref={setRef('flags')}
            className="scroll-reveal scroll-reveal-d2 py-2 overflow-hidden glass-card rounded-[20px]"
          >
            <div className="flags-marquee-track">
              <div className="flags-marquee-content">
                {[...Array(4)].map((_, dup) => (
                  <React.Fragment key={dup}>
                    {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map(code => {
                      const lang = LANGUAGE_CONFIGS[code];
                      return lang ? (
                        <span key={`${dup}-${code}`} className="text-xl mx-1.5 inline-block" title={lang.nativeName}>
                          {lang.flag}
                        </span>
                      ) : null;
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Founder Card — full content, no flip on mobile */}
          <div
            ref={setRef('founder')}
            className="scroll-reveal scroll-reveal-d3 glass-card rounded-[20px]"
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="/founders.jpg"
                  alt="Richard & Misia"
                  className="w-12 h-12 object-cover flex-shrink-0"
                  style={{ clipPath: 'url(#heart-clip)', filter: `drop-shadow(0 2px 8px ${accentColor}40)` }}
                />
                <div>
                  <p className="font-bold text-sm text-[var(--text-primary)] font-header">
                    {t('hero.bottomSections.rall.story.names', 'Richard & Misia')}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                    {t('hero.bottomSections.rall.story.title', 'Founders')}
                  </p>
                </div>
              </div>
              <div className="border-l-[2px] pl-3 space-y-1.5" style={{ borderColor: accentColor }}>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph1', 'It started because I kept forgetting.')}
                </p>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph2', 'Misia would teach me a word in Polish. How to say something properly, how to tell her family I loved the food. By morning it was gone.')}
                </p>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph3', 'We tried the apps everyone recommends. But it was always just me and a screen. Misia couldn\'t see where I was stuck. She couldn\'t help where it mattered.')}
                </p>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph4', 'So I built something to catch the words she taught me. Then to practice them. Then to feel a little more ready for the moments that mattered most.')}
                </p>
                <p className="text-xs italic text-[var(--text-secondary)] leading-relaxed">
                  {t('hero.bottomSections.rall.story.paragraph6', 'We built this for every couple who already has something beautiful. Now imagine understanding every word, every joke, every part of their world. Their language isn\'t just how they speak — it\'s who they are.')}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-1">
            <FooterLinks />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          APP STORE WAITLIST MODAL
          ══════════════════════════════════════════ */}
      {waitlistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            animation: waitlistClosing ? 'modal-fade-out 0.2s ease-out forwards' : 'modal-fade-in 0.2s ease-out forwards',
          }}
          onClick={closeWaitlistModal}
        >
          <div
            className="w-full max-w-sm p-6 relative glass-card-solid rounded-[20px]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              animation: waitlistClosing ? 'modal-scale-out 0.2s ease-out forwards' : 'modal-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeWaitlistModal}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            >
              <ICONS.X size={14} className="text-[var(--text-secondary)]" />
            </button>

            {waitlistSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#10b98120' }}>
                  <ICONS.CheckCircle size={24} color="#10b981" weight="fill" />
                </div>
                <p className="text-base font-bold text-[var(--text-primary)] mb-1">We'll let you know!</p>
                <p className="text-xs text-[var(--text-secondary)]">You'll be the first to hear when we launch.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${accentColor}15` }}>
                    <AppleIcon size={24} className="text-[var(--text-primary)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] font-header">{t('hero.landing.appStore', 'App Store')}</h3>
                  <span
                    className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    {t('hero.landing.comingSoon', 'Coming Soon')}
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">{t('hero.landing.waitlist.description', 'Get notified when we launch on the App Store.')}</p>
                </div>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[var(--border-color)] outline-none focus:border-[var(--border-color)] transition-colors"
                    onKeyDown={e => e.key === 'Enter' && handleWaitlistSubmit()}
                    autoFocus
                  />
                  <button
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistLoading}
                    className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {waitlistLoading ? t('hero.landing.waitlist.submitting', 'Submitting...') : t('hero.landing.waitlist.notify', 'Notify Me')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
