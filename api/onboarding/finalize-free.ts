import {
  createServiceClient,
  SAFE_ERROR_MESSAGES,
  sanitizeErrorMessage,
  setCorsHeaders,
  verifyAuth,
} from '../../utils/api-middleware.js';
import { buildProfileSyncFromOnboardingData, getCompletionReasonFromProfileAccess } from '../../utils/onboarding-state.js';
import { activateFreeTier } from '../../utils/free-tier.js';
import {
  buildOnboardingSnapshot,
  getOnboardingProfile,
} from '../../utils/onboarding-server.js';

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
    const profile = await getOnboardingProfile(supabase, auth.userId);
    if (!profile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    const onboardingData = profile.onboarding_data || {};
    const accessCompletionReason = getCompletionReasonFromProfileAccess(profile);
    const now = new Date().toISOString();

    let completionReason = accessCompletionReason;

    if (!completionReason) {
      const selectedPlan = onboardingData.selectedPlan;
      if (selectedPlan !== 'free' && profile.onboarding_plan_intent !== 'free') {
        return res.status(409).json({
          error: 'Payment confirmation is still pending. Please try again in a moment.',
          code: 'PAYMENT_PENDING_CONFIRMATION',
        });
      }

      const activationResult = await activateFreeTier(supabase, auth.userId);
      if (!activationResult.success) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            onboarding_status: 'awaiting_plan',
            onboarding_error_code: activationResult.code || 'FREE_TIER_ACTIVATION_FAILED',
            onboarding_error_context: {
              message: activationResult.error,
            },
            onboarding_last_step_at: now,
          })
          .eq('id', auth.userId);

        if (updateError) {
          console.error('[onboarding/finalize-free] Failed to persist activation error:', updateError);
        }

        return res.status(400).json({
          error: activationResult.error || 'Failed to activate free trial',
          code: activationResult.code || 'FREE_TIER_ACTIVATION_FAILED',
        });
      }

      completionReason = 'free';
    }

    const mirroredProfileFields = buildProfileSyncFromOnboardingData(
      onboardingData,
      (onboardingData.role || profile.role) ?? undefined
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...mirroredProfileFields,
        onboarding_status: 'completed',
        onboarding_completion_reason: completionReason,
        onboarding_step_key: 'start',
        onboarding_last_step_at: now,
        onboarding_completed_at: profile.onboarding_completed_at || now,
        onboarding_error_code: null,
        onboarding_error_context: null,
        onboarding_progress: null,
      })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[onboarding/finalize-free] Failed to finalize onboarding:', updateError);
      return res.status(500).json({ error: 'Failed to finalize onboarding' });
    }

    const refreshedProfile = await getOnboardingProfile(supabase, auth.userId);
    if (!refreshedProfile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    const snapshot = await buildOnboardingSnapshot(supabase, refreshedProfile);
    return res.status(200).json({ success: true, snapshot });
  } catch (error) {
    console.error('[onboarding/finalize-free] Error:', error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
}
