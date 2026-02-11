import crypto from 'crypto';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Production fallback URL - used when APP_URL and ALLOWED_ORIGINS are not configured
const PRODUCTION_FALLBACK_URL = 'https://www.lovelanguages.io';

function getValidOrigin(origin: string | undefined | null): string | null {
  if (!origin) {
    return null;
  }

  const trimmed = origin.trim();
  if (!trimmed || trimmed === '*') {
    return null;
  }

  try {
    const url = new URL(trimmed);
    // Reject if there's a path (other than /), search params, or hash
    if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
      return null;
    }
    // Always return the normalized origin (without trailing slash)
    return url.origin;
  } catch {
    return null;
  }
}

function getServerBaseUrl(): string {
  // Priority 1: Explicit APP_URL environment variable
  const appUrl = getValidOrigin(process.env.APP_URL);
  if (appUrl) {
    return appUrl;
  }

  // Priority 2: First valid non-wildcard entry from ALLOWED_ORIGINS
  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || '';
  if (allowedOriginsRaw) {
    const allowedOrigins = allowedOriginsRaw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin && origin !== '*');

    for (const origin of allowedOrigins) {
      const validOrigin = getValidOrigin(origin);
      if (validOrigin) {
        return validOrigin;
      }
    }
  }

  // Priority 3: Production fallback (ensures invite links always work)
  return PRODUCTION_FALLBACK_URL;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit (abuse prevention)
    const limit = await checkRateLimit(supabase, auth.userId, 'generateInvite', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    // Get user profile with subscription info and language settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, linked_user_id, subscription_status, subscription_granted_by, active_language')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if already has a linked partner
    if (profile.linked_user_id) {
      return res.status(400).json({ error: 'You already have a linked partner' });
    }

    // Only subscription owners can invite (not those with inherited access)
    if (profile.subscription_granted_by) {
      return res.status(403).json({
        error: 'Only subscription owners can invite partners. Ask your partner to send the invite.',
        code: 'NOT_SUBSCRIPTION_OWNER'
      });
    }

    const baseUrl = getServerBaseUrl();

    // Check for existing valid (unused, unexpired) token
    const { data: existingToken } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('inviter_id', auth.userId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingToken) {
      if (req.body?.regenerate) {
        // Expire the old token so a fresh one is generated below
        await supabase
          .from('invite_tokens')
          .update({ used_at: new Date().toISOString() })
          .eq('id', existingToken.id);
      } else {
        incrementUsage(supabase, auth.userId, RATE_LIMITS.generateInvite.type);

        return res.status(200).json({
          token: existingToken.token,
          inviteLink: `${baseUrl}/#/join/${existingToken.token}`,
          expiresAt: existingToken.expires_at,
          isExisting: true
        });
      }
    }

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { targetLanguage } = await getProfileLanguages(supabase, auth.userId);

    const { data: newToken, error: insertError } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        inviter_id: auth.userId,
        inviter_name: profile.full_name,
        inviter_email: profile.email,
        expires_at: expiresAt.toISOString(),
        language_code: targetLanguage
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invite token:', insertError);
      return res.status(500).json({ error: 'Failed to create invite link' });
    }

    incrementUsage(supabase, auth.userId, RATE_LIMITS.generateInvite.type);

    return res.status(200).json({
      token: newToken.token,
      inviteLink: `${baseUrl}/#/join/${newToken.token}`,
      expiresAt: newToken.expires_at,
      isExisting: false
    });

  } catch (error: any) {
    console.error('[generate-invite] Error:', error);
    return res.status(500).json({ error: 'Failed to generate invite link. Please try again.' });
  }
}
