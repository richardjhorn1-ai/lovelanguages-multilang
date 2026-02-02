import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';
import { getTutorTierFromXP, getTutorTierProgress, getXPToNextTutorTier } from '../constants/levels.js';

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

    // Get tutor stats
    const { data: stats } = await supabase
      .from('tutor_stats')
      .select('*')
      .eq('user_id', auth.userId)
      .single();

    // Get achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievement_code(name, description, icon, category, xp_reward)
      `)
      .eq('user_id', auth.userId);

    // Calculate tier info
    const xp = profile.tutor_xp || 0;
    const tier = getTutorTierFromXP(xp);
    const progress = getTutorTierProgress(xp);
    const xpToNext = getXPToNextTutorTier(xp);

    // Get partner info if linked
    let partnerStats = null;
    if (profile.linked_user_id) {
      const { data: partner } = await supabase
        .from('profiles')
        .select('full_name, xp, level, last_practice_at')
        .eq('id', profile.linked_user_id)
        .single();

      if (partner) {
        // Get partner's dictionary count
        const { count: wordCount } = await supabase
          .from('dictionary')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.linked_user_id);

        // Get partner's mastered words
        const { count: masteredCount } = await supabase
          .from('word_scores')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.linked_user_id)
          .not('learned_at', 'is', null);

        partnerStats = {
          name: partner.full_name,
          xp: partner.xp || 0,
          level: partner.level,
          lastPractice: partner.last_practice_at,
          totalWords: wordCount || 0,
          masteredWords: masteredCount || 0,
        };
      }
    }

    return res.status(200).json({
      success: true,
      tutor: {
        xp,
        tier: {
          number: tier.tier,
          name: tier.name,
          progress,
          xpToNext,
        },
        stats: {
          challengesCreated: stats?.challenges_created || 0,
          giftsSent: stats?.gifts_sent || 0,
          perfectScores: stats?.perfect_scores || 0,
          wordsMastered: stats?.words_mastered || 0,
          teachingStreak: stats?.teaching_streak || 0,
          longestStreak: stats?.longest_streak || 0,
          lastTeachingAt: stats?.last_teaching_at || null,
        },
        achievements: achievements?.map(a => ({
          code: a.achievement_code,
          unlockedAt: a.unlocked_at,
          ...a.achievement,
        })) || [],
      },
      partner: partnerStats,
    });
  } catch (error: any) {
    console.error('[tutor-stats] Error:', error);
    return res.status(500).json({ error: 'Failed to get tutor stats' });
  }
}
