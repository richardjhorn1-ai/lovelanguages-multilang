import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingCinematic from './OnboardingCinematic';
import { useTranslation } from 'react-i18next';
import { CinematicFAQ, CinematicRALL, CinematicBlog, CinematicFooter, CinematicGameShowcaseWrapper } from './BelowFoldCinematic';
import { ICONS } from '../../../constants';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

// ─── Intersection Observer hook for scroll-triggered animations ───
function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, isVisible };
}

// ─── Animated counter hook for dramatic number reveals ───
function useCountUp(target: number, isVisible: boolean, duration = 1200) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const startTime = performance.now();
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Cubic ease-out for dramatic deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [isVisible, target, duration]);
    return count;
}

// ─── Staggered word reveal component ───
function WordReveal({ text, isVisible, className, style, delayMs = 80 }: {
    text: string;
    isVisible: boolean;
    className?: string;
    style?: React.CSSProperties;
    delayMs?: number;
}) {
    const words = text.split(' ');
    return (
        <span className={className} style={style}>
            {words.map((word, i) => (
                <span
                    key={i}
                    className="inline-block transition-all duration-700 ease-out"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0) rotateX(0)' : 'translateY(40px) rotateX(40deg)',
                        transitionDelay: `${i * delayMs}ms`,
                    }}
                >
                    {word}&nbsp;
                </span>
            ))}
        </span>
    );
}

