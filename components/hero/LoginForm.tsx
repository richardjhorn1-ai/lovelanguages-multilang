import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND, HeroRole, SelectionStep } from './heroConstants';
import { supabase } from '../../services/supabase';
import { ICONS } from '../../constants';

interface LoginFormProps {
  context: { header: string; cta: string; subtext: string };
  isStudent: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  message: string;
  onSubmit: (e: React.FormEvent) => void;
  selectedRole: HeroRole;
  setMessage: (v: string) => void;
  currentStep: SelectionStep;
}

const LoginForm: React.FC<LoginFormProps> = ({
  context,
  isStudent,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  isSignUp,
  setIsSignUp,
  message,
  onSubmit,
  selectedRole,
  setMessage,
  currentStep
}) => {
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage(t('hero.login.enterEmailFirst'));
      return;
    }
    setResetLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    setResetLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(t('hero.login.resetEmailSent'));
      setShowForgotPassword(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setMessage('');

    // Store the selected role in localStorage so we can retrieve it after OAuth redirect
    localStorage.setItem('intended_role', selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(null);
    }
  };
  const { t } = useTranslation();
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentHover = isStudent ? BRAND.primaryHover : BRAND.tealHover;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;

  // Check if error suggests user should sign up instead
  const isCredentialsError = message && (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('credentials') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('no user')
  );
  const hasError = message && !message.toLowerCase().includes('check');
  const errorBorderColor = '#ef4444'; // red-500

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-5">
        <h3
          className="text-3xl md:text-4xl font-black mb-2 font-header transition-all duration-300"
          style={{ color: 'var(--text-primary)' }}
        >
          {context.header}
        </h3>
        <p className="font-semibold text-scale-body transition-all duration-300" style={{ color: 'var(--text-secondary)' }}>
          {context.subtext}
        </p>
      </div>

      {/* View A — OAuth buttons (default) */}
      {!showEmailForm && (
        <>
          <div className="space-y-3">
            {/* Google button */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-[var(--border-color)] bg-white font-bold text-[var(--text-primary)] transition-all hover:border-gray-300 hover:bg-[var(--bg-primary)] disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{t('hero.login.continueWithGoogle')}</span>
            </button>

            {/* Apple button */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('apple')}
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-black text-white font-bold transition-all hover:bg-gray-900 disabled:opacity-50"
            >
              {oauthLoading === 'apple' ? (
                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              <span>{t('hero.login.continueWithApple', 'Continue with Apple')}</span>
            </button>
          </div>

          {/* Free tier reassurance */}
          <p className="text-center text-scale-caption text-[var(--text-secondary)] mt-4">
            {isStudent ? t('signup.freeStartLearning', 'Start learning for $0.00') : t('signup.freeStartTeaching', 'Start teaching for $0.00')}
          </p>

          {/* Divider — switch to email */}
          <div className="flex items-center gap-4 mt-5">
            <div className="flex-1 h-px bg-gray-200" />
            <button
              type="button"
              onClick={() => { setShowEmailForm(true); setMessage(''); }}
              className="text-scale-caption font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('hero.login.orContinueWithEmail', 'or continue with email')}
            </button>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      {/* View B — Email/Password form */}
      {showEmailForm && (
        <>
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Inline error message */}
            {hasError && (
              <div className="flex items-center gap-2 text-red-500 text-scale-label font-semibold animate-shake">
                <ICONS.AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <div>
              <label className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: hasError ? '#ef4444' : 'var(--text-secondary)' }}>
                {t('hero.login.emailLabel')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (message) setMessage(''); }}
                required
                className="w-full px-6 py-5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-body"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: hasError ? errorBorderColor : 'var(--border-color)' }}
                onFocus={(e) => e.target.style.borderColor = hasError ? errorBorderColor : accentColor}
                onBlur={(e) => e.target.style.borderColor = hasError ? errorBorderColor : 'var(--border-color)'}
                placeholder={t('hero.login.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: hasError ? '#ef4444' : 'var(--text-secondary)' }}>
                {t('hero.login.passwordLabel')}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (message) setMessage(''); }}
                required={!showForgotPassword}
                className="w-full px-6 py-5 rounded-2xl border-2 focus:outline-none transition-all placeholder:text-gray-400 font-bold text-scale-body"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: hasError ? errorBorderColor : 'var(--border-color)' }}
                onFocus={(e) => e.target.style.borderColor = hasError ? errorBorderColor : accentColor}
                onBlur={(e) => e.target.style.borderColor = hasError ? errorBorderColor : 'var(--border-color)'}
                placeholder={t('hero.login.passwordPlaceholder')}
              />
              {/* Forgot Password Link */}
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="mt-2 text-scale-caption font-semibold transition-all hover:opacity-70"
                  style={{ color: accentColor }}
                >
                  {showForgotPassword ? t('hero.login.backToLogin') : t('hero.login.forgotPassword')}
                </button>
              )}
            </div>

            {/* Reset Password Button (when forgot password mode) */}
            {showForgotPassword ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || !email}
                className="w-full text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em] mt-4 hover:scale-[1.02]"
                style={{ backgroundColor: accentColor, boxShadow: `0 20px 40px -10px ${accentShadow}` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
              >
                {resetLoading ? t('hero.login.sending') : t('hero.login.sendResetLink')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || oauthLoading !== null}
                className="w-full text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-scale-body uppercase tracking-[0.15em] mt-4 hover:scale-[1.02]"
                style={{ backgroundColor: accentColor, boxShadow: `0 20px 40px -10px ${accentShadow}` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
              >
                {loading ? t('hero.login.entering') : (
                  currentStep === 'marketing' ? context.cta : (
                    isSignUp ? t('hero.login.createAccount') : t('hero.login.signIn')
                  )
                )}
              </button>
            )}
          </form>

          {/* Divider — switch back to OAuth */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 h-px bg-gray-200" />
            <button
              type="button"
              onClick={() => { setShowEmailForm(false); setMessage(''); }}
              className="text-scale-caption font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('hero.login.orSignInWith', 'or sign in with')}
            </button>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Success messages (like email confirmation) */}
          {message && message.toLowerCase().includes('check') && (
            <div className="mt-6 p-4 rounded-2xl text-scale-label font-bold text-center bg-green-50 text-green-700">
              {message}
            </div>
          )}

          {/* Sign-up / Sign-in toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
              className={`text-scale-label font-black uppercase tracking-widest transition-all hover:opacity-70 ${
                isCredentialsError && !isSignUp ? 'animate-pulse-glow' : ''
              }`}
              style={{
                color: accentColor,
                textShadow: isCredentialsError && !isSignUp ? `0 0 20px ${accentColor}, 0 0 40px ${accentColor}` : 'none'
              }}
            >
              {isSignUp ? t('hero.login.alreadyHaveAccount') : t('hero.login.newHere')}
              {isCredentialsError && !isSignUp && ' \u2190'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginForm;
