import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
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
    standardMonthly: string;
    standardYearly: string;
    unlimitedMonthly: string;
    unlimitedYearly: string;
  };
}

interface PricingPageProps {
  onBack?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const { accentHex, isDark } = useTheme();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
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
        setError('Please log in to subscribe');
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
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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

  const isSubscribed = status?.subscription?.plan && status.subscription.plan !== 'none';
  const currentPlan = status?.subscription?.plan || 'none';

  const plans = [
    {
      id: 'standard',
      name: 'Standard',
      monthlyPrice: 19,
      yearlyPrice: 69,
      monthlyPriceId: status?.prices?.standardMonthly,
      yearlyPriceId: status?.prices?.standardYearly,
      features: [
        '2,000 words in Love Log',
        '60 min voice chat/month',
        '30 min Listen Mode/month',
        'Unlimited AI challenges',
        'All 8 conversation scenarios',
        'Partner invite',
      ],
      popular: false,
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      monthlyPrice: 39,
      yearlyPrice: 139,
      monthlyPriceId: status?.prices?.unlimitedMonthly,
      yearlyPriceId: status?.prices?.unlimitedYearly,
      features: [
        'Unlimited words',
        'Unlimited voice chat',
        'Unlimited Listen Mode',
        'Unlimited AI challenges',
        'All 8 conversation scenarios',
        'Partner invite',
        'Gift pass for another couple (yearly)',
      ],
      popular: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: accentHex }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
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
            Learn Polish for Love
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Choose the plan that fits your learning journey
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 p-1.5 rounded-xl" style={{ background: 'var(--bg-card)' }}>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly' ? 'shadow-sm' : ''
              }`}
              style={{
                background: billingPeriod === 'monthly' ? accentHex : 'transparent',
                color: billingPeriod === 'monthly' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly' ? 'shadow-sm' : ''
              }`}
              style={{
                background: billingPeriod === 'yearly' ? accentHex : 'transparent',
                color: billingPeriod === 'yearly' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                Save 70%
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
              You're on the <strong className="capitalize">{currentPlan}</strong> plan
              {status?.subscription?.period && ` (${status.subscription.period})`}
            </p>
            <button
              onClick={handleManageSubscription}
              className="mt-2 text-sm underline"
              style={{ color: accentHex }}
            >
              Manage subscription
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
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
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
                    Most Popular
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
                      /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-sm mt-1 text-green-600 dark:text-green-400">
                      ${(price / 12).toFixed(2)}/mo billed annually
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
                    Current Plan
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
                        Processing...
                      </>
                    ) : (
                      `Get ${plan.name}`
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
              Your Gift Passes
            </h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Share these codes with another couple to give them a free year of Standard!
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
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ or Trust Signals */}
        <div className="mt-12 text-center" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-sm">
            Cancel anytime. Secure payment via Stripe.
          </p>
          <p className="text-sm mt-2">
            Questions? Email us at{' '}
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
