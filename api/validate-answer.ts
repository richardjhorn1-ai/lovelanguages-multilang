import { GoogleGenAI, Type } from "@google/genai";

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

interface ValidateAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  polishWord?: string;        // The Polish word being translated (for context)
  wordType?: string;          // noun, verb, phrase, etc.
  direction?: 'polish_to_english' | 'english_to_polish';
}

interface ValidateAnswerResponse {
  accepted: boolean;
  confidence: number;         // 0.0 to 1.0
  reason: 'exact_match' | 'synonym' | 'typo' | 'article' | 'partial' | 'alternate_translation' | 'wrong';
  suggestion?: string;        // If wrong, suggest what they might have meant
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
    const { userAnswer, correctAnswer, polishWord, wordType, direction } = req.body as ValidateAnswerRequest;

    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'userAnswer and correctAnswer are required' });
    }

    // First, try fast local matching (free, instant)
    if (fastMatch(userAnswer, correctAnswer)) {
      return res.status(200).json({
        accepted: true,
        confidence: 1.0,
        reason: 'exact_match'
      } as ValidateAnswerResponse);
    }

    // If fast match fails, use AI for smarter validation
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      // Fallback to strict matching if no API key
      return res.status(200).json({
        accepted: false,
        confidence: 1.0,
        reason: 'wrong'
      } as ValidateAnswerResponse);
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const contextInfo = polishWord
      ? `\nPolish word: "${polishWord}"${wordType ? ` (${wordType})` : ''}`
      : '';
    const directionInfo = direction
      ? `\nDirection: ${direction === 'polish_to_english' ? 'Polish → English' : 'English → Polish'}`
      : '';

    const prompt = `You are a language learning answer validator for a Polish learning app. Be encouraging but accurate.

Expected answer: "${correctAnswer}"
User's answer: "${userAnswer}"${contextInfo}${directionInfo}

ACCEPT the answer if ANY of these apply:
- Valid synonym (e.g., "pretty" for "beautiful", "hi" for "hello")
- Article variation ("the dog" vs "dog", "a cat" vs "cat")
- Minor typo (1-2 characters off, like "turtl" for "turtle")
- Punctuation difference ("goodnight" vs "good night", "I'm" vs "Im")
- Pronoun inclusion ("I love" vs "love" for "kocham")
- Alternate valid translation (e.g., "przepraszam" = both "sorry" AND "excuse me")
- Capitalization doesn't matter

REJECT if:
- Completely different word/meaning
- Wrong language
- Major spelling error (3+ characters wrong)
- Different tense or conjugation that changes meaning

Respond with JSON only.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accepted: { type: Type.BOOLEAN, description: "Whether the answer should be accepted" },
            confidence: { type: Type.NUMBER, description: "Confidence level 0.0-1.0" },
            reason: {
              type: Type.STRING,
              description: "Why accepted/rejected",
              enum: ["exact_match", "synonym", "typo", "article", "partial", "alternate_translation", "wrong"]
            },
            suggestion: { type: Type.STRING, description: "If rejected, what they might have meant (optional)" }
          },
          required: ["accepted", "confidence", "reason"]
        }
      }
    });

    const responseText = result.text || '';

    try {
      const validation = JSON.parse(responseText) as ValidateAnswerResponse;

      return res.status(200).json({
        accepted: validation.accepted,
        confidence: Math.min(1, Math.max(0, validation.confidence || 0.8)),
        reason: validation.reason || (validation.accepted ? 'synonym' : 'wrong'),
        suggestion: validation.suggestion
      });
    } catch (parseError) {
      // If JSON parsing fails, be lenient and reject
      console.error('Failed to parse AI response:', responseText);
      return res.status(200).json({
        accepted: false,
        confidence: 0.5,
        reason: 'wrong'
      } as ValidateAnswerResponse);
    }

  } catch (error) {
    console.error('Validate answer error:', error);
    // On error, fall back to strict matching (already failed fast match)
    return res.status(200).json({
      accepted: false,
      confidence: 0.5,
      reason: 'wrong'
    } as ValidateAnswerResponse);
  }
}
