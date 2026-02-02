import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';
import { ACHIEVEMENT_DEFINITIONS, LEVEL_TIERS } from '../constants/levels.js';

interface AchievementCheck {
  code: string;
  condition: boolean;
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, xp, linked_user_id')
      .eq('id', auth.userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get already unlocked achievements
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_code')
      .eq('user_id', auth.userId);

    const unlockedCodes = new Set(existingAchievements?.map(a => a.achievement_code) || []);

    // Gather data for checking student achievements
    let studentChecks: AchievementCheck[] = [];

    if (profile.role === 'student') {
      // Get dictionary count
      const { count: wordCount } = await supabase
        .from('dictionary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.userId);

      // Get mastered word count
      const { count: masteredCount } = await supabase
        .from('word_scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.userId)
        .not('learned_at', 'is', null);

      // Get challenge completion count
      const { count: challengeCount } = await supabase
        .from('challenge_results')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', auth.userId);

      // Calculate current tier
      const xp = profile.xp || 0;
      let currentTier = 'Beginner';
      for (const tier of LEVEL_TIERS) {
        if (xp >= tier.xpRange[0] && xp < tier.xpRange[1]) {
          currentTier = tier.tier;
          break;
        }
      }

      studentChecks = [
        { code: 'first_word', condition: (wordCount || 0) >= 1 },
        { code: 'word_collector', condition: (wordCount || 0) >= 50 },
        { code: 'first_mastery', condition: (masteredCount || 0) >= 1 },
        { code: 'memory_master', condition: (masteredCount || 0) >= 10 },
        { code: 'challenge_accepted', condition: (challengeCount || 0) >= 1 },
        { code: 'challenge_crusher', condition: (challengeCount || 0) >= 10 },
        { code: 'conversation_ready', condition: ['Conversational', 'Proficient', 'Fluent', 'Master'].includes(currentTier) },
      ];
    }

    // Gather data for checking tutor achievements
    let tutorChecks: AchievementCheck[] = [];

    if (profile.role === 'tutor') {
      const { data: stats } = await supabase
        .from('tutor_stats')
        .select('*')
        .eq('user_id', auth.userId)
        .single();

      tutorChecks = [
        { code: 'first_challenge', condition: (stats?.challenges_created || 0) >= 1 },
        { code: 'first_gift', condition: (stats?.gifts_sent || 0) >= 1 },
        { code: 'challenge_champion', condition: (stats?.challenges_created || 0) >= 10 },
        { code: 'gift_giver', condition: (stats?.gifts_sent || 0) >= 10 },
        { code: 'perfect_score', condition: (stats?.perfect_scores || 0) >= 1 },
        { code: 'teaching_pro', condition: (stats?.perfect_scores || 0) >= 5 },
        { code: 'week_warrior_tutor', condition: (stats?.teaching_streak || 0) >= 7 },
        { code: 'month_of_love', condition: (stats?.teaching_streak || 0) >= 30 },
      ];
    }

    // Check couple achievements if linked
    let coupleChecks: AchievementCheck[] = [];

    if (profile.linked_user_id) {
      // Get challenge exchange count
      const { count: sentChallenges } = await supabase
        .from('tutor_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', auth.userId)
        .eq('status', 'completed');

      const { count: receivedChallenges } = await supabase
        .from('tutor_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', auth.userId)
        .eq('status', 'completed');

      // Check gift exchange
      const { count: giftsSent } = await supabase
        .from('word_requests')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', auth.userId)
        .eq('status', 'completed');

      const { count: giftsReceived } = await supabase
        .from('word_requests')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', auth.userId)
        .eq('status', 'completed');

      // Check account age for one_month_strong
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', profile.linked_user_id)
        .single();

      const { data: userCreated } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', auth.userId)
        .single();

      const linkDate = userCreated?.created_at ? new Date(userCreated.created_at) : new Date();
      const now = new Date();
      const daysTogether = (now.getTime() - linkDate.getTime()) / (1000 * 60 * 60 * 24);

      coupleChecks = [
        {
          code: 'first_dance',
          condition: ((sentChallenges || 0) >= 1 || (receivedChallenges || 0) >= 1),
        },
        {
          code: 'perfect_pair',
          condition: ((sentChallenges || 0) + (receivedChallenges || 0)) >= 10,
        },
        {
          code: 'gift_exchange',
          condition: (giftsSent || 0) >= 1 && (giftsReceived || 0) >= 1,
        },
        {
          code: 'one_month_strong',
          condition: daysTogether >= 30,
        },
      ];
    }

    // Combine all checks
    const allChecks = [...studentChecks, ...tutorChecks, ...coupleChecks];

    // Find newly unlocked achievements
    const newlyUnlocked: Array<{
      code: string;
      name: string;
      description: string;
      icon: string;
      xp_reward: number;
    }> = [];

    for (const check of allChecks) {
      if (check.condition && !unlockedCodes.has(check.code)) {
        const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.code === check.code);
        if (achievement) {
          // Insert achievement
          const { error } = await supabase.from('user_achievements').insert({
            user_id: auth.userId,
            achievement_code: check.code,
          });

          if (!error) {
            newlyUnlocked.push({
              code: achievement.code,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              xp_reward: achievement.xp_reward,
            });

            // Award XP if applicable
            if (achievement.xp_reward > 0) {
              const xpField = profile.role === 'tutor' ? 'tutor_xp' : 'xp';
              const currentXp = profile.role === 'tutor'
                ? (await supabase.from('profiles').select('tutor_xp').eq('id', auth.userId).single()).data?.tutor_xp || 0
                : profile.xp || 0;

              await supabase
                .from('profiles')
                .update({ [xpField]: currentXp + achievement.xp_reward })
                .eq('id', auth.userId);
            }

            // Add to activity feed
            await supabase.from('activity_feed').insert({
              user_id: auth.userId,
              partner_id: profile.linked_user_id,
              event_type: 'achievement_unlocked',
              title: `Unlocked: ${achievement.name}`,
              subtitle: achievement.description,
              data: { code: achievement.code, icon: achievement.icon },
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      newlyUnlocked,
      totalChecked: allChecks.length,
    });
  } catch (error: any) {
    console.error('[check-achievements] Error:', error);
    return res.status(500).json({ error: 'Failed to check achievements' });
  }
}
