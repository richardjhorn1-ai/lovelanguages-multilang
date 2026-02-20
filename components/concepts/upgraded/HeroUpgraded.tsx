import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingUpgraded from './OnboardingUpgraded';
import { ICONS } from '../../../constants';
import { useTranslation } from 'react-i18next';
import { HeroFAQ, HeroRALL, HeroBlog, HeroFooter, GameShowcase } from '../../hero/index';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

export default function HeroUpgraded() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const languages = Object.values(LANGUAGE_CONFIGS);

    // Sync language selection with i18n for the demonstration
    useEffect(() => {
        i18n.changeLanguage(nativeLang);
    }, [nativeLang, i18n]);

    if (step === 'onboarding') {
        return <OnboardingUpgraded onComplete={() => alert('Demo Finished! Explore other concepts from the bottom right switcher.')} />;
    }

    // Fetch localized content based on role (default to student if not selected yet)
    const isStudent = role !== 'tutor';

    const sectionsContent = [
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section1.copy`),
            icon: '💬',
            color: 'from-[#FF6B6B] to-[#ff8e8e]'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            icon: '🎙️',
            color: 'from-[#4ECDC4] to-[#7bede6]'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            icon: '🎮',
            color: 'from-[#FFE66D] to-[#fff09e]'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7FFF7] relative overflow-x-hidden" style={{ fontFamily: '"Outfit", sans-serif', color: '#292F36' }}>

            {/* GLOBAL NAVBAR */}
            <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center backdrop-blur-md bg-[#F7FFF7]/80 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-xl" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D] flex items-center justify-center text-white text-sm shadow-md">
                        <ICONS.Heart />
                    </div>
                    Love Languages
                </div>
                <button
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setStep('language');
                    }}
                    className="px-6 py-2 bg-[#FF6B6B] text-white rounded-full font-bold shadow-lg shadow-[#FF6B6B]/30 hover:scale-105 transition-transform"
                >
                    {t('hero.shared.context0.cta', 'Get Started')}
                </button>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 p-6">
                {/* Soft decorative background circles */}
                <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#FF6B6B]/10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#4ECDC4]/10 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

                    {/* Left Side: Brand Story */}
                    <div className="lg:w-1/2 text-center lg:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-full text-[#FF6B6B] text-sm font-bold shadow-sm animate-bounce">
                            <span className="text-lg">✨</span> {t('hero.shared.section0.subhead', 'The language learning app for couples.')}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            {t('hero.student.section0.headline', 'Learn the Language of Love').split(' ').map((word, i, arr) => {
                                const targetWord = t('hero.student.section0.highlight1', 'Language');
                                if (word.includes(targetWord) || targetWord.includes(word)) {
                                    return (
                                        <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D] pb-2">
                                            {word}{' '}
                                        </span>
                                    );
                                }
                                return word + ' ';
                            })}
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto lg:mx-0 leading-relaxed font-light">
                            {t('hero.shared.section0.copy', 'Connect deeper with your partner by learning their native tongue. Shared vocabulary, shared intimacy.')}
                        </p>

                        <div className="pt-8 flex flex-col sm:flex-row items-center lg:items-start gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => setStep('onboarding')}
                                className="bg-[#292F36] text-white px-8 py-4 rounded-full font-bold shadow-xl hover:bg-black transition-all hover:scale-105 flex items-center gap-2"
                            >
                                Skip to Onboarding <ICONS.ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Re-imagined Interactive Card */}
                    <div className="lg:w-1/2 w-full max-w-md">
                        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(255,107,107,0.2)] relative overflow-hidden transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(78,205,196,0.2)]">
                            {/* Soft top gradient bar inside the card */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4]"></div>
                            <div className="relative min-h-[380px]">

                                {/* Step 1: Language */}
                                <div className={`absolute w-full top-0 left-0 transition-all duration-500 ${step === 'language' ? 'opacity-100 translate-x-0 cursor-auto' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                                    <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.shared.context0.header', 'Choose Languages')}</h3>
                                    <p className="text-center text-gray-500 text-sm mb-8">{t('hero.studentTargetStep.subtext', 'What do you speak and what will you learn?')}</p>

                                    <div className="space-y-5 mb-8">
                                        <div className="relative group">
                                            <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-bold text-[#FF6B6B] uppercase tracking-widest z-10 rounded-full">{t('hero.languageSelector.nativePrompt', 'I speak')}</label>
                                            <div className="relative transform transition-transform group-hover:scale-[1.02]">
                                                <select
                                                    className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:border-[#4ECDC4] transition-all text-[#292F36] appearance-none font-bold text-lg relative z-0 shadow-sm"
                                                    value={nativeLang}
                                                    onChange={(e) => setNativeLang(e.target.value)}
                                                >
                                                    {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>)}
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ICONS.ChevronDown />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-bold text-[#4ECDC4] uppercase tracking-widest z-10 rounded-full">{t('hero.languageSelector.targetPrompt', 'I want to learn')}</label>
                                            <div className="relative transform transition-transform group-hover:scale-[1.02]">
                                                <select
                                                    className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:border-[#FF6B6B] transition-all text-[#292F36] appearance-none font-bold text-lg relative z-0 shadow-sm"
                                                    value={targetLang}
                                                    onChange={(e) => setTargetLang(e.target.value)}
                                                >
                                                    {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>)}
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ICONS.ChevronDown />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep('role')}
                                        className="w-full bg-[#FF6B6B] text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(255,107,107,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(255,107,107,0.6)] hover:-translate-y-1 active:translate-y-0"
                                    >
                                        {t('onboarding.step.continue', 'Continue')}
                                    </button>
                                </div>

                                {/* Step 2: Role */}
                                <div className={`absolute w-full top-0 left-0 transition-all duration-500 ${step === 'role' ? 'opacity-100 translate-x-0 cursor-auto' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                                    <div className="flex items-center mb-6">
                                        <button onClick={() => setStep('language')} className="text-gray-400 hover:text-[#FF6B6B] transition-colors p-2 -ml-2 rounded-full hover:bg-[#FFF0F3]">
                                            <ICONS.ChevronLeft />
                                        </button>
                                        <h3 className="text-2xl font-bold flex-1 text-center -ml-5" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.student.context1.header', 'Your Role')}</h3>
                                    </div>

                                    <div className="flex flex-col gap-4 mb-8">
                                        <button
                                            onClick={() => setRole('student')}
                                            className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 group ${role === 'student' ? 'bg-[#FFF0F3] border-[#FF6B6B] shadow-md' : 'bg-white border-gray-100 hover:border-[#FF6B6B]/50 hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors shadow-inner ${role === 'student' ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100 group-hover:bg-gray-200'}`}>🎓</div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-0.5 text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.learn')}</h4>
                                                <p className="text-sm text-gray-500">I want to learn my partner's language.</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setRole('tutor')}
                                            className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 group ${role === 'tutor' ? 'bg-[#E7F5FF] border-[#4ECDC4] shadow-md' : 'bg-white border-gray-100 hover:border-[#4ECDC4]/50 hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors shadow-inner ${role === 'tutor' ? 'bg-[#4ECDC4] text-white' : 'bg-gray-100 group-hover:bg-gray-200'}`}>🧑‍🏫</div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-0.5 text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.toggle.teach')}</h4>
                                                <p className="text-sm text-gray-500">I want to help my partner learn mine.</p>
                                            </div>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setStep('auth')}
                                        disabled={!role}
                                        className="w-full bg-[#FF6B6B] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:hover:translate-y-0 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(255,107,107,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(255,107,107,0.6)] hover:-translate-y-1 active:translate-y-0"
                                    >
                                        {t('onboarding.step.continue', 'Continue')}
                                    </button>
                                </div>

                                {/* Step 3: Auth */}
                                <div className={`absolute w-full top-0 left-0 transition-all duration-500 ${step === 'auth' ? 'opacity-100 translate-x-0 cursor-auto' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                                    <div className="flex items-center mb-2">
                                        <button onClick={() => setStep('role')} className="text-gray-400 hover:text-[#FF6B6B] transition-colors p-2 -ml-2 rounded-full hover:bg-[#FFF0F3]">
                                            <ICONS.ChevronLeft />
                                        </button>
                                        <h3 className="text-2xl font-bold flex-1 text-center -ml-5" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                            {isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')}
                                        </h3>
                                    </div>
                                    <p className="text-center text-gray-500 text-sm mb-8">Save your progress across devices.</p>

                                    <div className="space-y-4 mb-8">
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:border-[#4ECDC4] transition-all text-[#292F36] font-bold placeholder-gray-400 shadow-sm"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 px-5 focus:outline-none focus:border-[#4ECDC4] transition-all text-[#292F36] font-bold placeholder-gray-400 shadow-sm"
                                        />
                                    </div>

                                    {/* BYPASS AUTH FOR DEMO */}
                                    <button
                                        onClick={(e) => { e.preventDefault(); setStep('onboarding'); }}
                                        className="w-full bg-[#292F36] text-white font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(41,47,54,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(41,47,54,0.6)] hover:-translate-y-1 active:translate-y-0 mb-4"
                                    >
                                        {isSignUp ? `${t('hero.login.createAccount')} (Demo)` : `${t('hero.login.signIn')} (Demo)`}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            onClick={() => setIsSignUp(!isSignUp)}
                                            className="text-gray-500 font-bold text-sm hover:text-[#FF6B6B] transition-colors"
                                        >
                                            {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-400 animate-bounce cursor-pointer" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
                    <ICONS.ChevronDown className="w-8 h-8 opacity-50" />
                </div>
            </section>

            {/* 2. DYNAMIC CONTENT FROM APP */}
            <section className="py-24 px-6 bg-white relative">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        {sectionsContent.map((feature, i) => (
                            <div key={i} className="bg-[#F7FFF7] rounded-[2rem] p-8 text-center border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-300">
                                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 shadow-lg text-white`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 leading-tight" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    {feature.headline}
                                </h3>
                                <p className="text-gray-600 leading-relaxed font-light">{feature.copy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. SHOWCASE SECTION (ORIGINAL DECORATED) */}
            <section className="py-24 px-6 bg-gradient-to-br from-[#FFF0F3] to-[#F7FFF7] relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10 bg-white/60 backdrop-blur-3xl rounded-[3rem] p-8 md:p-16 border border-white shadow-2xl">
                    <GameShowcase
                        isStudent={isStudent}
                        accentColor="#FF6B6B"
                        sectionIndex={4}
                        isMobile={false}
                        targetLanguage={targetLang}
                        nativeLanguage={nativeLang}
                    />
                </div>
            </section>

            {/* 4. ORIGINAL APP FOOTER COMPONENTS */}
            <div className="bg-white">
                <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />

        </div>
    );
}
