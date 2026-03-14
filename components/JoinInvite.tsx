import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import { LOGO_PATH, LOGO_DETAIL_PATHS } from './hero/Section';
import { useHoneypot } from '../hooks/useHoneypot';
import { apiFetch, getAuthCallbackUrl } from '../services/api-config';
import { isNativeAppleSignInCancelled, signInWithNativeApple } from '../services/native-apple-auth';
import { useOAuthLoadingRecovery } from '../hooks/useOAuthLoadingRecovery';

interface InviterInfo {
  name: string;
  email: string;
}

interface LanguageInfo {
  code: string;
  name: string;
}

const JoinInvite: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inviter, setInviter] = useState<InviterInfo | null>(null);
  const [language, setLanguage] = useState<LanguageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviterRole, setInviterRole] = useState<'student' | 'tutor'>('student');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  // Honeypot anti-bot protection
  const { honeypotProps, honeypotStyles, isBot } = useHoneypot();

  // Recover from stuck OAuth loading state (e.g. user hits back button)
  useOAuthLoadingRecovery(oauthLoading, setOauthLoading);

  // Track whether we've already attempted auto-complete to avoid loops
  const autoCompleteAttempted = useRef(false);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('No invite token provided');
      setLoading(false);
    }
  }, [token]);

  // After token validation + page load, check if user already has a session
  // (returning from OAuth redirect). If so, auto-complete the invite.
  useEffect(() => {
    if (loading || error || validating || autoCompleteAttempted.current) return;

    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        autoCompleteAttempted.current = true;
        await completeInvite(session.access_token);
      }
    };

    checkExistingSession();
  }, [loading, error, validating]);

  const validateToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/validate-invite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      // Check if we got HTML instead of JSON (common when API doesn't exist)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[JoinInvite] Non-JSON response:', contentType);
        const text = await response.text();
        console.error('[JoinInvite] Response body:', text.substring(0, 200));
        throw new Error('API endpoint not available. Please ensure the server is running.');
      }

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid invite link');
        setLoading(false);
        return;
      }

      setInviter(data.inviter);
      setLanguage(data.language || { code: 'pl', name: 'Polish' });  // Fallback for old API responses
      setInviterRole(data.inviterRole || 'student');

      // Student invited a tutor → display page in the student's target language (tutor speaks it)
      if (data.inviterRole === 'student' && data.language?.code) {
        i18n.changeLanguage(data.language.code);
      }
    } catch (e: any) {
      console.error('[JoinInvite] Error:', e);
      setError(e.message || 'Failed to validate invite');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setAuthMessage('');

    // Store the role so App.tsx can pick it up after OAuth
    const joinerRole = inviterRole === 'tutor' ? 'student' : 'tutor';
    localStorage.setItem('intended_role', joinerRole);

    // Native Apple Sign In on iOS
    if (provider === 'apple' && Capacitor.getPlatform() === 'ios') {
      try {
        const { response, session } = await signInWithNativeApple();

        if (session && response.authorizationCode) {
          apiFetch('/api/apple-token-exchange/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ authorizationCode: response.authorizationCode }),
          }).catch(err => console.warn('[JoinInvite] Apple token exchange failed (non-blocking):', err));

          // Complete the invite with the new session
          await completeInvite(session.access_token);
        }
      } catch (err: any) {
        if (isNativeAppleSignInCancelled(err)) {
          setOauthLoading(null);
        } else {
          console.error('[JoinInvite] Native Apple Sign In error:', err);
          setAuthMessage(err?.message || 'Apple Sign In failed. Please try again.');
          setOauthLoading(null);
        }
      }
      return;
    }

    // Web OAuth redirect — redirect back to this invite page after auth
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthCallbackUrl({
          flow: 'oauth',
          next: `/join/${token}`,
        })
      }
    });

    if (error) {
      setAuthMessage(error.message);
      setOauthLoading(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    // Honeypot check: if bot filled the hidden field, fake success silently
    if (isBot()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isSignUp) {
        setAuthMessage(t('joinInvite.checkEmail'));
      }
      setAuthLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0] // Default name from email
            }
          }
        });

        if (signUpError) throw signUpError;

        // Check if email confirmation is required
        if (signUpData.user && !signUpData.session) {
          setAuthMessage(t('joinInvite.checkEmail'));
          setIsSignUp(false);
          setAuthLoading(false);
          return;
        }

        // If we have a session, complete the invite
        if (signUpData.session) {
          await completeInvite(signUpData.session.access_token);
        }
      } else {
        // Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        if (signInData.session) {
          await completeInvite(signInData.session.access_token);
        }
      }
    } catch (e: any) {
      setAuthMessage(e.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const completeInvite = async (accessToken: string) => {
    setValidating(true);

    try {
      const response = await apiFetch('/api/complete-invite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token })
      });

      // Check if we got HTML instead of JSON (API not available)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[JoinInvite] complete-invite API not available');
        throw new Error('API endpoint not available. Are you running vercel dev?');
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'DUPLICATE_PAID_SUBSCRIPTION') {
          throw new Error('Both accounts already have active subscriptions. Cancel one first to save money, then try linking again.');
        }
        throw new Error(data.error || 'Failed to complete invite');
      }

      // Store inviter name for shortened onboarding flow
      if (inviter?.name) {
        localStorage.setItem('inviter_name', inviter.name);
      }

      // Success! Force a full page reload to get fresh profile data
      window.location.href = '/';
    } catch (e: any) {
      console.error('[JoinInvite] Complete invite error:', e);
      setAuthMessage(e.message || 'Failed to link accounts');
      setValidating(false);
    }
  };

  const joinerRole = inviterRole === 'tutor' ? 'student' : 'tutor';

  // Role-aware translation helper: picks Student variant when joiner is student
  const tRole = (key: string, params?: Record<string, string>) => {
    const suffix = joinerRole === 'student' ? 'Student' : '';
    return t(`joinInvite.${key}${suffix}`, params);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--accent-light)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="text-center">
          <div className="animate-bounce mb-4"><ICONS.Heart className="w-16 h-16 text-[var(--accent-color)] mx-auto" /></div>
          <p className="text-[var(--accent-color)] font-bold animate-pulse">{t('joinInvite.validating')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--accent-light)] p-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="glass-card p-10 rounded-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ICONS.X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3">{t('joinInvite.invalidInvite')}</h2>
          <p className="text-[var(--text-secondary)] mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[var(--accent-color)] text-white px-8 py-4 rounded-2xl font-bold shadow-lg"
          >
            {t('joinInvite.goToHomepage')}
          </button>
        </div>
      </div>
    );
  }

  // Completing invite state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--accent-light)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">🔗</div>
          <p className="text-[var(--accent-color)] font-bold animate-pulse">{t('joinInvite.linking')}</p>
        </div>
      </div>
    );
  }

  // Main invite UI
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--accent-light)]">
      <div className="min-h-full flex flex-col md:flex-row">
      {/* Left: Invitation Context */}
      <div
        className="md:flex-1 flex flex-col md:justify-center px-8 pb-8 md:pb-12 md:px-24 md:py-12"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}
      >
        <div className="max-w-xl">
          <div className="flex items-center gap-4 mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600.000000 600.000000"
              preserveAspectRatio="xMidYMid meet" fill="var(--accent-color)" className="w-10 h-10">
              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" stroke="none">
                <path d={LOGO_PATH} />
                {LOGO_DETAIL_PATHS.map((d: string, i: number) => <path key={i} d={d} />)}
              </g>
            </svg>
            <h1 className="text-2xl font-bold font-header text-[var(--accent-color)]">Love Languages</h1>
          </div>

          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6 text-[var(--text-primary)]">
            {tRole('joinJourney', { name: inviter?.name || t('joinInvite.yourPartner'), language: language?.name || 'their language' })}
          </h2>

          <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
            {tRole('learningToConnect', { language: language?.name || 'their language' })}
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <ICONS.TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">{tRole('trackProgress')}</p>
                <p className="text-sm text-[var(--text-secondary)]">{tRole('trackProgressDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <ICONS.MessageCircle className="w-5 h-5 text-[var(--accent-color)]" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">{tRole('conversationStarters')}</p>
                <p className="text-sm text-[var(--text-secondary)]">{tRole('conversationStartersDesc', { language: language?.name || 'their language' })}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <ICONS.Heart className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)]">{tRole('encourageCelebrate')}</p>
                <p className="text-sm text-[var(--text-secondary)]">{tRole('encourageCelebrateDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="md:flex-1 flex flex-col items-center justify-center p-8 glass-card md:rounded-l-[5rem] relative overflow-hidden">
        <ICONS.Heart className="absolute -bottom-20 -right-20 w-80 h-80 text-[var(--accent-light)] opacity-[0.03] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black text-[var(--accent-color)]">
              {inviter?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">
              {t('joinInvite.join', { name: inviter?.name })}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              {isSignUp ? tRole('createAccount', { language: language?.name || 'their language' }) : t('joinInvite.signInToConnect')}
            </p>
          </div>

          {/* View A: OAuth buttons (default) */}
          {!showEmailForm && (
            <>
              <div className="space-y-3">
                {/* Google button */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={authLoading || oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-primary)] disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span>{t('hero.login.continueWithGoogle', 'Continue with Google')}</span>
                </button>

                {/* Apple button */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={authLoading || oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-black text-white font-semibold transition-all hover:bg-gray-900 disabled:opacity-50"
                >
                  {oauthLoading === 'apple' ? (
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  <span>{t('hero.login.continueWithApple', 'Continue with Apple')}</span>
                </button>
              </div>

              {/* Divider — switch to email */}
              <div className="flex items-center gap-4 mt-5">
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <button
                  type="button"
                  onClick={() => { setShowEmailForm(true); setAuthMessage(''); }}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t('hero.login.orContinueWithEmail', 'or continue with email')}
                </button>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
              </div>
            </>
          )}

          {/* View B: Email/Password form */}
          {showEmailForm && (
            <>
              <style dangerouslySetInnerHTML={{ __html: honeypotStyles }} />
              <form onSubmit={handleAuth} className="space-y-4">
                {/* Honeypot field - hidden from users, bots fill it */}
                <input {...honeypotProps} />
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 ml-1">
                    {t('joinInvite.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-transparent focus:bg-[var(--bg-card)] focus:border-[var(--accent-border)] focus:outline-none transition-all font-bold text-sm"
                    placeholder="you@love.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 ml-1">
                    {t('joinInvite.passwordLabel')}
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-transparent focus:bg-[var(--bg-card)] focus:border-[var(--accent-border)] focus:outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-black py-5 rounded-2xl shadow-xl shadow-[var(--accent-shadow)] transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.2em] mt-4"
                >
                  {authLoading ? t('joinInvite.connecting') : (isSignUp ? tRole('joinAsCoach') : t('joinInvite.signInConnect'))}
                </button>
              </form>

              {/* Divider — switch back to OAuth */}
              <div className="flex items-center gap-4 mt-5">
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <button
                  type="button"
                  onClick={() => { setShowEmailForm(false); setAuthMessage(''); }}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t('hero.login.orSignInWith', 'or sign in with')}
                </button>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
              </div>

              {/* Sign-up / Sign-in toggle */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[var(--accent-color)] text-xs font-black uppercase tracking-widest hover:text-[var(--accent-color)] transition-all"
                >
                  {isSignUp ? t('joinInvite.alreadyHaveAccount') : t('joinInvite.noAccount')}
                </button>
              </div>
            </>
          )}

          {authMessage && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold text-center ${
              authMessage.includes('Check') || authMessage.includes('success')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {authMessage}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default JoinInvite;
