import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log("API Handler Invoked (ESM)");

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for GEMINI_API_KEY first, fallback to API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      console.error("Missing API Key (Checked GEMINI_API_KEY and API_KEY)");
      return res.status(500).json({ error: "Server Error: API Key missing" });
    }

    // Vercel Node.js Body Parsing
    // In Vercel Node runtime (without body-parser middleware), req.body might be null if not handled, 
    // but usually Vercel parses JSON automatically for functions.
    let body = req.body;
    
    // Fallback: if body is string, parse it.
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Failed to parse body string:", e);
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }
    
    if (!body) {
        return res.status(400).json({ error: "Missing request body" });
    }

    const { prompt, mode, userLog, action, images } = body;

    const ai = new GoogleGenAI({ apiKey });

    // Action: Generate Title
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '') || "New Chat" });
    }

    // Action: Default Chat/Tutor
    const commonInstructions = `
You are part of a couple-based language learning app focused on emotional bonding, confidence, and clarity.
GLOBAL INVARIANTS:
- NEVER reply fully in Polish unless explicitly asked to do so.
- ALWAYS explain Polish using clear English first.
- Polish examples MUST be accompanied by English meaning.
- Prefer high-density information over long sections.
- When teaching verbs, aim to group multiple tenses into ONE wide table.
PEDAGOGY:
- Teach explicitly. Use contrast with English.
- EMOTIONAL TONE: Warm, encouraging, human.
FORMATTING REQUIREMENTS:
- Use Markdown Tables for ANY lists.
- For conjugations, use a single table with multiple tense columns.
- Use ### for headers. Keep headers short.
- Use **bolding** for Polish terms.
- Use [pronunciation-in-brackets] after tricky words.
JSON OUTPUT REQUIREMENT:
You must ALWAYS return a JSON object with:
1. "replyText": Your teaching response.
2. "newWords": An array of Polish words/phrases used. 
   - CRITICAL: For verbs, use the "rootWord" property to specify the infinitive.
`;

    const systemInstructionsMap: Record<string, string> = {
      listen: `You are a fly on the wall translator for an English/Polish couple. ${commonInstructions}`,
      chat: `You are a conversational Polish language coach. If the user asks about a word or grammar, explain the WHY and provide a single compact table for forms. ${commonInstructions}`,
      tutor: `You are an expert polyglot tutor. LOVE LOG: [${userLog?.join(', ') || ''}] Introduce ONE new concept using compact TABLES. ${commonInstructions}`
    };

    const parts: any[] = [];
    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.data && img.mimeType) {
          parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        }
      });
    }
    parts.push({ text: prompt || " " });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: systemInstructionsMap[mode] || systemInstructionsMap.chat,
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
                required: ["word", "translation", "type", "importance"]
              }
            }
          },
          required: ["replyText", "newWords"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty response from Gemini");
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(response.text);

  } catch (error: any) {
    console.error("API Handler Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}