import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
} from '../utils/api-middleware.js';
import { sanitizeInput } from '../utils/sanitize.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Subscription check
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    const { requestType, topic, wordIds, message } = req.body;

    // Validate request type
    const validTypes = ['general', 'topic', 'specific_words'];
    if (!requestType || !validTypes.includes(requestType)) {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    // Validate topic for topic requests
    if (requestType === 'topic' && !topic) {
      return res.status(400).json({ error: 'Topic required for topic requests' });
    }

    // Validate word IDs for specific_words requests
    if (requestType === 'specific_words' && (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0)) {
      return res.status(400).json({ error: 'Word IDs required for specific word requests' });
    }

    // Get user profile (must be a student with linked tutor)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linked_user_id, full_name, role')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'student') {
      return res.status(400).json({ error: 'Only students can request challenges' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked tutor' });
    }

    // Verify linked user is a tutor
    const { data: tutorProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', profile.linked_user_id)
      .single();

    if (tutorProfile?.role !== 'tutor') {
      return res.status(400).json({ error: 'Linked partner is not a tutor' });
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('challenge_requests')
      .select('id')
      .eq('student_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request' });
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
        return res.status(400).json({ error: 'No valid words found' });
      }
    }

    // Create the challenge request
    const { data: request, error: requestError } = await supabase
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
      return res.status(500).json({ error: 'Failed to create request' });
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
        request_id: request.id,
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
      data: { request_id: request.id },
    });

    return res.status(200).json({
      success: true,
      request: {
        id: request.id,
        requestType: request.request_type,
        topic: request.topic,
        wordCount: validWordIds.length,
        createdAt: request.created_at,
      },
    });
  } catch (error: any) {
    console.error('[create-challenge-request] Error:', error);
    return res.status(500).json({ error: 'Failed to create challenge request' });
  }
}
