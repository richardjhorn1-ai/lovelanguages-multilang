import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

/**
 * Validates that a URL is safe for redirect.
 * Accepts: relative paths (/profile) or URLs matching allowed origins.
 */
function isValidReturnUrl(url: string, allowedOrigins: string[]): boolean {
  // Allow relative paths (but not protocol-relative //evil.com)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // Check against allowed origins
  try {
    const parsed = new URL(url);
    return allowedOrigins.some(origin => origin === parsed.origin);
  } catch {
    return false;
  }
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
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check Stripe key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('[create-customer-portal] Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Get user's profile with subscription info
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_granted_by, linked_user_id')
      .eq('id', auth.userId)
      .single();

    // Check if they have inherited subscription (can't manage it themselves)
    if (profile?.subscription_granted_by) {
      return res.status(400).json({
        error: 'Cannot manage inherited subscription',
        code: 'INHERITED_SUBSCRIPTION',
        message: 'Your subscription is provided by your partner. Ask them to manage it.'
      });
    }

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({
        error: 'No subscription found',
        code: 'NO_SUBSCRIPTION',
        message: 'Subscribe first to manage your plan.'
      });
    }

    // Parse body for return URL
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    // Validate return URL against allowed origins (prevent open redirect)
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
    const requestOrigin = req.headers.origin || '';

    // Determine safe origin - MUST be in allowed list (reject attacker origins)
    let safeOrigin: string;
    if (allowedOrigins.includes('*')) {
      // Development mode - trust request origin or use localhost
      safeOrigin = requestOrigin || 'http://localhost:5173';
    } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      // Request origin is explicitly allowed
      safeOrigin = requestOrigin;
    } else {
      // Fall back to first allowed origin
      safeOrigin = allowedOrigins[0] || 'http://localhost:5173';
    }

    const defaultReturnUrl = `${safeOrigin}/profile`;

    let returnUrl = defaultReturnUrl;
    if (body?.returnUrl && typeof body.returnUrl === 'string') {
      const isValidUrl = allowedOrigins.includes('*') || isValidReturnUrl(body.returnUrl, allowedOrigins);
      if (isValidUrl) {
        returnUrl = body.returnUrl.startsWith('/')
          ? `${safeOrigin}${body.returnUrl}`
          : body.returnUrl;
      } else {
        console.warn(`[create-customer-portal] Rejected invalid returnUrl: ${body.returnUrl}`);
      }
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log(`[create-customer-portal] Created portal session for user ${auth.userId}`);

    return res.status(200).json({
      url: session.url,
      hasPartner: !!profile.linked_user_id
    });

  } catch (error: any) {
    console.error('[create-customer-portal] Error:', error);
    return res.status(500).json({ error: 'Failed to open billing portal. Please try again.' });
  }
}
