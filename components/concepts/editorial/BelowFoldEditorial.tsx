import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { GameShowcase } from '../../hero/GameShowcase';

// Design tokens (matches HeroEditorial)
const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"Outfit", sans-serif';
const COLOR = {
    text: '#292F36',
    textMuted: 'rgba(41,47,54,0.5)',
    textFaint: 'rgba(41,47,54,0.25)',
    coral: '#FF6B6B',
    teal: '#4ECDC4',
    warmWhite: '#FAFAF7',
    divider: 'rgba(41,47,54,0.08)',
};

// Intersection observer hook
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

// Animated divider
function AnimatedDivider({ color = COLOR.divider, width = '100%', delay = 0 }: {
    color?: string; width?: string; delay?: number;
}) {
    const { ref, isInView } = useInView();
    return (
        <div ref={ref} className="overflow-hidden" style={{ maxWidth: width }}>
            <div style={{
                height: '1px', background: color,
                transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: `transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
            }} />
        </div>
    );
}

// Chapter marker
function ChapterMarker({ label, title }: { label: string; title: string }) {
    const { ref, isInView } = useInView();
    return (
        <div ref={ref} className="text-center mb-16 md:mb-24">
            <div className="flex items-center justify-center gap-4 mb-6">
                <span className="w-8 h-[1px]" style={{ background: `${COLOR.coral}40` }} />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: COLOR.coral, fontFamily: SANS }}>
                    {label}
                </span>
                <span className="w-8 h-[1px]" style={{ background: `${COLOR.coral}40` }} />
            </div>
            <h2
                className="text-3xl md:text-5xl font-semibold tracking-tight"
                style={{
                    fontFamily: SERIF, color: COLOR.text,
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
                }}
            >
                {title}
            </h2>
        </div>
    );
}

// ═════════════════════════════════════════════
// 1. EDITORIAL FAQ
// ═════════════════════════════════════════════
interface SectionProps {
    isStudent: boolean;
    sectionIndex?: number;
    isVisible?: boolean;
}

export const EditorialFAQ: React.FC<SectionProps> = ({ isStudent, sectionIndex }) => {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const accentColor = isStudent ? COLOR.coral : COLOR.teal;

    const faqItems = [
        { question: t('hero.bottomSections.faq.q1.question'), answer: <p>{t('hero.bottomSections.faq.q1.answer')} <a href="#rall-section" style={{ color: accentColor, borderBottom: `1px solid ${accentColor}` }}>{t('hero.bottomSections.faq.q1.readMore')}</a></p> },
        { question: t('hero.bottomSections.faq.q2.question'), answer: <><p className="mb-4">{t('hero.bottomSections.faq.q2.intro')}</p><ul className="space-y-3" style={{ listStyle: 'none', padding: 0 }}><li><strong style={{ fontFamily: SERIF }}>{t('hero.bottomSections.faq.q2.point1')}</strong> {t('hero.bottomSections.faq.q2.point1desc')}</li><li><strong style={{ fontFamily: SERIF }}>{t('hero.bottomSections.faq.q2.point2')}</strong> {t('hero.bottomSections.faq.q2.point2desc')}</li><li><strong style={{ fontFamily: SERIF }}>{t('hero.bottomSections.faq.q2.point3')}</strong> {t('hero.bottomSections.faq.q2.point3desc')}</li><li><strong style={{ fontFamily: SERIF }}>{t('hero.bottomSections.faq.q2.point4')}</strong> {t('hero.bottomSections.faq.q2.point4desc')}</li></ul></> },
        { question: t('hero.bottomSections.faq.q3.question'), answer: <><p className="mb-3">{t('hero.bottomSections.faq.q3.studentDesc')}</p><p>{t('hero.bottomSections.faq.q3.tutorDesc')}</p></> },
        { question: t('hero.bottomSections.faq.q4.question'), answer: <p>{t('hero.bottomSections.faq.q4.answer')}</p> },
        {
            question: t('hero.bottomSections.faq.q5.question'),
            answer: (
                <>
                    <p className="mb-6">{t('hero.bottomSections.faq.q5.intro')}</p>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="py-5 px-6" style={{ border: `1px solid ${COLOR.divider}` }}>
                            <p className="font-semibold mb-1" style={{ fontFamily: SERIF }}>{t('hero.bottomSections.faq.q5.standard')}</p>
                            <p className="text-sm mb-2" style={{ color: COLOR.textMuted }}>{t('hero.bottomSections.faq.q5.standardPrice')}</p>
                            <p className="text-xs" style={{ color: COLOR.textFaint }}>{t('hero.bottomSections.faq.q5.standardDesc')}</p>
                        </div>
                        <div className="py-5 px-6" style={{ border: `1px solid ${accentColor}`, borderWidth: '1.5px' }}>
                            <p className="font-semibold mb-1" style={{ fontFamily: SERIF }}>{t('hero.bottomSections.faq.q5.unlimited')}</p>
                            <p className="text-sm mb-2" style={{ color: accentColor }}>{t('hero.bottomSections.faq.q5.unlimitedPrice')}</p>
                            <p className="text-xs" style={{ color: COLOR.textMuted }}>{t('hero.bottomSections.faq.q5.unlimitedDesc')}</p>
                        </div>
                    </div>
                    <p className="text-sm" style={{ color: COLOR.textMuted }}>{t('hero.bottomSections.faq.q5.cancelNote')}</p>
                </>
            ),
        },
        { question: t('hero.bottomSections.faq.q6.question'), answer: <p>{t('hero.bottomSections.faq.q6.answer')}</p> },
    ];

    return (
        <section data-section={sectionIndex} className="py-20 md:py-32 px-6 md:px-16 lg:px-24 bg-white">
            <div className="max-w-3xl mx-auto">
                <ChapterMarker label="Chapter III" title={t('hero.bottomSections.faq.title')} />
                <div>
                    {faqItems.map((item, i) => (
                        <div key={i}>
                            {i > 0 && <AnimatedDivider delay={i * 0.05} />}
                            <div className="py-8 md:py-10">
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full text-left flex items-start gap-4 group"
                                >
                                    <h3
                                        className="text-xl md:text-2xl font-semibold tracking-tight flex-1 transition-colors duration-300"
                                        style={{
                                            fontFamily: SERIF,
                                            color: openIndex === i ? COLOR.text : COLOR.textMuted,
                                        }}
                                    >
                                        {item.question}
                                    </h3>
                                    <span
                                        className="mt-2 text-sm transition-transform duration-300 flex-shrink-0"
                                        style={{
                                            color: COLOR.textFaint,
                                            transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0)',
                                        }}
                                    >
                                        +
                                    </span>
                                </button>
                                <div
                                    style={{
                                        maxHeight: openIndex === i ? '600px' : '0',
                                        opacity: openIndex === i ? 1 : 0,
                                        overflow: 'hidden',
                                        transition: 'max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
                                        borderLeft: openIndex === i ? `3px solid ${accentColor}` : '3px solid transparent',
                                        paddingLeft: openIndex === i ? '16px' : '16px',
                                    }}
                                >
                                    <div
                                        className="pt-5 text-base md:text-lg font-light leading-[1.9]"
                                        style={{ fontFamily: SANS, color: COLOR.textMuted }}
                                    >
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ═════════════════════════════════════════════
// 2. EDITORIAL RALL
// ═════════════════════════════════════════════
export const EditorialRALL: React.FC<SectionProps> = ({ isStudent, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? COLOR.coral : COLOR.teal;

    const pillars = [
        { icon: ICONS.MessageCircle, title: t('hero.bottomSections.rall.pillar1.title'), desc: t('hero.bottomSections.rall.pillar1.description'), citation: t('hero.bottomSections.rall.pillar1.citation'), num: '01' },
        { icon: ICONS.Target, title: t('hero.bottomSections.rall.pillar2.title'), desc: t('hero.bottomSections.rall.pillar2.description'), citation: t('hero.bottomSections.rall.pillar2.citation'), num: '02' },
        { icon: ICONS.Heart, title: t('hero.bottomSections.rall.pillar3.title'), desc: t('hero.bottomSections.rall.pillar3.description'), citation: t('hero.bottomSections.rall.pillar3.citation'), num: '03' },
        { icon: ICONS.Users, title: t('hero.bottomSections.rall.pillar4.title'), desc: t('hero.bottomSections.rall.pillar4.description'), citation: t('hero.bottomSections.rall.pillar4.citation'), num: '04' },
    ];

    return (
        <section id="rall-section" data-section={sectionIndex} className="py-20 md:py-32 px-6 md:px-16 lg:px-24" style={{ background: COLOR.warmWhite }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: accentColor, fontFamily: SANS }}>
                        {t('hero.bottomSections.rall.label')}
                    </span>
                </div>
                <h2
                    className="text-3xl md:text-5xl font-semibold tracking-tight text-center mb-4"
                    style={{ fontFamily: SERIF, color: COLOR.text }}
                >
                    {t('hero.bottomSections.rall.title')}
                </h2>
                <p className="text-center text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto mb-20" style={{ fontFamily: SANS, color: COLOR.textMuted }}>
                    {t('hero.bottomSections.rall.description')}
                </p>

                {/* Pillars as numbered chapters */}
                <div className="space-y-16 md:space-y-24 mb-20 md:mb-28">
                    {pillars.map((p, i) => {
                        const PillarItem = () => {
                            const { ref, isInView } = useInView();
                            const Icon = p.icon;
                            return (
                                <div ref={ref}>
                                    <AnimatedDivider color={`${accentColor}30`} width="80px" delay={0.1} />
                                    <div className="flex items-start gap-6 md:gap-10 mt-6">
                                        <span
                                            className="text-6xl md:text-8xl font-black leading-none select-none flex-shrink-0"
                                            style={{
                                                fontFamily: SERIF, color: 'rgba(41,47,54,0.04)',
                                                opacity: isInView ? 1 : 0,
                                                transform: isInView ? 'translateY(0)' : 'translateY(30px)',
                                                transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        >
                                            {p.num}
                                        </span>
                                        <div className="flex-1 pt-2">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                                                <h3
                                                    className="text-xl md:text-2xl font-semibold tracking-tight"
                                                    style={{
                                                        fontFamily: SERIF, color: COLOR.text,
                                                        opacity: isInView ? 1 : 0,
                                                        transform: isInView ? 'translateY(0)' : 'translateY(15px)',
                                                        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                                                    }}
                                                >
                                                    {p.title}
                                                </h3>
                                            </div>
                                            <p
                                                className="text-base md:text-lg font-light leading-[1.9] mb-3 max-w-xl"
                                                style={{
                                                    fontFamily: SANS, color: COLOR.textMuted,
                                                    opacity: isInView ? 1 : 0,
                                                    transform: isInView ? 'translateY(0)' : 'translateY(15px)',
                                                    transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
                                                }}
                                            >
                                                {p.desc}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: accentColor }}>
                                                {p.citation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        };
                        return <PillarItem key={i} />;
                    })}
                </div>

                {/* Pull quote */}
                <PullQuoteInline text={t('hero.bottomSections.rall.quote')} attribution={t('hero.bottomSections.rall.quoteAttribution')} />

                {/* Anxiety footnote */}
                <div className="mt-12 md:mt-16 text-center max-w-xl mx-auto">
                    <AnimatedDivider width="40px" delay={0.1} />
                    <p className="mt-6 text-sm font-light leading-relaxed" style={{ fontFamily: SANS, color: COLOR.textMuted }}>
                        <strong style={{ fontFamily: SERIF, fontWeight: 600 }}>{t('hero.bottomSections.rall.anxietyTitle')}</strong>{' '}
                        {t('hero.bottomSections.rall.anxietyDesc')}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] mt-3 font-medium" style={{ color: accentColor }}>
                        {t('hero.bottomSections.rall.anxietyCitation')}
                    </p>
                </div>
            </div>
        </section>
    );
};

// Inline pull quote (lighter version for RALL section)
function PullQuoteInline({ text, attribution }: { text: string; attribution?: string }) {
    const { ref, isInView } = useInView();
    return (
        <div ref={ref} className="py-12 md:py-20 text-center relative">
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none"
                style={{
                    fontSize: 'clamp(80px, 12vw, 180px)', lineHeight: 1, fontFamily: SERIF,
                    color: 'rgba(255,107,107,0.05)',
                    opacity: isInView ? 1 : 0,
                    transition: 'opacity 1s ease 0.1s',
                }}
            >
                &ldquo;
            </div>
            <blockquote
                className="relative z-10 max-w-3xl mx-auto px-4"
                style={{
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                }}
            >
                <p className="text-2xl md:text-4xl italic leading-tight tracking-tight font-light" style={{ fontFamily: SERIF, color: COLOR.text }}>
                    {text}
                </p>
                {attribution && (
                    <footer className="mt-6 text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ fontFamily: SANS, color: COLOR.coral }}>
                        &mdash; {attribution}
                    </footer>
                )}
            </blockquote>
        </div>
    );
}

// ═════════════════════════════════════════════
// 3. EDITORIAL BLOG
// ═════════════════════════════════════════════
export const EditorialBlog: React.FC<SectionProps> = ({ isStudent, sectionIndex }) => {
    const { t } = useTranslation();
    const accentColor = isStudent ? COLOR.coral : COLOR.teal;

    const topics = [
        { title: t('hero.bottomSections.blog.topic1.title'), desc: t('hero.bottomSections.blog.topic1.description'), icon: ICONS.Heart },
        { title: t('hero.bottomSections.blog.topic2.title'), desc: t('hero.bottomSections.blog.topic2.description'), icon: ICONS.Globe },
        { title: t('hero.bottomSections.blog.topic3.title'), desc: t('hero.bottomSections.blog.topic3.description'), icon: ICONS.BookOpen },
    ];

    return (
        <section data-section={sectionIndex} className="py-20 md:py-32 px-6 md:px-16 lg:px-24 bg-white">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: accentColor, fontFamily: SANS }}>
                        {t('hero.bottomSections.blog.label')}
                    </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center mb-4" style={{ fontFamily: SERIF, color: COLOR.text }}>
                    {t('hero.bottomSections.blog.title')}
                </h2>
                <p className="text-center text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto mb-16" style={{ fontFamily: SANS, color: COLOR.textMuted }}>
                    {t('hero.bottomSections.blog.description')}
                </p>

                {/* Topic entries */}
                <div className="mb-12">
                    {topics.map((topic, i) => {
                        const Icon = topic.icon;
                        return (
                            <a
                                key={i}
                                href="https://www.lovelanguages.io/learn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                {i > 0 && <div className="h-[1px] w-full" style={{ background: COLOR.divider }} />}
                                <div className="py-8 md:py-10 flex items-start gap-4">
                                    <Icon className="w-4 h-4 mt-1.5 flex-shrink-0" style={{ color: accentColor }} />
                                    <div className="flex-1">
                                        <h3
                                            className="text-lg md:text-xl font-semibold tracking-tight mb-2 transition-all duration-300 group-hover:translate-x-2"
                                            style={{
                                                fontFamily: SERIF, color: COLOR.text,
                                                transitionProperty: 'transform, color',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = COLOR.text)}
                                        >
                                            {topic.title}
                                        </h3>
                                        <p className="text-sm md:text-base font-light leading-relaxed" style={{ fontFamily: SANS, color: COLOR.textMuted }}>
                                            {topic.desc}
                                        </p>
                                    </div>
                                    <span
                                        className="mt-1.5 text-sm transition-all duration-300 group-hover:translate-x-1 flex-shrink-0"
                                        style={{ color: COLOR.textFaint }}
                                    >
                                        &rarr;
                                    </span>
                                </div>
                            </a>
                        );
                    })}
                    <div className="h-[1px] w-full" style={{ background: COLOR.divider }} />
                </div>

                <div className="flex flex-col items-center gap-6">
                    <a href="https://www.lovelanguages.io/learn/" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium transition-opacity duration-300 hover:opacity-70"
                        style={{ color: accentColor }}
                    >
                        {t('hero.bottomSections.blog.cta')} <span>&rarr;</span>
                    </a>
                    <div className="flex items-center gap-4 md:hidden">
                        <a href="https://instagram.com/lovelanguages.xyz" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: COLOR.textMuted }}
                        >{t('hero.bottomSections.footer.instagram')}</a>
                        <span style={{ color: COLOR.textFaint }}>&middot;</span>
                        <a href="https://tiktok.com/@lovelanguages.xyz" target="_blank" rel="noopener noreferrer"
                            className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: COLOR.textMuted }}
                        >{t('hero.bottomSections.footer.tiktok')}</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ═════════════════════════════════════════════
// 4. EDITORIAL FOOTER
// ═════════════════════════════════════════════
const FooterLink: React.FC<{ href: string; label: string; className?: string; external?: boolean }> = ({ href, label, className = '', external }) => (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${className}`}
        style={{ color: COLOR.textMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.color = COLOR.coral)}
        onMouseLeave={(e) => (e.currentTarget.style.color = COLOR.textMuted)}
    >{label}</a>
);
const Dot: React.FC<{ className?: string }> = ({ className = '' }) => (
    <span className={`text-[10px] ${className}`} style={{ color: COLOR.textFaint }}>&middot;</span>
);

export const EditorialFooter: React.FC<SectionProps> = ({ sectionIndex }) => {
    const { t } = useTranslation();
    return (
        <footer data-section={sectionIndex} className="py-12 md:py-20 px-6 md:px-16 lg:px-24" style={{ background: COLOR.warmWhite }}>
            <div className="max-w-4xl mx-auto text-center">
                <p className="text-lg md:text-xl font-light tracking-wide mb-8" style={{ fontFamily: SERIF, color: COLOR.textMuted }}>
                    {t('hero.bottomSections.footer.tagline')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-6">
                    <FooterLink href="#/terms" label={t('hero.bottomSections.footer.terms')} />
                    <Dot />
                    <FooterLink href="#/privacy" label={t('hero.bottomSections.footer.privacy')} />
                    <Dot />
                    <FooterLink href="https://www.lovelanguages.io/learn/" label={t('hero.bottomSections.footer.blog')} external />
                    <Dot />
                    <FooterLink href="mailto:hello@lovelanguages.xyz" label={t('hero.bottomSections.footer.contact')} />
                    <Dot className="hidden md:inline" />
                    <FooterLink href="https://instagram.com/lovelanguages.xyz" label={t('hero.bottomSections.footer.instagram')} external className="hidden md:inline" />
                    <Dot className="hidden md:inline" />
                    <FooterLink href="https://tiktok.com/@lovelanguages.xyz" label={t('hero.bottomSections.footer.tiktok')} external className="hidden md:inline" />
                </div>
                <p className="text-[10px] tracking-[0.15em]" style={{ color: COLOR.textFaint, fontFamily: SANS }}>
                    &copy; {new Date().getFullYear()} {t('hero.bottomSections.footer.copyright')}
                </p>
            </div>
            <style>{`@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;}}`}</style>
        </footer>
    );
};

// ═════════════════════════════════════════════
// 5. EDITORIAL GAME SHOWCASE WRAPPER
// ═════════════════════════════════════════════
export const EditorialGameShowcaseWrapper: React.FC<{
    isStudent: boolean;
    accentColor: string;
    sectionIndex?: number;
    isMobile?: boolean;
    targetLanguage?: string | null;
    nativeLanguage?: string | null;
}> = (props) => {
    return (
        <div className="bg-white p-6 md:p-16 lg:p-20 relative">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t border-l" style={{ borderColor: 'rgba(41,47,54,0.15)' }} />
            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r" style={{ borderColor: 'rgba(41,47,54,0.15)' }} />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l" style={{ borderColor: 'rgba(41,47,54,0.15)' }} />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r" style={{ borderColor: 'rgba(41,47,54,0.15)' }} />

            <GameShowcase
                isStudent={props.isStudent}
                accentColor={props.accentColor}
                sectionIndex={props.sectionIndex}
                isMobile={props.isMobile ?? false}
                targetLanguage={props.targetLanguage}
                nativeLanguage={props.nativeLanguage}
            />
        </div>
    );
};
