import {
  createServiceClient,
  SAFE_ERROR_MESSAGES,
  sanitizeErrorMessage,
  setCorsHeaders,
  verifyAuth,
} from '../../utils/api-middleware.js';
import {
  buildOnboardingSnapshot,
  getOnboardingProfile,
} from '../../utils/onboarding-server.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: SAFE_ERROR_MESSAGES.server_error });
  }

  try {
    const profile = await getOnboardingProfile(supabase, auth.userId);
    if (!profile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    const snapshot = await buildOnboardingSnapshot(supabase, profile);
    return res.status(200).json({ success: true, snapshot });
  } catch (error) {
    console.error('[onboarding/status] Error:', error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
}
