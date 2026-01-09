import { GoogleGenAI, Type } from "@google/genai";
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';

interface ValidateWordRequest {
  polish: string;
  english?: string; // Optional - if not provided, AI will generate translation
  lightweight?: boolean; // Optional - if true, skip full grammatical data (conjugations, etc.)
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
    const limit = await checkRateLimit(supabase, auth.userId, 'validateWord', sub.plan as 'standard' | 'unlimited');
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const { polish, english, lightweight } = req.body as ValidateWordRequest;

    if (!polish) {
      return res.status(400).json({ error: 'Missing polish word' });
    }

    // Determine mode: generate (no english) or validate (has english)
    const generateMode = !english || english.trim() === '';
    // Lightweight mode skips full grammatical data (conjugations, gender, etc.)
    const isLightweight = lightweight === true;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      // If no API key, return error for generate mode or original words for validate mode
      if (generateMode) {
        return res.status(500).json({ error: 'AI service required to generate translations' });
      }
      return res.status(200).json({
        success: true,
        validated: {
          word: polish.trim(),
          translation: english?.trim() || '',
          word_type: 'phrase',
          is_slang: false,
          formality: 'neutral',
          was_corrected: false
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build prompt based on mode (generate vs validate) and weight (lightweight vs full)
    const grammarInstructions = isLightweight ? '' : `

IMPORTANT FOR GRAMMATICAL DATA:
- If it's a VERB: Provide present tense conjugations for all 6 persons (ja, ty, on/ona/ono, my, wy, oni/one)
- If it's a NOUN: Provide the grammatical gender (masculine/feminine/neuter) and plural form
- If it's an ADJECTIVE: Provide all 4 forms (masculine, feminine, neuter, plural)`;

    const prompt = generateMode
      ? `You are a Polish language expert. Translate this Polish word/phrase to English and provide linguistic data.

Input:
- Polish: "${polish}"

Your task:
1. Check if the Polish spelling is correct. If not, provide the correct spelling.
2. Provide the accurate English translation.
3. Determine the word type (noun, verb, adjective, adverb, phrase, other)
4. Identify if it's slang or informal language - this is OK, just note it
5. Rate the formality (formal, neutral, informal, vulgar)
6. If you corrected the spelling, briefly explain why
7. Provide pronunciation guide
${grammarInstructions}

NOTES:
- Accept slang and colloquial Polish - it's valid language
- If the word doesn't exist in Polish, still try to guess what they meant
- Set was_corrected to true only if the Polish spelling was incorrect

Return ONLY the JSON object, no other text.`
      : `You are a Polish language expert. Validate and enrich this Polish word/phrase with its English translation.

Input:
- Polish: "${polish}"
- English: "${english}"

Your task:
1. Check if the Polish spelling is correct. If not, provide the correct spelling.
2. Verify the English translation is accurate. If not, provide a better translation.
3. Determine the word type (noun, verb, adjective, adverb, phrase, other)
4. Identify if it's slang or informal language - this is OK, just note it
5. Rate the formality (formal, neutral, informal, vulgar)
6. If you made any corrections, briefly explain why
7. Provide pronunciation guide
${grammarInstructions}

NOTES:
- Accept slang and colloquial Polish - it's valid language
- Be lenient with minor variations
- Only flag as "was_corrected" if spelling was wrong or translation was significantly off
- If the word doesn't exist in Polish, still try to guess what they meant

Return ONLY the JSON object, no other text.`;

    // Lightweight schema - just basic validation without grammar data
    const lightweightSchema = {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING, description: "Corrected Polish word/phrase" },
        translation: { type: Type.STRING, description: "Corrected English translation" },
        word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
        pronunciation: { type: Type.STRING, description: "Pronunciation guide in English" },
        is_slang: { type: Type.BOOLEAN, description: "Whether this is slang or colloquial" },
        formality: { type: Type.STRING, enum: ["formal", "neutral", "informal", "vulgar"] },
        was_corrected: { type: Type.BOOLEAN, description: "Whether any corrections were made" },
        correction_note: { type: Type.STRING, description: "Brief explanation if corrections were made" }
      },
      required: ["word", "translation", "word_type", "is_slang", "formality", "was_corrected"]
    };

    // Full schema - includes conjugations, gender, adjective forms, examples
    const fullSchema = {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING, description: "Corrected Polish word/phrase" },
        translation: { type: Type.STRING, description: "Corrected English translation" },
        word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
        pronunciation: { type: Type.STRING, description: "Pronunciation guide in English" },
        is_slang: { type: Type.BOOLEAN, description: "Whether this is slang or colloquial" },
        formality: { type: Type.STRING, enum: ["formal", "neutral", "informal", "vulgar"] },
        was_corrected: { type: Type.BOOLEAN, description: "Whether any corrections were made" },
        correction_note: { type: Type.STRING, description: "Brief explanation if corrections were made" },
        // Verb conjugations
        conjugations: {
          type: Type.OBJECT,
          description: "Present tense conjugations for verbs",
          properties: {
            present: {
              type: Type.OBJECT,
              properties: {
                ja: { type: Type.STRING },
                ty: { type: Type.STRING },
                on_ona_ono: { type: Type.STRING },
                my: { type: Type.STRING },
                wy: { type: Type.STRING },
                oni_one: { type: Type.STRING }
              }
            }
          }
        },
        // Noun data
        gender: { type: Type.STRING, enum: ["masculine", "feminine", "neuter"], description: "Grammatical gender for nouns" },
        plural: { type: Type.STRING, description: "Plural form for nouns" },
        // Adjective forms
        adjective_forms: {
          type: Type.OBJECT,
          description: "All 4 forms for adjectives",
          properties: {
            masculine: { type: Type.STRING },
            feminine: { type: Type.STRING },
            neuter: { type: Type.STRING },
            plural: { type: Type.STRING }
          }
        },
        // Example sentence
        example_sentence: { type: Type.STRING, description: "Example sentence using the word" },
        example_translation: { type: Type.STRING, description: "English translation of example" }
      },
      required: ["word", "translation", "word_type", "is_slang", "formality", "was_corrected"]
    };

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: isLightweight ? lightweightSchema : fullSchema
      }
    });

    try {
      const validated = JSON.parse(result.text || '{}');

      // Build context object with grammatical data for storage
      const context: any = {};

      if (validated.word_type === 'verb' && validated.conjugations?.present) {
        context.conjugations = validated.conjugations;
      }

      if (validated.word_type === 'noun') {
        if (validated.gender) context.gender = validated.gender;
        if (validated.plural) context.plural = validated.plural;
      }

      if (validated.word_type === 'adjective' && validated.adjective_forms) {
        context.adjective_forms = validated.adjective_forms;
      }

      if (validated.example_sentence) {
        context.example_sentence = validated.example_sentence;
        context.example_translation = validated.example_translation;
      }

      if (validated.is_slang) {
        context.is_slang = true;
      }

      if (validated.formality && validated.formality !== 'neutral') {
        context.formality = validated.formality;
      }

      // Track usage after successful AI call
      incrementUsage(supabase, auth.userId, RATE_LIMITS.validateWord.type);

      return res.status(200).json({
        success: true,
        validated: {
          word: validated.word,
          translation: validated.translation,
          word_type: validated.word_type,
          pronunciation: validated.pronunciation,
          was_corrected: validated.was_corrected,
          correction_note: validated.correction_note,
          context: Object.keys(context).length > 0 ? JSON.stringify(context) : undefined
        }
      });
    } catch {
      // If parsing fails, return original words
      return res.status(200).json({
        success: true,
        validated: {
          word: polish.trim(),
          translation: english.trim(),
          word_type: 'phrase',
          was_corrected: false
        }
      });
    }

  } catch (error: any) {
    console.error('[validate-word] Error:', error);
    return res.status(500).json({ error: 'Failed to validate word. Please try again.' });
  }
}
