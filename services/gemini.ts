
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
// Vite replaces process.env.API_KEY with the actual key at build time via define in vite.config.ts
// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
`,
  tutor: `
**MODE: CURRICULUM ARCHITECT**
- **Objective:** Teach ONE concept based on context.
- **Algorithm:** Rule -> Example -> Drill.
`
};

export const geminiService = {
  async generateAndExtract(prompt: string, mode: string, userLog: string[], images: Attachment[] = []): Promise<{ text: string; words: ExtractedWord[] }> {
    try {
      const activeSystemInstruction = `
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
**Context:** User knows [${userLog?.slice(0, 50).join(', ')}...].
${PEDAGOGICAL_INVARIANTS}
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
        contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${firstMessage}"`,
      });
      return response.text?.replace(/"/g, '') || "New Chat";
    } catch (e) {
      console.error("Title Gen Error:", e);
      return "New Chat";
    }
  }
};
