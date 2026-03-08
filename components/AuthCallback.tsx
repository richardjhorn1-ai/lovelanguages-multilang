import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

function readHashParams(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
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
      const nextPath = url.searchParams.get('next') || '/';
      const authCode = url.searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

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
          await supabase.auth.initialize();
        }

        if (!cancelled) {
          navigate(flow === 'password-reset' ? '/reset-password' : nextPath, { replace: true });
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
        <div className="text-5xl mb-4">❤️</div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-3 font-header">
          Finishing sign in
        </h1>
        <p className="text-[var(--text-secondary)]">
          {error || 'Please wait while we return you to the app.'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
