import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

function getStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('Payment system not configured');
  }
  return new Stripe(stripeSecretKey);
}

function getValidPriceIds(): string[] {
  return [
    process.env.STRIPE_PRICE_STANDARD_WEEKLY,
    process.env.STRIPE_PRICE_STANDARD_MONTHLY,
    process.env.STRIPE_PRICE_STANDARD_YEARLY,
    process.env.STRIPE_PRICE_UNLIMITED_WEEKLY,
    process.env.STRIPE_PRICE_UNLIMITED_MONTHLY,
    process.env.STRIPE_PRICE_UNLIMITED_YEARLY,
  ].filter(Boolean) as string[];
}

function resolveAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');
}

function validateRedirectUrl(
  url: string | undefined,
  defaultPath: string,
  safeOrigin: string,
  allowedOrigins: string[]
): string {
  if (!url) {
    return `${safeOrigin}${defaultPath}`;
  }

  if (url.startsWith('/')) {
    return `${safeOrigin}${url}`;
  }

  try {
    const parsed = new URL(url);
    if (allowedOrigins.includes(parsed.origin)) {
      return url;
    }
  } catch {
    // Ignore invalid URL and fall back to default below.
  }

  return `${safeOrigin}${defaultPath}`;
}

async function getOrCreateStripeCustomerId(
  supabase: SupabaseClient,
  stripe: Stripe,
  userId: string,
  email: string,
  fullName?: string | null
): Promise<string> {
  const { data: privateState } = await supabase
    .from('profile_private')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (privateState?.stripe_customer_id) {
    return privateState.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    name: fullName || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  await supabase
    .from('profile_private')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  return customer.id;
}

export interface CheckoutSessionInput {
  userId: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  requestOrigin?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string | null;
}

export async function createCheckoutSessionForUser(
  supabase: SupabaseClient,
  input: CheckoutSessionInput
): Promise<CheckoutSessionResult> {
  const stripe = getStripeClient();
  const validPriceIds = getValidPriceIds();

  if (!validPriceIds.includes(input.priceId)) {
    throw new Error('Invalid price ID');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', input.userId)
    .single();

  if (profileError || !profile?.email) {
    throw new Error('Unable to resolve billing profile');
  }

  const allowedOrigins = resolveAllowedOrigins();
  const safeOrigin = allowedOrigins.includes(input.requestOrigin || '')
    ? (input.requestOrigin as string)
    : (allowedOrigins[0] || 'http://localhost:5173');

  const finalSuccessUrl = validateRedirectUrl(
    input.successUrl,
    '/?checkout=success',
    safeOrigin,
    allowedOrigins
  );
  const finalCancelUrl = validateRedirectUrl(
    input.cancelUrl,
    '/?checkout=canceled',
    safeOrigin,
    allowedOrigins
  );

  const customerId = await getOrCreateStripeCustomerId(
    supabase,
    stripe,
    input.userId,
    profile.email,
    profile.full_name
  );

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: input.priceId,
        quantity: 1,
      },
    ],
    success_url: finalSuccessUrl,
    cancel_url: finalCancelUrl,
    metadata: {
      supabase_user_id: input.userId,
      ...(input.metadata || {}),
    },
    subscription_data: {
      metadata: {
        supabase_user_id: input.userId,
        ...(input.metadata || {}),
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}
