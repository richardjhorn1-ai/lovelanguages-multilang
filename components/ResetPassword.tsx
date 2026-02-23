import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if we have a valid session (user clicked email link)
  // Supabase needs a moment to process the token from the URL
  useEffect(() => {
    const checkSession = async () => {
      // Give Supabase time to process the URL token
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      setChecking(false);
      if (!session) {
        setError(t('resetPassword.invalidLink'));
      }
    };
    checkSession();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordsMustMatch'));
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setMessage(t('resetPassword.success'));
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
            {t('resetPassword.title')}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {checking && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">{t('resetPassword.verifying')}</p>
          </div>
        )}

        {!checking && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-700 text-sm font-semibold">{error}</p>
          </div>
        )}

        {!checking && message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="text-green-700 text-sm font-semibold">{message}</p>
          </div>
        )}

        {!checking && !error && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                {t('resetPassword.newPassword')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-color)] focus:border-rose-400 focus:outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                {t('resetPassword.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-color)] focus:border-rose-400 focus:outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-rose-600 transition-all disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
            </button>
          </form>
        )}

        {success && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <ICONS.Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-[var(--text-secondary)]">{t('resetPassword.redirecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
