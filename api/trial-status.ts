/**
 * Trial Status API
 * GET /api/trial-status
 *
 * Returns the user's trial status including days remaining and whether to show reminders.
 */

import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  SAFE_ERROR_MESSAGES,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trial_expires_at, subscription_status, subscription_granted_by, promo_expires_at, free_tier_chosen_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[trial-status] Failed to fetch profile:', profileError.message);
      return res.status(500).json({ error: 'Failed to fetch trial status' });
    }

    const now = new Date();
    const trialExpires = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;

    const hasActiveSubscription = profile.subscription_status === 'active';
    const hasInheritedAccess = !!profile.subscription_granted_by;
    const hasActivePromo = profile.promo_expires_at && new Date(profile.promo_expires_at) > now;

    // Grandfathered user: has free_tier_chosen_at but no trial_expires_at
    const isGrandfathered = profile.free_tier_chosen_at && !profile.trial_expires_at;

    // Trial expired check (using <= for expiry AT the timestamp)
    const trialExpired = trialExpires && trialExpires <= now;

    // Calculate days remaining (0 on expiry day, negative after)
    const daysRemaining = trialExpires
      ? Math.max(0, Math.floor((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // Hours remaining for last day urgency
    const hoursRemaining = daysRemaining === 0 && trialExpires
      ? Math.max(0, Math.ceil((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60)))
      : null;

    // Show reminder on days 5, 3, 1, 0
    const showReminder = daysRemaining !== null && [5, 3, 1, 0].includes(daysRemaining);

    // Determine overall access status
    const hasAccess = hasActiveSubscription || hasInheritedAccess || hasActivePromo || isGrandfathered ||
      (profile.free_tier_chosen_at && !trialExpired);

    return res.status(200).json({
      hasActiveSubscription,
      hasInheritedAccess,
      hasActivePromo,
      isGrandfathered,
      trialExpired: !!trialExpired,
      trialExpiresAt: profile.trial_expires_at,
      daysRemaining,
      hoursRemaining,
      showReminder,
      hasAccess
    });

  } catch (err: any) {
    console.error('[trial-status] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to fetch trial status' });
  }
}
