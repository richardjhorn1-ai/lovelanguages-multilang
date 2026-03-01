import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { analytics } from '../services/analytics';
import { Profile } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { isIAPAvailable, getOfferings, purchasePackage, restorePurchases, hasActiveEntitlement } from '../services/purchases';

interface SubscriptionRequiredProps {
  profile: Profile;
  onSubscribed: () => void;
  trialExpired?: boolean;
}

const SubscriptionRequired: React.FC<SubscriptionRequiredProps> = ({ profile, onSubscribed, trialExpired = false }) => {
  // Default to unlimited plan (best value)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'unlimited'>('unlimited');
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCanceledMessage, setShowCanceledMessage] = useState(false);

  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [iapPackages, setIapPackages] = useState<any[]>([]);
  const [restoring, setRestoring] = useState(false);
  const useIAP = isIAPAvailable();

  // Fetch IAP offerings on iOS
  useEffect(() => {
    if (useIAP) {
      getOfferings().then(offerings => {
        if (offerings?.current?.availablePackages) {
          setIapPackages(offerings.current.availablePackages);
        }
      });
    }
  }, [useIAP]);

  // Restore Purchases handler (required by Apple)
  const handleRestorePurchases = async () => {
    setRestoring(true);
    setError(null);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        const entitlement = hasActiveEntitlement(customerInfo);
        if (entitlement.isActive) {
          // User has an active subscription — refresh profile
          onSubscribed();
          return;
        }
      }
      setError(t('subscription.errors.noActivePurchases', { defaultValue: 'No active purchases found' }));
    } catch (err: any) {
      setError(err?.message || t('subscription.errors.restoreFailed', { defaultValue: 'Failed to restore purchases' }));
    } finally {
      setRestoring(false);
    }
  };

  // iOS IAP purchase handler
  const handleIAPSubscribe = async () => {
    const productId = `${selectedPlan}_${billingPeriod}`;
    const pkg = iapPackages.find((p: any) => p.product?.identifier === productId);

    if (!pkg) {
      setError(`Product ${productId} not available`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        // Purchase succeeded — webhook updates DB, refresh profile
        onSubscribed();
      } else {
        // User cancelled
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Purchase failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle plan selection with analytics
  const handlePlanSelect = (planId: 'free' | 'standard' | 'unlimited') => {
    setSelectedPlan(planId);
    if (planId !== 'free') {
      analytics.trackPlanSelected({
        plan: planId,
        billing_period: billingPeriod === 'weekly' ? 'monthly' : billingPeriod,
      });
    }
  };

  // Track paywall view on mount
  const paywallViewedRef = useRef(false);
  const paywallViewedAt = useRef(Date.now());
  useEffect(() => {
    if (!paywallViewedRef.current) {
      paywallViewedRef.current = true;
      paywallViewedAt.current = Date.now();
      analytics.trackPaywallView({
        trigger_reason: 'subscription_required',
        page_context: 'onboarding',
      });
    }
  }, []);

  // Detect subscription=canceled URL param from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'canceled') {
      setShowCanceledMessage(true);
      analytics.trackPaywallDismissed({
        trigger_reason: trialExpired ? 'trial_expired' : 'subscription_required',
        time_viewed_ms: Date.now() - paywallViewedAt.current,
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const plans = [
    {
      id: 'free' as const,
      name: t('subscription.choice.free.title'),
      weeklyPrice: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      tagline: t('subscription.choice.free.subtext'),
      features: [
        { text: t('subscription.choice.free.features.conversations'), included: true },
        { text: t('subscription.choice.free.features.validations'), included: true },
        { text: t('subscription.choice.free.features.words'), included: true },
        { text: t('subscription.choice.free.features.games'), included: true },
        { text: t('subscription.choice.free.features.voice'), included: true },
        { text: t('subscription.choice.free.features.listen'), included: true },
        { text: t('subscription.choice.free.features.challenges'), included: true },
      ],
    },
    {
      id: 'standard' as const,
      name: t('subscription.plans.standard'),
      weeklyPrice: 7,
      monthlyPrice: 17.99,
      yearlyPrice: 69.99,
      tagline: t('subscription.required.taglineStandard'),
      features: [
        { text: t('subscription.features.wordsLimit', { limit: '2,000' }), included: true },
        { text: t('subscription.features.voiceMinutes', { minutes: 480 }), included: true },
        { text: t('subscription.features.listenMinutes', { minutes: 480 }), included: true },
        { text: t('subscription.features.allScenarios'), included: true },
        { text: t('subscription.features.partnerInvite'), included: true },
      ],
    },
    {
      id: 'unlimited' as const,
      name: t('subscription.plans.unlimited'),
      weeklyPrice: 12.99,
      monthlyPrice: 39.99,
      yearlyPrice: 139,
      tagline: t('subscription.required.taglineUnlimited'),
      popular: true,
      features: [
        { text: t('subscription.features.unlimitedEverything'), included: true },
        { text: t('subscription.features.unlimitedVoice'), included: true },
        { text: t('subscription.features.unlimitedListen'), included: true },
        { text: t('subscription.features.allScenarios'), included: true },
        { text: t('subscription.features.giftPass'), included: true },
      ],
    },
  ];

  // Calculate monthly equivalent for display
  const getMonthlyEquivalent = (plan: typeof plans[0]) => {
    if (billingPeriod === 'weekly') return plan.weeklyPrice * 4; // ~4 weeks per month
    if (billingPeriod === 'monthly') return plan.monthlyPrice;
    return Math.round((plan.yearlyPrice / 12) * 100) / 100; // yearly divided by 12
  };

  // Get billing period label for display
  const getBillingLabel = (plan: typeof plans[0]) => {
    if (plan.id === 'free') return t('subscription.choice.free.perMonth');
    if (billingPeriod === 'weekly') return t('subscription.common.billedWeekly', { price: plan.weeklyPrice });
    if (billingPeriod === 'monthly') return '';
    return t('subscription.common.billedAnnually', { price: plan.yearlyPrice });
  };

  const handleChooseFreeTier = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setError(t('subscription.errors.loginAgain'));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/choose-free-tier/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to activate free tier');
      }

      // Track free tier selection
      analytics.track('trial_started', {
        plan: 'free',
        trigger_reason: 'subscription_required',
      });

      // Refresh profile to get updated free_tier_chosen_at
      onSubscribed();
    } catch (err: any) {
      setError(err.message || t('subscription.errors.somethingWrong'));
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (selectedPlan === 'free') {
      if (useIAP) {
        // iOS: Free trial = App Store intro offer on standard_monthly
        const pkg = iapPackages.find((p: any) => p.product?.identifier === 'standard_monthly');
        if (!pkg) {
          setError('Free trial not available. Please select a plan.');
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const customerInfo = await purchasePackage(pkg);
          if (customerInfo) {
            analytics.track('trial_started', {
              plan: 'standard',
              trigger_reason: 'subscription_required',
              source: 'app_store',
            });
            onSubscribed();
          } else {
            setLoading(false); // User cancelled
          }
        } catch (err: any) {
          setError(err?.message || 'Failed to start trial. Please try again.');
          setLoading(false);
        }
        return;
      }
      return handleChooseFreeTier();
    }

    // iOS: use RevenueCat IAP
    if (useIAP) {
      return handleIAPSubscribe();
    }

    // Web: use Stripe checkout
    setLoading(true);
    setError(null);

    // Get price for analytics
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const price = billingPeriod === 'weekly'
      ? selectedPlanData?.weeklyPrice
      : billingPeriod === 'monthly'
        ? selectedPlanData?.monthlyPrice
        : selectedPlanData?.yearlyPrice;

    // Track checkout started
    analytics.trackCheckoutStarted({
      plan: selectedPlan,
      billing_period: billingPeriod === 'weekly' ? 'monthly' : billingPeriod,
      price: price || 0,
      currency: 'EUR',
    });

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setError(t('subscription.errors.loginAgain'));
        setLoading(false);
        return;
      }

      // Get price IDs
      const statusResponse = await fetch('/api/subscription-status/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!statusResponse.ok) {
        setError(t('subscription.errors.failedLoadPricing'));
        setLoading(false);
        return;
      }

      const statusData = await statusResponse.json();
      const prices = statusData.prices;

      // Determine price ID
      let priceId: string | null = null;
      if (selectedPlan === 'standard') {
        priceId = billingPeriod === 'weekly'
          ? prices.standardWeekly
          : billingPeriod === 'monthly'
            ? prices.standardMonthly
            : prices.standardYearly;
      } else {
        priceId = billingPeriod === 'weekly'
          ? prices.unlimitedWeekly
          : billingPeriod === 'monthly'
            ? prices.unlimitedMonthly
            : prices.unlimitedYearly;
      }

      if (!priceId) {
        setError(t('subscription.errors.pricingUnavailable'));
        setLoading(false);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/#/?subscription=success`,
          cancelUrl: `${window.location.origin}/#/?subscription=canceled`
        })
      });

      const checkoutData = await response.json();

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        const errorMsg = checkoutData.error || t('subscription.errors.failedCheckout');
        analytics.track('subscription_failed', {
          plan: selectedPlan,
          billing_period: billingPeriod,
          error_type: 'checkout_creation_failed',
          error_message: errorMsg,
        });
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err: any) {
      const errorMsg = err.message || t('subscription.errors.somethingWrong');
      analytics.track('subscription_failed', {
        plan: selectedPlan,
        billing_period: billingPeriod,
        error_type: 'checkout_exception',
        error_message: errorMsg,
      });
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div
      className="h-full overflow-y-auto overscroll-contain bg-gradient-to-br from-pink-50 to-rose-100"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: trialExpired ? '#EF444415' : 'var(--accent-light)' }}>
            {trialExpired ? <ICONS.HeartCrack className="w-7 h-7 text-red-500" /> : <ICONS.Heart className="w-7 h-7" style={{ color: 'var(--accent-color)' }} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-2 font-header">
            {trialExpired
              ? t('trial.expired.title', { defaultValue: 'Your free trial has ended' })
              : t('subscription.choice.title')
            }
          </h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">
            {trialExpired
              ? t('trial.expired.subtitle', { defaultValue: 'We hope you enjoyed learning together! Subscribe to continue your language journey with your partner.' })
              : t('subscription.choice.subtitle')
            }
          </p>
        </div>

        {/* Canceled checkout message */}
        {showCanceledMessage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <ICONS.AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold font-header text-amber-800 mb-1">
                  {t('subscription.canceled.title')}
                </h3>
                <p className="text-amber-700 text-sm">
                  {t('subscription.canceled.message')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Period Toggle - Pill Style */}
        <div className="flex justify-center mb-6">
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
                {period === 'yearly' && (
                  <span className="flex items-center gap-1">
                    {t('subscription.common.yearly')}
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                      {t('subscription.common.discount')}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards - 3 columns on desktop, stack on mobile */}
        {/* Hide free tier if trial has expired */}
        <div className={`grid grid-cols-1 ${trialExpired ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-4 mb-6`}>
          {plans.filter(p => !(trialExpired && p.id === 'free')).map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const monthlyEquiv = getMonthlyEquivalent(plan);
            const billingLabel = getBillingLabel(plan);

            return (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-rose-400 bg-rose-50 shadow-lg'
                    : 'bg-white/70 dark:bg-[var(--bg-card)]/80 backdrop-blur-sm border-white/80 dark:border-[var(--border-color)]/50 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:border-white/80 dark:hover:border-[var(--border-color)]/50'
                } ${plan.popular ? 'md:-mt-2 md:mb-2' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-rose-500 whitespace-nowrap">
                    {t('subscription.common.popular')}
                  </span>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold font-header text-[var(--text-primary)]">{plan.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{plan.tagline}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                      <ICONS.Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Price Display - Monthly Equiv Big, Total Small */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      ${plan.id === 'free' ? '0' : monthlyEquiv.toFixed(monthlyEquiv % 1 === 0 ? 0 : 2)}
                    </span>
                    <span className="text-[var(--text-secondary)] text-sm">/{t('subscription.common.mo')}</span>
                  </div>
                  {billingLabel && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{billingLabel}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {feature.included !== false ? (
                        <ICONS.Check className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-4 h-4 text-[var(--border-color)] flex-shrink-0 mt-0.5">✗</span>
                      )}
                      <span className={feature.included !== false ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)] opacity-60'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Subscribe/Start Free Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            selectedPlan === 'free'
              ? 'bg-gray-800 dark:bg-gray-600 hover:bg-gray-900 dark:hover:bg-gray-500 text-white'
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('subscription.common.loading')}
            </span>
          ) : selectedPlan === 'free' ? (
            t('subscription.choice.free.cta')
          ) : (
            t('subscription.required.subscribeTo', {
              plan: selectedPlan === 'standard'
                ? t('subscription.plans.standard')
                : t('subscription.plans.unlimited')
            })
          )}
        </button>

        {/* Trust signals */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          {selectedPlan === 'free'
            ? (useIAP
                ? t('subscription.choice.free.iosTrialNote', { defaultValue: '7 days free, then $17.99/mo. Cancel anytime.' })
                : t('subscription.choice.free.noCardRequired', { defaultValue: 'No credit card required' }))
            : t('subscription.common.securePayment')
          }
        </p>

        {/* Restore Purchases — required by Apple for App Store */}
        {useIAP && (
          <div className="text-center mt-4">
            <button
              onClick={handleRestorePurchases}
              disabled={restoring}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline disabled:opacity-50"
            >
              {restoring
                ? t('subscription.restore.restoring', { defaultValue: 'Restoring...' })
                : t('subscription.restore.button', { defaultValue: 'Restore Purchases' })
              }
            </button>
          </div>
        )}

        {/* Logout option */}
        <div className="text-center mt-6">
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
          >
            {t('subscription.required.signOutOption')}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SubscriptionRequired;
