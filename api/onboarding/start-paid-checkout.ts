import {
  createServiceClient,
  SAFE_ERROR_MESSAGES,
  sanitizeErrorMessage,
  setCorsHeaders,
  verifyAuth,
} from '../../utils/api-middleware.js';
import { buildProfileSyncFromOnboardingData, getCompletionReasonFromProfileAccess } from '../../utils/onboarding-state.js';
import { createCheckoutSessionForUser } from '../../utils/stripe-checkout.js';
import {
  buildOnboardingSnapshot,
  getOnboardingProfile,
} from '../../utils/onboarding-server.js';

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

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: SAFE_ERROR_MESSAGES.unauthorized });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: SAFE_ERROR_MESSAGES.server_error });
  }

  try {
    const body = parseBody(req);
    const profile = await getOnboardingProfile(supabase, auth.userId);
    if (!profile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    const accessCompletionReason = getCompletionReasonFromProfileAccess(profile);
    if (profile.onboarding_status !== 'completed' && accessCompletionReason === 'paid') {
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({
          onboarding_status: 'completed',
          onboarding_completion_reason: 'paid',
          onboarding_step_key: 'start',
          onboarding_completed_at: profile.onboarding_completed_at || now,
          onboarding_last_step_at: now,
          onboarding_error_code: null,
          onboarding_error_context: null,
          onboarding_progress: null,
        })
        .eq('id', auth.userId);

      const refreshedProfile = await getOnboardingProfile(supabase, auth.userId);
      if (!refreshedProfile) {
        return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
      }

      const snapshot = await buildOnboardingSnapshot(supabase, refreshedProfile);
      return res.status(200).json({ success: true, snapshot, url: null });
    }

    const onboardingData = profile.onboarding_data || {};
    const priceId =
      typeof body.priceId === 'string' && body.priceId
        ? body.priceId
        : onboardingData.selectedPriceId;

    if (!priceId) {
      return res.status(400).json({ error: 'Missing price ID for checkout' });
    }

    const session = await createCheckoutSessionForUser(supabase, {
      userId: auth.userId,
      priceId,
      requestOrigin: req.headers.origin,
      successUrl:
        typeof body.successUrl === 'string' ? body.successUrl : '/?checkout=success&onboarding=return',
      cancelUrl:
        typeof body.cancelUrl === 'string' ? body.cancelUrl : '/?checkout=canceled&onboarding=return',
      metadata: {
        onboarding_flow_key: profile.onboarding_flow_key || 'unknown',
        onboarding_step_key: profile.onboarding_step_key || 'start',
      },
    });

    const now = new Date().toISOString();
    const mirroredProfileFields = buildProfileSyncFromOnboardingData(
      onboardingData,
      (onboardingData.role || profile.role) ?? undefined
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...mirroredProfileFields,
        onboarding_status: 'pending_checkout',
        onboarding_plan_intent: 'paid',
        onboarding_step_key: 'start',
        onboarding_checkout_session_id: session.sessionId,
        onboarding_checkout_started_at: now,
        onboarding_last_step_at: now,
        onboarding_error_code: null,
        onboarding_error_context: null,
      })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[onboarding/start-paid-checkout] Failed to persist checkout state:', updateError);
      return res.status(500).json({ error: 'Failed to start checkout' });
    }

    const refreshedProfile = await getOnboardingProfile(supabase, auth.userId);
    if (!refreshedProfile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    const snapshot = await buildOnboardingSnapshot(supabase, refreshedProfile);
    return res.status(200).json({ success: true, snapshot, url: session.url });
  } catch (error) {
    console.error('[onboarding/start-paid-checkout] Error:', error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
}
