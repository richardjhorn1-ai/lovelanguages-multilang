import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Sanitize output to remove any CSS/HTML artifacts the AI might generate
function sanitizeOutput(text: string): string {
  if (!text) return '';
  return text
    // Remove patterns like: (#FF4761) font-semibold"> or variations with any hex color
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    // Remove hex color in parentheses: (#FF4761)
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    // Remove font-semibold with any trailing punctuation
    .replace(/font-semibold["'>:\s]*/gi, '')
    // Remove Tailwind-style classes: text-[#FF4761]
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    // Remove any HTML tags
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    // Remove orphaned style/class fragments
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    // Remove any stray hex colors
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    // Clean up orphaned quotes, brackets, angle brackets
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    // Clean up double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    // Priority 1: GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      console.error("API Configuration Error: GEMINI_API_KEY not found.");
      return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY missing." });
    }

    // Robust Body Parsing
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON format in request body." });
      }
    }

    // Diagnostics: If no prompt or action is provided, return status
    if (!body || (!body.prompt && !body.action)) {
       return res.status(200).json({ 
         status: "online", 
         message: "Cupid API is ready. Send a POST request with a prompt.",
         methodReceived: req.method 
       });
    }

    const { prompt, mode = 'ask', userLog = [], action, images } = body;
    const ai = new GoogleGenAI({ apiKey });

    // Handle Title Generation
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short (2-3 word) romantic or cute title for a Polish learning session starting with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '').trim() || "New Session" });
    }

    const COMMON_INSTRUCTIONS = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language. Every word they learn is a gift of love.

CORE PRINCIPLES:
- You are NOT flirty with the user - you ENCOURAGE them to be romantic with their partner
- Celebrate every small win enthusiastically
- Connect vocabulary to relationship moments
- Always explain Polish in English first, then show Polish with (translation in brackets)

LANGUAGE RULES:
- Polish text ALWAYS followed by (English translation)
- Never dump multiple concepts - one thing at a time
- Include pronunciation hints for tricky words

FORMATTING - YOU MUST FOLLOW THIS EXACTLY:
- Polish words go inside **double asterisks**: **kocham**, **Dzień dobry**
- Pronunciation goes in [square brackets]: [KOH-ham], [jen DOH-bri]
- Complete example: **Dzień dobry** [jen DOH-bri] means "good morning"
- Output ONLY plain text with markdown - nothing else

VOCABULARY EXTRACTION - THIS IS MANDATORY FOR EVERY RESPONSE:

You MUST populate the newWords array with COMPLETE data. Incomplete entries are NOT acceptable.

=== FOR VERBS ===
- Use INFINITIVE form as "word" (e.g., "jeść" not "jem")
- type: "verb"
- ONLY extract PRESENT TENSE conjugations with ALL 6 persons:
  { present: { ja: "jem", ty: "jesz", onOna: "je", my: "jemy", wy: "jecie", oni: "jedzą" } }
- EVERY field (ja, ty, onOna, my, wy, oni) MUST be filled - no nulls or empty strings
- DO NOT include past or future tenses - users unlock those separately when ready
- Include 5 example sentences in Polish with English translations in parentheses
- proTip: romantic/practical usage tip (max 60 chars)

=== FOR NOUNS ===
- Use singular nominative as "word"
- type: "noun"
- MUST include "gender": "masculine" | "feminine" | "neuter"
- MUST include "plural": the plural form (e.g., word: "kot", plural: "koty")
- Include 5 example sentences
- proTip: usage tip

=== FOR ADJECTIVES ===
- Use masculine form as "word"
- type: "adjective"
- MUST include "adjectiveForms" with ALL 4 forms:
  { masculine: "dobry", feminine: "dobra", neuter: "dobre", plural: "dobrzy" }
- EVERY field MUST be filled - no nulls or empty strings
- Include 5 example sentences
- proTip: usage tip

=== FOR PHRASES ===
- type: "phrase"
- Include 5 example sentences showing different contexts
- proTip: when/how to use it

=== EXAMPLES FIELD ===
EVERY word MUST have exactly 5 examples. Format each as:
"Kocham cię bardzo. (I love you very much.)"

=== VALIDATION CHECKLIST ===
Before returning, verify:
[ ] Every verb has conjugations.present with ALL 6 persons filled (NO past/future - those are unlocked later)
[ ] Every noun has gender AND plural
[ ] Every adjective has adjectiveForms with ALL 4 forms filled
[ ] Every word has exactly 5 examples
[ ] Every word has a proTip

DO NOT return incomplete data. If unsure of a conjugation, look it up - Polish grammar is consistent.
`;

    const MODE_DEFINITIONS = {
        ask: `
### MODE: ASK - Quick Text Chat

You are texting a friend. Be BRIEF and natural.

CRITICAL RULES:
- Maximum 2-3 sentences
- NEVER repeat the same word/phrase twice
- Give the Polish word ONCE with pronunciation, then move on
- End with a quick follow-up question

FORMAT TEMPLATE:
"[Polish word] ([pronunciation]) means [meaning]. [One romantic tip]. [Follow-up question]?"

