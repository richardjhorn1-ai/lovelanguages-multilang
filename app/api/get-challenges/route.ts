import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
} from '@/utils/api-middleware';
import { getProfileLanguages } from '@/utils/language-helpers';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
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

    const { status, role, targetLanguage: requestedLanguage } = await request.json() || {};

    // Get user's profile to determine role and language
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, linked_user_id')
      .eq('id', auth.userId)
      .single();

    const userRole = role || profile?.role || 'student';

    // Get target language - use request param, or fetch from profile
    // For tutors, we use student's language; for students, their own
    let targetLanguage = requestedLanguage;
    if (!targetLanguage) {
      if (userRole === 'tutor' && profile?.linked_user_id) {
        const langs = await getProfileLanguages(supabase, profile.linked_user_id);
        targetLanguage = langs.targetLanguage;
      } else {
        const langs = await getProfileLanguages(supabase, auth.userId);
        targetLanguage = langs.targetLanguage;
      }
    }

    // Build query based on role - select only needed columns
    let query = supabase
      .from('tutor_challenges')
      .select('id, title, challenge_type, status, created_at, tutor_id, student_id, config, words_data, language_code')
      .order('created_at', { ascending: false });

    if (userRole === 'tutor') {
      query = query.eq('tutor_id', auth.userId);
    } else {
      query = query.eq('student_id', auth.userId);
    }

    // Filter by language to prevent cross-language pollution
    if (targetLanguage) {
      query = query.eq('language_code', targetLanguage);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: challenges, error: challengesError } = await query;

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500, headers: corsHeaders });
    }

    // Fetch results for completed challenges
    const completedIds = (challenges || [])
      .filter(c => c.status === 'completed')
      .map(c => c.id);

    let results: any[] = [];
    if (completedIds.length > 0) {
      const { data: resultsData } = await supabase
        .from('challenge_results')
        .select('challenge_id, score, correct_answers, total_questions, xp_earned, completed_at')
        .in('challenge_id', completedIds);
      results = resultsData || [];
    }

    // Merge results into challenges
    const challengesWithResults = (challenges || []).map(c => ({
      ...c,
      result: results.find(r => r.challenge_id === c.id) || null
    }));

    return NextResponse.json({
      success: true,
      challenges: challengesWithResults
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[get-challenges] Error:', error);
    return NextResponse.json({ error: 'Failed to load challenges. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
