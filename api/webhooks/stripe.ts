import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Disable body parsing - we need raw body for signature verification
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

// Map Stripe price IDs to plan names
function getPlanFromPriceId(priceId: string): { plan: string; period: string } {
  const priceMap: Record<string, { plan: string; period: string }> = {
    [process.env.STRIPE_PRICE_STANDARD_MONTHLY || '']: { plan: 'standard', period: 'monthly' },
    [process.env.STRIPE_PRICE_STANDARD_YEARLY || '']: { plan: 'standard', period: 'yearly' },
    [process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || '']: { plan: 'unlimited', period: 'monthly' },
    [process.env.STRIPE_PRICE_UNLIMITED_YEARLY || '']: { plan: 'unlimited', period: 'yearly' },
  };
  return priceMap[priceId] || { plan: 'unknown', period: 'unknown' };
}

// Generate a gift pass code
function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LOVE-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Non-blocking event logger - won't crash webhook if it fails
function logSubscriptionEvent(
  supabase: any,
  data: {
    user_id: string;
    event_type: string;
    stripe_event_id: string;
    previous_plan?: string;
    new_plan?: string;
    metadata?: any;
  }
) {
  (async () => {
    try {
      await supabase.from('subscription_events').insert(data);
      console.log(`[stripe-webhook] Logged event: ${data.event_type}`);
    } catch (err: any) {
      console.error('[stripe-webhook] Failed to log event:', err.message);
    }
  })();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[stripe-webhook] Missing configuration');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const stripe = new Stripe(stripeSecretKey);

  // Get raw body for signature verification
  let rawBody: Buffer;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('[stripe-webhook] Failed to read body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  // Verify webhook signature
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

  // Initialize Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[stripe-webhook] Missing Supabase config');
    return res.status(500).json({ error: 'Database not configured' });
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

        // Non-blocking: Log the event
        logSubscriptionEvent(supabase, {
          user_id: userId,
          event_type: 'checkout_completed',
          stripe_event_id: event.id,
          previous_plan: 'none',
          new_plan: plan,
          metadata: { period, subscription_id: subscriptionId },
        });

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
            .single();

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

        // Non-blocking: Log the event
        logSubscriptionEvent(supabase, {
          user_id: userId,
          event_type: 'subscription_updated',
          stripe_event_id: event.id,
          previous_plan: previousPlan,
          new_plan: plan,
          metadata: { status, period },
        });

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
          .select('id, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) {
          console.error(`[stripe-webhook] No user found for deleted subscription (customer: ${customerId})`);
          break;
        }

        // Update profile to canceled
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'none',
            subscription_status: 'canceled',
            subscription_ends_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('[stripe-webhook] Failed to cancel subscription:', updateError);
          throw updateError;
        }

        // Non-blocking: Log the event
        logSubscriptionEvent(supabase, {
          user_id: profile.id,
          event_type: 'subscription_deleted',
          stripe_event_id: event.id,
          previous_plan: profile.subscription_plan,
          new_plan: 'none',
        });

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
          .single();

        if (!profile) {
          console.error(`[stripe-webhook] No user found for failed invoice (customer: ${customerId})`);
          break;
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

        // Non-blocking: Log the event
        logSubscriptionEvent(supabase, {
          user_id: profile.id,
          event_type: 'payment_failed',
          stripe_event_id: event.id,
          metadata: { invoice_id: invoice.id },
        });

        console.log(`[stripe-webhook] Payment failed for user ${profile.id}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('[stripe-webhook] Error processing event:', error);
    return res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
}
