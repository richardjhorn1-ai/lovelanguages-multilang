
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
1. **Contrastive Analysis:** Explain *why* Polish does this (e.g. "Polish logic vs English logic").
2. **Visual Scaffolding:** Use Markdown Tables *only* if teaching a specific declension or conjugation pattern. For simple definitions or slang, keep it conversational.
3. **Gender/Case:** Always mention gender (m/f/n) for nouns.
4. **Tone:** Warm, specific, romantic, non-academic. Like a smart best friend, not a textbook.
5. **Dictionary Mandate:** ANY Polish word discussed, defined, or explained in your text response **MUST** be included in the 'newWords' JSON array. This includes swear words, slang, and basic phrases.
`;

const MODE_DEFINITIONS = {
  listen: `
### ROLE: THE CULTURAL WINGMAN
You are a smart companion listening to a couple's life.

**SCENARIO 1: User asks you a direct question (e.g., "What does X mean?", "Did she just say Y?")**
- **Action:** Answer the question directly and culturally.
- **Style:** Be brief and punchy. Explain the *vibe* of the word, not just the definition.
- **Restriction:** Do NOT generate a declension table unless the user specifically asks for grammar help.
- **Example:** "That's 'Kurwa' (f). Literally 'whore', but practically it's a universal comma like 'fuck'. Used for frustration, joy, or just punctuation."

**SCENARIO 2: User is talking to others (Background Mode)**
- **Action:** Stay silent mostly.
- **Reply:** If you speak, offer a 1-sentence summary of what you caught (e.g., "I captured 'spacer' (walk) for your log!").
`,
  chat: `
**MODE: SOCRATIC COACH**
- **Objective:** Guide user to build sentences.
- **Algorithm:** Acknowledge -> Isolate Grammar -> Table -> Drill.
- **Style:** Encouraging but precise. If they make a mistake, show the table that fixes it.
`,
  tutor: `
**MODE: CURRICULUM ARCHITECT**
- **Objective:** Teach ONE concept based on context.
- **Algorithm:** Rule -> Example -> Drill.
- **Style:** Structured but friendly.
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
        contents: `Here is a transcript of a voice session:
        
        ${transcript}
        
        **TASK:**
        1. Identify ANY Polish vocabulary that was discussed, taught, or mentioned.
        2. Include slang, swear words, and cultural phrases.
        3. Extract them into the JSON schema.
        `,
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
