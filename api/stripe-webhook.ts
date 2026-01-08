import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Stripe webhook handler
// Handles: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed

export const config = {
  api: {
    bodyParser: false, // Required for webhook signature verification
  },
};

// Read raw body for signature verification
async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Determine plan details from price ID
function getPlanDetails(priceId: string): { plan: string; period: string } {
  const standardMonthly = process.env.STRIPE_PRICE_STANDARD_MONTHLY;
  const standardYearly = process.env.STRIPE_PRICE_STANDARD_YEARLY;
  const unlimitedMonthly = process.env.STRIPE_PRICE_UNLIMITED_MONTHLY;
  const unlimitedYearly = process.env.STRIPE_PRICE_UNLIMITED_YEARLY;

  if (priceId === standardMonthly) return { plan: 'standard', period: 'monthly' };
  if (priceId === standardYearly) return { plan: 'standard', period: 'yearly' };
  if (priceId === unlimitedMonthly) return { plan: 'unlimited', period: 'monthly' };
  if (priceId === unlimitedYearly) return { plan: 'unlimited', period: 'yearly' };

  // Default fallback
  return { plan: 'standard', period: 'monthly' };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[stripe-webhook] Missing Stripe configuration');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[stripe-webhook] Missing Supabase configuration');
    return res.status(500).json({ error: 'Database not configured' });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('[stripe-webhook] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`[stripe-webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.error('[stripe-webhook] No supabase_user_id in session metadata');
          break;
        }

        // Get subscription details
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price?.id;
          const { plan, period } = getPlanDetails(priceId || '');
          const periodEnd = (sub as any).current_period_end;

          // Update profile with subscription info
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_plan: plan,
              subscription_status: 'active',
              subscription_period: period,
              subscription_ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId);

          if (error) {
            console.error('[stripe-webhook] Failed to update profile:', error);
          } else {
            console.log(`[stripe-webhook] Activated ${plan} ${period} subscription for user ${userId}`);
          }
        }
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
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!profile) {
            console.error('[stripe-webhook] Could not find user for subscription update');
            break;
          }

          const priceId = subscription.items.data[0]?.price?.id;
          const { plan, period } = getPlanDetails(priceId || '');

          // Map Stripe status to our status
          let status: 'active' | 'inactive' | 'past_due' | 'canceled' = 'inactive';
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            status = 'active';
          } else if (subscription.status === 'past_due') {
            status = 'past_due';
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            status = 'canceled';
          }

          const periodEnd1 = (subscription as any).current_period_end;
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_plan: plan,
              subscription_status: status,
              subscription_period: period,
              subscription_ends_at: periodEnd1 ? new Date(periodEnd1 * 1000).toISOString() : null,
            })
            .eq('id', profile.id);

          if (error) {
            console.error('[stripe-webhook] Failed to update subscription:', error);
          } else {
            console.log(`[stripe-webhook] Updated subscription for user ${profile.id}: ${status}`);
          }
        } else {
          // User ID in metadata
          const priceId = subscription.items.data[0]?.price?.id;
          const { plan, period } = getPlanDetails(priceId || '');

          let status: 'active' | 'inactive' | 'past_due' | 'canceled' = 'inactive';
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            status = 'active';
          } else if (subscription.status === 'past_due') {
            status = 'past_due';
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            status = 'canceled';
          }

          const periodEnd2 = (subscription as any).current_period_end;
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_plan: plan,
              subscription_status: status,
              subscription_period: period,
              subscription_ends_at: periodEnd2 ? new Date(periodEnd2 * 1000).toISOString() : null,
            })
            .eq('id', userId);

          if (error) {
            console.error('[stripe-webhook] Failed to update subscription:', error);
          } else {
            console.log(`[stripe-webhook] Updated subscription for user ${userId}: ${status}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
            })
            .eq('id', profile.id);

          if (error) {
            console.error('[stripe-webhook] Failed to cancel subscription:', error);
          } else {
            console.log(`[stripe-webhook] Canceled subscription for user ${profile.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
            })
            .eq('id', profile.id);

          if (error) {
            console.error('[stripe-webhook] Failed to update payment status:', error);
          } else {
            console.log(`[stripe-webhook] Marked subscription past_due for user ${profile.id}`);
          }
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
