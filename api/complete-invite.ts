import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication - the new partner must be logged in
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Parse body
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }

    const { token } = body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }

    // Check if already used
    if (tokenData.used_at) {
      return res.status(400).json({ error: 'This invite link has already been used' });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'This invite link has expired' });
    }

    // Check that the new user isn't the inviter
    if (auth.userId === tokenData.inviter_id) {
      return res.status(400).json({ error: 'You cannot accept your own invite' });
    }

    // Get the inviter's profile to ensure they're still valid (including subscription and language info)
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('id, linked_user_id, subscription_plan, subscription_status, subscription_ends_at, subscription_period, subscription_source, subscription_granted_by, active_language, role')
      .eq('id', tokenData.inviter_id)
      .single();

    if (inviterError || !inviterProfile) {
      return res.status(404).json({ error: 'Inviter account no longer exists' });
    }

    // Get the new user's current profile to check their language settings
    const { data: newUserProfile } = await supabase
      .from('profiles')
      .select('native_language, active_language, subscription_plan, subscription_status, subscription_granted_by, promo_expires_at, trial_expires_at')
      .eq('id', auth.userId)
      .single();

    // Determine the language to use (from token, inviter's profile, or profile languages helper)
    let inviterLearningLanguage = tokenData.language_code || inviterProfile.active_language;
    if (!inviterLearningLanguage) {
      const inviterLangs = await getProfileLanguages(supabase, tokenData.inviter_id);
      inviterLearningLanguage = inviterLangs.targetLanguage;
    }

    // Check if inviter already has a partner
    if (inviterProfile.linked_user_id) {
      // Mark token as used (by someone else)
      await supabase
        .from('invite_tokens')
        .update({ used_at: now.toISOString() })
        .eq('id', tokenData.id);

      return res.status(400).json({ error: 'This person already has a linked partner' });
    }

    const inviterHasSelfPaidAccess =
      !inviterProfile.subscription_granted_by &&
      inviterProfile.subscription_status === 'active' &&
      (inviterProfile.subscription_plan === 'standard' || inviterProfile.subscription_plan === 'unlimited');

    const joinerHasSelfPaidAccess =
      !newUserProfile?.subscription_granted_by &&
      newUserProfile?.subscription_status === 'active' &&
      (newUserProfile?.subscription_plan === 'standard' || newUserProfile?.subscription_plan === 'unlimited');

    // Household model guard: both users cannot enter shared mode while both self-pay.
    if (inviterHasSelfPaidAccess && joinerHasSelfPaidAccess) {
      return res.status(409).json({
        error: 'Both accounts already have active paid subscriptions',
        code: 'DUPLICATE_PAID_SUBSCRIPTION',
        message: 'Linking is blocked until one paid subscription is cancelled or expires.',
        resolution: {
          action: 'resolve_one_payer_first',
          detail: 'Cancel one paid subscription first to avoid paying twice, then retry linking.'
        }
      });
    }

    // Create a new active relationship session for this link.
    const { data: relationshipSession, error: relationshipError } = await supabase
      .from('relationship_sessions')
      .insert({
        user_a_id: tokenData.inviter_id,
        user_b_id: auth.userId,
        billing_owner_user_id: inviterHasSelfPaidAccess ? tokenData.inviter_id : null,
        status: 'active',
        started_at: now.toISOString(),
      })
      .select('id')
      .single();

    if (relationshipError || !relationshipSession) {
      console.error('[complete-invite] Failed to create relationship session:', relationshipError);
      return res.status(500).json({ error: 'Failed to initialize relationship session' });
    }

    // All checks passed - link the accounts!
    const inviterRole = inviterProfile.role || 'student';
    const joinerRole = inviterRole === 'tutor' ? 'student' : 'tutor';
    console.log('[complete-invite] Linking accounts:', { newPartnerId: auth.userId, inviterId: tokenData.inviter_id, inviterRole, joinerRole });

    // Build update data for new partner
    const partnerUpdateData: Record<string, any> = {
      role: joinerRole,
      linked_user_id: tokenData.inviter_id,
      active_relationship_session_id: relationshipSession.id,
    };

    // Set language settings - only update if user hasn't configured their own languages yet
    const hasDefaultLanguages =
      (!newUserProfile?.native_language || newUserProfile.native_language === 'en') &&
      (!newUserProfile?.active_language || newUserProfile.active_language === 'pl');

    if (hasDefaultLanguages) {
      if (joinerRole === 'tutor') {
        // active_language = language being taught (student's target)
        // Don't set native_language — tutor picks their own in RoleSelection/Onboarding
        partnerUpdateData.active_language = inviterLearningLanguage;
        partnerUpdateData.languages = [inviterLearningLanguage];
      } else {
        // Student joining via tutor invite: set active_language to the tutor's coaching language
        // Don't override native_language — we don't know it
        partnerUpdateData.active_language = inviterLearningLanguage;
        partnerUpdateData.languages = [inviterLearningLanguage];
      }
    }

    // Grant inherited subscription if inviter has active subscription
    if (inviterHasSelfPaidAccess) {
      partnerUpdateData.subscription_plan = inviterProfile.subscription_plan;
      partnerUpdateData.subscription_status = 'active';
      partnerUpdateData.subscription_period = inviterProfile.subscription_period;
      partnerUpdateData.subscription_ends_at = inviterProfile.subscription_ends_at;
      partnerUpdateData.subscription_granted_by = inviterProfile.id;
      partnerUpdateData.subscription_granted_at = new Date().toISOString();
      partnerUpdateData.subscription_source = inviterProfile.subscription_source || 'stripe';
      console.log('[complete-invite] Granting inherited subscription:', inviterProfile.subscription_plan);
    }

    // 1. Update the new partner's profile: set role to tutor, link to inviter, grant subscription
    const { data: updatedPartner, error: newPartnerError } = await supabase
      .from('profiles')
      .update(partnerUpdateData)
      .eq('id', auth.userId)
      .select()
      .single();

    if (newPartnerError) {
      console.error('[complete-invite] Error updating new partner profile:', newPartnerError);
      return res.status(500).json({ error: 'Failed to link accounts' });
    }
    console.log('[complete-invite] Updated partner profile:', updatedPartner?.id, 'with subscription:', inviterHasSelfPaidAccess);

    // 2. Update the inviter's profile: link to new partner
    const { error: inviterUpdateError } = await supabase
      .from('profiles')
      .update({
        linked_user_id: auth.userId,
        active_relationship_session_id: relationshipSession.id,
      })
      .eq('id', tokenData.inviter_id);

    if (inviterUpdateError) {
      console.error('Error updating inviter profile:', inviterUpdateError);
      // Try to rollback the new partner update
      await supabase
        .from('profiles')
        .update({
          role: 'student',
          linked_user_id: null,
          active_relationship_session_id: null,
          subscription_plan: null,
          subscription_status: 'inactive',
          subscription_source: 'none',
          subscription_granted_by: null,
          subscription_granted_at: null
        })
        .eq('id', auth.userId);
      await supabase
        .from('relationship_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', relationshipSession.id);
      return res.status(500).json({ error: 'Failed to complete linking' });
    }

    // 3. Mark the token as used
    await supabase
      .from('invite_tokens')
      .update({
        used_at: now.toISOString(),
        used_by: auth.userId
      })
      .eq('id', tokenData.id);

    // 4. Also clean up any pending link_requests between these users
    await supabase
      .from('link_requests')
      .update({ status: 'accepted' })
      .eq('requester_id', tokenData.inviter_id)
      .eq('status', 'pending');

    return res.status(200).json({
      success: true,
      message: inviterHasSelfPaidAccess
        ? 'Accounts linked! You now have free access through your partner.'
        : 'Accounts successfully linked!',
      partnerId: tokenData.inviter_id,
      partnerName: tokenData.inviter_name,
      relationshipSessionId: relationshipSession.id,
      subscription: inviterHasSelfPaidAccess ? {
        plan: inviterProfile.subscription_plan,
        status: 'active',
        grantedBy: inviterProfile.id,
        expiresAt: inviterProfile.subscription_ends_at
      } : null
    });

  } catch (error: any) {
    console.error('[complete-invite] Error:', error);
    return res.status(500).json({ error: 'Failed to complete invite. Please try again.' });
  }
}
