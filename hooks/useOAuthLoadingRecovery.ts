import { useEffect } from 'react';
import { AUTH_CALLBACK_PATH } from '../services/api-config';
import { supabase } from '../services/supabase';

type OAuthProvider = 'google' | 'apple' | null;

export function useOAuthLoadingRecovery(
  oauthLoading: OAuthProvider,
  setOauthLoading: (provider: OAuthProvider) => void
) {
  useEffect(() => {
    if (!oauthLoading) {
      return;
    }

    let disposed = false;

    const clearIfNoSession = async () => {
      if (disposed) {
        return;
      }

      if (document.visibilityState === 'hidden') {
        return;
      }

      if (window.location.pathname === AUTH_CALLBACK_PATH) {
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (disposed || error) {
        return;
      }

      if (!data.session) {
        setOauthLoading(null);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void clearIfNoSession();
      }
    };

    const handleFocus = () => {
      void clearIfNoSession();
    };

    const fallbackTimer = window.setTimeout(() => {
      void clearIfNoSession();
    }, 15000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!disposed) {
        setOauthLoading(null);
      }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [oauthLoading, setOauthLoading]);
}
