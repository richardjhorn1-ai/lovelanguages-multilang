import { createClient } from '@supabase/supabase-js';
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

interface ValidateWordRequest {
  polish: string;
  english: string;
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

    const { polish, english } = req.body as ValidateWordRequest;

    if (!polish || !english) {
      return res.status(400).json({ error: 'Missing polish or english word' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      // If no API key, just return the original words without validation
      return res.status(200).json({
        success: true,
        validated: {
          word: polish.trim(),
          translation: english.trim(),
          word_type: 'phrase',
          is_slang: false,
          formality: 'neutral',
          was_corrected: false
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Polish language expert. Validate and enrich this Polish word/phrase with its English translation.

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

IMPORTANT FOR GRAMMATICAL DATA:
- If it's a VERB: Provide present tense conjugations for all 6 persons (ja, ty, on/ona/ono, my, wy, oni/one)
- If it's a NOUN: Provide the grammatical gender (masculine/feminine/neuter) and plural form
- If it's an ADJECTIVE: Provide all 4 forms (masculine, feminine, neuter, plural)

NOTES:
- Accept slang and colloquial Polish - it's valid language
- Be lenient with minor variations
- Only flag as "was_corrected" if spelling was wrong or translation was significantly off
- If the word doesn't exist in Polish, still try to guess what they meant

Return ONLY the JSON object, no other text.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        }
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
    console.error('Validate word error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
