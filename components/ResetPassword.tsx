import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if we have a valid session (user clicked email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
        window.location.href = '/';
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
            {t('resetPassword.title')}
          </h1>
          <p className="text-gray-600">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-700 text-sm font-semibold">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="text-green-700 text-sm font-semibold">{message}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                {t('resetPassword.newPassword')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                {t('resetPassword.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-400 focus:outline-none transition-all font-medium"
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
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-600">{t('resetPassword.redirecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
