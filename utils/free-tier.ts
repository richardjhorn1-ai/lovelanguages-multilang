import type { SupabaseClient } from '@supabase/supabase-js';

export interface FreeTierActivationResult {
  success: boolean;
  trialExpiresAt?: string;
  code?: 'ALREADY_SUBSCRIBED' | 'HAS_PARTNER_ACCESS' | 'HAS_PROMO_ACCESS' | 'ALREADY_FREE_TIER';
  error?: string;
}

export async function activateFreeTier(
  supabase: SupabaseClient,
  userId: string
): Promise<FreeTierActivationResult> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_granted_by, promo_expires_at, free_tier_chosen_at')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: 'Failed to verify user status',
    };
  }

  if (profile.subscription_status === 'active') {
    return {
      success: false,
      code: 'ALREADY_SUBSCRIBED',
      error: 'You already have an active subscription',
    };
  }

  if (profile.subscription_granted_by) {
    return {
      success: false,
      code: 'HAS_PARTNER_ACCESS',
      error: 'You already have access through your partner',
    };
  }

  const hasActivePromo =
    profile.promo_expires_at &&
    new Date(profile.promo_expires_at) > new Date();

  if (hasActivePromo) {
    return {
      success: false,
      code: 'HAS_PROMO_ACCESS',
      error: 'You already have active creator access',
    };
  }

  const now = new Date();
  const trialExpiresAt = new Date(now);
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

  const { data: updateResult, error: updateError } = await supabase
    .from('profiles')
    .update({
      free_tier_chosen_at: now.toISOString(),
      trial_expires_at: trialExpiresAt.toISOString(),
    })
    .eq('id', userId)
    .is('free_tier_chosen_at', null)
    .select('id');

  if (updateError) {
    return {
      success: false,
      error: 'Failed to activate free trial',
    };
  }

  if (!updateResult || updateResult.length === 0) {
    return {
      success: false,
      code: 'ALREADY_FREE_TIER',
      error: 'You have already activated the free tier',
    };
  }

  return {
    success: true,
    trialExpiresAt: trialExpiresAt.toISOString(),
  };
}
