import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { ICONS } from '../constants';

interface SubscriptionRequiredProps {
  profile: Profile;
  onSubscribed: () => void;
}

const SubscriptionRequired: React.FC<SubscriptionRequiredProps> = ({ profile, onSubscribed }) => {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'unlimited'>('unlimited');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      id: 'standard' as const,
      name: 'Standard',
      monthlyPrice: 19,
      yearlyPrice: 69,
      tagline: 'Perfect for getting started',
      features: [
        '2,000 words in Love Log',
        '60 min voice chat/month',
        '30 min Listen Mode/month',
        'All conversation scenarios',
        'Partner invite',
      ],
    },
    {
      id: 'unlimited' as const,
      name: 'Unlimited',
      monthlyPrice: 39,
      yearlyPrice: 139,
      tagline: 'For dedicated learners',
      popular: true,
      features: [
        'Unlimited everything',
        'Unlimited voice chat',
        'Unlimited Listen Mode',
        'All conversation scenarios',
        'Gift pass for another couple (yearly)',
      ],
    },
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setError('Please log in again');
        setLoading(false);
        return;
      }

      // Get price IDs
      const statusResponse = await fetch('/api/subscription-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!statusResponse.ok) {
        setError('Failed to load pricing. Please try again.');
        setLoading(false);
        return;
      }

      const statusData = await statusResponse.json();
      const prices = statusData.prices;

      // Determine price ID
      let priceId: string | null = null;
      if (selectedPlan === 'standard') {
        priceId = billingPeriod === 'monthly' ? prices.standardMonthly : prices.standardYearly;
      } else {
        priceId = billingPeriod === 'monthly' ? prices.unlimitedMonthly : prices.unlimitedYearly;
      }

      if (!priceId) {
        setError('Pricing not available. Please contact support.');
        setLoading(false);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/?subscription=success`,
          cancelUrl: `${window.location.origin}/?subscription=canceled`
        })
      });

      const checkoutData = await response.json();

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        setError(checkoutData.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Force reload to ensure clean state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-3xl font-black text-gray-800 mb-2 font-header">
            One more step, {profile.full_name || 'Friend'}!
          </h1>
          <p className="text-gray-600">
            Complete your subscription to start learning Polish together
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-white/80 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingPeriod === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                70% off
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-4 mb-6">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isSelected = selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 right-4 px-3 py-0.5 rounded-full text-xs font-bold text-white bg-rose-500">
                    Popular
                  </span>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                          <ICONS.Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{plan.tagline}</p>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <ICONS.Check className="w-4 h-4 text-rose-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-gray-900">${price}</div>
                    <div className="text-xs text-gray-500">
                      /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                    </div>
                    {billingPeriod === 'yearly' && (
                      <div className="text-xs text-green-600 mt-1">
                        ${(price / 12).toFixed(0)}/mo
                      </div>
                    )}
                  </div>
                </div>
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

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            `Subscribe to ${selectedPlan === 'standard' ? 'Standard' : 'Unlimited'}`
          )}
        </button>

        {/* Trust signals */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Secure payment via Stripe. Cancel anytime.
        </p>

        {/* Logout option */}
        <div className="text-center mt-6">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequired;
