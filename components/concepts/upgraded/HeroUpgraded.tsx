import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabase';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingUpgraded from './OnboardingUpgraded';
import { ICONS } from '../../../constants';
import { useTranslation } from 'react-i18next';
import { UpgradedFAQ, UpgradedRALL, UpgradedBlog, UpgradedFooter, UpgradedGameShowcaseWrapper } from './BelowFoldUpgraded';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

// ─── Custom Hooks ──────────────────────────────────────────────────

function useIntersectionObserver(threshold = 0.15) {
    const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set());
    const observer = useRef<IntersectionObserver | null>(null);

    const observe = useCallback((el: HTMLElement | null, id: string) => {
        if (!el) return;
        if (!observer.current) {
            observer.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setVisibleSet((prev) => {
                                const next = new Set(prev);
                                next.add(entry.target.getAttribute('data-reveal-id') || '');
                                return next;
                            });
                            observer.current?.unobserve(entry.target);
                        }
                    });
                },
                { threshold, rootMargin: '0px 0px -60px 0px' }
            );
        }
        el.setAttribute('data-reveal-id', id);
        observer.current.observe(el);
    }, [threshold]);

    return { visibleSet, observe };
}

function useAnimatedCounter(end: number, isVisible: boolean, duration = 2000, suffix = '') {
    const [count, setCount] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for a decelerating feel
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    return count.toLocaleString() + suffix;
}

function useMouseTilt(ref: React.RefObject<HTMLDivElement | null>) {
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            setTransform(`perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale3d(1.02, 1.02, 1.02)`);
        };

        const handleLeave = () => {
            setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
        };

        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);
        return () => {
            el.removeEventListener('mousemove', handleMove);
            el.removeEventListener('mouseleave', handleLeave);
        };
    }, [ref]);

    return transform;
}

// ─── Sub-components ────────────────────────────────────────────────

function StatCounter({ value, label, suffix, isVisible }: { value: number; label: string; suffix: string; isVisible: boolean }) {
    const display = useAnimatedCounter(value, isVisible, 2200, suffix);
    return (
        <div className="text-center group">
            <div className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                {display}
            </div>
            <div className="text-sm md:text-base text-gray-500 font-medium mt-1 uppercase tracking-widest">{label}</div>
        </div>
    );
}

