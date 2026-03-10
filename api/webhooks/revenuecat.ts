/**
 * RevenueCat Webhook Handler
 *
 * Receives subscription events from RevenueCat for iOS in-app purchases.
 * Mirrors the Stripe webhook pattern: idempotent event processing,
 * profile updates, and partner subscription cascade.
 *
 * RevenueCat event types:
 *   INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION,
 *   BILLING_ISSUE, PRODUCT_CHANGE, EXPIRATION, SUBSCRIBER_ALIAS
 *
 * Configured in RevenueCat Dashboard → Integrations → Webhooks
 */

import { createClient } from '@supabase/supabase-js';

// Disable body parsing — we need the raw body for auth header verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body
async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Map RevenueCat product IDs to our plan/period
function getPlanFromProductId(productId: string): { plan: string; period: string } {
  const productMap: Record<string, { plan: string; period: string }> = {
    'standard_weekly': { plan: 'standard', period: 'weekly' },
    'standard_monthly': { plan: 'standard', period: 'monthly' },
    'standard_yearly': { plan: 'standard', period: 'yearly' },
    'unlimited_weekly': { plan: 'unlimited', period: 'weekly' },
    'unlimited_monthly': { plan: 'unlimited', period: 'monthly' },
    'unlimited_yearly': { plan: 'unlimited', period: 'yearly' },
  };
  return productMap[productId] || { plan: 'unknown', period: 'unknown' };
}

function getRevenueCatPrice(event: any): number | undefined {
  const rawPrice = event.price_in_purchased_currency ?? event.price ?? event.takehome_percentage;
  return typeof rawPrice === 'number' ? rawPrice : undefined;
}

function getRevenueCatCurrency(event: any): string | undefined {
  const rawCurrency = event.currency ?? event.currency_code ?? event.store_currency;
  return typeof rawCurrency === 'string' ? rawCurrency.toUpperCase() : undefined;
}

function isUuidLike(value: string | null | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function getIdentityCandidates(event: any): string[] {
  const aliases = Array.isArray(event.aliases) ? event.aliases : [];
  return Array.from(
    new Set(
      [event.app_user_id, event.original_app_user_id, ...aliases]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    )
  );
}

async function upsertPrivateRevenueCatCustomerId(
  supabase: any,
  userId: string,
  revenueCatCustomerId: string
): Promise<void> {
  const { error } = await supabase
    .from('profile_private')
    .upsert(
      {
        user_id: userId,
        revenuecat_customer_id: revenueCatCustomerId,
        subscription_source: 'app_store',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw error;
  }
}

async function findUserIdByRevenueCatCustomerId(
  supabase: any,
  candidates: string[]
): Promise<string | null> {
  if (candidates.length === 0) {
    return null;
  }

  const { data: privateState } = await supabase
    .from('profile_private')
    .select('user_id')
    .in('revenuecat_customer_id', candidates)
    .limit(1)
    .maybeSingle();

  if (privateState?.user_id) {
    return privateState.user_id;
  }

  const { data: legacyProfile } = await supabase
    .from('profiles')
    .select('id')
    .in('revenuecat_customer_id', candidates)
    .limit(1)
    .maybeSingle();

  return legacyProfile?.id || null;
}

async function resolveRevenueCatUser(
  supabase: any,
  event: any
): Promise<{ userId: string | null; revenueCatCustomerId: string | null }> {
  const candidates = getIdentityCandidates(event);
  const directUserId = candidates.find((candidate) => isUuidLike(candidate)) || null;

  if (directUserId) {
    return {
      userId: directUserId,
      revenueCatCustomerId: typeof event.app_user_id === 'string' ? event.app_user_id : directUserId,
    };
  }

  const userId = await findUserIdByRevenueCatCustomerId(supabase, candidates);
  return {
    userId,
    revenueCatCustomerId: typeof event.app_user_id === 'string' ? event.app_user_id : candidates[0] || null,
  };
}

// Atomic event claim — same pattern as Stripe webhook
async function claimEvent(
  supabase: any,
  data: {
    user_id: string;
    event_type: string;
    stripe_event_id: string; // Reusing column for RevenueCat event ID
    previous_plan?: string;
    new_plan?: string;
    metadata?: any;
  }
): Promise<{ claimed: boolean }> {
  const { error } = await supabase.from('subscription_events').insert(data);

  if (error?.code === '23505') {
    return { claimed: false };
  }

  if (error) {
    console.error('[revenuecat-webhook] Failed to claim event:', error.message);
  }

  return { claimed: true };
}

// Cascade subscription update to partner (if linked)
async function cascadeToPartner(
  supabase: any,
  userId: string,
  plan: string,
  status: string,
  period: string,
  endsAt: string | null
): Promise<void> {
  // Find partner who inherits from this user
  const { data: partner } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_granted_by', userId)
    .single();

  if (partner) {
    await supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        subscription_status: status,
        subscription_period: period,
        subscription_ends_at: endsAt,
        subscription_source: 'app_store',
      })
      .eq('id', partner.id);

    console.log(`[revenuecat-webhook] Cascaded ${plan}/${status} to partner ${partner.id}`);
  }
}

