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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusing chars
  let code = 'LOVE-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          console.error('[stripe-webhook] Missing user ID or subscription ID in checkout session');
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price.id;
        const { plan, period } = getPlanFromPriceId(priceId);
        // current_period_end is on the subscription item in newer Stripe API
        const periodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        // Update user's subscription
        await supabase
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_period: period,
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
          })
          .eq('id', userId);

        // Log the event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          event_type: 'checkout_completed',
          stripe_event_id: event.id,
          previous_plan: 'none',
          new_plan: plan,
          metadata: { period, subscription_id: subscriptionId },
        });

        // Create gift pass for unlimited yearly subscribers
        if (plan === 'unlimited' && period === 'yearly') {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 12); // Gift pass valid for 12 months

          await supabase.from('gift_passes').insert({
            created_by: userId,
            code: generateGiftCode(),
            plan: 'standard',
            duration_months: 12,
            expires_at: expiresAt.toISOString(),
          });

          console.log(`[stripe-webhook] Created gift pass for user ${userId}`);
        }

        console.log(`[stripe-webhook] User ${userId} subscribed to ${plan} (${period})`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          // Try to find user by customer ID
          const customerId = subscription.customer as string;
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, subscription_plan')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!profile) {
            console.error('[stripe-webhook] No user found for subscription update');
            break;
          }

          const firstItem = subscription.items.data[0];
          const priceId = firstItem?.price.id;
          const { plan, period } = getPlanFromPriceId(priceId);
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'past_due' ? 'past_due' : 'inactive';
          const periodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

          await supabase
            .from('profiles')
            .update({
              subscription_plan: plan,
              subscription_status: status,
              subscription_period: period,
              subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
            })
            .eq('id', profile.id);

          await supabase.from('subscription_events').insert({
            user_id: profile.id,
            event_type: 'subscription_updated',
            stripe_event_id: event.id,
            previous_plan: profile.subscription_plan,
            new_plan: plan,
            metadata: { status, period },
          });

          console.log(`[stripe-webhook] Updated subscription for user ${profile.id}: ${plan} (${status})`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_plan: 'none',
              subscription_status: 'canceled',
              subscription_ends_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          await supabase.from('subscription_events').insert({
            user_id: profile.id,
            event_type: 'subscription_deleted',
            stripe_event_id: event.id,
            previous_plan: profile.subscription_plan,
            new_plan: 'none',
          });

          console.log(`[stripe-webhook] Subscription canceled for user ${profile.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);

          await supabase.from('subscription_events').insert({
            user_id: profile.id,
            event_type: 'payment_failed',
            stripe_event_id: event.id,
            metadata: { invoice_id: invoice.id },
          });

          console.log(`[stripe-webhook] Payment failed for user ${profile.id}`);
        }
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
