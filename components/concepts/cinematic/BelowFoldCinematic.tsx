import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { GameShowcase } from '../../hero/GameShowcase';

// Cinematic accent palette
const ACCENT = {
    coral: '#FF6B6B',
    teal: '#4ECDC4',
    gold: '#FFE66D',
};

// ============================================
// 1. CinematicFAQ
// ============================================
export const CinematicFAQ: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const accentColor = isStudent ? ACCENT.coral : ACCENT.teal;

    const faqItems = [
        {
            question: t('hero.bottomSections.faq.q1.question'),
            answer: (
                <p>
                    {t('hero.bottomSections.faq.q1.answer')}{' '}
                    <a href="#rall-section" className="font-bold underline" style={{ color: accentColor }}>
                        {t('hero.bottomSections.faq.q1.readMore')}
                    </a>
                </p>
            ),
        },
        {
            question: t('hero.bottomSections.faq.q2.question'),
            answer: (
                <>
                    <p className="mb-3">{t('hero.bottomSections.faq.q2.intro')}</p>
                    <ul className="list-disc ml-5 space-y-1 text-gray-400">
                        <li><strong className="text-white/80">{t('hero.bottomSections.faq.q2.point1')}</strong> {t('hero.bottomSections.faq.q2.point1desc')}</li>
                        <li><strong className="text-white/80">{t('hero.bottomSections.faq.q2.point2')}</strong> {t('hero.bottomSections.faq.q2.point2desc')}</li>
                        <li><strong className="text-white/80">{t('hero.bottomSections.faq.q2.point3')}</strong> {t('hero.bottomSections.faq.q2.point3desc')}</li>
                        <li><strong className="text-white/80">{t('hero.bottomSections.faq.q2.point4')}</strong> {t('hero.bottomSections.faq.q2.point4desc')}</li>
                    </ul>
                </>
            ),
        },
        {
            question: t('hero.bottomSections.faq.q3.question'),
            answer: (
                <>
                    <p className="mb-3">{t('hero.bottomSections.faq.q3.studentDesc')}</p>
                    <p>{t('hero.bottomSections.faq.q3.tutorDesc')}</p>
                </>
            ),
        },
        {
            question: t('hero.bottomSections.faq.q4.question'),
            answer: <p>{t('hero.bottomSections.faq.q4.answer')}</p>,
        },
        {
            question: t('hero.bottomSections.faq.q5.question'),
            answer: (
                <>
                    <p className="mb-3">{t('hero.bottomSections.faq.q5.intro')}</p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                            <p className="font-bold text-white/90">{t('hero.bottomSections.faq.q5.standard')}</p>
                            <p className="text-sm text-gray-400">{t('hero.bottomSections.faq.q5.standardPrice')}</p>
                            <p className="text-xs mt-1 text-white/40">{t('hero.bottomSections.faq.q5.standardDesc')}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.06]" style={{ border: `2px solid ${accentColor}60` }}>
                            <p className="font-bold text-white/90">{t('hero.bottomSections.faq.q5.unlimited')}</p>
                            <p className="text-sm text-gray-400">{t('hero.bottomSections.faq.q5.unlimitedPrice')}</p>
                            <p className="text-xs mt-1 text-white/40">{t('hero.bottomSections.faq.q5.unlimitedDesc')}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">{t('hero.bottomSections.faq.q5.cancelNote')}</p>
                </>
            ),
        },
        {
            question: t('hero.bottomSections.faq.q6.question'),
            answer: <p>{t('hero.bottomSections.faq.q6.answer')}</p>,
        },
    ];

    return (
        <section data-section={sectionIndex} className="py-16 md:py-24 px-4 md:px-16 lg:px-24 bg-transparent">
            <div className="max-w-3xl mx-auto w-full">
                <h2
                    className="text-xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-10 text-center text-white"
                    style={{ fontFamily: '"Quicksand", sans-serif' }}
                >
                    {t('hero.bottomSections.faq.title')}
                </h2>

                <div className="space-y-3">
                    {faqItems.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className="rounded-2xl overflow-hidden transition-all duration-500 bg-white/[0.04] backdrop-blur-sm border"
                                style={{
                                    borderColor: isOpen ? `${accentColor}50` : 'rgba(255,255,255,0.06)',
                                    boxShadow: isOpen ? `0 0 20px ${accentColor}15, 0 0 40px ${accentColor}08` : 'none',
                                }}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors"
                                >
                                    <span className="font-bold text-sm md:text-base pr-4 text-white/90">
                                        {item.question}
                                    </span>
                                    <ICONS.ChevronDown
                                        className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        style={{ color: accentColor }}
                                    />
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="px-4 pb-4 md:px-5 md:pb-5 text-sm md:text-base leading-relaxed text-gray-400">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ============================================
// 2. CinematicRALL
// ============================================
export const CinematicRALL: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? ACCENT.coral : ACCENT.teal;

    const pillars = [
        { icon: ICONS.MessageCircle, title: t('hero.bottomSections.rall.pillar1.title'), description: t('hero.bottomSections.rall.pillar1.description'), citation: t('hero.bottomSections.rall.pillar1.citation'), glow: ACCENT.coral },
        { icon: ICONS.Target, title: t('hero.bottomSections.rall.pillar2.title'), description: t('hero.bottomSections.rall.pillar2.description'), citation: t('hero.bottomSections.rall.pillar2.citation'), glow: ACCENT.teal },
        { icon: ICONS.Heart, title: t('hero.bottomSections.rall.pillar3.title'), description: t('hero.bottomSections.rall.pillar3.description'), citation: t('hero.bottomSections.rall.pillar3.citation'), glow: ACCENT.gold },
        { icon: ICONS.Users, title: t('hero.bottomSections.rall.pillar4.title'), description: t('hero.bottomSections.rall.pillar4.description'), citation: t('hero.bottomSections.rall.pillar4.citation'), glow: ACCENT.coral },
    ];

    return (
        <section id="rall-section" data-section={sectionIndex} className="py-16 md:py-24 px-4 md:px-16 lg:px-24 bg-transparent">
            <div className="max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-6 md:mb-12">
                    <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>
                        {t('hero.bottomSections.rall.label')}
                    </p>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                        {t('hero.bottomSections.rall.title')}
                    </h2>
                    <p className="text-sm md:text-lg max-w-2xl mx-auto text-gray-400">
                        {t('hero.bottomSections.rall.description')}
                    </p>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-12">
                    {pillars.map((pillar, index) => (
                        <div
                            key={index}
                            className="rounded-2xl p-4 md:p-6 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] transition-all duration-300 hover:border-white/[0.12]"
                        >
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: `${pillar.glow}15`,
                                        boxShadow: `0 0 12px ${pillar.glow}30`,
                                    }}
                                >
                                    <pillar.icon className="w-4 h-4" style={{ color: pillar.glow }} />
                                </div>
                                <h3 className="font-bold text-xs md:text-base leading-tight text-white/90">
                                    {pillar.title}
                                </h3>
                            </div>
                            <p className="text-xs md:text-sm mb-2 md:mb-3 line-clamp-3 md:line-clamp-none text-gray-400">
                                {pillar.description}
                            </p>
                            <p className="text-[10px] md:text-xs font-medium hidden md:block text-white/50">
                                {pillar.citation}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Key Insight — gradient border card */}
                <div className="relative rounded-2xl md:rounded-3xl p-[1px] mb-6 md:mb-8">
                    <div
                        className="absolute inset-0 rounded-2xl md:rounded-3xl"
                        style={{ background: `linear-gradient(135deg, ${ACCENT.teal}, ${ACCENT.coral})`, opacity: 0.5 }}
                    />
                    <div className="relative rounded-2xl md:rounded-3xl p-5 md:p-8 text-center bg-[#12151A]/95 backdrop-blur-xl">
                        <p className="text-white text-sm md:text-xl font-medium leading-relaxed">
                            {t('hero.bottomSections.rall.quote')}
                        </p>
                        <p className="text-white/50 text-xs md:text-sm mt-3 md:mt-4">
                            {t('hero.bottomSections.rall.quoteAttribution')}
                        </p>
                    </div>
                </div>

                {/* Anxiety Note — hidden on mobile */}
                <div className="text-center hidden md:block">
                    <p className="text-sm text-gray-400">
                        <strong className="text-white/70">{t('hero.bottomSections.rall.anxietyTitle')}</strong>{' '}
                        {t('hero.bottomSections.rall.anxietyDesc')}
                    </p>
                    <p className="text-xs mt-2" style={{ color: accentColor }}>
                        {t('hero.bottomSections.rall.anxietyCitation')}
                    </p>
                </div>
            </div>
        </section>
    );
};

// ============================================
// 3. CinematicBlog
// ============================================
export const CinematicBlog: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? ACCENT.coral : ACCENT.teal;

    const topics = [
        { title: t('hero.bottomSections.blog.topic1.title'), description: t('hero.bottomSections.blog.topic1.description'), icon: ICONS.Heart, glow: ACCENT.coral },
        { title: t('hero.bottomSections.blog.topic2.title'), description: t('hero.bottomSections.blog.topic2.description'), icon: ICONS.Globe, glow: ACCENT.teal },
        { title: t('hero.bottomSections.blog.topic3.title'), description: t('hero.bottomSections.blog.topic3.description'), icon: ICONS.BookOpen, glow: ACCENT.gold },
    ];

    return (
        <section data-section={sectionIndex} className="py-16 md:py-24 px-4 md:px-16 lg:px-24 bg-transparent">
            <div className="max-w-4xl mx-auto text-center w-full">
                <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>
                    {t('hero.bottomSections.blog.label')}
                </p>
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 text-white" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                    {t('hero.bottomSections.blog.title')}
                </h2>
                <p className="text-sm md:text-lg mb-6 md:mb-10 max-w-2xl mx-auto text-gray-400">
                    {t('hero.bottomSections.blog.description')}
                </p>

                {/* Topic Cards */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-10">
                    {topics.map((topic, index) => (
                        <a
                            key={index}
                            href="https://www.lovelanguages.io/learn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-3 md:p-6 rounded-xl md:rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] text-left transition-all duration-300 hover:border-white/[0.15] hover:-translate-y-1"
                            style={{ boxShadow: 'none' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${topic.glow}15`; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                        >
                            <div
                                className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4"
                                style={{ background: `${topic.glow}15` }}
                            >
                                <topic.icon className="w-4 h-4 md:w-6 md:h-6" style={{ color: topic.glow }} />
                            </div>
                            <h3 className="font-bold text-xs md:text-base mb-1 text-white/90">{topic.title}</h3>
                            <p className="text-[10px] md:text-sm hidden md:block text-gray-400">{topic.description}</p>
                        </a>
                    ))}
                </div>

                {/* CTA + Social */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
                    <a
                        href="https://www.lovelanguages.io/learn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-8 md:py-4 rounded-full font-bold text-xs md:text-base text-white transition-all hover:scale-105 cta-breathing-teal"
                        style={{ background: accentColor, boxShadow: `0 0 25px ${accentColor}40` }}
                    >
                        {t('hero.bottomSections.blog.cta')}
                        <ICONS.ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                    </a>
                    {/* Social — mobile only */}
                    <a
                        href="https://instagram.com/lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden flex items-center gap-1 px-3 py-2 rounded-full font-bold text-xs transition-all hover:scale-105 bg-white/[0.06] border border-white/[0.08]"
                        style={{ color: accentColor }}
                    >
                        <ICONS.Instagram className="w-3.5 h-3.5" />
                        <span>{t('hero.bottomSections.footer.instagram')}</span>
                    </a>
                    <a
                        href="https://tiktok.com/@lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden flex items-center gap-1 px-3 py-2 rounded-full font-bold text-xs transition-all hover:scale-105 bg-white/[0.06] border border-white/[0.08]"
                        style={{ color: accentColor }}
                    >
                        <ICONS.Video className="w-3.5 h-3.5" />
                        <span>{t('hero.bottomSections.footer.tiktok')}</span>
                    </a>
                </div>
            </div>
        </section>
    );
};

// ============================================
// 4. CinematicFooter
// ============================================
export const CinematicFooter: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? ACCENT.coral : ACCENT.teal;

    return (
        <footer data-section={sectionIndex} className="py-12 md:py-20 px-4 md:px-16 lg:px-24 bg-transparent">
            <div className="max-w-4xl mx-auto">
                {/* Gradient separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12 md:mb-16" />

                {/* Tagline — cinematic credits style */}
                <div className="hidden md:block text-center mb-10">
                    <p
                        className="text-sm uppercase tracking-[0.3em] text-white/40"
                        style={{ fontFamily: '"Quicksand", sans-serif' }}
                    >
                        {t('hero.bottomSections.footer.tagline')}
                    </p>
                </div>

                {/* Social links — glass pills, desktop only */}
                <div className="hidden md:flex items-center justify-center gap-4 mb-10">
                    <a
                        href="https://instagram.com/lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition-all hover:scale-105 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-white/60 hover:text-white/90 hover:border-white/[0.15]"
                    >
                        <ICONS.Instagram className="w-4 h-4" />
                        <span>{t('hero.bottomSections.footer.instagram')}</span>
                    </a>
                    <a
                        href="https://tiktok.com/@lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition-all hover:scale-105 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-white/60 hover:text-white/90 hover:border-white/[0.15]"
                    >
                        <ICONS.Video className="w-4 h-4" />
                        <span>{t('hero.bottomSections.footer.tiktok')}</span>
                    </a>
                </div>

                {/* Footer links with dot separators */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6 text-xs md:text-sm mb-4 md:mb-6">
                    <a href="#/terms" className="font-medium text-white/30 hover:text-white/60 transition-colors">{t('hero.bottomSections.footer.terms')}</a>
                    <span className="text-white/10">·</span>
                    <a href="#/privacy" className="font-medium text-white/30 hover:text-white/60 transition-colors">{t('hero.bottomSections.footer.privacy')}</a>
                    <span className="text-white/10">·</span>
                    <a href="https://www.lovelanguages.io/learn/" target="_blank" rel="noopener noreferrer" className="font-medium text-white/30 hover:text-white/60 transition-colors">{t('hero.bottomSections.footer.blog')}</a>
                    <span className="text-white/10">·</span>
                    <a href="mailto:hello@lovelanguages.xyz" className="font-medium text-white/30 hover:text-white/60 transition-colors">{t('hero.bottomSections.footer.contact')}</a>
                </div>

                {/* Copyright */}
                <div className="text-center text-xs text-white/20">
                    &copy; {new Date().getFullYear()} {t('hero.bottomSections.footer.copyright')}
                </div>
            </div>
        </footer>
    );
};

// ============================================
// 5. CinematicGameShowcaseWrapper
// ============================================
export const CinematicGameShowcaseWrapper: React.FC<{
    isStudent: boolean;
    accentColor: string;
    sectionIndex?: number;
    isMobile?: boolean;
    targetLanguage?: string | null;
    nativeLanguage?: string | null;
}> = ({ isStudent, accentColor, sectionIndex, isMobile, targetLanguage, nativeLanguage }) => {
    return (
        <div className="relative">
            {/* Ambient glow behind */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full blur-[200px] pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                }}
                aria-hidden="true"
            />
            <div className="relative z-10">
                <GameShowcase
                    isStudent={isStudent}
                    accentColor={accentColor}
                    sectionIndex={sectionIndex}
                    isMobile={isMobile}
                    targetLanguage={targetLanguage}
                    nativeLanguage={nativeLanguage}
                />
            </div>
        </div>
    );
};

// ============================================
// Reduced motion styles
// ============================================
export const CinematicBelowFoldStyles: React.FC = () => (
    <style>{`
        @media (prefers-reduced-motion: reduce) {
            .cta-breathing-teal {
                animation: none !important;
            }
        }
    `}</style>
);
