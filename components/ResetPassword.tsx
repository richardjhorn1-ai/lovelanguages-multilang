import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useScrollablePage } from '../hooks/useScrollablePage';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import EyeIcon from './EyeIcon';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useScrollablePage();

  // Verify we have a valid session (set by AuthCallback before navigating here).
  // Uses polling with exponential backoff instead of a fixed delay, so it works
  // reliably regardless of how fast/slow the token exchange completed.
  useEffect(() => {
    let cancelled = false;
    const maxAttempts = 5;
    const delays = [0, 200, 500, 1000, 2000]; // immediate, then backoff

    const checkSession = async () => {
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return;
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!cancelled) setChecking(false);
          return;
        }
      }
      // All attempts exhausted — no valid session
      if (!cancelled) {
        setChecking(false);
        setError(t('resetPassword.invalidLink'));
      }
    };
    checkSession();
    return () => { cancelled = true; };
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
    <div className="min-h-screen overflow-y-auto bg-[#FFF0F3] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">&#10084;&#65039;</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
            {t('resetPassword.title')}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {/* Loading state */}
        {checking && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] text-sm">{t('resetPassword.verifying')}</p>
          </div>
        )}

        {/* Error state */}
        {!checking && error && !success && (
          <div className="text-center py-4">
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              {t('resetPassword.tryAgainHint', 'Please request a new password reset link and try again.')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold transition-all hover:opacity-90 shadow-lg"
            >
              {t('resetPassword.backToHome', 'Back to home')}
            </button>
          </div>
        )}

        {/* Success message */}
        {!checking && message && !error && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="text-green-700 text-sm font-semibold">{message}</p>
          </div>
        )}

        {/* Password form */}
        {!checking && !error && !success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-3 ml-1">
                {t('resetPassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-[var(--border-color)] focus:border-pink-400 focus:outline-none transition-all font-bold bg-[var(--bg-card)] text-[var(--text-primary)]"
                  placeholder="Choose a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-3 ml-1">
                {t('resetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-[var(--border-color)] focus:border-pink-400 focus:outline-none transition-all font-bold bg-[var(--bg-card)] text-[var(--text-primary)]"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-black py-5 rounded-2xl shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.15em] mt-2 hover:scale-[1.02] bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
              style={{ boxShadow: '0 20px 40px -10px rgba(255, 107, 138, 0.4)' }}
            >
              {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
            </button>
          </form>
        )}

        {/* Success state */}
        {success && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <ICONS.Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-[var(--text-primary)] font-bold mb-1">{message}</p>
            <p className="text-[var(--text-secondary)] text-sm">{t('resetPassword.redirecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
