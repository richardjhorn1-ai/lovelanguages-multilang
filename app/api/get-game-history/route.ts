import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
} from '@/utils/api-middleware';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';
    const gameMode = searchParams.get('gameMode');

    // If sessionId provided, return single session with answers
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', auth.userId)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: corsHeaders });
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

      return NextResponse.json({
        success: true,
        session: {
          ...session,
          answers: answers || []
        }
      }, { headers: corsHeaders });
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
      return NextResponse.json({ error: 'Failed to fetch game history' }, { status: 500, headers: corsHeaders });
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

    return NextResponse.json({
      success: true,
      sessions: sessionsWithWrongCount,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[get-game-history] Error:', error);
    return NextResponse.json({ error: 'Failed to load game history. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
