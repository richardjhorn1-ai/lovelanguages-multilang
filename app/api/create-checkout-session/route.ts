import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, handleCorsPreflightResponse } from '@/utils/api-middleware';

// Extended auth type for checkout (needs email for Stripe customer)
interface CheckoutAuth {
  userId: string;
  email: string;
}

// Verify user authentication with email for Stripe
async function verifyAuthWithEmail(request: Request): Promise<CheckoutAuth | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
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

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Verify authentication with email (needed for Stripe customer creation)
    const auth = await verifyAuthWithEmail(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
    }

    // Check Stripe key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('[create-checkout-session] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
    }

    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400, headers: corsHeaders });
    }

    // Valid price IDs from environment
    const validPriceIds = [
      process.env.STRIPE_PRICE_STANDARD_WEEKLY,
      process.env.STRIPE_PRICE_STANDARD_MONTHLY,
      process.env.STRIPE_PRICE_STANDARD_YEARLY,
      process.env.STRIPE_PRICE_UNLIMITED_WEEKLY,
      process.env.STRIPE_PRICE_UNLIMITED_MONTHLY,
      process.env.STRIPE_PRICE_UNLIMITED_YEARLY,
    ].filter(Boolean);

    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400, headers: corsHeaders });
    }

    // Get or create Stripe customer
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
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
    const requestOrigin = request.headers.get('origin') || '';

    // Use request origin if it's in allowed list, otherwise use first allowed origin
    const safeOrigin = allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : (allowedOrigins[0] || 'http://localhost:5173');

    // Validate custom URLs - must be same origin or relative paths
    function validateRedirectUrl(url: string | undefined, defaultPath: string): string {
      if (!url) {
        return `${safeOrigin}${defaultPath}`;
      }

      // If it's a relative path (starts with /), use safe origin
      if (url.startsWith('/')) {
        return `${safeOrigin}${url}`;
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
      return `${safeOrigin}${defaultPath}`;
    }

    const finalSuccessUrl = validateRedirectUrl(successUrl, '/profile?subscription=success');
    const finalCancelUrl = validateRedirectUrl(cancelUrl, '/?subscription=canceled');

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

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[create-checkout-session] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
