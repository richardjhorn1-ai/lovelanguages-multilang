
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Priority 1: GEMINI_API_KEY (as requested)
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

    // Diagnostics: If no prompt or action is provided, it's an invalid usage but not a crash
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
        contents: `Generate a cute 2-3 word title for a Polish session about: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '').trim() || "New Session" });
    }

    // Core Instruction logic
    const activeSystemInstruction = `
You are "Cupid," a supportive Polish coach for couples.
GLOBAL RULES:
- Never reply fully in Polish.
- Always explain concepts in clear English first.
- Use ::: table for grammar.
- Use ::: drill for the final challenge.
- Be warm and encouraging.
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
