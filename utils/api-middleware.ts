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
// SECURITY HEADERS
// =============================================================================

/**
 * Standard security headers that should be set on all API responses.
 * Addresses: #4 Content-Type Sniffing, #8 Security Headers Missing
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',           // Prevent MIME sniffing
  'X-Frame-Options': 'DENY',                      // Prevent clickjacking
  'X-XSS-Protection': '1; mode=block',            // Legacy XSS protection
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Note: CSP omitted for JSON APIs - it's meant for HTML pages
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // Force HTTPS
  'Cache-Control': 'no-store, no-cache, must-revalidate', // Don't cache sensitive data
  'Pragma': 'no-cache',
} as const;

/**
 * Sets security headers on the response.
 * Call this at the start of every API handler.
 */
export function setSecurityHeaders(res: VercelResponse): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

// =============================================================================
// SAFE ERROR RESPONSES
// Addresses: #6 Error Message Information Leakage, #11 Credentials in Error Messages
// =============================================================================

/**
 * Generic error messages that don't leak implementation details.
 * Use these instead of raw error messages from databases/services.
 */
export const SAFE_ERROR_MESSAGES = {
  unauthorized: 'Authentication required',
  forbidden: 'Access denied',
  not_found: 'Resource not found',
  rate_limited: 'Too many requests. Please try again later.',
  invalid_request: 'Invalid request',
  server_error: 'An error occurred. Please try again.',
  validation_error: 'Invalid input provided',
  subscription_required: 'Subscription required for this feature',
} as const;

/**
 * Sanitizes error messages before sending to client.
 * Removes stack traces, SQL details, and other sensitive info.
 */
export function sanitizeErrorMessage(error: unknown): string {
  // Never expose raw error messages
  if (!error) return SAFE_ERROR_MESSAGES.server_error;

  // Check for known safe error types
  const err = error as { message?: string; code?: string };

  // PostgreSQL/Supabase error codes we can translate
  if (err.code === 'PGRST301') return SAFE_ERROR_MESSAGES.rate_limited;
  if (err.code === '23505') return 'This item already exists';
  if (err.code === '23503') return SAFE_ERROR_MESSAGES.not_found;
  if (err.code === '42501') return SAFE_ERROR_MESSAGES.forbidden;

  // Don't expose database or internal error messages
  const message = err.message || '';
  if (
    message.includes('pg_') ||
    message.includes('SQL') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('constraint') ||
    message.includes('password') ||
    message.includes('token') ||
    message.includes('key') ||
    message.includes('secret')
  ) {
    console.error('[api-middleware] Sanitized sensitive error:', message);
    return SAFE_ERROR_MESSAGES.server_error;
  }

  // For known application errors, return a generic version
  return SAFE_ERROR_MESSAGES.server_error;
}

/**
 * Creates a safe error response without leaking sensitive information.
 */
export function createErrorResponse(
  res: VercelResponse,
  statusCode: number,
  errorType: keyof typeof SAFE_ERROR_MESSAGES,
  logError?: unknown
): void {
  if (logError) {
    // Log the full error server-side for debugging
    console.error(`[api-middleware] ${errorType}:`, logError);
  }

  setSecurityHeaders(res);
  res.status(statusCode).json({
    error: SAFE_ERROR_MESSAGES[errorType]
  });
}

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
  // Always set security headers first
  setSecurityHeaders(res);

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
  // Set security headers (except Content-Type which SSE needs to override)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

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

/**
 * Extended auth result including admin status
 */
export interface AdminAuthResult {
  userId: string;
  isAdmin: boolean;
}

/**
 * Verifies admin authentication - requires valid JWT AND is_admin flag in profiles.
 *
 * Use this for protected admin-only endpoints (e.g., content generation, analytics).
 *
 * @param req - Vercel request object with Authorization header
 * @returns AdminAuthResult if valid auth, null otherwise. Check isAdmin for admin access.
 *
 * @example
 * ```typescript
 * const admin = await verifyAdminAuth(req);
 * if (!admin) {
 *   return res.status(401).json({ error: 'Unauthorized' });
 * }
 * if (!admin.isAdmin) {
 *   return res.status(403).json({ error: 'Admin access required' });
 * }
 * ```
 */
