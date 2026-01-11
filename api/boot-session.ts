import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

// Level name lookup
const LEVEL_NAMES = [
  'Beginner 1', 'Beginner 2', 'Beginner 3',
  'Elementary 1', 'Elementary 2', 'Elementary 3',
  'Conversational 1', 'Conversational 2', 'Conversational 3',
  'Proficient 1', 'Proficient 2', 'Proficient 3',
  'Fluent 1', 'Fluent 2', 'Fluent 3',
  'Master 1', 'Master 2', 'Master 3'
];

function getLevelName(level: number): string {
  const levelIndex = Math.min((level || 1) - 1, 17);
  return LEVEL_NAMES[levelIndex] || 'Beginner 1';
}

// Fetch user's learning context (vocabulary, weak spots, stats)
async function fetchLearnerContext(supabase: any, userId: string, targetLanguage: string) {
  // Parallel fetch: vocabulary and scores (filtered by language)
  const [vocabResult, scoresResult] = await Promise.all([
    supabase
      .from('dictionary')
      .select('word, translation, word_type')
      .eq('user_id', userId)
      .eq('language_code', targetLanguage)
      .order('unlocked_at', { ascending: false })
      .limit(100),
    supabase
      .from('word_scores')
      .select('word_id, correct_count, incorrect_count, learned_at, last_practiced, dictionary:word_id(word, translation)')
      .eq('user_id', userId)
      .eq('language_code', targetLanguage)
  ]);

  const vocabulary = vocabResult.data || [];
  const scores = scoresResult.data || [];

  // Calculate weak spots (words with failures, sorted by fail count)
  const weakSpots = scores
    .filter((s: any) => s.incorrect_count > 0)
    .sort((a: any, b: any) => b.incorrect_count - a.incorrect_count)
    .slice(0, 10)
    .map((s: any) => ({
      word: s.dictionary?.word || 'unknown',
      translation: s.dictionary?.translation || '',
      failCount: s.incorrect_count
    }));

  // Calculate mastered count
  const masteredCount = scores.filter((s: any) => s.learned_at != null).length;

  // Recent words (last 10)
  const recentWords = vocabulary.slice(0, 10).map((v: any) => ({
    word: v.word,
    translation: v.translation
  }));

  // Find last active time from scores
  const lastActive = scores.length > 0
    ? scores.reduce((latest: string | null, s: any) => {
        if (!s.last_practiced) return latest;
        if (!latest) return s.last_practiced;
        return s.last_practiced > latest ? s.last_practiced : latest;
      }, null)
    : null;

  return {
    vocabulary: vocabulary.map((v: any) => ({
      word: v.word,
      translation: v.translation,
      wordType: v.word_type
    })),
    weakSpots,
    recentWords,
    stats: {
      totalWords: vocabulary.length,
      masteredCount
    },
    lastActive
  };
}

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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const bootedAt = new Date().toISOString();

    // First fetch profile to get language settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, xp, level, partner_name, linked_user_id, role, active_language, native_language')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const targetLanguage = profile.active_language || 'pl';
    const nativeLanguage = profile.native_language || 'en';

    // Fetch user's learning context with language filter
    const userContext = await fetchLearnerContext(supabase, auth.userId, targetLanguage);

    const isStudent = profile.role !== 'tutor';

    // Base context (same structure for both roles)
    const baseContext = {
      userId: auth.userId,
      role: profile.role || 'student',
      name: profile.full_name || 'User',
      partnerName: profile.partner_name || null,
      bootedAt,
      level: getLevelName(profile.level || 1),
      xp: profile.xp || 0,
      targetLanguage,
      nativeLanguage,
      vocabulary: userContext.vocabulary,
      weakSpots: userContext.weakSpots,
      recentWords: userContext.recentWords,
      stats: userContext.stats
    };

    // For students, return their own context
    if (isStudent) {
      return res.status(200).json({
        success: true,
        context: baseContext
      });
    }

    // For tutors, also fetch partner's learning context
    if (!profile.linked_user_id) {
      // Tutor without linked partner
      return res.status(200).json({
        success: true,
        context: {
          ...baseContext,
          partner: null  // No partner linked yet
        }
      });
    }

    // Fetch partner's profile first to get their language settings
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('full_name, xp, level, active_language, native_language')
      .eq('id', profile.linked_user_id)
      .single();

    const partnerTargetLanguage = partnerProfile?.active_language || 'pl';
    const partnerNativeLanguage = partnerProfile?.native_language || 'en';

    // Fetch partner's learning context with their language
    const partnerContext = await fetchLearnerContext(supabase, profile.linked_user_id, partnerTargetLanguage);

    return res.status(200).json({
      success: true,
      context: {
        ...baseContext,
        // For tutors, their own vocab/weakSpots aren't needed - clear them
        vocabulary: [],
        weakSpots: [],
        recentWords: [],
        stats: { totalWords: 0, masteredCount: 0 },
        // Partner's learning data is what matters for coach mode
        partner: {
          userId: profile.linked_user_id,
          name: partnerProfile?.full_name || 'Partner',
          level: getLevelName(partnerProfile?.level || 1),
          xp: partnerProfile?.xp || 0,
          targetLanguage: partnerTargetLanguage,
          nativeLanguage: partnerNativeLanguage,
          vocabulary: partnerContext.vocabulary,
          weakSpots: partnerContext.weakSpots,
          recentWords: partnerContext.recentWords,
          stats: partnerContext.stats,
          lastActive: partnerContext.lastActive
        }
      }
    });

  } catch (error: any) {
    console.error('[boot-session] Error:', error);
    return res.status(500).json({ error: 'Failed to load session. Please refresh the page.' });
  }
}
