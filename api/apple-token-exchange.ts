/**
 * Apple Token Exchange API
 *
 * Called after native Apple Sign In to exchange the authorization code
 * for a refresh token. The refresh token is stored on the user's profile
 * so it can be used for token revocation when the user deletes their account.
 *
 * Apple requires token revocation on account deletion (App Store Review Guideline 5.1.1(v)).
 */
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { authorizationCode } = req.body || {};

    if (!authorizationCode) {
      return res.status(400).json({ error: 'Missing authorizationCode' });
    }

    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_CLIENT_SECRET) {
      console.warn('[apple-token-exchange] APPLE_CLIENT_ID or APPLE_CLIENT_SECRET not configured');
      return res.status(200).json({ success: true, stored: false, reason: 'apple_credentials_not_configured' });
    }

    // Exchange authorization code with Apple's token endpoint for a refresh token
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID,
        client_secret: process.env.APPLE_CLIENT_SECRET,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[apple-token-exchange] Apple token exchange failed: ${tokenResponse.status}`, errorText);
      // Don't fail the request — sign-in already succeeded, this is a best-effort store
      return res.status(200).json({ success: true, stored: false, reason: 'token_exchange_failed' });
    }

    const tokenData = await tokenResponse.json();
    const refreshToken = tokenData.refresh_token;

    if (!refreshToken) {
      console.warn('[apple-token-exchange] No refresh_token in Apple response');
      return res.status(200).json({ success: true, stored: false, reason: 'no_refresh_token' });
    }

    // Store the refresh token on the user's profile
    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ apple_refresh_token: refreshToken })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[apple-token-exchange] Failed to store refresh token:', updateError.message);
      return res.status(200).json({ success: true, stored: false, reason: 'db_update_failed' });
    }

    console.log(`[apple-token-exchange] Stored Apple refresh token for user ${auth.userId.substring(0, 8)}...`);
    return res.status(200).json({ success: true, stored: true });

  } catch (error: any) {
    console.error('[apple-token-exchange] Error:', error);
    // Never fail — sign-in already succeeded, this is best-effort
    return res.status(200).json({ success: true, stored: false, reason: 'unexpected_error' });
  }
}
