import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accentHex } = useTheme();

  return (
    <div className="min-h-screen overflow-y-auto app-bg-decor" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => {
            // If coming from Stripe (has subscription query param), go home instead of back to Stripe
            // Note: With HashRouter, query params are in the hash, not in search
            if (window.location.hash.includes('subscription=')) {
              navigate('/');
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 mb-8 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ICONS.ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
        </button>

        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-black font-header mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('hero.bottomSections.faq.q5.question')}
        </h1>
        <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
          {t('hero.bottomSections.faq.q5.intro')}
        </p>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Standard */}
          <div
            className="p-6 rounded-2xl glass-card"
          >
            <h2 className="text-2xl font-black font-header mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('hero.bottomSections.faq.q5.standard')}
            </h2>
            <p className="text-lg font-bold mb-4" style={{ color: accentHex }}>
              {t('hero.bottomSections.faq.q5.standardPrice')}
            </p>
            <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
              {t('hero.bottomSections.faq.q5.standardDesc')}
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.words', '2,000 vocabulary words')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.voice', '60 minutes voice chat')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.partner', 'Partner invite')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.games', 'All vocabulary games')}
              </li>
            </ul>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-full font-bold border-2 transition-colors hover:opacity-80"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              {t('pricing.chooseStandard', 'Choose Standard')}
            </button>
          </div>

          {/* Unlimited */}
          <div
            className="p-6 rounded-2xl border-2 relative glass-card"
            style={{ borderColor: accentHex }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: accentHex }}
            >
              {t('pricing.mostPopular', 'Most Popular')}
            </div>
            <h2 className="text-2xl font-black font-header mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('hero.bottomSections.faq.q5.unlimited')}
            </h2>
            <p className="text-lg font-bold mb-4" style={{ color: accentHex }}>
              {t('hero.bottomSections.faq.q5.unlimitedPrice')}
            </p>
            <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
              {t('hero.bottomSections.faq.q5.unlimitedDesc')}
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.unlimitedWords', 'Unlimited vocabulary')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.unlimitedVoice', 'Unlimited voice chat')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.partner', 'Partner invite')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.games', 'All vocabulary games')}
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: accentHex }}>✓</span>
                {t('pricing.feature.giftPasses', 'Gift passes')}
              </li>
            </ul>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-full font-bold text-white transition-transform hover:scale-105"
              style={{ background: accentHex }}
            >
              {t('pricing.chooseUnlimited', 'Choose Unlimited')}
            </button>
          </div>
        </div>

        {/* Cancel Note */}
        <p className="text-center mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {t('hero.bottomSections.faq.q5.cancelNote')}
        </p>
      </div>
    </div>
  );
};

export default Pricing;
