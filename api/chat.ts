
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
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Server Error: API Key missing" });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }
    
    if (!body) {
        return res.status(400).json({ error: "Missing request body" });
    }

    const { prompt, mode, userLog, action, images, transcript } = body;
    const ai = new GoogleGenAI({ apiKey });

    // --- Action: Generate Title ---
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${prompt}". Focus on the emotion/topic.`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '') || "New Chat" });
    }

    // --- Action: Extract Vocabulary from Transcript ---
    if (action === 'extractFromTranscript') {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Here is a transcript of a voice lesson between a tutor and a student:
            
            ${transcript}
            
            Identify any Polish vocabulary that was taught or practiced. Extract it into the JSON schema.
            CRITICAL: Always find the LEMMA (Root form). If transcript says "psem", you extract "pies".`,
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
                                    rootWord: { type: Type.STRING }
                                },
                                required: ["word", "translation", "type", "importance", "rootWord"]
                            }
                        }
                    }
                }
            }
        });
        
        if (!response || !response.text) throw new Error("Empty response");
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(response.text);
    }

    // --- Default Action: Chat & Extract ---

    const CORE_PERSONA = `
**IDENTITY:** You are "Cupid," a charming, intelligent, and slightly cheeky Polish language coach designed specifically for couples.
**TONE:** Warm, encouraging, specific, and culturally astute.
`;

    const POLISH_PEDAGOGY = `
1.  **Contrastive Analysis:** Explain *why* Polish is different from English (cases vs order).
2.  **Root Word Mandate:** Always identify the Lemma (dictionary form) in the \`newWords\` array.
3.  **Visual Scaffolding:** Use Markdown tables to show declensions. Highlight changes in bold.
4.  **Gender Clarity:** Always denote gender (m/f/n).
`;

    const MODE_DEFINITIONS = {
        listen: `
### MODE: LISTENER (The Cultural Wingman)
**Goal:** Listen to the background conversation and identify vocabulary.
1. Be passive unless asked a direct question.
2. If summarizing, keep it brief (1-2 sentences).
3. Focus on populating the \`newWords\` JSON array with the Lemma forms of words heard.
`,
        chat: `
### MODE: CHAT (The Socratic Wingman)
**Goal:** Help the user build sentences for their partner.
1. **Analyze:** Check for grammar mistakes (especially Case endings).
2. **Correct:** If they used the wrong ending, show a table comparing their ending vs the correct one.
3. **Encourage:** Keep the romance alive.
`,
        tutor: `
### MODE: TUTOR (The Curriculum Architect)
**Goal:** Teach ONE specific grammar concept.
1. **Isolate:** Pick ONE rule (e.g. "Accusative for food/drink").
2. **Drill:** Ask the user to translate simple phrases.
3. **Correct:** Be strict but kind.
`
    };

    const activeSystemInstruction = `
${CORE_PERSONA}
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
${POLISH_PEDAGOGY}

**Context:** User knows [${userLog?.slice(0, 20).join(', ')}...].
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

    const response = await ai.models.generateContent({
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
