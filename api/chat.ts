
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
        contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '') || "New Chat" });
    }

    // --- Action: Extract Vocabulary from Transcript ---
    if (action === 'extractFromTranscript') {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Here is a transcript of a voice lesson between a tutor and a student:
            
            ${transcript}
            
            Identify any Polish vocabulary that was taught or practiced. Extract it into the JSON schema.`,
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

    const PEDAGOGICAL_INVARIANTS = `
1. **Contrastive Analysis:** Never just translate. Explain the delta between English Logic and Polish Logic.
2. **Visual Scaffolding:** Use Markdown Tables for ANY morphological changes.
3. **Gender/Case Explicit:** Nouns must always be identified by gender (m/f/n).
4. **Tone:** Warm, specific, romantic, non-academic.
5. **JSON Adherence:** The response MUST be valid JSON.
`;

    const MODE_DEFINITIONS = {
        listen: `
### ROLE: THE SILENT SCRIBE
You are a passive, background observer for a couple. You are "overhearing" their real-world interaction. 

### BEHAVIORAL LAWS:
1. DO NOT initiate drills or lessons. 
2. DO NOT interrupt the flow of their conversation.
3. If the user is talking to someone else, STAY SILENT and just listen.
4. Your "replyText" should be a 1-2 sentence summary of the language moments you captured (e.g., "I caught some great verbs while you were talking about dinner!").
5. ONLY provide a full explanation if the user explicitly looks at the phone and asks: "Hey, what was that word?"

### GOAL:
Your primary value is the JSON "newWords" array. Focus 90% of your energy on accurately extracting words from the background chatter into the Love Log.
`,
        chat: `
**MODE: SOCRATIC COACH**
- **Objective:** Guide user to build sentences.
- **Algorithm:** Acknowledge -> Isolate Grammar -> Table -> Drill.
- **Context:** User knows [${userLog?.slice(0, 10).join(', ')}...].
`,
        tutor: `
**MODE: CURRICULUM ARCHITECT**
- **Objective:** Teach ONE concept based on: [${userLog?.slice(0, 50).join(', ') || 'Nothing yet'}].
- **Algorithm:** Rule -> Example -> Drill.
`
    };

    const activeSystemInstruction = `
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
${PEDAGOGICAL_INVARIANTS}
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
