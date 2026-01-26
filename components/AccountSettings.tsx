import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

interface AccountSettingsProps {
  email: string;
  accentHex: string;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ email, accentHex }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
            <span className="text-xl">⚙️</span>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-[var(--text-primary)]">{t('accountSettings.title')}</h3>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 text-sm font-semibold">{message}</p>
            </div>
          )}

          {/* Current Email */}
          <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-all"
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
          <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
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
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
