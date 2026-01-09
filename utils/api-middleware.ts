/**
 * Centralized API middleware utilities for Vercel serverless functions.
 *
 * IMPORTANT: This module is designed to work with Vercel's serverless bundling model.
 * Each API function imports this file and gets its own bundled copy.
 *
 * To update CORS or auth logic across all endpoints:
 * 1. Modify this file
 * 2. Redeploy (Vercel will re-bundle each function with updated code)
 *
 * Security considerations:
 * - setCorsHeaders: Prevents wildcard + credentials vulnerability (OWASP)
 * - verifyAuth: Validates Supabase JWT tokens server-side
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface VercelRequest {
  method?: string;
  headers: {
    origin?: string;
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
  body?: unknown;
}

export interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(data: unknown): void;
  end(): void;
}

export interface AuthResult {
  userId: string;
}

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

/**
 * Sets CORS headers on the response and handles OPTIONS preflight requests.
 *
 * Security features:
 * - NEVER combines wildcard origin (*) with credentials (prevents security vulnerability)
 * - Only sets credentials header when there's an explicit origin match
 * - Returns true for OPTIONS requests so handlers can short-circuit
 *
 * Environment:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g., "https://example.com,https://app.example.com")
 * - Use "*" for development only (credentials will be disabled)
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns true if this is an OPTIONS request (handler should return early)
 *
 * @example
 * ```typescript
 * import { setCorsHeaders, verifyAuth } from '@/utils/api-middleware';
 *
 * export default async function handler(req: any, res: any) {
 *   if (setCorsHeaders(req, res)) {
 *     return res.status(200).end();
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
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
  } else if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
    // No match but have allowed origins - use first one for debugging
    // Note: NOT setting credentials when origin doesn't match (prevents CORS bypass)
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

/**
 * Sets CORS headers for Server-Sent Events (SSE) streaming endpoints.
 *
 * SSE endpoints have different requirements:
 * - Content-Type must be text/event-stream
 * - Connection must be keep-alive
 * - No caching allowed
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns true if this is an OPTIONS request (handler should return early)
 */
export function setStreamingCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  // Set SSE-specific headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Set CORS headers
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // For SSE, prefer explicit match, fall back to first allowed origin
  if (origin && allowedOrigins.includes(origin) && origin !== '*') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
    // No match but have allowed origins - use first one for debugging
    // Note: NOT setting credentials when origin doesn't match (prevents CORS bypass)
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return true;
  }

  return false;
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Verifies the user's authentication token from the Authorization header.
 *
 * Security features:
 * - Validates JWT against Supabase Auth service
 * - Uses service key for server-side verification (not exposed to client)
 * - Returns null for any auth failure (prevents information leakage)
 *
 * Environment:
 * - VITE_SUPABASE_URL or SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Service role key for server-side auth
 *
 * @param req - Vercel request object with Authorization header
 * @returns AuthResult with userId if valid, null otherwise
 *
 * @example
 * ```typescript
 * const auth = await verifyAuth(req);
 * if (!auth) {
 *   return res.status(401).json({ error: 'Unauthorized' });
 * }
 * const userId = auth.userId;
 * ```
 */
export async function verifyAuth(req: VercelRequest): Promise<AuthResult | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[api-middleware] Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('[api-middleware] Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

// =============================================================================
// SUPABASE CLIENT FACTORY
// =============================================================================

/**
 * Creates a Supabase client with service key for server-side operations.
 *
 * @returns Supabase client or null if config is missing
 */
export function createServiceClient(): SupabaseClient | null {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[api-middleware] Missing Supabase config');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Gets Supabase config values for manual client creation.
 * Useful when you need both URL and key but want to manage client yourself.
 *
 * @returns Object with url and serviceKey, or null if missing
 */
export function getSupabaseConfig(): { url: string; serviceKey: string } | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return { url, serviceKey };
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Subscription plan type - only paid tiers, no free tier
 */
export type SubscriptionPlan = 'standard' | 'unlimited';

/**
 * Rate limit configuration for each endpoint.
 * Monthly limits per subscription tier. null = unlimited.
 *
 * To modify limits, edit this object - changes apply to all endpoints.
 */
export const RATE_LIMITS = {
  // AI-powered endpoints (high cost)
  chat: { type: 'text_messages', monthly: { standard: 5000, unlimited: null } },
  validateWord: { type: 'word_validations', monthly: { standard: 2000, unlimited: null } },
  validateAnswer: { type: 'answer_validations', monthly: { standard: 3000, unlimited: null } },
  analyzeHistory: { type: 'history_analysis', monthly: { standard: 500, unlimited: null } },
  polishTranscript: { type: 'transcript_polish', monthly: { standard: 200, unlimited: null } },
  generateLevelTest: { type: 'level_tests', monthly: { standard: 50, unlimited: null } },
  submitLevelTest: { type: 'level_test_submissions', monthly: { standard: 100, unlimited: null } },
  createChallenge: { type: 'challenge_creations', monthly: { standard: 200, unlimited: null } },
  submitChallenge: { type: 'challenge_submissions', monthly: { standard: 500, unlimited: null } },
  tts: { type: 'tts_requests', monthly: { standard: 1000, unlimited: null } },

  // Voice endpoints (very high cost)
  liveToken: { type: 'voice_sessions', monthly: { standard: 20, unlimited: null } },
  gladiaToken: { type: 'listen_sessions', monthly: { standard: 40, unlimited: null } },

  // Abuse prevention (same limits for all tiers)
  deleteAccount: { type: 'account_deletions', monthly: { standard: 1, unlimited: 1 } },
  exportUserData: { type: 'data_exports', monthly: { standard: 5, unlimited: 10 } },
  generateInvite: { type: 'invite_generations', monthly: { standard: 10, unlimited: 20 } },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

/**
 * Result of subscription check
 */
export interface SubscriptionResult {
  allowed: boolean;
  plan: SubscriptionPlan | 'none';
  error?: string;
}

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  resetAt?: string;
  error?: string;
}

/**
 * Checks if user has an active paid subscription.
 * Blocks free users (plan === 'none' or inactive subscription).
 *
 * @param supabase - Supabase client with service key
 * @param userId - User ID to check
 * @returns SubscriptionResult with allowed status and plan
 *
 * @example
 * ```typescript
 * const sub = await requireSubscription(supabase, auth.userId);
 * if (!sub.allowed) {
 *   return res.status(403).json({ error: sub.error });
 * }
 * ```
 */
export async function requireSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionResult> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('[api-middleware] Failed to fetch subscription:', error?.message);
    return { allowed: false, plan: 'none', error: 'Failed to verify subscription' };
  }

  const isActive = profile.subscription_status === 'active';
  const plan = isActive ? (profile.subscription_plan || 'none') : 'none';

  if (plan === 'none') {
    return {
      allowed: false,
      plan: 'none',
      error: 'Subscription required. Please subscribe to access this feature.'
    };
  }

  return { allowed: true, plan: plan as SubscriptionPlan };
}

