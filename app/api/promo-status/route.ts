/**
 * Promo Status API
 * GET /api/promo-status
 *
 * Returns the user's current promotional access status.
 */

import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  SAFE_ERROR_MESSAGES,
} from '@/utils/api-middleware';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // Verify authentication
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: SAFE_ERROR_MESSAGES.unauthorized }, { status: 401, headers: corsHeaders });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
  }

  try {
    // Fetch user's promo status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('promo_expires_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[promo-status] Failed to fetch profile:', profileError.message);
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500, headers: corsHeaders });
    }

    // Check if user has active promo
    const now = new Date();
    const expiresAt = profile.promo_expires_at ? new Date(profile.promo_expires_at) : null;
    const hasPromo = expiresAt !== null && expiresAt > now;

    // Calculate days remaining
    let daysRemaining = 0;
    if (hasPromo && expiresAt) {
      const diffMs = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      hasPromo,
      expiresAt: hasPromo ? expiresAt!.toISOString() : null,
      daysRemaining: hasPromo ? daysRemaining : 0,
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('[promo-status] Unexpected error:', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500, headers: corsHeaders });
  }
}
