import { GoogleGenAI, Type } from "@google/genai";

// Vercel Serverless Function (Node.js runtime)
export default async function handler(req: any, res: any) {
  // 1. CORS Headers (Optional but good for safety if needed later)
  // Vercel handles CORS via vercel.json usually, but we can set headers if this is a direct fetch.
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Server Error: process.env.API_KEY is missing");
    return res.status(500).json({ 
      error: "Server Configuration Error", 
      details: "API Key is missing on the server. Please check Vercel environment variables." 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // In Vercel Node.js functions, req.body is automatically parsed if Content-Type is application/json
    const { prompt, mode, userLog, action, images } = req.body;

    // Handle Title Generation
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '') || "New Chat" });
    }

    // Default action: Chat/Tutor Generation
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
- For conjugations, use a single table with multiple tense columns to save vertical space.
- Use ### for headers. Keep headers short.
- Use **bolding** for Polish terms.
- Use [pronunciation-in-brackets] after tricky words.

JSON OUTPUT REQUIREMENT:
You must ALWAYS return a JSON object with:
1. "replyText": Your teaching response.
2. "newWords": An array of Polish words/phrases used. 
   - CRITICAL: For verbs, use the "rootWord" property to specify the infinitive (e.g., for "jestem", the rootWord is "być"). This allows us to group them in the UI.
`;

    const systemInstructionsMap: Record<string, string> = {
      listen: `You are a fly on the wall translator for an English/Polish couple. ${commonInstructions}`,
      chat: `
You are a conversational Polish language coach. 
If the user asks about a word or grammar, explain the WHY and provide a single compact table for forms.
${commonInstructions}
`,
      tutor: `
You are an expert polyglot tutor.
LOVE LOG: [${userLog?.join(', ') || ''}]
Introduce ONE new concept using compact TABLES.
${commonInstructions}
`
    };

    // Construct content parts (Text + Images)
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
                  rootWord: { type: Type.STRING, description: "The infinitive or base form for grouping (e.g. 'być' for 'jestem')." }
                },
                required: ["word", "translation", "type", "importance"]
              }
            }
          },
          required: ["replyText", "newWords"]
        }
      }
    });

    // Send the text response directly. 
    // We set Content-Type to JSON because the model is instructed to return JSON.
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(response.text);

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed to process request", details: error.message });
  }
}