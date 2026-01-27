import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '../utils/api-middleware.js';
import { buildAnswerValidationPrompt } from '../utils/prompt-templates.js';
import { buildBatchValidationSchema } from '../utils/schema-builders.js';

// Inline constant to avoid module resolution issues in Vercel serverless
const PASS_THRESHOLD = 80;

// ============================================================================
// INLINE VALIDATION (Vercel serverless can't import from ../services/)
// ============================================================================

interface ValidationResult {
  index: number;
  accepted: boolean;
  explanation: string;
}

interface AnswerToValidate {
  userAnswer: string;
  correctAnswer: string;
  targetWord?: string;
}

function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}

async function batchSmartValidate(
  answers: AnswerToValidate[],
  targetLanguage: string,
  nativeLanguage: string,
  apiKey?: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const needsAiValidation: Array<{ index: number } & AnswerToValidate> = [];

  answers.forEach((answer, index) => {
    if (fastMatch(answer.userAnswer, answer.correctAnswer)) {
      results.push({ index, accepted: true, explanation: 'Exact match' });
    } else {
      needsAiValidation.push({ index, ...answer });
    }
  });

  if (needsAiValidation.length === 0) {
    return results;
  }

  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    needsAiValidation.forEach(item => {
      results.push({ index: item.index, accepted: false, explanation: 'No match (strict mode)' });
    });
    return results;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const answersText = needsAiValidation.map((item, i) =>
      `${i + 1}. Expected: "${item.correctAnswer}" | User typed: "${item.userAnswer}"${item.targetWord ? ` | Target word: "${item.targetWord}"` : ''}`
    ).join('\n');

    const basePrompt = buildAnswerValidationPrompt(targetLanguage, nativeLanguage);
    const prompt = `${basePrompt}

## ANSWERS TO VALIDATE (${needsAiValidation.length} total)

${answersText}

Return validation results for each answer.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: buildBatchValidationSchema()
      }
    });

    const responseText = result.text || '[]';
    const validations = JSON.parse(responseText) as Array<{ accepted: boolean; explanation: string }>;

    needsAiValidation.forEach((item, i) => {
      const validation = validations[i] || { accepted: false, explanation: 'Validation error' };
      results.push({
        index: item.index,
        accepted: validation.accepted,
        explanation: validation.explanation
      });
    });

  } catch (error) {
    console.error('Batch validation error:', error);
    needsAiValidation.forEach(item => {
      results.push({ index: item.index, accepted: false, explanation: 'Validation error' });
    });
  }

  return results;
}

// ============================================================================

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

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Block free users
  const sub = await requireSubscription(supabase, auth.userId);
  if (!sub.allowed) {
    return res.status(403).json({ error: sub.error });
  }

  // Check rate limit
  const limit = await checkRateLimit(supabase, auth.userId, 'submitLevelTest', sub.plan as SubscriptionPlan);
  if (!limit.allowed) {
    return res.status(429).json({
      error: limit.error,
      remaining: limit.remaining,
      resetAt: limit.resetAt
    });
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

    // Get languages from test record (set during generation)
    const targetLanguage = test.language_code || 'pl';
    const nativeLanguage = test.native_language || 'en';

    // Grade the answers using BATCH smart validation (one Gemini call for all answers)
    const questions = test.questions as any[];
    const answersMap = new Map<string, string>();
    answers.forEach((a: Answer) => answersMap.set(a.questionId, a.userAnswer));

    // Prepare all answers for batch validation
    const validationInputs = questions.map((q: any) => ({
      userAnswer: answersMap.get(q.id) || '',
      correctAnswer: q.correctAnswer,
      targetWord: q.targetText
    }));

    // ONE Gemini call for ALL answers (instead of N calls)
    const validationResults = await batchSmartValidate(
      validationInputs,
      targetLanguage,
      nativeLanguage
    );

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

    // Increment usage counter
    incrementUsage(supabase, auth.userId, RATE_LIMITS.submitLevelTest.type);

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
