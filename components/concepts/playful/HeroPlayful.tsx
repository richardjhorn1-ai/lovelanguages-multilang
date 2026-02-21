import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingPlayful from './OnboardingPlayful';
import { useTranslation } from 'react-i18next';
import { PlayfulFAQ, PlayfulRALL, PlayfulBlog, PlayfulFooter, PlayfulGameShowcaseWrapper } from './BelowFoldPlayful';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

// ─── Confetti Burst Component ───
// Explodes CSS particles from a button click position
function ConfettiBurst({ x, y, id }: { x: number; y: number; id: number }) {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9FF3', '#54A0FF', '#5F27CD'];
    const shapes = ['circle', 'square', 'triangle'];
    const particles = Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 360;
        const velocity = 60 + Math.random() * 120;
        const dx = Math.cos((angle * Math.PI) / 180) * velocity;
        const dy = Math.sin((angle * Math.PI) / 180) * velocity;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 10;
        const rotation = Math.random() * 720 - 360;
        const delay = Math.random() * 100;
        return { dx, dy, color, shape, size, rotation, delay, id: i };
    });

    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }} key={id}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute confetti-particle"
                    style={{
                        left: x,
                        top: y,
                        width: p.size,
                        height: p.shape === 'triangle' ? 0 : p.size,
                        backgroundColor: p.shape === 'triangle' ? 'transparent' : p.color,
                        borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
                        borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
                        borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
                        '--dx': `${p.dx}px`,
                        '--dy': `${p.dy}px`,
                        '--rot': `${p.rotation}deg`,
                        animationDelay: `${p.delay}ms`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

// ─── Floating Emoji Rain ───
// Love-themed emojis slowly drifting down the page like snow
function EmojiRain() {
    const emojis = ['💕', '💬', '🌍', '✨', '🎮', '💖', '🔥', '🎯', '💫', '🌈', '🎪', '🎨'];
    const particles = useRef(
        Array.from({ length: 18 }, (_, i) => ({
            emoji: emojis[i % emojis.length],
            left: Math.random() * 100,
            delay: Math.random() * 20,
            duration: 15 + Math.random() * 20,
            size: 16 + Math.random() * 20,
            wobbleAmp: 20 + Math.random() * 40,
            id: i,
        }))
    ).current;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute emoji-rain-particle"
                    style={{
                        left: `${p.left}%`,
                        top: '-40px',
                        fontSize: p.size,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        '--wobble-amp': `${p.wobbleAmp}px`,
                        opacity: 0.25,
                    } as React.CSSProperties}
                >
                    {p.emoji}
                </div>
            ))}
        </div>
    );
}

