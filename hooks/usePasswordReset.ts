import { useState } from 'react';
import { apiFetch } from '../services/api-config';

type ResetResult = 'sent' | 'rate_limited';

/**
 * Shared hook for requesting a password reset email via the API.
 * Returns a simple result so callers can handle their own UI side-effects.
 */
export function usePasswordReset() {
  const [loading, setLoading] = useState(false);

  const sendReset = async (email: string): Promise<ResetResult> => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok && res.status === 429) {
        return 'rate_limited';
      }
      // Server always returns 200 for valid requests (even unknown emails)
      // to prevent email enumeration.
      return 'sent';
    } catch {
      // Network failure — still show success to prevent enumeration
      return 'sent';
    } finally {
      setLoading(false);
    }
  };

  return { sendReset, loading };
}
