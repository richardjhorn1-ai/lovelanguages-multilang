import type { OnboardingData, Profile, UserRole } from '../types';

export const ONBOARDING_STATUSES = [
  'not_started',
  'in_progress',
  'awaiting_plan',
  'pending_checkout',
  'completed',
  'abandoned',
  'errored',
] as const;

export type OnboardingStatus = typeof ONBOARDING_STATUSES[number];

export const ONBOARDING_COMPLETION_REASONS = [
  'free',
  'paid',
  'inherited',
  'promo',
  'beta',
  'legacy',
] as const;

export type OnboardingCompletionReason = typeof ONBOARDING_COMPLETION_REASONS[number];

export const ONBOARDING_PLAN_INTENTS = ['free', 'paid'] as const;
export type OnboardingPlanIntent = typeof ONBOARDING_PLAN_INTENTS[number];

export const ONBOARDING_FLOW_STEPS = {
  student_full: [
    'native_language',
    'role',
    'target_language',
    'names',
    'learn_hello',
    'learn_love',
    'celebration',
    'invite_partner',
    'theme_customization',
    'personalization',
    'plan',
    'start',
  ],
  tutor_full: [
    'native_language',
    'role',
    'target_language',
    'names',
    'teaching_style',
    'preview',
    'invite_partner',
    'personalization',
    'plan',
    'start',
  ],
  student_invited: [
    'names',
    'learn_hello',
    'learn_love',
    'celebration',
    'plan',
    'start',
  ],
  tutor_invited: [
    'names',
    'teaching_style',
    'preview',
    'plan',
    'start',
  ],
} as const;

export type OnboardingFlowKey = keyof typeof ONBOARDING_FLOW_STEPS;
export type OnboardingStepKey =
  (typeof ONBOARDING_FLOW_STEPS)[OnboardingFlowKey][number];

export const ROLE_SPECIFIC_STUDENT_KEYS: Array<keyof OnboardingData> = [
  'partnerName',
  'relationshipVibe',
  'couplePhotoUrl',
  'learningReason',
  'dailyTime',
  'preferredTime',
  'biggestFear',
  'priorExperience',
  'firstGoal',
];

export const ROLE_SPECIFIC_TUTOR_KEYS: Array<keyof OnboardingData> = [
  'learnerName',
  'relationshipType',
  'languageConnection',
  'languageOrigin',
  'traditionsToShare',
  'familyLanguageFrequency',
  'polishConnection',
  'polishOrigin',
  'dreamPhrase',
  'dreamHear',
  'teachingPriority',
  'teachingStyle',
  'grammarComfort',
];

export const THEME_ONBOARDING_KEYS: Array<keyof OnboardingData> = [
  'themeAccentColor',
  'themeDarkMode',
  'themeFontSize',
  'themeFontPreset',
  'themeFontWeight',
  'themeBackgroundStyle',
];

export const STEP_OWNED_KEYS: Record<OnboardingStepKey, Array<keyof OnboardingData>> = {
  role: ['role'],
  native_language: ['nativeLanguage'],
  target_language: ['targetLanguage'],
  names: ['userName', 'partnerName', 'learnerName'],
  learn_hello: [],
  learn_love: [],
  celebration: [],
  invite_partner: ['invitePartnerIntent'],
  theme_customization: [...THEME_ONBOARDING_KEYS],
  personalization: [
    'relationshipVibe',
    'dailyTime',
    'priorExperience',
    'relationshipType',
    'languageConnection',
    'languageOrigin',
    'teachingPriority',
    'grammarComfort',
  ],
  teaching_style: ['teachingStyle'],
  preview: [],
  plan: ['selectedPlan', 'selectedPriceId', 'selectedBillingPeriod'],
  start: [],
};

export interface OnboardingProfileSync {
  full_name?: string;
  partner_name?: string | null;
  role?: UserRole;
  native_language?: string;
  active_language?: string;
  smart_validation?: boolean;
  accent_color?: Profile['accent_color'];
  dark_mode?: Profile['dark_mode'];
  font_size?: Profile['font_size'];
  font_preset?: Profile['font_preset'];
  font_weight?: Profile['font_weight'];
  background_style?: Profile['background_style'];
}

export function isOnboardingStatus(value: string | null | undefined): value is OnboardingStatus {
  return Boolean(value && ONBOARDING_STATUSES.includes(value as OnboardingStatus));
}

export function isOnboardingCompletionReason(
  value: string | null | undefined
): value is OnboardingCompletionReason {
  return Boolean(
    value && ONBOARDING_COMPLETION_REASONS.includes(value as OnboardingCompletionReason)
  );
}

export function resolveOnboardingFlowKey(
  role: UserRole | null | undefined,
  isInvitedUser: boolean
): OnboardingFlowKey {
  const safeRole: UserRole = role === 'tutor' ? 'tutor' : 'student';
  if (isInvitedUser) {
    return safeRole === 'tutor' ? 'tutor_invited' : 'student_invited';
  }
  return safeRole === 'tutor' ? 'tutor_full' : 'student_full';
}

export function getFlowSteps(
  flowKey: OnboardingFlowKey,
  options?: { skipPlanStep?: boolean }
): OnboardingStepKey[] {
  const steps = [...ONBOARDING_FLOW_STEPS[flowKey]];
  return options?.skipPlanStep ? steps.filter((step) => step !== 'plan') : steps;
}

export function getInitialStepKey(flowKey: OnboardingFlowKey): OnboardingStepKey {
  return ONBOARDING_FLOW_STEPS[flowKey][0];
}

