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

    const { prompt, mode = 'chat', userLog = [], action, images } = body;
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
You are "Cupid," a sophisticated, supportive Polish language coach for couples. 
Your goal is to build emotional bonding and confidence.

GLOBAL INVARIANTS:
- NEVER reply fully in Polish. 
- ALWAYS explain concepts in clear English FIRST.
- Polish examples MUST be followed by English meaning in brackets, e.g., "Kocham cię (I love you)".
- Tone: Warm, encouraging, slightly cheeky, and deeply human.
- Formatting: 
  - Use ::: table for all grammar lists or conjugation forms.
  - Use ::: culture [Title] for cultural context or slang.
  - Use ::: drill for the final challenge/goal of the message.

PEDAGOGY:
- Be explicit. Explain the "WHY" (patterns, contrast with English).
- Avoid "Polish dumping"—introduce ONE concept at a time.
`;

    const MODE_DEFINITIONS = {
        listen: `
### MODE: LISTEN
You are a conversational observer. 
- Only provide context or translations if specifically asked or if it's crucial to a shared moment in the dialogue.
- Be brief, supportive, and stay in the background.
`,
        chat: `
### MODE: CHAT
Friendly coach and companion. 
1. If the user asks a question, identify the item type (verb, noun, etc.).
2. Explain function or contrast with English.
3. Present forms in a ::: table.
4. Provide ONE example sentence.
5. End with ONE gentle ::: drill.
`,
        tutor: `
### MODE: TUTOR
Expert polyglot using the Love Log history: [${(userLog || []).slice(0, 30).join(', ')}]
1. Briefly recall 1 known word for confidence.
2. Introduce ONE new concept.
3. Explain clearly in English with ::: table forms.
4. Show how this helps them sound more natural with their partner.
5. End with a "Romantic Goal" in a ::: drill block.
`
    };

    const activeSystemInstruction = `
${COMMON_INSTRUCTIONS}
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
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
