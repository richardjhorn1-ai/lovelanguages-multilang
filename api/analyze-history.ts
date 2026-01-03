import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

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
    console.error('Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { userId: user.id };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("API Configuration Error: GEMINI_API_KEY not found.");
    return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY missing." });
  }

  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON format in request body." });
    }
  }

  const { messages = [], currentWords = [] } = body || {};

  if (!Array.isArray(messages) || !Array.isArray(currentWords)) {
    return res.status(400).json({ error: "Invalid payload. Expecting messages and currentWords arrays." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const historyText = messages
      .filter((m: any) => m.content && !m.content.includes('[Media Attached]'))
      .map((m: any) => `${(m.role || '').toUpperCase()}: ${m.content}`)
      .join('\n---\n');

    const knownContext = currentWords.length > 0
      ? `User already knows: [${currentWords.slice(0, 50).join(', ')}]`
      : "User is a beginner.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `TASK: Language Data Parser for Polish vocabulary.

1. Extract NEW Polish vocabulary from the chat history.
2. For each word, generate exactly 5 diverse example sentences in Polish with English translations in brackets.
3. Identify the Root Word (Lemma/Infinitive for verbs).
4. Rate Importance 1-5 (5 = essential survival Polish, 1 = rare/niche).
5. Provide a "proTip" (max 60 chars) - a cheeky or helpful usage tip for lovers.

6. FOR VERBS: Include full conjugations for Present, Past, and Future tenses:
   - Present: ja (I), ty (you), on/ona (he/she), my (we), wy (you pl.), oni/one (they)
   - Past: same persons, masculine and feminine where applicable
   - Future: same persons

7. FOR NOUNS: Include gender (masculine/feminine/neuter) and plural form.

8. FOR ADJECTIVES: Include masculine, feminine, neuter, and plural forms.

${knownContext}

CHAT HISTORY:
${historyText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
                  importance: { type: Type.INTEGER },
                  context: { type: Type.STRING },
                  rootWord: { type: Type.STRING },
                  proTip: { type: Type.STRING },
                  examples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "5 Polish sentences using the word with English translations in brackets"
                  },
                  // Verb conjugations
                  conjugations: {
                    type: Type.OBJECT,
                    description: "For verbs only: conjugation tables",
                    properties: {
                      present: {
                        type: Type.OBJECT,
                        properties: {
                          ja: { type: Type.STRING },
                          ty: { type: Type.STRING },
                          onOna: { type: Type.STRING },
                          my: { type: Type.STRING },
                          wy: { type: Type.STRING },
                          oni: { type: Type.STRING }
                        }
                      },
                      past: {
                        type: Type.OBJECT,
                        properties: {
                          ja: { type: Type.STRING },
                          ty: { type: Type.STRING },
                          onOna: { type: Type.STRING },
                          my: { type: Type.STRING },
                          wy: { type: Type.STRING },
                          oni: { type: Type.STRING }
                        }
                      },
                      future: {
                        type: Type.OBJECT,
                        properties: {
                          ja: { type: Type.STRING },
                          ty: { type: Type.STRING },
                          onOna: { type: Type.STRING },
                          my: { type: Type.STRING },
                          wy: { type: Type.STRING },
                          oni: { type: Type.STRING }
                        }
                      }
                    }
                  },
                  // Noun properties
                  gender: {
                    type: Type.STRING,
                    enum: ["masculine", "feminine", "neuter"],
                    description: "For nouns only: grammatical gender"
                  },
                  plural: {
                    type: Type.STRING,
                    description: "For nouns only: plural form"
                  },
                  // Adjective forms
                  adjectiveForms: {
                    type: Type.OBJECT,
                    description: "For adjectives only: gender forms",
                    properties: {
                      masculine: { type: Type.STRING },
                      feminine: { type: Type.STRING },
                      neuter: { type: Type.STRING },
                      plural: { type: Type.STRING }
                    }
                  }
                },
                required: ["word", "translation", "type", "importance", "examples", "proTip"]
              }
            }
          },
          required: ["newWords"]
        }
      }
    });

    // Validate response before parsing
    const responseText = response.text || '';
    if (!responseText || !responseText.trim().startsWith('{')) {
      console.error("Invalid Gemini response (not JSON):", responseText.substring(0, 200));
      return res.status(502).json({
        error: 'Received invalid response from AI service. Please try again.',
        retryable: true
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError.message, "Response:", responseText.substring(0, 200));
      return res.status(502).json({
        error: 'Failed to parse AI response. Please try again.',
        retryable: true
      });
    }

    const sanitizedWords = (parsed.newWords || []).map((w: any) => ({
      ...w,
      word: (w.word || '').toLowerCase().trim(),
      rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
    }));

    return res.status(200).json({ newWords: sanitizedWords });
  } catch (e: any) {
    console.error("Analyze History Error:", e);
    return res.status(500).json({ error: e.message || 'Internal Server Error', retryable: true });
  }
}
