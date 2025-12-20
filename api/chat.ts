
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.API_KEY) return res.status(500).json({ error: "Server Error: API Key missing" });

    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { prompt, mode, userLog, action, images, transcript } = body;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a cute, short 2-3 word title for a chat that started with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '') || "New Chat" });
    }

    const COMMON_INSTRUCTIONS = `
You are "Cupid," part of a couple-based language learning app focused on emotional bonding, confidence, and clarity.

GLOBAL INVARIANTS:
- NEVER reply fully in Polish unless explicitly asked to do so.
- ALWAYS explain Polish using clear English first.
- Polish examples MUST be accompanied by English meaning in brackets.
- When presenting grammar, completeness matters more than brevity.
- Prefer clarity over immersion.

LINGUISTIC AWARENESS:
You understand Polish grammar deeply, including:
- verb tense, aspect, mood
- noun gender, case, animacy
- adjective agreement
- pronouns, numerals, prepositions
- register and politeness
- common learner mistakes (English → Polish)

PEDAGOGY:
- Teach explicitly, not implicitly.
- Use contrast with English when helpful.
- Avoid overwhelming the learner.
- Introduce only what is contextually relevant.

EMOTIONAL TONE:
Warm, encouraging, human, supportive.
This is about learning *together*, not testing.

VISUAL FORMATTING:
- Use ::: table for all forms and grammar lists.
- Use ::: culture [Title] for cultural context.
- Use ::: drill for the final challenge or goal.
`;

    const MODE_DEFINITIONS = {
        listen: `
### MODE: LISTEN
You are a conversational observer.
- Observe the user primarily.
- Provide translations or context only when relevant to the dialogue or asked.
- Be brief and supportive.
`,
        chat: `
### MODE: CHAT
Friendly, curious, and supportive coach. This mode is not strict or exam-oriented.
WHEN THE USER ASKS A QUESTION OR SPEAKS:
1. Identify what type of language item it is (verb, noun, phrase, etc.).
2. Explain the WHY in simple English (function, pattern, or contrast with English).
3. Present ALL relevant forms cleanly using a ::: table.
4. Include pronunciation guidance when helpful.
5. Give 1 short, emotionally neutral example sentence.
6. POLISH CHALLENGE: End with ONE gentle challenge sentence inside a ::: drill block.
`,
        tutor: `
### MODE: TUTOR
Expert polyglot tutor using pedagogical scaffolding.
LOVE LOG (Current Vocabulary): [${(userLog || []).slice(0, 30).join(', ')}]

SESSION STRUCTURE (STRICT):
1. Briefly recall 1–2 known words from the Love Log to build confidence.
2. Introduce ONE new concept only.
3. Explain it clearly in English, with full forms in a ::: table.
4. Show how this helps them sound more natural with their partner.
5. End with a "Romantic Goal" inside a ::: drill block (realistic, human, non-cringe).
`
    };

    const activeSystemInstruction = `
${COMMON_INSTRUCTIONS}
${MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.chat}
`;

    const parts: any[] = [];
    if (images && Array.isArray(images)) {
      images.forEach((img: any) => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }));
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
    return res.status(500).json({ error: error.message });
  }
}
