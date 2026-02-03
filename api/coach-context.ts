/**
 * Coach Context API
 *
 * Fetches rich, enhanced context for the tutor's AI coach mode.
 * Includes teaching impact metrics, stuck/improving words, learning velocity,
 * celebrations, and actionable missions.
 *
 * Results are cached for 30 minutes to avoid repeated expensive queries.
 */

import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';
import { logger, generateRequestId } from '../utils/logger.js';
import type { EnhancedCoachContext } from '../types.js';

// In-memory cache (per serverless instance)
const contextCache = new Map<string, { data: EnhancedCoachContext; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export default async function handler(req: any, res: any) {
  const requestId = generateRequestId();
  const endTimer = logger.time(`[${requestId}] coach-context`);

  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized', requestId });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Check if user is a tutor with linked partner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'tutor') {
      return res.status(400).json({ error: 'Coach context is only available for tutors' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked partner' });
    }

    const partnerId = profile.linked_user_id;

    // Get partner's language settings first (needed for cache key)
    const { targetLanguage } = await getProfileLanguages(supabase, partnerId);

    // Check cache (include language in key since context is language-specific)
    const cacheKey = `coach-${auth.userId}-${targetLanguage}`;
    const cached = contextCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({
        success: true,
        context: cached.data,
        cached: true,
      });
    }

    // Fetch partner profile
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('full_name, xp, level, last_practice_at')
      .eq('id', partnerId)
      .single();

    // Level name lookup
    const levelNames = [
      'Beginner 1', 'Beginner 2', 'Beginner 3',
      'Elementary 1', 'Elementary 2', 'Elementary 3',
      'Conversational 1', 'Conversational 2', 'Conversational 3',
      'Proficient 1', 'Proficient 2', 'Proficient 3',
      'Fluent 1', 'Fluent 2', 'Fluent 3',
      'Master 1', 'Master 2', 'Master 3'
    ];
    const levelIndex = Math.min((partnerProfile?.level || 1) - 1, 17);
    const levelName = levelNames[levelIndex] || 'Beginner 1';

    // ===========================================
    // Teaching Impact Metrics (reused from tutor-analytics)
    // ===========================================

    // XP Contributed from challenges
    const { data: tutorChallenges } = await supabase
      .from('tutor_challenges')
      .select('id')
      .eq('tutor_id', auth.userId);

    const tutorChallengeIds = tutorChallenges?.map(c => c.id) || [];

    let xpFromChallenges = 0;
    let challengeResults: Array<{ score: number }> = [];
    if (tutorChallengeIds.length > 0) {
      const { data: results } = await supabase
        .from('challenge_results')
        .select('xp_earned, score')
        .in('challenge_id', tutorChallengeIds);

      xpFromChallenges = results?.reduce((sum, r) => sum + (r.xp_earned || 0), 0) || 0;
      challengeResults = results || [];
    }

    // XP from word gifts
    const { data: wordGifts } = await supabase
      .from('word_requests')
      .select('xp_multiplier')
      .eq('tutor_id', auth.userId)
      .eq('status', 'completed');

    const xpFromGifts = wordGifts?.reduce((sum, g) => sum + ((g.xp_multiplier || 1) * 5), 0) || 0;
    const xpContributed = xpFromChallenges + xpFromGifts;

    // Challenge success rate
    const avgScore = challengeResults.length > 0
      ? Math.round(challengeResults.reduce((sum, r) => sum + r.score, 0) / challengeResults.length)
      : 0;

    // Words mastered (gifted words that reached 5-streak)
    const { data: giftedWordRequests } = await supabase
      .from('word_requests')
      .select('selected_words')
      .eq('tutor_id', auth.userId)
      .eq('status', 'completed');

    const giftedWordIds = giftedWordRequests?.flatMap(r =>
      (r.selected_words || []).map((w: any) => w.id).filter(Boolean)
    ) || [];

    let wordsMasteredCount = 0;
    if (giftedWordIds.length > 0) {
      const { count } = await supabase
        .from('word_scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', partnerId)
        .in('word_id', giftedWordIds)
        .not('learned_at', 'is', null);

      wordsMasteredCount = count || 0;
    }

    // ===========================================
    // Word Intelligence
    // ===========================================

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: allScores } = await supabase
      .from('word_scores')
      .select(`
        word_id,
        total_attempts,
        correct_attempts,
        correct_streak,
        updated_at,
        dictionary:word_id (word, translation, language_code)
      `)
      .eq('user_id', partnerId)
      .gt('total_attempts', 0);

    // Filter by language
    const languageScores = (allScores || []).filter(
      (s: any) => s.dictionary?.language_code === targetLanguage
    );

    // Stuck words: high fail rate, not recently practiced, low streak
    const stuckWords = languageScores
      .filter((s: any) => {
        const failRate = (s.total_attempts - s.correct_attempts) / s.total_attempts;
        return failRate > 0.4 && s.correct_streak < 3 && s.total_attempts >= 3;
      })
      .sort((a: any, b: any) => (b.total_attempts - b.correct_attempts) - (a.total_attempts - a.correct_attempts))
      .slice(0, 5)
      .map((s: any) => {
        const lastAttempt = s.updated_at ? new Date(s.updated_at) : null;
        const daysSince = lastAttempt
          ? Math.floor((now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return {
          word: (s.dictionary as any)?.word || '',
          translation: (s.dictionary as any)?.translation || '',
          failCount: s.total_attempts - s.correct_attempts,
          daysSinceAttempt: daysSince,
        };
      });

    // Improving words: 2-4 streak (almost mastered)
    const improvingWords = languageScores
      .filter((s: any) => s.correct_streak >= 2 && s.correct_streak < 5)
      .sort((a: any, b: any) => b.correct_streak - a.correct_streak)
      .slice(0, 5)
      .map((s: any) => ({
        word: (s.dictionary as any)?.word || '',
        translation: (s.dictionary as any)?.translation || '',
        streak: s.correct_streak,
      }));

    // Recent words (last 5 learned)
    const { data: recentVocab } = await supabase
      .from('dictionary')
      .select('word, translation')
      .eq('user_id', partnerId)
      .eq('language_code', targetLanguage)
      .order('unlocked_at', { ascending: false })
      .limit(5);

    const recentWords = (recentVocab || []).map((v: any) => ({
      word: v.word,
      translation: v.translation,
    }));

    // Total words and mastered count
    const { count: totalWords } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', partnerId)
      .eq('language_code', targetLanguage);

    const { count: masteredCount } = await supabase
      .from('word_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', partnerId)
      .eq('language_code', targetLanguage)
      .not('learned_at', 'is', null);

    // ===========================================
    // Learning Velocity
    // ===========================================

    // Words learned this week
    const { count: wordsThisWeek } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', partnerId)
      .eq('language_code', targetLanguage)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Practice consistency (active days in last 7)
    const { data: recentActivity } = await supabase
      .from('activity_feed')
      .select('created_at')
      .eq('user_id', partnerId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(500);

    const activeDays = new Set(
      recentActivity?.map(a => new Date(a.created_at).toDateString()) || []
    ).size;

    // Days since last practice
    const lastPractice = partnerProfile?.last_practice_at
      ? new Date(partnerProfile.last_practice_at)
      : null;
    const daysSinceLastPractice = lastPractice
      ? Math.floor((now.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // ===========================================
    // Celebrations
    // ===========================================

    const celebrations: EnhancedCoachContext['celebrations'] = {};

    // Milestone celebrations
    const wordTotal = totalWords || 0;
    const milestones = [500, 250, 100, 50, 25, 10];
    for (const milestone of milestones) {
      if (wordTotal >= milestone && wordTotal < milestone + 10) {
        celebrations.milestone = `Just hit ${milestone} words!`;
        break;
      }
    }

    // Practice streak celebration
    if (activeDays >= 5) {
      celebrations.streak = `${activeDays}-day practice streak!`;
    }

    // Recent mastery win
    const { data: recentMastery } = await supabase
      .from('word_scores')
      .select('learned_at, dictionary:word_id (word)')
      .eq('user_id', partnerId)
      .eq('language_code', targetLanguage)
      .not('learned_at', 'is', null)
      .order('learned_at', { ascending: false })
      .limit(1);

    if (recentMastery?.[0]?.learned_at) {
      const masteryDate = new Date(recentMastery[0].learned_at);
      const daysSinceMastery = Math.floor((now.getTime() - masteryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceMastery <= 2) {
        const masteredWord = (recentMastery[0].dictionary as any)?.word || 'a word';
        celebrations.recentWin = `Mastered '${masteredWord}' ${daysSinceMastery === 0 ? 'today' : daysSinceMastery === 1 ? 'yesterday' : '2 days ago'}!`;
      }
    }

    // ===========================================
    // Actionable Missions
    // ===========================================

    const missions: EnhancedCoachContext['missions'] = [];

    // High priority: Stuck words
    if (stuckWords.length >= 3) {
      missions.push({
        type: 'stuck_words',
        priority: 'high',
        message: `${stuckWords.length} words need focused practice`,
        suggestedAction: 'challenge',
        targetWords: stuckWords.map(w => w.word),
      });
    }

    // Medium priority: Improving words (almost mastered)
    if (improvingWords.length >= 2) {
      missions.push({
        type: 'improving',
        priority: 'medium',
        message: `${improvingWords.length} words are almost mastered - one more push!`,
        suggestedAction: 'challenge',
        targetWords: improvingWords.map(w => w.word),
      });
    }

    // High priority: Inactivity
    if (daysSinceLastPractice >= 3 && daysSinceLastPractice < 999) {
      missions.push({
        type: 'inactivity',
        priority: 'high',
        message: `${partnerProfile?.full_name || 'Your partner'} hasn't practiced in ${daysSinceLastPractice} days`,
        suggestedAction: 'love_note',
      });
    }

    // Low priority: Variety suggestion
    if (avgScore > 85 && challengeResults.length >= 5) {
      missions.push({
        type: 'variety',
        priority: 'low',
        message: 'Quizzes are going great! Try Quick Fire for variety',
        suggestedAction: 'challenge',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    missions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // ===========================================
    // Build Response
    // ===========================================

    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    const context: EnhancedCoachContext = {
      learnerName: partnerProfile?.full_name || 'your partner',
      stats: {
        totalWords: totalWords || 0,
        masteredCount: masteredCount || 0,
        xp: partnerProfile?.xp || 0,
        level: levelName,
      },
      recentWords,
      teachingImpact: {
        xpContributed,
        wordsMastered: wordsMasteredCount,
        challengeSuccessRate: avgScore,
      },
      stuckWords,
      improvingWords,
      velocity: {
        wordsPerWeek: wordsThisWeek || 0,
        practiceConsistency: activeDays,
        daysSinceLastPractice,
      },
      celebrations,
      missions: missions.slice(0, 3), // Top 3 missions
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store in cache
    contextCache.set(cacheKey, {
      data: context,
      expiresAt: expiresAt.getTime(),
    });

    logger.info('Coach context fetched', {
      requestId,
      userId: auth.userId,
      endpoint: 'coach-context',
      metadata: { cached: false, missionsCount: missions.length },
    });
    endTimer();

    return res.status(200).json({
      success: true,
      context,
      cached: false,
      requestId,
    });

  } catch (error: any) {
    logger.error('Coach context failed', {
      requestId,
      endpoint: 'coach-context',
      error: error.message,
    });
    return res.status(500).json({ error: 'Failed to fetch coach context', requestId });
  }
}