async function maybeCompletePaidOnboarding(
  supabase: any,
  userId: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_status, onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || profile.onboarding_status === 'completed') {
    return;
  }

  const now = new Date().toISOString();
  await supabase
    .from('profiles')
    .update({
      onboarding_status: 'completed',
      onboarding_completion_reason: 'paid',
      onboarding_step_key: 'start',
      onboarding_last_step_at: now,
      onboarding_completed_at: profile.onboarding_completed_at || now,
      onboarding_error_code: null,
      onboarding_error_context: null,
      onboarding_progress: null,
    })
    .eq('id', userId);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authorization header (shared secret set in RevenueCat dashboard)
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const authHeader = req.headers['authorization'];

  if (!webhookSecret) {
    console.error('[revenuecat-webhook] Missing REVENUECAT_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  if (authHeader !== `Bearer ${webhookSecret}`) {
    console.error('[revenuecat-webhook] Invalid authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Parse body
  let body: any;
  try {
    const rawBody = await getRawBody(req);
    body = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    console.error('[revenuecat-webhook] Failed to parse body:', err);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const event = body.event;
  if (!event) {
    return res.status(400).json({ error: 'Missing event data' });
  }

  const eventType = event.type; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
  const eventId = event.id || `rc_${Date.now()}`; // Unique event ID
  const appUserId = event.app_user_id; // RevenueCat app user ID (often Supabase UID, sometimes alias)
  const productId = event.product_id; // e.g., "standard_monthly"
  const expirationAtMs = event.expiration_at_ms; // Subscription expiration timestamp

  console.log(`[revenuecat-webhook] Received: ${eventType} for user ${appUserId}, product ${productId}`);

  // Initialize Supabase with service key
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[revenuecat-webhook] Missing Supabase config');
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, revenueCatCustomerId } = await resolveRevenueCatUser(supabase, event);

    if (!userId) {
      console.error('[revenuecat-webhook] Could not resolve user from RevenueCat identifiers', getIdentityCandidates(event));
      return res.status(400).json({ error: 'Unresolvable user' });
    }

    if (revenueCatCustomerId) {
      await upsertPrivateRevenueCatCustomerId(supabase, userId, revenueCatCustomerId);
    }

    const { plan, period } = getPlanFromProductId(productId || '');
    const expirationDate = expirationAtMs
      ? new Date(expirationAtMs).toISOString()
      : null;

    switch (eventType) {
      // =========================================
      // INITIAL PURCHASE — New subscription
      // =========================================
      case 'INITIAL_PURCHASE': {
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_initial_purchase',
          stripe_event_id: eventId,
          previous_plan: 'none',
          new_plan: plan,
          metadata: { period, product_id: productId, source: 'app_store' },
        });

        if (!claimed) {
          console.log(`[revenuecat-webhook] Duplicate event ${eventId}, skipping`);
          return res.status(200).json({ received: true, duplicate: true });
        }

        await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_period: period,
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: expirationDate,
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        await maybeCompletePaidOnboarding(supabase, userId);
        await cascadeToPartner(supabase, userId, plan, 'active', period, expirationDate);
        console.log(`[revenuecat-webhook] User ${userId} subscribed to ${plan} (${period}) via App Store`);
        break;
      }

      // =========================================
      // RENEWAL — Subscription renewed
      // =========================================
      case 'RENEWAL': {
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_renewal',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { period, product_id: productId, source: 'app_store' },
        });

        if (!claimed) return res.status(200).json({ received: true, duplicate: true });

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_ends_at: expirationDate,
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        await maybeCompletePaidOnboarding(supabase, userId);
        await cascadeToPartner(supabase, userId, plan, 'active', period, expirationDate);
        console.log(`[revenuecat-webhook] User ${userId} renewed ${plan}`);
        break;
      }

      // =========================================
      // CANCELLATION — User cancelled (still active until period end)
      // =========================================
      case 'CANCELLATION': {
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_cancellation',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { product_id: productId, source: 'app_store' },
        });

        if (!claimed) return res.status(200).json({ received: true, duplicate: true });

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled', // Still active until period end
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        console.log(`[revenuecat-webhook] User ${userId} cancelled ${plan} (active until ${expirationDate})`);
        break;
      }

      // =========================================
      // EXPIRATION — Subscription period ended
      // =========================================
      case 'EXPIRATION': {
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_expiration',
          stripe_event_id: eventId,
          previous_plan: plan,
          new_plan: 'none',
          metadata: { product_id: productId, source: 'app_store' },
        });

        if (!claimed) return res.status(200).json({ received: true, duplicate: true });

        await supabase
          .from('profiles')
          .update({
            subscription_plan: 'none',
            subscription_status: 'inactive',
            subscription_period: null,
            subscription_ends_at: null,
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        await cascadeToPartner(supabase, userId, 'none', 'inactive', '', null);
        console.log(`[revenuecat-webhook] User ${userId} subscription expired`);
        break;
      }

      // =========================================
      // UNCANCELLATION — User re-enabled auto-renew
      // =========================================
      case 'UNCANCELLATION': {
        await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_uncancellation',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { product_id: productId, source: 'app_store' },
        });

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        console.log(`[revenuecat-webhook] User ${userId} re-enabled auto-renew for ${plan}`);
        break;
      }

      // =========================================
      // BILLING_ISSUE — Payment failed
      // =========================================
      case 'BILLING_ISSUE': {
        await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_billing_issue',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { product_id: productId, source: 'app_store' },
        });

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        console.log(`[revenuecat-webhook] Billing issue for user ${userId}`);
        break;
      }

      // =========================================
      // PRODUCT_CHANGE — User switched plans
      // =========================================
      case 'PRODUCT_CHANGE': {
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_product_change',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { period, product_id: productId, source: 'app_store' },
        });

        if (!claimed) return res.status(200).json({ received: true, duplicate: true });

        await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_period: period,
            subscription_ends_at: expirationDate,
            subscription_source: 'app_store',
          })
          .eq('id', userId);

        await maybeCompletePaidOnboarding(supabase, userId);
        await cascadeToPartner(supabase, userId, plan, 'active', period, expirationDate);
        console.log(`[revenuecat-webhook] User ${userId} changed to ${plan} (${period})`);
        break;
      }

      // =========================================
      // SUBSCRIBER_ALIAS — RevenueCat merged identities
      // =========================================
      case 'SUBSCRIBER_ALIAS': {
        await claimEvent(supabase, {
          user_id: userId,
          event_type: 'app_store_subscriber_alias',
          stripe_event_id: eventId,
          metadata: {
            aliases: getIdentityCandidates(event),
            source: 'app_store',
          },
        });

        console.log(`[revenuecat-webhook] Synced subscriber alias for user ${userId}`);
        break;
      }

      default:
        console.log(`[revenuecat-webhook] Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`[revenuecat-webhook] Error processing ${eventType}:`, err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
