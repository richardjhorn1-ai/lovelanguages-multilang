import { createClient } from '@supabase/supabase-js';

// CORS configuration
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { status, role } = req.body || {};

    // Get user's profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single();

    const userRole = role || profile?.role || 'student';

    // Build query based on role - select only needed columns
    let query = supabase
      .from('tutor_challenges')
      .select('id, title, challenge_type, status, created_at, tutor_id, student_id, config, words_data')
      .order('created_at', { ascending: false });

    if (userRole === 'tutor') {
      query = query.eq('tutor_id', auth.userId);
    } else {
      query = query.eq('student_id', auth.userId);
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
    console.error('Get challenges error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
