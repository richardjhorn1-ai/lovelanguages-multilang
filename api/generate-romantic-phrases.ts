import { GoogleGenAI, Type } from '@google/genai';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';
import { LANGUAGE_CONFIGS } from '../constants/language-config.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const {
      targetLanguage = 'pl',
      nativeLanguage = 'en',
      count = 20,
      excludePhrases = [],
      difficulty
    } = req.body;

    const targetConfig = LANGUAGE_CONFIGS[targetLanguage];
    const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];

    if (!targetConfig || !nativeConfig) {
      return res.status(400).json({ error: 'Invalid language code' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const difficultyInstruction = difficulty
      ? `Generate ONLY ${difficulty} level phrases.`
      : 'Include a mix of beginner (simple endearments), intermediate (expressing feelings), and advanced (poetic expressions).';

    const excludeInstruction = excludePhrases.length > 0
      ? `\n\nDO NOT include these phrases (already generated):\n${excludePhrases.slice(0, 50).join('\n')}`
      : '';

    const prompt = `Generate ${count} romantic phrases in ${targetConfig.name} with ${nativeConfig.name} translations.

These are sweet, loving expressions someone would say to their romantic partner. They should be:
- Culturally appropriate for ${targetConfig.name} speakers
- Natural and commonly used (not awkward literal translations)
- A mix of endearments, compliments, and expressions of love

${difficultyInstruction}

Difficulty levels:
- beginner: Simple phrases like "I love you", "You're beautiful", "Good night darling"
- intermediate: More complex like "I can't stop thinking about you", "You make me so happy"
- advanced: Poetic/deep expressions like "You are the air I breathe", "My heart belongs only to you"
${excludeInstruction}

Generate unique, varied phrases. Each phrase must have a unique ID starting with "rp-gen-".`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique ID like rp-gen-1, rp-gen-2, etc.' },
          word: { type: Type.STRING, description: `The phrase in ${targetConfig.name}` },
          translation: { type: Type.STRING, description: `Translation in ${nativeConfig.name}` },
          context: { type: Type.STRING, description: 'Brief context for when to use this phrase' },
          difficulty: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'] }
        },
        required: ['id', 'word', 'translation', 'context', 'difficulty']
      }
    };

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.8 // Higher for more variety
      }
    });

    const responseText = result.text;

    if (!responseText) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    let phrases;
    try {
      phrases = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse AI response:', responseText);
      return res.status(500).json({ error: 'Invalid AI response format' });
    }

    // Add language codes to each phrase
    const enrichedPhrases = phrases.map((p: any, idx: number) => ({
      ...p,
      id: p.id || `rp-gen-${Date.now()}-${idx}`,
      targetLanguageCode: targetLanguage,
      nativeLanguageCode: nativeLanguage
    }));

    return res.status(200).json({ phrases: enrichedPhrases });

  } catch (error: any) {
    console.error('Generate romantic phrases error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate phrases' });
  }
}
