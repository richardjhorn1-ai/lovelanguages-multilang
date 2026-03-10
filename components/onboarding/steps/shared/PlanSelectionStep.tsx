import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_GLASS } from '../../OnboardingStep';
import { supabase } from '../../../../services/supabase';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';
import { useNativePaywall } from '../../../../hooks/useNativePaywall';
import { purchasePackage, restorePurchases, hasActiveEntitlement } from '../../../../services/purchases';
import { apiFetch } from '../../../../services/api-config';
import { formatUsdPrice, getDisplaySubscriptionPrice, type BillingPeriod } from '../../../../services/subscription-pricing';
import { analytics } from '../../../../services/analytics';

interface PlanSelectionStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  onNext: (
    plan: 'free' | 'standard' | 'unlimited',
    priceId: string | null,
    billingPeriod: BillingPeriod
  ) => void;
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
  const { targetName } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'unlimited' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const {
    useIAP,
    loading: nativeCatalogLoading,
    error: nativeCatalogError,
    introEligible,
    refresh: refreshNativeCatalog,
    resolvePackageFor,
  } = useNativePaywall();
  const paymentSource = useIAP ? 'apple' : 'stripe';

  useEffect(() => {
    void fetchPrices();
    analytics.trackPaywallView({
      plan: useIAP ? 'standard' : 'free',
      trigger: 'onboarding',
      trigger_reason: 'onboarding',
      page_context: 'plan_selection',
      source: paymentSource,
    });
  }, [paymentSource, useIAP]);

  const fetchPrices = async () => {
    setError(null);
    if (useIAP) {
      setPrices(null);
      setLoading(false);
      return;
    }

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

      const response = await apiFetch('/api/subscription-status/', {
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

  // Handle iOS IAP purchase
  const handleIAPPurchase = async (plan: 'standard' | 'unlimited') => {
    console.log('[PlanSelectionStep] Attempting IAP purchase', {
      plan,
      billingPeriod,
      selectedPlan,
    });
    const pkg = await resolvePackageFor(plan, billingPeriod);

    if (!pkg) {
      analytics.trackPurchaseFailed({
        plan,
        billing_period: billingPeriod,
        error_code: 'product_not_available',
        error_message: nativeCatalogError || `Product ${plan}_${billingPeriod} not available`,
        source: 'apple',
      });
      setError(
        nativeCatalogError ||
        t('subscription.errors.pricingUnavailable', {
          defaultValue: 'Subscriptions are unavailable right now. Please try again.',
        })
      );
      return;
    }

    setPurchasing(true);
    setError(null);
    analytics.trackCheckoutStarted({
      plan,
      billing_period: billingPeriod,
      price: pkg.product?.price ?? 0,
      currency: pkg.product?.currencyCode || 'USD',
      source: 'apple',
    });
    try {
      console.log('[PlanSelectionStep] Calling purchasePackage', {
        plan,
        billingPeriod,
        productId: pkg.product?.identifier,
        packageId: pkg.identifier,
      });
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        onNext(plan, null, billingPeriod);
      }
    } catch (err: any) {
      console.error('[PlanSelectionStep] IAP purchase error:', err);
      analytics.trackPurchaseFailed({
        plan,
        billing_period: billingPeriod,
        error_code: err?.code || 'purchase_failed',
        error_message: err?.message || 'Purchase failed. Please try again.',
        source: 'apple',
      });
      setError(err?.message || 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // Restore Purchases handler — required by Apple on every subscription screen
  const handleRestorePurchases = async () => {
    setRestoring(true);
    setError(null);
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        const entitlement = hasActiveEntitlement(customerInfo);
        if (entitlement.isActive) {
          // User has an active subscription — advance onboarding
          onNext(
            entitlement.plan || 'standard',
            null,
            billingPeriod
          );
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
      tagline: t('subscription.choice.free.tagline', { defaultValue: 'Try everything free for 7 days' }),
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
      weeklyPrice: getDisplaySubscriptionPrice('standard', 'weekly'),
      monthlyPrice: getDisplaySubscriptionPrice('standard', 'monthly'),
      yearlyPrice: getDisplaySubscriptionPrice('standard', 'yearly'),
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
      weeklyPrice: getDisplaySubscriptionPrice('unlimited', 'weekly'),
      monthlyPrice: getDisplaySubscriptionPrice('unlimited', 'monthly'),
      yearlyPrice: getDisplaySubscriptionPrice('unlimited', 'yearly'),
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
  const visiblePlans = useIAP ? plans.filter((plan) => plan.id !== 'free') : plans;
  const displayError = error || nativeCatalogError;
  const showIntroTrial =
    useIAP && selectedPlan === 'standard' && billingPeriod === 'monthly' && introEligible;

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
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
          {t('onboarding.plan.title', { name: userName })}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.plan.subtitle', { language: targetName })}
        </p>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {displayError}
          <button
            onClick={useIAP ? () => void refreshNativeCatalog() : () => void fetchPrices()}
            className="ml-2 underline hover:no-underline font-medium"
          >
            {t('onboarding.plan.errors.retry')}
          </button>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex flex-row justify-center items-center gap-2 mb-6">
        {/* Weekly */}
        <button
          onClick={() => setBillingPeriod('weekly')}
          className={`flex-1 min-w-0 flex flex-col items-center px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
            billingPeriod === 'weekly'
              ? 'bg-[var(--accent-light)] border-[var(--accent-color)] shadow-sm'
              : 'bg-white/20 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-color)]'
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
          className={`flex-1 min-w-0 flex flex-col items-center px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
            billingPeriod === 'monthly'
              ? 'text-white shadow-lg'
              : 'bg-white/20 text-[var(--text-primary)]'
          }`}
          style={{
            background: billingPeriod === 'monthly' ? accentColor : undefined,
            borderColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}60, 0 0 40px ${accentColor}25`,
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
          className={`flex-1 min-w-0 flex flex-col items-center px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
            billingPeriod === 'yearly'
              ? 'bg-[var(--accent-light)] border-[var(--accent-color)] shadow-sm'
              : 'bg-white/20 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-color)]'
          }`}
          style={{
            '--accent-color': accentColor,
            '--accent-light': `${accentColor}15`,
            color: billingPeriod === 'yearly' ? accentColor : undefined,
          } as React.CSSProperties}
        >
          <span className="text-xs opacity-70 mb-0.5">{t('subscription.common.yearlyLabel')}</span>
          <span className="flex flex-wrap items-center justify-center gap-1">
            {t('subscription.common.yearly')}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white">
              {t('subscription.common.discount')}
            </span>
          </span>
        </button>
      </div>

      {/* Plan Cards - horizontal on desktop, stacked on mobile */}
      <div className={`grid grid-cols-1 ${useIAP ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'} gap-4 mb-6`}>
        {visiblePlans.map((plan, index) => {
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
              onClick={() => {
                setSelectedPlan(plan.id);
                if (plan.id !== 'free') {
                  analytics.trackPlanSelected({
                    plan: plan.id as 'free' | 'standard' | 'unlimited',
                    billing_period: billingPeriod,
                    source: paymentSource,
                  });
                }
              }}
              className="relative text-left p-4 transition-all animate-reveal"
              style={{
                ...ONBOARDING_GLASS,
                border: isSelected ? `2px solid ${accentColor}60` : '1px solid transparent',
                backgroundColor: isSelected ? `${accentColor}08` : 'rgba(255, 255, 255, 0.18)',
                boxShadow: isSelected
                  ? `0 4px 20px -4px ${accentColor}25`
                  : '0 8px 32px -8px rgba(0, 0, 0, 0.06)',
                animationDelay: `${0.1 * index}s`,
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
                      <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">7</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {t('subscription.common.days', { defaultValue: 'days' })}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {t('subscription.choice.free.noCard', { defaultValue: 'No card needed' })}
                      </div>
                    </>
                  ) : (
                    <>
                      {useIAP && plan.id === 'standard' && billingPeriod === 'monthly' && introEligible && (
                        <div className="text-xs font-semibold text-green-600 mb-1">
                          {t('subscription.choice.free.name', { defaultValue: '7-Day Free Trial' })}
                        </div>
                      )}
                      <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{formatUsdPrice(price)}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        /{periodLabel}
                      </div>
                      {billingPeriod === 'yearly' && (
                        <div className="text-xs text-green-600 mt-1">
                          {formatUsdPrice(price / 12)}/{t('subscription.common.mo')}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Plan name and features */}
                <div className="flex-1 md:w-full order-1 md:order-last">
                  <div className="flex items-center gap-3 mb-1 md:justify-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: accentColor }}
                      >
                        <ICONS.Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{plan.tagline}</p>
                  {useIAP && plan.id === 'standard' && billingPeriod === 'monthly' && introEligible && (
                    <p className="text-xs text-green-600 mb-3">
                      {t('subscription.choice.free.iosTrialNote', { defaultValue: '7 days free, then $17.99/mo. Cancel anytime.' })}
                    </p>
                  )}

                  <ul className="space-y-1 md:text-left">
                    {plan.features.slice(0, 4).map((feature, i) => {
                      const featureText = typeof feature === 'string' ? feature : feature.text;
                      const included = typeof feature === 'string' ? true : feature.included !== false;
                      return (
                        <li key={i} className={`flex items-center gap-2 text-sm ${included ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)] opacity-60'}`}>
                          {included ? (
                            <ICONS.Check className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                          ) : (
                            <span className="w-4 h-4 text-[var(--text-secondary)] opacity-60 text-center flex-shrink-0">✗</span>
                          )}
                          {featureText}
                        </li>
                      );
                    })}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-[var(--text-secondary)] pl-6">
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
        onClick={async () => {
          if (selectedPlan === 'free') {
            onNext('free', null, billingPeriod);
          } else if (useIAP && selectedPlan) {
            await handleIAPPurchase(selectedPlan as 'standard' | 'unlimited');
          } else {
            onNext(selectedPlan || 'standard', getPriceId(), billingPeriod);
          }
        }}
        disabled={!selectedPlan || purchasing || nativeCatalogLoading || (selectedPlan !== 'free' && !useIAP && !prices)}
        accentColor={!useIAP && selectedPlan === 'free' ? '#374151' : accentColor}
      >
        {purchasing
          ? t('onboarding.plan.processing', { defaultValue: 'Processing...' })
          : showIntroTrial
            ? t('subscription.choice.free.cta', { defaultValue: 'Start 7-Day Free Trial' })
            : selectedPlan === 'free'
              ? t('subscription.choice.free.cta', { defaultValue: 'Start 7-Day Free Trial' })
              : t('onboarding.plan.continueWith', {
                plan: selectedPlan ? visiblePlans.find((plan) => plan.id === selectedPlan)?.name : t('onboarding.plan.aPlan'),
              })
        }
      </NextButton>

      {/* Trust signals */}
      <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
        {showIntroTrial
          ? t('subscription.choice.free.iosTrialNote', { defaultValue: '7 days free, then $17.99/mo. Cancel anytime.' })
          : selectedPlan === 'free'
            ? (useIAP
                ? t('subscription.choice.free.iosTrialNote', { defaultValue: '7 days free, then $17.99/mo. Cancel anytime.' })
                : t('subscription.choice.free.noCardRequired', { defaultValue: 'No credit card required' }))
          : (useIAP
              ? t('onboarding.plan.trustSignalIOS', { defaultValue: 'In-app purchase via Apple. Cancel anytime in App Store subscriptions.' })
              : t('onboarding.plan.trustSignal'))
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
    </OnboardingStep>
  );
};
