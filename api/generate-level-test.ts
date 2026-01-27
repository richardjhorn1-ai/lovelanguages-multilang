import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
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
import { extractLanguages } from '../utils/language-helpers.js';
import { buildLevelTestPrompt } from '../utils/prompt-templates.js';
import { buildLevelTestSchema } from '../utils/schema-builders.js';
import {
  QUESTION_COUNTS,
  CORE_QUESTIONS_RATIO,
  getThemeForTransition
} from '../constants/levels.js';

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
  const limit = await checkRateLimit(supabase, auth.userId, 'generateLevelTest', sub.plan as SubscriptionPlan);
  if (!limit.allowed) {
    return res.status(429).json({
      error: limit.error,
      remaining: limit.remaining,
      resetAt: limit.resetAt
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { fromLevel, toLevel } = body || {};

  // Extract language parameters (defaults to Polish/English for backward compatibility)
  const { targetLanguage, nativeLanguage } = extractLanguages(body);

  if (!fromLevel || !toLevel) {
    return res.status(400).json({ error: 'Missing fromLevel or toLevel' });
  }

  // Get theme for this transition
  const theme = getThemeForTransition(fromLevel, toLevel);
  if (!theme) {
    return res.status(400).json({ error: `No theme found for transition ${fromLevel} -> ${toLevel}` });
  }

  // Determine question count based on tier
  const tier = fromLevel.split(' ')[0];
  const totalQuestions = QUESTION_COUNTS[tier] || 10;
  const coreQuestionCount = Math.ceil(totalQuestions * CORE_QUESTIONS_RATIO);
  const personalizedCount = totalQuestions - coreQuestionCount;

  // Fetch user's vocabulary for personalized questions (filtered by target language)
  const { data: userWords } = await supabase
    .from('dictionary')
    .select('id, word, translation, word_type')
    .eq('user_id', auth.userId)
    .eq('language_code', targetLanguage)
    .limit(50);

  const userVocab = userWords || [];

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build language-aware prompt
    const basePrompt = buildLevelTestPrompt(
      targetLanguage,
      nativeLanguage,
      fromLevel,
      toLevel,
      theme
    );

    // Add question count requirements
    const questionRequirements = `\n\n## QUESTION COUNTS
- Total questions: ${totalQuestions}
- Core concept questions: ${coreQuestionCount} (cover the concepts listed above)
- Personalized questions: ${personalizedCount} (use user's vocabulary if available)`;

    // Add user vocabulary context
    const vocabContext = userVocab.length > 0
      ? `\n\n## User's Vocabulary (for ${personalizedCount} personalized questions):\n${userVocab.slice(0, 20).map(w => `- ${w.word} (${w.translation})`).join('\n')}`
      : `\n\n## User's Vocabulary:\nNo vocabulary yet - use additional core concepts instead for the ${personalizedCount} personalized questions.`;

    const prompt = basePrompt + questionRequirements + vocabContext + '\n\nGenerate the test questions now.';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: buildLevelTestSchema()
      }
    });

    const text = response.text || '';

    // Parse and validate response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(502).json({ error: 'Invalid AI response format' });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(502).json({ error: 'AI response missing questions array' });
    }

    // Ensure we have the right number of questions
    const questions = parsed.questions.slice(0, totalQuestions);

    // Create test record in database
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('level_tests')
      .insert({
        id: testId,
        user_id: auth.userId,
        language_code: targetLanguage,
        native_language: nativeLanguage,
        from_level: fromLevel,
        to_level: toLevel,
        passed: false,
        score: 0,
        total_questions: questions.length,
        correct_answers: 0,
        started_at: new Date().toISOString(),
        questions: questions
      });

    if (insertError) {
      console.error('Failed to create test record:', insertError);
      return res.status(500).json({ error: 'Failed to create test' });
    }

    // Increment usage counter
    incrementUsage(supabase, auth.userId, RATE_LIMITS.generateLevelTest.type);

    return res.status(200).json({
      success: true,
      testId,
      fromLevel,
      toLevel,
      theme: theme.name,
      totalQuestions: questions.length,
      questions
    });

  } catch (error: any) {
    console.error('Error generating test:', error);
    return res.status(500).json({ error: 'Failed to generate test' });
  }
}
