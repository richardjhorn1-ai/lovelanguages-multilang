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

VOCABULARY EXTRACTION - CRITICAL:
- Extract EVERY Polish word you mention into the newWords array
- Include common words, greetings, connectors - not just "important" ones
- If you write "Cześć, kochanie!" extract BOTH words
- More extraction is better - the Love Log should grow substantially
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

You are a Polish teacher giving a formatted lesson. ALWAYS use the special formatting blocks.

Known vocabulary: [${(userLog || []).slice(0, 30).join(', ')}]

MANDATORY STRUCTURE - YOU MUST FOLLOW THIS:

1. One sentence intro (reference something they know if possible)

2. ALWAYS include this table block:
::: table
Form | Polish | Pronunciation
---|---|---
[forms here]
:::

3. One romantic example sentence with translation

4. ALWAYS end with a drill block:
::: drill
[A romantic challenge to try with their partner]
:::

EXAMPLE RESPONSE:
"Let's learn how to say 'I love you' - the phrase that changes everything.

::: table
Form | Polish | Pronunciation
---|---|---
I love you | Kocham cię | KOH-ham chyeh
I love you (formal) | Kocham Panią/Pana | KOH-ham PAH-nyoh
:::

Try whispering 'Kocham cię, moje słoneczko' (I love you, my little sunshine) before bed tonight.

::: drill
Tonight's challenge: Say 'Kocham cię' while looking into their eyes.
:::"

CRITICAL: If your response does not contain ::: table and ::: drill blocks, YOU HAVE FAILED.
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
                  rootWord: { type: Type.STRING }
                },
                required: ["word", "translation", "type", "importance", "rootWord"]
              }
            }
          },
          required: ["replyText", "newWords"]
        }
      }
    });

    const output = result.text;
    try {
      return res.status(200).json(JSON.parse(output));
    } catch (parseError) {
      return res.status(200).json({ replyText: output, newWords: [] });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
