import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
} from '@/utils/api-middleware';
import { getProfileLanguages } from '@/utils/language-helpers';
import { sanitizeInput } from '@/utils/sanitize';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Subscription check
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    const { requestType, topic, wordIds, message } = await request.json();

    // Validate request type
    const validTypes = ['general', 'topic', 'specific_words'];
    if (!requestType || !validTypes.includes(requestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400, headers: corsHeaders });
    }

    // Validate topic for topic requests
    if (requestType === 'topic' && !topic) {
      return NextResponse.json({ error: 'Topic required for topic requests' }, { status: 400, headers: corsHeaders });
    }

    // Validate word IDs for specific_words requests
    if (requestType === 'specific_words' && (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0)) {
      return NextResponse.json({ error: 'Word IDs required for specific word requests' }, { status: 400, headers: corsHeaders });
    }

    // Get user profile (must be a student with linked tutor)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linked_user_id, full_name, role')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can request challenges' }, { status: 400, headers: corsHeaders });
    }

    if (!profile.linked_user_id) {
      return NextResponse.json({ error: 'No linked tutor' }, { status: 400, headers: corsHeaders });
    }

    const { targetLanguage } = await getProfileLanguages(supabase, auth.userId);

    // Verify linked user is a tutor
    const { data: tutorProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', profile.linked_user_id)
      .single();

    if (tutorProfile?.role !== 'tutor') {
      return NextResponse.json({ error: 'Linked partner is not a tutor' }, { status: 400, headers: corsHeaders });
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('challenge_requests')
      .select('id')
      .eq('student_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request' }, { status: 400, headers: corsHeaders });
    }

    // Sanitize message
    const sanitizedMessage = message ? sanitizeInput(message, 200) : null;
    const sanitizedTopic = topic ? sanitizeInput(topic, 100) : null;

    // Validate word IDs if provided
    let validWordIds: string[] = [];
    if (wordIds && wordIds.length > 0) {
      const { data: words } = await supabase
        .from('dictionary')
        .select('id')
        .eq('user_id', auth.userId)
        .in('id', wordIds);

      validWordIds = words?.map(w => w.id) || [];
      if (validWordIds.length === 0) {
        return NextResponse.json({ error: 'No valid words found' }, { status: 400, headers: corsHeaders });
      }
    }

    // Create the challenge request
    const { data: challengeRequest, error: requestError } = await supabase
      .from('challenge_requests')
      .insert({
        student_id: auth.userId,
        tutor_id: profile.linked_user_id,
        request_type: requestType,
        topic: sanitizedTopic,
        word_ids: validWordIds.length > 0 ? validWordIds : null,
        message: sanitizedMessage,
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating challenge request:', requestError);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500, headers: corsHeaders });
    }

    // Create notification for tutor
    let notificationMessage = `${profile.full_name || 'Your partner'} wants to practice!`;
    if (requestType === 'topic') {
      notificationMessage = `${profile.full_name || 'Your partner'} wants help with "${sanitizedTopic}"`;
    } else if (requestType === 'specific_words') {
      notificationMessage = `${profile.full_name || 'Your partner'} wants help with ${validWordIds.length} specific words`;
    }

    await supabase.from('notifications').insert({
      user_id: profile.linked_user_id,
      type: 'challenge_request',
      title: '🎯 Challenge Request',
      message: notificationMessage,
      data: {
        request_id: challengeRequest.id,
        request_type: requestType,
        topic: sanitizedTopic,
        word_count: validWordIds.length,
        student_name: profile.full_name,
      },
    });

    // Add to activity feed
    await supabase.from('activity_feed').insert({
      user_id: auth.userId,
      partner_id: profile.linked_user_id,
      event_type: 'challenge_request',
      title: 'Requested a challenge',
      subtitle: requestType === 'topic' ? `Topic: ${sanitizedTopic}` : requestType === 'specific_words' ? `${validWordIds.length} words` : 'General practice',
      data: { request_id: challengeRequest.id },
      language_code: targetLanguage,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: challengeRequest.id,
        requestType: challengeRequest.request_type,
        topic: challengeRequest.topic,
        wordCount: validWordIds.length,
        createdAt: challengeRequest.created_at,
      },
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[create-challenge-request] Error:', error);
    return NextResponse.json({ error: 'Failed to create challenge request' }, { status: 500, headers: corsHeaders });
  }
}
