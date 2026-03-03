import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth } from '@/utils/api-middleware';
import { getLanguageName, getLanguageConfig, getConjugationPersons } from '@/constants/language-config';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server Configuration Error: GEMINI_API_KEY missing." }, { status: 500, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400, headers: corsHeaders });
  }

  const { wordId } = body || {};
  if (!wordId) {
    return NextResponse.json({ error: "Missing required field: wordId" }, { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch the dictionary entry
  const { data: entry, error: fetchError } = await supabase
    .from('dictionary')
    .select('word, translation, word_type, language_code, conjugations, gender, plural, adjective_forms')
    .eq('id', wordId)
    .eq('user_id', auth.userId)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Word not found in your dictionary' }, { status: 404, headers: corsHeaders });
  }

  const { word, translation, word_type, language_code } = entry;
  const languageCode = language_code || 'pl';
  const languageName = getLanguageName(languageCode);
  const languageConfig = getLanguageConfig(languageCode);
  const hasConjugation = languageConfig?.grammar?.hasConjugation || false;
  const hasGender = languageConfig?.grammar?.hasGender || false;
  const genderTypes = languageConfig?.grammar?.genderTypes || [];

  // Determine what's missing
  const isVerb = word_type === 'verb';
  const isNoun = word_type === 'noun';
  const isAdjective = word_type === 'adjective';

  const existingConj = typeof entry.conjugations === 'string'
    ? (() => { try { return JSON.parse(entry.conjugations); } catch { return null; } })()
    : entry.conjugations;

  const verbNeedsWork = isVerb && hasConjugation && (!existingConj?.present);
  const nounNeedsWork = isNoun && hasGender && (!entry.gender || !entry.plural);
  const adjNeedsWork = isAdjective && hasGender && !entry.adjective_forms;

  if (!verbNeedsWork && !nounNeedsWork && !adjNeedsWork) {
    return NextResponse.json({ complete: true }, { headers: corsHeaders });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    let prompt: string;
    let responseSchema: any;
    let updateData: Record<string, any> = {};

    if (verbNeedsWork) {
      const persons = getConjugationPersons(languageCode);
      prompt = `Give me the COMPLETE present tense conjugation of the ${languageName} verb "${word}" (meaning: "${translation}").

Return a JSON object with this structure (using normalized keys):
{
  "first_singular": "...",
  "second_singular": "...",
  "third_singular": "...",
  "first_plural": "...",
  "second_plural": "...",
  "third_plural": "..."
}

The persons in ${languageName} are: ${persons.join(', ')}
EVERY field must be filled. No nulls or empty strings.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          first_singular: { type: Type.STRING },
          second_singular: { type: Type.STRING },
          third_singular: { type: Type.STRING },
          first_plural: { type: Type.STRING },
          second_plural: { type: Type.STRING },
          third_plural: { type: Type.STRING }
        },
        required: ['first_singular', 'second_singular', 'third_singular', 'first_plural', 'second_plural', 'third_plural']
      };
    } else if (nounNeedsWork) {
      prompt = `For the ${languageName} noun "${word}" (meaning: "${translation}"), provide:
- gender: one of ${genderTypes.join(', ')}
- plural: the plural form of the noun

Return a JSON object: { "gender": "...", "plural": "..." }
EVERY field must be filled.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          gender: { type: Type.STRING },
          plural: { type: Type.STRING }
        },
        required: ['gender', 'plural']
      };
    } else {
      // adjNeedsWork
      prompt = `For the ${languageName} adjective "${word}" (meaning: "${translation}"), provide all gender forms:
- masculine
- feminine
- neuter
- plural

Return a JSON object: { "masculine": "...", "feminine": "...", "neuter": "...", "plural": "..." }
EVERY field must be filled.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          masculine: { type: Type.STRING },
          feminine: { type: Type.STRING },
          neuter: { type: Type.STRING },
          plural: { type: Type.STRING }
        },
        required: ['masculine', 'feminine', 'neuter', 'plural']
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const responseText = response.text || '';
    if (!responseText || !responseText.trim().startsWith('{')) {
      return NextResponse.json({ error: 'Invalid AI response. Please try again.', retryable: true }, { status: 502, headers: corsHeaders });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.', retryable: true }, { status: 502, headers: corsHeaders });
    }

    // Build update payload
    if (verbNeedsWork) {
      const mergedConj = { ...(existingConj || {}), present: parsed };
      updateData.conjugations = mergedConj;
    } else if (nounNeedsWork) {
      if (parsed.gender) updateData.gender = parsed.gender;
      if (parsed.plural) updateData.plural = parsed.plural;
    } else {
      updateData.adjective_forms = parsed;
    }

    const { error: updateError } = await supabase
      .from('dictionary')
      .update(updateData)
      .eq('id', wordId)
      .eq('user_id', auth.userId);

    if (updateError) {
      console.error("[complete-entry] Database update error:", updateError);
      return NextResponse.json({ error: 'Failed to save completed data' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, data: updateData }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("[complete-entry] Error:", e);
    return NextResponse.json({ error: 'Failed to complete entry. Please try again.', retryable: true }, { status: 500, headers: corsHeaders });
  }
}
