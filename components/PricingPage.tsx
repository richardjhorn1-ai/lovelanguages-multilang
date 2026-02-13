import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ICONS } from '../constants';

interface SubscriptionStatus {
  subscription: {
    plan: string;
    status: string;
    period: string | null;
    endsAt: string | null;
  };
  limits: {
    wordLimit: number | null;
    voiceMinutesPerMonth: number | null;
    listenMinutesPerMonth: number | null;
    canInvitePartner: boolean;
  };
  usage: {
    wordsAdded: number;
    voiceMinutes: number;
    listenMinutes: number;
  };
  giftPasses: Array<{ id: string; code: string; expires_at: string }>;
  prices: {
    standardWeekly: string;
    standardMonthly: string;
    standardYearly: string;
    unlimitedWeekly: string;
    unlimitedMonthly: string;
    unlimitedYearly: string;
  };
}

interface PricingPageProps {
  onBack?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const { accentHex, isDark } = useTheme();
  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('yearly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscription-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('[PricingPage] Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setCheckoutLoading(priceId);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setError(t('subscription.errors.loginAgain'));
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priceId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('subscription.errors.failedCheckout'));
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || t('subscription.errors.somethingWrong'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) return;

      const response = await fetch('/api/create-customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('[PricingPage] Error opening portal:', err);
    }
  };

  const isSubscribed = status?.subscription?.plan && status.subscription.plan !== 'free' && status.subscription.plan !== 'none';
  const currentPlan = status?.subscription?.plan || 'free';

  const plans = [
    {
      id: 'standard',
      name: t('subscription.plans.standard'),
      weeklyPrice: 7,
      monthlyPrice: 19,
      yearlyPrice: 69,
      weeklyPriceId: status?.prices?.standardWeekly,
      monthlyPriceId: status?.prices?.standardMonthly,
      yearlyPriceId: status?.prices?.standardYearly,
      features: [
        t('subscription.pricing.wordsInLoveLog', { limit: '2,000' }),
        t('subscription.pricing.voiceChatPerMonth', { minutes: 60 }),
        t('subscription.pricing.listenModePerMonth', { minutes: 30 }),
        t('subscription.pricing.unlimitedChallenges'),
        t('subscription.pricing.allScenarios'),
        t('subscription.pricing.partnerInvite'),
      ],
      popular: false,
    },
    {
      id: 'unlimited',
      name: t('subscription.plans.unlimited'),
      weeklyPrice: 12,
      monthlyPrice: 39,
      yearlyPrice: 139,
      weeklyPriceId: status?.prices?.unlimitedWeekly,
      monthlyPriceId: status?.prices?.unlimitedMonthly,
      yearlyPriceId: status?.prices?.unlimitedYearly,
      features: [
        t('subscription.pricing.unlimitedWords'),
        t('subscription.pricing.unlimitedVoiceChat'),
        t('subscription.pricing.unlimitedListenMode'),
        t('subscription.pricing.unlimitedChallenges'),
        t('subscription.pricing.allScenarios'),
        t('subscription.pricing.partnerInvite'),
        t('subscription.pricing.giftPass'),
      ],
      popular: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: accentHex }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 p-2 rounded-lg hover:bg-opacity-10"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ICONS.ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('subscription.pricing.title', { language: targetName })}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('subscription.pricing.subtitle')}
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Weekly */}
            <button
              onClick={() => setBillingPeriod('weekly')}
              className={`relative flex flex-col items-center px-6 py-3 rounded-xl font-medium transition-all border-2 ${
                billingPeriod === 'weekly' ? 'shadow-md' : 'hover:border-opacity-50'
              }`}
              style={{
                background: billingPeriod === 'weekly' ? `${accentHex}15` : 'var(--bg-card)',
                borderColor: billingPeriod === 'weekly' ? accentHex : 'var(--border-color)',
                color: billingPeriod === 'weekly' ? accentHex : 'var(--text-secondary)',
              }}
            >
              <span className="text-xs opacity-70 mb-0.5">{t('subscription.common.weeklyLabel')}</span>
              <span className="font-semibold">{t('subscription.common.weekly')}</span>
            </button>

            {/* Monthly - Featured with glow */}
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`relative flex flex-col items-center px-6 py-3 rounded-xl font-medium transition-all border-2 ${
                billingPeriod === 'monthly' ? 'shadow-lg' : ''
              }`}
              style={{
                background: billingPeriod === 'monthly' ? accentHex : 'var(--bg-card)',
                borderColor: accentHex,
                color: billingPeriod === 'monthly' ? '#fff' : accentHex,
                boxShadow: `0 0 20px ${accentHex}40, 0 0 40px ${accentHex}20`,
              }}
            >
              <span className={`text-xs mb-0.5 ${billingPeriod === 'monthly' ? 'opacity-90' : 'opacity-70'}`}>
                {t('subscription.common.monthlyLabel')}
              </span>
              <span className="font-semibold">{t('subscription.common.monthly')}</span>
            </button>

            {/* Yearly */}
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`relative flex flex-col items-center px-6 py-3 rounded-xl font-medium transition-all border-2 ${
                billingPeriod === 'yearly' ? 'shadow-md' : 'hover:border-opacity-50'
              }`}
              style={{
                background: billingPeriod === 'yearly' ? `${accentHex}15` : 'var(--bg-card)',
                borderColor: billingPeriod === 'yearly' ? accentHex : 'var(--border-color)',
                color: billingPeriod === 'yearly' ? accentHex : 'var(--text-secondary)',
              }}
            >
              <span className="text-xs opacity-70 mb-0.5">{t('subscription.common.yearlyLabel')}</span>
              <span className="font-semibold flex items-center gap-2">
                {t('subscription.common.yearly')}
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                  {t('subscription.pricing.save70')}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Current Plan Banner */}
        {isSubscribed && (
          <div
            className="mb-8 p-4 rounded-xl border text-center"
            style={{
              background: `${accentHex}15`,
              borderColor: `${accentHex}30`,
            }}
          >
            <p style={{ color: 'var(--text-primary)' }}>
              {t('subscription.pricing.youreOnPlan', { plan: currentPlan })}
              {status?.subscription?.period && ` (${status.subscription.period})`}
            </p>
            <button
              onClick={handleManageSubscription}
              className="mt-2 text-sm underline"
              style={{ color: accentHex }}
            >
              {t('subscription.manager.manageSubscription')}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const price = billingPeriod === 'weekly'
              ? plan.weeklyPrice
              : billingPeriod === 'monthly'
                ? plan.monthlyPrice
                : plan.yearlyPrice;
            const priceId = billingPeriod === 'weekly'
              ? plan.weeklyPriceId
              : billingPeriod === 'monthly'
                ? plan.monthlyPriceId
                : plan.yearlyPriceId;
            const periodLabel = billingPeriod === 'weekly'
              ? t('subscription.common.wk')
              : billingPeriod === 'monthly'
                ? t('subscription.common.mo')
                : t('subscription.common.yr');
            const isCurrentPlan = currentPlan === plan.id;
            const isLoading = checkoutLoading === priceId;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all ${
                  plan.popular ? 'ring-2' : 'border'
                }`}
                style={{
                  background: 'var(--bg-card)',
                  borderColor: plan.popular ? accentHex : 'var(--border-color)',
                  '--tw-ring-color': plan.popular ? accentHex : undefined,
                } as React.CSSProperties}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium text-white"
                    style={{ background: accentHex }}
                  >
                    {t('subscription.pricing.mostPopular')}
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      ${price}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      /{periodLabel}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm mt-1 text-green-600 dark:text-green-400">
                      {t('subscription.pricing.billedAnnually', { price: (price / 12).toFixed(2) })}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ICONS.Check
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: accentHex }}
                      />
                      <span style={{ color: 'var(--text-primary)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-medium opacity-50 cursor-not-allowed"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('subscription.pricing.currentPlan')}
                  </button>
                ) : (
                  <button
                    onClick={() => priceId && handleSubscribe(priceId)}
                    disabled={isLoading || !priceId}
                    className="w-full py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      background: plan.popular ? accentHex : 'var(--bg-primary)',
                      color: plan.popular ? '#fff' : 'var(--text-primary)',
                      border: plan.popular ? 'none' : '1px solid var(--border-color)',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                        {t('subscription.pricing.processing')}
                      </>
                    ) : (
                      t('subscription.pricing.getPlan', { plan: plan.name })
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Gift Passes Section */}
        {status?.giftPasses && status.giftPasses.length > 0 && (
          <div className="mt-12 p-6 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ICONS.Gift className="w-5 h-5" style={{ color: accentHex }} />
              {t('subscription.pricing.yourGiftPasses')}
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('subscription.pricing.shareGiftPasses')}
            </p>
            <div className="space-y-3">
              {status.giftPasses.map((pass) => (
                <div
                  key={pass.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--bg-primary)' }}
                >
                  <code className="font-mono text-lg" style={{ color: accentHex }}>
                    {pass.code}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(pass.code)}
                    className="px-3 py-1 rounded-lg text-sm"
                    style={{ background: `${accentHex}20`, color: accentHex }}
                  >
                    {t('subscription.common.copy')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ or Trust Signals */}
        <div className="mt-12 text-center" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-sm">
            {t('subscription.pricing.cancelAnytime')}
          </p>
          <p className="text-sm mt-2">
            {t('subscription.pricing.questionsEmail')}{' '}
            <a href="mailto:support@lovelanguages.xyz" style={{ color: accentHex }}>
              support@lovelanguages.xyz
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
