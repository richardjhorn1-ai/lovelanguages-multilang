import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
      contents: `TASK: Language Data Parser.
1. Extract NEW Polish vocabulary from history.
2. For each word, generate exactly 5 diverse, high-quality example sentences in Polish with English translations in brackets.
3. Identify the Root Word (Lemma).
4. Importance 1-5.
5. Provide a "proTip" (max 60 chars) which is a cheeky or helpful tip on how a lover should use this word or a cultural quirk.

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

    const parsed = JSON.parse(response.text || '{}');
    const sanitizedWords = (parsed.newWords || []).map((w: any) => ({
      ...w,
      word: (w.word || '').toLowerCase().trim(),
      rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
    }));

    return res.status(200).json({ newWords: sanitizedWords });
  } catch (e: any) {
    console.error("Analyze History Error:", e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}
