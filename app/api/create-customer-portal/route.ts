import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth } from '@/utils/api-middleware';

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

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
    }

    // Check Stripe key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('[create-customer-portal] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Get user's profile with subscription info
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_granted_by, linked_user_id')
      .eq('id', auth.userId)
      .single();

    // Check if they have inherited subscription (can't manage it themselves)
    if (profile?.subscription_granted_by) {
      return NextResponse.json({
        error: 'Cannot manage inherited subscription',
        code: 'INHERITED_SUBSCRIPTION',
        message: 'Your subscription is provided by your partner. Ask them to manage it.'
      }, { status: 400, headers: corsHeaders });
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({
        error: 'No subscription found',
        code: 'NO_SUBSCRIPTION',
        message: 'Subscribe first to manage your plan.'
      }, { status: 400, headers: corsHeaders });
    }

    // Parse body for return URL
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Validate return URL against allowed origins (prevent open redirect)
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
    const requestOrigin = request.headers.get('origin') || '';

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
        if (body.returnUrl.startsWith('/')) {
          returnUrl = `${safeOrigin}${body.returnUrl}`;
        } else {
          returnUrl = body.returnUrl;
        }
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

    return NextResponse.json({
      url: session.url,
      hasPartner: !!profile.linked_user_id
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[create-customer-portal] Error:', error);
    return NextResponse.json({ error: 'Failed to open billing portal. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
