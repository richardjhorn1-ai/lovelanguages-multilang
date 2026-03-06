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
 * Configured in RevenueCat Dashboard -> Integrations -> Webhooks
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Atomic event claim -- same pattern as Stripe webhook
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

export async function POST(request: Request) {
  // Verify authorization header (shared secret set in RevenueCat dashboard)
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!webhookSecret) {
    console.error('[revenuecat-webhook] Missing REVENUECAT_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${webhookSecret}`) {
    console.error('[revenuecat-webhook] Invalid authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let body: any;
  try {
    const rawBody = await request.text();
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error('[revenuecat-webhook] Failed to parse body:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const event = body.event;
  if (!event) {
    return NextResponse.json({ error: 'Missing event data' }, { status: 400 });
  }

  const eventType = event.type; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
  const eventId = event.id || `rc_${Date.now()}`; // Unique event ID
  const appUserId = event.app_user_id; // Our Supabase user ID
  const productId = event.product_id; // e.g., "standard_monthly"
  const expirationAtMs = event.expiration_at_ms; // Subscription expiration timestamp

  console.log(`[revenuecat-webhook] Received: ${eventType} for user ${appUserId}, product ${productId}`);

  if (!appUserId) {
    console.error('[revenuecat-webhook] Missing app_user_id');
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
  }

  // Initialize Supabase with service key
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[revenuecat-webhook] Missing Supabase config');
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { plan, period } = getPlanFromProductId(productId || '');
    const expirationDate = expirationAtMs
      ? new Date(expirationAtMs).toISOString()
      : null;

    switch (eventType) {
      // =========================================
      // INITIAL PURCHASE -- New subscription
      // =========================================
      case 'INITIAL_PURCHASE': {
        const { claimed } = await claimEvent(supabase, {
          user_id: appUserId,
          event_type: 'app_store_initial_purchase',
          stripe_event_id: eventId,
          previous_plan: 'none',
          new_plan: plan,
          metadata: { period, product_id: productId, source: 'app_store' },
        });

        if (!claimed) {
          console.log(`[revenuecat-webhook] Duplicate event ${eventId}, skipping`);
          return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
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
          .eq('id', appUserId);

        await cascadeToPartner(supabase, appUserId, plan, 'active', period, expirationDate);
        console.log(`[revenuecat-webhook] User ${appUserId} subscribed to ${plan} (${period}) via App Store`);
        break;
      }

      // =========================================
      // RENEWAL -- Subscription renewed
      // =========================================
      case 'RENEWAL': {
        const { claimed } = await claimEvent(supabase, {
          user_id: appUserId,
          event_type: 'app_store_renewal',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { period, product_id: productId, source: 'app_store' },
        });

        if (!claimed) return NextResponse.json({ received: true, duplicate: true }, { status: 200 });

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_ends_at: expirationDate,
            subscription_source: 'app_store',
          })
          .eq('id', appUserId);

        await cascadeToPartner(supabase, appUserId, plan, 'active', period, expirationDate);
        console.log(`[revenuecat-webhook] User ${appUserId} renewed ${plan}`);
        break;
      }

      // =========================================
      // CANCELLATION -- User cancelled (still active until period end)
      // =========================================
      case 'CANCELLATION': {
        const { claimed } = await claimEvent(supabase, {
          user_id: appUserId,
          event_type: 'app_store_cancellation',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { product_id: productId, source: 'app_store' },
        });

        if (!claimed) return NextResponse.json({ received: true, duplicate: true }, { status: 200 });

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled', // Still active until period end
            subscription_source: 'app_store',
          })
          .eq('id', appUserId);

        console.log(`[revenuecat-webhook] User ${appUserId} cancelled ${plan} (active until ${expirationDate})`);
        break;
      }

      // =========================================
      // EXPIRATION -- Subscription period ended
      // =========================================
      case 'EXPIRATION': {
        const { claimed } = await claimEvent(supabase, {
          user_id: appUserId,
          event_type: 'app_store_expiration',
          stripe_event_id: eventId,
          previous_plan: plan,
          new_plan: 'none',
          metadata: { product_id: productId, source: 'app_store' },
        });

        if (!claimed) return NextResponse.json({ received: true, duplicate: true }, { status: 200 });

        await supabase
          .from('profiles')
          .update({
            subscription_plan: 'none',
            subscription_status: 'inactive',
            subscription_period: null,
            subscription_ends_at: null,
            subscription_source: 'app_store',
          })
          .eq('id', appUserId);

        await cascadeToPartner(supabase, appUserId, 'none', 'inactive', '', null);
        console.log(`[revenuecat-webhook] User ${appUserId} subscription expired`);
        break;
      }

      // =========================================
      // UNCANCELLATION -- User re-enabled auto-renew
      // =========================================
      case 'UNCANCELLATION': {
        await claimEvent(supabase, {
          user_id: appUserId,
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
          .eq('id', appUserId);

        console.log(`[revenuecat-webhook] User ${appUserId} re-enabled auto-renew for ${plan}`);
        break;
      }

      // =========================================
      // BILLING_ISSUE -- Payment failed
      // =========================================
      case 'BILLING_ISSUE': {
        await claimEvent(supabase, {
          user_id: appUserId,
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
          .eq('id', appUserId);

        console.log(`[revenuecat-webhook] Billing issue for user ${appUserId}`);
        break;
      }

      // =========================================
      // PRODUCT_CHANGE -- User switched plans
      // =========================================
      case 'PRODUCT_CHANGE': {
        const { claimed } = await claimEvent(supabase, {
          user_id: appUserId,
          event_type: 'app_store_product_change',
          stripe_event_id: eventId,
          new_plan: plan,
          metadata: { period, product_id: productId, source: 'app_store' },
        });

        if (!claimed) return NextResponse.json({ received: true, duplicate: true }, { status: 200 });

        await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_period: period,
            subscription_ends_at: expirationDate,
            subscription_source: 'app_store',
          })
          .eq('id', appUserId);

        await cascadeToPartner(supabase, appUserId, plan, 'active', period, expirationDate);
        console.log(`[revenuecat-webhook] User ${appUserId} changed to ${plan} (${period})`);
        break;
      }

      default:
        console.log(`[revenuecat-webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error(`[revenuecat-webhook] Error processing ${eventType}:`, err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
