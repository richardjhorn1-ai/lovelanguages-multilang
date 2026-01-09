import { createClient } from '@supabase/supabase-js';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware';

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
    const limit = await checkRateLimit(supabase, auth.userId, 'createChallenge', sub.plan as 'standard' | 'unlimited');
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

    const { challengeType, title, config, wordIds, newWords } = req.body;

    if (!challengeType || !config) {
      return res.status(400).json({ error: 'Missing required fields: challengeType, config' });
    }

    // Fetch word data for the selected words
    let wordsData: any[] = [];
    if (wordIds && wordIds.length > 0) {
      const { data: words } = await supabase
        .from('dictionary')
        .select('id, word, translation, word_type')
        .in('id', wordIds)
        .eq('user_id', profile.linked_user_id);

      wordsData = words || [];
    }

    // Handle new words added by tutor
    if (newWords && Array.isArray(newWords) && newWords.length > 0) {
      const newWordEntries = newWords.map((w: { polish: string; english: string }) => ({
        user_id: profile.linked_user_id,
        word: w.polish.toLowerCase().trim(),
        translation: w.english.trim(),
        word_type: 'other',
        importance: 3,
        context: `Added by ${profile.full_name} in challenge`,
        root_word: w.polish.toLowerCase().trim(),
        examples: [],
        pro_tip: ''
      }));

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
        .from('scores')
        .select('word_id, fail_count, success_count, dictionary:word_id(id, word, translation, word_type)')
        .eq('user_id', profile.linked_user_id)
        .gt('fail_count', 0)
        .order('fail_count', { ascending: false })
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
        challenge_type: challengeType,
        title: title || `${challengeType} Challenge`,
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
    await supabase.from('notifications').insert({
      user_id: profile.linked_user_id,
      type: 'challenge',
      title: `${profile.full_name} sent you a challenge!`,
      message: `Play "${challenge.title}" and show what you've learned!`,
      data: { challenge_id: challenge.id, challenge_type: challengeType }
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
