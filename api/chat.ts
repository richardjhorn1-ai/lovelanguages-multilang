
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
    let body = req.body;
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

    // --- SYSTEMS ENGINEERING: PROMPT ARCHITECTURE ---

    const PEDAGOGICAL_INVARIANTS = `
1. **Contrastive Analysis:** Never just translate. Explain the delta between English Logic and Polish Logic. (e.g., "In English you say 'I have', in Polish we say 'At me is'").
2. **Visual Scaffolding:** Use Markdown Tables for ANY morphological changes (cases, conjugations). Tables must be compact.
3. **Gender/Case Explicit:** Nouns must always be identified by gender (m/f/n) if relevant to the grammar rule being discussed.
4. **Tone:** Warm, specific, romantic, non-academic. Use emoji sparingly but effectively.
5. **JSON Adherence:** The response MUST be valid JSON matching the schema. The 'newWords' array acts as the user's permanent memory bank.
`;

    const MODE_DEFINITIONS = {
        listen: `
**MODE: SIMULTANEOUS INTERPRETER (Fly on the Wall)**
- **Objective:** Facilitate understanding between partners without interrupting the flow.
- **Input Analysis:** Detect the language of the prompt.
- **Output Logic:**
  - If English -> Provide Polish translation + 1-sentence cultural context (if needed).
  - If Polish -> Provide English translation + 1-sentence grammatical nuance (if needed).
- **Constraint:** Be invisible. Do not teach lessons unless explicitly asked.
`,
        chat: `
**MODE: SOCRATIC COACH (Active Conversation)**
- **Objective:** Guide the user to construct sentences themselves using the "Lego Block" method.
- **Algorithm:**
  1. Acknowledge the user's intent.
  2. Isolate the key grammatical structure (e.g., "Instrumental Case").
  3. Provide the "Root" word + the "Ending" rule in a Markdown Table.
  4. Ask the user to assemble them.
- **Constraint:** Prioritize high-frequency "couple" vocabulary (emotions, plans, compliments).
`,
        tutor: `
**MODE: CURRICULUM ARCHITECT (Structured Learning)**
- **Objective:** Introduce ONE new high-value concept based on the user's history.
- **Context:** User has learned: [${userLog?.slice(0, 50).join(', ') || 'Nothing yet'}].
- **Algorithm:**
  1. Select a concept that bridges a gap in their current log.
  2. Present the "Concept" (The Rule).
  3. Present the "Example" (The Sentence).
  4. Present the "Drill" (A question for the user).
- **Constraint:** Maximum 150 words of text. Rely heavily on tables.
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
                  word: { type: Type.STRING, description: "The conjugated/inflected form as used in the sentence" },
                  translation: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
                  importance: { type: Type.INTEGER },
                  context: { type: Type.STRING },
                  rootWord: { type: Type.STRING, description: "The dictionary headword (Infinitive for verbs, Nominative for nouns)" }
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
