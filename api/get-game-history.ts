import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';

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

    // Get wrong answer counts for all sessions in ONE query (not N+1)
    const sessionIds = (sessions || []).map(s => s.id);
    let wrongCountMap: Record<string, number> = {};

    if (sessionIds.length > 0) {
      // Use a single aggregation query instead of N separate queries
      const { data: wrongCounts } = await supabase
        .from('game_session_answers')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('is_correct', false);

      // Count occurrences per session_id
      (wrongCounts || []).forEach((row: any) => {
        wrongCountMap[row.session_id] = (wrongCountMap[row.session_id] || 0) + 1;
      });
    }

    const sessionsWithWrongCount = (sessions || []).map(session => ({
      ...session,
      wrong_answer_count: wrongCountMap[session.id] || 0
    }));

    return res.status(200).json({
      success: true,
      sessions: sessionsWithWrongCount,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error: any) {
    console.error('[get-game-history] Error:', error);
    return res.status(500).json({ error: 'Failed to load game history. Please try again.' });
  }
}