function TestimonialTicker() {
    const testimonials = [
        { text: "We finally have something fun to do together every evening.", couple: "Maria & James", flag: "🇪🇸🇬🇧" },
        { text: "My husband cried when I ordered dinner in his language.", couple: "Yuki & Pierre", flag: "🇯🇵🇫🇷" },
        { text: "Better than any app. It's OUR app.", couple: "Anna & Luca", flag: "🇩🇪🇮🇹" },
        { text: "The games are so addictive we forgot to watch Netflix.", couple: "Priya & Tom", flag: "🇮🇳🇬🇧" },
        { text: "He surprised me with a love letter in Polish.", couple: "Sophie & Kuba", flag: "🇫🇷🇵🇱" },
        { text: "We learn on the train every morning. It's our ritual.", couple: "Chen & Rosa", flag: "🇨🇳🇧🇷" },
    ];

    // Double the array for seamless loop
    const doubled = [...testimonials, ...testimonials];

    return (
        <div className="relative overflow-hidden py-12">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex gap-6 animate-ticker-scroll">
                {doubled.map((t, i) => (
                    <div
                        key={i}
                        className="flex-shrink-0 w-[340px] bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_-6px_rgba(255,107,107,0.12)] transition-shadow duration-300"
                    >
                        <p className="text-gray-700 text-sm leading-relaxed italic mb-4">"{t.text}"</p>
                        <div className="flex items-center gap-2">
                            <span className="text-base">{t.flag}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.couple}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────

export default function HeroUpgraded() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [prevStep, setPrevStep] = useState<Step | null>(null);
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [scrollY, setScrollY] = useState(0);
    const [navSolid, setNavSolid] = useState(false);
    const [heroLoaded, setHeroLoaded] = useState(false);

    const cardRef = useRef<HTMLDivElement | null>(null);
    const cardTransform = useMouseTilt(cardRef);
    const { visibleSet, observe } = useIntersectionObserver(0.12);

    const languages = useMemo(() => Object.values(LANGUAGE_CONFIGS), []);

    // Hero entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setHeroLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Track scroll for parallax & navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Sync language with i18n
    useEffect(() => {
        i18n.changeLanguage(nativeLang);
    }, [nativeLang, i18n]);

    // Keyboard shortcut: Enter to continue
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if (step === 'language') setStep('role');
                else if (step === 'role' && role) setStep('auth');
                else if (step === 'auth') setStep('onboarding');
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [step, role]);

    // Animated step transitions
    const goToStep = useCallback((next: Step) => {
        setPrevStep(step);
        setStep(next);
    }, [step]);

    if (step === 'onboarding') {
        return <OnboardingUpgraded onComplete={() => alert('Demo Finished! Explore other concepts from the bottom right switcher.')} />;
    }

    const isStudent = role !== 'tutor';

    const sectionsContent = [
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.copy`),
            icon: '💬',
            gradient: 'from-[#FF6B6B] to-[#FF8E8E]',
            glow: 'rgba(255,107,107,0.4)',
            accent: '#FF6B6B',
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            icon: '🎙️',
            gradient: 'from-[#4ECDC4] to-[#7BEDE6]',
            glow: 'rgba(78,205,196,0.4)',
            accent: '#4ECDC4',
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            icon: '🎮',
            gradient: 'from-[#FFE66D] to-[#FFF09E]',
            glow: 'rgba(255,230,109,0.4)',
            accent: '#FFE66D',
        }
    ];

    // Direction for step transition (forward or back)
    const stepOrder: Step[] = ['language', 'role', 'auth', 'onboarding'];
    const isForward = prevStep ? stepOrder.indexOf(step) > stepOrder.indexOf(prevStep) : true;

    const getStepClasses = (thisStep: Step) => {
        if (thisStep === step) return 'upgraded-step-active';
        if (thisStep === prevStep) return isForward ? 'upgraded-step-exit-left' : 'upgraded-step-exit-right';
        return 'upgraded-step-hidden';
    };

    return (
        <div className="min-h-screen bg-[#0A0A0F] relative overflow-x-hidden" style={{ fontFamily: '"Outfit", sans-serif', color: '#F0F0F5' }}>

            {/* ═══ ANIMATED GRADIENT MESH BACKGROUND ═══ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {/* Primary orbs — slow drifting motion */}
                <div
                    className="absolute w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full blur-[120px] opacity-30 animate-orb-drift-1"
                    style={{
                        background: 'radial-gradient(circle, #FF6B6B 0%, transparent 70%)',
                        top: '-20%',
                        left: '-10%',
                        transform: `translateY(${scrollY * 0.08}px)`,
                    }}
                />
                <div
                    className="absolute w-[70vw] h-[70vw] md:w-[45vw] md:h-[45vw] rounded-full blur-[120px] opacity-25 animate-orb-drift-2"
                    style={{
                        background: 'radial-gradient(circle, #4ECDC4 0%, transparent 70%)',
                        bottom: '-15%',
                        right: '-10%',
                        transform: `translateY(${-scrollY * 0.05}px)`,
                    }}
                />
                <div
                    className="absolute w-[50vw] h-[50vw] md:w-[35vw] md:h-[35vw] rounded-full blur-[100px] opacity-20 animate-orb-drift-3"
                    style={{
                        background: 'radial-gradient(circle, #FFE66D 0%, transparent 70%)',
                        top: '40%',
                        left: '50%',
                        transform: `translate(-50%, ${scrollY * 0.03}px)`,
                    }}
                />
                {/* Noise texture overlay for grain */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            {/* ═══ FLOATING NAVBAR ═══ */}
            <nav
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${navSolid ? 'py-3' : 'py-5'}`}
                style={{
                    background: navSolid ? 'rgba(10, 10, 15, 0.85)' : 'transparent',
                    backdropFilter: navSolid ? 'blur(20px) saturate(180%)' : 'none',
                    borderBottom: navSolid ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 font-bold text-lg" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FFE66D] flex items-center justify-center text-white text-sm shadow-lg shadow-[#FF6B6B]/20 rotate-[-6deg] hover:rotate-0 transition-transform duration-300">
                            <ICONS.Heart />
                        </div>
                        <span className="text-white/90">Love Languages</span>
                    </div>
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            goToStep('language');
                        }}
                        className="relative px-6 py-2.5 bg-white/[0.08] text-white/90 rounded-full font-bold text-sm border border-white/10 hover:bg-white/[0.14] hover:border-white/20 transition-all duration-300 group"
                    >
                        <span className="relative z-10">{t('hero.shared.context0.cta', 'Get Started')}</span>
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#FF6B6B]/20 to-[#4ECDC4]/20 blur-sm" />
                    </button>
                </div>
            </nav>

            {/* ═══ 1. HERO SECTION ═══ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6">
                <div className={`relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 transition-all duration-1000 ease-out ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                    {/* Left Side: Brand Story */}
                    <div className="lg:w-1/2 text-center lg:text-left space-y-6">
                        {/* Eyebrow badge */}
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-full text-[#FF6B6B] text-sm font-bold shadow-lg shadow-black/10 transition-all duration-700 delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B6B] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B6B]" />
                            </span>
                            {t('hero.shared.section0.subhead', 'The language learning app for couples.')}
                        </div>

                        {/* Main headline with shimmer gradient */}
                        <h1
                            className={`text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight transition-all duration-700 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                            style={{ fontFamily: '"Quicksand", sans-serif' }}
                        >
                            {t('hero.student.section0.headline', 'Learn the Language of Love').split(' ').map((word, i) => {
                                const targetWord = t('hero.student.section0.highlight1', 'Language');
                                if (word.includes(targetWord) || targetWord.includes(word)) {
                                    return (
                                        <span key={i} className="upgraded-shimmer-text relative">
                                            {word}{' '}
                                        </span>
                                    );
                                }
                                return <span key={i} className="text-white">{word}{' '}</span>;
                            })}
                        </h1>

                        {/* Subheading */}
                        <p className={`text-lg md:text-xl text-white/50 max-w-md mx-auto lg:mx-0 leading-relaxed font-light transition-all duration-700 delay-400 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                            {t('hero.shared.section0.copy', 'Connect deeper with your partner by learning their native tongue. Shared vocabulary, shared intimacy.')}
                        </p>

                        {/* CTA Buttons */}
                        <div className={`pt-6 flex flex-col sm:flex-row items-center lg:items-start gap-4 justify-center lg:justify-start transition-all duration-700 delay-500 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                            <button
                                onClick={() => goToStep('onboarding')}
                                className="group relative bg-gradient-to-r from-[#FF6B6B] to-[#ff8e8e] text-white px-8 py-4 rounded-2xl font-bold shadow-[0_8px_32px_-8px_rgba(255,107,107,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(255,107,107,0.6)] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden"
                            >
                                {/* Glow pulse overlay */}
                                <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {t('hero.upgraded.skipToOnboarding', 'Skip to Onboarding')} <ICONS.ChevronRight />
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Right Side: 3D Interactive Card */}
                    <div className={`lg:w-1/2 w-full max-w-md transition-all duration-1000 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
                        <div
                            ref={cardRef}
                            className="relative transition-transform duration-200 ease-out will-change-transform"
                            style={{ transform: cardTransform, transformStyle: 'preserve-3d' }}
                        >
                            {/* Card glow backdrop */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6B6B]/20 via-[#FFE66D]/10 to-[#4ECDC4]/20 rounded-[2.5rem] blur-2xl opacity-60 animate-card-glow" />

                            <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] rounded-[2rem] p-8 md:p-10 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                                {/* Animated top gradient bar */}
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] animate-gradient-sweep" />
                                {/* Subtle inner glow */}
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

                                <div className="relative min-h-[380px]">

                                    {/* ── Step 1: Language ── */}
                                    <div className={`absolute w-full top-0 left-0 ${getStepClasses('language')}`}>
                                        {/* Step indicator */}
                                        <div className="flex justify-center gap-2 mb-6">
                                            {['language', 'role', 'auth'].map((s, i) => (
                                                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D]' : stepOrder.indexOf(s as Step) < stepOrder.indexOf(step) ? 'w-3 bg-[#FF6B6B]/40' : 'w-3 bg-white/10'}`} />
                                            ))}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2 text-center text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                            {t('hero.shared.context0.header', 'Choose Languages')}
                                        </h3>
                                        <p className="text-center text-white/40 text-sm mb-8">
                                            {t('hero.studentTargetStep.subtext', 'What do you speak and what will you learn?')}
                                        </p>

                                        <div className="space-y-5 mb-8">
                                            <div className="relative group">
                                                <label className="absolute -top-2.5 left-4 bg-[#0A0A0F] px-2 text-xs font-bold text-[#FF6B6B] uppercase tracking-widest z-10 rounded-full border border-white/[0.06]">
                                                    {t('hero.languageSelector.nativePrompt', 'I speak')}
                                                </label>
                                                <div className="relative transform transition-transform duration-200 group-hover:scale-[1.02]">
                                                    <select
                                                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl py-4 px-5 focus:outline-none focus:border-[#4ECDC4]/60 focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all text-white appearance-none font-bold text-lg shadow-sm"
                                                        value={nativeLang}
                                                        onChange={(e) => setNativeLang(e.target.value)}
                                                    >
                                                        {languages.map(l => <option key={l.code} value={l.code} className="bg-[#1a1a24] text-white">{l.flag} {l.nativeName}</option>)}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                                        <ICONS.ChevronDown />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <label className="absolute -top-2.5 left-4 bg-[#0A0A0F] px-2 text-xs font-bold text-[#4ECDC4] uppercase tracking-widest z-10 rounded-full border border-white/[0.06]">
                                                    {t('hero.languageSelector.targetPrompt', 'I want to learn')}
                                                </label>
                                                <div className="relative transform transition-transform duration-200 group-hover:scale-[1.02]">
                                                    <select
                                                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl py-4 px-5 focus:outline-none focus:border-[#FF6B6B]/60 focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all text-white appearance-none font-bold text-lg shadow-sm"
                                                        value={targetLang}
                                                        onChange={(e) => setTargetLang(e.target.value)}
                                                    >
                                                        {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code} className="bg-[#1a1a24] text-white">{l.flag} {l.nativeName}</option>)}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                                        <ICONS.ChevronDown />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => goToStep('role')}
                                            className="upgraded-cta-btn w-full font-bold py-4 rounded-2xl transition-all"
                                        >
                                            {t('onboarding.step.continue', 'Continue')}
                                        </button>
                                        <div className="text-center mt-4 text-white/20 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5">
                                            <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.1] text-[10px] font-mono">Enter</kbd>
                                            <span>{t('hero.upgraded.pressEnter', 'to continue')}</span>
                                        </div>
                                    </div>

                                    {/* ── Step 2: Role ── */}
                                    <div className={`absolute w-full top-0 left-0 ${getStepClasses('role')}`}>
                                        <div className="flex justify-center gap-2 mb-6">
                                            {['language', 'role', 'auth'].map((s) => (
                                                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D]' : stepOrder.indexOf(s as Step) < stepOrder.indexOf(step) ? 'w-3 bg-[#FF6B6B]/40' : 'w-3 bg-white/10'}`} />
                                            ))}
                                        </div>
                                        <div className="flex items-center mb-6">
                                            <button onClick={() => goToStep('language')} className="text-white/30 hover:text-[#FF6B6B] transition-colors p-2 -ml-2 rounded-full hover:bg-white/[0.05]">
                                                <ICONS.ChevronLeft />
                                            </button>
                                            <h3 className="text-2xl font-bold flex-1 text-center -ml-5 text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                                {t('hero.student.context1.header', 'Your Role')}
                                            </h3>
                                        </div>

                                        <div className="flex flex-col gap-4 mb-8">
                                            <button
                                                onClick={() => setRole('student')}
                                                className={`p-5 rounded-2xl border transition-all duration-300 text-left flex items-start gap-4 group ${role === 'student'
                                                    ? 'bg-[#FF6B6B]/[0.08] border-[#FF6B6B]/40 shadow-[0_0_24px_-6px_rgba(255,107,107,0.2)]'
                                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${role === 'student' ? 'bg-gradient-to-br from-[#FF6B6B] to-[#ff8e8e] text-white shadow-lg shadow-[#FF6B6B]/30 scale-110' : 'bg-white/[0.06] group-hover:bg-white/[0.1]'}`}>
                                                    🎓
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-0.5 text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.learn')}</h4>
                                                    <p className="text-sm text-white/40">{t('hero.student.context1.learnerCopy', "I want to learn my partner's language.")}</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setRole('tutor')}
                                                className={`p-5 rounded-2xl border transition-all duration-300 text-left flex items-start gap-4 group ${role === 'tutor'
                                                    ? 'bg-[#4ECDC4]/[0.08] border-[#4ECDC4]/40 shadow-[0_0_24px_-6px_rgba(78,205,196,0.2)]'
                                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${role === 'tutor' ? 'bg-gradient-to-br from-[#4ECDC4] to-[#7bede6] text-white shadow-lg shadow-[#4ECDC4]/30 scale-110' : 'bg-white/[0.06] group-hover:bg-white/[0.1]'}`}>
                                                    🧑‍🏫
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-0.5 text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.teach')}</h4>
                                                    <p className="text-sm text-white/40">{t('hero.tutor.context1.guideCopy', 'I want to help my partner learn mine.')}</p>
                                                </div>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => goToStep('auth')}
                                            disabled={!role}
                                            className="upgraded-cta-btn w-full disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none font-bold py-4 rounded-2xl transition-all"
                                        >
                                            {t('onboarding.step.continue', 'Continue')}
                                        </button>
                                        {role && (
                                            <div className="text-center mt-4 text-white/20 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5">
                                                <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.1] text-[10px] font-mono">Enter</kbd>
                                                <span>{t('hero.upgraded.pressEnter', 'to continue')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Step 3: Auth ── */}
                                    <div className={`absolute w-full top-0 left-0 ${getStepClasses('auth')}`}>
                                        <div className="flex justify-center gap-2 mb-6">
                                            {['language', 'role', 'auth'].map((s) => (
                                                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D]' : stepOrder.indexOf(s as Step) < stepOrder.indexOf(step) ? 'w-3 bg-[#FF6B6B]/40' : 'w-3 bg-white/10'}`} />
                                            ))}
                                        </div>
                                        <div className="flex items-center mb-2">
                                            <button onClick={() => goToStep('role')} className="text-white/30 hover:text-[#FF6B6B] transition-colors p-2 -ml-2 rounded-full hover:bg-white/[0.05]">
                                                <ICONS.ChevronLeft />
                                            </button>
                                            <h3 className="text-2xl font-bold flex-1 text-center -ml-5 text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                                {isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')}
                                            </h3>
                                        </div>
                                        <p className="text-center text-white/40 text-sm mb-8">{t('hero.login.saveProgress', 'Save your progress across devices.')}</p>

                                        <div className="space-y-4 mb-8">
                                            <div className="relative group">
                                                <input
                                                    type="email"
                                                    placeholder={t('hero.login.emailLabel', 'Email Address')}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl py-4 px-5 focus:outline-none focus:border-[#4ECDC4]/60 focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all text-white font-bold placeholder-white/25"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="password"
                                                    placeholder={t('hero.login.passwordLabel', 'Password')}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl py-4 px-5 focus:outline-none focus:border-[#4ECDC4]/60 focus:ring-2 focus:ring-[#4ECDC4]/20 transition-all text-white font-bold placeholder-white/25"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.preventDefault(); goToStep('onboarding'); }}
                                            className="upgraded-cta-btn-dark w-full font-bold py-4 rounded-2xl transition-all mb-4"
                                        >
                                            {isSignUp ? `${t('hero.login.createAccount')} (Demo)` : `${t('hero.login.signIn')} (Demo)`}
                                        </button>

                                        <div className="text-center">
                                            <button
                                                onClick={() => setIsSignUp(!isSignUp)}
                                                className="text-white/30 font-bold text-sm hover:text-[#FF6B6B] transition-colors"
                                            >
                                                {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
                                            </button>
                                        </div>
                                        <div className="text-center mt-4 text-white/20 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5">
                                            <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.1] text-[10px] font-mono">Enter</kbd>
                                            <span>{t('hero.upgraded.pressEnter', 'to continue')}</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Scroll Indicator */}
                <div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 cursor-pointer hover:text-white/40 transition-colors"
                    onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-medium tracking-widest uppercase">{t('hero.upgraded.scrollExplore', 'Explore')}</span>
                        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
                            <div className="w-1 h-2.5 bg-white/40 rounded-full animate-scroll-dot" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ 2. STATS BAR ═══ */}
            <section
                className="relative py-16 px-6"
                ref={(el) => observe(el, 'stats')}
            >
                {/* Separator line glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#FF6B6B]/30 to-transparent" />

                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-around gap-10 md:gap-6">
                    <StatCounter value={18} label={t('hero.upgraded.stats.languages', 'Languages')} suffix="" isVisible={visibleSet.has('stats')} />
                    <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    <StatCounter value={10000} label={t('hero.upgraded.stats.couples', 'Couples')} suffix="+" isVisible={visibleSet.has('stats')} />
                    <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    <StatCounter value={50} label={t('hero.upgraded.stats.words', 'Words Learned')} suffix="M+" isVisible={visibleSet.has('stats')} />
                </div>
            </section>

            {/* ═══ 3. TESTIMONIAL TICKER ═══ */}
            <section className="relative overflow-hidden bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
                <TestimonialTicker />
            </section>

            {/* ═══ 4. FEATURE CARDS — SCROLL REVEAL ═══ */}
            <section className="py-24 px-6 relative" ref={(el) => observe(el, 'features')}>
                <div className="max-w-6xl mx-auto">
                    {/* Section header */}
                    <div className={`text-center mb-16 transition-all duration-700 ${visibleSet.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            {t('hero.upgraded.features.title', 'Everything you need')}
                        </h2>
                        <p className="text-white/40 text-lg max-w-lg mx-auto">
                            {t('hero.upgraded.features.subtitle', 'A complete toolkit designed for couples who learn together.')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {sectionsContent.map((feature, i) => (
                            <div
                                key={i}
                                className={`group relative bg-white/[0.04] backdrop-blur-sm rounded-[2rem] p-8 text-center border border-white/[0.06] hover:border-white/[0.12] transition-all duration-700 hover:-translate-y-2 ${visibleSet.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                                style={{ transitionDelay: visibleSet.has('features') ? `${i * 150}ms` : '0ms' }}
                            >
                                {/* Glow on hover */}
                                <div
                                    className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 50% 0%, ${feature.glow}, transparent 70%)` }}
                                />

                                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg text-white relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 leading-tight text-white relative z-10" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    {feature.headline}
                                </h3>
                                <p className="text-white/40 leading-relaxed font-light relative z-10">{feature.copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ 5. SHOWCASE SECTION ═══ */}
            <section
                className="py-24 px-6 relative"
                ref={(el) => observe(el, 'showcase')}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#4ECDC4]/20 to-transparent" />
                <div className={`max-w-6xl mx-auto relative z-10 transition-all duration-1000 ${visibleSet.has('showcase') ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-[0.97]'}`}>
                    <UpgradedGameShowcaseWrapper
                        isStudent={isStudent}
                        accentColor="#FF6B6B"
                        sectionIndex={4}
                        isMobile={false}
                        targetLanguage={targetLang}
                        nativeLanguage={nativeLang}
                    />
                </div>
            </section>

            {/* ═══ 6. BELOW-FOLD SECTIONS ═══ */}
            <div className="relative">
                <UpgradedFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <UpgradedRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <UpgradedBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <UpgradedFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />

            {/* ═══ GLOBAL STYLES ═══ */}
            <style>{`
                /* ── Orb Drift Animations ── */
                @keyframes orb-drift-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(5vw, 3vh) scale(1.1); }
                    66% { transform: translate(-3vw, -2vh) scale(0.95); }
                }
                @keyframes orb-drift-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-4vw, -5vh) scale(1.05); }
                    66% { transform: translate(3vw, 2vh) scale(0.9); }
                }
                @keyframes orb-drift-3 {
                    0%, 100% { transform: translate(-50%, 0) scale(1); }
                    33% { transform: translate(-48%, 4vh) scale(1.15); }
                    66% { transform: translate(-52%, -3vh) scale(0.9); }
                }
                .animate-orb-drift-1 { animation: orb-drift-1 20s ease-in-out infinite; }
                .animate-orb-drift-2 { animation: orb-drift-2 25s ease-in-out infinite; }
                .animate-orb-drift-3 { animation: orb-drift-3 22s ease-in-out infinite; }

                /* ── Card Glow Pulse ── */
                @keyframes card-glow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.02); }
                }
                .animate-card-glow { animation: card-glow 4s ease-in-out infinite; }

                /* ── Gradient Sweep (top bar) ── */
                @keyframes gradient-sweep {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                .animate-gradient-sweep {
                    background-size: 200% 100%;
                    animation: gradient-sweep 3s linear infinite;
                }

                /* ── Shimmer Text ── */
                .upgraded-shimmer-text {
                    background: linear-gradient(
                        90deg,
                        #FF6B6B 0%,
                        #FFE66D 25%,
                        #4ECDC4 50%,
                        #FFE66D 75%,
                        #FF6B6B 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s linear infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }

                /* ── Scroll Dot (mouse icon) ── */
                @keyframes scroll-dot {
                    0% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(6px); opacity: 0.3; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-scroll-dot { animation: scroll-dot 2s ease-in-out infinite; }

                /* ── Step Transitions (cinematic scale + blur) ── */
                .upgraded-step-active {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                    filter: blur(0px);
                    pointer-events: auto;
                    transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                                transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                                filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .upgraded-step-exit-left {
                    opacity: 0;
                    transform: translateX(-40px) scale(0.95);
                    filter: blur(4px);
                    pointer-events: none;
                    transition: opacity 0.35s ease-in,
                                transform 0.35s ease-in,
                                filter 0.35s ease-in;
                }
                .upgraded-step-exit-right {
                    opacity: 0;
                    transform: translateX(40px) scale(0.95);
                    filter: blur(4px);
                    pointer-events: none;
                    transition: opacity 0.35s ease-in,
                                transform 0.35s ease-in,
                                filter 0.35s ease-in;
                }
                .upgraded-step-hidden {
                    opacity: 0;
                    transform: translateX(40px) scale(0.95);
                    filter: blur(4px);
                    pointer-events: none;
                    transition: none;
                }

                /* ── CTA Buttons ── */
                .upgraded-cta-btn {
                    background: linear-gradient(135deg, #FF6B6B 0%, #ff8e8e 100%);
                    color: white;
                    box-shadow: 0 8px 32px -8px rgba(255,107,107,0.5),
                                inset 0 1px 0 rgba(255,255,255,0.2);
                    position: relative;
                    overflow: hidden;
                }
                .upgraded-cta-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .upgraded-cta-btn:hover::before { opacity: 1; }
                .upgraded-cta-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px -8px rgba(255,107,107,0.6),
                                inset 0 1px 0 rgba(255,255,255,0.25);
                }
                .upgraded-cta-btn:active { transform: translateY(0); }

                .upgraded-cta-btn-dark {
                    background: linear-gradient(135deg, #fff 0%, #e8e8e8 100%);
                    color: #0A0A0F;
                    box-shadow: 0 8px 32px -8px rgba(255,255,255,0.15),
                                inset 0 1px 0 rgba(255,255,255,0.3);
                    position: relative;
                    overflow: hidden;
                }
                .upgraded-cta-btn-dark:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px -8px rgba(255,255,255,0.2),
                                inset 0 1px 0 rgba(255,255,255,0.4);
                }
                .upgraded-cta-btn-dark:active { transform: translateY(0); }

                /* ── Testimonial Ticker ── */
                @keyframes ticker-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-ticker-scroll {
                    animation: ticker-scroll 40s linear infinite;
                }
                .animate-ticker-scroll:hover {
                    animation-play-state: paused;
                }

            `}</style>
        </div>
    );
}
