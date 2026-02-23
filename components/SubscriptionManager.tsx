import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

interface SubscriptionManagerProps {
  profile: {
    id: string;
    subscription_plan: string | null;
    subscription_status: string | null;
    subscription_ends_at: string | null;
    subscription_granted_by: string | null;
    linked_user_id: string | null;
    stripe_customer_id: string | null;
    promo_expires_at?: string | null;
    free_tier_chosen_at?: string | null;
  };
  partnerName?: string;
  onUpgrade?: () => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ profile, partnerName, onUpgrade }) => {
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  const isInherited = !!profile.subscription_granted_by;
  const hasPartner = !!profile.linked_user_id;
  const isPayer = profile.stripe_customer_id && !isInherited;
  const hasActivePromo = profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date();
  const isFreeTier = !!profile.free_tier_chosen_at && !profile.subscription_status && !hasActivePromo && !isInherited;

  // Calculate days until promo expires
  const getPromoDaysRemaining = () => {
    if (!profile.promo_expires_at) return 0;
    const now = new Date();
    const expires = new Date(profile.promo_expires_at);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanDisplay = (plan: string | null) => {
    switch (plan) {
      case 'standard': return t('subscription.plans.standard');
      case 'unlimited': return t('subscription.plans.unlimited');
      case 'free': return t('subscription.plans.free');
      default: return t('subscription.plans.none');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'past_due': return 'text-amber-500';
      case 'canceled': return 'text-red-500';
      default: return 'text-[var(--text-secondary)]';
    }
  };

  const handleManageSubscription = async () => {
    // If they have a partner who will lose access, show warning first
    if (hasPartner && isPayer && !showWarning) {
      setShowWarning(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/create-customer-portal/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to open portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error opening portal:', err);
      setError(err.message || 'Failed to open subscription management');
      setShowWarning(false);
    }
    setLoading(false);
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to pricing page
      window.location.hash = '/pricing';
    }
  };

  // Free tier user (chose free, no subscription)
  if (isFreeTier) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ICONS.BarChart className="w-8 h-8 text-[var(--accent-color)]" />
          <div>
            <h3 className="font-bold font-header text-[var(--text-primary)]">{t('subscription.manager.freePlan')}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('subscription.manager.freeDescription')}
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full py-3 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all active:scale-[0.98]"
        >
          {t('subscription.manager.upgradeButton')}
        </button>
      </div>
    );
  }

  // Promo user (creator access)
  if (hasActivePromo) {
    const daysRemaining = getPromoDaysRemaining();
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ICONS.Sparkles className="w-8 h-8 text-[var(--accent-color)]" />
          <div>
            <h3 className="font-bold font-header text-[var(--text-primary)]">{t('promo.title')}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('subscription.manager.promoExpires', { days: daysRemaining })}
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full py-3 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all active:scale-[0.98]"
        >
          {t('subscription.manager.subscribeToKeep')}
        </button>
      </div>
    );
  }

  // Partner with inherited subscription - can't manage
  if (isInherited) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ICONS.Heart className="w-8 h-8 text-[var(--accent-color)]" />
          <div>
            <h3 className="font-bold font-header text-[var(--text-primary)]">{t('subscription.manager.couplePass')}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('subscription.manager.freeAccess', { name: partnerName || t('subscription.manager.yourPartner') })}
            </p>
          </div>
        </div>

        <div className="text-sm text-[var(--text-secondary)] space-y-1">
          <p>
            {t('subscription.manager.plan')} <strong className="text-[var(--text-primary)]">{getPlanDisplay(profile.subscription_plan)}</strong>
          </p>
          <p>
            {t('subscription.manager.status')} <strong className={getStatusColor(profile.subscription_status)}>
              {profile.subscription_status || 'Active'}
            </strong>
          </p>
          {profile.subscription_ends_at && (
            <p>
              {t('subscription.manager.validUntil')} <strong className="text-[var(--text-primary)]">
                {formatDate(profile.subscription_ends_at)}
              </strong>
            </p>
          )}
        </div>

        <p className="text-xs text-[var(--text-secondary)] mt-4 italic border-t border-[var(--border-color)] pt-4">
          {t('subscription.manager.askPartner', { name: partnerName || t('subscription.manager.yourPartner') })}
        </p>
      </div>
    );
  }

  // No subscription at all (shouldn't happen normally if paywall works)
  if (!profile.subscription_plan || profile.subscription_plan === 'none' || profile.subscription_plan === 'free') {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💳</span>
          <div>
            <h3 className="font-bold font-header text-[var(--text-primary)]">{t('subscription.manager.noSubscription')}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('subscription.manager.subscribeToUnlock')}
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full py-3 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all active:scale-[0.98]"
        >
          {t('subscription.manager.upgradeButton')}
        </button>
      </div>
    );
  }

  // Payer - can manage
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">💳</span>
        <div>
          <h3 className="font-bold font-header text-[var(--text-primary)]">{t('subscription.manager.yourSubscription')}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('subscription.manager.planLabel', { plan: getPlanDisplay(profile.subscription_plan) })}
          </p>
        </div>
      </div>

      <div className="text-sm text-[var(--text-secondary)] space-y-1 mb-4">
        <p>
          {t('subscription.manager.status')} <strong className={getStatusColor(profile.subscription_status)}>
            {profile.subscription_status}
          </strong>
        </p>
        {profile.subscription_ends_at && (
          <p>
            {profile.subscription_status === 'canceled' ? t('subscription.manager.ends') : t('subscription.manager.renews')}{' '}
            <strong className="text-[var(--text-primary)]">
              {formatDate(profile.subscription_ends_at)}
            </strong>
          </p>
        )}
        {hasPartner && (
          <p className="mt-2 pt-2 border-t border-[var(--border-color)]">
            <ICONS.Heart className="w-4 h-4 text-pink-500 inline-block" /> {t('subscription.manager.partnerFreeAccess', { name: partnerName || t('subscription.manager.yourPartner') })}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-3 mb-4 text-scale-label">
          {error}
        </div>
      )}

      {showWarning && hasPartner && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
          <p className="text-amber-800 dark:text-amber-200 text-scale-label font-medium">
            {t('subscription.manager.cancelWarning', { name: partnerName || t('subscription.manager.yourPartner') })}
          </p>
        </div>
      )}

      <button
        onClick={handleManageSubscription}
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {t('subscription.common.opening')}
          </span>
        ) : showWarning ? (
          t('subscription.manager.continueToManage')
        ) : (
          t('subscription.manager.manageSubscription')
        )}
      </button>
    </div>
  );
};

export default SubscriptionManager;
