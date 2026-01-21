import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';

const Method: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accentHex } = useTheme();

  const pillars = [
    { key: 'pillar1', icon: '💬' },
    { key: 'pillar2', icon: '🎯' },
    { key: 'pillar3', icon: '🎨' },
    { key: 'pillar4', icon: '🤝' },
  ];

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
        <div className="mb-8">
          <p className="text-sm font-medium mb-2" style={{ color: accentHex }}>
            {t('hero.bottomSections.rall.label')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('hero.bottomSections.rall.title')}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('hero.bottomSections.rall.description')}
          </p>
        </div>

        {/* Pillars */}
        <div className="grid gap-4 mb-8">
          {pillars.map(({ key, icon }) => (
            <div
              key={key}
              className="p-5 rounded-2xl border"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                    {t(`hero.bottomSections.rall.${key}.title`)}
                  </h3>
                  <p className="text-base mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t(`hero.bottomSections.rall.${key}.description`)}
                  </p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    {t(`hero.bottomSections.rall.${key}.citation`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{ background: `${accentHex}15`, borderLeft: `4px solid ${accentHex}` }}
        >
          <p className="text-lg italic mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('hero.bottomSections.rall.quote')}
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('hero.bottomSections.rall.quoteAttribution')}
          </p>
        </div>

        {/* Anxiety Reduction */}
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
        >
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('hero.bottomSections.rall.anxietyTitle')}
          </h3>
          <p className="text-base mb-2" style={{ color: 'var(--text-secondary)' }}>
            {t('hero.bottomSections.rall.anxietyDesc')}
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {t('hero.bottomSections.rall.anxietyCitation')}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-full font-bold text-white transition-transform hover:scale-105"
            style={{ background: accentHex }}
          >
            {t('common.getStarted', 'Get Started')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Method;
