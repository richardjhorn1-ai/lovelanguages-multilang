/**
 * Free Tier Choice API
 * POST /api/choose-free-tier
 *
 * Allows users to choose the free tier, setting free_tier_chosen_at timestamp.
 * This allows them to enter the app with limited features.
 */

import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  SAFE_ERROR_MESSAGES,
  sanitizeErrorMessage,
} from '../utils/api-middleware.js';
import { activateFreeTier } from '../utils/free-tier.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const result = await activateFreeTier(supabase, auth.userId);
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to activate free trial',
        code: result.code || 'FREE_TIER_ACTIVATION_FAILED',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Free trial activated successfully',
      trialExpiresAt: result.trialExpiresAt,
    });

  } catch (err: any) {
    console.error('[choose-free-tier] Unexpected error:', err);
    return res.status(500).json({ error: sanitizeErrorMessage(err) });
  }
}
