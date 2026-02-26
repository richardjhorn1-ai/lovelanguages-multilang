import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';
import { useHoneypot } from '../hooks/useHoneypot';
import { BRAND } from './hero/heroConstants';
import { LOGO_PATH, LOGO_DETAIL_PATHS } from './hero/Section';
import InteractiveHearts from './hero/InteractiveHearts';
import WordParticleEffect from './hero/WordParticleEffect';
import { SUPPORTED_LANGUAGE_CODES, LANGUAGE_CONFIGS } from '../constants/language-config';
import { ICONS } from '../constants';

/**
 * Landing — Auth + marketing page
 *
 * Mobile: Auth card above the fold → scroll down for marketing narrative
 * Desktop (≥1024px): Split layout — marketing left, sticky auth card right
 * All marketing content uses existing i18n keys from Hero.tsx
 */

// ============================================
// Shared highlight renderer + role headlines
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
    ? 'rgba(85, 104, 175, 0.25)'
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
// Marketing Content Component (shared mobile + desktop)
// ============================================
const GLASS_CARD: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.55)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08)',
  borderRadius: '20px',
  willChange: 'transform, opacity',
};

const FEATURES_LEFT = [
  { key: 'feature1' }, // Listen Mode
  { key: 'feature2' }, // Love Log
  { key: 'feature3' }, // Smart Games
];
const FEATURES_RIGHT = [
  { key: 'feature4' }, // Conversation Practice
  { key: 'feature5' }, // Weakest Words
  { key: 'feature6' }, // Voice Chat
];


