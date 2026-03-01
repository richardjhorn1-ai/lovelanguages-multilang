import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

interface PromoStatus {
  hasPromo: boolean;
  expiresAt: string | null;
  daysRemaining: number;
}

interface AccountSettingsProps {
  email: string;
  accentHex: string;
  subscriptionPlan?: string | null;
  promoExpiresAt?: string | null;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  email,
  accentHex,
  subscriptionPlan,
  promoExpiresAt
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);

  // Data export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Check if user has active subscription
  const hasSubscription = subscriptionPlan && subscriptionPlan !== 'none' && subscriptionPlan !== 'free';

  // Check if user has active promo (from prop or fetched status)
  const hasActivePromo = promoExpiresAt && new Date(promoExpiresAt) > new Date();

  // Fetch promo status on mount
  useEffect(() => {
    if (!hasSubscription) {
      fetchPromoStatus();
    }
  }, [hasSubscription]);

  const fetchPromoStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/promo-status/', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPromoStatus(data);
      }
    } catch (err) {
      console.error('[AccountSettings] Error fetching promo status:', err);
    }
  };

  const handlePromoRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoMessage('');

    if (!promoCode.trim()) {
      setPromoError(t('promo.errorInvalid'));
      return;
    }

    setPromoLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPromoError('Not authenticated');
        setPromoLoading(false);
        return;
      }

      const response = await fetch('/api/promo-redeem/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: promoCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        // Map API errors to translation keys
        if (data.error?.includes('subscription')) {
          setPromoError(t('promo.errorSubscribed'));
        } else if (data.error?.includes('active')) {
          setPromoError(t('promo.errorActive'));
        } else if (data.error?.includes('limit')) {
          setPromoError(t('promo.errorMaxUses'));
        } else {
          setPromoError(t('promo.errorInvalid'));
        }
      } else {
        setPromoMessage(t('promo.success', { days: data.grantDays || 7 }));
        setPromoCode('');
        // Refresh promo status
        fetchPromoStatus();
      }
    } catch (err) {
      console.error('[AccountSettings] Error redeeming promo:', err);
      setPromoError(t('promo.errorInvalid'));
    } finally {
      setPromoLoading(false);
    }
  };

  // Calculate days remaining for active promo
  const getDaysRemaining = (): number => {
    const expiresAt = promoStatus?.expiresAt || promoExpiresAt;
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newEmail || newEmail === email) {
      setError(t('accountSettings.enterNewEmail'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError(t('accountSettings.invalidEmail'));
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage(t('accountSettings.emailUpdateSent'));
      setShowEmailForm(false);
      setNewEmail('');
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage(t('accountSettings.passwordResetSent'));
    }
  };

  // Export user data handler
  const handleExportData = async () => {
    setExportLoading(true);
    setExportMessage('');
    setExportError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setExportError(t('accountSettings.sessionExpired', { defaultValue: 'Session expired. Please log in again.' }));
        setExportLoading(false);
        return;
      }

      const response = await fetch('/api/export-user-data/', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export data');
      }

      const data = await response.json();
      const jsonString = JSON.stringify(data.data, null, 2);
      const filename = `love-languages-data-${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.getPlatform() === 'ios') {
        // iOS: <a download> doesn't work in WKWebView — use Filesystem + Share
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const result = await Filesystem.writeFile({
          path: filename,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: 'Love Languages Data Export',
          url: result.uri,
        });
      } else {
        // Web: standard blob download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportMessage(t('accountSettings.exportSuccess', { defaultValue: 'Your data has been downloaded.' }));
    } catch (err: any) {
      setExportError(err.message || t('accountSettings.exportFailed', { defaultValue: 'Failed to export data. Please try again.' }));
    } finally {
      setExportLoading(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDeleteError(t('accountSettings.sessionExpired', { defaultValue: 'Session expired. Please log in again.' }));
        setDeleteLoading(false);
        return;
      }

      const response = await fetch('/api/delete-account/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to landing page
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      setDeleteError(err.message || t('accountSettings.deleteFailed', { defaultValue: 'Failed to delete account. Please try again.' }));
      setDeleteLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
            <span className="text-xl">⚙️</span>
          </div>
          <div className="text-left">
            <h3 className="font-bold font-header text-[var(--text-primary)]">{t('accountSettings.title')}</h3>
            <p className="text-scale-caption text-[var(--text-secondary)]">{t('accountSettings.subtitle')}</p>
          </div>
        </div>
        <ICONS.ChevronDown
          className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-700 dark:text-red-300 text-sm font-semibold">{error}</p>
            </div>
          )}
          {message && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-green-700 dark:text-green-300 text-sm font-semibold">{message}</p>
            </div>
          )}

          {/* Current Email */}
          <div className="p-4 bg-white/40 dark:bg-white/12 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                  {t('accountSettings.email')}
                </p>
                <p className="font-semibold text-[var(--text-primary)]">{email}</p>
              </div>
              <button
                onClick={() => {
                  setShowEmailForm(!showEmailForm);
                  setError('');
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
              >
                {showEmailForm ? t('accountSettings.cancel') : t('accountSettings.change')}
              </button>
            </div>

            {/* Email Change Form */}
            {showEmailForm && (
              <form onSubmit={handleEmailChange} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('accountSettings.newEmailPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-color)] focus:border-[var(--accent-color)] focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-bold transition-all disabled:opacity-50"
                  style={{ backgroundColor: accentHex }}
                >
                  {loading ? t('accountSettings.updating') : t('accountSettings.updateEmail')}
                </button>
                <p className="text-xs text-[var(--text-secondary)] text-center">
                  {t('accountSettings.emailConfirmNote')}
                </p>
              </form>
            )}
          </div>

          {/* Password */}
          <div className="p-4 bg-white/40 dark:bg-white/12 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                  {t('accountSettings.password')}
                </p>
                <p className="font-semibold text-[var(--text-primary)]">••••••••</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
              >
                {loading ? t('accountSettings.sending') : t('accountSettings.changePassword')}
              </button>
            </div>
          </div>

          {/* Creator Access - Show for all users */}
          <div className="p-4 bg-white/40 dark:bg-white/12 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                {t('promo.title')}
              </p>

              {/* Promo messages */}
              {promoError && (
                <div className="p-3 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-700 dark:text-red-300 text-sm font-semibold">{promoError}</p>
                </div>
              )}
              {promoMessage && (
                <div className="p-3 mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-green-700 dark:text-green-300 text-sm font-semibold">{promoMessage}</p>
                </div>
              )}

              {/* Show different UI based on promo status */}
              {(hasActivePromo || (promoStatus?.hasPromo && getDaysRemaining() > 0)) ? (
                // Active promo - show expiry countdown
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: `${accentHex}15` }}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ICONS.Sparkles className="w-5 h-5" style={{ color: accentHex }} />
                    <span className="font-black text-lg" style={{ color: accentHex }}>
                      {t('promo.activeUntil', { days: getDaysRemaining() })}
                    </span>
                  </div>
                </div>
              ) : (
                // No active promo - show code input
                <form onSubmit={handlePromoRedeem} className="space-y-3">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    {t('promo.enterCode')}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder={t('promo.placeholder')}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--border-color)] focus:border-[var(--accent-color)] focus:outline-none transition-all uppercase"
                      disabled={promoLoading}
                    />
                    <button
                      type="submit"
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-6 py-3 rounded-xl text-white font-bold transition-all disabled:opacity-50"
                      style={{ backgroundColor: accentHex }}
                    >
                      {promoLoading ? '...' : t('promo.apply')}
                    </button>
                  </div>
                </form>
              )}
            </div>

          {/* Export My Data */}
          <div className="p-4 bg-white/40 dark:bg-white/12 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                  {t('accountSettings.exportData', { defaultValue: 'Your Data' })}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('accountSettings.exportDataDesc', { defaultValue: 'Download all your data as JSON' })}
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
              >
                {exportLoading
                  ? t('accountSettings.exporting', { defaultValue: 'Exporting...' })
                  : t('accountSettings.exportButton', { defaultValue: 'Export' })
                }
              </button>
            </div>
            {exportMessage && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-green-700 dark:text-green-300 text-sm font-semibold">{exportMessage}</p>
              </div>
            )}
            {exportError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-700 dark:text-red-300 text-sm font-semibold">{exportError}</p>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="p-4 bg-white/40 dark:bg-white/12 rounded-2xl border border-red-200/50 dark:border-red-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-500 dark:text-red-400 mb-1">
                  {t('accountSettings.dangerZone', { defaultValue: 'Danger Zone' })}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('accountSettings.deleteDesc', { defaultValue: 'Permanently delete your account and all data' })}
                </p>
              </div>
              {!showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  {t('accountSettings.deleteButton', { defaultValue: 'Delete' })}
                </button>
              )}
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-700 dark:text-red-300 text-sm font-semibold mb-2">
                    {t('accountSettings.deleteWarning', { defaultValue: 'This will permanently delete:' })}
                  </p>
                  <ul className="text-red-600 dark:text-red-400 text-sm space-y-1 ml-4 list-disc">
                    <li>{t('accountSettings.deleteItem1', { defaultValue: 'All conversations and messages' })}</li>
                    <li>{t('accountSettings.deleteItem2', { defaultValue: 'Your vocabulary and progress' })}</li>
                    <li>{t('accountSettings.deleteItem3', { defaultValue: 'Subscription (will be cancelled)' })}</li>
                    <li>{t('accountSettings.deleteItem4', { defaultValue: 'Partner connection' })}</li>
                  </ul>
                </div>

                <p className="text-sm text-[var(--text-secondary)]">
                  {t('accountSettings.deleteConfirmPrompt', { defaultValue: 'Type DELETE MY ACCOUNT to confirm:' })}
                </p>

                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-4 py-3 rounded-xl border-2 border-red-300 dark:border-red-700 focus:border-red-500 focus:outline-none transition-all text-sm font-mono"
                />

                {deleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-red-700 dark:text-red-300 text-sm font-semibold">{deleteError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation('');
                      setDeleteError('');
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:opacity-80"
                  >
                    {t('accountSettings.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmation !== 'DELETE MY ACCOUNT'}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all text-white disabled:opacity-30 bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading
                      ? t('accountSettings.deleting', { defaultValue: 'Deleting...' })
                      : t('accountSettings.confirmDelete', { defaultValue: 'Delete Forever' })
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
