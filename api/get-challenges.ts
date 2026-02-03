import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';

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

    const { status, role, targetLanguage: requestedLanguage } = req.body || {};

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
      return res.status(500).json({ error: 'Failed to fetch challenges' });
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

    return res.status(200).json({
      success: true,
      challenges: challengesWithResults
    });

  } catch (error: any) {
    console.error('[get-challenges] Error:', error);
    return res.status(500).json({ error: 'Failed to load challenges. Please try again.' });
  }
}
