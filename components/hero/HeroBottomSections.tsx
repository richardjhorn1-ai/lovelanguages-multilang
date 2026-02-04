import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';

// Brand colors
const BRAND = {
  primary: '#FF4761',
  teal: '#14b8a6',
  light: '#FFF0F3',
  tealLight: '#ccfbf1',
  coral: '#FF6B6B',
  golden: '#FFE66D',
};

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

// ============================================
// FAQ SECTION
// ============================================
export const HeroFAQ: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const bgColor = isStudent ? BRAND.light : BRAND.tealLight;

  const faqItems: FAQItem[] = [
    {
      question: t('hero.bottomSections.faq.q1.question'),
      answer: (
        <p>
          {t('hero.bottomSections.faq.q1.answer')} <a href="#rall-section" className="font-bold underline" style={{ color: accentColor }}>{t('hero.bottomSections.faq.q1.readMore')}</a>
        </p>
      )
    },
    {
      question: t('hero.bottomSections.faq.q2.question'),
      answer: (
        <>
          <p className="mb-3">
            {t('hero.bottomSections.faq.q2.intro')}
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>{t('hero.bottomSections.faq.q2.point1')}</strong> {t('hero.bottomSections.faq.q2.point1desc')}</li>
            <li><strong>{t('hero.bottomSections.faq.q2.point2')}</strong> {t('hero.bottomSections.faq.q2.point2desc')}</li>
            <li><strong>{t('hero.bottomSections.faq.q2.point3')}</strong> {t('hero.bottomSections.faq.q2.point3desc')}</li>
            <li><strong>{t('hero.bottomSections.faq.q2.point4')}</strong> {t('hero.bottomSections.faq.q2.point4desc')}</li>
          </ul>
        </>
      )
    },
    {
      question: t('hero.bottomSections.faq.q3.question'),
      answer: (
        <>
          <p className="mb-3">
            {t('hero.bottomSections.faq.q3.studentDesc')}
          </p>
          <p>
            {t('hero.bottomSections.faq.q3.tutorDesc')}
          </p>
        </>
      )
    },
    {
      question: t('hero.bottomSections.faq.q4.question'),
      answer: (
        <p>
          {t('hero.bottomSections.faq.q4.answer')}
        </p>
      )
    },
    {
      question: t('hero.bottomSections.faq.q5.question'),
      answer: (
        <>
          <p className="mb-3">
            {t('hero.bottomSections.faq.q5.intro')}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 rounded-xl bg-white/60">
              <p className="font-bold">{t('hero.bottomSections.faq.q5.standard')}</p>
              <p className="text-sm">{t('hero.bottomSections.faq.q5.standardPrice')}</p>
              <p className="text-xs mt-1 opacity-70">{t('hero.bottomSections.faq.q5.standardDesc')}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border-2" style={{ borderColor: accentColor }}>
              <p className="font-bold">{t('hero.bottomSections.faq.q5.unlimited')}</p>
              <p className="text-sm">{t('hero.bottomSections.faq.q5.unlimitedPrice')}</p>
              <p className="text-xs mt-1 opacity-70">{t('hero.bottomSections.faq.q5.unlimitedDesc')}</p>
            </div>
          </div>
          <p className="text-sm">{t('hero.bottomSections.faq.q5.cancelNote')}</p>
        </>
      )
    },
    {
      question: t('hero.bottomSections.faq.q6.question'),
      answer: (
        <p>
          {t('hero.bottomSections.faq.q6.answer')}
        </p>
      )
    },
  ];

  return (
    <section
      data-section={sectionIndex}
      className="md:min-h-screen snap-start flex items-center justify-center py-6 md:py-16 px-4 md:px-16 lg:px-24"
      style={{ background: bgColor }}
    >
      <div className={`max-w-3xl w-full section-content ${isVisible ? 'visible' : ''}`}>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-black font-header mb-4 md:mb-8 text-center" style={{ color: '#1a1a2e' }}>
          {t('hero.bottomSections.faq.title')}
        </h2>

        <div className="space-y-2 md:space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="rounded-xl md:rounded-2xl overflow-hidden transition-all bg-white shadow-sm"
              style={{
                boxShadow: openIndex === index ? `0 4px 20px ${accentColor}20` : undefined,
                border: `2px solid ${openIndex === index ? accentColor : 'transparent'}`
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-3 md:p-5 text-left transition-colors"
              >
                <span className="font-bold text-sm md:text-base pr-2 md:pr-4" style={{ color: '#1a1a2e' }}>
                  {item.question}
                </span>
                <ICONS.ChevronDown
                  className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  style={{ color: accentColor }}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-3 pb-3 md:px-5 md:pb-5 text-sm md:text-base leading-relaxed" style={{ color: '#4b5563' }}>
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// RALL / ABOUT SECTION - Tabbed Interface
// ============================================

// Sub-component: Method Content (How It Works)
export const MethodContent: React.FC<{ accentColor: string; t: any }> = ({ accentColor, t }) => {
  const pillars = [
    {
      icon: ICONS.MessageCircle,
      title: t('hero.bottomSections.rall.pillar1.title'),
      description: t('hero.bottomSections.rall.pillar1.description'),
      citation: t('hero.bottomSections.rall.pillar1.citation')
    },
    {
      icon: ICONS.Target,
      title: t('hero.bottomSections.rall.pillar2.title'),
      description: t('hero.bottomSections.rall.pillar2.description'),
      citation: t('hero.bottomSections.rall.pillar2.citation')
    },
    {
      icon: ICONS.Heart,
      title: t('hero.bottomSections.rall.pillar3.title'),
      description: t('hero.bottomSections.rall.pillar3.description'),
      citation: t('hero.bottomSections.rall.pillar3.citation')
    },
    {
      icon: ICONS.Users,
      title: t('hero.bottomSections.rall.pillar4.title'),
      description: t('hero.bottomSections.rall.pillar4.description'),
      citation: t('hero.bottomSections.rall.pillar4.citation')
    },
  ];

  return (
    <div className="w-full">
      {/* Pillars Grid */}
      <div className="grid grid-cols-2 gap-2 md:gap-6 mb-4 md:mb-8">
        {pillars.map((pillar, index) => (
          <div
            key={index}
            className="rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm bg-white"
          >
            <div className="flex items-center gap-2 mb-1 md:mb-3">
              <pillar.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: accentColor }} />
              <h3 className="font-bold text-xs md:text-base leading-tight" style={{ color: '#1a1a2e' }}>
                {pillar.title}
              </h3>
            </div>
            <p className="text-xs md:text-sm mb-1 md:mb-3 line-clamp-3 md:line-clamp-none" style={{ color: '#4b5563' }}>
              {pillar.description}
            </p>
            <p className="text-[10px] md:text-xs font-medium hidden md:block" style={{ color: accentColor }}>
              {pillar.citation}
            </p>
          </div>
        ))}
      </div>

      {/* Key Insight */}
      <div
        className="rounded-2xl md:rounded-3xl p-4 md:p-8 text-center"
        style={{ background: accentColor }}
      >
        <p className="text-white text-sm md:text-xl font-medium leading-relaxed">
          {t('hero.bottomSections.rall.quote')}
        </p>
        <p className="text-white/70 text-xs md:text-sm mt-2 md:mt-4">
          {t('hero.bottomSections.rall.quoteAttribution')}
        </p>
      </div>

      {/* Anxiety Note - hidden on mobile */}
      <div className="mt-4 md:mt-6 text-center hidden md:block">
        <p className="text-sm" style={{ color: '#4b5563' }}>
          <strong>{t('hero.bottomSections.rall.anxietyTitle')}</strong> {t('hero.bottomSections.rall.anxietyDesc')}
        </p>
        <p className="text-xs mt-2" style={{ color: accentColor }}>
          {t('hero.bottomSections.rall.anxietyCitation')}
        </p>
      </div>
    </div>
  );
};

// Sub-component: Story Content (Who We Are)
export const StoryContent: React.FC<{ accentColor: string; t: any }> = ({ accentColor, t }) => {
  const [imgSrc, setImgSrc] = useState('/founders.jpg');

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      {/* Founder Photo in Heart Shape */}
      <div className="mb-4 md:mb-6 flex justify-center">
        <div className="relative w-32 h-28 md:w-44 md:h-40">
          {/* SVG Heart Clip Definition */}
          <svg className="absolute w-0 h-0">
            <defs>
              <clipPath id="heartClip" clipPathUnits="objectBoundingBox">
                <path d="M0.5,0.15 C0.5,0.15 0.2,-0.1 0.05,0.2 C-0.1,0.5 0.15,0.75 0.5,1 C0.85,0.75 1.1,0.5 0.95,0.2 C0.8,-0.1 0.5,0.15 0.5,0.15" />
              </clipPath>
            </defs>
          </svg>
          <img
            src={imgSrc}
            alt={t('hero.bottomSections.rall.story.names')}
            className="w-full h-full object-cover object-top"
            style={{
              clipPath: 'url(#heartClip)',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
            }}
            onError={() => setImgSrc('/founders.svg')}
          />
        </div>
      </div>

      {/* Names & Title */}
      <h3 className="text-lg md:text-2xl font-black mb-1" style={{ color: '#1a1a2e' }}>
        {t('hero.bottomSections.rall.story.names')}
      </h3>
      <p className="text-sm md:text-base font-medium mb-4 md:mb-6" style={{ color: accentColor }}>
        {t('hero.bottomSections.rall.story.title')}
      </p>

      {/* Story - scrollable on mobile */}
      <div className="max-h-[45vh] md:max-h-none overflow-y-auto md:overflow-visible">
        <div className="space-y-3 md:space-y-4 text-left md:text-center">
          <p className="text-sm md:text-base leading-relaxed font-medium" style={{ color: '#1a1a2e' }}>
            {t('hero.bottomSections.rall.story.paragraph1')}
          </p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4b5563' }}>
            {t('hero.bottomSections.rall.story.paragraph2')}
          </p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4b5563' }}>
            {t('hero.bottomSections.rall.story.paragraph3')}
          </p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4b5563' }}>
            {t('hero.bottomSections.rall.story.paragraph4')}
          </p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#4b5563' }}>
            {t('hero.bottomSections.rall.story.paragraph5')}
          </p>
          <p className="text-sm md:text-base leading-relaxed font-medium" style={{ color: accentColor }}>
            {t('hero.bottomSections.rall.story.paragraph6')}
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Offer Content (What You Get)
export const OfferContent: React.FC<{ accentColor: string; t: any; isStudent: boolean }> = ({ accentColor, t, isStudent }) => {
  const role = isStudent ? 'student' : 'tutor';
  const headlineKey = isStudent ? 'studentHeadline' : 'tutorHeadline';

  const studentIcons = [ICONS.Mic, ICONS.BookOpen, ICONS.Gamepad2, ICONS.MessageCircle, ICONS.Target, ICONS.Volume2];
  const tutorIcons = [ICONS.Sparkles, ICONS.Gift, ICONS.TrendingUp, ICONS.Zap, ICONS.Lightbulb, ICONS.Heart];
  const icons = isStudent ? studentIcons : tutorIcons;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Headline */}
      <h3 className="text-lg md:text-2xl font-black text-center mb-4 md:mb-6" style={{ color: '#1a1a2e' }}>
        {t(`hero.bottomSections.rall.offer.${headlineKey}`)}
      </h3>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map((num, index) => {
          const Icon = icons[index];
          return (
            <div
              key={num}
              className="rounded-xl p-4 md:p-5 bg-white shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accentColor}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm md:text-base mb-0.5" style={{ color: '#1a1a2e' }}>
                    "{t(`hero.bottomSections.rall.offer.${role}.feature${num}.pain`)}"
                  </h4>
                  <p className="text-xs font-semibold mb-1" style={{ color: accentColor }}>
                    {t(`hero.bottomSections.rall.offer.${role}.feature${num}.feature`)}
                  </p>
                  <p className="text-xs md:text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                    {t(`hero.bottomSections.rall.offer.${role}.feature${num}.desc`)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HeroRALL: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const bgColor = isStudent ? BRAND.light : BRAND.tealLight;

  const [activeTab, setActiveTab] = useState<'method' | 'story' | 'offer'>('method');
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Auto-hide scroll hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowScrollHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Hide scroll hint on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showScrollHint) setShowScrollHint(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollHint]);

  const tabs = [
    { key: 'method' as const, label: t('hero.bottomSections.rall.tabs.method') },
    { key: 'story' as const, label: t('hero.bottomSections.rall.tabs.story') },
    { key: 'offer' as const, label: t('hero.bottomSections.rall.tabs.offer') },
  ];

  return (
    <section id="rall-section" data-section={sectionIndex} className="md:min-h-screen snap-start flex items-center py-6 md:py-8 px-4 md:px-16 lg:px-24" style={{ background: bgColor }}>
      <div className={`max-w-4xl mx-auto w-full flex flex-col min-h-[80vh] md:min-h-[85vh] section-content ${isVisible ? 'visible' : ''}`}>

        {/* Static Header - TOP */}
        <div className="text-center pt-2 md:pt-6">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
            {t('hero.bottomSections.rall.label')}
          </p>
          <h2 className="text-xl md:text-3xl lg:text-4xl font-black font-header mb-2" style={{ color: '#1a1a2e' }}>
            {t('hero.bottomSections.rall.title')}
          </h2>
          <p className="text-sm md:text-lg max-w-2xl mx-auto" style={{ color: '#4b5563' }}>
            {t('hero.bottomSections.rall.description')}
          </p>
        </div>

        {/* Content Area - MIDDLE (flex-1 to fill space) */}
        <div className="flex-1 flex items-center justify-center py-4 md:py-6">
          {activeTab === 'method' && <MethodContent accentColor={accentColor} t={t} />}
          {activeTab === 'story' && <StoryContent accentColor={accentColor} t={t} />}
          {activeTab === 'offer' && <OfferContent accentColor={accentColor} t={t} isStudent={isStudent} />}
        </div>

        {/* Segmented Control + Scroll Hint - BOTTOM */}
        <div className="pb-4 md:pb-8 flex flex-col items-center">
          {/* Segmented Control */}
          <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#f3f4f6' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all"
                style={activeTab === tab.key
                  ? { backgroundColor: accentColor, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                  : { color: '#6b7280' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scroll Hint */}
          {showScrollHint && (
            <div className="flex flex-col items-center mt-4 animate-bounce">
              <span className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                {t('hero.bottomSections.rall.scrollHint')}
              </span>
              <ICONS.ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

// ============================================
// BLOG / RESOURCES SECTION
// ============================================
export const HeroBlog: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const bgColor = isStudent ? BRAND.light : BRAND.tealLight;

  const featuredTopics = [
    { title: t('hero.bottomSections.blog.topic1.title'), description: t('hero.bottomSections.blog.topic1.description'), icon: ICONS.Heart },
    { title: t('hero.bottomSections.blog.topic2.title'), description: t('hero.bottomSections.blog.topic2.description'), icon: ICONS.Globe },
    { title: t('hero.bottomSections.blog.topic3.title'), description: t('hero.bottomSections.blog.topic3.description'), icon: ICONS.BookOpen },
  ];

  return (
    <section data-section={sectionIndex} className="md:min-h-screen snap-start flex items-center py-6 md:py-16 px-4 md:px-16 lg:px-24" style={{ background: bgColor }}>
      <div className={`max-w-4xl mx-auto text-center w-full section-content ${isVisible ? 'visible' : ''}`}>
        <p className="text-xs md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2" style={{ color: accentColor }}>
          {t('hero.bottomSections.blog.label')}
        </p>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-black font-header mb-2 md:mb-4" style={{ color: '#1a1a2e' }}>
          {t('hero.bottomSections.blog.title')}
        </h2>
        <p className="text-sm md:text-lg mb-4 md:mb-10 max-w-2xl mx-auto" style={{ color: '#4b5563' }}>
          {t('hero.bottomSections.blog.description')}
        </p>

        {/* Topic Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-10">
          {featuredTopics.map((topic, index) => (
            <a
              key={index}
              href="https://www.lovelanguages.io/learn/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 md:p-6 rounded-xl md:rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all text-left hover:-translate-y-1"
            >
              <div
                className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4"
                style={{ background: `${accentColor}15` }}
              >
                <topic.icon className="w-4 h-4 md:w-6 md:h-6" style={{ color: accentColor }} />
              </div>
              <h3 className="font-bold text-xs md:text-base mb-1" style={{ color: '#1a1a2e' }}>{topic.title}</h3>
              <p className="text-[10px] md:text-sm hidden md:block" style={{ color: '#4b5563' }}>{topic.description}</p>
            </a>
          ))}
        </div>

        {/* CTA - on mobile, include social buttons inline */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
          <a
            href="https://www.lovelanguages.io/learn/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-8 md:py-4 rounded-full font-bold text-xs md:text-base text-white transition-all hover:scale-105 shadow-lg"
            style={{ background: accentColor }}
          >
            {t('hero.bottomSections.blog.cta')}
            <ICONS.ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
          </a>
          {/* Social buttons - only show on mobile here, desktop shows in footer */}
          <a
            href="https://instagram.com/lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1 px-3 py-2 rounded-full font-bold text-xs transition-all hover:scale-105 bg-white shadow-sm"
            style={{ color: accentColor }}
          >
            <ICONS.Instagram className="w-3.5 h-3.5" />
            <span>{t('hero.bottomSections.footer.instagram')}</span>
          </a>
          <a
            href="https://tiktok.com/@lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1 px-3 py-2 rounded-full font-bold text-xs transition-all hover:scale-105 bg-white shadow-sm"
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
// FOOTER - Fun & On-Brand
// ============================================
export const HeroFooter: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const bgColor = isStudent ? '#fdf2f4' : '#f0fdfa'; // Slightly darker than light for contrast

  return (
    <footer data-section={sectionIndex} className="snap-start py-4 md:py-12 px-4 md:px-16 lg:px-24" style={{ background: bgColor }}>
      <div className={`max-w-4xl mx-auto section-content ${isVisible ? 'visible' : ''}`}>
        {/* Fun tagline - hidden on mobile */}
        <div className="hidden md:block text-center mb-8">
          <p className="text-2xl lg:text-3xl font-black font-header" style={{ color: '#1a1a2e' }}>
            {t('hero.bottomSections.footer.tagline')} 💕
          </p>
        </div>

        {/* Social Links - hidden on mobile (shown in blog section instead) */}
        <div className="hidden md:flex items-center justify-center gap-4 mb-8">
          <a
            href="https://instagram.com/lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-base transition-all hover:scale-105 bg-white shadow-sm"
            style={{ color: accentColor }}
          >
            <ICONS.Instagram className="w-5 h-5" />
            <span>{t('hero.bottomSections.footer.instagram')}</span>
          </a>
          <a
            href="https://tiktok.com/@lovelanguages.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-base transition-all hover:scale-105 bg-white shadow-sm"
            style={{ color: accentColor }}
          >
            <ICONS.Video className="w-5 h-5" />
            <span>{t('hero.bottomSections.footer.tiktok')}</span>
          </a>
        </div>

        {/* Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6 text-xs md:text-sm mb-2 md:mb-6">
          <a href="#/terms" className="font-medium hover:underline transition-colors" style={{ color: '#6b7280' }}>{t('hero.bottomSections.footer.terms')}</a>
          <span style={{ color: '#d1d5db' }}>·</span>
          <a href="#/privacy" className="font-medium hover:underline transition-colors" style={{ color: '#6b7280' }}>{t('hero.bottomSections.footer.privacy')}</a>
          <span style={{ color: '#d1d5db' }}>·</span>
          <a href="https://www.lovelanguages.io/learn/" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline transition-colors" style={{ color: '#6b7280' }}>{t('hero.bottomSections.footer.blog')}</a>
          <span style={{ color: '#d1d5db' }}>·</span>
          <a href="mailto:hello@lovelanguages.xyz" className="font-medium hover:underline transition-colors" style={{ color: '#6b7280' }}>{t('hero.bottomSections.footer.contact')}</a>
        </div>

        {/* Copyright with heart */}
        <div className="text-center text-xs" style={{ color: '#9ca3af' }}>
          © {new Date().getFullYear()} {t('hero.bottomSections.footer.copyright')}
        </div>
      </div>
    </footer>
  );
};
