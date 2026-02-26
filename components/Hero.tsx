
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';
import { ICONS } from '../constants';
import { DEFAULT_THEME, applyTheme } from '../services/theme';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES, LanguageCode } from '../constants/language-config';
import { useHoneypot } from '../hooks/useHoneypot';

// Hero sub-components (extracted for readability)
import {
  BRAND,
  POPULAR_LANGUAGES,
  GameShowcase,
  HeroFAQ,
  HeroRALL,
  HeroBlog,
  HeroFooter,
  InteractiveHearts,
  WordParticleEffect,
  Section,
  LOGO_PATH,
  LOGO_DETAIL_PATHS,
  MobileSection,
  LanguageGrid,
  LoginForm,
  NativeLanguagePill,
  renderWithHighlights,
} from './hero/index';
import type { HeroRole, SelectionStep } from './hero/index';

// CSS Keyframe animations (injected once)
const ANIMATION_STYLES = `
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  @keyframes reveal-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes underline-draw {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .section-content > * {
    opacity: 0;
  }

  .section-content.visible > *:nth-child(1) {
    animation: reveal-up 0.6s ease-out forwards;
  }

  .section-content.visible > *:nth-child(2) {
    animation: reveal-up 0.6s ease-out 0.1s forwards;
  }

  .section-content.visible > *:nth-child(3) {
    animation: reveal-up 0.6s ease-out 0.2s forwards;
  }

  .section-content.visible > *:nth-child(4) {
    animation: reveal-up 0.6s ease-out 0.3s forwards;
  }

  .section-content.visible > *:nth-child(5) {
    animation: reveal-up 0.6s ease-out 0.4s forwards;
  }

  .typewriter-cursor {
    animation: blink 0.8s infinite;
    font-weight: 100;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }

  .animate-pulse-glow {
    animation: pulse-glow 1.5s ease-in-out infinite;
  }
`;

// Section content - plain data, highlighting applied in component
interface SectionContent {
  headline: string;
  headlineHighlights: string[]; // Words to highlight in headline
  subhead?: string;
  copy: string;
  copyHighlights?: string[]; // Words to highlight in copy
  underlinedPhrase?: string; // Phrase to underline
  copyLinks?: Record<string, string>; // Maps text to URL for clickable links
}

// Section content for both arcs - functions that use t() for translations
const getStudentSections = (t: TFunction): SectionContent[] => [
  // Section 0: What is Love Languages
  {
    headline: t('hero.student.section0.headline'),
    headlineHighlights: [t('hero.student.section0.highlight1')],
    subhead: t('hero.shared.section0.subhead'),
    copy: t('hero.shared.section0.copy'),
    copyHighlights: [t('hero.shared.section0.copyHighlight1'), t('hero.shared.section0.copyHighlight2'), t('hero.shared.section0.copyHighlight3')],
    underlinedPhrase: t('hero.shared.section0.underline'),
  },
  {
    headline: t('hero.student.section1.headline'),
    headlineHighlights: [t('hero.student.section1.highlight1'), t('hero.student.section1.highlight2'), t('hero.student.section1.highlight3')],
    copy: t('hero.student.section1.copy'),
  },
  {
    headline: t('hero.student.section2.headline'),
    headlineHighlights: [t('hero.student.section2.highlight1'), t('hero.student.section2.highlight2')],
    copy: t('hero.student.section2.copy'),
  },
  {
    headline: t('hero.student.section3.headline'),
    headlineHighlights: [t('hero.student.section3.highlight1')],
    copy: t('hero.student.section3.copy'),
  },
  {
    headline: t('hero.student.section4.headline'),
    headlineHighlights: [t('hero.student.section4.highlight1')],
    copy: t('hero.student.section4.copy'),
  },
];

const getTutorSections = (t: TFunction): SectionContent[] => [
  // Section 0: What is Love Languages
  {
    headline: t('hero.tutor.section0.headline'),
    headlineHighlights: [t('hero.tutor.section0.highlight1')],
    subhead: t('hero.shared.section0.subhead'),
    copy: t('hero.shared.section0.copy'),
    copyHighlights: [t('hero.shared.section0.copyHighlight1'), t('hero.shared.section0.copyHighlight2'), t('hero.shared.section0.copyHighlight3')],
    underlinedPhrase: t('hero.shared.section0.underline'),
  },
  {
    headline: t('hero.tutor.section1.headline'),
    headlineHighlights: [t('hero.tutor.section1.highlight1')],
    copy: t('hero.tutor.section1.copy'),
  },
  {
    headline: t('hero.tutor.section2.headline'),
    headlineHighlights: [t('hero.tutor.section2.highlight1')],
    copy: t('hero.tutor.section2.copy'),
  },
  {
    headline: t('hero.tutor.section3.headline'),
    headlineHighlights: [t('hero.tutor.section3.highlight1')],
    copy: t('hero.tutor.section3.copy'),
  },
  {
    headline: t('hero.tutor.section4.headline'),
    headlineHighlights: [t('hero.tutor.section4.highlight1')],
    copy: t('hero.tutor.section4.copy'),
  },
];