// ============================================
// Role Toggle Component
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
// Marketing Content Component (shared mobile + desktop)
// ============================================
const MarketingContent = React.memo<{
  isDesktop: boolean;
  role: HeroRole;
  onToggleRole: (r: HeroRole) => void;
}>(({ isDesktop, role, onToggleRole }) => {
  const { t } = useTranslation();
  const accentColor = role === 'student' ? BRAND.primary : BRAND.teal;
  const accentShadow = role === 'student' ? BRAND.shadow : BRAND.tealShadow;

  // Footer: first sentence of paragraph6
  const footerText = t('hero.bottomSections.rall.story.paragraph6', "We built this for every couple who already has something beautiful.").split('. ')[0] + '.';

  // Static headline per role
  const headlineData = ROLE_HEADLINES[role];
  const headlineText = t(headlineData.headline);
  const headlineHighlights = headlineData.highlights.map(k => t(k));
  const headlineParts = renderHighlightedText(headlineText, headlineHighlights, accentColor);

  // Compact feature group: 3 features per card with thin dividers
  const FeatureGroup = ({ features, className, delay }: { features: { key: string }[]; className?: string; delay?: number }) => (
    <div
      className={`${className || ''}`}
      style={{
        ...GLASS_CARD,
        ...(isDesktop && delay !== undefined ? { animation: `reveal-up 0.5s ease-out ${delay}s both` } : {}),
      }}
    >
      {features.map(({ key }, i) => (
        <React.Fragment key={key}>
          {i > 0 && <div className={`h-px ${isDesktop ? 'my-2.5' : 'my-1.5'}`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }} />}
          <div>
            <div className={`flex items-center ${isDesktop ? 'gap-2' : 'gap-1.5'}`}>
              <div className={`h-[2px] ${isDesktop ? 'w-6' : 'w-4'} rounded-full`} style={{ backgroundColor: accentColor, opacity: 0.3 }} />
              <span className={`${isDesktop ? 'text-[10px]' : 'text-[9px]'} font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]`}>
                {t(`hero.bottomSections.rall.offer.${role}.${key}.feature`)}
              </span>
            </div>
            <p className={`${isDesktop ? 'text-[13px]' : 'text-[11px]'} font-semibold text-[var(--text-primary)] leading-snug ${isDesktop ? 'mt-1.5' : 'mt-1'}`}>
              {t(`hero.bottomSections.rall.offer.${role}.${key}.pain`)}
            </p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  // Testimonials card
  const TestimonialsCard = ({ className, delay }: { className?: string; delay?: number }) => (
    <div
      className={`${className || ''}`}
      style={{
        ...GLASS_CARD,
        ...(isDesktop && delay !== undefined ? { animation: `reveal-up 0.5s ease-out ${delay}s both` } : {}),
      }}
    >
      <div>
        <p className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold italic text-[var(--text-primary)] leading-snug`}>
          "{t('hero.testimonials.1.quote', 'This is SO COOL')}"
        </p>
        <p className={`${isDesktop ? 'text-[11px]' : 'text-[10px]'} font-bold text-[var(--text-secondary)] mt-1.5`}>
          {t('hero.testimonials.1.name', 'Alessia')}
        </p>
        <p className={`${isDesktop ? 'text-[10px]' : 'text-[9px]'} uppercase tracking-wider text-[var(--text-secondary)]`}>
          {t('hero.testimonials.1.context', 'Learning for her partner Tomas')}
        </p>
      </div>
      <div className={`h-px ${isDesktop ? 'my-3' : 'my-2'}`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }} />
      <div>
        <p className={`${isDesktop ? 'text-sm' : 'text-xs'} font-semibold italic text-[var(--text-primary)] leading-snug`}>
          "{t('hero.testimonials.2.quote', 'Dude this app is amazing')}"
        </p>
        <p className={`${isDesktop ? 'text-[11px]' : 'text-[10px]'} font-bold text-[var(--text-secondary)] mt-1.5`}>
          {t('hero.testimonials.2.name', 'Alessandra')}
        </p>
        <p className={`${isDesktop ? 'text-[10px]' : 'text-[9px]'} uppercase tracking-wider text-[var(--text-secondary)]`}>
          {t('hero.testimonials.2.context', 'Learning for her boyfriend Miki')}
        </p>
      </div>
    </div>
  );

  // Founder card (shared desktop + mobile)
  const FounderCard = ({ className, delay }: { className?: string; delay?: number }) => (
    <div
      className={`${className || ''}`}
      style={{
        ...GLASS_CARD,
        ...(isDesktop && delay !== undefined ? { animation: `reveal-up 0.5s ease-out ${delay}s both` } : {}),
      }}
    >
      <div className={`flex items-center ${isDesktop ? 'gap-3' : 'gap-2'}`}>
        <img
          src="/founders.jpg"
          alt="Richard & Misia"
          className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'} rounded-full object-cover flex-shrink-0`}
          style={{ border: `2px solid ${accentColor}` }}
        />
        <div>
          <p className={`font-bold ${isDesktop ? 'text-sm' : 'text-xs'} text-[var(--text-primary)]`}>
            {t('hero.bottomSections.rall.story.names', 'Richard & Misia')}
          </p>
          <p className={`${isDesktop ? 'text-[11px]' : 'text-[10px]'} font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]`}>
            {t('hero.bottomSections.rall.story.title', 'Founders')}
          </p>
        </div>
      </div>
      <div className={`border-l-[2px] ${isDesktop ? 'pl-3 mt-3' : 'pl-2 mt-2'}`} style={{ borderColor: accentColor }}>
        <p className={`${isDesktop ? 'text-[11px]' : 'text-[10px]'} italic text-[var(--text-secondary)] leading-relaxed`}>
          "{t('hero.bottomSections.rall.story.paragraph3', 'We tried the apps everyone recommends. But it was always just me and a screen. Misia couldn\'t see where I was stuck. She couldn\'t help where it mattered.')}"
        </p>
        <p className={`${isDesktop ? 'text-[11px]' : 'text-[10px]'} italic text-[var(--text-secondary)] leading-relaxed ${isDesktop ? 'mt-1.5' : 'mt-1'}`}>
          "{t('hero.bottomSections.rall.story.paragraph4', 'So I built something to catch the words she taught me. Then to practice them. Then to feel a little more ready for the moments that mattered most.')}"
        </p>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        {/* Brand mark + toggle — above the grid */}
        <div className="flex items-center justify-between mb-4" style={{ animation: 'reveal-up 0.5s ease-out both' }}>
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-12 h-12"
              style={{ transition: 'fill 0.3s ease' }}
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d={LOGO_PATH} />
                {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
              </g>
            </svg>
            <span className="text-2xl font-black font-header" style={{ color: '#1a1a2e' }}>
              Love Languages
            </span>
          </div>
          <RoleToggle role={role} onToggle={onToggleRole} />
        </div>

        {/* ── Bento Grid — keyed by role for remount animation ── */}
        <div key={role} className="grid grid-cols-2 gap-3">

          {/* Hero card — col-span-2, static headline */}
          <div
            className="col-span-2 p-6"
            style={{ ...GLASS_CARD, animation: 'reveal-up 0.5s ease-out 0.05s both' }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1] font-header">
              {headlineParts}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium mt-3">
              {t('hero.subtitle', 'The only language app designed for couples')}
            </p>
            <div className="h-[2px] w-12 rounded-full mt-3" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
          </div>

          {/* Feature Group Left */}
          <FeatureGroup features={FEATURES_LEFT} className="p-5" delay={0.13} />

          {/* Feature Group Right */}
          <FeatureGroup features={FEATURES_RIGHT} className="p-5" delay={0.21} />

          {/* Testimonials card */}
          <TestimonialsCard className="p-5" delay={0.29} />

          {/* Founder card */}
          <FounderCard className="p-5" delay={0.37} />

          {/* Flags card — col-span-2 */}
          <div
            className="col-span-2 px-5 py-4"
            style={{ ...GLASS_CARD, animation: 'reveal-up 0.5s ease-out 0.45s both' }}
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map(code => {
                const lang = LANGUAGE_CONFIGS[code];
                return lang ? (
                  <span key={code} className="text-lg" title={lang.nativeName}>
                    {lang.flag}
                  </span>
                ) : null;
              })}
            </div>
            <p className="text-xs text-[var(--text-secondary)] italic">{footerText}</p>
          </div>

        </div>
      </>
    );
  }

  // ── MOBILE: Full-width stacked glass cards ──
  return (
    <>
      {/* Toggle — centered above headline */}
      <div className="flex justify-center mb-3">
        <RoleToggle role={role} onToggle={onToggleRole} />
      </div>

      {/* Headline — outside cards, centered */}
      <div key={role} className="mb-4 text-center">
        <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1] font-header mb-1.5">
          {headlineParts}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          {t('hero.subtitle', 'The only language app designed for couples')}
        </p>
      </div>

      {/* Feature + testimonial cards — 2-col bento grid */}
      <div key={`cards-${role}`} className="grid grid-cols-2 gap-2">
        <FeatureGroup features={FEATURES_LEFT} className="p-2.5" />
        <FeatureGroup features={FEATURES_RIGHT} className="p-2.5" />
        <TestimonialsCard className="p-2.5" />
        <FounderCard className="p-2.5" />
      </div>

      {/* Flags strip — plain, centered */}
      <div className="text-center mt-4">
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {(SUPPORTED_LANGUAGE_CODES as readonly string[]).map(code => {
            const lang = LANGUAGE_CONFIGS[code];
            return lang ? (
              <span key={code} className="text-sm" title={lang.nativeName}>{lang.flag}</span>
            ) : null;
          })}
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] italic">{footerText}</p>
      </div>
    </>
  );
});

