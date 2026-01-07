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

interface GameAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it';
  isCorrect: boolean;
  explanation?: string;
}

interface SubmitSessionRequest {
  gameMode: string;
  correctCount: number;
  incorrectCount: number;
  totalTimeSeconds?: number;
  answers: GameAnswer[];
  targetUserId?: string; // For tutors saving to their partner's progress
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

    const { gameMode, correctCount, incorrectCount, totalTimeSeconds, answers, targetUserId } = req.body as SubmitSessionRequest;

    if (!gameMode || answers === undefined) {
      return res.status(400).json({ error: 'Missing required fields: gameMode and answers' });
    }

    // Determine which user to save the session for
    let sessionUserId = auth.userId;

    // If targetUserId is provided, verify the requesting user is linked to that user
    if (targetUserId && targetUserId !== auth.userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('linked_user_id, role')
        .eq('id', auth.userId)
        .single();

      if (profileError || !profile) {
        return res.status(403).json({ error: 'Could not verify user profile' });
      }

      // Only allow if the requesting user is a tutor linked to the target user
      if (profile.role !== 'tutor' || profile.linked_user_id !== targetUserId) {
        return res.status(403).json({ error: 'Not authorized to save to this user\'s progress' });
      }

      sessionUserId = targetUserId;
    }

    // Create the game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: sessionUserId,
        game_mode: gameMode,
        correct_count: correctCount || 0,
        incorrect_count: incorrectCount || 0,
        total_time_seconds: totalTimeSeconds || null,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating game session:', sessionError);
      return res.status(500).json({ error: 'Failed to create game session' });
    }

    // Insert answers if provided
    if (answers && answers.length > 0) {
      const answerRecords = answers.map((answer, index) => ({
        session_id: session.id,
        word_id: answer.wordId || null,
        word_text: answer.wordText,
        correct_answer: answer.correctAnswer,
        user_answer: answer.userAnswer || null,
        question_type: answer.questionType,
        is_correct: answer.isCorrect,
        explanation: answer.explanation || null,
        order_index: index
      }));

      const { error: answersError } = await supabase
        .from('game_session_answers')
        .insert(answerRecords);

      if (answersError) {
        console.error('Error inserting answers:', answersError);
        // Don't fail the whole request, session is already created
        // Return warning (not error) so client knows it's non-fatal
        return res.status(200).json({
          success: true,
          sessionId: session.id,
          session,
          warning: 'Session saved but detailed answers may be incomplete'
        });
      }
    }

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      session
    });

  } catch (error: any) {
    console.error('Submit game session error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
