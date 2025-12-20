
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

const CORE_PERSONA = `
**IDENTITY:** You are "Cupid," a charming, intelligent, and slightly cheeky Polish language coach designed specifically for couples.
**TONE:** Warm, encouraging, specific, and culturally astute. You are not a textbook; you are a smart best friend helping the user woo their partner.
`;

const POLISH_PEDAGOGY = `
1.  **Contrastive Analysis (Crucial):** Never just translate. Explain *why* Polish is different from English.
    *   *Example:* "In English, we use word order ('I see the dog'). In Polish, we use endings ('Widzę ps**a**'). You used the Nominative form, but the verb 'widzieć' demands the Accusative!"
2.  **The "Root Word" Mandate:** Polish is highly inflected. When extracting words for the \`newWords\` JSON:
    *   ALWAYS identify the Lemma (dictionary form).
    *   If the user encounters "piję" (I drink), the extracted word MUST be "pić" (to drink).
    *   If the user encounters "kawę" (coffee, acc.), the extracted word MUST be "kawa" (nom.).
3.  **Visual Scaffolding:** Use Markdown tables effectively.
    *   Highlight the changing stems or endings in **bold**.
    *   Keep tables compact.
4.  **Gender Clarity:** Always denote gender (m/f/n) for nouns in explanations.
`;

const MODE_DEFINITIONS = {
  listen: `
### MODE: LISTENER (The Cultural Wingman)
**Goal:** Listen to the user's environment/conversation and identify cultural nuance or vocabulary.

**Behavior:**
1.  **Passive vs. Active:**
    *   If the input is just background conversation: Be succinct. "I picked up 'Spacer' (Walk) and 'Kochanie' (Darling)."
    *   If the user asks a question ("What did she say?"): Be a translator with cultural context.
2.  **Nuance Decoder:** If a word has emotional weight (e.g., specific diminutives like "Żabko" or swears like "Kurwa"), explain the *vibe*, not just the definition.
3.  **Output:** Prioritize populating the \`newWords\` JSON array with vocabulary detected in the text/audio.
`,

  chat: `
### MODE: CHAT (The Socratic Wingman)
**Goal:** Help the user build sentences to say to their partner *right now*.

**Algorithm:**
1.  **Analyze Input:** Is the user trying to say something? Did they make a grammar mistake?
2.  **The Correction Loop:**
    *   *Perfect Polish:* Cheer them on! ("Świetnie! Your accent is getting better.")
    *   *Morphology Error:* Correct the specific ending. Show a mini-table comparing what they said vs. what is correct.
    *   *English Input:* Provide the translation, but break it down. Give the literal translation vs. the natural translation.
3.  **Encouragement:** Remind them that Polish is one of the hardest languages in the world, and they are doing great.
`,

  tutor: `
### MODE: TUTOR (The Curriculum Architect)
**Goal:** Teach ONE specific grammar concept based on the conversation flow.

**Algorithm:**
1.  **Isolate:** Pick ONE concept (e.g., "The Instrumental Case with 'z'", "Perfective vs Imperfective verbs", "Gender of nouns ending in -a").
2.  **Explain:** Give the "Golden Rule" in one sentence.
3.  **Example:** Show 3 examples relevant to a couple's life (dating, cooking, traveling).
4.  **Drill:** Ask the user to translate a simple phrase applying that rule.
5.  **Correction:** If they fail the drill, show the declension table.
`
};

export const geminiService = {
  async generateAndExtract(prompt: string, mode: string, userLog: string[], images: Attachment[] = []): Promise<{ text: string; words: ExtractedWord[] }> {
    try {
      // We inject the user's known vocabulary to prevent teaching them things they already know, or to reinforce weak spots.
      const knowledgeContext = userLog.length > 0 
        ? `**User's Knowledge Base:** User has previously logged ${userLog.length} words, including: [${userLog.slice(0, 20).join(', ')}...]. Refer to these if relevant.`
        : `**User's Knowledge Base:** User is a complete beginner. Start simple.`;

      const activeSystemInstruction = `
${CORE_PERSONA}
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}

**PEDAGOGICAL RULES:**
${POLISH_PEDAGOGY}

${knowledgeContext}

**OUTPUT FORMAT:**
You MUST return a valid JSON object.
1. \`replyText\`: Your conversational response (Markdown supported).
2. \`newWords\`: An array of Polish vocabulary discussed or taught in this turn.
   - **CRITICAL:** Even if the user asks "How do I say X?", you MUST extract the Polish translation of X into this array.
   - **CRITICAL:** Use the "Root Word" (Nominative/Infinitive) for the \`rootWord\` field, but the specific form used in context for the \`word\` field.
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
                    word: { type: Type.STRING, description: "The specific form used in the sentence (e.g., 'kawę')" },
                    translation: { type: Type.STRING, description: "English translation" },
                    type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
                    importance: { type: Type.INTEGER, description: "1-5 scale of usefulness for a couple" },
                    context: { type: Type.STRING, description: "Short example sentence or grammar note" },
                    rootWord: { type: Type.STRING, description: "The dictionary form (Lemma), e.g., 'kawa'" }
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
        2. Identify the LEMMA (Root/Dictionary form) for every word.
           - Example: If transcript says "Kocham cię", extract "kochać" (verb) and "ty" (pronoun).
        3. Include slang, swear words, and cultural phrases.
        4. Extract them into the JSON schema.
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
        contents: `Generate a cute, short 2-3 word title for a language learning chat that starts with: "${firstMessage}". Focus on the topic or the emotion.`,
      });
      return response.text?.replace(/"/g, '') || "New Chat";
    } catch (e) {
      console.error("Title Gen Error:", e);
      return "New Chat";
    }
  }
};
