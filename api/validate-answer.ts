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
import { extractLanguages } from '../utils/language-helpers.js';
import { buildAnswerValidationPrompt } from '../utils/prompt-templates.js';
import { getLanguageName } from '../constants/language-config.js';
import { enhancedLocalMatch } from '../utils/local-matcher.js';

interface ValidateAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  targetWord?: string;            // The word in target language being translated (for context)
  wordType?: string;              // noun, verb, phrase, etc.
  direction?: 'target_to_native' | 'native_to_target';
  targetLanguage?: string;        // Target language code (e.g., 'pl', 'es')
  nativeLanguage?: string;        // Native language code (e.g., 'en', 'es')
  // Legacy support
  polishWord?: string;            // @deprecated - use targetWord
}

interface ValidateAnswerResponse {
  accepted: boolean;
  explanation: string;
}

// Fast local matching (no API call needed)
function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  return normalize(userAnswer) === normalize(correctAnswer);
}

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication to prevent unauthorized API usage
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
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
    const limit = await checkRateLimit(supabase, auth.userId, 'validateAnswer', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const body = req.body as ValidateAnswerRequest;
    const { userAnswer, correctAnswer, wordType, direction } = body;

    // Support both new field (targetWord) and legacy field (polishWord)
    const targetWord = body.targetWord || body.polishWord;

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    const { targetLanguage, nativeLanguage } = extractLanguages(body);

    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'userAnswer and correctAnswer are required' });
    }

    // First, try fast local matching (free, instant)
    if (fastMatch(userAnswer, correctAnswer)) {
      return res.status(200).json({
        accepted: true,
        explanation: 'Exact match'
      } as ValidateAnswerResponse);
    }

    // Enhanced local match (articles, typos, verb prefixes — still no API call)
    const localResult = enhancedLocalMatch(userAnswer, correctAnswer, {
      direction,
      targetLanguage,
      nativeLanguage
    });
    if (localResult === true) {
      return res.status(200).json({
        accepted: true,
        explanation: 'Close match'
      } as ValidateAnswerResponse);
    }

    // If fast match fails, use AI for smarter validation
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // Fallback to strict matching if no API key
      return res.status(200).json({
        accepted: false,
        explanation: 'No match (strict mode)'
      } as ValidateAnswerResponse);
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const targetName = getLanguageName(targetLanguage);
    const nativeName = getLanguageName(nativeLanguage);

    const contextInfo = targetWord
      ? `\n${targetName} word: "${targetWord}"${wordType ? ` (${wordType})` : ''}`
      : '';
    const directionInfo = direction
      ? `\nDirection: ${direction === 'target_to_native' ? `${targetName} → ${nativeName}` : `${nativeName} → ${targetName}`}`
      : '';

    const basePrompt = buildAnswerValidationPrompt(targetLanguage, nativeLanguage);

    const prompt = `${basePrompt}

## ANSWER TO VALIDATE

Expected: "${correctAnswer}"
User typed: "${userAnswer}"${contextInfo}${directionInfo}

Validate this single answer and return your result.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            accepted: { type: "boolean", description: "true if answer should be accepted" },
            explanation: { type: "string", description: "Brief explanation of why accepted/rejected" }
          },
          required: ["accepted", "explanation"]
        }
      }
    });

    const responseText = result.text || '';

    try {
      const validation = JSON.parse(responseText) as ValidateAnswerResponse;

      // Track usage after successful AI call
      incrementUsage(supabase, auth.userId, RATE_LIMITS.validateAnswer.type);

      return res.status(200).json({
        accepted: validation.accepted,
        explanation: validation.explanation
      });
    } catch (parseError) {
      // If JSON parsing fails, reject
      console.error('Failed to parse AI response:', responseText);
      return res.status(200).json({
        accepted: false,
        explanation: 'Validation error'
      } as ValidateAnswerResponse);
    }

  } catch (error) {
    console.error('Validate answer error:', error);
    // On error, fall back to rejection
    return res.status(200).json({
      accepted: false,
      explanation: 'Validation error'
    } as ValidateAnswerResponse);
  }
}