// ─── Animated Heart Mascot with Googly Eyes ───
// A CSS heart character that follows mouse position with its eyes
function HeartMascot({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
    const mascotRef = useRef<HTMLDivElement>(null);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [isBouncing, setIsBouncing] = useState(false);

    useEffect(() => {
        if (!mascotRef.current) return;
        const rect = mascotRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxOffset = 5;
        const factor = Math.min(dist / 300, 1);
        setEyeOffset({
            x: (dx / (dist || 1)) * maxOffset * factor,
            y: (dy / (dist || 1)) * maxOffset * factor,
        });
    }, [mouseX, mouseY]);

    // Random bounce every few seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIsBouncing(true);
            setTimeout(() => setIsBouncing(false), 600);
        }, 4000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={mascotRef}
            className={`absolute hidden md:block ${isBouncing ? 'mascot-bounce' : ''}`}
            style={{ bottom: '8%', right: '6%', zIndex: 5 }}
        >
            {/* Speech bubble */}
            <div className="absolute -top-16 -left-8 bg-white border-3 border-[#292F36] rounded-2xl px-3 py-1 text-sm font-black text-[#292F36] shadow-[3px_3px_0_#292F36] mascot-speech whitespace-nowrap" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                Let&apos;s learn! 💪
                <div className="absolute bottom-0 left-6 w-3 h-3 bg-white border-b-3 border-r-3 border-[#292F36] transform translate-y-1/2 rotate-45"></div>
            </div>
            {/* Heart body */}
            <div className="relative" style={{ width: 80, height: 74 }}>
                <div className="mascot-heart" style={{
                    width: 80,
                    height: 74,
                    position: 'relative',
                    filter: 'drop-shadow(4px 4px 0 #292F36)',
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: '#FF6B6B',
                        clipPath: 'path("M40 70 C40 70 0 45 0 20 C0 5 12 0 22 0 C30 0 36 5 40 12 C44 5 50 0 58 0 C68 0 80 5 80 20 C80 45 40 70 40 70Z")',
                    }} />
                    {/* Left eye */}
                    <div className="absolute" style={{ top: 22, left: 16, width: 18, height: 18 }}>
                        <div className="w-full h-full bg-white rounded-full border-2 border-[#292F36] relative overflow-hidden">
                            <div
                                className="absolute bg-[#292F36] rounded-full"
                                style={{
                                    width: 8,
                                    height: 8,
                                    top: `calc(50% - 4px + ${eyeOffset.y}px)`,
                                    left: `calc(50% - 4px + ${eyeOffset.x}px)`,
                                }}
                            />
                            {/* Eye shine */}
                            <div className="absolute bg-white rounded-full" style={{ width: 3, height: 3, top: 3, left: 10 }} />
                        </div>
                    </div>
                    {/* Right eye */}
                    <div className="absolute" style={{ top: 22, right: 16, width: 18, height: 18 }}>
                        <div className="w-full h-full bg-white rounded-full border-2 border-[#292F36] relative overflow-hidden">
                            <div
                                className="absolute bg-[#292F36] rounded-full"
                                style={{
                                    width: 8,
                                    height: 8,
                                    top: `calc(50% - 4px + ${eyeOffset.y}px)`,
                                    left: `calc(50% - 4px + ${eyeOffset.x}px)`,
                                }}
                            />
                            <div className="absolute bg-white rounded-full" style={{ width: 3, height: 3, top: 3, left: 10 }} />
                        </div>
                    </div>
                    {/* Mouth — smile */}
                    <div className="absolute" style={{ bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
                        <div style={{
                            width: 16,
                            height: 8,
                            borderBottom: '3px solid #292F36',
                            borderRadius: '0 0 10px 10px',
                        }} />
                    </div>
                    {/* Blush cheeks */}
                    <div className="absolute rounded-full" style={{ width: 10, height: 6, background: '#FF9999', opacity: 0.6, top: 34, left: 10 }} />
                    <div className="absolute rounded-full" style={{ width: 10, height: 6, background: '#FF9999', opacity: 0.6, top: 34, right: 10 }} />
                </div>
                {/* Little arms/hands waving */}
                <div className="absolute mascot-wave-left" style={{ top: 40, left: -12, fontSize: 18, transformOrigin: 'right center' }}>
                    👋
                </div>
            </div>
        </div>
    );
}

// ─── Sticker Label Component ───
function Sticker({ text, color, rotation, className = '' }: { text: string; color: string; rotation: string; className?: string }) {
    return (
        <div
            className={`absolute inline-block px-3 py-1 border-3 border-[#292F36] font-black text-sm uppercase shadow-[3px_3px_0_#292F36] sticker-pop select-none ${className}`}
            style={{
                background: color,
                transform: `rotate(${rotation})`,
                fontFamily: '"Quicksand", sans-serif',
                borderRadius: '4px 12px 4px 12px',
                zIndex: 10,
            }}
        >
            {text}
            {/* Tape effect */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-yellow-200/60 rounded-sm" style={{ transform: 'translateX(-50%) rotate(-3deg)' }} />
        </div>
    );
}

// ─── Sound Effect Text ("POW!", "ZAP!") ───
function SoundEffect({ text, color, className = '' }: { text: string; color: string; className?: string }) {
    return (
        <div
            className={`absolute font-black uppercase pointer-events-none select-none sound-effect-pop ${className}`}
            style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                color: color,
                WebkitTextStroke: '2px #292F36',
                textShadow: '3px 3px 0 #292F36',
                zIndex: 2,
            }}
        >
            {text}
        </div>
    );
}

// ─── Achievement Badge ───
function AchievementBadge({ icon, label, color, className = '' }: { icon: string; label: string; color: string; className?: string }) {
    return (
        <div className={`absolute achievement-float select-none pointer-events-none ${className}`} style={{ zIndex: 2 }}>
            <div className="flex items-center gap-2 bg-white border-3 border-[#292F36] rounded-full px-3 py-1.5 shadow-[4px_4px_0_#292F36]" style={{ opacity: 0.7 }}>
                <div className="w-8 h-8 rounded-full border-2 border-[#292F36] flex items-center justify-center text-lg" style={{ background: color }}>
                    {icon}
                </div>
                <span className="font-bold text-xs uppercase text-[#292F36] pr-1" style={{ fontFamily: '"Quicksand", sans-serif' }}>{label}</span>
            </div>
        </div>
    );
}

// ─── Scroll-reveal Hook ───
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

