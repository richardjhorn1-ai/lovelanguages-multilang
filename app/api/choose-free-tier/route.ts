/**
 * Free Tier Choice API
 * POST /api/choose-free-tier
 *
 * Allows users to choose the free tier, setting free_tier_chosen_at timestamp.
 * This allows them to enter the app with limited features.
 */

import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  sanitizeErrorMessage,
  SAFE_ERROR_MESSAGES,
} from '@/utils/api-middleware';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // 1. Verify authentication
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: SAFE_ERROR_MESSAGES.unauthorized }, { status: 401, headers: corsHeaders });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
  }

  try {
    // 2. Check user's current status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_granted_by, promo_expires_at, free_tier_chosen_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[choose-free-tier] Failed to fetch profile:', profileError.message);
      return NextResponse.json({ error: 'Failed to verify user status' }, { status: 500, headers: corsHeaders });
    }

    // 3. Don't allow if already has active subscription
    if (profile.subscription_status === 'active') {
      return NextResponse.json({
        error: 'You already have an active subscription',
        code: 'ALREADY_SUBSCRIBED'
      }, { status: 400, headers: corsHeaders });
    }

    // 4. Don't allow if has inherited access
    if (profile.subscription_granted_by) {
      return NextResponse.json({
        error: 'You already have access through your partner',
        code: 'HAS_PARTNER_ACCESS'
      }, { status: 400, headers: corsHeaders });
    }

    // 5. Don't allow if has active promo
    const hasActivePromo =
      profile.promo_expires_at &&
      new Date(profile.promo_expires_at) > new Date();

    if (hasActivePromo) {
      return NextResponse.json({
        error: 'You already have active creator access',
        code: 'HAS_PROMO_ACCESS'
      }, { status: 400, headers: corsHeaders });
    }

    // 6 & 7. Atomic update - only set if free_tier_chosen_at is NULL (prevents race condition)
    const now = new Date();
    const trialExpiresAt = new Date(now);
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        free_tier_chosen_at: now.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString()
      })
      .eq('id', auth.userId)
      .is('free_tier_chosen_at', null)  // Only update if not already set (atomic)
      .select('id');

    if (updateError) {
      console.error('[choose-free-tier] Failed to update profile:', updateError.message);
      return NextResponse.json({ error: 'Failed to activate free trial' }, { status: 500, headers: corsHeaders });
    }

    // If no rows updated, user already has free tier
    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({
        error: 'You have already activated the free tier',
        code: 'ALREADY_FREE_TIER'
      }, { status: 400, headers: corsHeaders });
    }

    // 8. Success!
    return NextResponse.json({
      success: true,
      message: 'Free trial activated successfully',
      trialExpiresAt: trialExpiresAt.toISOString()
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('[choose-free-tier] Unexpected error:', err);
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500, headers: corsHeaders });
  }
}
