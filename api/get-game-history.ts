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

  if (req.method !== 'GET') {
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

    // Parse query params
    const { sessionId, limit = '20', offset = '0', gameMode } = req.query;

    // If sessionId provided, return single session with answers
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', auth.userId)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get answers for this session
      const { data: answers, error: answersError } = await supabase
        .from('game_session_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (answersError) {
        console.error('Error fetching answers:', answersError);
      }

      return res.status(200).json({
        success: true,
        session: {
          ...session,
          answers: answers || []
        }
      });
    }

    // Otherwise, return paginated list of sessions
    let query = supabase
      .from('game_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.userId)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (gameMode) {
      query = query.eq('game_mode', gameMode);
    }

    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: 'Failed to fetch game history' });
    }

    // For each session, get count of wrong answers
    const sessionsWithWrongCount = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count: wrongCount } = await supabase
          .from('game_session_answers')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)
          .eq('is_correct', false);

        return {
          ...session,
          wrong_answer_count: wrongCount || 0
        };
      })
    );

    return res.status(200).json({
      success: true,
      sessions: sessionsWithWrongCount,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error: any) {
    console.error('Get game history error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
