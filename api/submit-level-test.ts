import { createClient } from '@supabase/supabase-js';

// Inline constant to avoid module resolution issues in Vercel serverless
const PASS_THRESHOLD = 80;

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
    return null;
  }

  return { userId: user.id };
}

interface Answer {
  questionId: string;
  userAnswer: string;
}

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { testId, answers } = body || {};

  if (!testId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Missing testId or answers' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch the test record
    const { data: test, error: fetchError } = await supabase
      .from('level_tests')
      .select('*')
      .eq('id', testId)
      .eq('user_id', auth.userId)
      .single();

    if (fetchError || !test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.completed_at) {
      return res.status(400).json({ error: 'Test already completed' });
    }

    // Grade the answers
    const questions = test.questions as any[];
    const answersMap = new Map<string, string>();
    answers.forEach((a: Answer) => answersMap.set(a.questionId, a.userAnswer));

    let correctCount = 0;
    const gradedAnswers = questions.map(q => {
      const userAnswer = answersMap.get(q.id) || '';
      // Normalize answers for comparison (lowercase, trim)
      const normalizedUser = userAnswer.toLowerCase().trim();
      const normalizedCorrect = q.correctAnswer.toLowerCase().trim();

      // For fill-in-blank, be lenient with accent marks and minor typos
      const isCorrect = normalizedUser === normalizedCorrect ||
        // Remove Polish diacritics for fuzzy matching
        normalizedUser.normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
        normalizedCorrect.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        userAnswer,
        isCorrect,
        correctAnswer: q.correctAnswer
      };
    });

    // Update questions with user answers for later review
    const questionsWithAnswers = questions.map(q => ({
      ...q,
      userAnswer: answersMap.get(q.id) || ''
    }));

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    // Update test record with questions including user answers
    const { error: updateError } = await supabase
      .from('level_tests')
      .update({
        passed,
        score,
        correct_answers: correctCount,
        completed_at: new Date().toISOString(),
        questions: questionsWithAnswers
      })
      .eq('id', testId);

    if (updateError) {
      console.error('Failed to update test:', updateError);
      return res.status(500).json({ error: 'Failed to save results' });
    }

    // If passed, update user's level in profile
    let newLevel = null;
    if (passed) {
      // Parse the level number from string like "Beginner 2"
      const toLevel = test.to_level;
      const match = toLevel.match(/^(.+)\s+(\d)$/);

      if (match) {
        const tierName = match[1];
        const levelNum = parseInt(match[2], 10);

        // Calculate numeric level for database
        // Beginner = levels 1-3, Elementary = 4-6, etc.
        const tierOrder = ['Beginner', 'Elementary', 'Conversational', 'Proficient', 'Fluent', 'Master'];
        const tierIndex = tierOrder.indexOf(tierName);
        const numericLevel = tierIndex * 3 + levelNum;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ level: numericLevel })
          .eq('id', auth.userId);

        if (!profileError) {
          newLevel = toLevel;
        }
      }
    }

    return res.status(200).json({
      success: true,
      testId,
      passed,
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      passThreshold: PASS_THRESHOLD,
      newLevel,
      gradedAnswers
    });

  } catch (error: any) {
    console.error('Error submitting test:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