/**
 * Checks if user has exceeded their rate limit for a specific endpoint.
 * Uses monthly limits stored in RATE_LIMITS configuration.
 *
 * @param supabase - Supabase client with service key
 * @param userId - User ID to check
 * @param limitKey - Key from RATE_LIMITS (e.g., 'chat', 'validateWord')
 * @param plan - User's subscription plan (from requireSubscription)
 * @returns RateLimitResult with allowed status and remaining count
 *
 * @example
 * ```typescript
 * const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan);
 * if (!limit.allowed) {
 *   res.setHeader('Retry-After', '86400'); // 24 hours
 *   return res.status(429).json({ error: limit.error, remaining: 0 });
 * }
 * ```
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  limitKey: RateLimitKey,
  plan: SubscriptionPlan
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitKey];
  const monthlyLimit = config.monthly[plan];

  // null = unlimited
  if (monthlyLimit === null) {
    return { allowed: true };
  }

  // Calculate current month boundaries
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // "2026-01"
  const [year, month] = currentMonth.split('-').map(Number);
  const nextMonth = month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, '0')}`;

  // Get usage for current month
  const { data: monthlyUsage, error } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_type', config.type)
    .gte('usage_date', `${currentMonth}-01`)
    .lt('usage_date', `${nextMonth}-01`);

  if (error) {
    console.error('[api-middleware] Failed to check usage:', error.message);
    // On error, allow the request (fail open for better UX)
    return { allowed: true };
  }

  const currentCount = (monthlyUsage || []).reduce((sum, row) => sum + (row.count || 0), 0);
  const remaining = Math.max(0, monthlyLimit - currentCount);

  // Calculate reset time (first of next month)
  const resetDate = new Date(year, month, 1); // month is 0-indexed, so this is next month
  const resetAt = resetDate.toISOString();

  if (currentCount >= monthlyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: monthlyLimit,
      resetAt,
      error: `Monthly limit reached (${monthlyLimit}). Resets ${resetDate.toLocaleDateString()}.`
    };
  }

  return {
    allowed: true,
    remaining,
    limit: monthlyLimit,
    resetAt
  };
}

/**
 * Increments usage counter for a specific usage type.
 * Should be called AFTER successful operation (not before).
 * Non-blocking - failures are logged but don't affect the response.
 *
 * @param supabase - Supabase client with service key
 * @param userId - User ID
 * @param usageType - Usage type string (e.g., 'text_messages', 'voice_sessions')
 *
 * @example
 * ```typescript
 * // After successful operation
 * incrementUsage(supabase, auth.userId, 'text_messages');
 * return res.status(200).json({ success: true });
 * ```
 */
export function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  usageType: string
): void {
  // Non-blocking - fire and forget
  (async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get current count for today
      const { data: existing } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', userId)
        .eq('usage_type', usageType)
        .eq('usage_date', today)
        .single();

      const currentCount = existing?.count || 0;

      // Upsert with incremented count
      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: userId,
          usage_type: usageType,
          usage_date: today,
          count: currentCount + 1
        }, {
          onConflict: 'user_id,usage_type,usage_date'
        });
    } catch (err: any) {
      console.error('[api-middleware] Usage tracking failed:', err.message);
      // Don't throw - this is non-blocking
    }
  })();
}
