import { supabase } from './supabase';
import type { PartnerProfileView } from '../types';

const PARTNER_PROFILE_SELECT = [
  'id',
  'full_name',
  'avatar_url',
  'role',
  'active_language',
  'native_language',
  'level',
  'xp',
  'tutor_xp',
  'tutor_tier',
  'last_practice_at',
  'partner_name',
  'subscription_plan',
  'subscription_status',
  'subscription_ends_at',
].join(',');

/**
 * Reads partner-safe profile fields from the dedicated allowlisted view.
 * Returns null when the user has no active linked partner session.
 */
export async function fetchPartnerProfileView(): Promise<PartnerProfileView | null> {
  const { data, error } = await supabase
    .from('partner_profile_view')
    .select(PARTNER_PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST205') {
      return null;
    }
    throw error;
  }

  return data ? (data as unknown as PartnerProfileView) : null;
}
