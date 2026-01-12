import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from '../utils/api-middleware.js';

// Extended auth type for checkout (needs email for Stripe customer)
interface CheckoutAuth {
  userId: string;
  email: string;
}

// Verify user authentication with email for Stripe
async function verifyAuthWithEmail(req: any): Promise<CheckoutAuth | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[create-checkout-session] Missing Supabase config');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('[create-checkout-session] Auth failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id, email: user.email || '' };
}

export default async function handler(req: any, res: any) {
  // CORS
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication with email (needed for Stripe customer creation)
    const auth = await verifyAuthWithEmail(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check Stripe key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('[create-checkout-session] Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Parse body
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    // Valid price IDs from environment
    const validPriceIds = [
      process.env.STRIPE_PRICE_STANDARD_MONTHLY,
      process.env.STRIPE_PRICE_STANDARD_YEARLY,
      process.env.STRIPE_PRICE_UNLIMITED_MONTHLY,
      process.env.STRIPE_PRICE_UNLIMITED_YEARLY,
    ].filter(Boolean);

    if (!validPriceIds.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Get or create Stripe customer
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', auth.userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: auth.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: auth.userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', auth.userId);
    }

    // Determine success/cancel URLs with open redirect protection
    // Only allow redirects to our own allowed origins
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').filter(o => o !== '*');
    const requestOrigin = req.headers.origin || '';

    // Use request origin if it's in allowed list, otherwise use first allowed origin
    const safeOrigin = allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : (allowedOrigins[0] || 'http://localhost:5173');

    // Validate custom URLs - must be same origin or relative paths
    // App uses HashRouter, so relative paths need /#/ prefix
    function validateRedirectUrl(url: string | undefined, defaultPath: string): string {
      // Helper to add hash prefix for HashRouter
      const addHashPrefix = (path: string) => {
        if (path.startsWith('/#/')) return path;
        if (path.startsWith('/')) return `/#${path}`;
        return path;
      };

      if (!url) {
        return `${safeOrigin}${addHashPrefix(defaultPath)}`;
      }

      // If it's a relative path (starts with /), use safe origin with hash
      if (url.startsWith('/')) {
        return `${safeOrigin}${addHashPrefix(url)}`;
      }

      // If it's an absolute URL, validate the origin
      try {
        const parsed = new URL(url);
        if (allowedOrigins.includes(parsed.origin)) {
          return url;
        }
      } catch {
        // Invalid URL, use default
      }

      // Fallback to safe default
      return `${safeOrigin}${addHashPrefix(defaultPath)}`;
    }

    const finalSuccessUrl = validateRedirectUrl(successUrl, '/profile?subscription=success');
    const finalCancelUrl = validateRedirectUrl(cancelUrl, '/pricing?subscription=canceled');

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        supabase_user_id: auth.userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: auth.userId,
        },
      },
    });

    console.log(`[create-checkout-session] Created session ${session.id} for user ${auth.userId}`);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('[create-checkout-session] Error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
}
