import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';
import { getLanguageName, getLanguageConfig, getConjugationPersons } from '../constants/language-config.js';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY missing." });
  }

  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON format in request body." });
    }
  }

  const { wordId } = body || {};
  if (!wordId) {
    return res.status(400).json({ error: "Missing required field: wordId" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
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
    return res.status(404).json({ error: 'Word not found in your dictionary' });
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
    return res.status(200).json({ complete: true });
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
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const responseText = response.text || '';
    if (!responseText || !responseText.trim().startsWith('{')) {
      return res.status(502).json({ error: 'Invalid AI response. Please try again.', retryable: true });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return res.status(502).json({ error: 'Failed to parse AI response. Please try again.', retryable: true });
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
      return res.status(500).json({ error: 'Failed to save completed data' });
    }

    return res.status(200).json({ success: true, data: updateData });
  } catch (e: any) {
    console.error("[complete-entry] Error:", e);
    return res.status(500).json({ error: 'Failed to complete entry. Please try again.', retryable: true });
  }
}
