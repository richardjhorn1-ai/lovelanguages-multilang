/**
 * Analytics Event API
 *
 * Stores user events in Supabase for per-user journey tracking.
 * Works alongside GA4 for richer, queryable analytics.
 *
 * Auth model:
 * - Anonymous events are accepted with anonymous_id.
 * - User-attributed events require Authorization and user identity is derived from JWT.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const configuredOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://www.lovelanguages.io')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
  .filter(origin => origin !== '*');

const vercelDeploymentOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(vercelDeploymentOrigin ? [vercelDeploymentOrigin] : []),
]);

// Allowlist of valid event names (prevents arbitrary data injection)
export const ALLOWED_EVENTS = new Set([
  // Onboarding
  'page_view', 'signup_started', 'signup_completed', 'onboarding_step', 'onboarding_completed',
  'onboarding_step_viewed', 'onboarding_step_saved', 'onboarding_back_clicked',
  'onboarding_plan_viewed', 'onboarding_plan_selected_free', 'onboarding_plan_selected_paid',
  'onboarding_free_activation_succeeded', 'onboarding_free_activation_failed',
  'onboarding_checkout_started', 'onboarding_checkout_returned_success',
  'onboarding_checkout_returned_cancel', 'onboarding_subscription_confirmed',
  'role_selected', 'language_selected', 'plan_selected',
  // Chat
  'chat_message', 'chat_response', 'chat_message_sent', 'chat_response_received',
  'voice_session_started', 'voice_session_ended',
  'session_start', 'first_chat_message', 'tts_played',
  // Games
  'game_started', 'game_completed', 'first_game_completed', 'first_game_played',
  // Vocabulary
  'word_added', 'first_word_added', 'words_extracted',
  // Level tests
  'level_test_started', 'level_test_completed',
  // Subscription
  'checkout_started', 'purchase_completed', 'purchase_failed',
  'subscription_activated', 'subscription_completed',
  'subscription_renewed', 'subscription_changed', 'subscription_cancelled',
  'subscription_failed', 'payment_failed', 'trial_started',
  // Retention
  'partner_invited', 'partner_joined', 'streak_maintained', 'streak_broken',
  // Churn
  'error_encountered', 'error_occurred', 'app_error', 'api_error', 'feature_abandoned', 'account_deleted',
  // Auth lifecycle
  'user_logged_in', 'user_logged_out',
  // General
  'app_installed', 'app_opened', 'app_backgrounded', 'theme_changed', 'language_switched',
  'feature_used', 'cta_click', 'app_store_click',
  'paywall_view', 'paywall_dismissed',
  'challenge_created', 'challenge_completed', 'word_practiced',
  'trial_converted', 'trial_expired',
]);

// Max event_params size (10KB)
const MAX_PARAMS_SIZE = 10 * 1024;
const RATE_LIMIT_WINDOW_MS = Number(process.env.ANALYTICS_RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX_EVENTS = Number(process.env.ANALYTICS_RATE_LIMIT_MAX_EVENTS || 120);
const ANON_AUTH_TRANSITION_WINDOW_MS = Number(process.env.ANALYTICS_ANON_AUTH_TRANSITION_WINDOW_MS || 24 * 60 * 60 * 1000);

type RateBucket = {
  count: number;
  windowStart: number;
};

type AnonymousIdentityLink = {
  userId: string;
  linkedAt: number;
};

const rateLimitBuckets = new Map<string, RateBucket>();
const anonymousIdentityLinks = new Map<string, AnonymousIdentityLink>();

export const config = {
  runtime: 'edge',
};

function getAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (allowedOrigins.has(origin)) {
    return origin;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    if (
      protocol === 'https:' &&
      hostname.endsWith('.vercel.app') &&
      hostname.includes('lovelanguages')
    ) {
      return origin;
    }
  } catch {
    // Ignore malformed origins
  }

  return null;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip');
}

function pruneRateLimitBuckets(now: number): void {
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitBuckets.delete(key);
    }
  }
}

function pruneAnonymousIdentityLinks(now: number): void {
  for (const [anonymousId, entry] of anonymousIdentityLinks.entries()) {
    if (now - entry.linkedAt > ANON_AUTH_TRANSITION_WINDOW_MS) {
      anonymousIdentityLinks.delete(anonymousId);
    }
  }
}

function isRateLimited(key: string, now: number): { limited: boolean; retryAfterSeconds: number } {
  const current = rateLimitBuckets.get(key);
  if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_EVENTS) {
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - current.windowStart)) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);
  return { limited: false, retryAfterSeconds: 0 };
}

function validateIdentityTransition(
  resolvedUserId: string | null,
  resolvedAnonymousId: string | null,
  now: number
): { ok: boolean; status?: number; error?: string } {
  pruneAnonymousIdentityLinks(now);

  if (!resolvedAnonymousId) {
    return { ok: true };
  }

  const existingLink = anonymousIdentityLinks.get(resolvedAnonymousId);

  if (resolvedUserId) {
    if (existingLink && existingLink.userId !== resolvedUserId) {
      return {
        ok: false,
        status: 409,
        error: 'anonymous_id is already linked to a different authenticated user',
      };
    }

    anonymousIdentityLinks.set(resolvedAnonymousId, { userId: resolvedUserId, linkedAt: now });
    return { ok: true };
  }

  if (existingLink) {
    return {
      ok: false,
      status: 409,
      error: 'anonymous_id has transitioned to authenticated identity and cannot continue anonymous ingestion',
    };
  }

  return { ok: true };
}

async function getAuthenticatedUserId(authorizationHeader: string | null): Promise<string | null> {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export default async function handler(request: Request) {
  const requestOrigin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  // Browser requests must originate from an allowlisted origin.
  if (requestOrigin && !allowedOrigin) {
    return jsonResponse({ error: 'Origin not allowed' }, 403, null);
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
  }

  // Only accept POST
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allowedOrigin);
  }

  try {
    const authenticatedUserId = await getAuthenticatedUserId(request.headers.get('authorization'));
    const body = await request.json();
    const {
      user_id,
      anonymous_id,
      event_name,
      event_params = {},
      page_path,
      referrer,
      session_id,
    } = body;

    if (!event_name) {
      return jsonResponse({ error: 'event_name required' }, 400, allowedOrigin);
    }

    // Validate event name against allowlist
    if (!ALLOWED_EVENTS.has(event_name)) {
      return jsonResponse({ error: 'Invalid event_name' }, 400, allowedOrigin);
    }

    // Cap event_params size
    const paramsStr = JSON.stringify(event_params);
    if (paramsStr.length > MAX_PARAMS_SIZE) {
      return jsonResponse({ error: 'event_params too large' }, 400, allowedOrigin);
    }

    // Never trust caller-supplied user_id. If present, it must match authenticated user.
    if (user_id && !authenticatedUserId) {
      return jsonResponse({ error: 'Authenticated user required when user_id is present' }, 401, allowedOrigin);
    }

    if (user_id && authenticatedUserId && user_id !== authenticatedUserId) {
      return jsonResponse({ error: 'user_id does not match authenticated identity' }, 403, allowedOrigin);
    }

    const resolvedUserId = authenticatedUserId || null;
    const resolvedAnonymousId = resolvedUserId ? null : (anonymous_id || null);

    if (!resolvedUserId && !resolvedAnonymousId) {
      return jsonResponse({ error: 'anonymous_id required for anonymous events' }, 400, allowedOrigin);
    }

    const now = Date.now();
    pruneRateLimitBuckets(now);

    const rateLimitKey = resolvedUserId
      ? `user:${resolvedUserId}`
      : `anon:${resolvedAnonymousId || getClientIp(request) || 'unknown'}`;

    const { limited, retryAfterSeconds } = isRateLimited(rateLimitKey, now);
    if (limited) {
      return jsonResponse(
        {
          error: 'Rate limit exceeded for analytics ingestion',
          retry_after_seconds: retryAfterSeconds,
        },
        429,
        allowedOrigin
      );
    }

    const transitionValidation = validateIdentityTransition(resolvedUserId, anonymous_id || null, now);
    if (!transitionValidation.ok) {
      return jsonResponse(
        { error: transitionValidation.error || 'Invalid identity transition' },
        transitionValidation.status || 409,
        allowedOrigin
      );
    }

    // Create client per request (Edge Runtime doesn't persist module state reliably)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: resolvedUserId,
        anonymous_id: resolvedAnonymousId,
        event_name,
        event_params,
        page_path,
        referrer,
        session_id,
      });

    if (error) {
      console.error('Failed to insert analytics event:', error);
      return jsonResponse({ error: 'Failed to store event' }, 500, allowedOrigin);
    }

    return jsonResponse({ success: true }, 200, allowedOrigin);
  } catch (e) {
    console.error('Analytics event error:', e);
    return jsonResponse({ error: 'Internal error' }, 500, allowedOrigin);
  }
}
