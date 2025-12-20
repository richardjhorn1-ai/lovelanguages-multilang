
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
}

export interface Attachment {
  data: string;
  mimeType: string;
}

// Initialize the client directly.
// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CORE_PERSONA = `
**IDENTITY:** You are "Cupid," a charming, intelligent, and slightly cheeky Polish language coach designed specifically for couples.
**TONE:** Warm, encouraging, specific, and culturally astute.
**GOAL:** Teach Polish through the lens of romance, dating, and daily life.
`;

const VISUAL_PROTOCOL = `
**STRICT FORMATTING RULES:**
1.  **MARKDOWN ONLY:** You must ONLY use Markdown.
2.  **FORBIDDEN:** Do NOT write HTML, CSS, <span> tags, hex codes (like #FF4761), or class names.
3.  **HIGHLIGHTING:** To highlight a Polish word, wrap it in double asterisks: **słowo**. The app will style it automatically.
    *   *Correct:* To say hello, say **Cześć**.
    *   *Incorrect:* To say hello, say #FF4761 Cześć.

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
1.  **Contrastive Analysis:** Explain *why* Polish is different from English (e.g., cases vs word order).
2.  **The "Root Word" Mandate:** In the JSON output, ALWAYS extract the Lemma (dictionary form).
3.  **Gender Clarity:** Always denote gender (m/f/n).
`;

const MODE_DEFINITIONS = {
  listen: `
### MODE: LISTENER
**Goal:** Listen to the environment.
**Behavior:**
1.  **Passive:** If the input is just a single word (like "Jest") or a phrase, give a SHORT definition (1-2 sentences).
2.  **Active:** Only give full lessons/drills if the user *explicitly* asks "Teach me X" or "Explain X".
3.  **Output:** Use ::: culture blocks if explaining a nuance.
`,

  chat: `
### MODE: CHAT
**Goal:** Help the user build sentences.
**Algorithm:**
1.  **Analyze:** Check for grammar mistakes.
2.  **Correction:**
    *   Use ::: table to compare forms.
    *   Use ::: culture for slang.
3.  **Drill:** Always end with a ::: drill block.
`,

  tutor: `
### MODE: TUTOR
**Goal:** Teach ONE concept deeply.
**Algorithm:**
1.  **Explain:** The Golden Rule.
2.  **Visuals:** Use a ::: table to show the pattern.
3.  **Drill:** End with a ::: drill block.
`
};

export const geminiService = {
  async generateAndExtract(prompt: string, mode: string, userLog: string[], images: Attachment[] = []): Promise<{ text: string; words: ExtractedWord[] }> {
    try {
      const knowledgeContext = userLog.length > 0 
        ? `**User's Knowledge:** [${userLog.slice(0, 20).join(', ')}...]`
        : `**User's Knowledge:** Beginner`;

      const activeSystemInstruction = `
${CORE_PERSONA}
${VISUAL_PROTOCOL}
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
${POLISH_PEDAGOGY}
${knowledgeContext}

**CRITICAL:**
- Return JSON.
- \`replyText\` must use the ::: block syntax.
- **NEVER** output HTML or Hex Codes in \`replyText\`.
`;

      const parts: any[] = [];
      if (images && Array.isArray(images)) {
        images.forEach((img) => {
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

      if (!response.text) throw new Error("Empty response");
      
      const parsed = JSON.parse(response.text);
      
      return {
        text: parsed.replyText || '',
        words: (parsed.newWords || []).map((w: any) => ({
          ...w,
          word: w.word.toLowerCase().trim(),
          rootWord: w.rootWord?.toLowerCase().trim()
        }))
      };

    } catch (e) {
      console.error("Gemini Service Error:", e);
      return { text: "I'm sorry, I had a little hiccup connecting to the brain! Please try again.", words: [] };
    }
  },

  async extractFromTranscript(transcript: string): Promise<ExtractedWord[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this transcript: ${transcript}. Extract Polish vocabulary (Lemma forms).`,
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

      if (!response.text) return [];
      const parsed = JSON.parse(response.text);
      
      return (parsed.newWords || []).map((w: any) => ({
        ...w,
        word: w.word.toLowerCase().trim(),
        rootWord: w.rootWord?.toLowerCase().trim()
      }));

    } catch (e) {
      console.error("Extraction Error:", e);
      return [];
    }
  },

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a cute, short 2-3 word title for a chat starting with: "${firstMessage}".`,
      });
      return response.text?.replace(/"/g, '') || "New Chat";
    } catch (e) {
      return "New Chat";
    }
  }
};
