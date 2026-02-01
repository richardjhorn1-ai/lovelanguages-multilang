import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

// Plan limits
const PLAN_LIMITS = {
  none: {
    wordLimit: 0,
    voiceMinutesPerMonth: 0,
    listenMinutesPerMonth: 0,
    canInvitePartner: false,
  },
  standard: {
    wordLimit: 2000,
    voiceMinutesPerMonth: 60,
    listenMinutesPerMonth: 30,
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

    // Get user's subscription status
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        subscription_plan,
        subscription_status,
        subscription_period,
        subscription_ends_at,
        subscription_started_at,
        free_tier_chosen_at,
        trial_expires_at
      `)
      .eq('id', auth.userId)
      .single();

    const plan = (profile?.subscription_plan || 'none') as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.none;

    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('usage_type, count')
      .eq('user_id', auth.userId)
      .gte('usage_date', startOfMonth.toISOString().split('T')[0]);

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
    const now = new Date();
    const trialExpiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
    const trialActive = !!profile?.free_tier_chosen_at && (!trialExpiresAt || trialExpiresAt > now);
    const trialExpired = trialExpiresAt && trialExpiresAt <= now;
    const isGrandfathered = !!profile?.free_tier_chosen_at && !profile?.trial_expires_at;
    const trialDaysRemaining = trialExpiresAt
      ? Math.max(0, Math.floor((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return res.status(200).json({
      subscription: {
        plan: profile?.subscription_plan || 'none',
        status: profile?.subscription_status || 'inactive',
        period: profile?.subscription_period || null,
        endsAt: profile?.subscription_ends_at || null,
        startedAt: profile?.subscription_started_at || null,
      },
      trial: {
        active: trialActive,
        expired: !!trialExpired,
        expiresAt: profile?.trial_expires_at || null,
        daysRemaining: trialDaysRemaining,
        isGrandfathered,
      },
      limits,
      usage: {
        wordsAdded: wordCount || 0,
        voiceMinutes: usageMap['voice_minutes'] || 0,
        listenMinutes: usageMap['listen_minutes'] || 0,
      },
      giftPasses: giftPasses || [],
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
