import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';
import { extractLanguages } from '../utils/language-helpers.js';
import { buildLevelTestPrompt, type LevelTheme } from '../utils/prompt-templates.js';
import { buildLevelTestSchema } from '../utils/schema-builders.js';

// Inline constants to avoid module resolution issues in Vercel serverless

const QUESTION_COUNTS: Record<string, number> = {
  Beginner: 10,
  Elementary: 15,
  Conversational: 20,
  Proficient: 30,
  Fluent: 30,
  Master: 30
};

const CORE_QUESTIONS_RATIO = 0.70;

const LEVEL_THEMES: Record<string, LevelTheme> = {
  'Beginner 1->2': {
    name: 'First Words of Love',
    description: 'The most essential words to start connecting with your partner',
    concepts: ['hello/hi', 'I love you', 'good morning', 'good night', 'thank you', 'please', 'yes', 'no']
  },
  'Beginner 2->3': {
    name: 'Checking In',
    description: 'Simple questions to show you care about their day',
    concepts: ['how are you?', 'are you okay?', "what's wrong?", "I'm fine", "I'm good", 'and you?', 'everything okay?', 'how was your day?']
  },
  'Beginner 3->Elementary 1': {
    name: 'Feelings',
    description: 'Express your emotions and understand theirs',
    concepts: ["I'm happy", "I'm tired", "I'm hungry", 'I miss you', "I'm sorry", "I'm excited", "I'm sad", 'I feel good']
  },
  'Elementary 1->2': {
    name: 'Daily Life',
    description: 'Talk about everyday activities together',
    concepts: ["let's eat", "I'm going to work", "I'm home", 'breakfast/lunch/dinner', "let's go", 'come here', "I'm leaving", "I'll be back"]
  },
  'Elementary 2->3': {
    name: 'Preferences',
    description: 'Express what you like, want, and prefer',
    concepts: ['I like...', 'I want...', 'do you want...?', "let's...", 'I prefer...', 'I need...', 'I would like...', 'what do you want?']
  },
  'Elementary 3->Conversational 1': {
    name: 'Making Plans',
    description: 'Plan activities and time together',
    concepts: ['when?', 'where?', 'tomorrow', 'today', 'together', 'later', 'this weekend', "what time?"]
  },
  'Conversational 1->2': {
    name: 'Telling Stories',
    description: 'Share what happened in your day',
    concepts: ['yesterday', 'what happened?', 'I went to...', 'I saw...', 'I met...', 'it was...', 'then...', 'after that...']
  },
  'Conversational 2->3': {
    name: 'Deeper Feelings',
    description: 'Express the depth of your love and connection',
    concepts: ['you mean everything to me', 'I love you so much', "I can't imagine life without you", 'you make me happy', 'always', 'forever', 'my heart', 'my love']
  },
  'Conversational 3->Proficient 1': {
    name: 'Complex Conversations',
    description: 'Discuss plans, opinions, and deeper topics',
    concepts: ['I think that...', 'in my opinion...', 'I agree', 'I disagree', 'maybe we could...', 'what if...', 'I believe...', 'it depends on...']
  },
  'Proficient 1->2': {
    name: 'Future Dreams',
    description: 'Talk about your future together',
    concepts: ['one day we will...', 'I dream of...', 'our future', 'I hope that...', 'we could live...', 'I want us to...', 'someday', 'when we...']
  },
  'Proficient 2->3': {
    name: 'Problem Solving',
    description: 'Work through challenges together',
    concepts: ["let's talk about...", 'I understand', 'I hear you', "it's okay", 'we can fix this', "I'm here for you", "let's figure it out", 'together we can...']
  },
  'Proficient 3->Fluent 1': {
    name: 'Cultural Nuance',
    description: 'Understand language-specific expressions and culture',
    concepts: ['idioms', 'cultural expressions', 'formal vs informal', 'family terms', 'holiday greetings', 'traditional phrases', 'regional expressions', 'slang (careful!)']
  },
  'Fluent 1->2': {
    name: 'Advanced Expression',
    description: 'Express complex thoughts with nuance',
    concepts: ['subjunctive mood', 'conditional statements', 'hypotheticals', 'reported speech', 'emphasis and contrast', 'literary expressions', 'formal writing', 'professional communication']
  },
  'Fluent 2->3': {
    name: 'Native-Like Fluency',
    description: 'Communicate with near-native proficiency',
    concepts: ['subtle humor', 'wordplay', 'poetry and literature', 'news and current events', 'technical discussions', 'debate and persuasion', 'storytelling mastery', 'emotional depth']
  },
  'Fluent 3->Master 1': {
    name: 'Expert Level',
    description: 'Master the intricacies of the language',
    concepts: ['archaic expressions', 'regional dialects', 'professional jargon', 'academic language', 'legal/medical terms', 'historical context', 'linguistic analysis', 'translation expertise']
  },
  'Master 1->2': {
    name: 'Cultural Mastery',
    description: 'Deep understanding of culture and history',
    concepts: ['historical references', 'literary allusions', 'cultural symbols', 'national identity', 'philosophical discussions', 'artistic expression', 'social commentary', 'generational perspectives']
  },
  'Master 2->3': {
    name: 'Complete Mastery',
    description: 'You are truly bilingual - congratulations!',
    concepts: ['teach others', 'create content', 'professional translation', 'cultural ambassador', 'linguistic research', 'preserve traditions', 'bridge cultures', 'share your journey']
  }
};

function getThemeForTransition(fromLevel: string, toLevel: string): LevelTheme | null {
  // Parse levels - format is "Tier N" (e.g., "Beginner 2")
  const fromParts = fromLevel.match(/^(.+)\s+(\d)$/);
  const toParts = toLevel.match(/^(.+)\s+(\d)$/);

  if (!fromParts || !toParts) {
    // Fallback to original key format
    const key = `${fromLevel}->${toLevel}`;
    return LEVEL_THEMES[key] || null;
  }

  const fromTier = fromParts[1];
  const fromNum = fromParts[2];
  const toTier = toParts[1];
  const toNum = toParts[2];

  let key: string;
  if (fromTier === toTier) {
    // Same tier: "Beginner 2->3" (short format matching LEVEL_THEMES keys)
    key = `${fromTier} ${fromNum}->${toNum}`;
  } else {
    // Cross tier: "Beginner 3->Elementary 1" (full format)
    key = `${fromLevel}->${toLevel}`;
  }

  return LEVEL_THEMES[key] || null;
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
  const limit = await checkRateLimit(supabase, auth.userId, 'generateLevelTest', sub.plan as 'standard' | 'unlimited');
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
