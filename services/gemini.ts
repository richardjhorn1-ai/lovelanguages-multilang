
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
  examples?: string[]; 
  proTip?: string;
}

export interface Attachment {
  data: string;
  mimeType: string;
}

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async analyzeHistory(messages: {role: string, content: string}[], currentWords: string[]): Promise<ExtractedWord[]> {
    try {
      const historyText = messages
        .filter(m => m.content && !m.content.includes('[Media Attached]'))
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

  async generateReply(prompt: string, mode: string, images: Attachment[] = [], userWords: string[] = []): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, images, userLog: userWords })
      });
      const data = await response.json();
      return data.replyText || "I'm having a bit of trouble finding the words.";
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return "I'm having a little trouble connecting right now.";
    }
  },

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: firstMessage, action: 'generateTitle' })
      });
      const data = await response.json();
      return data.title || "New Chat";
    } catch (e) {
      return "New Chat";
    }
  }
};