export async function verifyAdminAuth(req: VercelRequest): Promise<AdminAuthResult | null> {
  const auth = await verifyAuth(req);
  if (!auth) {
    return null;
  }

  const supabase = createServiceClient();
  if (!supabase) {
    console.error('[api-middleware] Missing Supabase config for admin verification');
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.userId)
    .single();

  if (error) {
    console.error('[api-middleware] Failed to check admin status:', error.message);
    return { userId: auth.userId, isAdmin: false };
  }

  return {
    userId: auth.userId,
    isAdmin: profile?.is_admin === true
  };
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
 * Subscription plan type - includes free tier for rate-limited access
 */
export type SubscriptionPlan = 'free' | 'standard' | 'unlimited';

/**
 * Rate limit configuration for each endpoint.
 * Monthly limits per subscription tier. null = unlimited.
 *
 * To modify limits, edit this object - changes apply to all endpoints.
 */
export const RATE_LIMITS = {
  // AI-powered endpoints - free tier has limited access
  chat: { type: 'text_messages', monthly: { free: 25, standard: 5000, unlimited: null } },
  validateWord: { type: 'word_validations', monthly: { free: 50, standard: 2000, unlimited: null } },
  validateAnswer: { type: 'answer_validations', monthly: { free: 75, standard: 3000, unlimited: null } },
  analyzeHistory: { type: 'history_analysis', monthly: { free: 1, standard: 500, unlimited: null } },
  processTranscript: { type: 'transcript_process', monthly: { free: 5, standard: 200, unlimited: null } },
  generateLevelTest: { type: 'level_tests', monthly: { free: 2, standard: 50, unlimited: null } },
  submitLevelTest: { type: 'level_test_submissions', monthly: { free: 4, standard: 100, unlimited: null } },
  createChallenge: { type: 'challenge_creations', monthly: { free: 5, standard: 200, unlimited: null } },
  submitChallenge: { type: 'challenge_submissions', monthly: { free: 10, standard: 500, unlimited: null } },

  // TTS - available to free users
  tts: { type: 'tts_requests', monthly: { free: 100, standard: 1000, unlimited: null } },

  // Voice/Listen endpoints - tracked in minutes, reported by frontend after session ends
  liveToken: { type: 'voice_minutes', monthly: { free: 15, standard: 480, unlimited: null } },
  gladiaToken: { type: 'listen_minutes', monthly: { free: 15, standard: 480, unlimited: null } },

  // Tutor actions
  sendWordGift: { type: 'send_word_gift', monthly: { free: 10, standard: 100, unlimited: null } },

  // Abuse prevention (same limits for all tiers)
  deleteAccount: { type: 'account_deletions', monthly: { free: 1, standard: 1, unlimited: 1 } },
  exportUserData: { type: 'data_exports', monthly: { free: 2, standard: 5, unlimited: 10 } },
  generateInvite: { type: 'invite_generations', monthly: { free: 3, standard: 10, unlimited: 20 } },
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
 * Gets user's subscription plan without blocking.
 * Returns 'free' for users without active paid subscription.
 * Use this when free users should have limited access rather than no access.
 *
 * @param supabase - Supabase client with service key
 * @param userId - User ID to check
 * @returns SubscriptionPlan ('free', 'standard', or 'unlimited')
 *
 * @example
 * ```typescript
 * const plan = await getSubscriptionPlan(supabase, auth.userId);
 * const limit = await checkRateLimit(supabase, auth.userId, 'tts', plan);
 * ```
 */
export async function getSubscriptionPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionPlan> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_status, promo_expires_at, subscription_granted_by, free_tier_chosen_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('[api-middleware] Failed to fetch subscription:', error?.message);
    return 'free';
  }

  // 1. Active paid subscription
  const isActive = profile.subscription_status === 'active';
  if (isActive) {
    const plan = profile.subscription_plan || 'standard';
    if (plan === 'standard' || plan === 'unlimited') {
      return plan;
    }
  }

  // 2. Partner-inherited access (treat as standard for rate limits)
  if (profile.subscription_granted_by) {
    return 'standard';
  }

  // 3. Active promo (treat as standard for rate limits)
  if (profile.promo_expires_at) {
    const promoExpiry = new Date(profile.promo_expires_at);
    if (promoExpiry > new Date()) {
      return 'standard';
    }
  }

  // 4. Free tier (explicitly chosen or default)
  return 'free';
}

