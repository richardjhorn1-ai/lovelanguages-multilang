import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
} from '../utils/api-middleware.js';
import { ACHIEVEMENT_DEFINITIONS } from '../constants/levels.js';

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

    // Get user's profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, linked_user_id')
      .eq('id', auth.userId)
      .single();

    // Get user's unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_code, unlocked_at')
      .eq('user_id', auth.userId);

    const unlockedCodes = new Map(
      userAchievements?.map(a => [a.achievement_code, a.unlocked_at]) || []
    );

    // Also get partner's achievements for couple achievements
    let partnerAchievements: Map<string, string> = new Map();
    if (profile?.linked_user_id) {
      const { data: partnerData } = await supabase
        .from('user_achievements')
        .select('achievement_code, unlocked_at')
        .eq('user_id', profile.linked_user_id);

      partnerAchievements = new Map(
        partnerData?.map(a => [a.achievement_code, a.unlocked_at]) || []
      );
    }

    // Build response with all achievements and their unlock status
    const achievements = ACHIEVEMENT_DEFINITIONS.map(def => {
      const userUnlocked = unlockedCodes.get(def.code);
      const partnerUnlocked = partnerAchievements.get(def.code);

      // For couple achievements, both need to have it
      let unlocked = !!userUnlocked;
      let unlockedAt = userUnlocked || null;

      if (def.category === 'couple') {
        // Couple achievements: show as unlocked if both have it
        unlocked = !!userUnlocked && !!partnerUnlocked;
        unlockedAt = unlocked
          ? userUnlocked! > partnerUnlocked! ? userUnlocked : partnerUnlocked
          : null;
      }

      return {
        ...def,
        unlocked,
        unlockedAt,
      };
    });

    // Group by category
    const grouped = {
      tutor: achievements.filter(a => a.category === 'tutor'),
      student: achievements.filter(a => a.category === 'student'),
      couple: achievements.filter(a => a.category === 'couple'),
    };

    // Calculate stats
    const totalAchievements = achievements.length;
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return res.status(200).json({
      success: true,
      achievements: grouped,
      stats: {
        total: totalAchievements,
        unlocked: unlockedCount,
        percentage: Math.round((unlockedCount / totalAchievements) * 100),
      },
      userRole: profile?.role,
    });
  } catch (error: any) {
    console.error('[achievements] Error:', error);
    return res.status(500).json({ error: 'Failed to get achievements' });
  }
}
