import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';
import { useScrollablePage } from '../hooks/useScrollablePage';
import { supabase } from '../services/supabase';
import { getOfferings, hasActiveEntitlement, isIAPAvailable, purchasePackage, restorePurchases } from '../services/purchases';
import { formatUsdPrice, getDisplaySubscriptionPrice, type BillingPeriod, type PaidPlanId } from '../services/subscription-pricing';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accentHex } = useTheme();
  const useIAP = isIAPAvailable();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [iapPackages, setIapPackages] = useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<'standard' | 'unlimited' | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useScrollablePage();

  useEffect(() => {
    if (!useIAP) return;

    let active = true;

    getOfferings().then((offerings) => {
      if (!active) return;
      setIapPackages(offerings?.current?.availablePackages || []);
    });

    return () => {
      active = false;
    };
  }, [useIAP]);

  const nativePackages = useMemo(() => ({
    standard: iapPackages.find((pkg: any) => pkg.product?.identifier === `standard_${billingPeriod}`) || null,
    unlimited: iapPackages.find((pkg: any) => pkg.product?.identifier === `unlimited_${billingPeriod}`) || null,
  }), [billingPeriod, iapPackages]);

  const handleNativePurchase = async (plan: 'standard' | 'unlimited') => {
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }

    const pkg = nativePackages[plan];
    if (!pkg) {
      setError(t('subscription.errors.pricingUnavailable'));
      return;
    }

    setLoadingPlan(plan);
    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo && hasActiveEntitlement(customerInfo).isActive) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || t('subscription.errors.somethingWrong'));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo && hasActiveEntitlement(customerInfo).isActive) {
        navigate('/');
        return;
      }
      setError(t('subscription.errors.noActivePurchases', { defaultValue: 'No active purchases found' }));
    } catch (err: any) {
      setError(err?.message || t('subscription.errors.restoreFailed', { defaultValue: 'Failed to restore purchases' }));
    } finally {
      setRestoring(false);
    }
  };

  const getPriceLabel = (plan: PaidPlanId) => {
    const fallbackPrice = formatUsdPrice(getDisplaySubscriptionPrice(plan, billingPeriod));
    return useIAP ? nativePackages[plan]?.product?.priceString || fallbackPrice : fallbackPrice;
  };

  const getButtonLabel = (plan: 'standard' | 'unlimited', fallbackKey: string) => {
    if (!useIAP) return fallbackKey;
    if (loadingPlan === plan) return t('subscription.common.processing');
    return fallbackKey;
  };

  return (
    <div className="min-h-screen overflow-y-auto app-bg-decor" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => {
            // If coming from Stripe (has subscription query param), go home instead of back to Stripe
            if (window.location.search.includes('subscription=')) {
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

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/80 dark:bg-white/20 rounded-full p-1 shadow-sm border border-[var(--border-color)]">
            {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === period
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {period === 'weekly' && t('subscription.common.weekly')}
                {period === 'monthly' && t('subscription.common.monthly')}
                {period === 'yearly' && t('subscription.common.yearly')}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}

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
              {getPriceLabel('standard')}
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
              onClick={() => useIAP ? handleNativePurchase('standard') : navigate('/')}
              disabled={loadingPlan !== null || (useIAP && !nativePackages.standard)}
              className="w-full py-3 rounded-full font-bold border-2 transition-colors hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: accentHex, color: accentHex }}
            >
              {getButtonLabel('standard', t('pricing.chooseStandard', 'Choose Standard'))}
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
              {getPriceLabel('unlimited')}
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
              onClick={() => useIAP ? handleNativePurchase('unlimited') : navigate('/')}
              disabled={loadingPlan !== null || (useIAP && !nativePackages.unlimited)}
              className="w-full py-3 rounded-full font-bold text-white transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: accentHex }}
            >
              {getButtonLabel('unlimited', t('pricing.chooseUnlimited', 'Choose Unlimited'))}
            </button>
          </div>
        </div>

        {/* Cancel Note */}
        <p className="text-center mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {useIAP
            ? t('subscription.pricing.iosPurchaseNote', { defaultValue: 'In-app purchase via Apple. Manage or cancel anytime in App Store subscriptions.' })
            : t('hero.bottomSections.faq.q5.cancelNote')}
        </p>

        {useIAP && (
          <div className="flex flex-col items-center gap-3 mt-6">
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline disabled:opacity-50"
            >
              {restoring
                ? t('subscription.restore.restoring', { defaultValue: 'Restoring...' })
                : t('subscription.restore.button', { defaultValue: 'Restore Purchases' })}
            </button>
            <button
              onClick={() => window.location.assign('https://apps.apple.com/account/subscriptions')}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
            >
              {t('subscription.manager.manageInAppStore', 'Manage in App Store')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
