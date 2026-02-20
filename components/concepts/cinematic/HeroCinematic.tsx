import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingCinematic from './OnboardingCinematic';
import { useTranslation } from 'react-i18next';
import { HeroFAQ, HeroRALL, HeroBlog, HeroFooter, GameShowcase } from '../../hero/index';
import { ICONS } from '../../../constants';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

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

    // Inject Font & Handle Mouse for Glow
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Sync language selection with i18n for the demonstration
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
            glow: 'rgba(255,107,107,0.2)'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            color: 'from-[#4ECDC4] to-transparent',
            glow: 'rgba(78,205,196,0.2)'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            color: 'from-[#FFE66D] to-transparent',
            glow: 'rgba(255,230,109,0.2)'
        }
    ];

    return (
        <div
            className="bg-[#111316] text-white flex flex-col relative overflow-hidden"
            style={{ fontFamily: '"Outfit", sans-serif' }}
        >
            {/* Dynamic atmospheric glow tracking mouse using brand colors */}
            <div
                className="fixed pointer-events-none rounded-full blur-[140px] opacity-20 transition-all duration-1000 ease-out z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(255,107,107,0.7) 0%, rgba(78,205,196,0.3) 100%)',
                    width: '600px',
                    height: '600px',
                    left: mousePos.x - 300,
                    top: mousePos.y - 300,
                }}
            />

            {/* HERO SECTION */}
            <section className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 border-b border-white/5">
                <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24">
                    {/* Left Side: Dramatic Typography */}
                    <div className="md:w-1/2 text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[#FFE66D] text-xs tracking-widest uppercase mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(255,230,109,0.2)]">
                            {t('hero.shared.section0.subhead', 'The language learning app for couples')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            {t('hero.student.section0.headline', 'Learn the Language of Love').split(' ').map((word, i, arr) => {
                                const targetWord = t('hero.student.section0.highlight1', 'Language');
                                if (word.includes(targetWord) || targetWord.includes(word)) {
                                    return (
                                        <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] pb-2">
                                            {word}{' '}
                                        </span>
                                    );
                                }
                                return word + ' ';
                            })}
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl font-light leading-relaxed max-w-md mx-auto md:mx-0">
                            {t('hero.shared.section0.copy', 'Connect deeper with your partner by learning their native tongue. Shared vocabulary, shared intimacy.')}
                        </p>
                    </div>

                    {/* Right Side: Glassmorphism Floating Form */}
                    <div className="md:w-1/2 w-full max-w-md relative group">
                        {/* Interactive Aura around the form */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B6B] via-[#4ECDC4] to-[#FFE66D] rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative bg-[#1A1D21]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">

                            {/* Minimal Progress Dots */}
                            <div className="flex justify-center gap-3 mb-12">
                                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${step === 'language' ? 'bg-[#FF6B6B] scale-150 shadow-[0_0_10px_rgba(255,107,107,0.8)]' : 'bg-white/20'}`}></div>
                                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${step === 'role' ? 'bg-[#FFE66D] scale-150 shadow-[0_0_10px_rgba(255,230,109,0.8)]' : 'bg-white/20'}`}></div>
                                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${step === 'auth' ? 'bg-[#4ECDC4] scale-150 shadow-[0_0_10px_rgba(78,205,196,0.8)]' : 'bg-white/20'}`}></div>
                            </div>

                            <div className="relative min-h-[320px]">

                                {/* Step 1: Language */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'language' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 absolute -z-10 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>Select Languages</h3>

                                    <div className="space-y-6 mb-8">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">My Native Language</label>
                                            <select
                                                className="w-full bg-[#111316] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B] transition-all text-white appearance-none relative z-10"
                                                value={nativeLang}
                                                onChange={(e) => setNativeLang(e.target.value)}
                                            >
                                                {languages.map(l => <option key={l.code} value={l.code} className="bg-[#111316]">{l.nativeName} ({l.flag})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Target Language</label>
                                            <select
                                                className="w-full bg-[#111316] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#4ECDC4] transition-all text-white appearance-none relative z-10"
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                            >
                                                {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code} className="bg-[#111316]">{l.nativeName} ({l.flag})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep('role')}
                                        className="w-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-[#FF6B6B]/20 active:scale-[0.98]"
                                    >
                                        Continue
                                    </button>
                                </div>

                                {/* Step 2: Role */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'role' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 absolute -z-10 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>Your Role</h3>

                                    <div className="flex flex-col gap-4 mb-8">
                                        <button
                                            onClick={() => setRole('student')}
                                            className={`p-5 rounded-2xl border transition-all text-left ${role === 'student' ? 'bg-[#FF6B6B]/10 border-[#FF6B6B]/50 shadow-[0_0_20px_rgba(255,107,107,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                            <h4 className="font-semibold text-lg mb-1" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.learn', 'The Student')}</h4>
                                            <p className="text-sm text-gray-400">I am here to learn my partner's language.</p>
                                        </button>
                                        <button
                                            onClick={() => setRole('tutor')}
                                            className={`p-5 rounded-2xl border transition-all text-left ${role === 'tutor' ? 'bg-[#4ECDC4]/10 border-[#4ECDC4]/50 shadow-[0_0_20px_rgba(78,205,196,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                            <h4 className="font-semibold text-lg mb-1" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.teach', 'The Guide')}</h4>
                                            <p className="text-sm text-gray-400">I am here to help my partner learn.</p>
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep('language')}
                                            className="w-1/3 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-4 rounded-xl transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => setStep('auth')}
                                            disabled={!role}
                                            className="w-2/3 bg-[#FFE66D] hover:bg-[#f5dd65] disabled:opacity-30 disabled:bg-[#FFE66D] text-[#292F36] font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#FFE66D]/20"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>

                                {/* Step 3: Auth */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'auth' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-4 absolute -z-10 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
                                    <p className="text-center text-gray-400 text-sm mb-8">Securely sync your progress across devices.</p>

                                    <div className="space-y-4 mb-8">
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#111316] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#4ECDC4] transition-all text-white placeholder-gray-500 relative z-10"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-[#111316] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#4ECDC4] focus:ring-1 focus:ring-[#4ECDC4] transition-all text-white placeholder-gray-500 relative z-10"
                                        />
                                    </div>

                                    <button
                                        onClick={(e) => { e.preventDefault(); setStep('onboarding'); }}
                                        className="w-full bg-[#4ECDC4] text-[#1A1D21] hover:bg-[#43b8b0] font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(78,205,196,0.3)] active:scale-[0.98] mb-4 relative z-10"
                                    >
                                        {isSignUp ? 'Sign Up (Demo)' : 'Sign In (Demo)'}
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
                                            &larr; Go Back
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* CINEMATIC CONTENT SECTIONS */}
            <section className="relative z-10 bg-[#111316] py-32 px-6">
                <div className="max-w-6xl mx-auto space-y-32">
                    {sectionsContent.map((section, i) => (
                        <div key={i} className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                            <div className="flex-1 relative group w-full">
                                {/* Cinematic glowing card effect */}
                                <div className={`absolute -inset-1 bg-gradient-to-r ${section.color} rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
                                <div className="relative bg-[#1A1D21] border border-white/5 rounded-3xl p-10 md:p-16 overflow-hidden min-h-[300px] flex flex-col justify-center">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${section.color} opacity-50"></div>
                                    <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white/90" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {section.headline}
                                    </h3>
                                    <p className="text-lg text-gray-400 font-light leading-relaxed">
                                        {section.copy}
                                    </p>
                                </div>
                            </div>
                            <div className="md:w-1/3 text-center opacity-10">
                                <span className="text-[12rem] font-bold" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    0{i + 1}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SHOWCASE SECTION */}
            <section className="relative z-10 py-32 px-6 border-y border-white/5 bg-[#1A1D21]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="max-w-6xl mx-auto relative z-20 cinematic-overrides">
                    <GameShowcase
                        isStudent={isStudent}
                        accentColor="#4ECDC4"
                        sectionIndex={4}
                        isMobile={false}
                        targetLanguage={targetLang}
                        nativeLanguage={nativeLang}
                    />
                </div>
            </section>

            {/* 4. ORIGINAL APP FOOTER COMPONENTS */}
            <div className="relative z-10 bg-[#111316] cinematic-overrides">
                <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <div className="relative z-10 cinematic-overrides">
                <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />
            </div>

            <style>{`
                /* Override the imported original components to match cinematic dark theme */
                .cinematic-overrides section {
                    background-color: transparent !important;
                    color: white !important;
                }
                .cinematic-overrides h2, .cinematic-overrides h3, .cinematic-overrides h4 {
                    color: white !important;
                }
                .cinematic-overrides p {
                    color: #9CA3AF !important; /* text-gray-400 */
                }
                .cinematic-overrides .bg-white {
                    background-color: #1A1D21 !important;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .cinematic-overrides .text-gray-900, .cinematic-overrides .text-gray-800 {
                    color: white !important;
                }
                .cinematic-overrides .text-gray-600, .cinematic-overrides .text-gray-700 {
                    color: #9CA3AF !important;
                }
                .cinematic-overrides .border-gray-100, .cinematic-overrides .border-gray-200 {
                    border-color: rgba(255,255,255,0.1) !important;
                }
            `}</style>
        </div>
    );
}
