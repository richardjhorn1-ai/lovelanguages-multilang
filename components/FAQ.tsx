import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accentHex } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ICONS.ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
        </button>

        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('hero.bottomSections.faq.title')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {t('faq.subtitle', 'Everything you need to know about Love Languages')}
        </p>

        {/* FAQ Items */}
        <div className="space-y-4">
          {/* Q1 - What is RALL */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => toggleItem(0)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-80"
            >
              <span className="font-bold text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                {t('hero.bottomSections.faq.q1.question')}
              </span>
              <ICONS.ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openIndex === 0 ? 'rotate-180' : ''}`}
                style={{ color: accentHex }}
              />
            </button>
            {openIndex === 0 && (
              <div className="px-5 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p className="mb-4">{t('hero.bottomSections.faq.q1.answer')}</p>
                <a href="#rall" className="font-medium hover:underline" style={{ color: accentHex }}>
                  {t('hero.bottomSections.faq.q1.readMore')}
                </a>
              </div>
            )}
          </div>

          {/* Q2 - How is LL different */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => toggleItem(1)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-80"
            >
              <span className="font-bold text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                {t('hero.bottomSections.faq.q2.question')}
              </span>
              <ICONS.ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openIndex === 1 ? 'rotate-180' : ''}`}
                style={{ color: accentHex }}
              />
            </button>
            {openIndex === 1 && (
              <div className="px-5 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p className="mb-4">{t('hero.bottomSections.faq.q2.intro')}</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong style={{ color: 'var(--text-primary)' }}>{t('hero.bottomSections.faq.q2.point1')}</strong> {t('hero.bottomSections.faq.q2.point1desc')}</li>
                  <li><strong style={{ color: 'var(--text-primary)' }}>{t('hero.bottomSections.faq.q2.point2')}</strong> {t('hero.bottomSections.faq.q2.point2desc')}</li>
                  <li><strong style={{ color: 'var(--text-primary)' }}>{t('hero.bottomSections.faq.q2.point3')}</strong> {t('hero.bottomSections.faq.q2.point3desc')}</li>
                  <li><strong style={{ color: 'var(--text-primary)' }}>{t('hero.bottomSections.faq.q2.point4')}</strong> {t('hero.bottomSections.faq.q2.point4desc')}</li>
                </ul>
              </div>
            )}
          </div>

          {/* Q3 - Student/Tutor roles */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => toggleItem(2)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-80"
            >
              <span className="font-bold text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                {t('hero.bottomSections.faq.q3.question')}
              </span>
              <ICONS.ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openIndex === 2 ? 'rotate-180' : ''}`}
                style={{ color: accentHex }}
              />
            </button>
            {openIndex === 2 && (
              <div className="px-5 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p className="mb-4">
                  <strong style={{ color: 'var(--text-primary)' }}>Students:</strong> {t('hero.bottomSections.faq.q3.studentDesc')}
                </p>
                <p>
                  <strong style={{ color: 'var(--text-primary)' }}>Tutors:</strong> {t('hero.bottomSections.faq.q3.tutorDesc')}
                </p>
              </div>
            )}
          </div>

          {/* Q4 - Languages */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => toggleItem(3)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-80"
            >
              <span className="font-bold text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                {t('hero.bottomSections.faq.q4.question')}
              </span>
              <ICONS.ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openIndex === 3 ? 'rotate-180' : ''}`}
                style={{ color: accentHex }}
              />
            </button>
            {openIndex === 3 && (
              <div className="px-5 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p>{t('hero.bottomSections.faq.q4.answer')}</p>
              </div>
            )}
          </div>

          {/* Q5 - Pricing */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => toggleItem(4)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-80"
            >
              <span className="font-bold text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                {t('hero.bottomSections.faq.q5.question')}
              </span>
              <ICONS.ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openIndex === 4 ? 'rotate-180' : ''}`}
                style={{ color: accentHex }}
              />
            </button>
            {openIndex === 4 && (
              <div className="px-5 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p className="mb-4">{t('hero.bottomSections.faq.q5.intro')}</p>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{t('hero.bottomSections.faq.q5.standard')}</p>
                    <p className="text-sm font-medium" style={{ color: accentHex }}>{t('hero.bottomSections.faq.q5.standardPrice')}</p>
                    <p className="text-sm">{t('hero.bottomSections.faq.q5.standardDesc')}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{t('hero.bottomSections.faq.q5.unlimited')}</p>
                    <p className="text-sm font-medium" style={{ color: accentHex }}>{t('hero.bottomSections.faq.q5.unlimitedPrice')}</p>
                    <p className="text-sm">{t('hero.bottomSections.faq.q5.unlimitedDesc')}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm">{t('hero.bottomSections.faq.q5.cancelNote')}</p>
              </div>
            )}
          </div>

          {/* Q6 - Invite partner */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => toggleItem(5)}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-80"
            >
              <span className="font-bold text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                {t('hero.bottomSections.faq.q6.question')}
              </span>
              <ICONS.ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openIndex === 5 ? 'rotate-180' : ''}`}
                style={{ color: accentHex }}
              />
            </button>
            {openIndex === 5 && (
              <div className="px-5 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p>{t('hero.bottomSections.faq.q6.answer')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div
          className="mt-12 p-6 rounded-2xl text-center"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('faq.stillHaveQuestions', 'Still have questions?')}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('faq.reachOut', 'Reach out to us at')}{' '}
            <a
              href="mailto:hello@lovelanguages.app"
              className="font-bold hover:underline"
              style={{ color: accentHex }}
            >
              hello@lovelanguages.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
