import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Map Stripe price IDs to plan names
function getPlanFromPriceId(priceId: string): { plan: string; period: string } {
  const priceMap: Record<string, { plan: string; period: string }> = {
    [process.env.STRIPE_PRICE_STANDARD_WEEKLY || '']: { plan: 'standard', period: 'weekly' },
    [process.env.STRIPE_PRICE_STANDARD_MONTHLY || '']: { plan: 'standard', period: 'monthly' },
    [process.env.STRIPE_PRICE_STANDARD_YEARLY || '']: { plan: 'standard', period: 'yearly' },
    [process.env.STRIPE_PRICE_UNLIMITED_WEEKLY || '']: { plan: 'unlimited', period: 'weekly' },
    [process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || '']: { plan: 'unlimited', period: 'monthly' },
    [process.env.STRIPE_PRICE_UNLIMITED_YEARLY || '']: { plan: 'unlimited', period: 'yearly' },
  };
  return priceMap[priceId] || { plan: 'unknown', period: 'unknown' };
}

// Generate a cryptographically secure gift pass code
function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LOVE-';
  for (let i = 0; i < 4; i++) code += chars[randomInt(chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[randomInt(chars.length)];
  return code;
}

// Atomic event claim - returns true if we claimed the event, false if duplicate
async function claimEvent(
  supabase: any,
  data: {
    user_id: string;
    event_type: string;
    stripe_event_id: string;
    previous_plan?: string;
    new_plan?: string;
    metadata?: any;
  }
): Promise<{ claimed: boolean }> {
  const { error } = await supabase.from('subscription_events').insert(data);

  if (error?.code === '23505') {
    // Duplicate key - event already processed
    return { claimed: false };
  }

  if (error) {
    // Log other errors but don't block processing
    console.error('[stripe-webhook] Failed to claim event:', error.message);
  }

  return { claimed: true };
}

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[stripe-webhook] Missing configuration');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  // Get raw body for signature verification
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('[stripe-webhook] Failed to read body:', err);
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // Verify webhook signature
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[stripe-webhook] Missing Supabase config');
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      // =========================================
      // CHECKOUT COMPLETED - New subscription
      // =========================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId || !subscriptionId) {
          console.error('[stripe-webhook] Missing user ID or subscription ID in checkout session');
          break;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const { plan, period } = getPlanFromPriceId(priceId);

        // Atomic idempotency: claim the event first
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'checkout_completed',
          stripe_event_id: event.id,
          previous_plan: 'none',
          new_plan: plan,
          metadata: { period, subscription_id: subscriptionId },
        });

        if (!claimed) {
          console.log(`[stripe-webhook] Duplicate event ${event.id}, skipping`);
          return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }

        // FIX: current_period_end is on subscription object, not item
        const periodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        // Update user's profile with subscription info
        // FIX: Include stripe_customer_id so future events can find this user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_period: period,
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
            stripe_customer_id: customerId,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[stripe-webhook] Failed to update profile:', updateError);
          throw updateError;
        }

        // Non-blocking: Create gift pass for unlimited yearly subscribers
        if (plan === 'unlimited' && period === 'yearly') {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 12);

          (async () => {
            try {
              await supabase.from('gift_passes').insert({
                created_by: userId,
                code: generateGiftCode(),
                plan: 'standard',
                duration_months: 12,
                expires_at: expiresAt.toISOString(),
              });
              console.log(`[stripe-webhook] Created gift pass for user ${userId}`);
            } catch (err: any) {
              console.error('[stripe-webhook] Failed to create gift pass:', err.message);
            }
          })();
        }

        console.log(`[stripe-webhook] User ${userId} subscribed to ${plan} (${period})`);
        break;
      }

      // =========================================
      // SUBSCRIPTION UPDATED - Plan change, renewal, etc.
      // =========================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Try to get userId from metadata first, then fall back to customer ID lookup
        let userId = subscription.metadata?.supabase_user_id;
        let previousPlan = 'unknown';

        if (!userId) {
          // Look up user by Stripe customer ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_plan')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();

          if (!profile) {
            console.error(`[stripe-webhook] No user found for customer ${customerId}`);
            break;
          }

          userId = profile.id;
          previousPlan = profile.subscription_plan || 'unknown';
        } else {
          // Get previous plan for logging
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', userId)
            .single();

          previousPlan = profile?.subscription_plan || 'unknown';
        }

        // Extract subscription details
        const priceId = subscription.items.data[0]?.price.id;
        const { plan, period } = getPlanFromPriceId(priceId);

        // Map Stripe status to our status
        let status: 'active' | 'inactive' | 'past_due' = 'inactive';
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = 'active';
        } else if (subscription.status === 'past_due') {
          status = 'past_due';
        }

        // Atomic idempotency: claim the event first
        const { claimed } = await claimEvent(supabase, {
          user_id: userId,
          event_type: 'subscription_updated',
          stripe_event_id: event.id,
          previous_plan: previousPlan,
          new_plan: plan,
          metadata: { status, period },
        });

        if (!claimed) {
          console.log(`[stripe-webhook] Duplicate event ${event.id}, skipping`);
          return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }

        // FIX: current_period_end is on subscription object
        const periodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        // Update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: status,
            subscription_period: period,
            subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
            stripe_customer_id: customerId,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[stripe-webhook] Failed to update subscription:', updateError);
          throw updateError;
        }

        // CASCADE: Update partner's inherited subscription to match
        const { data: updatedPartners } = await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: status,
            subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
          })
          .eq('subscription_granted_by', userId)
          .select('id');

        if (updatedPartners?.length) {
          console.log(`[stripe-webhook] Cascaded update to ${updatedPartners.length} partner(s)`);
        }

        console.log(`[stripe-webhook] Updated subscription for user ${userId}: ${plan} (${status})`);
        break;
      }

      // =========================================
      // SUBSCRIPTION DELETED - Cancellation
      // =========================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, subscription_plan, linked_user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!profile) {
          console.error(`[stripe-webhook] No user found for deleted subscription (customer: ${customerId})`);
          break;
        }

        // Atomic idempotency: claim the event first
        const { claimed } = await claimEvent(supabase, {
          user_id: profile.id,
          event_type: 'subscription_deleted',
          stripe_event_id: event.id,
          previous_plan: profile.subscription_plan,
          new_plan: 'none',
        });

        if (!claimed) {
          console.log(`[stripe-webhook] Duplicate event ${event.id}, skipping`);
          return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }

        // Update profile to canceled + give fresh 7-day trial as win-back
        const now = new Date();
        const newTrialExpiry = new Date(now);
        newTrialExpiry.setDate(newTrialExpiry.getDate() + 7);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'none',
            subscription_status: 'canceled',
            subscription_ends_at: now.toISOString(),
            // Win-back: give churned user a fresh 7-day trial
            // Must set BOTH fields for trial to work (middleware checks free_tier_chosen_at first)
            free_tier_chosen_at: now.toISOString(),
            trial_expires_at: newTrialExpiry.toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('[stripe-webhook] Failed to cancel subscription:', updateError);
          throw updateError;
        }

        console.log(`[stripe-webhook] Granted 7-day win-back trial to churned user ${profile.id}`);

        // CASCADE: Revoke ALL inherited subscriptions from this payer
        const { data: revokedPartners } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'none',
            subscription_status: 'canceled',
            subscription_granted_by: null,
            subscription_granted_at: null,
            subscription_ends_at: new Date().toISOString(),
          })
          .eq('subscription_granted_by', profile.id)
          .select('id, email');

        if (revokedPartners?.length) {
          console.log(`[stripe-webhook] Revoked access for ${revokedPartners.length} partner(s)`);
        }

        console.log(`[stripe-webhook] Subscription canceled for user ${profile.id}`);
        break;
      }

      // =========================================
      // PAYMENT FAILED - Mark as past due
      // =========================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!profile) {
          console.error(`[stripe-webhook] No user found for failed invoice (customer: ${customerId})`);
          break;
        }

        // Atomic idempotency: claim the event first
        const { claimed } = await claimEvent(supabase, {
          user_id: profile.id,
          event_type: 'payment_failed',
          stripe_event_id: event.id,
          metadata: { invoice_id: invoice.id },
        });

        if (!claimed) {
          console.log(`[stripe-webhook] Duplicate event ${event.id}, skipping`);
          return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }

        // Update status to past_due
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('id', profile.id);

        if (updateError) {
          console.error('[stripe-webhook] Failed to update payment status:', updateError);
          throw updateError;
        }

        console.log(`[stripe-webhook] Payment failed for user ${profile.id}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[stripe-webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
