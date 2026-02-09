import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';
import {
  TUTOR_XP_AWARDS,
  getTutorTierFromXP,
  ACHIEVEMENT_DEFINITIONS,
} from '../constants/levels.js';

// XP action types
type TutorXPAction =
  | 'create_challenge'
  | 'send_word_gift'
  | 'partner_completes_challenge'
  | 'partner_scores_80_plus'
  | 'partner_scores_100'
  | 'partner_masters_gifted_word'
  | 'streak_7_days'
  | 'streak_30_days';

// Map actions to XP values
const ACTION_XP_MAP: Record<TutorXPAction, number> = {
  create_challenge: TUTOR_XP_AWARDS.CREATE_CHALLENGE,
  send_word_gift: TUTOR_XP_AWARDS.SEND_WORD_GIFT,
  partner_completes_challenge: TUTOR_XP_AWARDS.PARTNER_COMPLETES_CHALLENGE,
  partner_scores_80_plus: TUTOR_XP_AWARDS.PARTNER_SCORES_80_PLUS,
  partner_scores_100: TUTOR_XP_AWARDS.PARTNER_SCORES_100,
  partner_masters_gifted_word: TUTOR_XP_AWARDS.PARTNER_MASTERS_GIFTED_WORD,
  streak_7_days: TUTOR_XP_AWARDS.STREAK_7_DAYS,
  streak_30_days: TUTOR_XP_AWARDS.STREAK_30_DAYS,
};

// Actions that count toward stats
const STAT_ACTIONS: Record<string, keyof typeof STAT_UPDATES> = {
  create_challenge: 'challenges_created',
  send_word_gift: 'gifts_sent',
  partner_scores_100: 'perfect_scores',
  partner_masters_gifted_word: 'words_mastered',
};

