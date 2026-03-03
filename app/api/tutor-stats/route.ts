import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
} from '@/utils/api-middleware';
import { getTutorTierFromXP, getTutorTierProgress, getXPToNextTutorTier } from '@/constants/levels';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Get tutor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tutor_xp, tutor_tier, role, linked_user_id')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders });
    }

    if (profile.role !== 'tutor') {
      return NextResponse.json({ error: 'User is not a tutor' }, { status: 400, headers: corsHeaders });
    }

    // Get tutor stats
    const { data: stats } = await supabase
      .from('tutor_stats')
      .select('*')
      .eq('user_id', auth.userId)
      .maybeSingle();

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

    return NextResponse.json({
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
          ...(a.achievement || {}),  // Guard against null achievement data
        })) || [],
      },
      partner: partnerStats,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[tutor-stats] Error:', error);
    return NextResponse.json({ error: 'Failed to get tutor stats' }, { status: 500, headers: corsHeaders });
  }
}
