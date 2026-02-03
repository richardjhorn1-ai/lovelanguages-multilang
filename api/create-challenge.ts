import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';
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

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'createChallenge', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    // Get tutor's profile and linked student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can create challenges' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked partner found' });
    }

    // Get student's language settings
    const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, profile.linked_user_id);

    const { challengeType, title, config, wordIds, newWords } = req.body;

    if (!challengeType || !config) {
      return res.status(400).json({ error: 'Missing required fields: challengeType, config' });
    }

    // Sanitize user inputs
    const sanitizedTitle = title ? sanitizeInput(title, 100) : null;

    // Validate array lengths
    if (wordIds && wordIds.length > 50) {
      return res.status(400).json({ error: 'Too many words: maximum 50 allowed' });
    }
    if (newWords && newWords.length > 20) {
      return res.status(400).json({ error: 'Too many new words: maximum 20 allowed' });
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
          importance: 3,
          context: `Added by ${profile.full_name} in challenge`,
          root_word: wordText,
          examples: [],
          pro_tip: ''
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
        status: 'pending'
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Error creating challenge:', challengeError);
      return res.status(500).json({ error: 'Failed to create challenge' });
    }

    // Create notification for student
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

    // Award Tutor XP for creating challenge
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`;
      await fetch(`${baseUrl}/api/tutor-award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
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

    return res.status(200).json({
      success: true,
      challenge
    });

  } catch (error: any) {
    console.error('[create-challenge] Error:', error);
    return res.status(500).json({ error: 'Failed to create challenge. Please try again.' });
  }
}
