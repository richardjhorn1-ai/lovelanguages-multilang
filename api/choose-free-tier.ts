/**
 * Free Tier Choice API
 * POST /api/choose-free-tier
 *
 * Allows users to choose the free tier, setting free_tier_chosen_at timestamp.
 * This allows them to enter the app with limited features.
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

  try {
    // 2. Check user's current status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_granted_by, promo_expires_at, free_tier_chosen_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[choose-free-tier] Failed to fetch profile:', profileError.message);
      return res.status(500).json({ error: 'Failed to verify user status' });
    }

    // 3. Don't allow if already has active subscription
    if (profile.subscription_status === 'active') {
      return res.status(400).json({
        error: 'You already have an active subscription',
        code: 'ALREADY_SUBSCRIBED'
      });
    }

    // 4. Don't allow if has inherited access
    if (profile.subscription_granted_by) {
      return res.status(400).json({
        error: 'You already have access through your partner',
        code: 'HAS_PARTNER_ACCESS'
      });
    }

    // 5. Don't allow if has active promo
    const hasActivePromo =
      profile.promo_expires_at &&
      new Date(profile.promo_expires_at) > new Date();

    if (hasActivePromo) {
      return res.status(400).json({
        error: 'You already have active creator access',
        code: 'HAS_PROMO_ACCESS'
      });
    }

    // 6. Don't allow if already chosen free tier
    if (profile.free_tier_chosen_at) {
      return res.status(400).json({
        error: 'You have already activated the free tier',
        code: 'ALREADY_FREE_TIER'
      });
    }

    // 7. Set free_tier_chosen_at
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ free_tier_chosen_at: new Date().toISOString() })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[choose-free-tier] Failed to update profile:', updateError.message);
      return res.status(500).json({ error: 'Failed to activate free tier' });
    }

    // 8. Success!
    return res.status(200).json({
      success: true,
      message: 'Free tier activated successfully'
    });

  } catch (err: any) {
    console.error('[choose-free-tier] Unexpected error:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err) });
  }
}
