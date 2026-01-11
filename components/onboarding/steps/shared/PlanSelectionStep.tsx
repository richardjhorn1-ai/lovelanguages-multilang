import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { supabase } from '../../../../services/supabase';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';

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
  const { t } = useTranslation();
  const { targetLanguage } = useLanguage();
  const targetName = LANGUAGE_CONFIGS[targetLanguage]?.name || 'your language';
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
      name: t('onboarding.plan.standard.name'),
      monthlyPrice: 19,
      yearlyPrice: 69,
      tagline: t('onboarding.plan.standard.tagline'),
      features: [
        t('onboarding.plan.standard.feature1'),
        t('onboarding.plan.standard.feature2'),
        t('onboarding.plan.standard.feature3'),
        t('onboarding.plan.standard.feature4'),
        t('onboarding.plan.standard.feature5'),
      ],
    },
    {
      id: 'unlimited' as const,
      name: t('onboarding.plan.unlimited.name'),
      monthlyPrice: 39,
      yearlyPrice: 139,
      tagline: t('onboarding.plan.unlimited.tagline'),
      popular: true,
      features: [
        t('onboarding.plan.unlimited.feature1'),
        t('onboarding.plan.unlimited.feature2'),
        t('onboarding.plan.unlimited.feature3'),
        t('onboarding.plan.unlimited.feature4'),
        t('onboarding.plan.unlimited.feature5'),
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
          {t('onboarding.plan.title', { name: userName })}
        </h1>
        <p className="text-gray-600">
          {t('onboarding.plan.subtitle', { language: targetName })}
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
            {t('onboarding.plan.monthly')}
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billingPeriod === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            {t('onboarding.plan.yearly')}
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
              {t('onboarding.plan.discount')}
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
                  {t('onboarding.plan.popular')}
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
                        {t('onboarding.plan.moreFeatures', { count: plan.features.length - 3 })}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">${price}</div>
                  <div className="text-xs text-gray-500">
                    {billingPeriod === 'monthly' ? t('onboarding.plan.perMonth') : t('onboarding.plan.perYear')}
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-xs text-green-600 mt-1">
                      {t('onboarding.plan.monthlyEquivalent', { price: (price / 12).toFixed(0) })}
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
        {t('onboarding.plan.continueWith', { plan: selectedPlan ? plans.find(p => p.id === selectedPlan)?.name : t('onboarding.plan.aPlan') })}
      </NextButton>

      {/* Trust signals */}
      <p className="text-center text-xs text-gray-400 mt-4">
        {t('onboarding.plan.trustSignal')}
      </p>
    </OnboardingStep>
  );
};
