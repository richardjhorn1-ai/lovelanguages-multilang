import React, { useState, useEffect } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { supabase } from '../../../../services/supabase';
import { ICONS } from '../../../../constants';

interface PlanSelectionStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  onNext: (plan: string, priceId: string | null) => void;
  onBack: () => void;
  accentColor?: string;
}

interface Prices {
  standardMonthly: string;
  standardYearly: string;
  unlimitedMonthly: string;
  unlimitedYearly: string;
}

export const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({
  currentStep,
  totalSteps,
  userName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'unlimited' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
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
        setPrices(data.prices);
      }
    } catch (err) {
      console.error('[PlanSelectionStep] Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceId = (): string | null => {
    if (!prices || !selectedPlan) return null;

    if (selectedPlan === 'standard') {
      return billingPeriod === 'monthly' ? prices.standardMonthly : prices.standardYearly;
    } else {
      return billingPeriod === 'monthly' ? prices.unlimitedMonthly : prices.unlimitedYearly;
    }
  };

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

  if (loading) {
    return (
      <OnboardingStep
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        accentColor={accentColor}
      >
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
          />
        </div>
      </OnboardingStep>
    );
  }

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          Choose your plan, {userName}
        </h1>
        <p className="text-gray-600">
          Start your Polish learning journey today
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-gray-100">
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
      <div className="grid gap-4 mb-6">
        {plans.map((plan) => {
          const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          const isSelected = selectedPlan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-[var(--accent-color)] bg-[var(--accent-light)]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={{
                '--accent-color': accentColor,
                '--accent-light': `${accentColor}10`,
              } as React.CSSProperties}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <span
                  className="absolute -top-2 right-4 px-3 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ background: accentColor }}
                >
                  Popular
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: accentColor }}
                      >
                        <ICONS.Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{plan.tagline}</p>

                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <ICONS.Check className="w-4 h-4" style={{ color: accentColor }} />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-gray-400 pl-6">
                        +{plan.features.length - 3} more features
                      </li>
                    )}
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

      {/* Continue Button */}
      <NextButton
        onClick={() => onNext(selectedPlan || 'standard', getPriceId())}
        disabled={!selectedPlan}
        accentColor={accentColor}
      >
        Continue with {selectedPlan ? plans.find(p => p.id === selectedPlan)?.name : 'a plan'}
      </NextButton>

      {/* Trust signals */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Secure payment via Stripe. Cancel anytime.
      </p>
    </OnboardingStep>
  );
};
