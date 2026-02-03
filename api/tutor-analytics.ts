import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    // Parse period param
    const period = req.query?.period as string || 'week';
    const daysBack = period === 'month' ? 30 : period === 'all' ? 365 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get tutor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tutor_xp, tutor_tier, role, linked_user_id')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'tutor') {
      return res.status(400).json({ error: 'User is not a tutor' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked partner' });
    }

    const partnerId = profile.linked_user_id;

    // TODO: Multi-language support
    // Currently users can only learn one language at a time, so queries don't filter by language_code.
    // If we add support for learning multiple languages simultaneously, add .eq('language_code', targetLanguage)
    // to these queries: word_scores (lines ~102, 181, 233), dictionary (~226), activity_feed (~263).
    // The targetLanguage would need to be passed as a query param or read from partner's active_language.

    // Get partner profile
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('full_name, xp, last_practice_at')
      .eq('id', partnerId)
      .single();

    // ===========================================
    // Teaching Impact Metrics
    // ===========================================

    // XP Contributed: Sum of XP from completed challenges and word gifts
    // First fetch tutor's challenge IDs (separate query to properly handle errors)
    const { data: tutorChallengeData, error: tutorChallengeError } = await supabase
      .from('tutor_challenges')
      .select('id')
      .eq('tutor_id', auth.userId);

    if (tutorChallengeError) {
      console.error('Error fetching tutor challenges:', tutorChallengeError);
    }

    const tutorChallengeIdList = tutorChallengeData?.map(c => c.id) || [];

    // Only query challenge_results if there are challenges
    let challengeResults: Array<{ xp_earned: number | null }> = [];
    if (tutorChallengeIdList.length > 0) {
      const { data: results, error: resultsError } = await supabase
        .from('challenge_results')
        .select('xp_earned')
        .in('challenge_id', tutorChallengeIdList);

      if (resultsError) {
        console.error('Error fetching challenge results:', resultsError);
      }
      challengeResults = results || [];
    }

    const xpFromChallenges = challengeResults.reduce((sum, r) => sum + (r.xp_earned || 0), 0);

    const { data: wordGifts } = await supabase
      .from('word_requests')
      .select('xp_multiplier')
      .eq('tutor_id', auth.userId)
      .eq('status', 'completed');

    const xpFromGifts = wordGifts?.reduce((sum, g) => sum + ((g.xp_multiplier || 1) * 5), 0) || 0;
    const xpContributed = xpFromChallenges + xpFromGifts;

    // Words Mastered: Gifted words that reached 5-streak
    const { data: giftedWordRequests } = await supabase
      .from('word_requests')
      .select('selected_words')
      .eq('tutor_id', auth.userId)
      .eq('status', 'completed');

    // Extract word IDs from selected_words JSON
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

    // Challenge Success Rate
    const { data: allResults } = await supabase
      .from('challenge_results')
      .select('score, challenge_id, completed_at')
      .eq('student_id', partnerId)
      .order('completed_at', { ascending: false });

    // Filter to only challenges created by this tutor
    const { data: tutorChallenges } = await supabase
      .from('tutor_challenges')
      .select('id')
      .eq('tutor_id', auth.userId);

    const tutorChallengeIds = new Set(tutorChallenges?.map(c => c.id) || []);
    const tutorResults = allResults?.filter(r => tutorChallengeIds.has(r.challenge_id)) || [];

    const avgScore = tutorResults.length > 0
      ? Math.round(tutorResults.reduce((sum, r) => sum + r.score, 0) / tutorResults.length)
      : 0;

    // ===========================================
    // Trend Data
    // ===========================================

    // Get daily activity from activity_feed for trends
    const { data: activityData } = await supabase
      .from('activity_feed')
      .select('event_type, created_at, data')
      .eq('user_id', partnerId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate by day
    const dailyStats: Record<string, { xp: number; words: number; accuracy: number; attempts: number }> = {};

    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyStats[dateKey] = { xp: 0, words: 0, accuracy: 0, attempts: 0 };
    }

    activityData?.forEach(event => {
      const dateKey = new Date(event.created_at).toISOString().split('T')[0];
      if (!dailyStats[dateKey]) return;

      if (event.event_type === 'word_mastered') {
        dailyStats[dateKey].words++;
      } else if (event.event_type === 'challenge_completed' && event.data?.score !== undefined) {
        dailyStats[dateKey].accuracy += event.data.score;
        dailyStats[dateKey].attempts++;
        dailyStats[dateKey].xp += event.data.xp_earned || 0;
      }
    });

    // Convert to chart format
    const xpTrend = Object.entries(dailyStats).map(([date, stats]) => ({ date, value: stats.xp }));
    const wordsTrend = Object.entries(dailyStats).map(([date, stats]) => ({ date, value: stats.words }));
    const accuracyTrend = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      value: stats.attempts > 0 ? Math.round(stats.accuracy / stats.attempts) : 0,
    }));

    // ===========================================
    // Weak Spot Intelligence
    // ===========================================

    // Words with high fail rate and no recent improvement
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: allScores } = await supabase
      .from('word_scores')
      .select(`
        word_id,
        total_attempts,
        correct_attempts,
        correct_streak,
        updated_at,
        dictionary:word_id (word, translation)
      `)
      .eq('user_id', partnerId)
      .gt('total_attempts', 2);

    const stuckWords = (allScores || [])
      .filter(s => {
        const failRate = (s.total_attempts - s.correct_attempts) / s.total_attempts;
        const isRecent = s.updated_at && new Date(s.updated_at) > sevenDaysAgo;
        return failRate > 0.4 && !isRecent && s.correct_streak < 3;
      })
      .sort((a, b) => (b.total_attempts - b.correct_attempts) - (a.total_attempts - a.correct_attempts))
      .slice(0, 10)
      .map(s => ({
        word_id: s.word_id,
        word: (s.dictionary as any)?.word || '',
        translation: (s.dictionary as any)?.translation || '',
        fail_count: s.total_attempts - s.correct_attempts,
        last_attempt: s.updated_at,
      }));

    const improvingWords = (allScores || [])
      .filter(s => s.correct_streak >= 2 && s.correct_streak < 5)
      .sort((a, b) => b.correct_streak - a.correct_streak)
      .slice(0, 5)
      .map(s => ({
        word_id: s.word_id,
        word: (s.dictionary as any)?.word || '',
        translation: (s.dictionary as any)?.translation || '',
        streak: s.correct_streak,
      }));

    // ===========================================
    // Learning Velocity
    // ===========================================

    // Words learned per week
    const { count: wordsThisWeek } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', partnerId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Mastery rate (average days from added to mastered)
    const { data: masteredWords } = await supabase
      .from('word_scores')
      .select('word_id, learned_at')
      .eq('user_id', partnerId)
      .not('learned_at', 'is', null)
      .limit(20);

    let avgMasteryDays = 0;
    if (masteredWords && masteredWords.length > 0) {
      const { data: wordDates } = await supabase
        .from('dictionary')
        .select('id, created_at')
        .in('id', masteredWords.map(w => w.word_id));

      const wordDateMap = new Map(wordDates?.map(w => [w.id, new Date(w.created_at)]) || []);

      const masteryTimes = masteredWords
        .map(w => {
          const created = wordDateMap.get(w.word_id);
          if (!created || !w.learned_at) return null;
          return (new Date(w.learned_at).getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        })
        .filter((t): t is number => t !== null);

      if (masteryTimes.length > 0) {
        avgMasteryDays = Math.round(masteryTimes.reduce((a, b) => a + b, 0) / masteryTimes.length);
      }
    }

    // Practice consistency (active days in last 7)
    const { data: recentActivity } = await supabase
      .from('activity_feed')
      .select('created_at')
      .eq('user_id', partnerId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(500);  // Cap for performance

    const activeDays = new Set(
      recentActivity?.map(a => new Date(a.created_at).toDateString()) || []
    ).size;

    // ===========================================
    // Recommendations
    // ===========================================

    const recommendations: Array<{ type: string; message: string; action_type?: 'challenge' | 'love_note' }> = [];

    // Stuck words recommendation
    if (stuckWords.length >= 5) {
      const wordTypes = stuckWords.slice(0, 5).map(w => w.word).join(', ');
      recommendations.push({
        type: 'stuck_words',
        message: `${stuckWords.length} words need more practice together: ${wordTypes}`,
        action_type: 'challenge',
      });
    }

    // Inactivity recommendation - only show if partner HAS practiced before but stopped
    const lastPractice = partnerProfile?.last_practice_at ? new Date(partnerProfile.last_practice_at) : null;
    if (lastPractice) {
      const daysSincePractice = Math.floor((Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePractice >= 3) {
        recommendations.push({
          type: 'inactivity',
          message: `Great opportunity to play together! ${partnerProfile?.full_name || 'Your partner'} hasn't practiced in ${daysSincePractice} days.`,
          action_type: 'love_note',
        });
      }
    }

    // Variety recommendation
    if (avgScore > 90 && tutorResults.length >= 5) {
      recommendations.push({
        type: 'variety',
        message: `Quiz is working great! Try Quick Fire for variety and speed challenge.`,
        action_type: 'challenge',
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        // Teaching impact
        xp_contributed: xpContributed,
        words_mastered: wordsMasteredCount,
        challenge_success_rate: avgScore,

        // Trends
        xp_trend: xpTrend,
        words_trend: wordsTrend,
        accuracy_trend: accuracyTrend,

        // Challenge analytics
        challenges_completed: tutorResults.length,
        challenges_total: tutorChallenges?.length || 0,
        average_score: avgScore,
        recent_results: tutorResults.slice(0, 5).map(r => ({
          id: r.challenge_id,
          score: r.score,
          date: r.completed_at,
        })),

        // Weak spots
        stuck_words: stuckWords,
        improving_words: improvingWords,

        // Learning velocity
        words_per_week: wordsThisWeek || 0,
        mastery_rate_days: avgMasteryDays,
        practice_consistency: activeDays,
        current_streak: 0, // TODO: Calculate from partner's data

        // Recommendations
        recommendations: recommendations.slice(0, 3),
      },
      partner: {
        name: partnerProfile?.full_name,
        xp: partnerProfile?.xp || 0,
        lastPractice: partnerProfile?.last_practice_at,
      },
      period,
    });
  } catch (error: any) {
    console.error('[tutor-analytics] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
