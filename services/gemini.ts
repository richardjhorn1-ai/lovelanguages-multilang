
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
}

export const geminiService = {
  /**
   * Generates a response based on the mode and extracts Polish words from the dialogue.
   */
  async generateAndExtract(prompt: string, mode: string, userLog: string[]): Promise<{ text: string; words: ExtractedWord[] }> {
    const commonInstructions = `
You are part of a couple-based language learning app focused on emotional bonding, confidence, and clarity.

GLOBAL INVARIANTS:
- NEVER reply fully in Polish unless explicitly asked to do so.
- ALWAYS explain Polish using clear English first.
- Polish examples MUST be accompanied by English meaning.
- Prefer high-density information over long sections.
- When teaching verbs, aim to group multiple tenses into ONE wide table.

PEDAGOGY:
- Teach explicitly. Use contrast with English.
- EMOTIONAL TONE: Warm, encouraging, human.

FORMATTING REQUIREMENTS:
- Use Markdown Tables for ANY lists.
- For conjugations, use a single table with multiple tense columns to save vertical space.
- Use ### for headers. Keep headers short.
- Use **bolding** for Polish terms.
- Use [pronunciation-in-brackets] after tricky words.

JSON OUTPUT REQUIREMENT:
You must ALWAYS return a JSON object with:
1. "replyText": Your teaching response.
2. "newWords": An array of Polish words/phrases used. 
   - CRITICAL: For verbs, use the "rootWord" property to specify the infinitive (e.g., for "jestem", the rootWord is "być"). This allows us to group them in the UI.
`;

    const systemInstructions = {
      listen: `You are a fly on the wall translator for an English/Polish couple. ${commonInstructions}`,
      chat: `
You are a conversational Polish language coach. 
If the user asks about a word or grammar, explain the WHY and provide a single compact table for forms.
${commonInstructions}
`,
      tutor: `
You are an expert polyglot tutor.
LOVE LOG: [${userLog.join(', ')}]
Introduce ONE new concept using compact TABLES.
${commonInstructions}
`
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
                  rootWord: { type: Type.STRING, description: "The infinitive or base form for grouping (e.g. 'być' for 'jestem')." }
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
      const parsed = JSON.parse(response.text || '{}');
      return {
        text: parsed.replyText || '',
        words: (parsed.newWords || []).map((w: any) => ({
          ...w,
          word: w.word.toLowerCase().trim(),
          rootWord: w.rootWord?.toLowerCase().trim()
        }))
      };
    } catch (e) {
      return { text: "I'm sorry, I had a little hiccup!", words: [] };
    }
  },

  async generateTitle(firstMessage: string): Promise<string> {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${firstMessage}"`,
    });
    return res.text?.replace(/"/g, '') || "New Chat";
  }
};
