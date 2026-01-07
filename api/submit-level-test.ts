import { createClient } from '@supabase/supabase-js';
import { batchSmartValidate, ValidationResult } from '../services/validation';

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
    console.error('Auth verification failed:', error?.message || 'No user');
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

    // Grade the answers using BATCH smart validation (one Gemini call for all answers)
    const questions = test.questions as any[];
    const answersMap = new Map<string, string>();
    answers.forEach((a: Answer) => answersMap.set(a.questionId, a.userAnswer));

    // Prepare all answers for batch validation
    const validationInputs = questions.map((q: any) => ({
      userAnswer: answersMap.get(q.id) || '',
      correctAnswer: q.correctAnswer,
      polishWord: q.polish
    }));

    // ONE Gemini call for ALL answers (instead of N calls)
    const validationResults = await batchSmartValidate(validationInputs);

    // Build a map of results by index for easy lookup
    const resultMap = new Map<number, ValidationResult>();
    validationResults.forEach(r => resultMap.set(r.index, r));

    // Process results
    let correctCount = 0;
    const gradedAnswers: Array<{
      questionId: string;
      userAnswer: string;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string;
    }> = [];

    questions.forEach((q: any, index: number) => {
      const userAnswer = answersMap.get(q.id) || '';
      const validation = resultMap.get(index) || { accepted: false, explanation: 'Not validated' };

      if (validation.accepted) correctCount++;

      gradedAnswers.push({
        questionId: q.id,
        userAnswer,
        isCorrect: validation.accepted,
        correctAnswer: q.correctAnswer,
        explanation: validation.explanation
      });
    });

    // Update questions with user answers and explanations for later review
    const questionsWithAnswers = questions.map((q, idx) => ({
      ...q,
      userAnswer: answersMap.get(q.id) || '',
      isCorrect: gradedAnswers[idx]?.isCorrect ?? false,
      explanation: gradedAnswers[idx]?.explanation ?? ''
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
    let levelUpdateError = null;
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

        if (profileError) {
          console.error('Failed to update user level after passing test:', profileError);
          levelUpdateError = 'Test passed but level update failed. Please refresh to sync.';
        } else {
          newLevel = toLevel;
        }
      } else {
        console.error('Invalid level format:', toLevel);
        levelUpdateError = 'Test passed but level format was invalid.';
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
      levelUpdateError,
      gradedAnswers
    });

  } catch (error: any) {
    console.error('Error submitting test:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