// ─── Passport Stamp Progress ───
function PassportProgress({ currentStep }: { currentStep: Step }) {
    const steps: Array<{ label: string; icon: string; step: Step }> = [
        { label: 'LANG', icon: '🌍', step: 'language' },
        { label: 'ROLE', icon: '🎭', step: 'role' },
        { label: 'GO!', icon: '🚀', step: 'auth' },
    ];
    const currentIndex = steps.findIndex((s) => s.step === currentStep);

    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => {
                const completed = i < currentIndex;
                const active = i === currentIndex;
                return (
                    <React.Fragment key={s.step}>
                        <div className={`relative ${active ? 'stamp-active' : ''}`}>
                            <div
                                className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                                    completed
                                        ? 'border-[#4ECDC4] bg-[#4ECDC4] stamp-complete scale-100'
                                        : active
                                        ? 'border-[#FF6B6B] bg-white scale-110 shadow-[3px_3px_0_#292F36]'
                                        : 'border-gray-300 bg-gray-100 scale-90 opacity-50'
                                }`}
                                style={{ borderColor: completed ? '#4ECDC4' : active ? '#FF6B6B' : undefined }}
                            >
                                {completed ? (
                                    <span className="text-2xl stamp-check">✓</span>
                                ) : (
                                    <span className="text-xl">{s.icon}</span>
                                )}
                            </div>
                            <div className={`text-center text-[10px] font-black mt-1 uppercase ${active ? 'text-[#FF6B6B]' : completed ? 'text-[#4ECDC4]' : 'text-gray-400'}`}>
                                {s.label}
                            </div>
                            {completed && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4ECDC4] border-2 border-[#292F36] rounded-full flex items-center justify-center stamp-badge">
                                    <span className="text-white text-[8px] font-black">✓</span>
                                </div>
                            )}
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-1 w-8 rounded-full transition-all duration-500 ${completed ? 'bg-[#4ECDC4]' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default function HeroPlayful() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [confettiBursts, setConfettiBursts] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const confettiId = useRef(0);

    const languages = Object.values(LANGUAGE_CONFIGS);

    // Track mouse for mascot eyes
    useEffect(() => {
        const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handler, { passive: true });
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    // Sync language selection with i18n
    useEffect(() => {
        i18n.changeLanguage(nativeLang);
    }, [nativeLang, i18n]);

    // Confetti launcher
    const launchConfetti = useCallback((e: React.MouseEvent) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const id = confettiId.current++;
        setConfettiBursts((prev) => [...prev, { x, y, id }]);
        setTimeout(() => {
            setConfettiBursts((prev) => prev.filter((b) => b.id !== id));
        }, 1200);
    }, []);

    // Scroll-reveal refs for sections
    const featuresReveal = useScrollReveal();
    const showcaseReveal = useScrollReveal();
    const card1Reveal = useScrollReveal();
    const card2Reveal = useScrollReveal();
    const card3Reveal = useScrollReveal();
    const cardReveals = [card1Reveal, card2Reveal, card3Reveal];

    if (step === 'onboarding') {
        return <OnboardingPlayful onComplete={() => alert('Demo Finished! Explore other concepts.')} />;
    }

    const isStudent = role !== 'tutor';

    const sectionsContent = [
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.copy`),
            color: '#FF6B6B',
            icon: '💬',
            rotation: '-rotate-2',
            bubbleTail: 'left',
            sticker: { text: 'FUN!', color: '#FFE66D', rotation: '-8deg' },
            soundFx: 'POW!',
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            color: '#4ECDC4',
            icon: '🎙️',
            rotation: 'rotate-2',
            bubbleTail: 'center',
            sticker: { text: 'NEW!', color: '#FF6B6B', rotation: '6deg' },
            soundFx: 'ZAP!',
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            color: '#FFE66D',
            icon: '🎮',
            rotation: '-rotate-1',
            bubbleTail: 'right',
            sticker: { text: 'FREE!', color: '#4ECDC4', rotation: '-5deg' },
            soundFx: 'BOOM!',
        },
    ];

    const handleStepChange = (nextStep: Step, e: React.MouseEvent) => {
        launchConfetti(e);
        // Small delay so confetti starts before transition
        setTimeout(() => setStep(nextStep), 80);
    };

    return (
        <div
            className="min-h-screen bg-[#F7FFF7] text-[#292F36] overflow-x-hidden relative"
            style={{ fontFamily: '"Outfit", sans-serif' }}
        >
            {/* Confetti bursts */}
            {confettiBursts.map((burst) => (
                <ConfettiBurst key={burst.id} x={burst.x} y={burst.y} id={burst.id} />
            ))}

            {/* Emoji rain background */}
            <EmojiRain />

            {/* Floating achievement badges */}
            <AchievementBadge icon="🔥" label="5-Day Streak!" color="#FFE66D" className="top-[15%] left-[3%] hidden lg:block" />
            <AchievementBadge icon="🎯" label="First Word!" color="#4ECDC4" className="top-[35%] right-[2%] hidden lg:block" />
            <AchievementBadge icon="💕" label="Love Level 5" color="#FF6B6B" className="top-[65%] left-[5%] hidden lg:block" />
            <AchievementBadge icon="🏆" label="Quiz Master" color="#FFE66D" className="top-[80%] right-[4%] hidden lg:block" />

            {/* ════════════════════ HERO SECTION ════════════════════ */}
            <section className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
                {/* Animated floating geometric shapes */}
                <div className="absolute top-10 left-10 w-16 h-16 bg-[#FF6B6B] border-4 border-[#292F36] rounded-full shadow-[4px_4px_0_#292F36] float-shape-1 pointer-events-none"></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-[#4ECDC4] border-4 border-[#292F36] rounded-xl shadow-[6px_6px_0_#292F36] rotate-12 float-shape-2 pointer-events-none"></div>
                <div className="absolute top-40 right-20 text-6xl drop-shadow-[2px_2px_0_#292F36] float-shape-3 pointer-events-none">✨</div>
                <div className="absolute bottom-40 left-20 w-12 h-12 bg-[#FFE66D] border-4 border-[#292F36] shadow-[4px_4px_0_#292F36] float-shape-4 pointer-events-none" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-[#FF9FF3] border-3 border-[#292F36] rounded-full float-shape-5 pointer-events-none hidden md:block"></div>

                {/* Sound effect text decorations */}
                <SoundEffect text="WOW!" color="#FFE66D" className="top-[12%] left-[8%] hidden md:block -rotate-12" />
                <SoundEffect text="YAY!" color="#FF6B6B" className="bottom-[15%] right-[8%] hidden md:block rotate-6" />

                {/* Sticker labels on the hero section */}
                <Sticker text="100% FREE!" color="#4ECDC4" rotation="-6deg" className="top-4 right-4 md:top-8 md:right-16 text-white" />

                <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 z-10 relative">
                    {/* ── Left Side: Brand Text ── */}
                    <div className="md:w-1/2 text-center md:text-left relative">
                        <div className="inline-block px-4 py-2 border-4 border-[#292F36] rounded-full bg-[#FFE66D] font-bold uppercase tracking-wider mb-6 shadow-[4px_4px_0_#292F36] wiggle-slow">
                            💖 {t('hero.shared.section0.subhead', 'Fun & Free Language Learning')}
                        </div>
                        <h1
                            className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 uppercase leading-none drop-shadow-[4px_4px_0_#FF6B6B] hero-title-entrance cursor-default"
                            style={{ fontFamily: '"Quicksand", sans-serif', WebkitTextStroke: '2px #292F36', color: 'white' }}
                        >
                            <span className="inline-block hover:animate-rubber-band">
                                {t('hero.student.section0.headline', 'Learn the Language of Love').replace('Language of Love', '').trim()}
                            </span>
                            <br />
                            <span className="text-[#FFE66D] drop-shadow-[4px_4px_0_#4ECDC4] inline-block hover:animate-rubber-band">
                                Together
                            </span>
                        </h1>

                        {/* Comic-book style subtitle bubble */}
                        <div className="relative inline-block">
                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 max-w-md mx-auto md:mx-0 bg-white p-4 border-4 border-[#292F36] rounded-2xl shadow-[6px_6px_0_#292F36] relative speech-bubble-wobble">
                                {t('hero.shared.section0.copy', 'The most fun way to learn your partner\'s language! 🚀')}
                            </p>
                            {/* Speech bubble tail */}
                            <div className="absolute -bottom-4 left-8 w-6 h-6 bg-white border-b-4 border-r-4 border-[#292F36] transform rotate-45 -translate-y-1"></div>
                        </div>

                        <div className="mt-8 flex justify-center md:justify-start">
                            <button
                                onClick={(e) => {
                                    launchConfetti(e);
                                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="bg-[#4ECDC4] border-4 border-[#292F36] text-[#292F36] font-black text-xl py-3 px-8 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36] wiggle-on-hover"
                            >
                                {t('hero.playful.seeHow', 'See How ↓')}
                            </button>
                        </div>
                    </div>

                    {/* ── Right Side: Interactive Card ── */}
                    <div className="md:w-1/2 w-full max-w-md">
                        <div className="bg-white border-4 border-[#292F36] rounded-3xl p-6 sm:p-8 shadow-[12px_12px_0_#292F36] relative overflow-hidden group hover:shadow-[14px_14px_0_#292F36] transition-shadow">
                            {/* Card corner decorations */}
                            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-6 bg-[#FFE66D] border-b-3 border-l-3 border-[#292F36] transform rotate-45 translate-x-6 -translate-y-1"></div>
                            </div>

                            {/* Passport Stamp Progress */}
                            <PassportProgress currentStep={step} />

                            <div className="relative min-h-[350px]">
                                {/* ── Step 1: Language Selection ── */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'language' ? 'opacity-100 translate-x-0 cursor-auto step-enter' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
                                    <h3 className="text-2xl sm:text-3xl font-black mb-6 uppercase text-[#292F36] text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {t('hero.shared.context0.header', 'Languages')} 🌍
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        {/* Native language selector */}
                                        <div className="bg-[#FFF0F3] border-4 border-[#292F36] rounded-2xl p-2 shadow-[4px_4px_0_#292F36] wiggle-on-hover">
                                            <label className="block text-sm font-bold uppercase px-2 py-1 text-[#FF6B6B]">
                                                {t('hero.languageSelector.nativePrompt', 'I speak')}
                                            </label>
                                            <select
                                                className="w-full bg-transparent p-2 text-lg sm:text-xl font-bold focus:outline-none appearance-none cursor-pointer"
                                                value={nativeLang}
                                                onChange={(e) => setNativeLang(e.target.value)}
                                            >
                                                {languages.map((l) => (
                                                    <option key={l.code} value={l.code}>
                                                        {l.flag} {l.nativeName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Swap arrow */}
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => {
                                                    const temp = nativeLang;
                                                    setNativeLang(targetLang);
                                                    setTargetLang(temp);
                                                }}
                                                className="w-10 h-10 bg-[#FFE66D] border-3 border-[#292F36] rounded-full flex items-center justify-center shadow-[3px_3px_0_#292F36] hover:-translate-y-1 hover:shadow-[3px_5px_0_#292F36] active:translate-y-0 active:shadow-[1px_1px_0_#292F36] transition-all text-xl font-black spin-on-click"
                                                title="Swap languages"
                                            >
                                                ↕
                                            </button>
                                        </div>

                                        {/* Target language selector */}
                                        <div className="bg-[#E7F5FF] border-4 border-[#292F36] rounded-2xl p-2 shadow-[4px_4px_0_#292F36] wiggle-on-hover">
                                            <label className="block text-sm font-bold uppercase px-2 py-1 text-[#4ECDC4]">
                                                {t('hero.languageSelector.targetPrompt', 'I want to learn')}
                                            </label>
                                            <select
                                                className="w-full bg-transparent p-2 text-lg sm:text-xl font-bold focus:outline-none appearance-none cursor-pointer"
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                            >
                                                {languages
                                                    .filter((l) => l.code !== nativeLang)
                                                    .map((l) => (
                                                        <option key={l.code} value={l.code}>
                                                            {l.flag} {l.nativeName}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleStepChange('role', e)}
                                        className="w-full bg-[#FF6B6B] border-4 border-[#292F36] text-white font-black text-xl sm:text-2xl py-4 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36] cta-pulse"
                                    >
                                        {t('onboarding.step.continue', "Let's Go!")} 🚀
                                    </button>
                                </div>

                                {/* ── Step 2: Role Selection ── */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'role' ? 'opacity-100 translate-x-0 step-enter' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                                    <h3 className="text-2xl sm:text-3xl font-black mb-6 uppercase text-[#292F36] text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {t('hero.student.context1.header', 'Choose Role')} 🎭
                                    </h3>

                                    <div className="flex gap-4 mb-8">
                                        <button
                                            onClick={() => setRole('student')}
                                            className={`flex-1 p-4 border-4 rounded-2xl transition-all shadow-[4px_4px_0_#292F36] wiggle-on-hover ${
                                                role === 'student'
                                                    ? 'border-[#292F36] bg-[#FF6B6B] text-white -translate-y-2 shadow-[6px_8px_0_#292F36] role-selected'
                                                    : 'border-[#292F36] bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="text-4xl mb-2 inline-block role-icon-bounce">🎓</div>
                                            <div className="font-black uppercase">{t('hero.toggle.learn')}</div>
                                            {role === 'student' && (
                                                <div className="mt-1 text-xs font-bold opacity-80">Selected!</div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setRole('tutor')}
                                            className={`flex-1 p-4 border-4 rounded-2xl transition-all shadow-[4px_4px_0_#292F36] wiggle-on-hover ${
                                                role === 'tutor'
                                                    ? 'border-[#292F36] bg-[#4ECDC4] text-[#292F36] -translate-y-2 shadow-[6px_8px_0_#292F36] role-selected'
                                                    : 'border-[#292F36] bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="text-4xl mb-2 inline-block role-icon-bounce">🧑‍🏫</div>
                                            <div className="font-black uppercase">{t('hero.toggle.teach')}</div>
                                            {role === 'tutor' && (
                                                <div className="mt-1 text-xs font-bold opacity-80">Selected!</div>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={(e) => handleStepChange('language', e)}
                                            className="w-16 h-16 bg-gray-200 border-4 border-[#292F36] rounded-2xl flex items-center justify-center font-bold text-xl shadow-[4px_4px_0_#292F36] hover:-translate-y-1 hover:shadow-[4px_6px_0_#292F36] active:translate-y-0 active:shadow-none transition-all"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                if (role) handleStepChange('auth', e);
                                            }}
                                            disabled={!role}
                                            className="flex-1 bg-[#FFE66D] border-4 border-[#292F36] text-[#292F36] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-[4px_4px_0_#ccc] font-black text-xl sm:text-2xl py-4 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36] cta-pulse"
                                        >
                                            {t('onboarding.step.continue', 'Next')} ⚡
                                        </button>
                                    </div>
                                </div>

                                {/* ── Step 3: Auth ── */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'auth' ? 'opacity-100 translate-x-0 step-enter' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                                    <h3 className="text-2xl sm:text-3xl font-black mb-6 uppercase text-[#292F36] text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')} 🔑
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <input
                                            type="email"
                                            placeholder={t('hero.login.emailLabel', 'EMAIL').toUpperCase()}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white border-4 border-[#292F36] rounded-2xl py-4 px-4 font-bold text-lg sm:text-xl placeholder-gray-400 focus:outline-none focus:bg-[#E7F5FF] focus:scale-[1.02] transition-all shadow-[4px_4px_0_#292F36]"
                                        />
                                        <input
                                            type="password"
                                            placeholder={t('hero.login.passwordLabel', 'PASSWORD').toUpperCase()}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white border-4 border-[#292F36] rounded-2xl py-4 px-4 font-bold text-lg sm:text-xl placeholder-gray-400 focus:outline-none focus:bg-[#FFF0F3] focus:scale-[1.02] transition-all shadow-[4px_4px_0_#292F36]"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={(e) => handleStepChange('role', e)}
                                            className="w-16 h-16 bg-gray-200 border-4 border-[#292F36] rounded-2xl flex items-center justify-center font-bold text-xl shadow-[4px_4px_0_#292F36] hover:-translate-y-1 hover:shadow-[4px_6px_0_#292F36] active:translate-y-0 active:shadow-none transition-all"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                launchConfetti(e);
                                                e.preventDefault();
                                                setTimeout(() => setStep('onboarding'), 300);
                                            }}
                                            className="flex-1 bg-[#4ECDC4] border-4 border-[#292F36] text-[#292F36] font-black text-xl sm:text-2xl py-4 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36] cta-pulse"
                                        >
                                            {isSignUp ? `${t('hero.login.createAccount')} 🎉` : `${t('hero.login.signIn')} 🎉`}
                                        </button>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">(Demo Mode)</span>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold underline text-[#292F36] hover:text-[#FF6B6B] transition-colors decoration-wavy underline-offset-4">
                                            {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Heart mascot */}
                <HeartMascot mouseX={mousePos.x} mouseY={mousePos.y} />
            </section>

            {/* ════════════════════ FEATURES (Comic Book Speech Bubbles) ════════════════════ */}
            <section
                id="features"
                ref={featuresReveal.ref}
                className="py-24 px-6 bg-[#FFE66D] border-y-8 border-[#292F36] relative overflow-hidden"
            >
                {/* Halftone dots background */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(#292F36 1.5px, transparent 1.5px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.06,
                }} />

                {/* Large decorative circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF6B6B] rounded-full mix-blend-overlay opacity-30 translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-6xl mx-auto relative">
                    <h2
                        className={`text-5xl md:text-7xl font-black uppercase text-center mb-20 text-white transition-all duration-700 ${
                            featuresReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                        }`}
                        style={{
                            fontFamily: '"Quicksand", sans-serif',
                            WebkitTextStroke: '2px #292F36',
                            textShadow: '4px 4px 0 #292F36',
                        }}
                    >
                        {t('hero.playful.whyItRules', 'Why It Rules')} 🤘
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {sectionsContent.map((section, i) => (
                            <div
                                key={i}
                                ref={cardReveals[i].ref}
                                className={`relative transition-all duration-700 ${
                                    cardReveals[i].isVisible
                                        ? 'opacity-100 translate-y-0 scale-100'
                                        : 'opacity-0 translate-y-16 scale-95'
                                }`}
                                style={{
                                    transitionDelay: `${i * 150}ms`,
                                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                                }}
                            >
                                {/* Sound effect text */}
                                <SoundEffect
                                    text={section.soundFx}
                                    color={section.color}
                                    className={`-top-8 ${i === 0 ? '-left-4' : i === 1 ? 'left-1/2 -translate-x-1/2' : '-right-4'} text-2xl`}
                                />

                                {/* Sticker */}
                                <Sticker
                                    text={section.sticker.text}
                                    color={section.sticker.color}
                                    rotation={section.sticker.rotation}
                                    className={`-top-4 ${i === 0 ? '-right-2' : i === 1 ? '-left-2' : '-right-2'} text-white`}
                                />

                                {/* Speech bubble card */}
                                <div
                                    className={`bg-white border-4 border-[#292F36] rounded-3xl p-8 transform ${section.rotation} hover:rotate-0 hover:scale-105 transition-all shadow-[12px_12px_0_#292F36] group relative wiggle-on-hover`}
                                >
                                    {/* Icon badge */}
                                    <div
                                        className="w-24 h-24 rounded-2xl border-4 border-[#292F36] flex items-center justify-center text-5xl mb-6 shadow-[6px_6px_0_#292F36] mx-auto group-hover:-translate-y-4 group-hover:rotate-6 transition-all bg-white icon-bounce"
                                        style={{ backgroundColor: section.color }}
                                    >
                                        <span className={i === 2 ? 'text-[#292F36]' : 'text-white'}>{section.icon}</span>
                                    </div>
                                    <h3
                                        className="text-2xl sm:text-3xl font-black mb-4 uppercase text-center"
                                        style={{ fontFamily: '"Quicksand", sans-serif' }}
                                    >
                                        {section.headline}
                                    </h3>
                                    <p className="text-lg sm:text-xl font-bold text-gray-600 text-center leading-relaxed">
                                        {section.copy}
                                    </p>

                                    {/* Speech bubble tail */}
                                    <div
                                        className="absolute -bottom-5 w-8 h-8 bg-white border-b-4 border-r-4 border-[#292F36] transform rotate-45"
                                        style={{
                                            left: section.bubbleTail === 'left' ? '20%' : section.bubbleTail === 'right' ? '70%' : '45%',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════ GAME SHOWCASE ════════════════════ */}
            <section
                ref={showcaseReveal.ref}
                className="py-24 px-6 bg-[#F7FFF7] relative overflow-hidden"
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#292F36 2px, transparent 2px)',
                        backgroundSize: '30px 30px',
                        opacity: 0.05,
                    }}
                />
                <div className="max-w-6xl mx-auto relative z-10">
                    <h2
                        className={`text-4xl md:text-6xl font-black uppercase text-center mb-8 transition-all duration-700 ${
                            showcaseReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                        }`}
                        style={{
                            fontFamily: '"Quicksand", sans-serif',
                            textShadow: '3px 3px 0 #FF6B6B',
                        }}
                    >
                        {t('hero.playful.flashOn', 'Get Your Flash On!')}
                    </h2>
                    <div className={`transition-all duration-700 ${
                        showcaseReveal.isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'
                    }`} style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <PlayfulGameShowcaseWrapper
                            isStudent={isStudent}
                            accentColor="#FF6B6B"
                            sectionIndex={4}
                            isMobile={false}
                            targetLanguage={targetLang}
                            nativeLanguage={nativeLang}
                        />
                    </div>
                </div>
            </section>

            {/* ════════════════════ BOTTOM SECTIONS ════════════════════ */}
            <div className="border-t-8 border-[#292F36] bg-white">
                <PlayfulFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <PlayfulRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <PlayfulBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <PlayfulFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />

            {/* ════════════════════ MEGA STYLESHEET ════════════════════ */}
            <style>{`
                /* ═══════════ CONFETTI PARTICLES ═══════════ */
                .confetti-particle {
                    animation: confetti-burst 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                    will-change: transform, opacity;
                }
                @keyframes confetti-burst {
                    0% {
                        transform: translate(0, 0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0);
                        opacity: 0;
                    }
                }

                /* ═══════════ EMOJI RAIN ═══════════ */
                .emoji-rain-particle {
                    animation: emoji-fall linear infinite;
                    will-change: transform;
                }
                @keyframes emoji-fall {
                    0% {
                        transform: translateY(0) translateX(0) rotate(0deg);
                        opacity: 0;
                    }
                    5% {
                        opacity: 0.25;
                    }
                    50% {
                        transform: translateY(50vh) translateX(var(--wobble-amp)) rotate(180deg);
                    }
                    95% {
                        opacity: 0.25;
                    }
                    100% {
                        transform: translateY(100vh) translateX(calc(var(--wobble-amp) * -1)) rotate(360deg);
                        opacity: 0;
                    }
                }

                /* ═══════════ FLOATING SHAPES (improved) ═══════════ */
                .float-shape-1 {
                    animation: float-bounce 4s ease-in-out infinite;
                }
                .float-shape-2 {
                    animation: float-spin 6s ease-in-out infinite;
                }
                .float-shape-3 {
                    animation: float-twinkle 3s ease-in-out infinite;
                }
                .float-shape-4 {
                    animation: float-bounce 5s ease-in-out infinite reverse;
                }
                .float-shape-5 {
                    animation: float-orbit 8s linear infinite;
                }
                @keyframes float-bounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-20px) rotate(5deg); }
                    50% { transform: translateY(-8px) rotate(-3deg); }
                    75% { transform: translateY(-25px) rotate(2deg); }
                }
                @keyframes float-spin {
                    0%, 100% { transform: rotate(12deg) scale(1); }
                    50% { transform: rotate(-5deg) scale(1.05); }
                }
                @keyframes float-twinkle {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    50% { transform: scale(1.3) rotate(15deg); opacity: 0.7; }
                }
                @keyframes float-orbit {
                    0% { transform: translateX(0) translateY(0); }
                    25% { transform: translateX(15px) translateY(-10px); }
                    50% { transform: translateX(0) translateY(-20px); }
                    75% { transform: translateX(-15px) translateY(-10px); }
                    100% { transform: translateX(0) translateY(0); }
                }

                /* ═══════════ WIGGLE ON HOVER ═══════════ */
                .wiggle-on-hover {
                    transition: transform 0.3s ease;
                }
                .wiggle-on-hover:hover {
                    animation: wiggle 0.4s ease-in-out;
                }
                @keyframes wiggle {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-2deg); }
                    50% { transform: rotate(2deg); }
                    75% { transform: rotate(-1deg); }
                    100% { transform: rotate(0deg); }
                }

                /* Slow continuous wiggle for badges */
                .wiggle-slow {
                    animation: wiggle-slow 3s ease-in-out infinite;
                }
                @keyframes wiggle-slow {
                    0%, 100% { transform: rotate(-1deg); }
                    50% { transform: rotate(1deg); }
                }

                /* ═══════════ RUBBER BAND (title hover) ═══════════ */
                .hover\\:animate-rubber-band:hover {
                    animation: rubber-band 0.8s ease;
                }
                @keyframes rubber-band {
                    0% { transform: scaleX(1) scaleY(1); }
                    30% { transform: scaleX(1.25) scaleY(0.75); }
                    40% { transform: scaleX(0.75) scaleY(1.25); }
                    50% { transform: scaleX(1.15) scaleY(0.85); }
                    65% { transform: scaleX(0.95) scaleY(1.05); }
                    75% { transform: scaleX(1.05) scaleY(0.95); }
                    100% { transform: scaleX(1) scaleY(1); }
                }

                /* ═══════════ HERO TITLE ENTRANCE ═══════════ */
                .hero-title-entrance {
                    animation: title-drop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }
                @keyframes title-drop {
                    0% { transform: translateY(-40px) scale(0.8) rotate(-3deg); opacity: 0; }
                    60% { transform: translateY(5px) scale(1.02) rotate(1deg); opacity: 1; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }

                /* ═══════════ SPEECH BUBBLE WOBBLE ═══════════ */
                .speech-bubble-wobble {
                    animation: bubble-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
                }
                @keyframes bubble-pop {
                    0% { transform: scale(0.7); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }

                /* ═══════════ STEP ENTER ANIMATION ═══════════ */
                .step-enter {
                    animation: step-spring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }
                @keyframes step-spring {
                    0% { transform: translateY(20px) scale(0.95); opacity: 0; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }

                /* ═══════════ CTA PULSE (attention-grabbing) ═══════════ */
                .cta-pulse {
                    animation: cta-glow 2s ease-in-out infinite;
                }
                @keyframes cta-glow {
                    0%, 100% { box-shadow: 6px 6px 0 #292F36; }
                    50% { box-shadow: 6px 6px 0 #292F36, 0 0 20px rgba(255, 107, 107, 0.3); }
                }

                /* ═══════════ STICKER POP ═══════════ */
                .sticker-pop {
                    animation: sticker-slam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                    animation-delay: 0.5s;
                }
                @keyframes sticker-slam {
                    0% { transform: rotate(var(--rot, -6deg)) scale(0) translateY(-20px); opacity: 0; }
                    70% { transform: rotate(var(--rot, -6deg)) scale(1.2); opacity: 1; }
                    100% { transform: rotate(var(--rot, -6deg)) scale(1); opacity: 1; }
                }

                /* ═══════════ SOUND EFFECT POP ═══════════ */
                .sound-effect-pop {
                    animation: sfx-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                    animation-delay: 0.8s;
                }
                @keyframes sfx-pop {
                    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                    70% { transform: scale(1.3) rotate(3deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
                }

                /* ═══════════ ACHIEVEMENT BADGE FLOAT ═══════════ */
                .achievement-float {
                    animation: badge-float 6s ease-in-out infinite;
                }
                .achievement-float:nth-child(2) { animation-delay: -1.5s; }
                .achievement-float:nth-child(3) { animation-delay: -3s; }
                .achievement-float:nth-child(4) { animation-delay: -4.5s; }
                @keyframes badge-float {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    33% { transform: translateY(-12px) rotate(1deg); }
                    66% { transform: translateY(-5px) rotate(-1deg); }
                }

                /* ═══════════ ROLE SELECTION ═══════════ */
                .role-selected {
                    animation: role-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes role-pop {
                    0% { transform: translateY(0) scale(1); }
                    40% { transform: translateY(-12px) scale(1.08); }
                    100% { transform: translateY(-8px) scale(1); }
                }

                .role-icon-bounce {
                    animation: icon-bounce 2s ease-in-out infinite;
                }
                @keyframes icon-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }

                /* ═══════════ ICON BOUNCE (feature cards) ═══════════ */
                .icon-bounce {
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                /* ═══════════ PASSPORT STAMP ═══════════ */
                .stamp-complete {
                    animation: stamp-slam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes stamp-slam {
                    0% { transform: scale(1.5) rotate(10deg); opacity: 0; }
                    60% { transform: scale(0.9) rotate(-3deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .stamp-active {
                    animation: stamp-pulse 1.5s ease-in-out infinite;
                }
                @keyframes stamp-pulse {
                    0%, 100% { transform: scale(1.1); }
                    50% { transform: scale(1.15); }
                }
                .stamp-check {
                    color: white;
                    font-weight: 900;
                    text-shadow: 1px 1px 0 #292F36;
                }
                .stamp-badge {
                    animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes badge-pop {
                    0% { transform: scale(0); }
                    100% { transform: scale(1); }
                }

                /* ═══════════ MASCOT ═══════════ */
                .mascot-bounce {
                    animation: mascot-boing 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes mascot-boing {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    30% { transform: translateY(-20px) rotate(-5deg); }
                    60% { transform: translateY(-5px) rotate(3deg); }
                }
                .mascot-wave-left {
                    animation: wave-hand 2s ease-in-out infinite;
                    animation-delay: 1s;
                }
                @keyframes wave-hand {
                    0%, 60%, 100% { transform: rotate(0deg); }
                    10%, 30% { transform: rotate(20deg); }
                    20% { transform: rotate(-5deg); }
                }
                .mascot-speech {
                    animation: speech-fade 4s ease-in-out infinite;
                }
                @keyframes speech-fade {
                    0%, 80%, 100% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 0; transform: translateY(-5px); }
                }
                .mascot-heart {
                    animation: heart-beat 1.5s ease-in-out infinite;
                }
                @keyframes heart-beat {
                    0%, 100% { transform: scale(1); }
                    15% { transform: scale(1.1); }
                    30% { transform: scale(1); }
                    45% { transform: scale(1.05); }
                    60% { transform: scale(1); }
                }

                /* ═══════════ SPIN ON CLICK (swap button) ═══════════ */
                .spin-on-click:active {
                    animation: quick-spin 0.4s ease-out;
                }
                @keyframes quick-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(180deg); }
                }

                /* ═══════════ RESPONSIVE POLISH ═══════════ */
                @media (max-width: 640px) {
                    .emoji-rain-particle { opacity: 0.15 !important; }
                    .sound-effect-pop { font-size: 1.2rem !important; }
                    .sticker-pop { font-size: 0.7rem !important; }
                }

                /* ═══════════ REDUCED MOTION ═══════════ */
                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                    .emoji-rain-particle { display: none !important; }
                    .confetti-particle { display: none !important; }
                }
            `}</style>
        </div>
    );
}
