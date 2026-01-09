import { GoogleGenAI, Type } from "@google/genai";
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware';

interface ValidateAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  polishWord?: string;        // The Polish word being translated (for context)
  wordType?: string;          // noun, verb, phrase, etc.
  direction?: 'polish_to_english' | 'english_to_polish';
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
    const limit = await checkRateLimit(supabase, auth.userId, 'validateAnswer', sub.plan as 'standard' | 'unlimited');
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const { userAnswer, correctAnswer, polishWord, wordType, direction } = req.body as ValidateAnswerRequest;

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

    const contextInfo = polishWord
      ? `\nPolish word: "${polishWord}"${wordType ? ` (${wordType})` : ''}`
      : '';
    const directionInfo = direction
      ? `\nDirection: ${direction === 'polish_to_english' ? 'Polish → English' : 'English → Polish'}`
      : '';

    const prompt = `You are validating answers for a Polish language learning app.

Expected: "${correctAnswer}"
User typed: "${userAnswer}"${contextInfo}${directionInfo}

ACCEPT if ANY apply:
- Exact match (ignoring case)
- Missing Polish diacritics (dzis=dziś, zolw=żółw, cie=cię, zolty=żółty)
- Valid synonym (pretty=beautiful, hi=hello)
- Article variation (the dog=dog, a cat=cat)
- Minor typo (1-2 chars off)
- Alternate valid translation (przepraszam=sorry OR excuse me)

REJECT if:
- Completely different meaning
- Wrong language
- Major spelling error (3+ chars wrong)

Return JSON: { "accepted": true/false, "explanation": "brief reason" }`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accepted: { type: Type.BOOLEAN, description: "true if answer should be accepted" },
            explanation: { type: Type.STRING, description: "Brief explanation of why accepted/rejected" }
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