EXAMPLE:
User: "How do I say good morning?"
Good: "Dzień dobry (jen DOH-bri)! Whisper it to them before they open their eyes. Want the casual evening version?"
Bad: "You can say good morning by saying Dzień dobry (Good morning)..." ← TOO REPETITIVE

BANNED:
- Tables, bullet points, numbered lists
- Repeating the English translation multiple times
- Long explanations
- Saying "you can say X by saying X"
`,
        learn: `
### MODE: LEARN - Structured Lesson

You MUST use special markdown syntax. This is NON-NEGOTIABLE.

Known vocabulary: [${(userLog || []).slice(0, 30).join(', ')}]

VERB TEACHING RULE:
When teaching ANY verb, ALWAYS show ALL 6 conjugations (I, You, He/She, We, You plural, They).
This is essential - never show partial conjugations.

YOUR RESPONSE MUST CONTAIN THESE EXACT PATTERNS:

PATTERN 1 - Table (copy this EXACT format):
::: table
Column1 | Column2 | Column3
---|---|---
Row1Col1 | Row1Col2 | Row1Col3
:::

PATTERN 2 - Drill (copy this EXACT format):
::: drill
Your challenge text here
:::

COMPLETE EXAMPLE FOR VERB TEACHING:
"Let's master 'kochać' (to love) - the most important verb!

::: table
Person | Polish | Pronunciation
---|---|---
I | kocham | KOH-ham
You (singular) | kochasz | KOH-hash
He/She/It | kocha | KOH-ha
We | kochamy | koh-HA-mih
You (plural) | kochacie | koh-HA-chyeh
They | kochają | koh-HA-yohng
:::

Try whispering 'Kochamy się' (We love each other) while hugging.

::: drill
Tonight's challenge: Say 'Kocham cię' while looking into their eyes.
:::

Want me to show you the past and future tenses too?"

ALWAYS END WITH A FOLLOW-UP QUESTION offering to teach related content (other tenses, similar words, etc.)

VALIDATION:
[ ] Table has "::: table" and ":::" markers
[ ] Drill has "::: drill" and ":::" markers
[ ] Verbs show ALL 6 conjugations
[ ] Ends with follow-up question

If you write a table WITHOUT "::: markers, IT WILL NOT RENDER.
`
    };

    // Map old mode names to new ones for backwards compatibility
    const modeMap: Record<string, string> = { chat: 'ask', tutor: 'learn' };
    const activeMode = modeMap[mode] || mode;

    const activeSystemInstruction = `
${COMMON_INSTRUCTIONS}
${MODE_DEFINITIONS[activeMode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.ask}
`;

    const parts: any[] = [];
    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.data && img.mimeType) {
          parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        }
      });
    }
    parts.push({ text: prompt || " " });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: activeSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
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
                  examples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "REQUIRED: Exactly 5 example sentences. Format: 'Polish sentence. (English translation.)'"
                  },
                  proTip: { type: Type.STRING },
                  conjugations: {
                    type: Type.OBJECT,
                    description: "REQUIRED for verbs. Only present tense - past/future unlocked separately.",
                    properties: {
                      present: {
                        type: Type.OBJECT,
                        description: "Present tense conjugations - ALL 6 fields required",
                        properties: {
                          ja: { type: Type.STRING, description: "I form - REQUIRED" },
                          ty: { type: Type.STRING, description: "You (singular) form - REQUIRED" },
                          onOna: { type: Type.STRING, description: "He/She/It form - REQUIRED" },
                          my: { type: Type.STRING, description: "We form - REQUIRED" },
                          wy: { type: Type.STRING, description: "You (plural) form - REQUIRED" },
                          oni: { type: Type.STRING, description: "They form - REQUIRED" }
                        },
                        required: ["ja", "ty", "onOna", "my", "wy", "oni"]
                      }
                    },
                    required: ["present"]
                  },
                  adjectiveForms: {
                    type: Type.OBJECT,
                    description: "REQUIRED for adjectives. All 4 gender forms must be provided.",
                    properties: {
                      masculine: { type: Type.STRING, description: "Masculine form - REQUIRED" },
                      feminine: { type: Type.STRING, description: "Feminine form - REQUIRED" },
                      neuter: { type: Type.STRING, description: "Neuter form - REQUIRED" },
                      plural: { type: Type.STRING, description: "Plural form - REQUIRED" }
                    },
                    required: ["masculine", "feminine", "neuter", "plural"]
                  },
                  gender: {
                    type: Type.STRING,
                    enum: ["masculine", "feminine", "neuter"],
                    description: "REQUIRED for nouns. Grammatical gender."
                  },
                  plural: {
                    type: Type.STRING,
                    description: "REQUIRED for nouns. The plural form of the word."
                  }
                },
                required: ["word", "translation", "type", "importance", "rootWord", "examples", "proTip"]
              }
            }
          },
          required: ["replyText", "newWords"]
        }
      }
    });

    const output = result.text;
    try {
      const parsed = JSON.parse(output);
      // Sanitize the reply text to remove any CSS/HTML artifacts
      parsed.replyText = sanitizeOutput(parsed.replyText || '');
      return res.status(200).json(parsed);
    } catch (parseError) {
      return res.status(200).json({ replyText: sanitizeOutput(output), newWords: [] });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