/**
 * Checks if user has access to app features.
 * Access is granted via:
 * - Active paid subscription (subscription_status === 'active')
 * - Free tier (free_tier_chosen_at is set)
 * - Creator promo (promo_expires_at > now)
 * - Partner-inherited access (subscription_granted_by is set)
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
    .select('subscription_plan, subscription_status, free_tier_chosen_at, trial_expires_at, promo_expires_at, subscription_granted_by')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('[api-middleware] Failed to fetch subscription:', error?.message);
    return { allowed: false, plan: 'none', error: 'Failed to verify subscription' };
  }

  // Check all access types:

  // 1. Active paid subscription
  const hasActiveSubscription = profile.subscription_status === 'active';
  if (hasActiveSubscription) {
    const plan = (profile.subscription_plan || 'standard') as SubscriptionPlan;
    return { allowed: true, plan };
  }

  // 2. Partner-inherited access (they get partner's plan)
  if (profile.subscription_granted_by) {
    // User has inherited access - treat as standard for rate limits
    return { allowed: true, plan: 'standard' };
  }

  // 3. Active creator promo
  if (profile.promo_expires_at) {
    const promoExpiry = new Date(profile.promo_expires_at);
    if (promoExpiry > new Date()) {
      return { allowed: true, plan: 'standard' };
    }
  }

  // 4. Free tier (explicitly chosen during onboarding)
  if (profile.free_tier_chosen_at) {
    // Check if trial has expired (grandfathered users have no trial_expires_at)
    const trialExpiresAt = (profile as any).trial_expires_at;
    if (trialExpiresAt && new Date(trialExpiresAt) <= new Date()) {
      return {
        allowed: false,
        plan: 'none',
        error: 'Your free trial has expired. Please subscribe to continue.'
      };
    }
    return { allowed: true, plan: 'free' };
  }

  // No access
  return {
    allowed: false,
    plan: 'none',
    error: 'Subscription required. Please subscribe to access this feature.'
  };
}

/**
 * Checks if user has exceeded their rate limit for a specific endpoint.
 * Uses monthly limits stored in RATE_LIMITS configuration.
 *
 * Also checks for active promotional access (promo_expires_at > now),
 * which grants standard tier limits to free users.
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
  plan: SubscriptionPlan,
  options?: { failClosed?: boolean }
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitKey];
  const now = new Date();

  // Get user's profile for promo check and rolling 30-day window calculation
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('created_at, promo_expires_at')
    .eq('id', userId)
    .single();

  // Check for active promotional access
  // If promo_expires_at > now, treat user as 'standard' tier regardless of subscription
  let effectivePlan = plan;
  if (profile?.promo_expires_at) {
    const promoExpiry = new Date(profile.promo_expires_at);
    if (promoExpiry > now) {
      effectivePlan = 'standard';
    }
  }

  const monthlyLimit = config.monthly[effectivePlan];

  // null = unlimited
  if (monthlyLimit === null) {
    return { allowed: true };
  }

  if (profileError || !profile?.created_at) {
    console.error('[api-middleware] Failed to fetch user profile:', profileError?.message);
    if (options?.failClosed) {
      return {
        allowed: false,
        error: 'Unable to verify usage limits. Please try again.'
      };
    }
    return { allowed: true };
  }

  // Calculate rolling 30-day window based on signup date
  // The window resets every 30 days from signup, not calendar month
  const signupDate = new Date(profile.created_at);
  const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentPeriod = Math.floor(daysSinceSignup / 30);

  // Calculate the start of the current 30-day period
  const periodStartDate = new Date(signupDate);
  periodStartDate.setDate(periodStartDate.getDate() + (currentPeriod * 30));
  const periodStart = periodStartDate.toISOString().split('T')[0];

  // Calculate the end of the current 30-day period (start of next period)
  const periodEndDate = new Date(periodStartDate);
  periodEndDate.setDate(periodEndDate.getDate() + 30);
  const periodEnd = periodEndDate.toISOString().split('T')[0];

  // Get usage for current rolling 30-day period
  const { data: periodUsage, error } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_type', config.type)
    .gte('usage_date', periodStart)
    .lt('usage_date', periodEnd);

  if (error) {
    console.error('[api-middleware] Failed to check usage:', error.message);
    // Fail-closed for expensive operations, fail-open for better UX on others
    if (options?.failClosed) {
      return {
        allowed: false,
        error: 'Unable to verify usage limits. Please try again.'
      };
    }
    return { allowed: true };
  }

  const currentCount = (periodUsage || []).reduce((sum, row) => sum + (row.count || 0), 0);
  const remaining = Math.max(0, monthlyLimit - currentCount);

  // Reset time is the start of the next 30-day period
  const resetAt = periodEndDate.toISOString();

  if (currentCount >= monthlyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: monthlyLimit,
      resetAt,
      error: `Monthly limit reached (${monthlyLimit}). Resets ${periodEndDate.toLocaleDateString()}.`
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
 * @param usageType - Usage type string (e.g., 'text_messages', 'voice_minutes')
 * @param amount - Amount to increment by (default 1). Use for minute-based tracking.
 *
 * @example
 * ```typescript
 * // After successful operation
 * incrementUsage(supabase, auth.userId, 'text_messages');
 * // Or with amount for minute-based tracking
 * incrementUsage(supabase, auth.userId, 'voice_minutes', 5);
 * ```
 */
