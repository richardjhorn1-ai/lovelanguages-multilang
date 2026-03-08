import {
  createServiceClient,
  setCorsHeaders,
  verifyAuth,
} from '../utils/api-middleware.js';
import { createCheckoutSessionForUser } from '../utils/stripe-checkout.js';

function parseBody(req: any): Record<string, unknown> {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  return req.body;
}

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const body = parseBody(req);
    if (typeof body.priceId !== 'string' || !body.priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    const session = await createCheckoutSessionForUser(supabase, {
      userId: auth.userId,
      priceId: body.priceId,
      requestOrigin: req.headers.origin,
      successUrl: typeof body.successUrl === 'string' ? body.successUrl : undefined,
      cancelUrl: typeof body.cancelUrl === 'string' ? body.cancelUrl : undefined,
    });

    console.log(`[create-checkout-session] Created session ${session.sessionId} for user ${auth.userId}`);
    return res.status(200).json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    console.error('[create-checkout-session] Error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
}
