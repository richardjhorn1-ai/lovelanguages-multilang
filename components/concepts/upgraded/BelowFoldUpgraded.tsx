import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { GameShowcase } from '../../hero/GameShowcase';

// Accent palette (matching HeroUpgraded)
const CORAL = '#FF6B6B';
const TEAL = '#4ECDC4';
const GOLD = '#FFE66D';

// Shared glass card classes
const GLASS = 'bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl';
const GLASS_HOVER = 'hover:border-white/[0.12]';
const HEADER_FONT: React.CSSProperties = { fontFamily: '"Quicksand", sans-serif' };
const BODY_FONT: React.CSSProperties = { fontFamily: '"Outfit", sans-serif' };

// ============================================
// 1. FAQ
// ============================================
export const UpgradedFAQ: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const accent = isStudent ? CORAL : TEAL;

  const faqItems = [
    {
      question: t('hero.bottomSections.faq.q1.question'),
      answer: (
        <p>{t('hero.bottomSections.faq.q1.answer')}{' '}
          <a href="#rall-section" className="font-bold underline" style={{ color: accent }}>{t('hero.bottomSections.faq.q1.readMore')}</a>
        </p>
      ),
    },
    {
      question: t('hero.bottomSections.faq.q2.question'),
      answer: (
        <>
          <p className="mb-3">{t('hero.bottomSections.faq.q2.intro')}</p>
          <ul className="list-disc ml-5 space-y-1 text-white/40">
            <li><strong className="text-white/60">{t('hero.bottomSections.faq.q2.point1')}</strong> {t('hero.bottomSections.faq.q2.point1desc')}</li>
            <li><strong className="text-white/60">{t('hero.bottomSections.faq.q2.point2')}</strong> {t('hero.bottomSections.faq.q2.point2desc')}</li>
            <li><strong className="text-white/60">{t('hero.bottomSections.faq.q2.point3')}</strong> {t('hero.bottomSections.faq.q2.point3desc')}</li>
            <li><strong className="text-white/60">{t('hero.bottomSections.faq.q2.point4')}</strong> {t('hero.bottomSections.faq.q2.point4desc')}</li>
          </ul>
        </>
      ),
    },
    {
      question: t('hero.bottomSections.faq.q3.question'),
      answer: (<><p className="mb-3">{t('hero.bottomSections.faq.q3.studentDesc')}</p><p>{t('hero.bottomSections.faq.q3.tutorDesc')}</p></>),
    },
    {
      question: t('hero.bottomSections.faq.q4.question'),
      answer: <p>{t('hero.bottomSections.faq.q4.answer')}</p>,
    },
    {
      question: t('hero.bottomSections.faq.q5.question'),
      answer: (
        <>
          <p className="mb-4">{t('hero.bottomSections.faq.q5.intro')}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`${GLASS} p-4`}>
              <p className="font-bold text-white/80">{t('hero.bottomSections.faq.q5.standard')}</p>
              <p className="text-sm text-white/50">{t('hero.bottomSections.faq.q5.standardPrice')}</p>
              <p className="text-xs mt-1 text-white/30">{t('hero.bottomSections.faq.q5.standardDesc')}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-4" style={{ border: `2px solid ${accent}`, boxShadow: `0 0 20px -6px ${accent}40` }}>
              <p className="font-bold text-white/90">{t('hero.bottomSections.faq.q5.unlimited')}</p>
              <p className="text-sm" style={{ color: accent }}>{t('hero.bottomSections.faq.q5.unlimitedPrice')}</p>
              <p className="text-xs mt-1 text-white/40">{t('hero.bottomSections.faq.q5.unlimitedDesc')}</p>
            </div>
          </div>
          <p className="text-sm text-white/40">{t('hero.bottomSections.faq.q5.cancelNote')}</p>
        </>
      ),
    },
    {
      question: t('hero.bottomSections.faq.q6.question'),
      answer: <p>{t('hero.bottomSections.faq.q6.answer')}</p>,
    },
  ];

  return (
    <section data-section={sectionIndex} className="py-16 md:py-24 px-4 md:px-16 lg:px-24 relative" style={BODY_FONT}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#FF6B6B]/20 to-transparent" />
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-white" style={HEADER_FONT}>
          {t('hero.bottomSections.faq.title')}
        </h2>
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`${GLASS} overflow-hidden transition-all duration-300`}
                style={isOpen ? { borderColor: 'rgba(255,255,255,0.12)', boxShadow: `0 4px 24px -4px ${accent}15` } : undefined}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left"
                >
                  <span className="font-bold text-sm md:text-base text-white pr-4">{item.question}</span>
                  <ICONS.ChevronDown
                    className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: accent }}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 pb-4 md:px-5 md:pb-5 text-sm md:text-base leading-relaxed text-white/50">
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
// 2. RALL (Research-Backed Approach)
// ============================================
export const UpgradedRALL: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accent = isStudent ? CORAL : TEAL;

  const iconColors = [
    { from: CORAL, to: '#FF8E8E' },
    { from: TEAL, to: '#7BEDE6' },
    { from: GOLD, to: '#FFF09E' },
    { from: '#A78BFA', to: '#C4B5FD' },
  ];

  const pillars = [
    { Icon: ICONS.MessageCircle, title: t('hero.bottomSections.rall.pillar1.title'), description: t('hero.bottomSections.rall.pillar1.description'), citation: t('hero.bottomSections.rall.pillar1.citation') },
    { Icon: ICONS.Target, title: t('hero.bottomSections.rall.pillar2.title'), description: t('hero.bottomSections.rall.pillar2.description'), citation: t('hero.bottomSections.rall.pillar2.citation') },
    { Icon: ICONS.Heart, title: t('hero.bottomSections.rall.pillar3.title'), description: t('hero.bottomSections.rall.pillar3.description'), citation: t('hero.bottomSections.rall.pillar3.citation') },
    { Icon: ICONS.Users, title: t('hero.bottomSections.rall.pillar4.title'), description: t('hero.bottomSections.rall.pillar4.description'), citation: t('hero.bottomSections.rall.pillar4.citation') },
  ];

  return (
    <section id="rall-section" data-section={sectionIndex} className="py-16 md:py-24 px-4 md:px-16 lg:px-24 relative" style={BODY_FONT}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#4ECDC4]/20 to-transparent" />
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8 md:mb-14">
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest mb-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
            {t('hero.bottomSections.rall.label')}
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3" style={HEADER_FONT}>
            {t('hero.bottomSections.rall.title')}
          </h2>
          <p className="text-sm md:text-lg text-white/40 max-w-2xl mx-auto">
            {t('hero.bottomSections.rall.description')}
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8 md:mb-12">
          {pillars.map((pillar, i) => (
            <div key={i} className={`group relative ${GLASS} ${GLASS_HOVER} p-4 md:p-6 transition-all duration-300`}>
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${iconColors[i].from}15, transparent 70%)` }}
              />
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 relative z-10"
                style={{ background: `linear-gradient(135deg, ${iconColors[i].from}, ${iconColors[i].to})`, boxShadow: `0 4px 16px -4px ${iconColors[i].from}40` }}
              >
                <pillar.Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="font-bold text-sm md:text-base text-white mb-1 md:mb-2 relative z-10" style={HEADER_FONT}>
                {pillar.title}
              </h3>
              <p className="text-xs md:text-sm text-white/40 leading-relaxed line-clamp-3 md:line-clamp-none relative z-10">
                {pillar.description}
              </p>
              <p className="text-[10px] md:text-xs mt-2 md:mt-3 hidden md:block relative z-10 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent font-medium">
                {pillar.citation}
              </p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-[2px] mx-auto mb-6 bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4] rounded-full" />
          <p className="text-base md:text-xl text-white/80 font-medium leading-relaxed max-w-2xl mx-auto italic">
            {t('hero.bottomSections.rall.quote')}
          </p>
          <p className="text-xs md:text-sm mt-3 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent font-medium">
            {t('hero.bottomSections.rall.quoteAttribution')}
          </p>
        </div>

        {/* Anxiety Note - hidden on mobile */}
        <div className="hidden md:block text-center">
          <p className="text-sm text-white/30">
            <strong className="text-white/40">{t('hero.bottomSections.rall.anxietyTitle')}</strong>{' '}
            {t('hero.bottomSections.rall.anxietyDesc')}
          </p>
          <p className="text-xs mt-2 text-white/20">{t('hero.bottomSections.rall.anxietyCitation')}</p>
        </div>
      </div>
    </section>
  );
};

// ============================================
// 3. BLOG
// ============================================
export const UpgradedBlog: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accent = isStudent ? CORAL : TEAL;

  const topicIcons = [
    { Icon: ICONS.Heart, from: CORAL, to: '#FF8E8E' },
    { Icon: ICONS.Globe, from: TEAL, to: '#7BEDE6' },
    { Icon: ICONS.BookOpen, from: GOLD, to: '#FFF09E' },
  ];

  const topics = [
    { title: t('hero.bottomSections.blog.topic1.title'), description: t('hero.bottomSections.blog.topic1.description') },
    { title: t('hero.bottomSections.blog.topic2.title'), description: t('hero.bottomSections.blog.topic2.description') },
    { title: t('hero.bottomSections.blog.topic3.title'), description: t('hero.bottomSections.blog.topic3.description') },
  ];

  return (
    <section data-section={sectionIndex} className="py-16 md:py-24 px-4 md:px-16 lg:px-24 relative" style={BODY_FONT}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#FFE66D]/20 to-transparent" />
      <div className="max-w-4xl mx-auto text-center w-full">
        <p className="text-xs md:text-sm font-bold uppercase tracking-widest mb-2 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
          {t('hero.bottomSections.blog.label')}
        </p>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3" style={HEADER_FONT}>
          {t('hero.bottomSections.blog.title')}
        </h2>
        <p className="text-sm md:text-lg text-white/40 max-w-2xl mx-auto mb-8 md:mb-12">
          {t('hero.bottomSections.blog.description')}
        </p>

        {/* Topic Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-5 mb-8 md:mb-12">
          {topics.map((topic, i) => {
            const ic = topicIcons[i];
            return (
              <a
                key={i}
                href="https://www.lovelanguages.io/learn/"
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative ${GLASS} ${GLASS_HOVER} p-4 md:p-6 text-left transition-all duration-300 hover:-translate-y-1`}
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${ic.from}15, transparent 70%)` }}
                />
                <div
                  className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 relative z-10"
                  style={{ background: `linear-gradient(135deg, ${ic.from}, ${ic.to})`, boxShadow: `0 4px 16px -4px ${ic.from}40` }}
                >
                  <ic.Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-bold text-xs md:text-base text-white mb-1 relative z-10" style={HEADER_FONT}>{topic.title}</h3>
                <p className="text-[10px] md:text-sm text-white/40 hidden md:block relative z-10">{topic.description}</p>
              </a>
            );
          })}
        </div>

        {/* CTA + Social */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://www.lovelanguages.io/learn/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-sm md:text-base text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${CORAL}, #ff8e8e)`,
              boxShadow: `0 8px 32px -8px ${CORAL}80`,
            }}
          >
            {t('hero.bottomSections.blog.cta')}
            <ICONS.ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </a>
          {/* Social buttons - mobile only */}
          <a
            href="https://instagram.com/lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs bg-white/[0.06] border border-white/[0.08] text-white/60 transition-all hover:text-white/80 hover:border-white/[0.12]"
          >
            <ICONS.Instagram className="w-3.5 h-3.5" />
            <span>{t('hero.bottomSections.footer.instagram')}</span>
          </a>
          <a
            href="https://tiktok.com/@lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs bg-white/[0.06] border border-white/[0.08] text-white/60 transition-all hover:text-white/80 hover:border-white/[0.12]"
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
// 4. FOOTER
// ============================================
export const UpgradedFooter: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accent = isStudent ? CORAL : TEAL;

  return (
    <footer data-section={sectionIndex} className="py-8 md:py-16 px-4 md:px-16 lg:px-24 relative" style={BODY_FONT}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="max-w-4xl mx-auto">
        {/* Tagline - hidden on mobile */}
        <div className="hidden md:block text-center mb-10">
          <p className="text-lg md:text-2xl font-bold text-white/80 tracking-widest uppercase" style={HEADER_FONT}>
            {t('hero.bottomSections.footer.tagline')}
          </p>
        </div>

        {/* Social Links - desktop only */}
        <div className="hidden md:flex items-center justify-center gap-4 mb-10">
          <a
            href="https://instagram.com/lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm ${GLASS} ${GLASS_HOVER} text-white/60 hover:text-white/80 transition-all duration-300`}
          >
            <ICONS.Instagram className="w-4 h-4" />
            <span>{t('hero.bottomSections.footer.instagram')}</span>
          </a>
          <a
            href="https://tiktok.com/@lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm ${GLASS} ${GLASS_HOVER} text-white/60 hover:text-white/80 transition-all duration-300`}
          >
            <ICONS.Video className="w-4 h-4" />
            <span>{t('hero.bottomSections.footer.tiktok')}</span>
          </a>
        </div>

        {/* Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-5 text-[10px] md:text-xs mb-4 md:mb-8 tracking-widest uppercase">
          <a href="#/terms" className="text-white/30 hover:text-white/60 font-medium transition-colors">{t('hero.bottomSections.footer.terms')}</a>
          <span className="text-white/10">·</span>
          <a href="#/privacy" className="text-white/30 hover:text-white/60 font-medium transition-colors">{t('hero.bottomSections.footer.privacy')}</a>
          <span className="text-white/10">·</span>
          <a href="https://www.lovelanguages.io/learn/" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 font-medium transition-colors">{t('hero.bottomSections.footer.blog')}</a>
          <span className="text-white/10">·</span>
          <a href="mailto:hello@lovelanguages.xyz" className="text-white/30 hover:text-white/60 font-medium transition-colors">{t('hero.bottomSections.footer.contact')}</a>
        </div>

        {/* Copyright */}
        <div className="text-center text-[10px] md:text-xs text-white/20">
          &copy; {new Date().getFullYear()} {t('hero.bottomSections.footer.copyright')}
        </div>
      </div>
    </footer>
  );
};

// ============================================
// 5. GAME SHOWCASE WRAPPER
// ============================================
export const UpgradedGameShowcaseWrapper: React.FC<{
  isStudent: boolean;
  accentColor: string;
  sectionIndex?: number;
  isMobile?: boolean;
  targetLanguage?: string | null;
  nativeLanguage?: string | null;
}> = (props) => {
  return (
    <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-[3rem] p-8 md:p-16 border border-white/[0.06] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.4)]">
      {/* Corner glow accents */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-[#FF6B6B]/10 to-transparent rounded-tl-[3rem] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#4ECDC4]/10 to-transparent rounded-br-[3rem] pointer-events-none" />
      <GameShowcase
        isStudent={props.isStudent}
        accentColor={props.accentColor}
        sectionIndex={props.sectionIndex}
        isMobile={props.isMobile}
        targetLanguage={props.targetLanguage}
        nativeLanguage={props.nativeLanguage}
      />
    </div>
  );
};
