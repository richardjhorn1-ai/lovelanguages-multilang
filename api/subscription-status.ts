import { createClient } from '@supabase/supabase-js';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // Check for explicit origin match (not wildcard)
  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    // Explicit match - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard mode - NEVER combine with credentials (security vulnerability)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0) {
    // No match but have allowed origins - use first one
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[subscription-status] Missing Supabase config');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('[subscription-status] Auth failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

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
        subscription_started_at
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

    return res.status(200).json({
      subscription: {
        plan: profile?.subscription_plan || 'none',
        status: profile?.subscription_status || 'inactive',
        period: profile?.subscription_period || null,
        endsAt: profile?.subscription_ends_at || null,
        startedAt: profile?.subscription_started_at || null,
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
        standardMonthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY || null,
        standardYearly: process.env.STRIPE_PRICE_STANDARD_YEARLY || null,
        unlimitedMonthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || null,
        unlimitedYearly: process.env.STRIPE_PRICE_UNLIMITED_YEARLY || null,
      },
    });

  } catch (error: any) {
    console.error('[subscription-status] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get subscription status' });
  }
}
