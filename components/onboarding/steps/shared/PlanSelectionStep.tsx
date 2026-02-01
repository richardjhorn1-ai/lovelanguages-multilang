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
  standardWeekly: string;
  standardMonthly: string;
  standardYearly: string;
  unlimitedWeekly: string;
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
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'unlimited' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setError(null);
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        console.error('[PlanSelectionStep] No auth token available');
        setError(t('onboarding.plan.errors.authRequired'));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscription-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('[PlanSelectionStep] API error:', response.status);
        setError(t('onboarding.plan.errors.loadFailed'));
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!data.prices?.standardMonthly) {
        console.error('[PlanSelectionStep] Prices missing from response:', data);
        setError(t('onboarding.plan.errors.pricesUnavailable'));
        setLoading(false);
        return;
      }

      setPrices(data.prices);
    } catch (err) {
      console.error('[PlanSelectionStep] Error fetching prices:', err);
      setError(t('onboarding.plan.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getPriceId = (): string | null => {
    if (!prices || !selectedPlan) return null;

    if (selectedPlan === 'standard') {
      return billingPeriod === 'weekly'
        ? prices.standardWeekly
        : billingPeriod === 'monthly'
          ? prices.standardMonthly
          : prices.standardYearly;
    } else {
      return billingPeriod === 'weekly'
        ? prices.unlimitedWeekly
        : billingPeriod === 'monthly'
          ? prices.unlimitedMonthly
          : prices.unlimitedYearly;
    }
  };

  const plans = [
    {
      id: 'free' as const,
      name: t('subscription.choice.free.name', { defaultValue: '7-Day Free Trial' }),
      weeklyPrice: 0,
      monthlyPrice: 0,
      yearlyPrice: 0,
      tagline: t('subscription.choice.free.tagline', { defaultValue: 'Full access, then $19/mo' }),
      isTrial: true, // Special flag for trial display
      features: [
        { text: t('subscription.choice.free.feature1', { defaultValue: 'Full access for 7 days' }), included: true },
        { text: t('subscription.choice.free.feature2', { defaultValue: 'AI tutor conversations' }), included: true },
        { text: t('subscription.choice.free.feature3', { defaultValue: 'Voice practice' }), included: true },
        { text: t('subscription.choice.free.feature4', { defaultValue: 'All games & exercises' }), included: true },
        { text: t('subscription.choice.free.feature5', { defaultValue: 'Cancel anytime' }), included: true },
      ],
    },
    {
      id: 'standard' as const,
      name: t('onboarding.plan.standard.name'),
      weeklyPrice: 7,
      monthlyPrice: 19,
      yearlyPrice: 69,
      tagline: t('onboarding.plan.standard.tagline'),
      features: [
        { text: t('onboarding.plan.standard.feature1'), included: true },
        { text: t('onboarding.plan.standard.feature2'), included: true },
        { text: t('onboarding.plan.standard.feature3'), included: true },
        { text: t('onboarding.plan.standard.feature4'), included: true },
        { text: t('onboarding.plan.standard.feature5'), included: true },
      ],
    },
    {
      id: 'unlimited' as const,
      name: t('onboarding.plan.unlimited.name'),
      weeklyPrice: 12,
      monthlyPrice: 39,
      yearlyPrice: 139,
      tagline: t('onboarding.plan.unlimited.tagline'),
      popular: true,
      features: [
        { text: t('onboarding.plan.unlimited.feature1'), included: true },
        { text: t('onboarding.plan.unlimited.feature2'), included: true },
        { text: t('onboarding.plan.unlimited.feature3'), included: true },
        { text: t('onboarding.plan.unlimited.feature4'), included: true },
        { text: t('onboarding.plan.unlimited.feature5'), included: true },
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
      wide
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
          {t('onboarding.plan.title', { name: userName })}
        </h1>
        <p className="text-gray-600">
          {t('onboarding.plan.subtitle', { language: targetName })}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
          <button
            onClick={fetchPrices}
            className="ml-2 underline hover:no-underline font-medium"
          >
            {t('onboarding.plan.errors.retry')}
          </button>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-6">
        {/* Weekly */}
        <button
          onClick={() => setBillingPeriod('weekly')}
          className={`flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
            billingPeriod === 'weekly'
              ? 'bg-[var(--accent-light)] border-[var(--accent-color)] shadow-sm'
              : 'bg-white/80 border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
          style={{
            '--accent-color': accentColor,
            '--accent-light': `${accentColor}15`,
            color: billingPeriod === 'weekly' ? accentColor : undefined,
          } as React.CSSProperties}
        >
          <span className="text-xs opacity-70 mb-0.5">{t('subscription.common.weeklyLabel')}</span>
          <span>{t('subscription.common.weekly')}</span>
        </button>

        {/* Monthly - Featured with glow */}
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
            billingPeriod === 'monthly'
              ? 'text-white shadow-lg'
              : 'bg-white/80 text-gray-700'
          }`}
          style={{
            background: billingPeriod === 'monthly' ? accentColor : undefined,
            borderColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}66, 0 0 40px ${accentColor}33`,
          }}
        >
          <span className={`text-xs mb-0.5 ${billingPeriod === 'monthly' ? 'opacity-90' : 'opacity-70'}`}>
            {t('subscription.common.monthlyLabel')}
          </span>
          <span>{t('subscription.common.monthly')}</span>
        </button>

        {/* Yearly */}
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
            billingPeriod === 'yearly'
              ? 'bg-[var(--accent-light)] border-[var(--accent-color)] shadow-sm'
              : 'bg-white/80 border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
          style={{
            '--accent-color': accentColor,
            '--accent-light': `${accentColor}15`,
            color: billingPeriod === 'yearly' ? accentColor : undefined,
          } as React.CSSProperties}
        >
          <span className="text-xs opacity-70 mb-0.5">{t('subscription.common.yearlyLabel')}</span>
          <span className="flex items-center gap-1">
            {t('subscription.common.yearly')}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white">
              {t('subscription.common.discount')}
            </span>
          </span>
        </button>
      </div>

      {/* Plan Cards - horizontal on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => {
          const price = billingPeriod === 'weekly'
            ? plan.weeklyPrice
            : billingPeriod === 'monthly'
              ? plan.monthlyPrice
              : plan.yearlyPrice;
          const periodLabel = billingPeriod === 'weekly'
            ? t('subscription.common.wk')
            : billingPeriod === 'monthly'
              ? t('subscription.common.mo')
              : t('subscription.common.yr');
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
                  className="absolute -top-2 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 px-3 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
                  style={{ background: accentColor }}
                >
                  {t('onboarding.plan.popular')}
                </span>
              )}

              {/* Desktop: vertical card layout. Mobile: horizontal with price on right */}
              <div className="flex md:flex-col items-start md:items-center justify-between gap-4 md:gap-2 md:text-center">
                {/* Price - shown at top on desktop, right side on mobile */}
                <div className="order-2 md:order-first text-right md:text-center flex-shrink-0 md:mb-2">
                  {(plan as any).isTrial ? (
                    <>
                      <div className="text-2xl md:text-3xl font-bold text-gray-900">7</div>
                      <div className="text-xs text-gray-500">
                        {t('subscription.common.days', { defaultValue: 'days' })}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {t('subscription.choice.free.fullAccess', { defaultValue: 'Full access' })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl md:text-3xl font-bold text-gray-900">${price}</div>
                      <div className="text-xs text-gray-500">
                        /{periodLabel}
                      </div>
                      {billingPeriod === 'yearly' && (
                        <div className="text-xs text-green-600 mt-1">
                          ${(price / 12).toFixed(0)}/{t('subscription.common.mo')}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Plan name and features */}
                <div className="flex-1 md:w-full order-1 md:order-last">
                  <div className="flex items-center gap-3 mb-1 md:justify-center">
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

                  <ul className="space-y-1 md:text-left">
                    {plan.features.slice(0, 4).map((feature, i) => {
                      const featureText = typeof feature === 'string' ? feature : feature.text;
                      const included = typeof feature === 'string' ? true : feature.included !== false;
                      return (
                        <li key={i} className={`flex items-center gap-2 text-sm ${included ? 'text-gray-600' : 'text-gray-400'}`}>
                          {included ? (
                            <ICONS.Check className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                          ) : (
                            <span className="w-4 h-4 text-gray-300 text-center flex-shrink-0">✗</span>
                          )}
                          {featureText}
                        </li>
                      );
                    })}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-gray-400 pl-6">
                        {t('onboarding.plan.moreFeatures', { count: plan.features.length - 4 })}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <NextButton
        onClick={() => onNext(selectedPlan || 'standard', selectedPlan === 'free' ? null : getPriceId())}
        disabled={!selectedPlan || (selectedPlan !== 'free' && !prices)}
        accentColor={selectedPlan === 'free' ? '#374151' : accentColor}
      >
        {selectedPlan === 'free'
          ? t('subscription.choice.free.cta', { defaultValue: 'Start 7-Day Free Trial' })
          : t('onboarding.plan.continueWith', { plan: selectedPlan ? plans.find(p => p.id === selectedPlan)?.name : t('onboarding.plan.aPlan') })
        }
      </NextButton>

      {/* Trust signals */}
      <p className="text-center text-xs text-gray-400 mt-4">
        {selectedPlan === 'free'
          ? t('subscription.choice.free.noCardRequired', { defaultValue: 'No credit card required' })
          : t('onboarding.plan.trustSignal')
        }
      </p>
    </OnboardingStep>
  );
};
