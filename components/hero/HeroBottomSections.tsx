import React, { useState } from 'react';
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
// RALL / OUR METHOD SECTION
// ============================================
export const HeroRALL: React.FC<{ isStudent: boolean; isVisible?: boolean; sectionIndex?: number }> = ({ isStudent, isVisible = true, sectionIndex }) => {
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const bgColor = isStudent ? BRAND.light : BRAND.tealLight;

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
    <section id="rall-section" data-section={sectionIndex} className="md:min-h-screen snap-start flex items-center py-6 md:py-16 px-4 md:px-16 lg:px-24" style={{ background: bgColor }}>
      <div className={`max-w-4xl mx-auto w-full section-content ${isVisible ? 'visible' : ''}`}>
        <div className="text-center mb-4 md:mb-12">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider mb-1 md:mb-2" style={{ color: accentColor }}>
            {t('hero.bottomSections.rall.label')}
          </p>
          <h2 className="text-xl md:text-3xl lg:text-4xl font-black font-header mb-2 md:mb-4" style={{ color: '#1a1a2e' }}>
            {t('hero.bottomSections.rall.title')}
          </h2>
          <p className="text-sm md:text-lg max-w-2xl mx-auto" style={{ color: '#4b5563' }}>
            {t('hero.bottomSections.rall.description')}
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-6 mb-4 md:mb-12">
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
        <div className="mt-4 md:mt-8 text-center hidden md:block">
          <p className="text-sm" style={{ color: '#4b5563' }}>
            <strong>{t('hero.bottomSections.rall.anxietyTitle')}</strong> {t('hero.bottomSections.rall.anxietyDesc')}
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
