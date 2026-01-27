/**
 * Promo Status API
 * GET /api/promo-status
 *
 * Returns the user's current promotional access status.
 */

import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  SAFE_ERROR_MESSAGES,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Fetch user's promo status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('promo_expires_at')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error('[promo-status] Failed to fetch profile:', profileError.message);
      return res.status(500).json({ error: 'Failed to fetch status' });
    }

    // Check if user has active promo
    const now = new Date();
    const expiresAt = profile.promo_expires_at ? new Date(profile.promo_expires_at) : null;
    const hasPromo = expiresAt !== null && expiresAt > now;

    // Calculate days remaining
    let daysRemaining = 0;
    if (hasPromo && expiresAt) {
      const diffMs = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return res.status(200).json({
      hasPromo,
      expiresAt: hasPromo ? expiresAt!.toISOString() : null,
      daysRemaining: hasPromo ? daysRemaining : 0,
    });

  } catch (err: any) {
    console.error('[promo-status] Unexpected error:', err);
    return res.status(500).json({ error: 'An error occurred' });
  }
}
