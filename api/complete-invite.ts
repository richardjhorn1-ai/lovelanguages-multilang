import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

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
      .select('id, linked_user_id, subscription_plan, subscription_status, subscription_ends_at, subscription_period, active_language')
      .eq('id', tokenData.inviter_id)
      .single();

    if (inviterError || !inviterProfile) {
      return res.status(404).json({ error: 'Inviter account no longer exists' });
    }

    // Get the new user's current profile to check their language settings
    const { data: newUserProfile } = await supabase
      .from('profiles')
      .select('native_language, active_language')
      .eq('id', auth.userId)
      .single();

    // Determine the language to use (from token, or inviter's profile, or default)
    const inviterLearningLanguage = tokenData.language_code || inviterProfile.active_language || 'pl';

    // Check if inviter already has a partner
    if (inviterProfile.linked_user_id) {
      // Mark token as used (by someone else)
      await supabase
        .from('invite_tokens')
        .update({ used_at: now.toISOString() })
        .eq('id', tokenData.id);

      return res.status(400).json({ error: 'This person already has a linked partner' });
    }

    // All checks passed - link the accounts!
    console.log('[complete-invite] Linking accounts:', { newPartnerId: auth.userId, inviterId: tokenData.inviter_id });

    // Build update data for new partner
    const partnerUpdateData: Record<string, any> = {
      role: 'tutor',
      linked_user_id: tokenData.inviter_id
    };

    // Set language settings for new tutors with default settings (pl/en)
    // Only update if user hasn't configured their own languages yet
    const hasDefaultLanguages =
      (!newUserProfile?.native_language || newUserProfile.native_language === 'en') &&
      (!newUserProfile?.active_language || newUserProfile.active_language === 'pl');

    if (hasDefaultLanguages) {
      // Tutor speaks the language being learned (their native = inviter's target)
      // and we set their active_language the same (no separate learning, just coaching)
      partnerUpdateData.native_language = inviterLearningLanguage;
      partnerUpdateData.active_language = inviterLearningLanguage;
      partnerUpdateData.languages = [inviterLearningLanguage];
      console.log('[complete-invite] Setting tutor language settings:', {
        native_language: inviterLearningLanguage,
        active_language: inviterLearningLanguage
      });
    }

    // Grant inherited subscription if inviter has active subscription
    const hasActiveSubscription = inviterProfile.subscription_status === 'active';
    if (hasActiveSubscription) {
      partnerUpdateData.subscription_plan = inviterProfile.subscription_plan;
      partnerUpdateData.subscription_status = 'active';
      partnerUpdateData.subscription_period = inviterProfile.subscription_period;
      partnerUpdateData.subscription_ends_at = inviterProfile.subscription_ends_at;
      partnerUpdateData.subscription_granted_by = inviterProfile.id;
      partnerUpdateData.subscription_granted_at = new Date().toISOString();
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
    console.log('[complete-invite] Updated partner profile:', updatedPartner?.id, 'with subscription:', hasActiveSubscription);

    // 2. Update the inviter's profile: link to new partner
    const { error: inviterUpdateError } = await supabase
      .from('profiles')
      .update({
        linked_user_id: auth.userId
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
          subscription_plan: null,
          subscription_status: 'inactive',
          subscription_granted_by: null,
          subscription_granted_at: null
        })
        .eq('id', auth.userId);
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
      message: hasActiveSubscription
        ? 'Accounts linked! You now have free access through your partner.'
        : 'Accounts successfully linked!',
      partnerId: tokenData.inviter_id,
      partnerName: tokenData.inviter_name,
      subscription: hasActiveSubscription ? {
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