// Context-aware login form content (8 items: intro section, sections 1-3, GameShowcase, sections 4-6)
const getStudentContexts = (t: TFunction) => [
  { header: t('hero.shared.context0.header'), cta: t('hero.shared.context0.cta'), subtext: t('hero.shared.context0.subtext') },
  { header: t('hero.student.context1.header'), cta: t('hero.student.context1.cta'), subtext: t('hero.student.context1.subtext') },
  { header: t('hero.student.context2.header'), cta: t('hero.student.context2.cta'), subtext: t('hero.student.context2.subtext') },
  { header: t('hero.student.context3.header'), cta: t('hero.student.context3.cta'), subtext: t('hero.student.context3.subtext') },
  { header: t('hero.student.context4.header'), cta: t('hero.student.context4.cta'), subtext: t('hero.student.context4.subtext') },
];

const getTutorContexts = (t: TFunction) => [
  { header: t('hero.shared.context0.header'), cta: t('hero.shared.context0.cta'), subtext: t('hero.shared.context0.subtext') },
  { header: t('hero.tutor.context1.header'), cta: t('hero.tutor.context1.cta'), subtext: t('hero.tutor.context1.subtext') },
  { header: t('hero.tutor.context2.header'), cta: t('hero.tutor.context2.cta'), subtext: t('hero.tutor.context2.subtext') },
  { header: t('hero.tutor.context3.header'), cta: t('hero.tutor.context3.cta'), subtext: t('hero.tutor.context3.subtext') },
  { header: t('hero.tutor.context4.header'), cta: t('hero.tutor.context4.cta'), subtext: t('hero.tutor.context4.subtext') },
];

// Context for target language selection step (different for student/tutor)
const getStudentTargetStepContext = (t: TFunction) => ({
  header: t('hero.studentTargetStep.header'),
  cta: t('hero.studentTargetStep.cta'),
  subtext: t('hero.studentTargetStep.subtext'),
});

const getTutorTargetStepContext = (t: TFunction) => ({
  header: t('hero.tutorTargetStep.header'),
  cta: t('hero.tutorTargetStep.cta'),
  subtext: t('hero.tutorTargetStep.subtext'),
});

