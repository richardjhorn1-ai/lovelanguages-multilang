import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

function readHashParams(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
}

function normalizeCallbackDestination(path: string): string {
  const url = new URL(path, window.location.origin);
  url.hash = '';
  return `${url.pathname}${url.search}`;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finalizeAuthRedirect = async () => {
      const url = new URL(window.location.href);
      const hashParams = readHashParams(url.hash);
      const flow = url.searchParams.get('flow') || hashParams.get('flow') || 'oauth';
      const hashType = hashParams.get('type'); // Supabase sets type=recovery for password reset
      const nextPath = normalizeCallbackDestination(url.searchParams.get('next') || '/');
      const authCode = url.searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      // Determine destination: password-reset flow or recovery type both go to reset page
      const isPasswordReset = flow === 'password-reset' || hashType === 'recovery';
      const destination = isPasswordReset ? '/reset-password' : nextPath;

      try {
        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            throw exchangeError;
          }
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            throw sessionError;
          }
        } else {
          // No tokens in URL — try initializing from stored session
          await supabase.auth.initialize();
        }

        // Verify we actually have a session before navigating
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && isPasswordReset) {
          throw new Error('Unable to verify your identity. The reset link may have expired.');
        }

        if (!cancelled) {
          // Clear sensitive tokens from the URL before navigating
          window.history.replaceState({}, '', destination);
          navigate(destination, { replace: true });
        }
      } catch (authError: any) {
        if (!cancelled) {
          setError(authError?.message || 'We could not finish signing you in.');
        }
      }
    };

    void finalizeAuthRedirect();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF0F3] p-6 text-center">
      <div className="max-w-md glass-card rounded-3xl p-8">
        <div className="text-5xl mb-4">&#10084;&#65039;</div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-3 font-header">
          {error ? 'Something went wrong' : 'Finishing sign in'}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {error || 'Please wait while we return you to the app.'}
        </p>
        {error && (
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 rounded-2xl bg-[var(--accent-color)] text-white font-bold transition-all hover:opacity-90"
          >
            Back to home
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