export function getStepIndex(
  flowKey: OnboardingFlowKey,
  stepKey: OnboardingStepKey,
  options?: { skipPlanStep?: boolean }
): number {
  return getFlowSteps(flowKey, options).indexOf(stepKey);
}

export function getStepNumber(
  flowKey: OnboardingFlowKey,
  stepKey: OnboardingStepKey,
  options?: { skipPlanStep?: boolean }
): number {
  const index = getStepIndex(flowKey, stepKey, options);
  return index === -1 ? 1 : index + 1;
}

export function getNextStepKey(
  flowKey: OnboardingFlowKey,
  stepKey: OnboardingStepKey,
  options?: { skipPlanStep?: boolean }
): OnboardingStepKey {
  const steps = getFlowSteps(flowKey, options);
  const index = steps.indexOf(stepKey);
  if (index === -1 || index >= steps.length - 1) {
    return steps[steps.length - 1];
  }
  return steps[index + 1];
}

export function getPreviousStepKey(
  flowKey: OnboardingFlowKey,
  stepKey: OnboardingStepKey,
  options?: { skipPlanStep?: boolean }
): OnboardingStepKey {
  const steps = getFlowSteps(flowKey, options);
  const index = steps.indexOf(stepKey);
  if (index <= 0) {
    return steps[0];
  }
  return steps[index - 1];
}

export function isPlanSelectionStep(stepKey: OnboardingStepKey): boolean {
  return stepKey === 'plan';
}

export function isStartStep(stepKey: OnboardingStepKey): boolean {
  return stepKey === 'start';
}

export function getStatusForStep(stepKey: OnboardingStepKey): OnboardingStatus {
  if (stepKey === 'plan' || stepKey === 'start') {
    return 'awaiting_plan';
  }
  return 'in_progress';
}

function clearKeys(
  data: Partial<OnboardingData>,
  keys: Array<keyof OnboardingData>
): Partial<OnboardingData> {
  const next = { ...data };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}

function pruneUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
}

export function clearRoleSpecificFields(
  data: Partial<OnboardingData>,
  role: UserRole
): Partial<OnboardingData> {
  if (role === 'student') {
    return clearKeys(data, ROLE_SPECIFIC_TUTOR_KEYS);
  }
  return clearKeys(data, ROLE_SPECIFIC_STUDENT_KEYS);
}

export function applyOnboardingPatch(
  existingData: Partial<OnboardingData>,
  patch: Partial<OnboardingData>
): Partial<OnboardingData> {
  const previousTargetLanguage = existingData.targetLanguage;
  const previousRole = existingData.role;
  let nextData: Partial<OnboardingData> = {
    ...existingData,
    ...patch,
  };

  const nextRole = patch.role ?? previousRole;
  if (nextRole === 'student' || nextRole === 'tutor') {
    nextData = clearRoleSpecificFields(nextData, nextRole);
  }

  if (
    patch.targetLanguage &&
    previousTargetLanguage &&
    patch.targetLanguage !== previousTargetLanguage
  ) {
    delete nextData.invitePartnerIntent;
  }

  if (patch.selectedPlan === 'free') {
    nextData.selectedPriceId = undefined;
  }

  if (patch.selectedPlan === 'standard' || patch.selectedPlan === 'unlimited') {
    if (!patch.selectedPriceId && existingData.selectedPlan === 'free') {
      nextData.selectedPriceId = undefined;
    }
  }

  return pruneUndefined(nextData as Record<string, unknown>) as Partial<OnboardingData>;
}

export function buildProfileSyncFromOnboardingData(
  data: Partial<OnboardingData>,
  roleOverride?: UserRole | null
): OnboardingProfileSync {
  const resolvedRole = roleOverride ?? data.role ?? undefined;
  const partnerName =
    resolvedRole === 'tutor'
      ? (data.learnerName ?? null)
      : (data.partnerName ?? null);

  const payload: OnboardingProfileSync = {
    full_name: data.userName || undefined,
    partner_name: partnerName,
    role: resolvedRole,
    native_language: data.nativeLanguage || undefined,
    active_language: data.targetLanguage || undefined,
    smart_validation: data.smartValidation,
    accent_color: data.themeAccentColor,
    dark_mode: data.themeDarkMode,
    font_size: data.themeFontSize,
    font_preset: data.themeFontPreset,
    font_weight: data.themeFontWeight,
    background_style: data.themeBackgroundStyle,
  };

  return pruneUndefined(payload as Record<string, unknown>) as OnboardingProfileSync;
}

export function getOnboardingThemePatch(profile: Pick<
  Profile,
  'accent_color' | 'dark_mode' | 'font_size' | 'font_preset' | 'font_weight' | 'background_style'
>): Partial<OnboardingData> {
  return pruneUndefined({
    themeAccentColor: profile.accent_color,
    themeDarkMode: profile.dark_mode,
    themeFontSize: profile.font_size,
    themeFontPreset: profile.font_preset,
    themeFontWeight: profile.font_weight,
    themeBackgroundStyle: profile.background_style,
  });
}

export function getCompletionReasonFromProfileAccess(profile: Pick<
  Profile,
  'subscription_status' | 'subscription_granted_by' | 'promo_expires_at'
>): OnboardingCompletionReason | null {
  if (profile.subscription_granted_by) {
    return 'inherited';
  }
  if (profile.subscription_status === 'active') {
    return 'paid';
  }
  if (profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date()) {
    return 'promo';
  }
  return null;
}
