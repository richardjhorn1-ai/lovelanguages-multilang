
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
  examples?: string[]; 
}

export interface Attachment {
  data: string;
  mimeType: string;
}

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
  async analyzeHistory(messages: {role: string, content: string}[], currentWords: string[]): Promise<ExtractedWord[]> {
    try {
      const historyText = messages
        .filter(m => m.content && !m.content.includes('[Attachment]'))
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
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
                    examples: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "5 Polish sentences using the word with English translations in brackets"
                    }
                  },
                  required: ["word", "translation", "type", "importance", "examples"]
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
        rootWord: (w.rootWord || w.word).toLowerCase().trim()
      }));
    } catch (e) {
      console.error("Batch Extraction Error:", e);
      return [];
    }
  },

  async generateReply(prompt: string, mode: string, images: Attachment[] = []): Promise<string> {
    try {
      const systemInstruction = `
${CORE_PERSONA}
${VISUAL_PROTOCOL}
**MODE:** ${mode.toUpperCase()}
Respond to the user naturally. Focus on being an engaging coach. 
Explain grammar or culture using the ::: blocks provided.
`;

      const parts: any[] = [];
      if (images && images.length > 0) {
        images.forEach(img => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }));
      }
      parts.push({ text: prompt || " " });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: { systemInstruction }
      });

      return response.text || "I'm sorry, I lost my train of thought. What were we saying?";
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return "I'm having a little trouble connecting right now.";
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
