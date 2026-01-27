/**
 * Promo Code Redemption API
 * POST /api/promo-redeem
 *
 * Allows users to redeem promotional codes for temporary standard tier access.
 * Used for creators, influencers, and special promotions.
 */

import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  sanitizeErrorMessage,
  SAFE_ERROR_MESSAGES,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Parse request body
  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { code } = body || {};

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'Code is required' });
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
      return res.status(500).json({ error: 'Failed to verify user status' });
    }

    // 3. Check if user already has active subscription
    const hasActiveSubscription =
      profile.subscription_status === 'active' &&
      profile.subscription_plan &&
      profile.subscription_plan !== 'free';

    if (hasActiveSubscription) {
      return res.status(400).json({
        error: 'You already have an active subscription',
        code: 'ALREADY_SUBSCRIBED'
      });
    }

    // 4. Check if user already has active promo
    const hasActivePromo =
      profile.promo_expires_at &&
      new Date(profile.promo_expires_at) > new Date();

    if (hasActivePromo) {
      return res.status(400).json({
        error: 'You already have active creator access',
        code: 'ALREADY_HAS_PROMO'
      });
    }

    // 5. Validate the promo code using our DB function
    const { data: codeCheck, error: codeError } = await supabase
      .rpc('check_promo_code', { p_code: cleanCode });

    if (codeError) {
      console.error('[promo-redeem] Failed to check promo code:', codeError.message);
      return res.status(500).json({ error: 'Failed to validate code' });
    }

    const promoResult = codeCheck?.[0];
    if (!promoResult || !promoResult.is_valid) {
      return res.status(404).json({
        error: promoResult?.error_message || 'Invalid or expired code',
        code: 'INVALID_CODE'
      });
    }

    // 6. Check if user already redeemed this specific code
    const { data: existingRedemption } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('code_id', promoResult.id)
      .single();

    if (existingRedemption) {
      return res.status(400).json({
        error: 'You have already redeemed this code',
        code: 'ALREADY_REDEEMED'
      });
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
      return res.status(500).json({ error: 'Failed to redeem code' });
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
      return res.status(500).json({ error: 'Failed to record redemption' });
    }

    // 8c. Update user's promo_expires_at
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ promo_expires_at: expiresAt.toISOString() })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[promo-redeem] Failed to update profile:', updateError.message);
      return res.status(500).json({ error: 'Failed to activate access' });
    }

    // 9. Success!
    return res.status(200).json({
      success: true,
      message: `Creator access activated! Enjoy ${promoResult.grant_days} days of unlimited access.`,
      expiresAt: expiresAt.toISOString(),
      daysGranted: promoResult.grant_days,
    });

  } catch (err: any) {
    console.error('[promo-redeem] Unexpected error:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err) });
  }
}
