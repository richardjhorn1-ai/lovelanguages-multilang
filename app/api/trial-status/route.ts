/**
 * Trial Status API
 * GET /api/trial-status
 *
 * Returns the user's trial status including days remaining and whether to show reminders.
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

  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: SAFE_ERROR_MESSAGES.unauthorized }, { status: 401, headers: corsHeaders });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('trial_expires_at, subscription_status, subscription_granted_by, promo_expires_at, free_tier_chosen_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[trial-status] Failed to fetch profile:', profileError.message);
      return NextResponse.json({ error: 'Failed to fetch trial status' }, { status: 500, headers: corsHeaders });
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

    return NextResponse.json({
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
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('[trial-status] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch trial status' }, { status: 500, headers: corsHeaders });
  }
}