const STAT_UPDATES = {
  challenges_created: 1,
  gifts_sent: 1,
  perfect_scores: 1,
  words_mastered: 1,
};

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

    const { action, targetUserId } = req.body;

    if (!action || !ACTION_XP_MAP[action as TutorXPAction]) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Determine tutor ID - either the caller or the partner of the caller
    let tutorId = auth.userId;

    // For partner-triggered actions (like challenge completion), use the partner as tutor
    if (targetUserId) {
      // Verify the target is linked to the caller
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('linked_user_id, role')
        .eq('id', auth.userId)
        .single();

      if (callerProfile?.linked_user_id === targetUserId) {
        tutorId = targetUserId;
      } else {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
    }

    // Verify tutorId is actually a tutor
    const { data: tutorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('tutor_xp, tutor_tier, role')
      .eq('id', tutorId)
      .single();

    if (profileError || !tutorProfile) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    if (tutorProfile.role !== 'tutor') {
      return res.status(400).json({ error: 'User is not a tutor' });
    }

    // Calculate new XP and tier
    const xpToAdd = ACTION_XP_MAP[action as TutorXPAction];
    const currentXp = tutorProfile.tutor_xp || 0;
    const newXp = currentXp + xpToAdd;
    const newTier = getTutorTierFromXP(newXp);
    const oldTier = getTutorTierFromXP(currentXp);

    // Update tutor XP and tier
    await supabase
      .from('profiles')
      .update({
        tutor_xp: newXp,
        tutor_tier: newTier.tier,
      })
      .eq('id', tutorId);

    // Update tutor stats if applicable
    const statField = STAT_ACTIONS[action];
    if (statField) {
      // Upsert tutor stats
      const { data: existingStats } = await supabase
        .from('tutor_stats')
        .select('*')
        .eq('user_id', tutorId)
        .maybeSingle();

      if (existingStats) {
        const updateData: any = {
          [statField]: (existingStats[statField] || 0) + 1,
          last_teaching_at: new Date().toISOString(),
        };

        // Update teaching streak logic
        const lastTeaching = existingStats.last_teaching_at
          ? new Date(existingStats.last_teaching_at)
          : null;
        const now = new Date();
        const hoursSinceLastTeaching = lastTeaching
          ? (now.getTime() - lastTeaching.getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursSinceLastTeaching <= 48) {
          // Within grace period, check if it's a new day
          const lastTeachingDay = lastTeaching?.toDateString();
          const today = now.toDateString();
          if (lastTeachingDay !== today) {
            updateData.teaching_streak = (existingStats.teaching_streak || 0) + 1;
            // Update longest streak if needed
            if (updateData.teaching_streak > (existingStats.longest_streak || 0)) {
              updateData.longest_streak = updateData.teaching_streak;
            }
          }
        } else if (!existingStats.streak_frozen_until || new Date(existingStats.streak_frozen_until) < now) {
          // Streak broken (and not frozen)
          updateData.teaching_streak = 1;
        }

        await supabase
          .from('tutor_stats')
          .update(updateData)
          .eq('user_id', tutorId);
      } else {
        // Create new stats row
        await supabase.from('tutor_stats').insert({
          user_id: tutorId,
          [statField]: 1,
          teaching_streak: 1,
          longest_streak: 1,
          last_teaching_at: new Date().toISOString(),
        });
      }
    }

    // Check for achievements
    const unlockedAchievements: string[] = [];
    let totalXpAwarded = xpToAdd;
    let finalXp = newXp;

    // Get current stats for achievement checks
    const { data: stats } = await supabase
      .from('tutor_stats')
      .select('*')
      .eq('user_id', tutorId)
      .maybeSingle();

    // Get already unlocked achievements
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_code')
      .eq('user_id', tutorId);

    const unlockedCodes = new Set(existingAchievements?.map(a => a.achievement_code) || []);

    // Check tutor achievements
    const achievementsToCheck = [
      { code: 'first_challenge', condition: stats?.challenges_created >= 1 },
      { code: 'first_gift', condition: stats?.gifts_sent >= 1 },
      { code: 'challenge_champion', condition: stats?.challenges_created >= 10 },
      { code: 'gift_giver', condition: stats?.gifts_sent >= 10 },
      { code: 'perfect_score', condition: stats?.perfect_scores >= 1 },
      { code: 'teaching_pro', condition: stats?.perfect_scores >= 5 },
      { code: 'week_warrior_tutor', condition: stats?.teaching_streak >= 7 },
      { code: 'month_of_love', condition: stats?.teaching_streak >= 30 },
    ];

    // Calculate total achievement XP first
    let totalAchievementXp = 0;
    const achievementsToUnlock: Array<{ code: string; xp_reward: number }> = [];

    for (const check of achievementsToCheck) {
      if (check.condition && !unlockedCodes.has(check.code)) {
        const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === check.code);
        if (achievement) {
          achievementsToUnlock.push({ code: check.code, xp_reward: achievement.xp_reward });
          totalAchievementXp += achievement.xp_reward || 0;
        }
      }
    }

    // Insert achievements and update XP in single batch
    for (const achievement of achievementsToUnlock) {
      await supabase.from('user_achievements').insert({
        user_id: tutorId,
        achievement_code: achievement.code,
      });
      unlockedAchievements.push(achievement.code);
    }

    // Single XP update for all achievements
    if (totalAchievementXp > 0) {
      finalXp = newXp + totalAchievementXp;
      totalXpAwarded += totalAchievementXp;
      await supabase
        .from('profiles')
        .update({ tutor_xp: finalXp })
        .eq('id', tutorId);
    }

    // Check for tier up (use final XP for accurate tier calculation)
    const finalTier = getTutorTierFromXP(finalXp);
    const tierUp = finalTier.tier > oldTier.tier;

    return res.status(200).json({
      success: true,
      xpAwarded: totalXpAwarded,
      newTotalXp: finalXp,
      newTier: finalTier.name,
      tierUp,
      unlockedAchievements,
    });
  } catch (error: any) {
    console.error('[tutor-award-xp] Error:', error);
    return res.status(500).json({ error: 'Failed to award XP' });
  }
}
