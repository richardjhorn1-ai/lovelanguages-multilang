import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  getSubscriptionPlan,
} from '../utils/api-middleware.js';

// Plan limits
const PLAN_LIMITS = {
  none: {
    wordLimit: 0,
    voiceMinutesPerMonth: 0,
    listenMinutesPerMonth: 0,
    canInvitePartner: false,
  },
  free: {
    wordLimit: 200,
    voiceMinutesPerMonth: 15,
    listenMinutesPerMonth: 15,
    canInvitePartner: false,
  },
  standard: {
    wordLimit: 2000,
    voiceMinutesPerMonth: 480,
    listenMinutesPerMonth: 480,
    canInvitePartner: true,
  },
  unlimited: {
    wordLimit: null, // null = unlimited
    voiceMinutesPerMonth: null,
    listenMinutesPerMonth: null,
    canInvitePartner: true,
  },
};

export default async function handler(req: any, res: any) {
  // CORS
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Determine effective plan using centralized logic
    const plan = await getSubscriptionPlan(supabase, auth.userId);
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.none;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, subscription_plan, subscription_status, subscription_period, subscription_ends_at, subscription_started_at, subscription_source, subscription_granted_by, linked_user_id, free_tier_chosen_at, trial_expires_at, promo_expires_at, created_at')
      .eq('id', auth.userId)
      .single();

    // Calculate rolling 30-day usage window (matches checkRateLimit logic)
    const now = new Date();
    const signupDate = new Date(profile.created_at);
    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentPeriod = Math.floor(daysSinceSignup / 30);

    const periodStartDate = new Date(signupDate);
    periodStartDate.setDate(periodStartDate.getDate() + (currentPeriod * 30));
    const periodStart = periodStartDate.toISOString().split('T')[0];

    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 30);
    const periodEnd = periodEndDate.toISOString().split('T')[0];

    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('usage_type, count')
      .eq('user_id', auth.userId)
      .gte('usage_date', periodStart)
      .lt('usage_date', periodEnd);

    const usageMap: Record<string, number> = {};
    (usage || []).forEach((u: any) => {
      usageMap[u.usage_type] = (usageMap[u.usage_type] || 0) + u.count;
    });

    // Get word count
    const { count: wordCount } = await supabase
      .from('dictionary')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId);

    // Check if user has any unused gift passes
    const { data: giftPasses } = await supabase
      .from('gift_passes')
      .select('id, code, expires_at')
      .eq('created_by', auth.userId)
      .is('redeemed_by', null)
      .gt('expires_at', new Date().toISOString());

    // Calculate trial status
    const trialExpiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
    const trialActive = !!profile?.free_tier_chosen_at && (!trialExpiresAt || trialExpiresAt > now);
    const trialExpired = trialExpiresAt && trialExpiresAt <= now;
    const isGrandfathered = !!profile?.free_tier_chosen_at && !profile?.trial_expires_at;
    const hasActivePromo = !!profile?.promo_expires_at && new Date(profile.promo_expires_at) > now;
    const trialDaysRemaining = trialExpiresAt
      ? Math.max(0, Math.floor((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const hasInherited = !!profile?.subscription_granted_by;
    const selfPaidActive = !hasInherited &&
      (profile?.subscription_plan === 'standard' || profile?.subscription_plan === 'unlimited') &&
      profile?.subscription_status === 'active';

    const selfEntitlement = {
      plan: selfPaidActive ? (profile?.subscription_plan || 'none') : 'none',
      status: selfPaidActive ? (profile?.subscription_status || 'inactive') : 'inactive',
      source: selfPaidActive ? (profile?.subscription_source || 'stripe') : (
        hasActivePromo ? 'promo' : (trialActive ? 'trial' : 'none')
      ),
      endsAt: selfPaidActive ? (profile?.subscription_ends_at || null) : (
        hasActivePromo ? profile?.promo_expires_at : (trialActive ? profile?.trial_expires_at : null)
      ),
    };

    let sharedEntitlement: {
      plan: string;
      status: string;
      source: 'shared';
      billingOwnerUserId: string;
      endsAt: string | null;
    } | null = null;

    if (hasInherited) {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('id, subscription_plan, subscription_status, subscription_ends_at')
        .eq('id', profile.subscription_granted_by)
        .single();

      if (ownerProfile && ownerProfile.subscription_status === 'active') {
        sharedEntitlement = {
          plan: ownerProfile.subscription_plan || 'none',
          status: ownerProfile.subscription_status || 'inactive',
          source: 'shared',
          billingOwnerUserId: ownerProfile.id,
          endsAt: ownerProfile.subscription_ends_at || null,
        };
      }
    }

    let effective = {
      plan: 'none',
      status: 'inactive',
      source: 'free' as 'self' | 'shared' | 'promo' | 'trial' | 'free',
      endsAt: null as string | null,
    };

    if (selfPaidActive) {
      effective = {
        plan: selfEntitlement.plan,
        status: selfEntitlement.status,
        source: 'self',
        endsAt: selfEntitlement.endsAt,
      };
    } else if (sharedEntitlement?.status === 'active') {
      effective = {
        plan: sharedEntitlement.plan,
        status: sharedEntitlement.status,
        source: 'shared',
        endsAt: sharedEntitlement.endsAt,
      };
    } else if (hasActivePromo) {
      effective = {
        plan: profile?.subscription_plan || 'standard',
        status: 'active',
        source: 'promo',
        endsAt: profile?.promo_expires_at || null,
      };
    } else if (trialActive) {
      effective = {
        plan: 'none',
        status: 'active',
        source: 'trial',
        endsAt: profile?.trial_expires_at || null,
      };
    }

    const billingOwnerUserId = sharedEntitlement?.billingOwnerUserId || (selfPaidActive ? profile.id : null);
    const canManageBilling = selfPaidActive;

    return res.status(200).json({
      subscription: {
        plan: effective.plan === 'none' ? plan : effective.plan,
        status: effective.status || profile?.subscription_status || 'inactive',
        period: profile?.subscription_period || null,
        endsAt: effective.endsAt || profile?.subscription_ends_at || null,
        startedAt: profile?.subscription_started_at || null,
        source: profile?.subscription_source || null,
      },
      entitlements: {
        self: selfEntitlement,
        shared: sharedEntitlement,
        effective,
        canManageBilling,
        billingOwnerUserId,
      },
      trial: {
        active: trialActive,
        expired: !!trialExpired,
        expiresAt: profile?.trial_expires_at || null,
        daysRemaining: trialDaysRemaining,
        isGrandfathered,
      },
      promo: {
        active: hasActivePromo,
        expiresAt: profile?.promo_expires_at || null,
      },
      limits,
      usage: {
        wordsAdded: wordCount || 0,
        voiceMinutes: usageMap['voice_minutes'] || 0,
        listenMinutes: usageMap['listen_minutes'] || 0,
      },
      giftPasses: giftPasses || [],
      canManageBilling,
      billingOwnerUserId,
      // Price IDs for checkout (frontend uses these)
      prices: {
        standardWeekly: process.env.STRIPE_PRICE_STANDARD_WEEKLY || null,
        standardMonthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY || null,
        standardYearly: process.env.STRIPE_PRICE_STANDARD_YEARLY || null,
        unlimitedWeekly: process.env.STRIPE_PRICE_UNLIMITED_WEEKLY || null,
        unlimitedMonthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || null,
        unlimitedYearly: process.env.STRIPE_PRICE_UNLIMITED_YEARLY || null,
      },
    });

  } catch (error: any) {
    console.error('[subscription-status] Error:', error);
    return res.status(500).json({ error: 'Failed to load subscription status. Please try again.' });
  }
}