export function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  usageType: string,
  amount: number = 1
): void {
  // Non-blocking - fire and forget
  (async () => {
    try {
      const { error } = await supabase.rpc('increment_usage_counter', {
        p_user_id: userId,
        p_usage_type: usageType,
        p_amount: amount,
      });
      if (error) {
        console.error('[api-middleware] Usage tracking failed:', error.message);
      }
    } catch (err: any) {
      console.error('[api-middleware] Usage tracking failed:', err.message);
      // Don't throw - this is non-blocking
    }
  })();
}

// =============================================================================
// AUTH RATE LIMITING
// Addresses: #1 Login Rate Limiting, #3 OTP Brute Force, #12 Password Reset Abuse
// =============================================================================

export type AuthRateLimitAction = 'login' | 'otp_verify' | 'password_reset';

export interface AuthRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil: string | null;
  waitSeconds: number;
}

/**
 * Check if an auth action is rate limited.
 * Uses IP address or email as identifier.
 *
 * @param supabase - Supabase client with service key
 * @param identifier - IP address or email to check
 * @param action - Type of auth action ('login', 'otp_verify', 'password_reset')
 * @param options - Optional rate limit thresholds
 * @returns AuthRateLimitResult with allowed status and retry info
 *
 * @example
 * ```typescript
 * const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
 * const rateLimit = await checkAuthRateLimit(supabase, ipAddress, 'login');
 * if (!rateLimit.allowed) {
 *   res.setHeader('Retry-After', rateLimit.waitSeconds.toString());
 *   return res.status(429).json({ error: 'Too many attempts' });
 * }
 * ```
 */
export async function checkAuthRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  action: AuthRateLimitAction,
  options?: {
    maxAttempts?: number;
    windowMinutes?: number;
    blockMinutes?: number;
  }
): Promise<AuthRateLimitResult> {
  const maxAttempts = options?.maxAttempts ?? 5;
  const windowMinutes = options?.windowMinutes ?? 15;
  const blockMinutes = options?.blockMinutes ?? 30;

  try {
    const { data, error } = await supabase.rpc('check_auth_rate_limit', {
      p_identifier: identifier,
      p_action_type: action,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes,
      p_block_minutes: blockMinutes,
    });

    if (error) {
      console.error('[api-middleware] Rate limit check failed:', error.message);
      // Fail open - don't block legitimate users due to DB errors
      return { allowed: true, remainingAttempts: maxAttempts, blockedUntil: null, waitSeconds: 0 };
    }

    const result = data?.[0];
    if (!result) {
      return { allowed: true, remainingAttempts: maxAttempts, blockedUntil: null, waitSeconds: 0 };
    }

    return {
      allowed: result.allowed,
      remainingAttempts: result.remaining_attempts || 0,
      blockedUntil: result.blocked_until,
      waitSeconds: result.wait_seconds || 0,
    };
  } catch (err: any) {
    console.error('[api-middleware] Rate limit check error:', err.message);
    // Fail open
    return { allowed: true, remainingAttempts: maxAttempts, blockedUntil: null, waitSeconds: 0 };
  }
}

/**
 * Clear rate limit after successful authentication.
 * Call this after a successful login/OTP verification.
 */
export async function clearAuthRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  action: AuthRateLimitAction
): Promise<void> {
  try {
    await supabase.rpc('clear_auth_rate_limit', {
      p_identifier: identifier,
      p_action_type: action,
    });
  } catch (err: any) {
    // Non-critical, log and continue
    console.error('[api-middleware] Failed to clear rate limit:', err.message);
  }
}

/**
 * Log a security event to the audit log.
 * Use for failed logins, rate limit hits, suspicious activity.
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  eventType: string,
  details: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: unknown;
  }
): Promise<void> {
  try {
    const { userId, ipAddress, userAgent, ...rest } = details;

    await supabase.from('security_audit_log').insert({
      event_type: eventType,
      user_id: userId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      details: rest,
    });
  } catch (err: any) {
    // Non-critical, log and continue
    console.error('[api-middleware] Failed to log security event:', err.message);
  }
}

/**
 * Extract client IP address from request headers.
 * Handles common proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(req: VercelRequest): string {
  // Vercel/common proxy headers
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list, take first
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  // Real IP (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return 'unknown';
}
