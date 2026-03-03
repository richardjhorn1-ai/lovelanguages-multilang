import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth } from '@/utils/api-middleware';
import { LANGUAGE_CONFIGS } from '@/constants/language-config';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const {
      targetLanguage = 'pl',
      nativeLanguage = 'en',
      count = 20,
      excludePhrases = [],
      difficulty
    } = body;

    const targetConfig = LANGUAGE_CONFIGS[targetLanguage];
    const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];

    if (!targetConfig || !nativeConfig) {
      return NextResponse.json({ error: 'Invalid language code' }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500, headers: corsHeaders });
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
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.8 // Higher for more variety
      }
    });

    const responseText = result.text;

    if (!responseText) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500, headers: corsHeaders });
    }

    let phrases;
    try {
      phrases = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500, headers: corsHeaders });
    }

    // Add language codes to each phrase
    const enrichedPhrases = phrases.map((p: any, idx: number) => ({
      ...p,
      id: p.id || `rp-gen-${Date.now()}-${idx}`,
      targetLanguageCode: targetLanguage,
      nativeLanguageCode: nativeLanguage
    }));

    return NextResponse.json({ phrases: enrichedPhrases }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Generate romantic phrases error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate phrases' }, { status: 500, headers: corsHeaders });
  }
}
