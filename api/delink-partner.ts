import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Get current user's profile with partner info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, linked_user_id, active_relationship_session_id, subscription_granted_by, subscription_status, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No partner to unlink' });
    }

    const partnerId = profile.linked_user_id;
    const isPayer = !profile.subscription_granted_by;
    const now = new Date().toISOString();

    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, active_relationship_session_id, subscription_granted_by, subscription_status')
      .eq('id', partnerId)
      .single();

    console.log(`[delink-partner] User ${auth.userId} initiating breakup with ${partnerId}. isPayer: ${isPayer}`);

    // 1. Delink both profiles (bidirectional)
    const { error: delinkError1 } = await supabase
      .from('profiles')
      .update({ linked_user_id: null, active_relationship_session_id: null })
      .eq('id', profile.id);

    const { error: delinkError2 } = await supabase
      .from('profiles')
      .update({ linked_user_id: null, active_relationship_session_id: null })
      .eq('id', partnerId);

    if (delinkError1 || delinkError2) {
      console.error('[delink-partner] Delink error:', delinkError1 || delinkError2);
      return res.status(500).json({ error: 'Failed to unlink accounts' });
    }

    // 2. Handle subscription access based on who initiated
    if (isPayer && partnerProfile?.subscription_granted_by === profile.id) {
      // I'm the payer - revoke partner's inherited access only when it is inherited from me
      const { error: revokeError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'none',
          subscription_status: 'inactive',
          subscription_source: 'none',
          subscription_granted_by: null,
          subscription_granted_at: null,
          subscription_ends_at: null
        })
        .eq('id', partnerId);

      if (revokeError) {
        console.error('[delink-partner] Failed to revoke partner access:', revokeError);
      } else {
        console.log(`[delink-partner] Revoked access for partner ${partnerId}`);
      }
    } else if (!isPayer && profile.subscription_granted_by) {
      // I'm the partner with inherited access - I lose it
      const { error: revokeError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'none',
          subscription_status: 'inactive',
          subscription_source: 'none',
          subscription_granted_by: null,
          subscription_granted_at: null,
          subscription_ends_at: null
        })
        .eq('id', profile.id);

      if (revokeError) {
        console.error('[delink-partner] Failed to revoke own access:', revokeError);
      } else {
        console.log(`[delink-partner] User ${profile.id} lost inherited access`);
      }
    }

    // 3. End active relationship session
    const relationshipSessionId = profile.active_relationship_session_id || partnerProfile?.active_relationship_session_id;
    if (relationshipSessionId) {
      const { error: relationshipError } = await supabase
        .from('relationship_sessions')
        .update({ status: 'ended', ended_at: now })
        .eq('id', relationshipSessionId)
        .eq('status', 'active');
      if (relationshipError) {
        console.error('[delink-partner] Failed to end relationship session:', relationshipError);
      }
    }

    // 4. Expire any pending invites from either party
    await supabase
      .from('invite_tokens')
      .update({ expires_at: now })
      .in('inviter_id', [profile.id, partnerId])
      .is('used_at', null);

    // 5. Expire pending tutor challenges between these two users
    const { error: challengeError } = await supabase
      .from('tutor_challenges')
      .update({ status: 'expired' })
      .in('status', ['pending', 'active'])
      .or(`and(tutor_id.eq.${profile.id},student_id.eq.${partnerId}),and(tutor_id.eq.${partnerId},student_id.eq.${profile.id})`);
    if (challengeError) console.error('[delink-partner] Failed to expire challenges:', challengeError);

    // 6. Expire pending word requests between these two users
    const { error: requestError } = await supabase
      .from('word_requests')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .or(`and(tutor_id.eq.${profile.id},student_id.eq.${partnerId}),and(tutor_id.eq.${partnerId},student_id.eq.${profile.id})`);
    if (requestError) console.error('[delink-partner] Failed to expire word requests:', requestError);

    // 7. Return appropriate message based on role
    return res.status(200).json({
      success: true,
      wasPayingUser: isPayer,
      relationshipEndedAt: now,
      message: isPayer
        ? 'Accounts unlinked. Your subscription continues. You can invite a new partner anytime.'
        : 'Accounts unlinked. You\'ll need your own subscription to continue learning.'
    });

  } catch (err: any) {
    console.error('[delink-partner] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