// ─── Cinematic Section Card — extracted for hooks compliance ───
function CinematicSectionCard({ section, index }: {
    section: { headline: string; copy: string; color: string; glowColor: string; glow: string; num: number };
    index: number;
}) {
    const reveal = useScrollReveal(0.15);
    const count = useCountUp(section.num, reveal.isVisible, 800);
    const isReversed = index % 2 !== 0;

    return (
        <div
            ref={reveal.ref}
            className={`flex flex-col md:flex-row items-center gap-12 ${isReversed ? 'md:flex-row-reverse' : ''}`}
        >
            {/* Content card with cinematic reveal */}
            <div className="flex-1 relative group w-full">
                {/* Ambient section glow */}
                <div
                    className="absolute -inset-8 rounded-[3rem] blur-3xl transition-all duration-1000"
                    style={{
                        background: `radial-gradient(circle, ${section.glow} 0%, transparent 70%)`,
                        opacity: reveal.isVisible ? 0.4 : 0,
                    }}
                />
                {/* Card glow border on hover */}
                <div className={`absolute -inset-[1px] bg-gradient-to-r ${section.color} rounded-[2rem] blur opacity-0 group-hover:opacity-30 transition duration-700`} />

                <div
                    className="relative bg-[#12151A]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-10 md:p-16 overflow-hidden transition-all duration-1000 ease-out"
                    style={{
                        opacity: reveal.isVisible ? 1 : 0,
                        transform: reveal.isVisible
                            ? 'translateY(0) scale(1)'
                            : 'translateY(60px) scale(0.95)',
                    }}
                >
                    {/* Top accent line with animated gradient */}
                    <div
                        className="absolute top-0 left-0 h-[2px] bg-gradient-to-r transition-all duration-[1500ms] ease-out"
                        style={{
                            width: reveal.isVisible ? '100%' : '0%',
                            backgroundImage: `linear-gradient(to right, ${section.glowColor}, transparent)`,
                            transitionDelay: '400ms',
                        }}
                    />

                    {/* Headline with word reveal */}
                    <h3
                        className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white/90"
                        style={{ fontFamily: '"Quicksand", sans-serif', perspective: '400px' }}
                    >
                        <WordReveal
                            text={section.headline}
                            isVisible={reveal.isVisible}
                            delayMs={60}
                        />
                    </h3>

                    {/* Body copy with delayed fade */}
                    <p
                        className="text-lg text-gray-400 font-light leading-relaxed transition-all duration-1000 ease-out"
                        style={{
                            opacity: reveal.isVisible ? 1 : 0,
                            transform: reveal.isVisible ? 'translateY(0)' : 'translateY(20px)',
                            transitionDelay: '600ms',
                        }}
                    >
                        {section.copy}
                    </p>
                </div>
            </div>

            {/* Section number — dramatic counter */}
            <div className="md:w-1/3 text-center relative">
                <span
                    className="text-[10rem] md:text-[14rem] font-bold leading-none transition-all duration-1000 ease-out block"
                    style={{
                        fontFamily: '"Quicksand", sans-serif',
                        opacity: reveal.isVisible ? 0.08 : 0,
                        transform: reveal.isVisible ? 'scale(1)' : 'scale(0.5)',
                        filter: reveal.isVisible ? 'blur(0px)' : 'blur(10px)',
                    }}
                >
                    0{count}
                </span>
                {/* Decorative glow dot */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-1000"
                    style={{
                        backgroundColor: section.glowColor,
                        boxShadow: `0 0 20px ${section.glowColor}, 0 0 60px ${section.glowColor}40`,
                        opacity: reveal.isVisible ? 0.6 : 0,
                        transitionDelay: '800ms',
                    }}
                />
            </div>
        </div>
    );
}

export default function HeroCinematic() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scrollY, setScrollY] = useState(0);
    const [letterboxOpen, setLetterboxOpen] = useState(false);
    const [heroMounted, setHeroMounted] = useState(false);

    // Refs for scroll-based parallax
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll reveals for hero and showcase sections
    const section0Reveal = useScrollReveal(0.2);
    const showcaseReveal = useScrollReveal(0.1);

    // Mouse tracking for atmospheric glow
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Scroll tracking for parallax + letterbox
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cinematic opening: letterbox bars retract after mount
    useEffect(() => {
        const t1 = setTimeout(() => setHeroMounted(true), 100);
        const t2 = setTimeout(() => setLetterboxOpen(true), 1400);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Sync language with i18n
    useEffect(() => {
        i18n.changeLanguage(nativeLang);
    }, [nativeLang, i18n]);

    const languages = Object.values(LANGUAGE_CONFIGS);

    if (step === 'onboarding') {
        return <OnboardingCinematic onComplete={() => alert('Demo Finished! Explore other concepts from the bottom right switcher.')} />;
    }

    const isStudent = role !== 'tutor';

    const sectionsContent = [
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.copy`),
            color: 'from-[#FF6B6B] to-transparent',
            glowColor: '#FF6B6B',
            glow: 'rgba(255,107,107,0.2)',
            num: 1
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            color: 'from-[#4ECDC4] to-transparent',
            glowColor: '#4ECDC4',
            glow: 'rgba(78,205,196,0.2)',
            num: 2
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            color: 'from-[#FFE66D] to-transparent',
            glowColor: '#FFE66D',
            glow: 'rgba(255,230,109,0.2)',
            num: 3
        }
    ];

    // Parallax offset for background elements (slower than scroll)
    const parallaxSlow = scrollY * 0.3;
    const parallaxMedium = scrollY * 0.5;

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#0A0C0F] text-white flex flex-col relative overflow-x-hidden"
            style={{ fontFamily: '"Outfit", sans-serif' }}
        >
            {/* ═══════════════════════════════════════════════════════
                LAYER 0: STARFIELD — CSS-only floating particles
                Hundreds of tiny dots via box-shadow on a pseudo-element
            ═══════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
                <div className="starfield-layer starfield-near" />
                <div className="starfield-layer starfield-far" />
            </div>

            {/* ═══════════════════════════════════════════════════════
                LAYER 1: FILM GRAIN — Animated noise overlay
            ═══════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.035] mix-blend-overlay" aria-hidden="true">
                <div className="film-grain" />
            </div>

            {/* ═══════════════════════════════════════════════════════
                LAYER 2: PARALLAX ATMOSPHERIC GLOWS
                Two large ambient orbs that drift with scroll
            ═══════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden" aria-hidden="true">
                <div
                    className="absolute w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full blur-[200px] opacity-15"
                    style={{
                        background: 'radial-gradient(circle, #FF6B6B 0%, transparent 70%)',
                        left: '-20vw',
                        top: `calc(-20vh + ${parallaxSlow}px)`,
                        transition: 'top 0.1s linear',
                    }}
                />
                <div
                    className="absolute w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full blur-[180px] opacity-10"
                    style={{
                        background: 'radial-gradient(circle, #4ECDC4 0%, transparent 70%)',
                        right: '-15vw',
                        top: `calc(30vh + ${parallaxSlow * 0.6}px)`,
                        transition: 'top 0.1s linear',
                    }}
                />
                <div
                    className="absolute w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-[160px] opacity-8"
                    style={{
                        background: 'radial-gradient(circle, #FFE66D 0%, transparent 70%)',
                        left: '30vw',
                        top: `calc(80vh + ${parallaxSlow * 0.4}px)`,
                        transition: 'top 0.1s linear',
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════
                LAYER 3: MOUSE-TRACKING GLOW — Interactive atmosphere
            ═══════════════════════════════════════════════════════ */}
            <div
                className="fixed pointer-events-none rounded-full blur-[160px] opacity-15 z-[3] transition-all duration-[2000ms] ease-out"
                style={{
                    background: 'radial-gradient(circle, rgba(255,107,107,0.6) 0%, rgba(78,205,196,0.2) 50%, transparent 100%)',
                    width: '700px',
                    height: '700px',
                    left: mousePos.x - 350,
                    top: mousePos.y - 350,
                }}
            />

            {/* ═══════════════════════════════════════════════════════
                CINEMATIC LETTERBOX BARS — Movie-opening retraction
            ═══════════════════════════════════════════════════════ */}
            <div
                className="fixed top-0 left-0 right-0 bg-black z-50 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                    height: letterboxOpen ? '0px' : '60px',
                    transitionDuration: '1800ms',
                }}
                aria-hidden="true"
            />
            <div
                className="fixed bottom-0 left-0 right-0 bg-black z-50 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                    height: letterboxOpen ? '0px' : '60px',
                    transitionDuration: '1800ms',
                }}
                aria-hidden="true"
            />

            {/* ═══════════════════════════════════════════════════════
                HERO SECTION — The main stage
            ═══════════════════════════════════════════════════════ */}
            <section className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 border-b border-white/5">

                {/* Decorative orbital rings behind the hero */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
                    <div
                        className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full border border-white/[0.03] orbital-ring"
                        style={{ animationDuration: '60s' }}
                    />
                    <div
                        className="absolute w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] rounded-full border border-white/[0.02] orbital-ring-reverse"
                        style={{ animationDuration: '90s' }}
                    />
                    {/* Small accent dots on the orbital rings */}
                    <div
                        className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] orbital-ring"
                        style={{ animationDuration: '60s' }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6B6B] shadow-[0_0_8px_#FF6B6B]" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#4ECDC4] shadow-[0_0_6px_#4ECDC4]" />
                    </div>
                </div>

                <div
                    className={`w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24 transition-all duration-[1500ms] ease-out ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {/* ─── Left Side: Cinematic Typography ─── */}
                    <div className="md:w-1/2 text-center md:text-left" ref={section0Reveal.ref}>
                        {/* Tagline pill with breathing glow */}
                        <div
                            className={`inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[#FFE66D] text-xs tracking-[0.2em] uppercase mb-8 backdrop-blur-sm transition-all duration-1000 ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                            style={{ transitionDelay: '600ms', boxShadow: '0 0 20px rgba(255,230,109,0.15), inset 0 0 20px rgba(255,230,109,0.05)' }}
                        >
                            {t('hero.shared.section0.subhead', 'The language learning app for couples')}
                        </div>

                        {/* Main headline with staggered word reveal */}
                        <h1
                            className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] mb-6"
                            style={{ fontFamily: '"Quicksand", sans-serif', perspective: '600px' }}
                        >
                            {t('hero.student.section0.headline', 'Learn the Language of Love').split(' ').map((word, i, arr) => {
                                const targetWord = t('hero.student.section0.highlight1', 'Language');
                                const isHighlight = word.includes(targetWord) || targetWord.includes(word);
                                return (
                                    <span
                                        key={i}
                                        className={`inline-block transition-all duration-700 ease-out ${isHighlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4]' : ''}`}
                                        style={{
                                            opacity: heroMounted ? 1 : 0,
                                            transform: heroMounted ? 'translateY(0) rotateX(0)' : 'translateY(50px) rotateX(25deg)',
                                            transitionDelay: `${800 + i * 100}ms`,
                                        }}
                                    >
                                        {word}{i < arr.length - 1 ? '\u00A0' : ''}
                                    </span>
                                );
                            })}
                        </h1>

                        {/* Subtitle with delayed fade */}
                        <p
                            className={`text-gray-400 text-lg md:text-xl font-light leading-relaxed max-w-md mx-auto md:mx-0 transition-all duration-1000 ease-out ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                            style={{ transitionDelay: '1400ms' }}
                        >
                            {t('hero.shared.section0.copy', 'Connect deeper with your partner by learning their native tongue. Shared vocabulary, shared intimacy.')}
                        </p>

                        {/* Decorative accent line */}
                        <div
                            className={`hidden md:block mt-8 h-px bg-gradient-to-r from-[#FF6B6B]/60 via-[#FFE66D]/30 to-transparent transition-all duration-[2000ms] ease-out ${heroMounted ? 'w-48 opacity-100' : 'w-0 opacity-0'}`}
                            style={{ transitionDelay: '1800ms' }}
                        />
                    </div>

                    {/* ─── Right Side: Glassmorphism Form with Animated Border ─── */}
                    <div
                        className={`md:w-1/2 w-full max-w-md relative group transition-all duration-[1200ms] ease-out ${heroMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}
                        style={{ transitionDelay: '500ms' }}
                    >
                        {/* Animated conic-gradient border — slowly rotating rainbow edge */}
                        <div className="absolute -inset-[2px] rounded-[2rem] animated-border-gradient opacity-40 group-hover:opacity-70 transition-opacity duration-500" />

                        {/* Glow aura behind the card */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6B6B]/10 via-[#4ECDC4]/10 to-[#FFE66D]/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative bg-[#12151A]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden">

                            {/* Subtle inner shimmer accent at top */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            {/* Progress Dots — color-coded constellation */}
                            <div className="flex justify-center gap-4 mb-12">
                                {(['language', 'role', 'auth'] as const).map((s, i) => {
                                    const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4'];
                                    const isActive = step === s;
                                    const isPast = (['language', 'role', 'auth'] as const).indexOf(step) > i;
                                    return (
                                        <div key={s} className="relative flex items-center justify-center">
                                            {isActive && (
                                                <div
                                                    className="absolute w-6 h-6 rounded-full animate-ping opacity-30"
                                                    style={{ backgroundColor: colors[i] }}
                                                />
                                            )}
                                            <div
                                                className="w-2.5 h-2.5 rounded-full transition-all duration-500 relative z-10"
                                                style={{
                                                    backgroundColor: isActive || isPast ? colors[i] : 'rgba(255,255,255,0.15)',
                                                    transform: isActive ? 'scale(1.5)' : 'scale(1)',
                                                    boxShadow: isActive ? `0 0 12px ${colors[i]}, 0 0 30px ${colors[i]}40` : 'none',
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="relative min-h-[320px]">

                                {/* Step 1: Language */}
                                <div className={`top-0 left-0 w-full transition-all duration-500 ${step === 'language' ? 'relative opacity-100 translate-y-0 z-10' : 'absolute opacity-0 translate-y-4 -z-10 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.shared.context0.header', 'Select Languages')}</h3>

                                    <div className="space-y-6 mb-8">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">{t('hero.languageSelector.nativePrompt', 'My Native Language')}</label>
                                            <select
                                                className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B] transition-all text-white appearance-none relative z-10"
                                                value={nativeLang}
                                                onChange={(e) => setNativeLang(e.target.value)}
                                            >
                                                {languages.map(l => <option key={l.code} value={l.code} className="bg-[#0A0C0F]">{l.nativeName} ({l.flag})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">{t('hero.languageSelector.targetPrompt', 'Target Language')}</label>
                                            <select
                                                className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#4ECDC4] transition-all text-white appearance-none relative z-10"
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                            >
                                                {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code} className="bg-[#0A0C0F]">{l.nativeName} ({l.flag})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {/* CTA with breathing glow */}
                                    <button
                                        onClick={() => setStep('role')}
                                        className="w-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-medium py-4 rounded-xl transition-all active:scale-[0.98] relative overflow-hidden cta-breathing"
                                        style={{ boxShadow: '0 0 20px rgba(255,107,107,0.3), 0 4px 20px rgba(255,107,107,0.2)' }}
                                    >
                                        {t('onboarding.step.continue', 'Continue')}
                                    </button>
                                </div>

                                {/* Step 2: Role */}
                                <div className={`top-0 left-0 w-full transition-all duration-500 ${step === 'role' ? 'relative opacity-100 translate-y-0 z-10' : 'absolute opacity-0 translate-y-4 -z-10 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.student.context1.header', 'Your Role')}</h3>

                                    <div className="flex flex-col gap-4 mb-8">
                                        <button
                                            onClick={() => setRole('student')}
                                            className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden ${role === 'student' ? 'bg-[#FF6B6B]/10 border-[#FF6B6B]/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            style={role === 'student' ? { boxShadow: '0 0 25px rgba(255,107,107,0.15), inset 0 0 25px rgba(255,107,107,0.05)' } : {}}
                                        >
                                            <h4 className="font-semibold text-lg mb-1" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.learn', 'The Student')}</h4>
                                            <p className="text-sm text-gray-400">{t('hero.student.context1.learnerCopy', "I am here to learn my partner's language.")}</p>
                                        </button>
                                        <button
                                            onClick={() => setRole('tutor')}
                                            className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden ${role === 'tutor' ? 'bg-[#4ECDC4]/10 border-[#4ECDC4]/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            style={role === 'tutor' ? { boxShadow: '0 0 25px rgba(78,205,196,0.15), inset 0 0 25px rgba(78,205,196,0.05)' } : {}}
                                        >
                                            <h4 className="font-semibold text-lg mb-1" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.teach', 'The Guide')}</h4>
                                            <p className="text-sm text-gray-400">{t('hero.tutor.context1.guideCopy', "I am here to help my partner learn.")}</p>
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep('language')}
                                            className="w-1/3 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-4 rounded-xl transition-all"
                                        >
                                            {t('onboarding.step.back', 'Back')}
                                        </button>
                                        <button
                                            onClick={() => setStep('auth')}
                                            disabled={!role}
                                            className="w-2/3 bg-[#FFE66D] hover:bg-[#f5dd65] disabled:opacity-30 disabled:bg-[#FFE66D] text-[#292F36] font-bold py-4 rounded-xl transition-all cta-breathing-gold active:scale-[0.98]"
                                            style={role ? { boxShadow: '0 0 20px rgba(255,230,109,0.3), 0 4px 20px rgba(255,230,109,0.2)' } : {}}
                                        >
                                            {t('onboarding.step.continue', 'Continue')}
                                        </button>
                                    </div>
                                </div>

                                {/* Step 3: Auth */}
                                <div className={`top-0 left-0 w-full transition-all duration-500 ${step === 'auth' ? 'relative opacity-100 translate-y-0 z-10' : 'absolute opacity-0 translate-y-4 -z-10 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>{isSignUp ? t('hero.login.createAccount', 'Create Account') : t('hero.login.signIn', 'Welcome Back')}</h3>
                                    <p className="text-center text-gray-400 text-sm mb-8">{t('hero.cinematic.authSubtext', 'Securely sync your progress across devices.')}</p>

                                    <div className="space-y-4 mb-8">
                                        <input
                                            type="email"
                                            placeholder={t('hero.login.emailLabel', 'Email Address')}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#4ECDC4] transition-all text-white placeholder-gray-500 relative z-10"
                                        />
                                        <input
                                            type="password"
                                            placeholder={t('hero.login.passwordLabel', 'Password')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#4ECDC4] transition-all text-white placeholder-gray-500 relative z-10"
                                        />
                                    </div>

                                    <button
                                        onClick={(e) => { e.preventDefault(); setStep('onboarding'); }}
                                        className="w-full bg-[#4ECDC4] text-[#1A1D21] hover:bg-[#43b8b0] font-bold py-4 rounded-xl transition-all active:scale-[0.98] mb-4 relative z-10 cta-breathing-teal"
                                        style={{ boxShadow: '0 0 25px rgba(78,205,196,0.3), 0 4px 20px rgba(78,205,196,0.2)' }}
                                    >
                                        {isSignUp ? `${t('hero.login.createAccount', 'Sign Up')} (Demo)` : `${t('hero.login.signIn', 'Sign In')} (Demo)`}
                                    </button>

                                    <div className="text-center relative z-10">
                                        <button
                                            onClick={() => setIsSignUp(!isSignUp)}
                                            className="text-gray-400 text-sm hover:text-white transition"
                                        >
                                            {isSignUp ? t('user.login', 'Already have an account? Sign In') : t('user.signup', 'Need an account? Sign Up')}
                                        </button>
                                    </div>

                                    <div className="mt-8 text-center relative z-10">
                                        <button
                                            onClick={() => setStep('role')}
                                            className="text-gray-500 text-xs hover:text-gray-300 transition"
                                        >
                                            &larr; {t('onboarding.step.back', 'Go Back')}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

                {/* Scroll indicator at bottom of hero */}
                <div
                    className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-1000 ${heroMounted ? 'opacity-60' : 'opacity-0'}`}
                    style={{ transitionDelay: '2500ms' }}
                >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Scroll</span>
                    <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5">
                        <div className="w-1 h-2 rounded-full bg-white/40 scroll-indicator-dot" />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                CINEMATIC CONTENT SECTIONS — Scroll-revealed with parallax
            ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 bg-transparent py-32 px-6">
                <div className="max-w-6xl mx-auto space-y-40">
                    {sectionsContent.map((section, i) => (
                        <CinematicSectionCard key={i} section={section} index={i} />
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SHOWCASE SECTION — Game previews
            ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 py-32 px-6 border-y border-white/5 bg-[#0D0F12]" ref={showcaseReveal.ref}>
                <div
                    className="max-w-6xl mx-auto relative z-20 transition-all duration-1000 ease-out"
                    style={{
                        opacity: showcaseReveal.isVisible ? 1 : 0,
                        transform: showcaseReveal.isVisible ? 'translateY(0)' : 'translateY(40px)',
                    }}
                >
                    <CinematicGameShowcaseWrapper
                        isStudent={isStudent}
                        accentColor="#4ECDC4"
                        sectionIndex={4}
                        isMobile={false}
                        targetLanguage={targetLang}
                        nativeLanguage={nativeLang}
                    />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FOOTER SECTIONS — Standard components, dark-themed
            ═══════════════════════════════════════════════════════ */}
            <div className="relative z-10">
                <CinematicFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <CinematicRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <CinematicBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <div className="relative z-10">
                <CinematicFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />
            </div>

            {/* ═══════════════════════════════════════════════════════
                STYLESHEET — All cinematic animations and effects
            ═══════════════════════════════════════════════════════ */}
            <style>{`
                /* ── STARFIELD: CSS-only particle field ── */
                .starfield-layer {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }
                .starfield-near {
                    background: transparent;
                    animation: starfield-drift 120s linear infinite;
                }
                .starfield-near::after {
                    content: '';
                    position: absolute;
                    top: -100vh;
                    left: 0;
                    width: 2px;
                    height: 2px;
                    border-radius: 50%;
                    background: white;
                    box-shadow:
                        /* Star positions — scattered across viewport */
                        12vw 15vh 0 0 rgba(255,255,255,0.4),
                        87vw 23vh 0 0 rgba(255,107,107,0.5),
                        43vw 45vh 0 0 rgba(255,255,255,0.3),
                        67vw 78vh 0 0 rgba(78,205,196,0.4),
                        23vw 89vh 0 0 rgba(255,255,255,0.5),
                        91vw 56vh 0 0 rgba(255,230,109,0.3),
                        34vw 12vh 0 0 rgba(255,255,255,0.4),
                        78vw 34vh 0 0 rgba(255,107,107,0.3),
                        56vw 67vh 0 0 rgba(255,255,255,0.5),
                        8vw 45vh 0 0 rgba(78,205,196,0.3),
                        95vw 89vh 0 0 rgba(255,255,255,0.4),
                        45vw 23vh 0 0 rgba(255,230,109,0.4),
                        72vw 90vh 0 0 rgba(255,255,255,0.3),
                        15vw 67vh 0 0 rgba(255,107,107,0.4),
                        83vw 12vh 0 0 rgba(255,255,255,0.5),
                        /* Second generation — more depth */
                        28vw 134vh 0 0 rgba(255,255,255,0.4),
                        62vw 156vh 0 0 rgba(78,205,196,0.3),
                        47vw 178vh 0 0 rgba(255,107,107,0.4),
                        89vw 145vh 0 0 rgba(255,255,255,0.5),
                        5vw 167vh 0 0 rgba(255,230,109,0.3),
                        73vw 189vh 0 0 rgba(255,255,255,0.4),
                        38vw 112vh 0 0 rgba(78,205,196,0.4),
                        51vw 198vh 0 0 rgba(255,255,255,0.3),
                        16vw 123vh 0 0 rgba(255,107,107,0.3),
                        94vw 178vh 0 0 rgba(255,255,255,0.5);
                }
                .starfield-far {
                    background: transparent;
                    animation: starfield-drift 200s linear infinite;
                    opacity: 0.5;
                }
                .starfield-far::after {
                    content: '';
                    position: absolute;
                    top: -100vh;
                    left: 0;
                    width: 1px;
                    height: 1px;
                    border-radius: 50%;
                    background: white;
                    box-shadow:
                        25vw 30vh 0 0 rgba(255,255,255,0.3),
                        50vw 60vh 0 0 rgba(255,255,255,0.2),
                        75vw 20vh 0 0 rgba(255,255,255,0.3),
                        10vw 80vh 0 0 rgba(255,255,255,0.2),
                        60vw 40vh 0 0 rgba(255,255,255,0.3),
                        85vw 70vh 0 0 rgba(255,255,255,0.2),
                        30vw 55vh 0 0 rgba(255,255,255,0.3),
                        70vw 85vh 0 0 rgba(255,255,255,0.2),
                        15vw 35vh 0 0 rgba(255,255,255,0.3),
                        90vw 95vh 0 0 rgba(255,255,255,0.2),
                        40vw 150vh 0 0 rgba(255,255,255,0.3),
                        65vw 130vh 0 0 rgba(255,255,255,0.2),
                        20vw 170vh 0 0 rgba(255,255,255,0.3),
                        80vw 140vh 0 0 rgba(255,255,255,0.2),
                        55vw 190vh 0 0 rgba(255,255,255,0.3);
                }
                @keyframes starfield-drift {
                    from { transform: translateY(0); }
                    to { transform: translateY(100vh); }
                }

                /* ── FILM GRAIN: Animated noise texture ── */
                .film-grain {
                    position: absolute;
                    inset: -100%;
                    width: 300%;
                    height: 300%;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    animation: grain-shift 0.5s steps(4) infinite;
                }
                @keyframes grain-shift {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(-5%, -5%); }
                    50% { transform: translate(5%, 0); }
                    75% { transform: translate(0, 5%); }
                    100% { transform: translate(-5%, 5%); }
                }

                /* ── ORBITAL RINGS: Decorative spinning circles ── */
                .orbital-ring {
                    animation: orbital-spin linear infinite;
                }
                .orbital-ring-reverse {
                    animation: orbital-spin-reverse linear infinite;
                }
                @keyframes orbital-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes orbital-spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                /* ── ANIMATED GRADIENT BORDER: Rotating conic gradient ── */
                .animated-border-gradient {
                    background: conic-gradient(
                        from var(--border-angle, 0deg),
                        #FF6B6B,
                        #FFE66D,
                        #4ECDC4,
                        #FF6B6B
                    );
                    animation: border-rotate 4s linear infinite;
                    -webkit-mask:
                        linear-gradient(#fff 0 0) content-box,
                        linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    padding: 2px;
                    border-radius: 2rem;
                }
                @property --border-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }
                @keyframes border-rotate {
                    to { --border-angle: 360deg; }
                }

                /* ── BREATHING GLOW: Pulsing aura on CTAs ── */
                .cta-breathing {
                    animation: breathe-coral 3s ease-in-out infinite;
                }
                .cta-breathing-gold {
                    animation: breathe-gold 3s ease-in-out infinite;
                }
                .cta-breathing-teal {
                    animation: breathe-teal 3s ease-in-out infinite;
                }
                @keyframes breathe-coral {
                    0%, 100% { box-shadow: 0 0 20px rgba(255,107,107,0.3), 0 4px 20px rgba(255,107,107,0.2); }
                    50% { box-shadow: 0 0 35px rgba(255,107,107,0.5), 0 4px 30px rgba(255,107,107,0.3); }
                }
                @keyframes breathe-gold {
                    0%, 100% { box-shadow: 0 0 20px rgba(255,230,109,0.3), 0 4px 20px rgba(255,230,109,0.2); }
                    50% { box-shadow: 0 0 35px rgba(255,230,109,0.5), 0 4px 30px rgba(255,230,109,0.3); }
                }
                @keyframes breathe-teal {
                    0%, 100% { box-shadow: 0 0 25px rgba(78,205,196,0.3), 0 4px 20px rgba(78,205,196,0.2); }
                    50% { box-shadow: 0 0 40px rgba(78,205,196,0.5), 0 4px 30px rgba(78,205,196,0.3); }
                }

                /* ── SCROLL INDICATOR: Bouncing dot ── */
                .scroll-indicator-dot {
                    animation: scroll-bounce 2s ease-in-out infinite;
                }
                @keyframes scroll-bounce {
                    0%, 100% { transform: translateY(0); opacity: 1; }
                    50% { transform: translateY(8px); opacity: 0.3; }
                }

                /* ── Reduced motion: respect user preferences ── */
                @media (prefers-reduced-motion: reduce) {
                    .starfield-near, .starfield-far,
                    .orbital-ring, .orbital-ring-reverse,
                    .animated-border-gradient,
                    .cta-breathing, .cta-breathing-gold, .cta-breathing-teal,
                    .scroll-indicator-dot,
                    .film-grain {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