// ============================================
// Auth Card Component
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
  handleForgotPassword: (e: React.FormEvent) => void;
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
  return (
  <div
    className="rounded-3xl p-8 md:p-10"
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    }}
  >
    {/* Logo + Headline (mobile only — desktop has these on the left) */}
    {showBranding && (
      <div className="text-center mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600.000000 600.000000"
          preserveAspectRatio="xMidYMid meet"
          fill={accentColor}
          className="w-20 h-20 mx-auto mb-3"
        >
          <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
            <path d={LOGO_PATH} />
            {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
          </g>
        </svg>
        <h1 className="text-3xl font-black font-header mb-2" style={{ color: '#1a1a2e' }}>
          Love Languages
        </h1>
        <p className="text-sm font-bold" style={{ color: accentColor }}>
          {t('hero.subtitle', 'The only language app designed for couples')}
        </p>
        <div className="h-[2px] w-10 rounded-full mt-3 mx-auto" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
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
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 glass-card font-bold transition-all hover:bg-[var(--bg-primary)] disabled:opacity-50"
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
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-black text-white font-bold transition-all hover:bg-gray-900 disabled:opacity-50"
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
        <p className="text-center text-scale-caption mt-4 font-bold" style={{ color: accentColor, opacity: 0.7 }}>
          {t('signup.freeStartLearning', 'Start learning for $0.00')}
        </p>

        {/* Divider — switch to email */}
        <div className="flex items-center gap-4 mt-5">
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
        <form onSubmit={handleEmailAuth} className="space-y-4">
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
              className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-2 ml-1"
              style={{ color: hasError ? '#ef4444' : '#9ca3af' }}
            >
              {t('hero.login.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
              required
              className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-[var(--text-secondary)] font-bold text-scale-body"
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
              className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-2 ml-1"
              style={{ color: hasError ? '#ef4444' : '#9ca3af' }}
            >
              {t('hero.login.passwordLabel')}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
              required={!showForgotPassword}
              className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-[var(--text-secondary)] font-bold text-scale-body"
              style={{
                backgroundColor: '#ffffff',
                color: '#1a1a2e',
                borderColor: hasError ? '#ef4444' : accentBorder,
              }}
              onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentColor}
              onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : accentBorder}
              placeholder={t('hero.login.passwordPlaceholder')}
            />
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="mt-2 text-scale-caption font-semibold transition-all hover:opacity-70"
                style={{ color: accentColor }}
              >
                {showForgotPassword ? t('hero.login.backToLogin') : t('hero.login.forgotPassword')}
              </button>
            )}
          </div>

          {/* Submit / Reset button */}
          {showForgotPassword ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading || !email}
              className="w-full text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em] hover:scale-[1.02]"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentShadow}` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
            >
              {resetLoading ? t('hero.login.sending') : t('hero.login.sendResetLink')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em] hover:scale-[1.02]"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentShadow}` }}
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
        <div className="flex items-center gap-4 mt-5">
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
          <div className="mt-4 p-4 rounded-2xl text-scale-label font-bold text-center bg-green-50 text-green-700">
            {message}
          </div>
        )}

        {/* Sign-up / Sign-in toggle */}
        <div className="mt-5 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
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
// Main Landing Component
// ============================================
const Landing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

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
  const accentBorder = selectedRole === 'student' ? BRAND.border : '#bcc4e2'; // pink-200 / sky-200
  const bgColor = selectedRole === 'student' ? BRAND.light : BRAND.tealLight;

  // Native language (UI language) — auto-detect from browser
  const [nativeLanguage, setNativeLanguage] = useState<string>('en');

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

  // Honeypot anti-bot protection
  const { honeypotProps, honeypotStyles, isBot } = useHoneypot();

  // Auto-detect native language on mount
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

  // OAuth sign-in — native Apple on iOS, web redirect for everything else
  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');
    analytics.trackSignupStarted(provider);

    // Native Apple Sign In on iOS — required for App Store approval
    if (provider === 'apple' && Capacitor.getPlatform() === 'ios') {
      try {
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
        const result = await SignInWithApple.authorize({
          clientId: 'com.lovelanguages.app',
          redirectURI: '',
          scopes: 'email name',
        });

        // Apple only sends name on FIRST sign-in — capture immediately
        if (result.response.givenName || result.response.familyName) {
          const appleName = [result.response.givenName, result.response.familyName]
            .filter(Boolean).join(' ');
          localStorage.setItem('apple_display_name', appleName);
        }

        // Exchange Apple identity token with Supabase
        const { error: tokenError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: result.response.identityToken,
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

    // Web OAuth redirect (Google, or Apple on non-iOS)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
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
    analytics.trackSignupStarted('email');
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
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setMessage(t('hero.login.enterEmailFirst')); return; }
    setResetLoading(true);
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
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

  // Shared auth card props
  const authCardProps = {
    accentColor, accentHover, accentShadow, accentBorder,
    email, setEmail, password, setPassword, loading, oauthLoading,
    isSignUp, setIsSignUp, message, setMessage, showEmailForm, setShowEmailForm,
    showForgotPassword, setShowForgotPassword, resetLoading,
    handleOAuthSignIn, handleEmailAuth, handleForgotPassword,
    honeypotProps, honeypotStyles, hasError, isCredentialsError,
  };

  // Footer links
  const FooterLinks = () => (
    <div className="text-center mt-6 space-x-4 pb-4">
      <a href="/#/terms" className="text-scale-caption font-semibold transition-colors" style={{ color: '#b4899a' }}>
        {t('footer.terms', 'Terms of Service')}
      </a>
      <span style={{ color: BRAND.border }}>|</span>
      <a href="/#/privacy" className="text-scale-caption font-semibold transition-colors" style={{ color: '#b4899a' }}>
        {t('footer.privacy', 'Privacy Policy')}
      </a>
    </div>
  );

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
      {/* Background layer — transitions independently from content */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: bgColor,
          transition: 'background-color 0.4s ease',
          zIndex: 0,
        }}
      />

      {/* CSS animations */}
      <style>{`
        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(4px); opacity: 1; }
        }
      `}</style>

      {/* Floating hearts background — full width */}
      <InteractiveHearts
        accentColor={accentColor}
        activeSection={0}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        isMobile={window.innerWidth < 768}
      />

      {/* Pixel word particle effect — desktop only for performance */}
      {window.innerWidth >= 1024 && (
        <WordParticleEffect
          accentColor={BRAND.primary}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      )}

      {/* (Background orbs removed per user request) */}

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT (< lg)
          Auth card → scroll down for marketing
          ══════════════════════════════════════════ */}
      <div className="lg:hidden relative z-10">
        {/* Auth card — above the fold, with scroll hint pinned to bottom */}
        <div className="flex flex-col" style={{ minHeight: '100vh' }}>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm mx-auto px-6 py-6">
              <AuthCard showBranding={true} {...authCardProps} />
              <FooterLinks />
            </div>
          </div>
          {/* Scroll hint — pinned to bottom of auth screen */}
          <div className="flex flex-col items-center gap-1.5 pb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              {t('hero.swipeForMore', 'Swipe to discover more')}
            </p>
            <ICONS.ChevronDown className="w-4 h-4 text-[var(--border-color)]" style={{ animation: 'gentle-bounce 2s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Marketing narrative — scroll to reveal */}
        <div className="px-6 pb-8 max-w-sm mx-auto">
          <MarketingContent isDesktop={false} role={selectedRole} onToggleRole={setSelectedRole} />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT (≥ lg)
          Split: marketing left, sticky auth right
          ══════════════════════════════════════════ */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] min-h-screen max-w-[1400px] mx-auto relative z-10">
        {/* Left: Marketing narrative — flows naturally, page scrolls */}
        <div className="px-10 xl:px-16 2xl:px-20 py-8">
          <div className="max-w-[640px]">
            <MarketingContent isDesktop={true} role={selectedRole} onToggleRole={setSelectedRole} />
          </div>
        </div>

        {/* Right: Sticky auth card */}
        <div className="sticky top-0 h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <AuthCard showBranding={false} {...authCardProps} />
            <FooterLinks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
