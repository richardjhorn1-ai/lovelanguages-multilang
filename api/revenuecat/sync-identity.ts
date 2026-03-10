import {
  createServiceClient,
  SAFE_ERROR_MESSAGES,
  setCorsHeaders,
  verifyAuth,
} from '../../utils/api-middleware.js';

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
      return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
    }

    const body = parseBody(req);
    const revenuecatCustomerId = typeof body.revenuecatCustomerId === 'string'
      ? body.revenuecatCustomerId.trim()
      : '';

    if (!revenuecatCustomerId) {
      return res.status(400).json({ error: 'revenuecatCustomerId required' });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: SAFE_ERROR_MESSAGES.server_error });
    }

    const { error } = await supabase
      .from('profile_private')
      .upsert(
        {
          user_id: auth.userId,
          revenuecat_customer_id: revenuecatCustomerId,
          subscription_source: 'app_store',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[revenuecat/sync-identity] Failed to persist customer ID:', error);
      return res.status(500).json({ error: 'Failed to save RevenueCat identity' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[revenuecat/sync-identity] Error:', error);
    return res.status(500).json({ error: SAFE_ERROR_MESSAGES.server_error });
  }
}
