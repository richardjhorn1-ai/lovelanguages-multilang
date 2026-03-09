import {
  createServiceClient,
  SAFE_ERROR_MESSAGES,
  sanitizeErrorMessage,
  setCorsHeaders,
  verifyAuth,
} from '../../utils/api-middleware.js';
import {
  applyOnboardingPatch,
  buildProfileSyncFromOnboardingData,
  getFlowSteps,
  getNextStepKey,
  getPreviousStepKey,
  getStepNumber,
  ONBOARDING_FLOW_STEPS,
  resolveOnboardingFlowKey,
} from '../../utils/onboarding-state.js';
import {
  buildOnboardingSnapshot,
  expireUnusedInviteTokensForLanguage,
  getOnboardingProfile,
  getPlanIntentFromData,
  getStatusForPersistedStep,
} from '../../utils/onboarding-server.js';
import type { OnboardingData, OnboardingFlowKey, OnboardingStepKey, UserRole } from '../../types';

type SaveDirection = 'next' | 'back' | 'stay';
type LanguageStateProfile = {
  onboarding_completed_at?: string | null;
  languages?: string[] | null;
};

function parseBody(req: any): Record<string, unknown> {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  return req.body;
}

function isFlowKey(value: unknown): value is OnboardingFlowKey {
  return typeof value === 'string' && value in ONBOARDING_FLOW_STEPS;
}

function isDirection(value: unknown): value is SaveDirection {
  return value === 'next' || value === 'back' || value === 'stay';
}

export function uniqueLanguages(
  existingLanguages: string[] | undefined,
  targetLanguage: string | undefined,
  isOnboardingFirstLanguage: boolean
): string[] | undefined {
  if (!targetLanguage) {
    return existingLanguages;
  }

  if (isOnboardingFirstLanguage) {
    return [targetLanguage];
  }

  const next = new Set((existingLanguages || []).filter(Boolean));
  next.add(targetLanguage);
  return Array.from(next);
}

export function isInitialOnboardingLanguageSelection(profile: LanguageStateProfile): boolean {
  const existingLanguages = (profile.languages || []).filter(Boolean);

  return !profile.onboarding_completed_at && (
    existingLanguages.length === 0 ||
    (existingLanguages.length === 1 && existingLanguages[0] === 'pl')
  );
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
    const answers =
      body.answers && typeof body.answers === 'object'
        ? (body.answers as Partial<OnboardingData>)
        : {};
    const stepKey = body.stepKey;
    const flowKey = body.flowKey;
    const direction = body.direction ?? 'stay';

    if (!isFlowKey(flowKey)) {
      return res.status(400).json({ error: 'Invalid onboarding flow' });
    }

    if (!isDirection(direction)) {
      return res.status(400).json({ error: 'Invalid onboarding direction' });
    }

    if (typeof stepKey !== 'string' || !getFlowSteps(flowKey).includes(stepKey as OnboardingStepKey)) {
      return res.status(400).json({ error: 'Invalid onboarding step' });
    }

    const profile = await getOnboardingProfile(supabase, auth.userId);
    if (!profile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    if (profile.onboarding_status === 'completed') {
      const snapshot = await buildOnboardingSnapshot(supabase, profile);
      return res.status(200).json({ success: true, snapshot });
    }

    const now = new Date().toISOString();
    const existingData = (profile.onboarding_data || {}) as Partial<OnboardingData>;
    const nextData = applyOnboardingPatch(existingData, answers);
    const resolvedRole = (nextData.role || profile.role || 'student') as UserRole;
    const isInvitedFlow =
      profile.onboarding_flow_key?.endsWith('_invited') ||
      Boolean(profile.linked_user_id);
    const resolvedFlowKey = resolveOnboardingFlowKey(resolvedRole, Boolean(isInvitedFlow));

    if (!getFlowSteps(resolvedFlowKey).includes(stepKey as OnboardingStepKey)) {
      return res.status(400).json({ error: 'Step does not belong to resolved onboarding flow' });
    }

    let persistedStepKey = stepKey as OnboardingStepKey;
    if (direction === 'next') {
      persistedStepKey = getNextStepKey(resolvedFlowKey, persistedStepKey);
    } else if (direction === 'back') {
      persistedStepKey = getPreviousStepKey(resolvedFlowKey, persistedStepKey);
    }

    if (
      existingData.targetLanguage &&
      nextData.targetLanguage &&
      existingData.targetLanguage !== nextData.targetLanguage
    ) {
      await expireUnusedInviteTokensForLanguage(
        supabase,
        auth.userId,
        existingData.targetLanguage
      );
    }

    const nextStatus = getStatusForPersistedStep(
      persistedStepKey,
      nextData,
      profile.onboarding_status
    );
    const nextPlanIntent = getPlanIntentFromData(nextData);
    const nextLanguages = uniqueLanguages(
      profile.languages,
      nextData.targetLanguage,
      isInitialOnboardingLanguageSelection(profile)
    );
    const mirroredProfileFields = buildProfileSyncFromOnboardingData(nextData, resolvedRole);

    const updatePayload: Record<string, unknown> = {
      onboarding_data: nextData,
      onboarding_flow_key: resolvedFlowKey,
      onboarding_step_key: persistedStepKey,
      onboarding_started_at: profile.onboarding_started_at || now,
      onboarding_last_step_at: now,
      onboarding_status: nextStatus,
      onboarding_plan_intent: nextPlanIntent,
      onboarding_error_code: null,
      onboarding_error_context: null,
      onboarding_version: 2,
      onboarding_progress: {
        role: resolvedRole,
        step: getStepNumber(resolvedFlowKey, persistedStepKey),
        data: nextData,
      },
      ...mirroredProfileFields,
    };

    if (nextLanguages) {
      updatePayload.languages = nextLanguages;
    }

    if (!profile.role_confirmed_at && resolvedRole) {
      updatePayload.role_confirmed_at = now;
    }

    if (nextPlanIntent !== 'paid') {
      updatePayload.onboarding_checkout_session_id = null;
      updatePayload.onboarding_checkout_started_at = null;
    } else if (nextStatus === 'pending_checkout' && !profile.onboarding_checkout_started_at) {
      updatePayload.onboarding_checkout_started_at = now;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', auth.userId);

    if (updateError) {
      console.error('[onboarding/save-step] Failed to update profile:', updateError);
      return res.status(500).json({ error: 'Failed to save onboarding step' });
    }

    const refreshedProfile = await getOnboardingProfile(supabase, auth.userId);
    if (!refreshedProfile) {
      return res.status(404).json({ error: SAFE_ERROR_MESSAGES.not_found });
    }

    const snapshot = await buildOnboardingSnapshot(supabase, refreshedProfile);
    return res.status(200).json({ success: true, snapshot });
  } catch (error) {
    console.error('[onboarding/save-step] Error:', error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
}
