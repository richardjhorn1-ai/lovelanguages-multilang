import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'createChallenge', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      }, { status: 429, headers: corsHeaders });
    }

    // Get tutor's profile and linked student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    if (profile.role !== 'tutor') {
      return NextResponse.json({ error: 'Only tutors can create challenges' }, { status: 403, headers: corsHeaders });
    }

    if (!profile.linked_user_id) {
      return NextResponse.json({ error: 'No linked partner found' }, { status: 400, headers: corsHeaders });
    }

    // CRITICAL: Verify two-way partner link (prevents orphaned challenges if student unlinked)
    const { data: studentProfile, error: studentProfileError } = await supabase
      .from('profiles')
      .select('linked_user_id')
      .eq('id', profile.linked_user_id)
      .single();

    if (studentProfileError || !studentProfile) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 400, headers: corsHeaders });
    }

    if (studentProfile.linked_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Partner link is no longer active. Please ask your partner to reconnect.' }, { status: 400, headers: corsHeaders });
    }

    // Get student's language settings
    const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, profile.linked_user_id);

    const { challengeType, title, config, wordIds, newWords, linkedWordRequestId } = await request.json();

    if (!challengeType || !config) {
      return NextResponse.json({ error: 'Missing required fields: challengeType, config' }, { status: 400, headers: corsHeaders });
    }

    // Validate challengeType
    const validChallengeTypes = ['quiz', 'whisper', 'quickfire'];
    if (!validChallengeTypes.includes(challengeType)) {
      return NextResponse.json({ error: `Invalid challengeType. Must be one of: ${validChallengeTypes.join(', ')}` }, { status: 400, headers: corsHeaders });
    }

    // Validate linkedWordRequestId if provided
    if (linkedWordRequestId) {
      const { data: wordRequest, error: wrError } = await supabase
        .from('word_requests')
        .select('id, tutor_id, linked_challenge_id')
        .eq('id', linkedWordRequestId)
        .single();

      if (wrError || !wordRequest) {
        return NextResponse.json({ error: 'Invalid linked word request ID' }, { status: 400, headers: corsHeaders });
      }

      if (wordRequest.tutor_id !== auth.userId) {
        return NextResponse.json({ error: 'Word request does not belong to you' }, { status: 403, headers: corsHeaders });
      }

      if (wordRequest.linked_challenge_id) {
        return NextResponse.json({ error: 'Word request is already linked to a challenge' }, { status: 400, headers: corsHeaders });
      }
    }

    // Validate config based on challenge type
    if (challengeType === 'quiz') {
      if (!config.questionTypes || !Array.isArray(config.questionTypes) || config.questionTypes.length === 0) {
        return NextResponse.json({ error: 'Quiz requires questionTypes array' }, { status: 400, headers: corsHeaders });
      }
      const validQuestionTypes = ['multiple_choice', 'type_it', 'flashcard'];
      for (const qt of config.questionTypes) {
        if (!validQuestionTypes.includes(qt)) {
          return NextResponse.json({ error: `Invalid questionType: ${qt}. Must be one of: ${validQuestionTypes.join(', ')}` }, { status: 400, headers: corsHeaders });
        }
      }
      if (typeof config.wordCount !== 'number' || config.wordCount < 1 || config.wordCount > 50) {
        return NextResponse.json({ error: 'Quiz wordCount must be 1-50' }, { status: 400, headers: corsHeaders });
      }
    }

    if (challengeType === 'quickfire') {
      if (typeof config.timeLimitSeconds !== 'number' || config.timeLimitSeconds < 10 || config.timeLimitSeconds > 300) {
        return NextResponse.json({ error: 'QuickFire timeLimitSeconds must be 10-300' }, { status: 400, headers: corsHeaders });
      }
      if (typeof config.wordCount !== 'number' || config.wordCount < 1 || config.wordCount > 50) {
        return NextResponse.json({ error: 'QuickFire wordCount must be 1-50' }, { status: 400, headers: corsHeaders });
      }
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (config.difficulty && !validDifficulties.includes(config.difficulty)) {
        return NextResponse.json({ error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` }, { status: 400, headers: corsHeaders });
      }
    }

    if (challengeType === 'whisper') {
      if (!config.recordings || !Array.isArray(config.recordings) || config.recordings.length === 0) {
        return NextResponse.json({ error: 'Whisper requires recordings array' }, { status: 400, headers: corsHeaders });
      }
      for (const recording of config.recordings) {
        if (!recording.audioUrl || !recording.word || !recording.translation) {
          return NextResponse.json({ error: 'Each whisper recording must have audioUrl, word, and translation' }, { status: 400, headers: corsHeaders });
        }
      }
    }

    // Sanitize user inputs
    const sanitizedTitle = title ? sanitizeInput(title, 100) : null;

    // Validate array lengths
    if (wordIds && wordIds.length > 50) {
      return NextResponse.json({ error: 'Too many words: maximum 50 allowed' }, { status: 400, headers: corsHeaders });
    }
    if (newWords && newWords.length > 20) {
      return NextResponse.json({ error: 'Too many new words: maximum 20 allowed' }, { status: 400, headers: corsHeaders });
    }

    // Fetch word data for the selected words
    let wordsData: any[] = [];
    if (wordIds && wordIds.length > 0) {
      const { data: words } = await supabase
        .from('dictionary')
        .select('id, word, translation, word_type')
        .in('id', wordIds)
        .eq('user_id', profile.linked_user_id)
        .eq('language_code', targetLanguage);

      wordsData = words || [];
    }

    // Handle new words added by tutor
    if (newWords && Array.isArray(newWords) && newWords.length > 0) {
      // Support both new format {word, translation} and legacy format {polish, english}
      const newWordEntries = newWords.map((w: { word?: string; translation?: string; polish?: string; english?: string }) => {
        const wordText = sanitizeInput((w.word || w.polish || ''), 100).toLowerCase().trim();
        const translationText = sanitizeInput((w.translation || w.english || ''), 100).trim();

        return {
          user_id: profile.linked_user_id,
          language_code: targetLanguage,
          word: wordText,
          translation: translationText,
          word_type: 'other',
          pro_tip: `Added by ${profile.full_name} in challenge`
        };
      });

      const { data: insertedWords, error: insertError } = await supabase
        .from('dictionary')
        .insert(newWordEntries)
        .select('id, word, translation, word_type');

      if (insertError) {
        console.error('Error inserting new words:', insertError);
        // Continue without the new words rather than failing entirely
      } else if (insertedWords) {
        wordsData = [...wordsData, ...insertedWords];
      }
    }

    if (config.aiSuggestedWeakWords) {
      // Auto-select weak words based on scores
      const { data: weakWords } = await supabase
        .from('word_scores')
        .select('word_id, correct_streak, total_attempts, dictionary:word_id(id, word, translation, word_type)')
        .eq('user_id', profile.linked_user_id)
        .eq('language_code', targetLanguage)
        .lt('correct_streak', 5)
        .gt('total_attempts', 0)
        .order('correct_streak', { ascending: true })
        .limit(config.wordCount || 10);

      wordsData = (weakWords || [])
        .filter((w: any) => w.dictionary)
        .map((w: any) => ({
          id: w.dictionary.id,
          word: w.dictionary.word,
          translation: w.dictionary.translation,
          word_type: w.dictionary.word_type
        }));
    }

    // Determine challenge status:
    // - 'scheduled' if linked to a word request (activates after gift completion)
    // - 'pending' for standalone challenges
    const challengeStatus = linkedWordRequestId ? 'scheduled' : 'pending';

    // Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('tutor_challenges')
      .insert({
        tutor_id: auth.userId,
        student_id: profile.linked_user_id,
        language_code: targetLanguage,
        challenge_type: challengeType,
        title: sanitizedTitle || `${challengeType} Challenge`,
        config,
        word_ids: wordsData.map(w => w.id),
        words_data: wordsData,
        status: challengeStatus,
        linked_word_request_id: linkedWordRequestId || null,
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Error creating challenge:', challengeError);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500, headers: corsHeaders });
    }

    // Update word request with linked challenge ID (bidirectional link)
    if (linkedWordRequestId) {
      const { error: linkError } = await supabase
        .from('word_requests')
        .update({ linked_challenge_id: challenge.id })
        .eq('id', linkedWordRequestId);

      if (linkError) {
        console.error('Error linking challenge to word request:', linkError);
        // Don't fail - the challenge was created, just log the linking error
      }
    }

    // Create notification for student (only for immediate challenges, not scheduled ones)
    // Scheduled challenges notify when they activate (after word gift completion)
    if (!linkedWordRequestId) {
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: profile.linked_user_id,
        type: 'challenge',
        title: `${profile.full_name} sent you a challenge!`,
        message: `Play "${challenge.title}" and show what you've learned!`,
        data: { challenge_id: challenge.id, challenge_type: challengeType }
      });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the request, notification is non-critical
      }
    }

    // Award Tutor XP for creating challenge
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${baseUrl}/api/tutor-award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('authorization') || '',
        },
        body: JSON.stringify({
          action: 'create_challenge',
        }),
      });
    } catch (tutorXpError) {
      // Don't fail the main request if tutor XP fails
      console.error('[create-challenge] Failed to award tutor XP:', tutorXpError);
    }

    // Add to activity feed
    await supabase.from('activity_feed').insert({
      user_id: auth.userId,
      partner_id: profile.linked_user_id,
      event_type: 'challenge_sent',
      title: `Created a ${challengeType} challenge`,
      subtitle: `${wordsData.length} words`,
      data: { challenge_id: challenge.id },
      language_code: targetLanguage,
    });

    // Increment usage counter
    incrementUsage(supabase, auth.userId, RATE_LIMITS.createChallenge.type);

    return NextResponse.json({
      success: true,
      challenge
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[create-challenge] Error:', error);
    return NextResponse.json({ error: 'Failed to create challenge. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
