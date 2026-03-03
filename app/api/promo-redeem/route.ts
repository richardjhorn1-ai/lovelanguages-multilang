/**
 * Promo Code Redemption API
 * POST /api/promo-redeem
 *
 * Allows users to redeem promotional codes for temporary standard tier access.
 * Used for creators, influencers, and special promotions.
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

  // Parse request body
  const body = await request.json();

  const { code } = body || {};

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400, headers: corsHeaders });
  }

  const cleanCode = code.trim();

  try {
    // 2. Check user's current status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, promo_expires_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[promo-redeem] Failed to fetch profile:', profileError.message);
      return NextResponse.json({ error: 'Failed to verify user status' }, { status: 500, headers: corsHeaders });
    }

    // 3. Check if user already has active subscription
    const hasActiveSubscription =
      profile.subscription_status === 'active' &&
      profile.subscription_plan &&
      profile.subscription_plan !== 'free';

    if (hasActiveSubscription) {
      return NextResponse.json({
        error: 'You already have an active subscription',
        code: 'ALREADY_SUBSCRIBED'
      }, { status: 400, headers: corsHeaders });
    }

    // 4. Check if user already has active promo
    const hasActivePromo =
      profile.promo_expires_at &&
      new Date(profile.promo_expires_at) > new Date();

    if (hasActivePromo) {
      return NextResponse.json({
        error: 'You already have active creator access',
        code: 'ALREADY_HAS_PROMO'
      }, { status: 400, headers: corsHeaders });
    }

    // 5. Validate the promo code using our DB function
    const { data: codeCheck, error: codeError } = await supabase
      .rpc('check_promo_code', { p_code: cleanCode });

    if (codeError) {
      console.error('[promo-redeem] Failed to check promo code:', codeError.message);
      return NextResponse.json({ error: 'Failed to validate code' }, { status: 500, headers: corsHeaders });
    }

    const promoResult = codeCheck?.[0];
    if (!promoResult || !promoResult.is_valid) {
      return NextResponse.json({
        error: promoResult?.error_message || 'Invalid or expired code',
        code: 'INVALID_CODE'
      }, { status: 404, headers: corsHeaders });
    }

    // 6. Check if user already redeemed this specific code
    const { data: existingRedemption } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('code_id', promoResult.id)
      .maybeSingle();

    if (existingRedemption) {
      return NextResponse.json({
        error: 'You have already redeemed this code',
        code: 'ALREADY_REDEEMED'
      }, { status: 400, headers: corsHeaders });
    }

    // 7. Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + promoResult.grant_days);

    // 8. Start transaction-like operations
    // 8a. Increment promo code usage
    const { error: incrementError } = await supabase
      .rpc('increment_promo_code_usage', { p_code_id: promoResult.id });

    if (incrementError) {
      console.error('[promo-redeem] Failed to increment usage:', incrementError.message);
      return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500, headers: corsHeaders });
    }

    // 8b. Create redemption record
    const { error: redemptionError } = await supabase
      .from('promo_redemptions')
      .insert({
        user_id: auth.userId,
        code_id: promoResult.id,
      });

    if (redemptionError) {
      console.error('[promo-redeem] Failed to create redemption:', redemptionError.message);
      // Note: We've already incremented usage, but this is acceptable
      // as the user can try again and we'll catch the duplicate
      return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500, headers: corsHeaders });
    }

    // 8c. Update user's promo_expires_at
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ promo_expires_at: expiresAt.toISOString() })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[promo-redeem] Failed to update profile:', updateError.message);
      return NextResponse.json({ error: 'Failed to activate access' }, { status: 500, headers: corsHeaders });
    }

    // 9. Success!
    return NextResponse.json({
      success: true,
      message: `Creator access activated! Enjoy ${promoResult.grant_days} days of unlimited access.`,
      expiresAt: expiresAt.toISOString(),
      daysGranted: promoResult.grant_days,
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('[promo-redeem] Unexpected error:', err);
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500, headers: corsHeaders });
  }
}