// Main Hero component
const Hero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { targetLang } = useParams<{ targetLang?: string }>();

  // Inject animation styles once
  useEffect(() => {
    const styleId = 'hero-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = ANIMATION_STYLES;
      document.head.appendChild(style);
    }
    applyTheme(DEFAULT_THEME);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<HeroRole>('student');
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [showMobileEmailForm, setShowMobileEmailForm] = useState(false);

  // Computed error states for mobile form
  const mobileIsCredentialsError = message && (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('credentials') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no user')
  );
  const mobileHasError = message && !message.toLowerCase().includes('check');

  // OAuth sign-in handler for mobile form
  const handleMobileOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');

    // Only track signup_started for new signups, not returning user logins
    if (isSignUp) {
      analytics.trackSignupStarted(provider);
    }

    // Store the selected role in localStorage so we can retrieve it after OAuth redirect
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
  };

  // Honeypot anti-bot protection
  const { honeypotProps, honeypotStyles, isBot } = useHoneypot();
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  // Language selection state
  const [currentStep, setCurrentStep] = useState<SelectionStep>('language');
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string | null>(null);
  const [stepTransition, setStepTransition] = useState<'entering' | 'exiting' | null>(null);

  // Mobile language pagination state (6 languages per page)
  const [mobileTargetPage, setMobileTargetPage] = useState(0);

  // Mobile bottom sheet state
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const sheetDragStart = useRef<{ y: number; expanded: boolean } | null>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const nativeAutoDetected = useRef(false);

  // Bottom sheet touch handlers
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    // Only initiate drag from the drag handle area (top ~60px of sheet)
    const sheetRect = bottomSheetRef.current?.getBoundingClientRect();
    if (sheetRect && e.touches[0].clientY > sheetRect.top + 60) return;
    sheetDragStart.current = {
      y: e.touches[0].clientY,
      expanded: sheetExpanded
    };
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!sheetDragStart.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = sheetDragStart.current.y - currentY; // positive = dragging up

    // Clamp the offset
    const maxExpand = window.innerHeight * 0.35; // Can expand 35% more
    const maxCollapse = window.innerHeight * 0.35; // Can collapse 35%

    let newOffset = deltaY;
    if (sheetDragStart.current.expanded) {
      // Already expanded, limit how much further up we can go
      newOffset = Math.max(-maxCollapse, Math.min(50, deltaY));
    } else {
      // Collapsed, limit expansion
      newOffset = Math.max(-50, Math.min(maxExpand, deltaY));
    }

    setSheetDragOffset(newOffset);
  };

  const handleSheetTouchEnd = () => {
    if (!sheetDragStart.current) return;

    const threshold = 80; // px threshold to trigger state change

    if (sheetDragStart.current.expanded) {
      // Was expanded - check if should collapse
      if (sheetDragOffset < -threshold) {
        setSheetExpanded(false);
      }
    } else {
      // Was collapsed - check if should expand
      if (sheetDragOffset > threshold) {
        setSheetExpanded(true);
      }
    }

    setSheetDragOffset(0);
    sheetDragStart.current = null;
  };

  // Initialize from localStorage, URL param, and browser language
  useEffect(() => {
    const savedNative = localStorage.getItem('preferredNativeLanguage') || localStorage.getItem('preferredLanguage');
    const savedTarget = localStorage.getItem('preferredTargetLanguage');

    // URL param takes priority for target language
    const urlTarget = targetLang && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(targetLang) ? targetLang : null;

    // Browser language for first-time visitors
    const browserLang = navigator.language.split('-')[0];
    const validBrowserLang = (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(browserLang) ? browserLang : 'en';

    // Set native language — auto-detect for first-time visitors
    let effectiveNative: string;
    if (savedNative && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedNative)) {
      effectiveNative = savedNative;
    } else {
      effectiveNative = validBrowserLang;
      nativeAutoDetected.current = true;
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
      // Return visitor with both languages set
      setCurrentStep('marketing');
    }
    // Otherwise start at 'language' (default)
  }, [targetLang, i18n]);

  // Handler for native language selection (from pill dropdown)
  const handleNativeSelect = async (code: string) => {
    setNativeLanguage(code);
    // Clear target if it matches the new native
    if (selectedTargetLanguage === code) {
      setSelectedTargetLanguage(null);
      localStorage.removeItem('preferredTargetLanguage');
    }
    // Clamp target page if language count changed
    const newTargetCount = Object.values(LANGUAGE_CONFIGS).filter(l => l.code !== code).length;
    const maxPage = Math.ceil(newTargetCount / 6) - 1;
    if (mobileTargetPage > maxPage) setMobileTargetPage(maxPage);

    // Update localStorage BEFORE i18n change to prevent useEffect race condition
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem('preferredNativeLanguage', code);
    }
    // Await language change to ensure translations load before UI updates
    await i18n.changeLanguage(code);
  };

  // Handler for target language selection
  const handleTargetSelect = async (code: string) => {
    // Animate out
    setStepTransition('exiting');
    await new Promise(resolve => setTimeout(resolve, 200));

    setSelectedTargetLanguage(code);
    // Only set localStorage if user is NOT logged in (prevents overwriting profile settings)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem('preferredTargetLanguage', code);
    }
    setCurrentStep('marketing');

    // Animate in
    setStepTransition('entering');
    setTimeout(() => setStepTransition(null), 200);
  };

  // Handler to go back to language selection
  const handleChangeLanguages = () => {
    nativeAutoDetected.current = false;
    setCurrentStep('language');
    // Reset scroll position
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Intersection Observer to track visible section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-section'));
            if (!isNaN(index)) {
              setActiveSection(index);
              // Track which sections have been seen (for animations)
              setVisibleSections(prev => new Set([...prev, index]));
            }
          }
        });
      },
      {
        threshold: 0.5,
        root: scrollRef.current
      }
    );

    // Observe all sections
    const sections = scrollRef.current?.querySelectorAll('[data-section]');
    sections?.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [selectedRole, currentStep]); // Re-observe when switching to marketing step

  // Reset visible sections when role changes
  useEffect(() => {
    setVisibleSections(new Set([0]));
  }, [selectedRole]);

  // Mobile carousel scroll handler - track active section
  const handleMobileCarouselScroll = () => {
    const carousel = mobileCarouselRef.current;
    if (!carousel) return;

    const scrollLeft = carousel.scrollLeft;
    const cardWidth = carousel.clientWidth;
    const newActiveSection = Math.round(scrollLeft / cardWidth);

    // Mobile carousel has 9 sections (0-8): marketing sections (0-5) + bottom sections (6-8)
    if (newActiveSection !== activeSection && newActiveSection >= 0 && newActiveSection < 9) {
      setActiveSection(newActiveSection);
    }
  };

  // Scroll to specific section in mobile carousel
  const scrollToMobileSection = (index: number) => {
    const carousel = mobileCarouselRef.current;
    if (!carousel) return;

    // Clamp index to valid range (0-8 for mobile)
    const clampedIndex = Math.max(0, Math.min(8, index));
    const cardWidth = carousel.clientWidth;
    carousel.scrollTo({
      left: clampedIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  // Reset mobile carousel position when role changes
  useEffect(() => {
    if (mobileCarouselRef.current) {
      mobileCarouselRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [selectedRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Honeypot check: if bot filled the hidden field, fake success silently
    if (isBot()) {
      // Simulate normal delay then show "success" to not tip off the bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isSignUp) {
        setMessage(t('hero.login.checkEmail'));
      }
      setLoading(false);
      return;
    }

    // Track signup attempt for email signups
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
              // Store language selection in user metadata for email confirmation flow
              // (localStorage may not be available when user clicks confirmation link)
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
    // For sign-in: Do NOT override database preferences
    // User's existing account settings take precedence over localStorage
    // localStorage is only used for the landing page UI before login

    setLoading(false);
  };

  const sections = selectedRole === 'student' ? getStudentSections(t) : getTutorSections(t);
  const contexts = selectedRole === 'student' ? getStudentContexts(t) : getTutorContexts(t);
  const isStudent = selectedRole === 'student';

  // Step-aware context: show different right-side content based on current step
  const currentContext = (() => {
    if (currentStep === 'language') {
      return isStudent ? getStudentTargetStepContext(t) : getTutorTargetStepContext(t);
    }
    // Marketing step: use section-based contexts
    return contexts[activeSection] || contexts[0];
  })();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: isStudent ? '#FEF4F8' : '#F7FAF0',
        color: 'var(--text-primary)',
        // Prevent inherited CSS variables from affecting this component
        isolation: 'isolate',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Mobile: Full-screen layout with horizontal swipe carousel */}
      <div className="md:hidden flex flex-col h-screen-safe overflow-hidden">
        {/* Top: Logo on left, Learn/Teach Toggle on right */}
        <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet"
              fill={accentColor}
              className="w-10 h-10 shrink-0"
            >
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d={LOGO_PATH} />
                {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
              </g>
            </svg>
            <span className="text-scale-body font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </span>
          </div>
          {/* Learn/Teach Toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-scale-caption font-bold transition-all"
              style={isStudent
                ? { backgroundColor: BRAND.primary, boxShadow: `0 4px 8px -2px ${BRAND.shadow}`, color: '#ffffff' }
                : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }
              }
            >
              <ICONS.Heart className="w-3.5 h-3.5" style={{ color: isStudent ? '#ffffff' : 'var(--text-secondary)', fill: isStudent ? '#ffffff' : 'none' }} />
              <span>{t('hero.toggle.learn')}</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-scale-caption font-bold transition-all"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 4px 8px -2px ${BRAND.tealShadow}`, color: '#ffffff' }
                : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }
              }
            >
              <ICONS.Sparkles className="w-3.5 h-3.5" style={{ color: !isStudent ? '#ffffff' : 'var(--text-secondary)' }} />
              <span>{t('hero.toggle.teach')}</span>
            </button>
          </div>
        </div>

        {/* Middle: Language Selection or Marketing Content */}
        <div
          className="flex-1 relative overflow-hidden min-h-0"
          style={{
            transform: `translateY(calc(${sheetExpanded ? '-35vh' : '0px'} - ${sheetDragOffset}px))`,
            transition: sheetDragOffset === 0 ? 'transform 0.3s ease-out' : 'none',
            zIndex: 1
          }}
        >
          {/* Floating hearts background */}
          <InteractiveHearts
            accentColor={accentColor}
            activeSection={currentStep === 'marketing' ? activeSection : 0}
            containerRef={mobileCarouselRef as React.RefObject<HTMLDivElement>}
            isMobile={true}
          />

          {/* Language Selection Step */}
          {currentStep === 'language' && (
            <div
              className={`h-full flex flex-col justify-center px-6 py-4 overflow-y-auto transition-all duration-300 ${
                stepTransition === 'exiting' ? 'opacity-0 translate-x-[-20px]' :
                stepTransition === 'entering' ? 'opacity-0 translate-x-[20px]' : 'opacity-100'
              }`}
            >
              {/* Native language pill — hidden for first-time visitors with auto-detected language */}
              {!nativeAutoDetected.current && (
                <div className="mb-4">
                  <NativeLanguagePill
                    nativeLanguage={nativeLanguage}
                    isStudent={isStudent}
                    onSelect={handleNativeSelect}
                  />
                </div>
              )}

              {/* Target language prompt */}
              <p className="text-scale-body font-bold font-header mb-4" style={{ color: 'var(--text-secondary)' }}>
                {isStudent ? t('hero.languageSelector.targetPrompt') : t('hero.languageSelector.targetPromptTutor')}
              </p>

              {/* Paginated target language grid with arrows */}
              {(() => {
                const allLangs = Object.values(LANGUAGE_CONFIGS).filter(lang => lang.code !== nativeLanguage);
                const perPage = 6;
                const totalPages = Math.ceil(allLangs.length / perPage);
                const startIdx = mobileTargetPage * perPage;
                const pageLangs = allLangs.slice(startIdx, startIdx + perPage);

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {/* Left arrow */}
                      <button
                        onClick={() => setMobileTargetPage(p => Math.max(0, p - 1))}
                        disabled={mobileTargetPage === 0}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileTargetPage > 0 ? (isStudent ? BRAND.light : BRAND.tealLight) : 'var(--bg-primary)' }}
                      >
                        <ICONS.ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                      </button>

                      {/* Language grid - 3 cols x 2 rows */}
                      <div className="flex-1 grid grid-cols-3 gap-2.5">
                        {pageLangs.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => handleTargetSelect(lang.code)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-0"
                            style={{
                              borderColor: selectedTargetLanguage === lang.code ? accentColor : 'var(--border-color)',
                              backgroundColor: selectedTargetLanguage === lang.code ? (isStudent ? BRAND.light : BRAND.tealLight) : 'var(--bg-card)',
                              boxShadow: selectedTargetLanguage === lang.code ? `0 4px 12px -2px ${accentColor}40` : 'none',
                            }}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-scale-micro font-bold text-[var(--text-primary)] truncate w-full text-center">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right arrow */}
                      <button
                        onClick={() => setMobileTargetPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={mobileTargetPage >= totalPages - 1}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileTargetPage < totalPages - 1 ? (isStudent ? BRAND.light : BRAND.tealLight) : 'var(--bg-primary)' }}
                      >
                        <ICONS.ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                      </button>
                    </div>

                    {/* Page dots */}
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMobileTargetPage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${mobileTargetPage === i ? 'scale-125' : 'opacity-40'}`}
                          style={{ backgroundColor: accentColor }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Marketing Content Step */}
          {currentStep === 'marketing' && (
            <div className="h-full relative">
              {/* Marketing content carousel */}
              <div
                ref={mobileCarouselRef}
                className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory h-full hide-scrollbar"
                onScroll={handleMobileCarouselScroll}
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
              >
                {/* Sections 0-3 */}
                {sections.slice(0, 4).map((section, i) => (
                  <MobileSection
                    key={`mobile-${selectedRole}-${i}`}
                    {...section}
                    index={i}
                    isStudent={isStudent}
                    nativeLanguage={nativeLanguage}
                    selectedTargetLanguage={selectedTargetLanguage}
                    onChangeLanguages={handleChangeLanguages}
                  />
                ))}

                {/* Section 4: GameShowcase */}
                <div
                  data-section={4}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center items-center px-4 py-4"
                >
                  <GameShowcase isStudent={isStudent} accentColor={accentColor} sectionIndex={4} isMobile={true} targetLanguage={selectedTargetLanguage} nativeLanguage={nativeLanguage} />
                </div>

                {/* Sections 5-7 */}
                {sections.slice(4).map((section, i) => (
                  <MobileSection
                    key={`mobile-${selectedRole}-${i + 5}`}
                    {...section}
                    index={i + 5}
                    isStudent={isStudent}
                  />
                ))}

                {/* Bottom Sections (FAQ, RALL, Blog+Footer) */}
                <div
                  data-section={6}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col px-6 pt-4 relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                  </div>
                </div>
                <div
                  data-section={7}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col px-6 pt-4 relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                  </div>
                </div>
                <div
                  data-section={8}
                  className="flex-shrink-0 w-full h-full snap-start flex flex-col px-6 pt-4 relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
                    <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Draggable Login Sheet */}
        <div
          ref={bottomSheetRef}
          className="flex-shrink-0 rounded-t-3xl shadow-2xl px-6 pt-2 pb-6 relative overflow-y-auto overflow-x-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            height: `calc(${sheetExpanded ? '80dvh' : '45dvh'} + ${sheetDragOffset}px)`,
            minHeight: '320px',
            maxHeight: '85dvh',
            transition: sheetDragOffset === 0 ? 'height 0.3s ease-out' : 'none',
            zIndex: 10,
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
          }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: '#d1d5db' }}
            />
          </div>

          {/* Content area */}
          <div className="pb-4">
          <ICONS.Heart className="absolute -bottom-16 -right-16 w-48 h-48 opacity-[0.03] pointer-events-none" style={{ color: accentColor }} />

          {/* Progress dots: 1 language + divider + 9 marketing */}
          <div className="flex justify-center gap-1.5 mb-4 flex-wrap max-w-xs mx-auto">
            {/* Language step */}
            <button
              onClick={() => setCurrentStep('language')}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'language' ? 'scale-150' : 'opacity-40'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Language selection"
            />
            {/* Divider */}
            <div className="w-px h-2 bg-gray-300 mx-1" />
            {/* Marketing sections (9 dots on mobile: 0-8) */}
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={`section-${i}`}
                onClick={() => {
                  setCurrentStep('marketing');
                  setTimeout(() => scrollToMobileSection(i), 100);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'marketing' && activeSection === i ? 'scale-150' : 'opacity-40'
                }`}
                style={{ backgroundColor: accentColor }}
                aria-label={`Section ${i + 1}`}
              />
            ))}
          </div>

          {/* Compact Login Form */}
          <div className="w-full max-w-sm mx-auto relative z-10">
            <div className="text-center mb-5">
              <h3
                className="text-2xl font-black mb-1 font-header transition-all duration-300"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentContext.header}
              </h3>
              <p className="font-semibold text-scale-label transition-all duration-300" style={{ color: 'var(--text-secondary)' }}>
                {currentContext.subtext}
              </p>
            </div>

            {/* View A — OAuth buttons (default) */}
            {!showMobileEmailForm && (
              <>
                <div className="space-y-3">
                  {/* Google button */}
                  <button
                    type="button"
                    onClick={() => handleMobileOAuthSignIn('google')}
                    disabled={loading || oauthLoading !== null}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[var(--border-color)] bg-white font-bold text-[var(--text-primary)] text-scale-label transition-all hover:border-gray-300 disabled:opacity-50"
                  >
                    {oauthLoading === 'google' ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span>{t('hero.login.continueWithGoogle')}</span>
                  </button>

                  {/* Apple button */}
                  <button
                    type="button"
                    onClick={() => handleMobileOAuthSignIn('apple')}
                    disabled={loading || oauthLoading !== null}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-bold text-scale-label transition-all hover:bg-gray-900 disabled:opacity-50"
                  >
                    {oauthLoading === 'apple' ? (
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    )}
                    <span>{t('hero.login.continueWithApple', 'Continue with Apple')}</span>
                  </button>
                </div>

                {/* Free tier reassurance */}
                <p className="text-center text-scale-micro text-[var(--text-secondary)] mt-3">
                  {isStudent ? t('signup.freeStartLearning', 'Start learning for $0.00') : t('signup.freeStartTeaching', 'Start teaching for $0.00')}
                </p>

                {/* Divider — switch to email */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <button
                    type="button"
                    onClick={() => { setShowMobileEmailForm(true); setMessage(''); }}
                    className="text-scale-micro font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {t('hero.login.orContinueWithEmail', 'or continue with email')}
                  </button>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}

            {/* View B — Email/Password form */}
            {showMobileEmailForm && (
              <>
                <style dangerouslySetInnerHTML={{ __html: honeypotStyles }} />
                <form onSubmit={handleAuth} className="space-y-3">
                  {/* Inline error message */}
                  {mobileHasError && (
                    <div className="flex items-center gap-2 text-red-500 text-scale-caption font-semibold animate-shake">
                      <ICONS.X className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{message}</span>
                    </div>
                  )}
                  {/* Honeypot field - hidden from users, bots fill it */}
                  <input {...honeypotProps} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: mobileHasError ? '#ef4444' : 'var(--border-color)' }}
                    onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                    onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : 'var(--border-color)'}
                    placeholder={t('hero.login.emailPlaceholder')}
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: mobileHasError ? '#ef4444' : 'var(--border-color)' }}
                    onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                    onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : 'var(--border-color)'}
                    placeholder={t('hero.login.passwordPlaceholder')}
                  />

                  {/* Forgot Password Link (Mobile) */}
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          setMessage(t('hero.login.enterEmailFirst'));
                          return;
                        }
                        setLoading(true);
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/#/reset-password`,
                        });
                        setLoading(false);
                        if (error) {
                          setMessage(error.message);
                        } else {
                          setMessage(t('hero.login.resetEmailSent'));
                        }
                      }}
                      className="mt-1 text-scale-caption font-semibold transition-all hover:opacity-70"
                      style={{ color: accentColor }}
                    >
                      {t('hero.login.forgotPassword')}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading || oauthLoading !== null}
                    className="w-full text-white font-black py-3 rounded-2xl shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-scale-label uppercase tracking-[0.15em]"
                    style={{ backgroundColor: accentColor, boxShadow: `0 15px 30px -8px ${accentShadow}` }}
                  >
                    {loading ? t('hero.login.entering') : (
                      currentStep === 'marketing' ? currentContext.cta : (
                        isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')
                      )
                    )}
                  </button>
                </form>

                {/* Divider — switch back to OAuth */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <button
                    type="button"
                    onClick={() => { setShowMobileEmailForm(false); setMessage(''); }}
                    className="text-scale-micro font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {t('hero.login.orSignInWith', 'or sign in with')}
                  </button>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Success messages */}
                {message && message.toLowerCase().includes('check') && (
                  <div className="mt-3 p-3 rounded-xl text-scale-caption font-bold text-center bg-green-50 text-green-700">
                    {message}
                  </div>
                )}

                {/* Sign-up / Sign-in toggle */}
                <div className="mt-3 text-center">
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                    className={`text-scale-caption font-bold transition-all hover:opacity-70 ${
                      mobileIsCredentialsError && !isSignUp ? 'animate-pulse-glow' : ''
                    }`}
                    style={{
                      color: accentColor,
                      textShadow: mobileIsCredentialsError && !isSignUp ? `0 0 15px ${accentColor}, 0 0 30px ${accentColor}` : 'none'
                    }}
                  >
                    {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
                    {mobileIsCredentialsError && !isSignUp && ' \u2190'}
                  </button>
                </div>
              </>
            )}

            {/* Legal links — always visible */}
            <div className="mt-4 flex justify-center gap-4 text-scale-caption" style={{ color: 'var(--text-secondary)' }}>
              <a href="#/terms" className="hover:underline">{t('hero.legal.terms')}</a>
              <span>|</span>
              <a href="#/privacy" className="hover:underline">{t('hero.legal.privacy')}</a>
            </div>
          </div>
          </div>{/* Close scrollable content area */}
        </div>
      </div>

      {/* Desktop: Split screen layout */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Left: Step-based content with background effects */}
        <div
          ref={scrollRef}
          className={`flex-1 h-screen relative hide-scrollbar overflow-x-hidden ${
            currentStep === 'marketing' ? 'overflow-y-auto snap-y snap-mandatory' :
            currentStep === 'language' ? 'overflow-y-auto flex items-start justify-center' :
            'overflow-hidden flex items-center justify-center'
          }`}
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Background effects container - fixed position so hearts stay visible during scroll */}
          <div className="fixed top-0 left-0 bottom-0 pointer-events-none z-0" style={{ width: '50%' }}>
            {/* Word particle effect - only show when languages are selected */}
            {currentStep === 'marketing' && nativeLanguage && selectedTargetLanguage && (
              <WordParticleEffect
                accentColor={accentColor}
                containerRef={scrollRef as React.RefObject<HTMLDivElement>}
                targetLanguage={selectedTargetLanguage}
                nativeLanguage={nativeLanguage}
              />
            )}
            {/* Interactive floating hearts */}
            <InteractiveHearts
              accentColor={accentColor}
              activeSection={activeSection}
              containerRef={scrollRef as React.RefObject<HTMLDivElement>}
            />
          </div>

          {/* Language Selection Step (combined native pill + target grid) */}
          {currentStep === 'language' && (
            <div
              className={`relative z-10 w-full max-h-full px-8 md:px-16 py-8 transition-all duration-300 ${
                stepTransition === 'exiting' ? 'opacity-0 translate-x-[-20px]' :
                stepTransition === 'entering' ? 'opacity-0 translate-x-[20px]' : 'opacity-100'
              }`}
            >
              {/* Logo - sticky at top */}
              <div className="sticky top-0 pb-6 pt-2 -mt-2 z-10" style={{ backgroundColor: isStudent ? '#FEF4F8' : '#F7FAF0' }}>
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 600.000000 600.000000"
                    preserveAspectRatio="xMidYMid meet"
                    fill={accentColor}
                    className="w-[60px] h-[60px] shrink-0"
                  >
                    <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                      <path d={LOGO_PATH} />
                      {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
                    </g>
                  </svg>
                  <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
                    Love Languages
                  </h1>
                </div>
              </div>
              {/* Native language pill — hidden for first-time visitors with auto-detected language */}
              {!nativeAutoDetected.current && (
                <div className="mb-6">
                  <NativeLanguagePill
                    nativeLanguage={nativeLanguage}
                    isStudent={isStudent}
                    onSelect={handleNativeSelect}
                  />
                </div>
              )}
              <LanguageGrid
                onSelect={handleTargetSelect}
                selectedCode={selectedTargetLanguage}
                excludeCode={nativeLanguage}
                isStudent={isStudent}
                title={t('hero.languageSelector.targetTitle')}
                subtitle={t('hero.languageSelector.targetSubtitle')}
              />
            </div>
          )}

          {/* Marketing Content */}
          {currentStep === 'marketing' && (
            <>
              {/* Sticky language indicator at top - click to change languages */}
              {nativeLanguage && selectedTargetLanguage && (
                <div className="sticky top-0 z-20 pb-8 pt-4">
                  <div className="mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md w-fit">
                    <button
                      onClick={() => setCurrentStep('language')}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-[var(--bg-primary)] transition-all"
                    >
                      <span className="text-lg">{LANGUAGE_CONFIGS[nativeLanguage]?.flag}</span>
                      <span className="text-scale-label font-bold text-[var(--text-secondary)]">{LANGUAGE_CONFIGS[nativeLanguage]?.nativeName}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-lg">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.flag}</span>
                      <span className="text-scale-label font-bold text-[var(--text-secondary)]">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.nativeName}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* First 4 sections (indices 0, 1, 2, 3) */}
              {sections.slice(0, 4).map((section, i) => (
                <Section
                  key={`desktop-${selectedRole}-${i}`}
                  {...section}
                  index={i}
                  isStudent={isStudent}
                  isVisible={visibleSections.has(i)}
                />
              ))}

              {/* Game Showcase - section index 4 */}
              <GameShowcase isStudent={isStudent} accentColor={accentColor} sectionIndex={4} targetLanguage={selectedTargetLanguage} nativeLanguage={nativeLanguage} />

              {/* Remaining sections (indices 5, 6, 7) */}
              {sections.slice(4).map((section, i) => (
                <Section
                  key={`desktop-${selectedRole}-${i + 5}`}
                  {...section}
                  index={i + 5}
                  isStudent={isStudent}
                  isVisible={visibleSections.has(i + 5)}
                />
              ))}

              {/* Bottom Sections - FAQ, RALL, Blog, Footer (indices 6-9) */}
              <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={visibleSections.has(6)} />
              <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={visibleSections.has(7)} />
              <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={visibleSections.has(8)} />
              <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={visibleSections.has(9)} />

            </>
          )}
        </div>

        {/* Right: Sticky panel with toggle + login form */}
        <div
          className="flex-1 flex flex-col items-center justify-start pt-6 px-8 pb-8 rounded-l-[4rem] shadow-2xl relative overflow-y-auto overflow-x-hidden h-screen sticky top-0"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          <ICONS.Heart
            className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none transition-colors duration-500"
            style={{ color: accentColor }}
          />

          {/* Section indicator dots: 1 language + divider + 10 marketing */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {/* Language step */}
            <button
              onClick={() => setCurrentStep('language')}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'language' ? 'scale-150' : 'opacity-30 hover:opacity-60'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Language selection"
            />
            {/* Divider */}
            <div className="w-2 h-px bg-gray-300 my-1" />
            {/* Marketing sections + bottom sections (10 dots: 0-5 marketing, 6-9 bottom) */}
            {Array.from({ length: 10 }).map((_, i) => (
              <button
                key={`section-${i}`}
                onClick={() => {
                  if (nativeLanguage && selectedTargetLanguage) {
                    setCurrentStep('marketing');
                    setTimeout(() => {
                      const section = scrollRef.current?.querySelector(`[data-section="${i}"]`);
                      section?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'marketing' && activeSection === i
                    ? 'scale-150'
                    : 'opacity-30 hover:opacity-60'
                }`}
                style={{ backgroundColor: accentColor }}
                aria-label={`Section ${i + 1}`}
              />
            ))}
          </div>

          {/* Toggle above login form */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={isStudent
                ? { backgroundColor: BRAND.primary, boxShadow: `0 10px 25px -5px ${BRAND.shadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
              }
            >
              <ICONS.Heart className="w-5 h-5" style={{ color: isStudent ? '#ffffff' : 'var(--text-secondary)', fill: isStudent ? '#ffffff' : 'none' }} />
              <span className="font-bold text-scale-label">{t('hero.toggle.learn')}</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 10px 25px -5px ${BRAND.tealShadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
              }
            >
              <ICONS.Sparkles className="w-5 h-5" style={{ color: !isStudent ? '#ffffff' : 'var(--text-secondary)' }} />
              <span className="font-bold text-scale-label">{t('hero.toggle.teach')}</span>
            </button>
          </div>

          <LoginForm
            context={currentContext}
            isStudent={isStudent}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            message={message}
            onSubmit={handleAuth}
            selectedRole={selectedRole}
            setMessage={setMessage}
            currentStep={currentStep}
          />

          {/* Legal links */}
          <div className="mt-6 flex justify-center gap-6 text-scale-label" style={{ color: 'var(--text-secondary)' }}>
            <a href="#/terms" className="hover:underline">{t('hero.legal.termsOfService')}</a>
            <span>|</span>
            <a href="#/privacy" className="hover:underline">{t('hero.legal.privacyPolicy')}</a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;
