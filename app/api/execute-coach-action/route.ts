/**
 * Execute Coach Action API
 *
 * Executes AI-proposed actions after user confirmation.
 * Supports: word_gift, quiz, quickfire, love_note
 *
 * Flow:
 * 1. AI proposes action in chat.ts via proposedAction field
 * 2. Frontend shows confirmation UI with action details
 * 3. User confirms -> this endpoint executes the action
 * 4. Returns confirmation with created item IDs
 */

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
import { logger, generateRequestId } from '@/utils/logger';
import { LOVE_NOTE_TEMPLATES } from '@/constants/levels';
import type { ProposedAction, ExecuteCoachActionResponse } from '@/types';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  const requestId = generateRequestId();
  const endTimer = logger.time(`[${requestId}] execute-coach-action`);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: corsHeaders });
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

    const body = await request.json();
    const { action, createLinkedChallenge } = body as {
      action: ProposedAction;
      createLinkedChallenge?: boolean;
    };

    if (!action || !action.type) {
      return NextResponse.json({ error: 'Missing action or action type' }, { status: 400, headers: corsHeaders });
    }

    // Validate action type
    const validTypes = ['word_gift', 'quiz', 'quickfire', 'love_note'];
    if (!validTypes.includes(action.type)) {
      return NextResponse.json({ error: `Invalid action type: ${action.type}` }, { status: 400, headers: corsHeaders });
    }

    // Get tutor profile and verify they have a linked partner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    if (profile.role !== 'tutor') {
      return NextResponse.json({ error: 'Only tutors can execute coach actions' }, { status: 403, headers: corsHeaders });
    }

    if (!profile.linked_user_id) {
      return NextResponse.json({ error: 'No linked partner' }, { status: 400, headers: corsHeaders });
    }

    // CRITICAL: Verify two-way partner link
    const { data: studentProfile, error: studentProfileError } = await supabase
      .from('profiles')
      .select('linked_user_id')
      .eq('id', profile.linked_user_id)
      .single();

    if (studentProfileError || !studentProfile) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 400, headers: corsHeaders });
    }

    if (studentProfile.linked_user_id !== auth.userId) {
      return NextResponse.json({ error: 'Partner link is no longer active' }, { status: 400, headers: corsHeaders });
    }

    const partnerId = profile.linked_user_id;

    // Get student's language settings
    const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, partnerId);

    const response: ExecuteCoachActionResponse = {
      success: false,
      message: '',
      createdItems: {},
    };

    // Execute based on action type
    switch (action.type) {
      case 'word_gift': {
        // Check rate limit for word gifts
        const limit = await checkRateLimit(supabase, auth.userId, 'sendWordGift', sub.plan as SubscriptionPlan);
        if (!limit.allowed) {
          return NextResponse.json({
            error: limit.error,
            remaining: limit.remaining,
          }, { status: 429, headers: corsHeaders });
        }

        // Validate words
        if (!action.words || action.words.length === 0) {
          return NextResponse.json({ error: 'Word gift requires words array' }, { status: 400, headers: corsHeaders });
        }

        if (action.words.length > 20) {
          return NextResponse.json({ error: 'Maximum 20 words per gift' }, { status: 400, headers: corsHeaders });
        }

        // Valid word types for validation
        const validWordTypes = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'];

        // Sanitize and validate words
        const sanitizedWords = action.words
          .map(w => ({
            word: sanitizeInput(w.word, 100).toLowerCase().trim(),
            translation: sanitizeInput(w.translation, 100).trim(),
            word_type: (w.word_type && validWordTypes.includes(w.word_type)) ? w.word_type : 'phrase',
            selected: true,
          }))
          .filter(w => w.word.length > 0 && w.translation.length > 0);

        if (sanitizedWords.length === 0) {
          return NextResponse.json({ error: 'No valid words provided after sanitization' }, { status: 400, headers: corsHeaders });
        }

        // Create word request
        const { data: wordRequest, error: wordRequestError } = await supabase
          .from('word_requests')
          .insert({
            tutor_id: auth.userId,
            student_id: partnerId,
            language_code: targetLanguage,
            request_type: 'ai_topic',
            input_text: sanitizeInput(action.topic || 'AI-curated words', 200),
            ai_suggestions: sanitizedWords,
            selected_words: sanitizedWords,
            status: 'pending',
            xp_multiplier: 2.0,
          })
          .select()
          .single();

        if (wordRequestError) {
          console.error('[execute-coach-action] Word request error:', wordRequestError);
          return NextResponse.json({ error: 'Failed to create word gift' }, { status: 500, headers: corsHeaders });
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'word_request',
          title: `${profile.full_name} sent you ${sanitizedWords.length} words to learn!`,
          message: action.topic ? `Topic: ${action.topic}` : 'A special gift from your partner',
          data: { request_id: wordRequest.id, word_count: sanitizedWords.length },
        });

        // Add to activity feed
        await supabase.from('activity_feed').insert({
          user_id: auth.userId,
          partner_id: partnerId,
          event_type: 'gift_sent',
          title: 'Sent a word gift',
          subtitle: action.topic ? `Topic: ${action.topic}` : `${sanitizedWords.length} words`,
          data: { request_id: wordRequest.id },
          language_code: targetLanguage,
        });

        incrementUsage(supabase, auth.userId, RATE_LIMITS.sendWordGift.type);

        response.createdItems!.wordRequestId = wordRequest.id;
        response.message = `Sent ${sanitizedWords.length} words to learn`;

        // Create linked challenge if requested
        if (createLinkedChallenge && action.linkedChallenge) {
          const linkedChallengeResult = await createLinkedChallengeInternal(
            supabase,
            auth.userId,
            partnerId,
            targetLanguage,
            wordRequest.id,
            action.linkedChallenge,
            sanitizedWords,
            profile.full_name || 'Your partner'
          );

          if (linkedChallengeResult.challengeId) {
            response.createdItems!.challengeId = linkedChallengeResult.challengeId;
            response.message += `, plus a ${action.linkedChallenge.type} challenge scheduled for after`;
          }
        }

        response.success = true;
        break;
      }

      case 'quiz':
      case 'quickfire': {
        // Check rate limit
        const limit = await checkRateLimit(supabase, auth.userId, 'createChallenge', sub.plan as SubscriptionPlan);
        if (!limit.allowed) {
          return NextResponse.json({
            error: limit.error,
            remaining: limit.remaining,
          }, { status: 429, headers: corsHeaders });
        }

        const challengeType = action.type;
        const config = action.challengeConfig || {};

        // Get words based on source (default to weak_words)
        let wordsData: Array<{ id?: string; word: string; translation: string; word_type: string }> = [];
        const wordCount = config.wordCount || 10;
        const wordSource = config.wordSource || 'weak_words';

        if (wordSource === 'weak_words') {
          // Fetch weak words from partner's scores
          const { data: weakWords } = await supabase
            .from('word_scores')
            .select('word_id, correct_streak, total_attempts, dictionary:word_id(id, word, translation, word_type)')
            .eq('user_id', partnerId)
            .eq('language_code', targetLanguage)
            .lt('correct_streak', 5)
            .gt('total_attempts', 0)
            .order('correct_streak', { ascending: true })
            .limit(wordCount);

          wordsData = (weakWords || [])
            .filter((w: any) => w.dictionary)
            .map((w: any) => ({
              id: w.dictionary.id,
              word: w.dictionary.word,
              translation: w.dictionary.translation,
              word_type: w.dictionary.word_type || 'other',
            }));
        } else if (wordSource === 'recent_words') {
          // Fetch recent words
          const { data: recentWords } = await supabase
            .from('dictionary')
            .select('id, word, translation, word_type')
            .eq('user_id', partnerId)
            .eq('language_code', targetLanguage)
            .order('unlocked_at', { ascending: false })
            .limit(wordCount);

          wordsData = (recentWords || []).map((w: any) => ({
            id: w.id,
            word: w.word,
            translation: w.translation,
            word_type: w.word_type || 'other',
          }));
        } else if (wordSource === 'specific' && config.specificWordIds?.length > 0) {
          // Fetch specific words by ID
          const { data: specificWords } = await supabase
            .from('dictionary')
            .select('id, word, translation, word_type')
            .in('id', config.specificWordIds.slice(0, wordCount))
            .eq('user_id', partnerId)
            .eq('language_code', targetLanguage);

          wordsData = (specificWords || []).map((w: any) => ({
            id: w.id,
            word: w.word,
            translation: w.translation,
            word_type: w.word_type || 'other',
          }));
        }

        if (wordsData.length === 0) {
          return NextResponse.json({ error: 'No words available for challenge' }, { status: 400, headers: corsHeaders });
        }

        // Build challenge config
        const challengeConfig: any = {
          wordCount: wordsData.length,
        };

        // Validate and set question types for quiz
        const validQuestionTypes = ['multiple_choice', 'type_it', 'flashcard'];
        if (challengeType === 'quiz') {
          const requestedTypes = config.questionTypes || ['multiple_choice', 'type_it'];
          challengeConfig.questionTypes = requestedTypes.filter((qt: string) => validQuestionTypes.includes(qt));
          if (challengeConfig.questionTypes.length === 0) {
            challengeConfig.questionTypes = ['multiple_choice', 'type_it'];
          }
        } else {
          // quickfire
          challengeConfig.timeLimitSeconds = config.timeLimitSeconds || 60;
          challengeConfig.difficulty = 'medium';
        }

        // Sanitize title
        const sanitizedTitle = action.title ? sanitizeInput(action.title, 100) : `${challengeType} Challenge`;

        // Create challenge
        const { data: challenge, error: challengeError } = await supabase
          .from('tutor_challenges')
          .insert({
            tutor_id: auth.userId,
            student_id: partnerId,
            language_code: targetLanguage,
            challenge_type: challengeType,
            title: sanitizedTitle,
            config: challengeConfig,
            word_ids: wordsData.filter(w => w.id).map(w => w.id),
            words_data: wordsData,
            status: 'pending',
          })
          .select()
          .single();

        if (challengeError) {
          console.error('[execute-coach-action] Challenge error:', challengeError);
          return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500, headers: corsHeaders });
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'challenge',
          title: `${profile.full_name} sent you a challenge!`,
          message: `Play "${challenge.title}" and show what you've learned!`,
          data: { challenge_id: challenge.id, challenge_type: challengeType },
        });

        // Add to activity feed
        await supabase.from('activity_feed').insert({
          user_id: auth.userId,
          partner_id: partnerId,
          event_type: 'challenge_sent',
          title: `Created a ${challengeType} challenge`,
          subtitle: `${wordsData.length} words`,
          data: { challenge_id: challenge.id },
          language_code: targetLanguage,
        });

        incrementUsage(supabase, auth.userId, RATE_LIMITS.createChallenge.type);

        response.createdItems!.challengeId = challenge.id;
        response.message = `Created ${challengeType} challenge with ${wordsData.length} words`;
        response.success = true;
        break;
      }

      case 'love_note': {
        // Validate category
        const validCategories = ['encouragement', 'check_in', 'celebration'];
        const category = action.noteCategory || 'encouragement';
        if (!validCategories.includes(category)) {
          return NextResponse.json({ error: 'Invalid note category' }, { status: 400, headers: corsHeaders });
        }

        // Get template text or use custom message
        let templateText: string | null = null;
        const customMessage = action.noteMessage ? sanitizeInput(action.noteMessage, 200) : null;

        if (!customMessage) {
          // Pick a random template from the category
          const templates = LOVE_NOTE_TEMPLATES[category as keyof typeof LOVE_NOTE_TEMPLATES];
          if (templates && templates.length > 0) {
            templateText = templates[Math.floor(Math.random() * templates.length)];
          }
        }

        // Check daily rate limit (simple check - 10/day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from('love_notes')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', auth.userId)
          .gte('created_at', today.toISOString());

        if ((todayCount || 0) >= 10) {
          return NextResponse.json({ error: 'Daily love note limit reached (10/day)' }, { status: 429, headers: corsHeaders });
        }

        // Create love note
        const { data: loveNote, error: noteError } = await supabase
          .from('love_notes')
          .insert({
            sender_id: auth.userId,
            recipient_id: partnerId,
            template_category: category,
            template_text: templateText,
            custom_message: customMessage,
          })
          .select()
          .single();

        if (noteError) {
          console.error('[execute-coach-action] Love note error:', noteError);
          return NextResponse.json({ error: 'Failed to send love note' }, { status: 500, headers: corsHeaders });
        }

        // Create notification
        const noteText = customMessage || templateText || 'sent you a love note';
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'love_note',
          title: `${profile.full_name || 'Your partner'}`,
          message: noteText,
          data: { love_note_id: loveNote.id, sender_name: profile.full_name },
        });

        // Add to activity feed
        await supabase.from('activity_feed').insert({
          user_id: auth.userId,
          partner_id: partnerId,
          event_type: 'love_note',
          title: 'Sent a love note',
          subtitle: noteText,
          data: { note_id: loveNote.id },
          language_code: targetLanguage,
        });

        response.createdItems!.loveNoteId = loveNote.id;
        response.message = 'Love note sent';
        response.success = true;
        break;
      }
    }

    logger.info('Coach action executed', {
      requestId,
      userId: auth.userId,
      endpoint: 'execute-coach-action',
      metadata: {
        actionType: action.type,
        createdItems: response.createdItems,
      },
    });
    endTimer();

    return NextResponse.json({ ...response, requestId }, { headers: corsHeaders });

  } catch (error: any) {
    logger.error('Coach action failed', {
      requestId,
      endpoint: 'execute-coach-action',
      error: error.message,
    });
    return NextResponse.json({ error: 'Failed to execute action', requestId }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Internal helper to create a linked challenge that activates after word gift completion
 */
async function createLinkedChallengeInternal(
  supabase: any,
  tutorId: string,
  studentId: string,
  languageCode: string,
  wordRequestId: string,
  linkedConfig: { type: string; wordCount?: number; timeLimitSeconds?: number },
  words: Array<{ word: string; translation: string; word_type?: string }>,
  tutorName: string
): Promise<{ challengeId?: string; error?: string }> {
  try {
    const challengeType = linkedConfig.type === 'quickfire' ? 'quickfire' : 'quiz';
    const wordCount = linkedConfig.wordCount || words.length;

    const config: any = {
      wordCount: Math.min(wordCount, words.length),
    };

    if (challengeType === 'quiz') {
      config.questionTypes = ['multiple_choice', 'type_it'];
    } else {
      config.timeLimitSeconds = linkedConfig.timeLimitSeconds || 60;
      config.difficulty = 'medium';
    }

    // Create challenge with 'scheduled' status - will be activated when word gift is completed
    const { data: challenge, error } = await supabase
      .from('tutor_challenges')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        language_code: languageCode,
        challenge_type: challengeType,
        title: `${challengeType === 'quiz' ? 'Quiz' : 'Quick Fire'} on your new words`,
        config,
        words_data: words.slice(0, wordCount),
        status: 'scheduled',
        linked_word_request_id: wordRequestId,
      })
      .select()
      .single();

    if (error) {
      console.error('[createLinkedChallenge] Error:', error);
      return { error: 'Failed to create linked challenge' };
    }

    // Update word request with linked challenge ID
    await supabase
      .from('word_requests')
      .update({ linked_challenge_id: challenge.id })
      .eq('id', wordRequestId);

    return { challengeId: challenge.id };
  } catch (err: any) {
    console.error('[createLinkedChallenge] Exception:', err);
    return { error: err.message };
  }
}
