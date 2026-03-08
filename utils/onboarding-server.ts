import type { SupabaseClient } from '@supabase/supabase-js';
import type { OnboardingData, OnboardingStatus, Profile } from '../types';

export const ONBOARDING_PROFILE_SELECT_FIELDS = [
  'id',
  'email',
  'role',
  'linked_user_id',
  'full_name',
  'partner_name',
  'role_confirmed_at',
  'onboarding_status',
  'onboarding_completion_reason',
  'onboarding_flow_key',
  'onboarding_step_key',
  'onboarding_started_at',
  'onboarding_last_step_at',
  'onboarding_plan_intent',
  'onboarding_checkout_session_id',
  'onboarding_checkout_started_at',
  'onboarding_error_code',
  'onboarding_error_context',
  'onboarding_version',
  'onboarding_completed_at',
  'onboarding_progress',
  'onboarding_data',
  'accent_color',
  'dark_mode',
  'font_size',
  'font_preset',
  'font_weight',
  'background_style',
  'smart_validation',
  'active_language',
  'native_language',
  'languages',
  'subscription_plan',
  'subscription_status',
  'subscription_period',
  'subscription_ends_at',
  'subscription_source',
  'subscription_granted_by',
  'subscription_granted_at',
  'free_tier_chosen_at',
  'trial_expires_at',
  'promo_expires_at',
  'created_at',
].join(',');

export interface OnboardingProfileRecord extends Profile {
  onboarding_progress?: {
    role?: string;
    step?: number;
    data?: Partial<OnboardingData>;
  } | null;
}

export interface InviteSummary {
  inviteLink: string;
  expiresAt: string;
  isExisting: boolean;
}

export interface OnboardingSnapshot {
  profile: OnboardingProfileRecord;
  hasAppAccess: boolean;
  inviteSummary: InviteSummary | null;
}

const PRODUCTION_FALLBACK_URL = 'https://www.lovelanguages.io';

function getValidOrigin(origin: string | undefined | null): string | null {
  if (!origin) {
    return null;
  }

  const trimmed = origin.trim();
  if (!trimmed || trimmed === '*') {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function getServerBaseUrl(): string {
  const appUrl = getValidOrigin(process.env.APP_URL);
  if (appUrl) {
    return appUrl;
  }

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin && origin !== '*');

  for (const origin of allowedOrigins) {
    const validOrigin = getValidOrigin(origin);
    if (validOrigin) {
      return validOrigin;
    }
  }

  return PRODUCTION_FALLBACK_URL;
}

export function hasActivePromo(profile: Pick<Profile, 'promo_expires_at'>): boolean {
  return Boolean(profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date());
}

export function hasActiveTrial(
  profile: Pick<Profile, 'free_tier_chosen_at' | 'trial_expires_at'>
): boolean {
  if (!profile.free_tier_chosen_at) {
    return false;
  }

  if (!profile.trial_expires_at) {
    return true;
  }

  return new Date(profile.trial_expires_at) > new Date();
}

export function hasAppAccessFromProfile(
  profile: Pick<
    Profile,
    | 'subscription_status'
    | 'subscription_granted_by'
    | 'promo_expires_at'
    | 'free_tier_chosen_at'
    | 'trial_expires_at'
  >
): boolean {
  return (
    profile.subscription_status === 'active' ||
    Boolean(profile.subscription_granted_by) ||
    hasActivePromo(profile) ||
    hasActiveTrial(profile)
  );
}

export function getPlanIntentFromData(
  data: Partial<OnboardingData> | null | undefined
): 'free' | 'paid' | null {
  if (!data?.selectedPlan) {
    return null;
  }

  if (data.selectedPlan === 'free') {
    return 'free';
  }

  return 'paid';
}

export function getStatusForPersistedStep(
  stepKey: Profile['onboarding_step_key'],
  data: Partial<OnboardingData>,
  currentStatus?: Profile['onboarding_status'] | null
): OnboardingStatus {
  if (currentStatus === 'completed') {
    return 'completed';
  }

  if (
    stepKey === 'start' &&
    (data.selectedPlan === 'standard' || data.selectedPlan === 'unlimited') &&
    !data.selectedPriceId
  ) {
    return 'pending_checkout';
  }

  if (stepKey === 'plan' || stepKey === 'start') {
    return 'awaiting_plan';
  }

  return 'in_progress';
}

export async function expireUnusedInviteTokensForLanguage(
  supabase: SupabaseClient,
  userId: string,
  languageCode: string | null | undefined
): Promise<void> {
  if (!languageCode) {
    return;
  }

  await supabase
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('inviter_id', userId)
    .eq('language_code', languageCode)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString());
}

export async function getInviteSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<InviteSummary | null> {
  const { data: invite } = await supabase
    .from('invite_tokens')
    .select('token, expires_at')
    .eq('inviter_id', userId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite?.token || !invite.expires_at) {
    return null;
  }

  const baseUrl = getServerBaseUrl();
  return {
    inviteLink: `${baseUrl}/join/${invite.token}`,
    expiresAt: invite.expires_at,
    isExisting: true,
  };
}

export async function getOnboardingProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingProfileRecord | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(ONBOARDING_PROFILE_SELECT_FIELDS)
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as unknown as OnboardingProfileRecord;
}

export async function buildOnboardingSnapshot(
  supabase: SupabaseClient,
  profile: OnboardingProfileRecord
): Promise<OnboardingSnapshot> {
  const inviteSummary = await getInviteSummary(supabase, profile.id);
  return {
    profile,
    hasAppAccess: hasAppAccessFromProfile(profile),
    inviteSummary,
  };
}
