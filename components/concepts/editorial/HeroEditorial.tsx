import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingEditorial from './OnboardingEditorial';
import { useTranslation } from 'react-i18next';
import { EditorialFAQ, EditorialRALL, EditorialBlog, EditorialFooter, EditorialGameShowcaseWrapper } from './BelowFoldEditorial';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

// ─────────────────────────────────────────────
// Intersection Observer hook for scroll-triggered animations
// ─────────────────────────────────────────────
function useInView(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
            { threshold: 0.15, ...options }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, isInView };
}

// ─────────────────────────────────────────────
// Staggered text reveal — each word animates in sequence
// ─────────────────────────────────────────────
function StaggeredText({ text, className, style, as: Tag = 'h3', delay = 0 }: {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
    delay?: number;
}) {
    const { ref, isInView } = useInView();
    const words = text.split(' ');

    return (
        <Tag ref={ref as any} className={className} style={style}>
            {words.map((word, i) => (
                <span
                    key={i}
                    className="inline-block overflow-hidden"
                    style={{ marginRight: '0.3em' }}
                >
                    <span
                        className="inline-block"
                        style={{
                            transform: isInView ? 'translateY(0)' : 'translateY(110%)',
                            opacity: isInView ? 1 : 0,
                            transition: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * 0.06}s, opacity 0.5s ease ${delay + i * 0.06}s`,
                        }}
                    >
                        {word}
                    </span>
                </span>
            ))}
        </Tag>
    );
}

// ─────────────────────────────────────────────
// Animated divider that draws itself in on scroll
// ─────────────────────────────────────────────
function AnimatedDivider({ color = '#292F36', width = '100%', delay = 0 }: {
    color?: string;
    width?: string;
    delay?: number;
}) {
    const { ref, isInView } = useInView();
    return (
        <div ref={ref} className="overflow-hidden" style={{ maxWidth: width }}>
            <div
                style={{
                    height: '1px',
                    background: color,
                    transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: `transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────
// Full-width pull quote component
// ─────────────────────────────────────────────
function PullQuote({ text, attribution }: { text: string; attribution?: string }) {
    const { ref, isInView } = useInView();
    return (
        <div ref={ref} className="py-24 md:py-40 px-8 text-center relative overflow-hidden">
            {/* Decorative oversized quotation mark */}
            <div
                className="absolute top-8 left-1/2 -translate-x-1/2 select-none pointer-events-none"
                style={{
                    fontSize: 'clamp(120px, 20vw, 300px)',
                    lineHeight: 1,
                    fontFamily: '"Playfair Display", Georgia, serif',
                    color: 'rgba(255,107,107,0.06)',
                    transform: isInView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
                    opacity: isInView ? 1 : 0,
                    transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                &ldquo;
            </div>
            <blockquote
                className="relative z-10 max-w-5xl mx-auto"
                style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    transform: isInView ? 'translateY(0)' : 'translateY(30px)',
                    opacity: isInView ? 1 : 0,
                    transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                }}
            >
                <p className="text-3xl md:text-5xl lg:text-6xl italic leading-tight tracking-tight text-[#292F36] font-light">
                    {text}
                </p>
                {attribution && (
                    <footer className="mt-8 text-xs uppercase tracking-[0.3em] text-[#FF6B6B] font-semibold"
                        style={{ fontFamily: '"Outfit", sans-serif' }}
                    >
                        &mdash; {attribution}
                    </footer>
                )}
            </blockquote>
        </div>
    );
}

// ─────────────────────────────────────────────
// Footnote annotation with elegant hover tooltip
// ─────────────────────────────────────────────
function Footnote({ number, note }: { number: number; note: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-block">
            <sup
                className="cursor-pointer text-[#FF6B6B] font-semibold text-[0.65em] ml-0.5 hover:text-[#ff5252] transition-colors select-none"
                style={{ fontFamily: '"Outfit", sans-serif' }}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onClick={() => setShow(!show)}
            >
                {number}
            </sup>
            <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none z-50"
                style={{
                    opacity: show ? 1 : 0,
                    transform: show ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <span
                    className="block bg-[#292F36] text-white text-xs leading-relaxed px-5 py-3 rounded-sm shadow-xl whitespace-nowrap max-w-[280px]"
                    style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 300, whiteSpace: 'normal' }}
                >
                    {note}
                </span>
                <span className="block w-2 h-2 bg-[#292F36] rotate-45 mx-auto -mt-1"></span>
            </span>
        </span>
    );
}

// ─────────────────────────────────────────────
// Single philosophy section (extracted to obey Rules of Hooks)
// ─────────────────────────────────────────────
function PhilosophySection({ section, index }: {
    section: { headline: string; copy: string; number: string; footnote: string };
    index: number;
}) {
    const { ref: sRef, isInView: sInView } = useInView();
    return (
        <div ref={sRef}>
            <div className={`flex flex-col md:flex-row gap-8 md:gap-20 items-start ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                {/* Large section number */}
                <div className="md:w-1/4 relative">
                    <span
                        className="text-[8rem] md:text-[10rem] leading-none font-black block"
                        style={{
                            fontFamily: '"Playfair Display", Georgia, serif',
                            color: 'rgba(41,47,54,0.04)',
                            transform: sInView ? 'translateY(0)' : 'translateY(40px)',
                            opacity: sInView ? 1 : 0,
                            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {section.number}
                    </span>
                </div>

                {/* Content */}
                <div className="md:w-3/4">
                    <AnimatedDivider color="rgba(255,107,107,0.3)" width="60px" delay={0.1} />
                    <div className="mt-8">
                        <StaggeredText
                            as="h3"
                            text={section.headline}
                            className="text-3xl md:text-5xl font-semibold mb-8 text-[#292F36] leading-[1.1] tracking-[-0.02em]"
                            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                            delay={0.15}
                        />
                        <p
                            className="text-lg md:text-xl font-light leading-[1.9] max-w-2xl"
                            style={{
                                color: 'rgba(41,47,54,0.5)',
                                transform: sInView ? 'translateY(0)' : 'translateY(20px)',
                                opacity: sInView ? 1 : 0,
                                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                            }}
                        >
                            {section.copy}
                            <Footnote number={index + 1} note={section.footnote} />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Decorative CSS-only editorial art piece
// ─────────────────────────────────────────────
function EditorialArt({ variant = 1 }: { variant?: number }) {
    const { ref, isInView } = useInView();
    const baseDelay = 0.2;

    if (variant === 1) {
        return (
            <div ref={ref} className="relative w-full h-48 md:h-64 my-8 overflow-hidden">
                {/* Overlapping rectangles composition */}
                <div
                    className="absolute top-0 left-[10%] w-[35%] h-full border border-[#4ECDC4]/30"
                    style={{
                        transform: isInView ? 'translateX(0) scaleY(1)' : 'translateX(-30px) scaleY(0)',
                        transformOrigin: 'top',
                        transition: `all 1s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay}s`,
                    }}
                />
                <div
                    className="absolute top-[15%] left-[25%] w-[40%] h-[70%] bg-[#FF6B6B]/[0.04]"
                    style={{
                        transform: isInView ? 'translate(0, 0)' : 'translate(20px, 20px)',
                        opacity: isInView ? 1 : 0,
                        transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + 0.15}s`,
                    }}
                />
                <div
                    className="absolute top-[30%] right-[15%] w-[25%] h-[50%] border border-[#FF6B6B]/20"
                    style={{
                        transform: isInView ? 'translateY(0) scaleX(1)' : 'translateY(20px) scaleX(0)',
                        transformOrigin: 'right',
                        transition: `all 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + 0.3}s`,
                    }}
                />
                {/* Thin accent line */}
                <div
                    className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#292F36]/10 to-transparent"
                    style={{
                        transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
                        transition: `transform 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + 0.2}s`,
                    }}
                />
            </div>
        );
    }

    return (
        <div ref={ref} className="relative w-full h-40 md:h-56 my-8 overflow-hidden">
            {/* Geometric grid composition */}
            <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-8">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="w-[1px] h-full bg-[#4ECDC4]/15"
                        style={{
                            transform: isInView ? 'scaleY(1)' : 'scaleY(0)',
                            transformOrigin: i % 2 === 0 ? 'top' : 'bottom',
                            transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + i * 0.1}s`,
                        }}
                    />
                ))}
            </div>
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full border border-[#FF6B6B]/20"
                style={{
                    transform: isInView ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
                    transition: `transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + 0.3}s`,
                }}
            />
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-[#FF6B6B]/[0.04] rounded-full"
                style={{
                    transform: isInView ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
                    transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + 0.45}s`,
                }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────
// Chapter navigation sidebar dots
// ─────────────────────────────────────────────
function ChapterNav({ chapters, activeIndex }: { chapters: string[]; activeIndex: number }) {
    return (
        <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-end gap-6">
            {chapters.map((label, i) => (
                <a
                    key={i}
                    href={`#chapter-${i}`}
                    className="group flex items-center gap-3"
                    onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`chapter-${i}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    <span
                        className="text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
                        style={{
                            fontFamily: '"Outfit", sans-serif',
                            opacity: activeIndex === i ? 1 : 0,
                            transform: activeIndex === i ? 'translateX(0)' : 'translateX(8px)',
                            color: '#FF6B6B',
                        }}
                    >
                        {label}
                    </span>
                    <span
                        className="block rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: activeIndex === i ? 24 : 6,
                            height: 6,
                            background: activeIndex === i ? '#FF6B6B' : 'rgba(41,47,54,0.2)',
                        }}
                    />
                </a>
            ))}
        </nav>
    );
}


// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function HeroEditorial() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('fr');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Scroll state
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeChapter, setActiveChapter] = useState(0);
    const [heroParallax, setHeroParallax] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Chapter refs
    const chapterRefs = useRef<(HTMLElement | null)[]>([]);

    const chapters = useMemo(() => ['Cover', 'Philosophy', 'In Practice', 'Community', 'Begin'], []);

    // Inject Editorial Fonts
    useEffect(() => {
        const id = 'font-editorial-breathtaking';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Outfit:wght@200;300;400;500;600;700&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    // Scroll tracking: progress bar + parallax + chapter detection
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
            setHeroParallax(Math.min(scrollTop * 0.4, 300));

            // Determine active chapter
            let current = 0;
            chapterRefs.current.forEach((ref, i) => {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    if (rect.top <= window.innerHeight * 0.5) current = i;
                }
            });
            setActiveChapter(current);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Sync language selection with i18n
    useEffect(() => {
        i18n.changeLanguage(nativeLang);
    }, [nativeLang, i18n]);

    const languages = Object.values(LANGUAGE_CONFIGS);

    if (step === 'onboarding') {
        return <OnboardingEditorial onComplete={() => alert('Demo Finished! Explore other concepts from the bottom right switcher.')} />;
    }

    const isStudent = role !== 'tutor';

    const sectionsContent = [
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.copy`),
            number: '01',
            footnote: 'Built on spaced repetition research from Leitner (1972) and modern adaptive algorithms.',
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            number: '02',
            footnote: 'Emotional context accelerates vocabulary retention by up to 40% (Applied Linguistics, 2019).',
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            number: '03',
            footnote: 'AI tutoring powered by Google Gemini, personalized to your relationship and proficiency.',
        }
    ];

    const setChapterRef = (i: number) => (el: HTMLElement | null) => {
        chapterRefs.current[i] = el;
    };

    return (
        <div
            ref={containerRef}
            className="min-h-screen overflow-x-hidden relative"
            style={{
                fontFamily: '"Outfit", sans-serif',
                color: '#292F36',
                background: '#FAFAF7',
            }}
        >
            {/* ═══════════════════════════════════════════
                READING PROGRESS BAR
            ═══════════════════════════════════════════ */}
            <div className="fixed top-0 left-0 right-0 z-[100] h-[2px]" style={{ background: 'rgba(250,250,247,0.5)' }}>
                <div
                    className="h-full"
                    style={{
                        width: `${scrollProgress * 100}%`,
                        background: 'linear-gradient(90deg, #FF6B6B, #FF6B6B 60%, #4ECDC4)',
                        transition: 'width 0.05s linear',
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════
                CHAPTER NAVIGATION
            ═══════════════════════════════════════════ */}
            <ChapterNav chapters={chapters} activeIndex={activeChapter} />

            {/* ═══════════════════════════════════════════
                PAPER TEXTURE OVERLAY (barely visible)
            ═══════════════════════════════════════════ */}
            <div
                className="fixed inset-0 pointer-events-none z-[1]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    mixBlendMode: 'multiply',
                }}
            />

            {/* ═══════════════════════════════════════════
                HERO — CHAPTER 0: THE COVER
            ═══════════════════════════════════════════ */}
            <section
                id="chapter-0"
                ref={setChapterRef(0)}
                className="min-h-screen flex flex-col md:flex-row relative z-10"
            >
                {/* Left: Editorial Typography with parallax */}
                <div className="md:w-3/5 p-8 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden">
                    {/* Subtle border accent on right */}
                    <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#292F36]/8 to-transparent hidden md:block" />

                    {/* Masthead */}
                    <div
                        className="absolute top-8 left-8 md:top-12 md:left-16 lg:left-24 flex items-center gap-4"
                        style={{
                            transform: `translateY(${heroParallax * -0.15}px)`,
                        }}
                    >
                        <span className="text-[10px] uppercase tracking-[0.4em] text-[#FF6B6B] font-semibold">
                            Vol. III
                        </span>
                        <span className="w-8 h-[1px] bg-[#FF6B6B]/40" />
                        <span className="text-[10px] uppercase tracking-[0.25em] text-[#292F36]/40 font-light">
                            {t('hero.shared.section0.subhead', 'The language learning app for couples.')}
                        </span>
                    </div>

                    {/* Main headline area with dramatic whitespace */}
                    <div
                        className="max-w-2xl mt-20 md:mt-0"
                        style={{
                            transform: `translateY(${heroParallax * -0.08}px)`,
                        }}
                    >
                        {/* Section marker */}
                        <div className="flex items-center gap-4 mb-10">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-[#4ECDC4] font-bold">Love Languages</span>
                            <span className="flex-1 max-w-[60px] h-[1px] bg-[#4ECDC4]/30" />
                        </div>

                        {/* The big headline — parallax per word, italic highlight */}
                        <h1 className="mb-10 leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            {t('hero.student.section0.headline', 'Learn the Language of Love').split(' ').map((word, i) => {
                                const targetWord = t('hero.student.section0.highlight1', 'Language');
                                const isHighlight = word.includes(targetWord) || targetWord.includes(word);
                                return (
                                    <span
                                        key={i}
                                        className="inline-block overflow-hidden"
                                        style={{ marginRight: '0.25em' }}
                                    >
                                        <span
                                            className={`inline-block text-6xl md:text-7xl lg:text-[6.5rem] ${isHighlight ? 'italic text-[#FF6B6B] font-light' : 'font-semibold text-[#292F36]'}`}
                                            style={{
                                                transform: `translateY(${heroParallax * (0.02 + i * 0.012)}px)`,
                                                transition: 'transform 0.1s ease-out',
                                            }}
                                        >
                                            {isHighlight ? word.toLowerCase() : word}
                                        </span>
                                        {isHighlight && <br />}
                                    </span>
                                );
                            })}
                        </h1>

                        {/* Lede paragraph — wider measure, refined typography */}
                        <p
                            className="text-lg md:text-xl font-light leading-[1.8] max-w-lg mb-16"
                            style={{
                                color: 'rgba(41,47,54,0.55)',
                                transform: `translateY(${heroParallax * -0.03}px)`,
                            }}
                        >
                            {t('hero.shared.section0.copy', 'Connect deeper with your partner by learning their native tongue. Shared vocabulary, shared intimacy.')}
                        </p>

                        {/* Scroll invitation */}
                        <div className="flex items-center gap-5 group cursor-pointer" onClick={() => document.getElementById('chapter-1')?.scrollIntoView({ behavior: 'smooth' })}>
                            <span className="w-12 h-[1px] bg-[#292F36]/20 group-hover:w-20 group-hover:bg-[#FF6B6B] transition-all duration-500" />
                            <span className="text-[11px] uppercase tracking-[0.25em] text-[#292F36]/40 group-hover:text-[#FF6B6B] transition-colors duration-300 font-medium">
                                {t('hero.editorial.readManifesto', 'Read the Manifesto')}
                            </span>
                            <span className="text-[#292F36]/30 group-hover:text-[#FF6B6B] group-hover:translate-y-1 transition-all duration-300">&darr;</span>
                        </div>
                    </div>

                    {/* Decorative large "LL" watermark */}
                    <div
                        className="absolute -bottom-20 -right-16 text-[20rem] leading-none font-black select-none pointer-events-none hidden lg:block"
                        style={{
                            fontFamily: '"Playfair Display", Georgia, serif',
                            color: 'rgba(78,205,196,0.03)',
                            transform: `translateY(${heroParallax * 0.15}px)`,
                        }}
                    >
                        LL
                    </div>
                </div>

                {/* Right: Form Flow */}
                <div className="md:w-2/5 p-8 md:p-12 lg:p-20 flex flex-col justify-center bg-white relative">
                    {/* Subtle top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/20 to-[#FF6B6B]/0 md:hidden" />

                    <div className="max-w-md mx-auto w-full">
                        {/* Step progress — refined thin lines */}
                        <div className="flex gap-3 mb-20">
                            {['language', 'role', 'auth'].map((s, i) => {
                                const steps: Step[] = ['language', 'role', 'auth'];
                                const currentIdx = steps.indexOf(step);
                                const isActive = i <= currentIdx;
                                return (
                                    <div key={s} className="flex-1 relative h-[2px] bg-[#292F36]/5 overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-[#FF6B6B]"
                                            style={{
                                                width: isActive ? '100%' : '0%',
                                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── STEP: LANGUAGE ── */}
                        {step === 'language' && (
                            <div className="ed-fade-in">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-[#292F36]/30 font-medium mb-3">
                                    Step 01
                                </div>
                                <h3
                                    className="text-3xl md:text-4xl mb-10 font-semibold tracking-[-0.02em]"
                                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                                >
                                    {t('hero.shared.context0.header', 'Select your languages')}
                                </h3>

                                <div className="mb-10">
                                    <label className="block text-[10px] uppercase tracking-[0.3em] text-[#292F36]/40 mb-4 font-medium">
                                        {t('hero.languageSelector.nativePrompt', 'I speak')}
                                    </label>
                                    <select
                                        className="w-full bg-transparent border-b-[1.5px] border-[#292F36]/10 py-4 focus:outline-none focus:border-[#4ECDC4] transition-colors text-lg font-light tracking-wide appearance-none cursor-pointer"
                                        value={nativeLang}
                                        onChange={(e) => setNativeLang(e.target.value)}
                                        style={{ backgroundImage: 'none' }}
                                    >
                                        {languages.map(l => <option key={l.code} value={l.code}>{l.nativeName} ({l.flag})</option>)}
                                    </select>
                                </div>

                                <div className="mb-14">
                                    <label className="block text-[10px] uppercase tracking-[0.3em] text-[#292F36]/40 mb-4 font-medium">
                                        {t('hero.languageSelector.targetPrompt', 'I want to learn')}
                                    </label>
                                    <select
                                        className="w-full bg-transparent border-b-[1.5px] border-[#292F36]/10 py-4 focus:outline-none focus:border-[#FF6B6B] transition-colors text-lg font-light tracking-wide appearance-none cursor-pointer"
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        style={{ backgroundImage: 'none' }}
                                    >
                                        {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code}>{l.nativeName} ({l.flag})</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setStep('role')}
                                    className="group w-full bg-[#292F36] text-white py-5 uppercase tracking-[0.25em] text-[10px] font-medium hover:bg-[#1a1f24] transition-all duration-300 relative overflow-hidden"
                                >
                                    <span className="relative z-10">{t('onboarding.step.continue', 'Continue')}</span>
                                    <span className="absolute inset-0 bg-[#FF6B6B] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                                </button>
                            </div>
                        )}

                        {/* ── STEP: ROLE ── */}
                        {step === 'role' && (
                            <div className="ed-fade-in">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-[#292F36]/30 font-medium mb-3">
                                    Step 02
                                </div>
                                <h3
                                    className="text-3xl md:text-4xl mb-10 font-semibold tracking-[-0.02em]"
                                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                                >
                                    {t('hero.student.context1.header', 'Define your role')}
                                </h3>

                                <div className="space-y-4 mb-14">
                                    <button
                                        onClick={() => setRole('student')}
                                        className={`group w-full text-left p-7 border transition-all duration-300 relative overflow-hidden ${
                                            role === 'student'
                                                ? 'border-[#FF6B6B] bg-[#FF6B6B]/[0.03]'
                                                : 'border-[#292F36]/8 hover:border-[#292F36]/25'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4
                                                    className="text-xl mb-2 font-medium tracking-[-0.01em]"
                                                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                                                >
                                                    {t('hero.toggle.learn', 'The Student')}
                                                </h4>
                                                <p className="text-[#292F36]/45 text-sm font-light leading-relaxed">
                                                    {t('hero.student.context1.learnerCopy', "I want to learn my partner's language.")}
                                                </p>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-1 transition-colors duration-300 ${
                                                    role === 'student' ? 'border-[#FF6B6B]' : 'border-[#292F36]/15'
                                                }`}
                                            >
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                                        role === 'student' ? 'bg-[#FF6B6B] scale-100' : 'scale-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setRole('tutor')}
                                        className={`group w-full text-left p-7 border transition-all duration-300 relative overflow-hidden ${
                                            role === 'tutor'
                                                ? 'border-[#4ECDC4] bg-[#4ECDC4]/[0.03]'
                                                : 'border-[#292F36]/8 hover:border-[#292F36]/25'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4
                                                    className="text-xl mb-2 font-medium tracking-[-0.01em]"
                                                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                                                >
                                                    {t('hero.toggle.teach', 'The Guide')}
                                                </h4>
                                                <p className="text-[#292F36]/45 text-sm font-light leading-relaxed">
                                                    {t('hero.tutor.context1.guideCopy', "I want to help my partner learn my language.")}
                                                </p>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-1 transition-colors duration-300 ${
                                                    role === 'tutor' ? 'border-[#4ECDC4]' : 'border-[#292F36]/15'
                                                }`}
                                            >
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                                        role === 'tutor' ? 'bg-[#4ECDC4] scale-100' : 'scale-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('language')}
                                        className="w-1/3 bg-transparent border border-[#292F36]/10 text-[#292F36]/50 py-5 uppercase tracking-[0.25em] text-[10px] font-medium hover:border-[#292F36]/30 hover:text-[#292F36] transition-all duration-300"
                                    >
                                        {t('onboarding.step.back', 'Back')}
                                    </button>
                                    <button
                                        onClick={() => setStep('auth')}
                                        disabled={!role}
                                        className="group w-2/3 bg-[#292F36] text-white py-5 uppercase tracking-[0.25em] text-[10px] font-medium hover:bg-[#1a1f24] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                                    >
                                        <span className="relative z-10">{t('onboarding.step.continue', 'Continue')}</span>
                                        {role && <span className="absolute inset-0 bg-[#FF6B6B] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP: AUTH ── */}
                        {step === 'auth' && (
                            <div className="ed-fade-in">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-[#292F36]/30 font-medium mb-3">
                                    Step 03
                                </div>
                                <h3
                                    className="text-3xl md:text-4xl mb-2 font-semibold tracking-[-0.02em]"
                                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                                >
                                    {isSignUp ? t('hero.login.createAccount', 'Begin your journey') : t('hero.login.signIn', 'Welcome back')}
                                </h3>
                                <p className="text-[#292F36]/40 text-sm mb-10 font-light leading-relaxed">
                                    {isSignUp
                                        ? t('hero.editorial.authSubtext.signup', 'Create an account to save your progress.')
                                        : t('hero.editorial.authSubtext.signin', 'Enter your credentials to continue.')}
                                </p>

                                <div className="space-y-8 mb-10">
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder={t('hero.login.emailLabel', 'Email Address')}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-transparent border-b-[1.5px] border-[#292F36]/10 py-4 focus:outline-none focus:border-[#4ECDC4] transition-all duration-300 font-light placeholder-[#292F36]/25 tracking-wide"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder={t('hero.login.passwordLabel', 'Password')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-transparent border-b-[1.5px] border-[#292F36]/10 py-4 focus:outline-none focus:border-[#4ECDC4] transition-all duration-300 font-light placeholder-[#292F36]/25 tracking-wide"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); setStep('onboarding'); }}
                                    className="group w-full bg-[#FF6B6B] text-white py-5 uppercase tracking-[0.25em] text-[10px] font-medium hover:bg-[#ff5252] transition-all duration-300 mb-5 relative overflow-hidden"
                                >
                                    <span className="relative z-10">
                                        {isSignUp ? `${t('hero.login.createAccount', 'Sign Up')} (Demo)` : `${t('hero.login.signIn', 'Sign In')} (Demo)`}
                                    </span>
                                </button>

                                <div className="text-center mb-14">
                                    <button
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-[#292F36]/40 text-sm hover:text-[#FF6B6B] transition-colors duration-300 font-light"
                                    >
                                        {isSignUp ? t('user.login', 'Already have an account? Sign In') : t('user.signup', 'Need an account? Sign Up')}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={() => setStep('role')}
                                        className="text-[#292F36]/25 text-[10px] uppercase tracking-[0.25em] hover:text-[#292F36]/60 transition-colors duration-300 font-medium"
                                    >
                                        {t('onboarding.step.back', 'Go Back')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                PULL QUOTE — Transition to Philosophy
            ═══════════════════════════════════════════ */}
            <div className="relative z-10 bg-white">
                <AnimatedDivider color="rgba(41,47,54,0.08)" />
                <PullQuote
                    text={t('hero.editorial.pullQuote1', 'Love speaks every language.')}
                    attribution={t('hero.editorial.pullQuoteAttr1', 'Love Languages')}
                />
                <AnimatedDivider color="rgba(41,47,54,0.08)" />
            </div>

            {/* ═══════════════════════════════════════════
                CHAPTER I: THE PHILOSOPHY
            ═══════════════════════════════════════════ */}
            <section
                id="chapter-1"
                ref={setChapterRef(1)}
                className="relative z-10 py-32 md:py-48 px-8 md:px-16 lg:px-24 bg-[#FAFAF7]"
            >
                <div className="max-w-5xl mx-auto">
                    {/* Section header */}
                    <div className="text-center mb-24 md:mb-32">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="w-8 h-[1px] bg-[#4ECDC4]/40" />
                            <span className="text-[10px] uppercase tracking-[0.4em] text-[#4ECDC4] font-bold">
                                Chapter I
                            </span>
                            <span className="w-8 h-[1px] bg-[#4ECDC4]/40" />
                        </div>
                        <StaggeredText
                            as="h2"
                            text={t('hero.editorial.philosophy', 'The Philosophy')}
                            className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-[#292F36]"
                            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                        />
                    </div>

                    {/* Content sections with dramatic spacing */}
                    <div className="space-y-40 md:space-y-56">
                        {sectionsContent.map((section, i) => (
                            <PhilosophySection key={i} section={section} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                DECORATIVE ART BREAK
            ═══════════════════════════════════════════ */}
            <div className="relative z-10 bg-white">
                <EditorialArt variant={1} />
            </div>

            {/* ═══════════════════════════════════════════
                PULL QUOTE 2 — Transition to Showcase
            ═══════════════════════════════════════════ */}
            <div className="relative z-10 bg-white">
                <PullQuote
                    text={t('hero.editorial.pullQuote2', 'The most beautiful words are the ones you learn for someone else.')}
                />
            </div>

            {/* ═══════════════════════════════════════════
                DECORATIVE ART BREAK 2
            ═══════════════════════════════════════════ */}
            <div className="relative z-10 bg-white">
                <EditorialArt variant={2} />
            </div>

            {/* ═══════════════════════════════════════════
                CHAPTER II: IN PRACTICE (GAME SHOWCASE)
            ═══════════════════════════════════════════ */}
            <section
                id="chapter-2"
                ref={setChapterRef(2)}
                className="relative z-10 py-32 md:py-48 px-8 md:px-16 lg:px-24 bg-[#FAFAF7]"
            >
                <div className="max-w-6xl mx-auto">
                    {/* Section header */}
                    <div className="text-center mb-24">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="w-8 h-[1px] bg-[#FF6B6B]/40" />
                            <span className="text-[10px] uppercase tracking-[0.4em] text-[#FF6B6B] font-bold">
                                Chapter II
                            </span>
                            <span className="w-8 h-[1px] bg-[#FF6B6B]/40" />
                        </div>
                        <StaggeredText
                            as="h2"
                            text={t('hero.editorial.inPractice', 'In Practice')}
                            className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-[#292F36]"
                            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                        />
                    </div>

                    <EditorialGameShowcaseWrapper
                        isStudent={isStudent}
                        accentColor="#4ECDC4"
                        sectionIndex={4}
                        isMobile={false}
                        targetLanguage={targetLang}
                        nativeLanguage={nativeLang}
                    />
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                CHAPTER III: COMMUNITY (FAQ, RALL, BLOG)
            ═══════════════════════════════════════════ */}
            <section
                id="chapter-3"
                ref={setChapterRef(3)}
                className="relative z-10 bg-white"
            >
                <div className="max-w-5xl mx-auto px-8">
                    <AnimatedDivider color="rgba(41,47,54,0.06)" />
                </div>
                <EditorialFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <EditorialRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <EditorialBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </section>

            {/* ═══════════════════════════════════════════
                FINAL PULL QUOTE — Before Footer
            ═══════════════════════════════════════════ */}
            <div className="relative z-10 bg-[#FAFAF7]">
                <AnimatedDivider color="rgba(41,47,54,0.06)" />
                <PullQuote
                    text={t('hero.editorial.pullQuote3', 'Begin.')}
                />
            </div>

            {/* ═══════════════════════════════════════════
                CHAPTER IV: FOOTER
            ═══════════════════════════════════════════ */}
            <section
                id="chapter-4"
                ref={setChapterRef(4)}
                className="relative z-10"
            >
                <EditorialFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />
            </section>

            {/* ═══════════════════════════════════════════
                GLOBAL STYLES
            ═══════════════════════════════════════════ */}
            <style>{`
                /* Fade-in animation for form steps */
                .ed-fade-in {
                    animation: edFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes edFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Select dropdown custom arrow */
                .ed-fade-in select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23292F36' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0 center;
                    padding-right: 20px;
                }

                /* Smooth scroll for the whole page */
                html {
                    scroll-behavior: smooth;
                }

                /* Selection color matching brand */
                ::selection {
                    background: rgba(255, 107, 107, 0.15);
                    color: #292F36;
                }
            `}</style>
        </div>
    );
}
