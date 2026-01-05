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
      contents: `TASK: Polish Vocabulary Extractor - COMPLETE DATA REQUIRED

Extract Polish vocabulary from the chat history. EVERY entry MUST be complete with all required fields.

${knownContext}

=== EXTRACTION RULES ===

FOR VERBS:
- "word": Use INFINITIVE form (e.g., "jeść" not "jem")
- "type": "verb"
- "conjugations": REQUIRED - present tense with ALL 6 persons:
  { present: { ja: "jem", ty: "jesz", onOna: "je", my: "jemy", wy: "jecie", oni: "jedzą" } }
- If the conversation EXPLICITLY TEACHES past or future tense forms (with explanations/examples), include them:
  - past: Include unlockedAt timestamp and gendered forms
  - future: Include unlockedAt timestamp and all persons
- Only include past/future if the AI is actively teaching that tense, not just using it in passing
- NEVER return separate entries for individual conjugated forms

FOR NOUNS:
- "word": Singular nominative form
- "type": "noun"
- "gender": REQUIRED - must be "masculine", "feminine", or "neuter"
- "plural": REQUIRED - the plural form (e.g., "koty" for "kot")

FOR ADJECTIVES:
- "word": Masculine form
- "type": "adjective"
- "adjectiveForms": REQUIRED - must include all 4 forms:
  { masculine: "dobry", feminine: "dobra", neuter: "dobre", plural: "dobrzy" }
- NEVER return separate entries for individual gender forms

FOR PHRASES:
- "word": The full phrase
- "type": "phrase"

FOR ALL WORDS:
- "examples": REQUIRED - exactly 5 example sentences, each in format: "Polish sentence. (English translation.)"
- "proTip": REQUIRED - max 60 chars, romantic/practical usage tip
- "importance": 1-5 (5 = essential, 1 = rare)
- "rootWord": The base/dictionary form

=== VALIDATION ===
Before returning, verify:
[ ] Every verb has conjugations.present with ALL 6 persons
[ ] If past/future tense was explicitly taught, include it with unlockedAt timestamp
[ ] Every noun has gender AND plural
[ ] Every adjective has adjectiveForms with ALL 4 forms (masculine, feminine, neuter, plural)
[ ] Every word has exactly 5 examples
[ ] Every word has a proTip

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
                  proTip: { type: Type.STRING, description: "REQUIRED: Max 60 char romantic/practical tip" },
                  examples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "REQUIRED: Exactly 5 sentences in format 'Polish. (English.)'"
                  },
                  conjugations: {
                    type: Type.OBJECT,
                    description: "REQUIRED for verbs. Present always required. Past/future only if explicitly taught.",
                    properties: {
                      present: {
                        type: Type.OBJECT,
                        description: "Present tense - ALL 6 persons required",
                        properties: {
                          ja: { type: Type.STRING, description: "I form - REQUIRED" },
                          ty: { type: Type.STRING, description: "You (singular) - REQUIRED" },
                          onOna: { type: Type.STRING, description: "He/She/It - REQUIRED" },
                          my: { type: Type.STRING, description: "We - REQUIRED" },
                          wy: { type: Type.STRING, description: "You (plural) - REQUIRED" },
                          oni: { type: Type.STRING, description: "They - REQUIRED" }
                        },
                        required: ["ja", "ty", "onOna", "my", "wy", "oni"]
                      },
                      past: {
                        type: Type.OBJECT,
                        description: "Past tense - only include if explicitly taught in conversation",
                        properties: {
                          unlockedAt: { type: Type.STRING, description: "ISO timestamp - set to current time" },
                          ja: {
                            type: Type.OBJECT,
                            properties: {
                              masculine: { type: Type.STRING },
                              feminine: { type: Type.STRING }
                            }
                          },
                          ty: {
                            type: Type.OBJECT,
                            properties: {
                              masculine: { type: Type.STRING },
                              feminine: { type: Type.STRING }
                            }
                          },
                          onOna: {
                            type: Type.OBJECT,
                            properties: {
                              masculine: { type: Type.STRING },
                              feminine: { type: Type.STRING },
                              neuter: { type: Type.STRING }
                            }
                          },
                          my: {
                            type: Type.OBJECT,
                            properties: {
                              masculine: { type: Type.STRING },
                              feminine: { type: Type.STRING }
                            }
                          },
                          wy: {
                            type: Type.OBJECT,
                            properties: {
                              masculine: { type: Type.STRING },
                              feminine: { type: Type.STRING }
                            }
                          },
                          oni: {
                            type: Type.OBJECT,
                            properties: {
                              masculine: { type: Type.STRING },
                              feminine: { type: Type.STRING }
                            }
                          }
                        }
                      },
                      future: {
                        type: Type.OBJECT,
                        description: "Future tense - only include if explicitly taught in conversation",
                        properties: {
                          unlockedAt: { type: Type.STRING, description: "ISO timestamp - set to current time" },
                          ja: { type: Type.STRING },
                          ty: { type: Type.STRING },
                          onOna: { type: Type.STRING },
                          my: { type: Type.STRING },
                          wy: { type: Type.STRING },
                          oni: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["present"]
                  },
                  gender: {
                    type: Type.STRING,
                    enum: ["masculine", "feminine", "neuter"],
                    description: "REQUIRED for nouns: grammatical gender"
                  },
                  plural: {
                    type: Type.STRING,
                    description: "REQUIRED for nouns: plural form"
                  },
                  adjectiveForms: {
                    type: Type.OBJECT,
                    description: "REQUIRED for adjectives. All 4 forms must be provided.",
                    properties: {
                      masculine: { type: Type.STRING, description: "REQUIRED" },
                      feminine: { type: Type.STRING, description: "REQUIRED" },
                      neuter: { type: Type.STRING, description: "REQUIRED" },
                      plural: { type: Type.STRING, description: "REQUIRED" }
                    },
                    required: ["masculine", "feminine", "neuter", "plural"]
                  }
                },
                required: ["word", "translation", "type", "importance", "examples", "proTip", "rootWord"]
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

    const now = new Date().toISOString();
    const sanitizedWords = (parsed.newWords || []).map((w: any) => {
      const sanitized = {
        ...w,
        word: (w.word || '').toLowerCase().trim(),
        rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
      };

      // Ensure unlockedAt is set for any past/future tenses included
      if (sanitized.conjugations) {
        if (sanitized.conjugations.past && !sanitized.conjugations.past.unlockedAt) {
          sanitized.conjugations.past.unlockedAt = now;
        }
        if (sanitized.conjugations.future && !sanitized.conjugations.future.unlockedAt) {
          sanitized.conjugations.future.unlockedAt = now;
        }
      }

      return sanitized;
    });

    return res.status(200).json({ newWords: sanitizedWords });
  } catch (e: any) {
    console.error("Analyze History Error:", e);
    return res.status(500).json({ error: e.message || 'Internal Server Error', retryable: true });
  }
}
