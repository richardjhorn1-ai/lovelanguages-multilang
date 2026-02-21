import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { GameShowcase } from '../../hero/GameShowcase';

// Playful palette
const PL = {
    mint: '#F7FFF7',
    golden: '#FFE66D',
    charcoal: '#292F36',
    coral: '#FF6B6B',
    teal: '#4ECDC4',
    pink: '#FF9FF3',
    blue: '#54A0FF',
};

const HALFTONE = {
    backgroundImage: 'radial-gradient(#292F36 1.5px, transparent 1.5px)',
    backgroundSize: '20px 20px',
    opacity: 0.04,
} as const;

// Small rotated sticker decoration
const MiniSticker = ({ text, color, rotation }: { text: string; color: string; rotation: string }) => (
    <div
        className="absolute font-black text-xs uppercase px-2 py-0.5 border-2 border-[#292F36] shadow-[2px_2px_0_#292F36] select-none pointer-events-none hidden md:block"
        style={{
            background: color,
            transform: `rotate(${rotation})`,
            fontFamily: '"Quicksand", sans-serif',
            borderRadius: '3px 8px 3px 8px',
            zIndex: 5,
        }}
    >
        {text}
    </div>
);

// ============================================
// 1. PlayfulFAQ
// ============================================
export const PlayfulFAQ: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const accentColor = isStudent ? PL.coral : PL.teal;

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
                    <ul className="list-disc ml-5 space-y-1">
                        <li><strong>{t('hero.bottomSections.faq.q2.point1')}</strong> {t('hero.bottomSections.faq.q2.point1desc')}</li>
                        <li><strong>{t('hero.bottomSections.faq.q2.point2')}</strong> {t('hero.bottomSections.faq.q2.point2desc')}</li>
                        <li><strong>{t('hero.bottomSections.faq.q2.point3')}</strong> {t('hero.bottomSections.faq.q2.point3desc')}</li>
                        <li><strong>{t('hero.bottomSections.faq.q2.point4')}</strong> {t('hero.bottomSections.faq.q2.point4desc')}</li>
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
                        <div className="p-3 border-4 border-[#292F36] rounded-xl bg-white shadow-[4px_4px_0_#292F36]">
                            <p className="font-black uppercase text-sm" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.bottomSections.faq.q5.standard')}</p>
                            <p className="text-sm font-bold">{t('hero.bottomSections.faq.q5.standardPrice')}</p>
                            <p className="text-xs mt-1 text-gray-500">{t('hero.bottomSections.faq.q5.standardDesc')}</p>
                        </div>
                        <div className="p-3 border-4 border-[#292F36] rounded-xl shadow-[4px_4px_0_#292F36]" style={{ background: `${accentColor}18` }}>
                            <p className="font-black uppercase text-sm" style={{ fontFamily: '"Quicksand", sans-serif' }}>{t('hero.bottomSections.faq.q5.unlimited')}</p>
                            <p className="text-sm font-bold">{t('hero.bottomSections.faq.q5.unlimitedPrice')}</p>
                            <p className="text-xs mt-1 text-gray-500">{t('hero.bottomSections.faq.q5.unlimitedDesc')}</p>
                        </div>
                    </div>
                    <p className="text-sm">{t('hero.bottomSections.faq.q5.cancelNote')}</p>
                </>
            ),
        },
        {
            question: t('hero.bottomSections.faq.q6.question'),
            answer: <p>{t('hero.bottomSections.faq.q6.answer')}</p>,
        },
    ];

    return (
        <section data-section={sectionIndex} className="relative py-16 md:py-24 px-4 md:px-16 lg:px-24 overflow-hidden" style={{ background: 'white' }}>
            <div className="absolute inset-0 pointer-events-none" style={HALFTONE} />

            <div className="max-w-3xl mx-auto relative z-10">
                <h2
                    className="text-3xl md:text-5xl font-black uppercase text-center mb-10 md:mb-16"
                    style={{ fontFamily: '"Quicksand", sans-serif', textShadow: `3px 3px 0 ${accentColor}` }}
                >
                    {t('hero.bottomSections.faq.title')}
                </h2>

                <div className="space-y-4 md:space-y-5">
                    {faqItems.map((item, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={index} className="relative">
                                {/* Speech bubble card */}
                                <div
                                    className={`bg-white border-4 border-[#292F36] rounded-2xl overflow-hidden transition-all ${
                                        isOpen ? 'shadow-[8px_8px_0_#292F36]' : 'shadow-[6px_6px_0_#292F36]'
                                    }`}
                                    style={{ background: isOpen ? `${accentColor}08` : 'white' }}
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        className="w-full flex items-center justify-between p-4 md:p-5 text-left"
                                    >
                                        <span
                                            className="font-black text-sm md:text-base uppercase pr-4"
                                            style={{ fontFamily: '"Quicksand", sans-serif', color: PL.charcoal }}
                                        >
                                            {item.question}
                                        </span>
                                        <ICONS.ChevronDown
                                            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                            style={{ color: accentColor }}
                                        />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-4 pb-4 md:px-5 md:pb-5 text-sm md:text-base leading-relaxed font-bold" style={{ color: '#4b5563', fontFamily: '"Outfit", sans-serif' }}>
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                                {/* Speech bubble tail */}
                                {isOpen && (
                                    <div
                                        className="absolute -bottom-3 left-8 w-5 h-5 border-b-4 border-r-4 border-[#292F36]"
                                        style={{ background: `${accentColor}08`, transform: 'rotate(45deg)' }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ============================================
// 2. PlayfulRALL
// ============================================
export const PlayfulRALL: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? PL.coral : PL.teal;
    const pillarColors = [PL.coral, PL.teal, PL.pink, PL.blue];
    const stickerLabels = ['WOW!', 'COOL!', 'YAY!', 'NICE!'];
    const stickerRotations = ['-6deg', '5deg', '-4deg', '7deg'];

    const pillars = [
        { icon: ICONS.MessageCircle, title: t('hero.bottomSections.rall.pillar1.title'), description: t('hero.bottomSections.rall.pillar1.description'), citation: t('hero.bottomSections.rall.pillar1.citation') },
        { icon: ICONS.Target, title: t('hero.bottomSections.rall.pillar2.title'), description: t('hero.bottomSections.rall.pillar2.description'), citation: t('hero.bottomSections.rall.pillar2.citation') },
        { icon: ICONS.Heart, title: t('hero.bottomSections.rall.pillar3.title'), description: t('hero.bottomSections.rall.pillar3.description'), citation: t('hero.bottomSections.rall.pillar3.citation') },
        { icon: ICONS.Users, title: t('hero.bottomSections.rall.pillar4.title'), description: t('hero.bottomSections.rall.pillar4.description'), citation: t('hero.bottomSections.rall.pillar4.citation') },
    ];

    return (
        <section id="rall-section" data-section={sectionIndex} className="relative py-16 md:py-24 px-4 md:px-16 lg:px-24 overflow-hidden" style={{ background: PL.golden }}>
            <div className="absolute inset-0 pointer-events-none" style={HALFTONE} />

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-8 md:mb-14">
                    <p className="text-xs md:text-sm font-black uppercase tracking-wider mb-2" style={{ color: PL.charcoal, fontFamily: '"Quicksand", sans-serif' }}>
                        {t('hero.bottomSections.rall.label')}
                    </p>
                    <h2
                        className="text-3xl md:text-5xl font-black uppercase mb-3"
                        style={{ fontFamily: '"Quicksand", sans-serif', textShadow: '3px 3px 0 #fff' }}
                    >
                        {t('hero.bottomSections.rall.title')}
                    </h2>
                    <p className="text-sm md:text-lg font-bold max-w-2xl mx-auto" style={{ color: '#4b5563' }}>
                        {t('hero.bottomSections.rall.description')}
                    </p>
                </div>

                {/* Pillar cards */}
                <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-12">
                    {pillars.map((pillar, index) => (
                        <div key={index} className="relative">
                            <MiniSticker text={stickerLabels[index]} color={pillarColors[index]} rotation={stickerRotations[index]} />
                            <div className="bg-white border-4 border-[#292F36] rounded-3xl p-4 md:p-6 shadow-[8px_8px_0_#292F36] hover:-translate-y-1 hover:shadow-[8px_12px_0_#292F36] transition-all">
                                {/* Icon badge */}
                                <div
                                    className="w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-[#292F36] flex items-center justify-center mb-3 shadow-[3px_3px_0_#292F36]"
                                    style={{ background: pillarColors[index] }}
                                >
                                    <pillar.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <h3 className="font-black text-xs md:text-base uppercase mb-1 md:mb-2" style={{ fontFamily: '"Quicksand", sans-serif', color: PL.charcoal }}>
                                    {pillar.title}
                                </h3>
                                <p className="text-xs md:text-sm font-bold line-clamp-3 md:line-clamp-none" style={{ color: '#4b5563' }}>
                                    {pillar.description}
                                </p>
                                <p className="text-[10px] md:text-xs font-bold mt-2 hidden md:block" style={{ color: pillarColors[index] }}>
                                    {pillar.citation}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quote speech bubble */}
                <div className="relative">
                    <div
                        className="bg-white border-4 border-[#292F36] rounded-3xl p-6 md:p-10 text-center shadow-[8px_8px_0_#292F36]"
                    >
                        <p className="text-sm md:text-xl font-black leading-relaxed" style={{ fontFamily: '"Quicksand", sans-serif', color: PL.charcoal }}>
                            {t('hero.bottomSections.rall.quote')}
                        </p>
                        <p className="text-xs md:text-sm mt-3 font-bold" style={{ color: accentColor }}>
                            {t('hero.bottomSections.rall.quoteAttribution')}
                        </p>
                    </div>
                    {/* Speech bubble tail */}
                    <div className="absolute -bottom-4 left-12 w-6 h-6 bg-white border-b-4 border-r-4 border-[#292F36]" style={{ transform: 'rotate(45deg)' }} />
                </div>

                {/* Anxiety note - hidden on mobile */}
                <div className="mt-6 md:mt-8 text-center hidden md:block">
                    <p className="text-sm font-bold" style={{ color: PL.charcoal }}>
                        <strong>{t('hero.bottomSections.rall.anxietyTitle')}</strong> {t('hero.bottomSections.rall.anxietyDesc')}
                    </p>
                    <p className="text-xs font-bold mt-2" style={{ color: accentColor }}>
                        {t('hero.bottomSections.rall.anxietyCitation')}
                    </p>
                </div>
            </div>
        </section>
    );
};

// ============================================
// 3. PlayfulBlog
// ============================================
export const PlayfulBlog: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? PL.coral : PL.teal;
    const cardColors = [PL.coral, PL.teal, PL.golden];

    const featuredTopics = [
        { title: t('hero.bottomSections.blog.topic1.title'), description: t('hero.bottomSections.blog.topic1.description'), icon: ICONS.Heart },
        { title: t('hero.bottomSections.blog.topic2.title'), description: t('hero.bottomSections.blog.topic2.description'), icon: ICONS.Globe },
        { title: t('hero.bottomSections.blog.topic3.title'), description: t('hero.bottomSections.blog.topic3.description'), icon: ICONS.BookOpen },
    ];

    return (
        <section data-section={sectionIndex} className="relative py-16 md:py-24 px-4 md:px-16 lg:px-24 overflow-hidden" style={{ background: PL.mint }}>
            <div className="absolute inset-0 pointer-events-none" style={HALFTONE} />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <p className="text-xs md:text-sm font-black uppercase tracking-wider mb-2" style={{ color: accentColor, fontFamily: '"Quicksand", sans-serif' }}>
                    {t('hero.bottomSections.blog.label')}
                </p>
                <h2
                    className="text-3xl md:text-5xl font-black uppercase mb-3"
                    style={{ fontFamily: '"Quicksand", sans-serif', textShadow: `3px 3px 0 ${accentColor}` }}
                >
                    {t('hero.bottomSections.blog.title')}
                </h2>
                <p className="text-sm md:text-lg font-bold mb-8 md:mb-12 max-w-2xl mx-auto" style={{ color: '#4b5563' }}>
                    {t('hero.bottomSections.blog.description')}
                </p>

                {/* Comic panel cards */}
                <div className="grid grid-cols-3 gap-3 md:gap-5 mb-8 md:mb-12">
                    {featuredTopics.map((topic, index) => (
                        <a
                            key={index}
                            href="https://www.lovelanguages.io/learn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-white border-4 border-[#292F36] rounded-2xl p-3 md:p-6 shadow-[6px_6px_0_#292F36] text-left hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] transition-all"
                        >
                            <div
                                className="w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-[#292F36] flex items-center justify-center mb-3 md:mb-4 shadow-[3px_3px_0_#292F36]"
                                style={{ background: cardColors[index] }}
                            >
                                <topic.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                            </div>
                            <h3 className="font-black text-xs md:text-base uppercase mb-1" style={{ fontFamily: '"Quicksand", sans-serif', color: PL.charcoal }}>
                                {topic.title}
                            </h3>
                            <p className="text-[10px] md:text-sm font-bold hidden md:block" style={{ color: '#4b5563' }}>
                                {topic.description}
                            </p>
                        </a>
                    ))}
                </div>

                {/* CTA + social */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                        href="https://www.lovelanguages.io/learn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 border-4 border-[#292F36] rounded-2xl font-black text-sm md:text-base uppercase text-white shadow-[6px_6px_0_#292F36] hover:-translate-y-1 hover:shadow-[6px_8px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all"
                        style={{ background: accentColor, fontFamily: '"Quicksand", sans-serif' }}
                    >
                        {t('hero.bottomSections.blog.cta')}
                        <ICONS.ExternalLink className="w-4 h-4" />
                    </a>
                    {/* Social buttons - mobile only */}
                    <a
                        href="https://instagram.com/lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden flex items-center gap-1.5 px-4 py-2.5 border-4 border-[#292F36] rounded-2xl font-black text-xs uppercase bg-white shadow-[4px_4px_0_#292F36] transition-all"
                        style={{ color: accentColor, fontFamily: '"Quicksand", sans-serif' }}
                    >
                        <ICONS.Instagram className="w-4 h-4" />
                        <span>{t('hero.bottomSections.footer.instagram')}</span>
                    </a>
                    <a
                        href="https://tiktok.com/@lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden flex items-center gap-1.5 px-4 py-2.5 border-4 border-[#292F36] rounded-2xl font-black text-xs uppercase bg-white shadow-[4px_4px_0_#292F36] transition-all"
                        style={{ color: accentColor, fontFamily: '"Quicksand", sans-serif' }}
                    >
                        <ICONS.Video className="w-4 h-4" />
                        <span>{t('hero.bottomSections.footer.tiktok')}</span>
                    </a>
                </div>
            </div>
        </section>
    );
};

// ============================================
// 4. PlayfulFooter
// ============================================
export const PlayfulFooter: React.FC<{
    isStudent: boolean;
    isVisible?: boolean;
    sectionIndex?: number;
}> = ({ isStudent, isVisible = true, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? PL.coral : PL.teal;

    return (
        <footer data-section={sectionIndex} className="relative border-t-8 border-[#292F36] py-8 md:py-14 px-4 md:px-16 lg:px-24" style={{ background: PL.mint }}>
            <div className="absolute inset-0 pointer-events-none" style={HALFTONE} />

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Tagline - desktop */}
                <div className="hidden md:block text-center mb-8">
                    <p
                        className="text-2xl lg:text-4xl font-black uppercase"
                        style={{ fontFamily: '"Quicksand", sans-serif', color: PL.charcoal }}
                    >
                        {t('hero.bottomSections.footer.tagline')} <span role="img" aria-label="hearts">💕</span>
                    </p>
                </div>

                {/* Social links - desktop */}
                <div className="hidden md:flex items-center justify-center gap-4 mb-8">
                    <a
                        href="https://instagram.com/lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 border-4 border-[#292F36] rounded-2xl font-black text-base uppercase bg-white shadow-[4px_4px_0_#292F36] hover:-translate-y-1 hover:shadow-[4px_6px_0_#292F36] transition-all"
                        style={{ color: accentColor, fontFamily: '"Quicksand", sans-serif' }}
                    >
                        <ICONS.Instagram className="w-5 h-5" />
                        <span>{t('hero.bottomSections.footer.instagram')}</span>
                    </a>
                    <a
                        href="https://tiktok.com/@lovelanguages.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 border-4 border-[#292F36] rounded-2xl font-black text-base uppercase bg-white shadow-[4px_4px_0_#292F36] hover:-translate-y-1 hover:shadow-[4px_6px_0_#292F36] transition-all"
                        style={{ color: accentColor, fontFamily: '"Quicksand", sans-serif' }}
                    >
                        <ICONS.Video className="w-5 h-5" />
                        <span>{t('hero.bottomSections.footer.tiktok')}</span>
                    </a>
                </div>

                {/* Footer links */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6 text-xs md:text-sm mb-3 md:mb-6">
                    <a href="#/terms" className="font-black uppercase hover:underline transition-colors" style={{ color: '#6b7280', fontFamily: '"Quicksand", sans-serif' }}>{t('hero.bottomSections.footer.terms')}</a>
                    <span className="font-black" style={{ color: PL.charcoal }}>.</span>
                    <a href="#/privacy" className="font-black uppercase hover:underline transition-colors" style={{ color: '#6b7280', fontFamily: '"Quicksand", sans-serif' }}>{t('hero.bottomSections.footer.privacy')}</a>
                    <span className="font-black" style={{ color: PL.charcoal }}>.</span>
                    <a href="https://www.lovelanguages.io/learn/" target="_blank" rel="noopener noreferrer" className="font-black uppercase hover:underline transition-colors" style={{ color: '#6b7280', fontFamily: '"Quicksand", sans-serif' }}>{t('hero.bottomSections.footer.blog')}</a>
                    <span className="font-black" style={{ color: PL.charcoal }}>.</span>
                    <a href="mailto:hello@lovelanguages.xyz" className="font-black uppercase hover:underline transition-colors" style={{ color: '#6b7280', fontFamily: '"Quicksand", sans-serif' }}>{t('hero.bottomSections.footer.contact')}</a>
                </div>

                {/* Copyright */}
                <div className="text-center text-xs font-bold" style={{ color: '#9ca3af' }}>
                    &copy; {new Date().getFullYear()} {t('hero.bottomSections.footer.copyright')} <span role="img" aria-label="heart">&#10084;&#65039;</span>
                </div>
            </div>

            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </footer>
    );
};

// ============================================
// 5. PlayfulGameShowcaseWrapper
// ============================================
export const PlayfulGameShowcaseWrapper: React.FC<{
    isStudent: boolean;
    accentColor: string;
    sectionIndex?: number;
    isMobile?: boolean;
    targetLanguage?: string | null;
    nativeLanguage?: string | null;
}> = ({ isStudent, accentColor, sectionIndex, isMobile, targetLanguage, nativeLanguage }) => (
    <div className="bg-white border-8 border-[#292F36] rounded-[3rem] p-4 sm:p-6 md:p-10 shadow-[20px_20px_0_#292F36]">
        <GameShowcase
            isStudent={isStudent}
            accentColor={accentColor}
            sectionIndex={sectionIndex}
            isMobile={isMobile}
            targetLanguage={targetLanguage}
            nativeLanguage={nativeLanguage}
        />
    </div>
);
