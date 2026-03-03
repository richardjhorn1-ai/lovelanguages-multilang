import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth } from '@/utils/api-middleware';
import { getProfileLanguages } from '@/utils/language-helpers';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Verify authentication - the new partner must be logged in
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400, headers: corsHeaders });
    }

    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404, headers: corsHeaders });
    }

    // Check if already used
    if (tokenData.used_at) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400, headers: corsHeaders });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400, headers: corsHeaders });
    }

    // Check that the new user isn't the inviter
    if (auth.userId === tokenData.inviter_id) {
      return NextResponse.json({ error: 'You cannot accept your own invite' }, { status: 400, headers: corsHeaders });
    }

    // Get the inviter's profile to ensure they're still valid (including subscription and language info)
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('id, linked_user_id, subscription_plan, subscription_status, subscription_ends_at, subscription_period, active_language, role')
      .eq('id', tokenData.inviter_id)
      .single();

    if (inviterError || !inviterProfile) {
      return NextResponse.json({ error: 'Inviter account no longer exists' }, { status: 404, headers: corsHeaders });
    }

    // Get the new user's current profile to check their language settings
    const { data: newUserProfile } = await supabase
      .from('profiles')
      .select('native_language, active_language')
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

      return NextResponse.json({ error: 'This person already has a linked partner' }, { status: 400, headers: corsHeaders });
    }

    // All checks passed - link the accounts!
    const inviterRole = inviterProfile.role || 'student';
    const joinerRole = inviterRole === 'tutor' ? 'student' : 'tutor';
    console.log('[complete-invite] Linking accounts:', { newPartnerId: auth.userId, inviterId: tokenData.inviter_id, inviterRole, joinerRole });

    // Build update data for new partner
    const partnerUpdateData: Record<string, any> = {
      role: joinerRole,
      linked_user_id: tokenData.inviter_id
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
      return NextResponse.json({ error: 'Failed to link accounts' }, { status: 500, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to complete linking' }, { status: 500, headers: corsHeaders });
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

    return NextResponse.json({
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
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[complete-invite] Error:', error);
    return NextResponse.json({ error: 'Failed to complete invite. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
