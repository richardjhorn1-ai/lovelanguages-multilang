
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
  MobileSection,
  LanguageGrid,
  LoginForm,
  LanguageIndicator,
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
  // Section 0: What is Love Languages (same for both roles)
  {
    headline: t('hero.shared.section0.headline'),
    headlineHighlights: [t('hero.shared.section0.highlight1')],
    copy: t('hero.shared.section0.copy'),
    copyHighlights: [t('hero.shared.section0.copyHighlight1'), t('hero.shared.section0.copyHighlight2'), t('hero.shared.section0.copyHighlight3')],
    underlinedPhrase: t('hero.shared.section0.underline'),
    // copyLinks removed - RALL now in bottom sections
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
  // Section 0: What is Love Languages (same for both roles)
  {
    headline: t('hero.shared.section0.headline'),
    headlineHighlights: [t('hero.shared.section0.highlight1')],
    copy: t('hero.shared.section0.copy'),
    copyHighlights: [t('hero.shared.section0.copyHighlight1'), t('hero.shared.section0.copyHighlight2'), t('hero.shared.section0.copyHighlight3')],
    underlinedPhrase: t('hero.shared.section0.underline'),
    // copyLinks removed - RALL now in bottom sections
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

// Context for native language selection step (same for both roles)
const getNativeStepContext = (t: TFunction) => ({
  header: t('hero.nativeStep.header'),
  cta: t('hero.nativeStep.cta'),
  subtext: t('hero.nativeStep.subtext'),
});

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

    // Track signup started
    analytics.trackSignupStarted(provider);

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
  const mobileStepCarouselRef = useRef<HTMLDivElement>(null);

  // Language selection state
  const [currentStep, setCurrentStep] = useState<SelectionStep>('native');
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string | null>(null);
  const [stepTransition, setStepTransition] = useState<'entering' | 'exiting' | null>(null);

  // Mobile language pagination state (6 languages per page)
  const [mobileNativePage, setMobileNativePage] = useState(0);
  const [mobileTargetPage, setMobileTargetPage] = useState(0);

  // Mobile bottom sheet state
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const sheetDragStart = useRef<{ y: number; expanded: boolean } | null>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

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

    // Set native language
    if (savedNative && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedNative)) {
      setNativeLanguage(savedNative);
      i18n.changeLanguage(savedNative);
    } else if (validBrowserLang) {
      // Don't set native language yet, but prepare the UI in browser language
      i18n.changeLanguage(validBrowserLang);
    }

    // Set target language
    if (urlTarget) {
      setSelectedTargetLanguage(urlTarget);
      localStorage.setItem('preferredTargetLanguage', urlTarget);
    } else if (savedTarget && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(savedTarget)) {
      setSelectedTargetLanguage(savedTarget);
    }

    // Determine starting step
    if (savedNative && (savedTarget || urlTarget)) {
      // Return visitor with both languages OR native + URL target
      setCurrentStep('marketing');
    } else if (savedNative) {
      // Has native but no target
      setCurrentStep('target');
    } else if (urlTarget) {
      // URL target preset but no native yet
      setCurrentStep('native');
    }
    // Otherwise start at 'native' (default)
  }, [targetLang, i18n]);

  // Handler for native language selection
  const handleNativeSelect = async (code: string) => {
    // Animate out
    setStepTransition('exiting');
    await new Promise(resolve => setTimeout(resolve, 200));

    setNativeLanguage(code);
    // Update localStorage BEFORE i18n change to prevent useEffect race condition
    // (useEffect depends on i18n and reads localStorage)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      localStorage.setItem('preferredNativeLanguage', code);
    }
    // Await language change to ensure translations load before UI updates
    await i18n.changeLanguage(code);

    // Always go to target step after selecting native
    // User must confirm/select target language before proceeding
    setCurrentStep('target');

    // Animate in
    setStepTransition('entering');
    setTimeout(() => setStepTransition(null), 200);

    // Mobile: auto-scroll to target step
    if (mobileStepCarouselRef.current) {
      const stepWidth = mobileStepCarouselRef.current.clientWidth;
      mobileStepCarouselRef.current.scrollTo({
        left: stepWidth,
        behavior: 'smooth'
      });
    }
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

    // Mobile: auto-scroll to marketing step
    if (mobileStepCarouselRef.current) {
      const stepWidth = mobileStepCarouselRef.current.clientWidth;
      mobileStepCarouselRef.current.scrollTo({
        left: stepWidth * 2,
        behavior: 'smooth'
      });
    }
  };

  // Handler to go back to language selection
  const handleChangeLanguages = () => {
    setCurrentStep('native');
    // Reset scroll position
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (mobileStepCarouselRef.current) {
      mobileStepCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Handler to go back one step
  const handleBack = () => {
    if (currentStep === 'target') {
      setCurrentStep('native');
      if (mobileStepCarouselRef.current) {
        mobileStepCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else if (currentStep === 'marketing') {
      setCurrentStep('target');
      if (mobileStepCarouselRef.current) {
        const stepWidth = mobileStepCarouselRef.current.clientWidth;
        mobileStepCarouselRef.current.scrollTo({ left: stepWidth, behavior: 'smooth' });
      }
    }
  };

  // Track mobile step carousel scroll
  const handleMobileStepScroll = () => {
    const carousel = mobileStepCarouselRef.current;
    if (!carousel) return;
    const scrollLeft = carousel.scrollLeft;
    const stepWidth = carousel.clientWidth;
    const step = Math.round(scrollLeft / stepWidth);
    const steps: SelectionStep[] = ['native', 'target', 'marketing'];
    if (steps[step] && steps[step] !== currentStep) {
      setCurrentStep(steps[step]);
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
    if (currentStep === 'native') {
      return getNativeStepContext(t);
    }
    if (currentStep === 'target') {
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
        backgroundColor: isStudent ? '#FFF0F3' : '#ccfbf1',
        color: '#1a1a2e',
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
                <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37 l62 1 -5 -34 c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169 l-34 58 34 28 c32 27 33 29 30 99 l-3 71 53 25 c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94 c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z m795 -348 c0 -13 73 -78 87 -78 6 0 13 -4 15 -8 2 -4 36 -25 76 -45 93 -47 191 -120 220 -166 36 -53 49 -130 33 -189 -6 -26 -17 -51 -22 -57 -15 -15 -29 14 -29 65 0 48 -19 113 -38 132 -7 7 -12 17 -12 23 0 25 -156 158 -217 185 -13 5 -23 14 -23 20 0 5 -6 10 -14 10 -8 0 -39 24 -70 53 -43 40 -56 60 -56 82 l0 28 25 -23 c14 -13 25 -27 25 -32z m10 -133 c13 -14 48 -42 79 -62 72 -50 169 -140 189 -178 26 -48 42 -106 42 -158 l0 -48 -50 -21 c-38 -16 -56 -31 -75 -63 -34 -59 -140 -137 -159 -118 -3 4 -6 40 -6 80 0 41 -4 93 -10 116 -5 23 -14 94 -19 157 -5 63 -17 153 -25 199 -15 80 -14 121 3 121 4 0 18 -11 31 -25z m403 -512 c13 -8 8 -31 -9 -37 -9 -3 -35 -6 -59 -6 -43 0 -43 0 -43 -36 0 -37 -25 -74 -50 -74 -7 0 -26 -6 -40 -14 -63 -32 -142 -66 -156 -66 -21 0 -30 18 -16 35 6 7 34 22 62 32 55 19 118 73 139 119 20 41 74 66 124 58 22 -3 43 -8 48 -11z m95 -15 c4 -19 -21 -49 -57 -68 -36 -19 -42 1 -14 48 19 32 31 42 47 40 11 -2 22 -11 24 -20z m2 -114 c0 -8 -8 -17 -17 -21 -10 -3 -25 -12 -33 -19 -27 -23 -69 -28 -76 -9 -9 22 3 32 62 54 52 19 64 18 64 -5z m23 -57 c7 -17 -23 -51 -62 -72 -29 -14 -35 -15 -48 -3 -20 21 -8 40 40 65 50 25 63 27 70 10z m-227 -41 c3 -14 3 -30 -1 -35 -8 -14 -40 -14 -64 -2 -17 10 -81 -6 -98 -23 -14 -14 -75 -36 -84 -30 -18 11 -8 35 19 44 15 6 35 15 44 20 10 6 29 10 42 10 14 0 28 5 31 11 10 15 45 28 77 28 21 1 29 -5 34 -23z m-306 -4 c0 -22 -19 -42 -39 -42 -9 0 -29 -7 -45 -15 -15 -8 -35 -15 -43 -15 -8 0 -27 -6 -41 -14 -15 -8 -45 -21 -67 -29 -154 -57 -272 -105 -308 -123 -34 -17 -53 -18 -63 -3 -9 16 35 49 67 49 14 0 29 4 35 9 9 9 77 36 119 48 11 3 40 14 65 25 43 19 58 25 128 54 74 32 108 47 132 60 35 19 60 17 60 -4z m5 -83 c7 -11 -22 -49 -38 -49 -5 0 -23 -6 -40 -14 -18 -7 -52 -21 -77 -31 -52 -21 -123 -51 -160 -67 -58 -25 -90 -38 -175 -74 -49 -20 -111 -47 -137 -60 -56 -29 -68 -30 -68 -6 0 36 44 70 121 95 42 14 99 34 125 45 27 11 76 30 109 43 33 13 64 27 70 31 5 4 15 8 21 8 14 0 17 1 139 53 90 39 101 41 110 26z m282 -4 c63 0 78 -26 76 -135 -1 -75 -5 -94 -36 -160 -21 -45 -60 -103 -97 -145 -34 -38 -67 -80 -73 -92 -10 -23 -31 -30 -41 -15 -3 5 -8 47 -10 93 -10 152 -18 223 -33 302 -16 83 -13 107 13 107 15 0 31 8 104 46 14 8 32 10 40 7 8 -4 34 -7 57 -8z m166 -12 c28 -32 57 -126 57 -184 0 -105 -53 -179 -248 -349 -57 -49 -115 -151 -106 -185 3 -11 -2 -29 -10 -40 -14 -17 -17 -18 -26 -5 -17 23 -3 95 26 142 15 24 62 79 103 123 90 94 130 146 153 196 25 55 41 152 34 201 -4 23 -9 60 -12 81 -7 40 4 47 29 20z m-3349 -173 c89 -23 118 -40 148 -89 12 -20 27 -40 33 -46 7 -5 27 -30 45 -55 19 -25 47 -57 62 -71 15 -14 28 -29 28 -33 0 -5 -18 -28 -39 -52 -40 -45 -111 -158 -111 -175 0 -25 -41 -87 -62 -93 -48 -12 -77 -7 -94 20 -16 24 -16 29 0 74 10 27 15 58 11 70 -9 29 -58 26 -95 -6 -29 -27 -61 -48 -90 -59 -8 -4 -23 -11 -32 -16 -49 -26 -98 1 -98 54 0 27 12 43 72 99 40 38 76 68 80 68 4 0 8 13 8 28 0 20 -7 33 -24 41 -20 11 -31 9 -77 -12 -103 -47 -147 -57 -258 -56 -123 0 -182 21 -213 76 -17 28 -17 35 -5 65 37 87 179 165 342 188 89 13 282 2 369 -20z m2096 -125 c0 -8 -9 -23 -20 -32 -11 -10 -20 -21 -20 -26 0 -4 -27 -44 -60 -87 -33 -43 -60 -82 -60 -86 0 -6 -32 -47 -75 -96 -8 -10 -15 -21 -15 -24 0 -6 -66 -91 -80 -104 -3 -3 -21 -25 -40 -50 -19 -25 -75 -93 -125 -151 -136 -160 -168 -199 -190 -230 -11 -16 -27 -29 -36 -29 -9 0 -55 29 -102 65 -48 36 -89 65 -92 65 -2 0 -51 34 -107 75 -57 41 -113 82 -125 90 -33 23 -29 33 20 55 31 15 65 20 129 20 130 0 198 37 198 107 0 24 8 45 22 60 l21 23 -23 24 c-26 28 -21 56 10 56 28 0 128 34 225 76 17 7 68 27 115 44 130 48 163 61 192 76 14 8 32 14 40 14 7 0 49 18 93 40 88 43 105 47 105 25z m-1660 -312 c0 -13 -4 -23 -8 -23 -16 0 -52 -59 -64 -103 -22 -84 32 -139 120 -122 42 8 144 42 182 60 14 6 41 19 60 28 84 37 157 70 188 84 30 14 92 81 92 99 0 11 41 54 52 54 12 0 10 -34 -4 -48 -18 -18 9 -34 45 -27 25 4 27 2 25 -23 -3 -24 1 -27 30 -30 19 -2 44 4 57 12 47 31 73 13 38 -26 -11 -12 -30 -18 -59 -18 -24 0 -45 -4 -48 -9 -6 -10 20 -35 47 -44 10 -4 17 -13 15 -20 -3 -8 -39 -14 -114 -17 -83 -4 -118 -10 -146 -25 -277 -148 -466 -214 -607 -215 -84 0 -136 24 -147 67 -20 78 15 192 111 358 52 91 53 91 97 48 22 -22 38 -47 38 -60z m741 22 c0 -13 -41 -19 -41 -7 0 11 20 22 33 18 5 -1 8 -6 8 -11z m-654 -91 c15 -14 39 -34 53 -44 23 -17 24 -20 9 -35 -8 -8 -43 -20 -77 -26 -80 -14 -95 -5 -78 49 27 87 47 99 93 56z m468 -384 c10 -11 24 -20 31 -20 7 0 16 -9 19 -20 5 -15 -5 -34 -37 -73 -24 -28 -52 -63 -63 -76 -93 -113 -238 -267 -266 -282 -18 -9 -61 2 -224 58 -38 14 -83 28 -100 33 -16 5 -68 23 -115 41 -47 17 -104 38 -128 47 l-42 14 -80 -76 c-90 -86 -124 -106 -143 -87 -19 19 43 131 150 270 5 8 64 2 76 -7 7 -5 48 -21 92 -35 44 -14 139 -47 210 -73 169 -60 218 -74 247 -67 42 10 209 199 292 331 29 46 53 53 81 22z m591 -102 c-7 -40 -33 -128 -52 -183 -8 -23 -14 -47 -14 -55 0 -26 -68 -227 -85 -254 -10 -14 -26 -26 -36 -26 -10 0 -20 -4 -24 -10 -3 -5 -20 -14 -38 -19 -18 -5 -52 -17 -77 -27 -25 -9 -76 -23 -115 -30 -124 -22 -189 -35 -241 -50 -28 -8 -60 -14 -72 -14 -12 0 -40 -7 -62 -16 -44 -18 -72 -59 -84 -126 -4 -20 -13 -50 -21 -65 -8 -15 -15 -35 -15 -44 0 -18 -46 -46 -57 -35 -12 11 -4 136 13 226 12 63 22 89 38 101 12 8 77 30 146 48 69 18 143 39 165 46 22 7 69 20 105 30 36 9 81 23 100 30 19 7 62 20 95 30 101 31 118 56 161 240 11 46 26 80 43 100 45 50 91 112 91 124 0 6 10 11 21 11 19 0 21 -4 15 -32z"/>
                <path d="M3547 3638 c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
                <path d="M2826 3435 c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
                <path d="M3153 3281 c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
                <path d="M3305 3131 c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
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
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              <ICONS.Heart className="w-3.5 h-3.5" style={{ color: isStudent ? '#ffffff' : '#4b5563', fill: isStudent ? '#ffffff' : 'none' }} />
              <span>{t('hero.toggle.learn')}</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-scale-caption font-bold transition-all"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 4px 8px -2px ${BRAND.tealShadow}`, color: '#ffffff' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              <ICONS.Sparkles className="w-3.5 h-3.5" style={{ color: !isStudent ? '#ffffff' : '#4b5563' }} />
              <span>{t('hero.toggle.teach')}</span>
            </button>
          </div>
        </div>

        {/* Middle: 3-Step Horizontal Swipe Carousel */}
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
            containerRef={mobileStepCarouselRef as React.RefObject<HTMLDivElement>}
            isMobile={true}
          />

          {/* 3-Step swipeable carousel */}
          <div
            ref={mobileStepCarouselRef}
            className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory h-full hide-scrollbar"
            onScroll={handleMobileStepScroll}
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* Step 1: Native Language Selection */}
            <div className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center px-6 py-4 overflow-y-auto">
              <p className="text-scale-body font-bold mb-4" style={{ color: '#4b5563' }}>
                {t('hero.languageSelector.nativePrompt')}
              </p>
              {/* Paginated language grid with arrows */}
              {(() => {
                const allLangs = Object.values(LANGUAGE_CONFIGS);
                const perPage = 6;
                const totalPages = Math.ceil(allLangs.length / perPage);
                const startIdx = mobileNativePage * perPage;
                const pageLangs = allLangs.slice(startIdx, startIdx + perPage);

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {/* Left arrow */}
                      <button
                        onClick={() => setMobileNativePage(p => Math.max(0, p - 1))}
                        disabled={mobileNativePage === 0}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileNativePage > 0 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
                      >
                        <ICONS.ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                      </button>

                      {/* Language grid - 3 cols x 2 rows */}
                      <div className="flex-1 grid grid-cols-3 gap-2.5">
                        {pageLangs.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => handleNativeSelect(lang.code)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-0"
                            style={{
                              borderColor: nativeLanguage === lang.code ? accentColor : '#e5e7eb',
                              backgroundColor: nativeLanguage === lang.code ? (isStudent ? BRAND.light : BRAND.tealLight) : '#ffffff',
                              boxShadow: nativeLanguage === lang.code ? `0 4px 12px -2px ${accentColor}40` : 'none',
                            }}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-scale-micro font-bold text-gray-700 truncate w-full text-center">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right arrow */}
                      <button
                        onClick={() => setMobileNativePage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={mobileNativePage >= totalPages - 1}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileNativePage < totalPages - 1 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
                      >
                        <ICONS.ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                      </button>
                    </div>

                    {/* Page dots */}
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMobileNativePage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${mobileNativePage === i ? 'scale-125' : 'opacity-40'}`}
                          style={{ backgroundColor: accentColor }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Step 2: Target Language Selection */}
            <div className="flex-shrink-0 w-full h-full snap-start flex flex-col justify-center px-6 py-4 overflow-y-auto">
              <p className="text-scale-body font-bold mb-4" style={{ color: '#4b5563' }}>
                {isStudent ? t('hero.languageSelector.targetPrompt') : t('hero.languageSelector.targetPromptTutor')}
              </p>
              {/* Paginated language grid with arrows */}
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
                        style={{ backgroundColor: mobileTargetPage > 0 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
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
                              borderColor: selectedTargetLanguage === lang.code ? accentColor : '#e5e7eb',
                              backgroundColor: selectedTargetLanguage === lang.code ? (isStudent ? BRAND.light : BRAND.tealLight) : '#ffffff',
                              boxShadow: selectedTargetLanguage === lang.code ? `0 4px 12px -2px ${accentColor}40` : 'none',
                            }}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-scale-micro font-bold text-gray-700 truncate w-full text-center">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right arrow */}
                      <button
                        onClick={() => setMobileTargetPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={mobileTargetPage >= totalPages - 1}
                        className="p-2 rounded-full transition-all disabled:opacity-30"
                        style={{ backgroundColor: mobileTargetPage < totalPages - 1 ? (isStudent ? BRAND.light : BRAND.tealLight) : '#f3f4f6' }}
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

            {/* Step 3: Marketing Content (nested carousel) */}
            <div className="flex-shrink-0 w-full h-full snap-start relative">
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

                {/* Bottom Sections as horizontal slides (indices 6-8, footer combined with blog) */}
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
          </div>
        </div>

        {/* Bottom: Draggable Login Sheet */}
        <div
          ref={bottomSheetRef}
          className="flex-shrink-0 rounded-t-3xl shadow-2xl px-6 pt-2 pb-6 relative overflow-y-auto overflow-x-hidden"
          style={{
            backgroundColor: '#ffffff',
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

          {/* Progress dots at TOP of login section - all steps (native, target, + 8 marketing sections) */}
          <div className="flex justify-center gap-1.5 mb-4 flex-wrap max-w-xs mx-auto">
            {/* Native language step */}
            <button
              onClick={() => {
                mobileStepCarouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'native' ? 'scale-150' : 'opacity-40'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Native language"
            />
            {/* Target language step */}
            <button
              onClick={() => {
                const stepWidth = mobileStepCarouselRef.current?.clientWidth || 0;
                mobileStepCarouselRef.current?.scrollTo({ left: stepWidth, behavior: 'smooth' });
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'target' ? 'scale-150' : 'opacity-40'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Target language"
            />
            {/* Divider */}
            <div className="w-px h-2 bg-gray-300 mx-1" />
            {/* Marketing sections + bottom sections (9 dots on mobile: 0-5 marketing, 6-8 bottom) */}
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={`section-${i}`}
                onClick={() => {
                  const stepWidth = mobileStepCarouselRef.current?.clientWidth || 0;
                  mobileStepCarouselRef.current?.scrollTo({ left: 2 * stepWidth, behavior: 'smooth' });
                  // Also scroll to the section within marketing carousel
                  setTimeout(() => {
                    const carousel = mobileCarouselRef.current;
                    if (carousel) {
                      carousel.scrollTo({ left: i * carousel.clientWidth, behavior: 'smooth' });
                    }
                  }, 100);
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
                style={{ color: '#1a1a2e' }}
              >
                {currentContext.header}
              </h3>
              <p className="font-semibold text-scale-label transition-all duration-300" style={{ color: '#9ca3af' }}>
                {currentContext.subtext}
              </p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: honeypotStyles }} />
            <form onSubmit={handleAuth} className="space-y-3">
              {/* Inline error message */}
              {mobileHasError && (
                <div className="flex items-center gap-2 text-red-500 text-scale-caption font-semibold animate-shake">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
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
                style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: mobileHasError ? '#ef4444' : '#e5e7eb' }}
                onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : '#e5e7eb'}
                placeholder={t('hero.login.emailPlaceholder')}
              />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
                required
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-label"
                style={{ backgroundColor: '#ffffff', color: '#1a1a2e', borderColor: mobileHasError ? '#ef4444' : '#e5e7eb' }}
                onFocus={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : accentColor}
                onBlur={(e) => e.target.style.borderColor = mobileHasError ? '#ef4444' : '#e5e7eb'}
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

              {/* Free tier text */}
              {isSignUp && (
                <p className="text-center text-scale-micro text-gray-500 mt-2">
                  ✨ {isStudent ? t('signup.freeStartLearning', 'Start learning for $0.00') : t('signup.freeStartTeaching', 'Start teaching for $0.00')}
                </p>
              )}
            </form>

            {/* Mobile OAuth Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-scale-micro font-bold uppercase tracking-widest text-gray-400">
                {t('hero.login.orContinueWith', 'or')}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Mobile OAuth Buttons */}
            <div>
              <button
                type="button"
                onClick={() => handleMobileOAuthSignIn('google')}
                disabled={loading || oauthLoading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white font-bold text-gray-700 text-scale-label transition-all hover:border-gray-300 disabled:opacity-50"
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
            </div>

            {/* Success messages only */}
            {message && message.toLowerCase().includes('check') && (
              <div className="mt-3 p-3 rounded-xl text-scale-caption font-bold text-center bg-green-50 text-green-700">
                {message}
              </div>
            )}

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
                {mobileIsCredentialsError && !isSignUp && ' ←'}
              </button>
            </div>

            {/* Legal links */}
            <div className="mt-4 flex justify-center gap-4 text-scale-caption" style={{ color: '#9ca3af' }}>
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
            currentStep === 'marketing' ? 'overflow-y-auto snap-y snap-mandatory' : 'overflow-hidden flex items-center justify-center'
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

          {/* Step 1: Native Language Selection */}
          {currentStep === 'native' && (
            <div
              className={`relative z-10 w-full max-h-full overflow-y-auto px-8 md:px-16 py-8 transition-all duration-300 ${
                stepTransition === 'exiting' ? 'opacity-0 translate-x-[-20px]' :
                stepTransition === 'entering' ? 'opacity-0 translate-x-[20px]' : 'opacity-100'
              }`}
            >
              {/* Logo - sticky at top */}
              <div className="sticky top-0 pb-6 pt-2 -mt-2 z-10">
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 600.000000 600.000000"
                    preserveAspectRatio="xMidYMid meet"
                    fill={accentColor}
                    className="w-[60px] h-[60px] shrink-0"
                  >
                    <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                      <path d="M3550 4590 c-153 -29 -223 -59 -343 -148 -118 -89 -219 -208 -275 -324 -18 -37 -32 -71 -32 -75 0 -5 -5 -25 -11 -45 -11 -41 -43 -53 -53 -20 -14 44 -204 212 -240 212 -7 0 -17 5 -24 12 -13 13 -61 32 -156 59 -57 17 -92 19 -195 16 -124 -3 -183 -15 -261 -51 -143 -66 -271 -201 -328 -343 -50 -124 -53 -145 -53 -313 -1 -199 13 -269 78 -408 10 -20 26 -49 37 -65 16 -21 17 -30 8 -39 -10 -10 -17 -10 -31 -1 -68 42 -315 62 -436 34 -188 -43 -300 -112 -355 -221 -29 -57 -25 -93 14 -153 41 -62 59 -74 145 -98 81 -23 133 -24 200 -2 63 20 84 9 57 -31 -47 -73 4 -185 94 -205 44 -10 115 3 141 25 25 22 49 17 49 -9 0 -13 15 -41 34 -63 33 -38 35 -39 96 -37 l62 1 -5 -34 c-8 -47 28 -111 83 -148 42 -28 46 -29 167 -28 69 0 130 5 136 10 7 5 46 19 87 32 41 13 112 41 157 62 79 39 82 39 112 24 17 -9 31 -23 31 -32 0 -8 -24 -43 -52 -77 -29 -35 -67 -81 -85 -102 -17 -22 -48 -58 -68 -80 -20 -22 -43 -50 -52 -62 -17 -25 -47 -29 -90 -12 -47 19 -216 80 -248 89 -72 21 -211 72 -219 81 -6 5 -29 9 -51 9 -35 0 -49 -7 -87 -43 -79 -75 -156 -214 -165 -299 -5 -52 -3 -61 17 -83 38 -40 86 -34 156 19 33 24 76 62 97 85 21 22 43 41 48 41 9 0 19 -4 77 -33 19 -9 38 -17 44 -17 5 0 24 -6 41 -14 18 -8 73 -27 122 -44 82 -26 123 -39 241 -73 66 -18 100 1 219 121 140 142 159 163 218 253 29 42 56 77 61 77 5 0 33 -18 62 -40 29 -22 55 -40 58 -40 3 0 25 -13 49 -30 25 -16 50 -30 57 -30 16 0 4 -96 -16 -127 -8 -12 -14 -33 -14 -46 0 -44 -13 -50 -250 -122 -25 -8 -65 -19 -90 -26 -25 -6 -60 -18 -78 -25 -18 -8 -42 -14 -53 -14 -11 0 -32 -6 -47 -14 -15 -7 -49 -17 -76 -21 -138 -20 -171 -67 -197 -282 -13 -107 -4 -177 28 -215 20 -23 59 -31 86 -17 29 15 77 60 77 73 0 5 6 17 13 25 7 9 22 43 31 76 35 115 9 99 261 151 193 40 222 47 253 60 18 8 40 14 48 14 45 0 204 104 204 133 0 5 6 23 14 40 7 18 28 84 45 147 18 63 37 130 43 148 5 19 14 57 18 85 5 29 13 70 19 92 6 22 11 57 11 77 0 43 21 81 77 141 21 23 96 119 166 212 70 94 131 175 137 182 5 7 10 14 10 17 0 3 19 32 43 66 47 68 59 76 227 145 63 26 143 60 178 76 35 16 67 29 72 29 4 0 21 6 37 14 38 19 125 58 193 87 30 13 58 27 61 32 4 5 15 7 25 5 17 -3 20 -19 30 -158 6 -85 14 -164 17 -175 3 -11 11 -63 16 -116 9 -81 8 -105 -5 -150 -43 -142 68 -278 192 -236 48 17 81 69 70 111 -8 33 -52 76 -77 76 -63 0 -4 88 136 202 86 70 144 130 176 183 21 36 24 52 24 150 0 106 -1 112 -33 169 l-34 58 34 28 c32 27 33 29 30 99 l-3 71 53 25 c28 14 55 25 60 25 4 0 8 -23 8 -50 0 -43 3 -52 24 -61 34 -16 56 0 124 89 33 43 67 83 76 91 19 16 21 66 4 78 -7 4 -38 11 -68 14 -30 4 -88 13 -128 19 -66 11 -74 11 -92 -5 -29 -26 -25 -59 11 -90 35 -29 34 -33 -19 -52 -55 -19 -67 -16 -83 20 -8 17 -26 38 -41 45 -33 16 -34 17 -8 82 30 75 26 143 -11 215 -43 85 -104 135 -247 205 -111 54 -212 126 -212 151 0 5 12 15 28 21 44 19 72 49 72 79 0 73 -75 125 -142 99 -66 -26 -118 -96 -118 -159 0 -14 10 -51 21 -81 15 -37 24 -90 29 -165 4 -60 10 -123 13 -140 4 -16 11 -77 17 -135 9 -88 19 -179 42 -359 3 -27 -8 -34 -92 -66 -25 -10 -58 -23 -75 -31 -16 -7 -55 -22 -85 -34 -56 -23 -140 -59 -195 -85 -16 -8 -42 -19 -57 -24 -26 -10 -28 -8 -28 14 0 13 5 27 10 30 12 8 101 190 125 255 75 211 90 294 90 520 0 166 -3 200 -18 229 -9 19 -17 42 -17 51 0 9 -11 37 -25 61 -13 24 -29 54 -34 65 -24 55 -171 173 -251 202 -52 20 -188 52 -213 51 -12 0 -65 -9 -117 -19z m205 -94 c136 -29 269 -134 326 -256 40 -85 49 -140 49 -294 0 -83 -5 -171 -11 -196 -6 -25 -14 -67 -19 -95 -4 -27 -13 -66 -20 -85 -27 -76 -41 -112 -57 -152 -24 -64 -175 -368 -185 -374 -4 -3 -8 -13 -8 -23 0 -32 -54 -66 -135 -87 -11 -3 -29 -10 -40 -14 -18 -9 -81 -33 -290 -112 -44 -16 -94 -36 -112 -44 -17 -8 -37 -14 -45 -14 -7 0 -22 -7 -32 -15 -11 -8 -29 -15 -41 -15 -12 0 -25 -4 -30 -8 -6 -5 -42 -21 -82 -37 -59 -23 -75 -26 -88 -15 -18 15 -78 6 -95 -15 -7 -8 -23 -15 -36 -15 -20 0 -24 5 -24 29 0 33 -23 61 -49 61 -17 0 -71 -53 -136 -133 -16 -20 -39 -40 -50 -44 -11 -3 -54 -22 -95 -41 -41 -20 -82 -35 -91 -35 -39 3 -449 432 -449 470 0 7 -6 16 -13 20 -19 12 -93 125 -128 195 -72 148 -99 261 -99 417 0 141 21 237 71 321 5 8 14 26 19 39 18 40 151 164 210 194 103 54 137 62 260 62 110 0 216 -20 245 -46 5 -5 15 -9 23 -9 8 0 34 -13 59 -30 24 -16 49 -30 54 -30 12 0 188 -175 234 -233 16 -20 34 -37 39 -37 20 0 46 34 46 59 0 47 36 135 117 285 7 13 43 56 79 95 132 143 262 220 429 256 79 17 127 17 200 1z m795 -348 c0 -13 73 -78 87 -78 6 0 13 -4 15 -8 2 -4 36 -25 76 -45 93 -47 191 -120 220 -166 36 -53 49 -130 33 -189 -6 -26 -17 -51 -22 -57 -15 -15 -29 14 -29 65 0 48 -19 113 -38 132 -7 7 -12 17 -12 23 0 25 -156 158 -217 185 -13 5 -23 14 -23 20 0 5 -6 10 -14 10 -8 0 -39 24 -70 53 -43 40 -56 60 -56 82 l0 28 25 -23 c14 -13 25 -27 25 -32z m10 -133 c13 -14 48 -42 79 -62 72 -50 169 -140 189 -178 26 -48 42 -106 42 -158 l0 -48 -50 -21 c-38 -16 -56 -31 -75 -63 -34 -59 -140 -137 -159 -118 -3 4 -6 40 -6 80 0 41 -4 93 -10 116 -5 23 -14 94 -19 157 -5 63 -17 153 -25 199 -15 80 -14 121 3 121 4 0 18 -11 31 -25z m403 -512 c13 -8 8 -31 -9 -37 -9 -3 -35 -6 -59 -6 -43 0 -43 0 -43 -36 0 -37 -25 -74 -50 -74 -7 0 -26 -6 -40 -14 -63 -32 -142 -66 -156 -66 -21 0 -30 18 -16 35 6 7 34 22 62 32 55 19 118 73 139 119 20 41 74 66 124 58 22 -3 43 -8 48 -11z m95 -15 c4 -19 -21 -49 -57 -68 -36 -19 -42 1 -14 48 19 32 31 42 47 40 11 -2 22 -11 24 -20z m2 -114 c0 -8 -8 -17 -17 -21 -10 -3 -25 -12 -33 -19 -27 -23 -69 -28 -76 -9 -9 22 3 32 62 54 52 19 64 18 64 -5z m23 -57 c7 -17 -23 -51 -62 -72 -29 -14 -35 -15 -48 -3 -20 21 -8 40 40 65 50 25 63 27 70 10z m-227 -41 c3 -14 3 -30 -1 -35 -8 -14 -40 -14 -64 -2 -17 10 -81 -6 -98 -23 -14 -14 -75 -36 -84 -30 -18 11 -8 35 19 44 15 6 35 15 44 20 10 6 29 10 42 10 14 0 28 5 31 11 10 15 45 28 77 28 21 1 29 -5 34 -23z m-306 -4 c0 -22 -19 -42 -39 -42 -9 0 -29 -7 -45 -15 -15 -8 -35 -15 -43 -15 -8 0 -27 -6 -41 -14 -15 -8 -45 -21 -67 -29 -154 -57 -272 -105 -308 -123 -34 -17 -53 -18 -63 -3 -9 16 35 49 67 49 14 0 29 4 35 9 9 9 77 36 119 48 11 3 40 14 65 25 43 19 58 25 128 54 74 32 108 47 132 60 35 19 60 17 60 -4z m5 -83 c7 -11 -22 -49 -38 -49 -5 0 -23 -6 -40 -14 -18 -7 -52 -21 -77 -31 -52 -21 -123 -51 -160 -67 -58 -25 -90 -38 -175 -74 -49 -20 -111 -47 -137 -60 -56 -29 -68 -30 -68 -6 0 36 44 70 121 95 42 14 99 34 125 45 27 11 76 30 109 43 33 13 64 27 70 31 5 4 15 8 21 8 14 0 17 1 139 53 90 39 101 41 110 26z m282 -4 c63 0 78 -26 76 -135 -1 -75 -5 -94 -36 -160 -21 -45 -60 -103 -97 -145 -34 -38 -67 -80 -73 -92 -10 -23 -31 -30 -41 -15 -3 5 -8 47 -10 93 -10 152 -18 223 -33 302 -16 83 -13 107 13 107 15 0 31 8 104 46 14 8 32 10 40 7 8 -4 34 -7 57 -8z m166 -12 c28 -32 57 -126 57 -184 0 -105 -53 -179 -248 -349 -57 -49 -115 -151 -106 -185 3 -11 -2 -29 -10 -40 -14 -17 -17 -18 -26 -5 -17 23 -3 95 26 142 15 24 62 79 103 123 90 94 130 146 153 196 25 55 41 152 34 201 -4 23 -9 60 -12 81 -7 40 4 47 29 20z m-3349 -173 c89 -23 118 -40 148 -89 12 -20 27 -40 33 -46 7 -5 27 -30 45 -55 19 -25 47 -57 62 -71 15 -14 28 -29 28 -33 0 -5 -18 -28 -39 -52 -40 -45 -111 -158 -111 -175 0 -25 -41 -87 -62 -93 -48 -12 -77 -7 -94 20 -16 24 -16 29 0 74 10 27 15 58 11 70 -9 29 -58 26 -95 -6 -29 -27 -61 -48 -90 -59 -8 -4 -23 -11 -32 -16 -49 -26 -98 1 -98 54 0 27 12 43 72 99 40 38 76 68 80 68 4 0 8 13 8 28 0 20 -7 33 -24 41 -20 11 -31 9 -77 -12 -103 -47 -147 -57 -258 -56 -123 0 -182 21 -213 76 -17 28 -17 35 -5 65 37 87 179 165 342 188 89 13 282 2 369 -20z m2096 -125 c0 -8 -9 -23 -20 -32 -11 -10 -20 -21 -20 -26 0 -4 -27 -44 -60 -87 -33 -43 -60 -82 -60 -86 0 -6 -32 -47 -75 -96 -8 -10 -15 -21 -15 -24 0 -6 -66 -91 -80 -104 -3 -3 -21 -25 -40 -50 -19 -25 -75 -93 -125 -151 -136 -160 -168 -199 -190 -230 -11 -16 -27 -29 -36 -29 -9 0 -55 29 -102 65 -48 36 -89 65 -92 65 -2 0 -51 34 -107 75 -57 41 -113 82 -125 90 -33 23 -29 33 20 55 31 15 65 20 129 20 130 0 198 37 198 107 0 24 8 45 22 60 l21 23 -23 24 c-26 28 -21 56 10 56 28 0 128 34 225 76 17 7 68 27 115 44 130 48 163 61 192 76 14 8 32 14 40 14 7 0 49 18 93 40 88 43 105 47 105 25z m-1660 -312 c0 -13 -4 -23 -8 -23 -16 0 -52 -59 -64 -103 -22 -84 32 -139 120 -122 42 8 144 42 182 60 14 6 41 19 60 28 84 37 157 70 188 84 30 14 92 81 92 99 0 11 41 54 52 54 12 0 10 -34 -4 -48 -18 -18 9 -34 45 -27 25 4 27 2 25 -23 -3 -24 1 -27 30 -30 19 -2 44 4 57 12 47 31 73 13 38 -26 -11 -12 -30 -18 -59 -18 -24 0 -45 -4 -48 -9 -6 -10 20 -35 47 -44 10 -4 17 -13 15 -20 -3 -8 -39 -14 -114 -17 -83 -4 -118 -10 -146 -25 -277 -148 -466 -214 -607 -215 -84 0 -136 24 -147 67 -20 78 15 192 111 358 52 91 53 91 97 48 22 -22 38 -47 38 -60z m741 22 c0 -13 -41 -19 -41 -7 0 11 20 22 33 18 5 -1 8 -6 8 -11z m-654 -91 c15 -14 39 -34 53 -44 23 -17 24 -20 9 -35 -8 -8 -43 -20 -77 -26 -80 -14 -95 -5 -78 49 27 87 47 99 93 56z m468 -384 c10 -11 24 -20 31 -20 7 0 16 -9 19 -20 5 -15 -5 -34 -37 -73 -24 -28 -52 -63 -63 -76 -93 -113 -238 -267 -266 -282 -18 -9 -61 2 -224 58 -38 14 -83 28 -100 33 -16 5 -68 23 -115 41 -47 17 -104 38 -128 47 l-42 14 -80 -76 c-90 -86 -124 -106 -143 -87 -19 19 43 131 150 270 5 8 64 2 76 -7 7 -5 48 -21 92 -35 44 -14 139 -47 210 -73 169 -60 218 -74 247 -67 42 10 209 199 292 331 29 46 53 53 81 22z m591 -102 c-7 -40 -33 -128 -52 -183 -8 -23 -14 -47 -14 -55 0 -26 -68 -227 -85 -254 -10 -14 -26 -26 -36 -26 -10 0 -20 -4 -24 -10 -3 -5 -20 -14 -38 -19 -18 -5 -52 -17 -77 -27 -25 -9 -76 -23 -115 -30 -124 -22 -189 -35 -241 -50 -28 -8 -60 -14 -72 -14 -12 0 -40 -7 -62 -16 -44 -18 -72 -59 -84 -126 -4 -20 -13 -50 -21 -65 -8 -15 -15 -35 -15 -44 0 -18 -46 -46 -57 -35 -12 11 -4 136 13 226 12 63 22 89 38 101 12 8 77 30 146 48 69 18 143 39 165 46 22 7 69 20 105 30 36 9 81 23 100 30 19 7 62 20 95 30 101 31 118 56 161 240 11 46 26 80 43 100 45 50 91 112 91 124 0 6 10 11 21 11 19 0 21 -4 15 -32z"/>
                      <path d="M3547 3638 c-12 -6 -17 -22 -17 -53 0 -37 -6 -50 -35 -80 -50 -49 -86 -48 -142 5 -39 36 -45 39 -68 28 -14 -6 -24 -14 -22 -17 1 -3 9 -17 16 -31 7 -14 29 -38 49 -55 31 -26 43 -30 98 -30 50 0 69 5 94 23 27 21 35 22 60 12 40 -17 75 -10 75 15 0 14 -8 21 -30 25 -21 4 -31 11 -33 28 -3 20 1 22 41 22 30 0 49 6 60 18 29 32 21 42 -38 42 -49 0 -55 2 -61 24 -7 29 -24 38 -47 24z"/>
                      <path d="M2826 3435 c-9 -9 -16 -27 -16 -40 0 -40 -44 -75 -93 -75 -46 0 -78 18 -126 67 -37 39 -67 36 -56 -6 13 -54 10 -65 -20 -80 -38 -20 -44 -28 -38 -52 8 -28 45 -23 79 11 31 31 64 40 64 16 0 -8 -12 -24 -26 -35 -16 -13 -24 -27 -20 -36 9 -24 40 -18 71 15 25 26 33 29 70 23 51 -6 89 11 133 62 37 42 48 78 36 114 -11 31 -36 38 -58 16z"/>
                      <path d="M3153 3281 c-13 -11 -32 -17 -46 -14 -13 3 -28 -2 -36 -11 -10 -12 -9 -18 8 -35 48 -48 139 -2 132 67 -2 18 -33 14 -58 -7z"/>
                      <path d="M3305 3131 c-22 -49 -49 -75 -97 -96 -81 -33 -206 -8 -218 45 -5 22 -37 42 -52 33 -5 -2 -8 -15 -8 -28 0 -14 -13 -34 -31 -49 -19 -16 -29 -32 -25 -41 7 -19 40 -19 60 0 21 21 32 19 73 -12 32 -25 44 -28 113 -27 118 1 198 48 242 141 23 50 18 73 -15 73 -18 0 -28 -10 -42 -39z"/>
                    </g>
                  </svg>
                  <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
                    Love Languages
                  </h1>
                </div>
              </div>
              <LanguageGrid
                onSelect={handleNativeSelect}
                selectedCode={nativeLanguage}
                isStudent={isStudent}
                title={t('hero.languageSelector.nativeTitle')}
                subtitle={t('hero.languageSelector.nativeSubtitle')}
              />
            </div>
          )}

          {/* Step 2: Target Language Selection */}
          {currentStep === 'target' && (
            <div
              className={`relative z-10 w-full max-h-full overflow-y-auto px-8 md:px-16 py-8 transition-all duration-300 ${
                stepTransition === 'exiting' ? 'opacity-0 translate-x-[-20px]' :
                stepTransition === 'entering' ? 'opacity-0 translate-x-[20px]' : 'opacity-100'
              }`}
            >
              <LanguageGrid
                onSelect={handleTargetSelect}
                selectedCode={selectedTargetLanguage}
                excludeCode={nativeLanguage}
                isStudent={isStudent}
                title={t('hero.languageSelector.targetTitle')}
                subtitle={t('hero.languageSelector.targetSubtitle')}
                onBack={handleBack}
                showBackButton={true}
              />
            </div>
          )}

          {/* Step 3: Marketing Content */}
          {currentStep === 'marketing' && (
            <>
              {/* Sticky language indicator at top - each language clickable separately */}
              {nativeLanguage && selectedTargetLanguage && (
                <div className="sticky top-0 z-20 pb-8 pt-4">
                  <div className="mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md w-fit">
                    {/* Native language - click to change */}
                    <button
                      onClick={() => setCurrentStep('native')}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
                      title={t('hero.languageSelector.changeNative')}
                    >
                      <span className="text-lg">{LANGUAGE_CONFIGS[nativeLanguage]?.flag}</span>
                      <span className="text-scale-label font-bold text-gray-600">{LANGUAGE_CONFIGS[nativeLanguage]?.nativeName}</span>
                    </button>
                    <span className="text-gray-400">→</span>
                    {/* Target language - click to change */}
                    <button
                      onClick={() => setCurrentStep('target')}
                      className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
                      title={t('hero.languageSelector.changeTarget')}
                    >
                      <span className="text-lg">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.flag}</span>
                      <span className="text-scale-label font-bold text-gray-600">{LANGUAGE_CONFIGS[selectedTargetLanguage]?.nativeName}</span>
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
          style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
        >
          <ICONS.Heart
            className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none transition-colors duration-500"
            style={{ color: accentColor }}
          />

          {/* Section indicator dots - all steps (native, target, + 8 marketing sections) */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {/* Native language step */}
            <button
              onClick={() => setCurrentStep('native')}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'native' ? 'scale-150' : 'opacity-30 hover:opacity-60'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Native language"
            />
            {/* Target language step */}
            <button
              onClick={() => nativeLanguage && setCurrentStep('target')}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentStep === 'target' ? 'scale-150' : 'opacity-30 hover:opacity-60'
              }`}
              style={{ backgroundColor: accentColor }}
              aria-label="Target language"
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
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <ICONS.Heart className="w-5 h-5" style={{ color: isStudent ? '#ffffff' : '#9ca3af', fill: isStudent ? '#ffffff' : 'none' }} />
              <span className="font-bold text-scale-label">{t('hero.toggle.learn')}</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 10px 25px -5px ${BRAND.tealShadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <ICONS.Sparkles className="w-5 h-5" style={{ color: !isStudent ? '#ffffff' : '#9ca3af' }} />
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
          <div className="mt-6 flex justify-center gap-6 text-scale-label" style={{ color: '#9ca3af' }}>
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
