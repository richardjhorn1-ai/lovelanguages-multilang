
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Correct initialization of GoogleGenAI following SDK guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
}

export const geminiService = {
  /**
   * Generates a response based on the mode and extracts Polish words from the dialogue.
   */
  async generateAndExtract(prompt: string, mode: string, userLog: string[]): Promise<{ text: string; words: ExtractedWord[] }> {
    const systemInstructions = {
      listen: "You are a fly on the wall translator. Translate the following English/Polish conversation segments into the other language. Focus on accuracy and natural phrasing.",
      chat: "You are a friendly Polish language learning assistant for couples. The user currently knows English and is learning Polish. Engage in conversation, provide corrections gently, and help them express romantic or everyday couple situations in Polish.",
      tutor: `You are an expert Polish tutor. Based on the words they have already encountered: [${userLog.join(', ')}], provide a short lesson, review a few concepts, or quiz them. Keep it encouraging and cute.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[mode as keyof typeof systemInstructions] || systemInstructions.chat,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: {
              type: Type.STRING,
              description: "Your helpful response in the conversation."
            },
            newWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "The Polish word or phrase." },
                  translation: { type: Type.STRING, description: "The English translation." },
                  type: { 
                    type: Type.STRING, 
                    enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] 
                  },
                  importance: { type: Type.INTEGER, description: "Importance rank from 1-100." },
                  context: { type: Type.STRING, description: "Contextual usage." }
                },
                required: ["word", "translation", "type", "importance"]
              }
            }
          },
          required: ["replyText", "newWords"]
        }
      }
    });

    try {
      // Fixed: Explicitly map the properties from the model's JSON output to the function's return type.
      const parsed = JSON.parse(response.text || '{}');
      return {
        text: parsed.replyText || '',
        words: parsed.newWords || []
      };
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      // Fixed: Ensure the catch block return object matches the declared interface { text, words }.
      return { text: "I'm sorry, I had a little hiccup!", words: [] };
    }
  },

  /**
   * Simple method for chat history titles
   */
  async generateTitle(firstMessage: string): Promise<string> {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${firstMessage}"`,
    });
    return res.text?.replace(/"/g, '') || "New Chat";
  }
};
