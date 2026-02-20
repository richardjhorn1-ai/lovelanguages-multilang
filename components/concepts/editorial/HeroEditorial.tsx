import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingEditorial from './OnboardingEditorial';
import { useTranslation } from 'react-i18next';
import { HeroFAQ, HeroRALL, HeroBlog, HeroFooter, GameShowcase } from '../../hero/index';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

export default function HeroEditorial() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('fr');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Inject Font
    useEffect(() => {
        const id = 'font-editorial-revised';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400..700&family=Outfit:wght@300;400;500;700&display=swap');`;
            document.head.appendChild(style);
        }
    }, []);

    // Sync language selection with i18n for the demonstration
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
            number: '01'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            number: '02'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            number: '03'
        }
    ];

    return (
        <div className="bg-[#F7FFF7] overflow-x-hidden" style={{ fontFamily: '"Outfit", sans-serif', color: '#292F36' }}>

            {/* HERO SECTION */}
            <div className="min-h-screen flex flex-col md:flex-row">
                {/* Left Side: Editorial Typography */}
                <div className="md:w-3/5 p-8 md:p-20 flex flex-col justify-center relative border-r border-[#4ECDC4]/20">
                    <div className="absolute top-8 left-8 md:top-12 md:left-12 font-semibold uppercase tracking-widest text-xs text-[#FF6B6B]">
                        Vol. III — {t('hero.shared.section0.subhead', 'The language learning app for couples.')}
                    </div>

                    <div className="max-w-2xl mt-12 md:mt-0">
                        <h2 className="text-sm uppercase tracking-[0.3em] text-[#4ECDC4] mb-6 font-bold">Love Languages</h2>
                        <h1 className="text-6xl md:text-8xl leading-none mb-8 font-bold text-[#292F36] tracking-tight" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            {t('hero.student.section0.headline', 'Learn the Language of Love').split(' ').map((word, i, arr) => {
                                const targetWord = t('hero.student.section0.highlight1', 'Language');
                                if (word.includes(targetWord) || targetWord.includes(word)) {
                                    return (
                                        <span key={i} className="italic text-[#FF6B6B] font-light">
                                            {word.toLowerCase()}<br />
                                        </span>
                                    );
                                }
                                return word + ' ';
                            })}
                        </h1>
                        <p className="text-xl font-light text-gray-600 leading-relaxed max-w-lg mb-12">
                            {t('hero.shared.section0.copy', 'Connect deeper with your partner by learning their native tongue. Shared vocabulary, shared intimacy.')}
                        </p>

                        <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                            <span className="w-12 h-[1px] bg-gray-300"></span>
                            <span className="cursor-pointer hover:text-[#FF6B6B] transition-colors" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
                                Read the Manifesto ↓
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Flow */}
                <div className="md:w-2/5 p-8 md:p-20 flex flex-col justify-center bg-white relative border-b md:border-b-0 border-[#4ECDC4]/20">
                    <div className="max-w-md mx-auto w-full transition-all duration-500 ease-in-out">

                        {/* Progress Indicator */}
                        <div className="flex gap-2 mb-16">
                            <div className={`h-[1px] flex-1 ${step === 'language' ? 'bg-[#FF6B6B]' : 'bg-gray-200'}`}></div>
                            <div className={`h-[1px] flex-1 ${(step === 'role' || step === 'auth') ? 'bg-[#FF6B6B]' : 'bg-gray-200'}`}></div>
                            <div className={`h-[1px] flex-1 ${step === 'auth' ? 'bg-[#FF6B6B]' : 'bg-gray-200'}`}></div>
                        </div>

                        {step === 'language' && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl mb-8 font-bold" style={{ fontFamily: '"Quicksand", sans-serif' }}>Select your languages</h3>

                                <div className="mb-8">
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">I speak</label>
                                    <select
                                        className="w-full bg-transparent border-b border-gray-200 py-3 focus:outline-none focus:border-[#4ECDC4] transition-colors text-lg"
                                        value={nativeLang}
                                        onChange={(e) => setNativeLang(e.target.value)}
                                    >
                                        {languages.map(l => <option key={l.code} value={l.code}>{l.nativeName} ({l.flag})</option>)}
                                    </select>
                                </div>

                                <div className="mb-12">
                                    <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">I want to learn</label>
                                    <select
                                        className="w-full bg-transparent border-b border-gray-200 py-3 focus:outline-none focus:border-[#FF6B6B] transition-colors text-lg"
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                    >
                                        {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code}>{l.nativeName} ({l.flag})</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setStep('role')}
                                    className="w-full bg-[#292F36] text-white py-4 uppercase tracking-[0.2em] text-xs hover:bg-black transition"
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {step === 'role' && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl mb-8 font-bold" style={{ fontFamily: '"Quicksand", sans-serif' }}>Define your role</h3>

                                <div className="space-y-4 mb-12">
                                    <button
                                        onClick={() => setRole('student')}
                                        className={`w-full text-left p-6 border transition-all ${role === 'student' ? 'border-[#FF6B6B] bg-[#FFF0F3]' : 'border-gray-200 hover:border-[#FF6B6B]/50'}`}
                                    >
                                        <h4 className="text-xl mb-2 font-bold" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.learn', 'The Student')}</h4>
                                        <p className="text-gray-500 text-sm font-light">I want to learn my partner's language.</p>
                                    </button>

                                    <button
                                        onClick={() => setRole('tutor')}
                                        className={`w-full text-left p-6 border transition-all ${role === 'tutor' ? 'border-[#4ECDC4] bg-[#E7F5FF]' : 'border-gray-200 hover:border-[#4ECDC4]/50'}`}
                                    >
                                        <h4 className="text-xl mb-2 font-bold" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.teach', 'The Guide')}</h4>
                                        <p className="text-gray-500 text-sm font-light">I want to help my partner learn my language.</p>
                                    </button>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('language')}
                                        className="w-1/3 bg-transparent border border-gray-300 text-gray-600 py-4 uppercase tracking-[0.2em] text-xs hover:bg-gray-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep('auth')}
                                        disabled={!role}
                                        className="w-2/3 bg-[#292F36] text-white py-4 uppercase tracking-[0.2em] text-xs hover:bg-black transition disabled:opacity-50 disabled:hover:bg-[#292F36]"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'auth' && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl mb-2 font-bold" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    {isSignUp ? 'Begin your journey' : 'Welcome back'}
                                </h3>
                                <p className="text-gray-500 text-sm mb-8 font-light">
                                    {isSignUp ? 'Create an account to save your progress.' : 'Enter your credentials to continue.'}
                                </p>

                                <div className="space-y-6 mb-8">
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-200 py-3 focus:outline-none focus:border-[#4ECDC4] transition-colors font-light placeholder-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-200 py-3 focus:outline-none focus:border-[#4ECDC4] transition-colors font-light placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); setStep('onboarding'); }}
                                    className="w-full bg-[#FF6B6B] text-white py-4 uppercase tracking-[0.2em] text-xs hover:bg-[#ff5252] transition mb-4"
                                >
                                    {isSignUp ? 'Sign Up (Demo)' : 'Sign In (Demo)'}
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-gray-500 text-sm hover:text-[#FF6B6B] transition font-light"
                                    >
                                        {isSignUp ? t('user.login', 'Already have an account? Sign In') : t('user.signup', 'Need an account? Sign Up')}
                                    </button>
                                </div>

                                <div className="mt-12 text-center">
                                    <button
                                        onClick={() => setStep('role')}
                                        className="text-gray-400 text-xs uppercase tracking-widest hover:text-[#292F36] transition"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* EDITORIAL CONTENT SECTIONS */}
            <section className="py-32 px-8 md:px-20 bg-white border-t border-[#4ECDC4]/20">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm uppercase tracking-[0.3em] text-[#4ECDC4] mb-16 font-bold text-center">The Philosophy</h2>

                    <div className="space-y-32">
                        {sectionsContent.map((section, i) => (
                            <div key={i} className={`flex flex-col md:flex-row gap-8 md:gap-16 items-start ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="md:w-1/4">
                                    <span className="text-6xl text-gray-200 font-light" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {section.number}
                                    </span>
                                </div>
                                <div className="md:w-3/4">
                                    <h3 className="text-3xl md:text-5xl font-bold mb-6 text-[#292F36] leading-tight tracking-tight" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {section.headline}
                                    </h3>
                                    <p className="text-xl text-gray-500 font-light leading-relaxed max-w-2xl">
                                        {section.copy}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SHOWCASE SECTION */}
            <section className="py-32 px-8 md:px-20 bg-[#F7FFF7] border-t border-[#4ECDC4]/20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-sm uppercase tracking-[0.3em] text-[#FF6B6B] mb-16 font-bold text-center">In Practice</h2>
                    <div className="bg-white p-8 md:p-16 border border-[#4ECDC4]/20 shadow-sm relative">
                        {/* Decorative editorial corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#292F36]"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#292F36]"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#292F36]"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#292F36]"></div>

                        <GameShowcase
                            isStudent={isStudent}
                            accentColor="#4ECDC4"
                            sectionIndex={4}
                            isMobile={false}
                            targetLanguage={targetLang}
                            nativeLanguage={nativeLang}
                        />
                    </div>
                </div>
            </section>

            {/* 4. ORIGINAL APP FOOTER COMPONENTS */}
            <div className="border-t border-[#4ECDC4]/20 bg-white editorial-overrides">
                <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Soften the imported original components to match editorial feel */
                .editorial-overrides section {
                    background-color: transparent !important;
                }
            `}</style>
        </div>
    );
}
