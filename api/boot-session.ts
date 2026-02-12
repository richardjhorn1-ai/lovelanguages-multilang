import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';
import { fetchVocabularyContext } from '../utils/vocabulary-context.js';

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
    const bootedAt = new Date().toISOString();

    // Fetch profile, language settings, and milestone counts in parallel
    const [profileResult, languageParams, gameCountResult, chatCountResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, xp, level, partner_name, linked_user_id, role, updated_at')
        .eq('id', auth.userId)
        .single(),
      getProfileLanguages(supabase, auth.userId),
      supabase
        .from('game_sessions')
        .select('id')
        .eq('user_id', auth.userId)
        .limit(1),
      supabase
        .from('chats')
        .select('id')
        .eq('user_id', auth.userId)
        .limit(1)
    ]);

    const { data: profile, error: profileError } = profileResult;
    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { targetLanguage, nativeLanguage } = languageParams;

    // Compute milestones and daily_return
    const hasGames = (gameCountResult.data?.length ?? 0) > 0;
    const hasChats = (chatCountResult.data?.length ?? 0) > 0;

    // Calculate days since last active (using profile.updated_at as last login marker)
    const lastUpdated = profile?.updated_at ? new Date(profile.updated_at) : null;
    const daysSinceLastActive = lastUpdated
      ? Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Touch updated_at to mark this login (fire-and-forget)
    void supabase
      .from('profiles')
      .update({ updated_at: bootedAt })
      .eq('id', auth.userId);

    // Fetch user's learning context + full word list in parallel
    const [userContext, knownWordsResult] = await Promise.all([
      fetchVocabularyContext(supabase, auth.userId, targetLanguage),
      supabase
        .from('dictionary')
        .select('word')
        .eq('user_id', auth.userId)
        .eq('language_code', targetLanguage)
    ]);
    const knownWordsList = (knownWordsResult.data || []).map((w: any) => w.word.toLowerCase().trim());

    // Word count comes from the vocabulary query already in userContext
    const milestones = {
      hasWords: userContext.stats.totalWords > 0,
      hasGames,
      hasChats,
    };

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
      masteredWords: userContext.masteredWords,
      weakSpots: userContext.weakSpots,
      recentWords: userContext.recentWords,
      stats: userContext.stats
    };

    // For students, return their own context with knownWordsList for extraction dedup
    if (isStudent) {
      return res.status(200).json({
        success: true,
        context: { ...baseContext, knownWordsList },
        milestones,
        daysSinceLastActive
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
        },
        milestones,
        daysSinceLastActive
      });
    }

    // Fetch partner's profile and language settings in parallel
    const [partnerProfileResult, partnerLanguageParams] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, xp, level')
        .eq('id', profile.linked_user_id)
        .single(),
      getProfileLanguages(supabase, profile.linked_user_id)
    ]);

    const { data: partnerProfile } = partnerProfileResult;
    const { targetLanguage: partnerTargetLanguage, nativeLanguage: partnerNativeLanguage } = partnerLanguageParams;

    // Fetch partner's learning context with their language (includes mastery tiers)
    const partnerContext = await fetchVocabularyContext(supabase, profile.linked_user_id, partnerTargetLanguage);

    return res.status(200).json({
      success: true,
      context: {
        ...baseContext,
        // For tutors, their own vocab/weakSpots aren't needed - clear them
        vocabulary: [],
        masteredWords: [],
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
          masteredWords: partnerContext.masteredWords,
          weakSpots: partnerContext.weakSpots,
          recentWords: partnerContext.recentWords,
          stats: partnerContext.stats,
          lastActive: partnerContext.lastActive
        }
      },
      milestones,
      daysSinceLastActive
    });

  } catch (error: any) {
    console.error('[boot-session] Error:', error);
    return res.status(500).json({ error: 'Failed to load session. Please refresh the page.' });
  }
}
