/**
 * Apple Token Exchange API
 *
 * Called after native Apple Sign In to exchange the authorization code
 * for a refresh token. The refresh token is stored on the user's profile
 * so it can be used for token revocation when the user deletes their account.
 *
 * Apple requires token revocation on account deletion (App Store Review Guideline 5.1.1(v)).
 */
import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
} from '@/utils/api-middleware';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { authorizationCode } = body || {};

    if (!authorizationCode) {
      return NextResponse.json({ error: 'Missing authorizationCode' }, { status: 400, headers: corsHeaders });
    }

    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_CLIENT_SECRET) {
      console.warn('[apple-token-exchange] APPLE_CLIENT_ID or APPLE_CLIENT_SECRET not configured');
      return NextResponse.json({ success: true, stored: false, reason: 'apple_credentials_not_configured' }, { headers: corsHeaders });
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
      return NextResponse.json({ success: true, stored: false, reason: 'token_exchange_failed' }, { headers: corsHeaders });
    }

    const tokenData = await tokenResponse.json();
    const refreshToken = tokenData.refresh_token;

    if (!refreshToken) {
      console.warn('[apple-token-exchange] No refresh_token in Apple response');
      return NextResponse.json({ success: true, stored: false, reason: 'no_refresh_token' }, { headers: corsHeaders });
    }

    // Store the refresh token on the user's profile
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ apple_refresh_token: refreshToken })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[apple-token-exchange] Failed to store refresh token:', updateError.message);
      return NextResponse.json({ success: true, stored: false, reason: 'db_update_failed' }, { headers: corsHeaders });
    }

    console.log(`[apple-token-exchange] Stored Apple refresh token for user ${auth.userId.substring(0, 8)}...`);
    return NextResponse.json({ success: true, stored: true }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[apple-token-exchange] Error:', error);
    // Never fail — sign-in already succeeded, this is best-effort
    return NextResponse.json({ success: true, stored: false, reason: 'unexpected_error' }, { headers: corsHeaders });
  }
}
