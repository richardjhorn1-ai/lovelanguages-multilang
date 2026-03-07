type RelationshipPartnerProfile = {
  id: string;
  linked_user_id: string | null;
  active_relationship_session_id: string | null;
};

type RelationshipVerificationSuccess = {
  ok: true;
  relationshipSessionId: string;
  partnerProfile: RelationshipPartnerProfile;
};

type RelationshipVerificationFailure = {
  ok: false;
  status: number;
  error: string;
};

export type RelationshipVerificationResult =
  | RelationshipVerificationSuccess
  | RelationshipVerificationFailure;

/**
 * Enforces a mutually linked partner relationship with an active shared session.
 * All partner-collaboration writes should call this before creating artifacts.
 */
export async function verifyActiveRelationshipSession(
  supabase: any,
  userId: string,
  linkedUserId: string | null | undefined,
  userActiveSessionId: string | null | undefined
): Promise<RelationshipVerificationResult> {
  if (!linkedUserId) {
    return { ok: false, status: 400, error: 'No linked partner found' };
  }

  const { data: partnerProfile, error: partnerError } = await supabase
    .from('profiles')
    .select('id, linked_user_id, active_relationship_session_id')
    .eq('id', linkedUserId)
    .single();

  if (partnerError || !partnerProfile) {
    return { ok: false, status: 400, error: 'Partner profile not found' };
  }

  if (partnerProfile.linked_user_id !== userId) {
    return {
      ok: false,
      status: 400,
      error: 'Partner link is no longer active. Please ask your partner to reconnect.',
    };
  }

  const relationshipSessionId =
    userActiveSessionId || partnerProfile.active_relationship_session_id;

  if (!relationshipSessionId) {
    return {
      ok: false,
      status: 409,
      error:
        'No active relationship session found. Please relink with your partner.',
    };
  }

  if (
    userActiveSessionId &&
    partnerProfile.active_relationship_session_id &&
    userActiveSessionId !== partnerProfile.active_relationship_session_id
  ) {
    return {
      ok: false,
      status: 409,
      error:
        'Relationship session mismatch detected. Please relink with your partner.',
    };
  }

  return {
    ok: true,
    relationshipSessionId,
    partnerProfile: partnerProfile as RelationshipPartnerProfile,
  };
}

