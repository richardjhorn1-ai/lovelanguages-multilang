
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server Error: API Key missing" });

    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { prompt, mode, userLog, action, images, transcript } = body;
    const ai = new GoogleGenAI({ apiKey });

    // --- Action: Title Gen ---
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a cute, short 2-3 word title for: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '') || "New Chat" });
    }

    // --- Action: Transcript ---
    if (action === 'extractFromTranscript') {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze transcript: ${transcript}. Extract Polish vocabulary (Lemma forms).`,
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
        return res.status(200).send(response.text);
    }

    // --- Default Chat ---
    const CORE_PERSONA = `
**IDENTITY:** You are "Cupid," a charming, intelligent, and slightly cheeky Polish language coach designed specifically for couples.
**TONE:** Warm, encouraging, specific, and culturally astute.
`;

    const VISUAL_PROTOCOL = `
**STRICT FORMATTING RULES:**
1.  **MARKDOWN ONLY:** You must ONLY use Markdown.
2.  **FORBIDDEN:** Do NOT write HTML, CSS, <span> tags, hex codes (like #FF4761), or class names.
3.  **HIGHLIGHTING:** To highlight a Polish word, wrap it in double asterisks: **słowo**. The app will style it automatically.
    *   *Correct:* **Cześć**
    *   *Incorrect:* #FF4761 Cześć

**UI BLOCKS:**
Use these blocks to structure your response. Content inside must be Markdown.

1.  **Cultural/Slang Cards:**
    ::: culture [Title]
    [Content]
    :::

2.  **Grammar Tables:** (Use standard markdown table syntax)
    ::: table
    | Person | Polish | English |
    | :--- | :--- | :--- |
    | I | **Ja** | I am |
    :::

3.  **Drills:**
    ::: drill
    [Content]
    :::
`;

    const POLISH_PEDAGOGY = `
1.  **Contrastive Analysis:** Explain *why* Polish is different.
2.  **The "Root Word" Mandate:** ALWAYS extract the Lemma.
`;

    const MODE_DEFINITIONS = {
        listen: `
### MODE: LISTENER
**Goal:** Listen to the environment.
**Behavior:**
1.  **Passive:** If input is short, give a SHORT definition.
2.  **Active:** Only give full lessons if explicitly asked.
`,
        chat: `
### MODE: CHAT
**Goal:** Help the user build sentences.
**Behavior:** Correct grammar, explain slang, and ALWAYS end with a ::: drill.
`,
        tutor: `
### MODE: TUTOR
**Goal:** Teach ONE concept.
**Behavior:** Explain rule, show ::: table, end with ::: drill.
`
    };

    const activeSystemInstruction = `
${CORE_PERSONA}
${VISUAL_PROTOCOL}
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
${POLISH_PEDAGOGY}
User Knowledge: [${userLog?.slice(0, 20).join(', ')}...]

**CRITICAL:** Return JSON. No HTML/CSS.
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

    return res.status(200).send(response.text);

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
