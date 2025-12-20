
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
**IDENTITY:** You are "Cupid," a charming and intelligent Polish language coach for couples.
**TONE:** Warm, slightly cheeky, and culturally astute.
**GOAL:** Teach Polish through the lens of romance and daily life.
`;

const VISUAL_PROTOCOL = `
**STRICT FORMATTING RULES:**
1. **MARKDOWN ONLY.** No HTML.
2. **HIGHLIGHTING:** Wrap Polish words in double asterisks: **słowo**. 
3. **UI BLOCKS:** Use ::: culture [Title], ::: table, and ::: drill for structured content.
`;

export const geminiService = {
  // NEW: Dedicated Batch Analysis
  async analyzeHistory(messages: {role: string, content: string}[], currentWords: string[]): Promise<ExtractedWord[]> {
    try {
      const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n---\n');
      const knownContext = currentWords.length > 0 ? `User already knows: [${currentWords.join(', ')}]` : "User is a beginner.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `EXTRACTOR TASK: Review this Polish-English chat history. 
        1. Identify any NEW Polish vocabulary or useful phrases used.
        2. DO NOT extract words already in the 'Known' list.
        3. For verbs, extract the Lemma (base form).
        4. Return as JSON.
        
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
                    rootWord: { type: Type.STRING }
                  },
                  required: ["word", "translation", "type", "importance", "rootWord"]
                }
              }
            },
            required: ["newWords"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return (parsed.newWords || []).map((w: any) => ({
        ...w,
        word: w.word.toLowerCase().trim(),
        rootWord: w.rootWord?.toLowerCase().trim() || w.word.toLowerCase().trim()
      }));
    } catch (e) {
      console.error("Batch Extraction Error:", e);
      return [];
    }
  },

  // Simplified Chat function focusing only on the reply (Persona preservation)
  async generateReply(prompt: string, mode: string, images: Attachment[] = []): Promise<string> {
    try {
      const activeSystemInstruction = `
${CORE_PERSONA}
${VISUAL_PROTOCOL}
**MODE:** ${mode.toUpperCase()}
Respond to the user naturally. Use the specified UI blocks if explaining grammar or culture.
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
        }
      });

      return response.text || '';
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return "I'm sorry, I had a little hiccup! Please try again.";
    }
  },

  async extractFromTranscript(transcript: string): Promise<ExtractedWord[]> {
    return this.analyzeHistory([{role: 'history', content: transcript}], []);
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
