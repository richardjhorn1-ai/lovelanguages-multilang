import React, { useState, useEffect } from 'react';
import { LANGUAGE_CONFIGS } from '../../../constants/language-config';
import OnboardingPlayful from './OnboardingPlayful';
import { useTranslation } from 'react-i18next';
import { HeroFAQ, HeroRALL, HeroBlog, HeroFooter, GameShowcase } from '../../hero/index';

type Step = 'language' | 'role' | 'auth' | 'onboarding';

export default function HeroPlayful() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState<Step>('language');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [role, setRole] = useState<'student' | 'tutor' | null>(null);
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const languages = Object.values(LANGUAGE_CONFIGS);

    // Sync language selection with i18n
    useEffect(() => {
        i18n.changeLanguage(nativeLang);
    }, [nativeLang, i18n]);

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
            rotation: '-rotate-2'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section2.copy`),
            color: '#4ECDC4',
            icon: '🎙️',
            rotation: 'rotate-2'
        },
        {
            headline: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.headline`),
            copy: t(`hero.${isStudent ? 'student' : 'tutor'}.section3.copy`),
            color: '#FFE66D',
            icon: '🎮',
            rotation: '-rotate-1'
        }
    ];

    return (
        <div className="bg-[#F7FFF7] text-[#292F36] overflow-x-hidden" style={{ fontFamily: '"Outfit", sans-serif' }}>

            {/* HERO SECTION */}
            <section className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
                {/* Playful Floating Elements */}
                <div className="absolute top-10 left-10 w-16 h-16 bg-[#FF6B6B] border-4 border-[#292F36] rounded-full shadow-[4px_4px_0_#292F36] animate-bounce" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-[#4ECDC4] border-4 border-[#292F36] rounded-xl shadow-[6px_6px_0_#292F36] rotate-12 animate-pulse"></div>
                <div className="absolute top-40 right-20 text-6xl text-[#FFE66D] drop-shadow-[2px_2px_0_#292F36]">✨</div>

                <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 z-10 relative">

                    {/* Left Side: Brand Text */}
                    <div className="md:w-1/2 text-center md:text-left">
                        <div className="inline-block px-4 py-2 border-4 border-[#292F36] rounded-full bg-[#FFE66D] font-bold uppercase tracking-wider mb-6 shadow-[4px_4px_0_#292F36]">
                            💖 {t('hero.shared.section0.subhead', 'Fun & Free Language Learning')}
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black mb-6 uppercase leading-none drop-shadow-[4px_4px_0_#FF6B6B] hover:scale-105 transition-transform cursor-default" style={{ fontFamily: '"Quicksand", sans-serif', WebkitTextStroke: '2px #292F36', color: 'white' }}>
                            {t('hero.student.section0.headline', 'Learn the Language of Love').replace('Language of Love', '').trim()}<br />
                            <span className="text-[#FFE66D] drop-shadow-[4px_4px_0_#4ECDC4]">Together</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-bold text-gray-700 max-w-md mx-auto md:mx-0 bg-white p-4 border-4 border-[#292F36] rounded-2xl shadow-[6px_6px_0_#292F36]">
                            {t('hero.shared.section0.copy', 'The most fun way to learn your partner\'s language! 🚀')}
                        </p>

                        <div className="mt-8 flex justify-center md:justify-start">
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-[#4ECDC4] border-4 border-[#292F36] text-[#292F36] font-black text-xl py-3 px-8 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                            >
                                See How ↓
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Brutalist Card */}
                    <div className="md:w-1/2 w-full max-w-md">
                        <div className="bg-white border-4 border-[#292F36] rounded-3xl p-8 shadow-[12px_12px_0_#292F36] relative overflow-hidden group hover:scale-[1.02] transition-transform">

                            {/* Progress Bar */}
                            <div className="w-full h-6 bg-gray-100 border-4 border-[#292F36] rounded-full mb-8 overflow-hidden flex">
                                <div className={`h-full bg-[#FF6B6B] transition-all duration-500 border-r-4 border-[#292F36]`} style={{ width: step === 'language' ? '33%' : step === 'role' ? '66%' : '100%' }}></div>
                            </div>

                            <div className="relative min-h-[350px]">

                                {/* Step 1: Language */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'language' ? 'opacity-100 translate-x-0 cursor-auto' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
                                    <h3 className="text-3xl font-black mb-6 uppercase text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>Languages</h3>

                                    <div className="space-y-4 mb-8">
                                        <div className="bg-[#FFF0F3] border-4 border-[#292F36] rounded-2xl p-2 shadow-[4px_4px_0_#292F36]">
                                            <label className="block text-sm font-bold uppercase px-2 py-1 text-[#FF6B6B]">{t('hero.languageSelector.nativePrompt', 'I speak')}</label>
                                            <select
                                                className="w-full bg-transparent p-2 text-xl font-bold focus:outline-none appearance-none"
                                                value={nativeLang}
                                                onChange={(e) => setNativeLang(e.target.value)}
                                            >
                                                {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>)}
                                            </select>
                                        </div>

                                        <div className="bg-[#E7F5FF] border-4 border-[#292F36] rounded-2xl p-2 shadow-[4px_4px_0_#292F36]">
                                            <label className="block text-sm font-bold uppercase px-2 py-1 text-[#4ECDC4]">{t('hero.languageSelector.targetPrompt', 'I want to learn')}</label>
                                            <select
                                                className="w-full bg-transparent p-2 text-xl font-bold focus:outline-none appearance-none"
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                            >
                                                {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep('role')}
                                        className="w-full bg-[#FF6B6B] border-4 border-[#292F36] text-white font-black text-2xl py-4 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                                    >
                                        {t('onboarding.step.continue', "Let's Go!")}
                                    </button>
                                </div>

                                {/* Step 2: Role */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'role' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                                    <h3 className="text-3xl font-black mb-6 uppercase text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.student.context1.header', 'Choose Role')}</h3>

                                    <div className="flex gap-4 mb-8">
                                        <button
                                            onClick={() => setRole('student')}
                                            className={`flex-1 p-4 border-4 rounded-2xl transition-all shadow-[4px_4px_0_#292F36] ${role === 'student' ? 'border-[#292F36] bg-[#FF6B6B] text-white -translate-y-2 shadow-[6px_8px_0_#292F36]' : 'border-[#292F36] bg-white hover:bg-gray-50'}`}
                                        >
                                            <div className="text-4xl mb-2 hover:scale-125 transition-transform inline-block">🎓</div>
                                            <div className="font-black uppercase">{t('hero.toggle.learn')}</div>
                                        </button>
                                        <button
                                            onClick={() => setRole('tutor')}
                                            className={`flex-1 p-4 border-4 rounded-2xl transition-all shadow-[4px_4px_0_#292F36] ${role === 'tutor' ? 'border-[#292F36] bg-[#4ECDC4] text-[#292F36] -translate-y-2 shadow-[6px_8px_0_#292F36]' : 'border-[#292F36] bg-white hover:bg-gray-50'}`}
                                        >
                                            <div className="text-4xl mb-2 hover:scale-125 transition-transform inline-block">🧑‍🏫</div>
                                            <div className="font-black uppercase">{t('hero.toggle.teach')}</div>
                                        </button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setStep('language')} className="w-16 h-16 bg-gray-200 border-4 border-[#292F36] rounded-2xl flex items-center justify-center font-bold text-xl shadow-[4px_4px_0_#292F36] hover:-translate-y-1 hover:shadow-[4px_6px_0_#292F36] active:translate-y-0 active:shadow-none transition-all">
                                            ←
                                        </button>
                                        <button
                                            onClick={() => setStep('auth')}
                                            disabled={!role}
                                            className="flex-1 bg-[#FFE66D] border-4 border-[#292F36] text-[#292F36] disabled:bg-gray-200 disabled:text-gray-400 font-black text-2xl py-4 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                                        >
                                            {t('onboarding.step.continue', 'Next')}
                                        </button>
                                    </div>
                                </div>

                                {/* Step 3: Auth */}
                                <div className={`absolute top-0 left-0 w-full transition-all duration-500 ${step === 'auth' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                                    <h3 className="text-3xl font-black mb-6 uppercase text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                        {isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')}
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <input
                                            type="email"
                                            placeholder={t('hero.login.emailLabel', 'EMAIL').toUpperCase()}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white border-4 border-[#292F36] rounded-2xl py-4 px-4 font-bold text-xl placeholder-gray-400 focus:outline-none focus:bg-[#E7F5FF] transition-colors shadow-[4px_4px_0_#292F36]"
                                        />
                                        <input
                                            type="password"
                                            placeholder={t('hero.login.passwordLabel', 'PASSWORD').toUpperCase()}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white border-4 border-[#292F36] rounded-2xl py-4 px-4 font-bold text-xl placeholder-gray-400 focus:outline-none focus:bg-[#E7F5FF] transition-colors shadow-[4px_4px_0_#292F36]"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setStep('role')} className="w-16 h-16 bg-gray-200 border-4 border-[#292F36] rounded-2xl flex items-center justify-center font-bold text-xl shadow-[4px_4px_0_#292F36] hover:-translate-y-1 hover:shadow-[4px_6px_0_#292F36] active:translate-y-0 active:shadow-none transition-all">
                                            ←
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); setStep('onboarding'); }}
                                            className="flex-1 bg-[#4ECDC4] border-4 border-[#292F36] text-[#292F36] font-black text-2xl py-4 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                                        >
                                            {isSignUp ? `${t('hero.login.createAccount')} (Demo)` : `${t('hero.login.signIn')} (Demo)`}
                                        </button>
                                    </div>

                                    <div className="mt-6 text-center">
                                        <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold underline text-[#292F36]">
                                            {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* PLAYFUL CONTENT SECTIONS */}
            <section id="features" className="py-24 px-6 bg-[#FFE66D] border-y-8 border-[#292F36] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay opacity-50 -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black uppercase text-center mb-20 text-white drop-shadow-[4px_4px_0_#292F36]" style={{ fontFamily: '"Quicksand", sans-serif', WebkitTextStroke: '2px #292F36' }}>
                        Why It Rules 🤘
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {sectionsContent.map((section, i) => (
                            <div key={i} className={`bg-white border-4 border-[#292F36] rounded-3xl p-8 transform ${section.rotation} hover:rotate-0 hover:scale-105 transition-all shadow-[12px_12px_0_#292F36] group`}>
                                <div className="w-24 h-24 rounded-2xl border-4 border-[#292F36] flex items-center justify-center text-5xl mb-6 shadow-[6px_6px_0_#292F36] mx-auto group-hover:-translate-y-4 transition-transform bg-white" style={{ backgroundColor: section.color }}>
                                    <span className={i === 1 ? 'text-[#292F36]' : 'text-white'}>{section.icon}</span>
                                </div>
                                <h3 className="text-3xl font-black mb-4 uppercase text-center" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    {section.headline}
                                </h3>
                                <p className="text-xl font-bold text-gray-600 text-center leading-relaxed">
                                    {section.copy}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SHOWCASE SECTION */}
            <section className="py-24 px-6 bg-[#F7FFF7] relative overflow-hidden">
                <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#292F36 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="bg-white border-8 border-[#292F36] rounded-[3rem] p-8 md:p-12 shadow-[20px_20px_0_#292F36] playful-overrides">
                        <h2 className="text-4xl md:text-6xl font-black uppercase text-center mb-8 drop-shadow-[2px_2px_0_#FF6B6B]" style={{ fontFamily: '"Quicksand", sans-serif' }}>Get Your Flash On! ⚡️</h2>
                        <GameShowcase
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

            {/* 4. ORIGINAL APP FOOTER COMPONENTS */}
            <div className="border-t-8 border-[#292F36] bg-white playful-overrides">
                <HeroFAQ isStudent={isStudent} sectionIndex={6} isVisible={true} />
                <HeroRALL isStudent={isStudent} sectionIndex={7} isVisible={true} />
                <HeroBlog isStudent={isStudent} sectionIndex={8} isVisible={true} />
            </div>

            <div className="playful-overrides">
                <HeroFooter isStudent={isStudent} sectionIndex={9} isVisible={true} />
            </div>

            <style>{`
                /* Override the imported original components to match playful brutalist theme */
                .playful-overrides section {
                    background-color: transparent !important;
                }
                .playful-overrides .rounded-2xl, .playful-overrides .rounded-3xl {
                    border: 4px solid #292F36 !important;
                    box-shadow: 6px 6px 0 #292F36 !important;
                    border-radius: 1.5rem !important;
                }
                .playful-overrides button, .playful-overrides a.rounded-full {
                    border: 4px solid #292F36 !important;
                    box-shadow: 4px 4px 0 #292F36 !important;
                    border-radius: 1rem !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    transition: all 0.2s;
                }
                .playful-overrides button:hover, .playful-overrides a.rounded-full:hover {
                    transform: translate(-2px, -2px) !important;
                    box-shadow: 6px 6px 0 #292F36 !important;
                }
                .playful-overrides button:active, .playful-overrides a.rounded-full:active {
                    transform: translate(0, 0) !important;
                    box-shadow: 2px 2px 0 #292F36 !important;
                }
                .playful-overrides h2 {
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    font-family: 'Quicksand', sans-serif !important;
                }
            `}</style>

        </div>
    );
}
