import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { getCorsHeaders, handleCorsPreflightResponse, verifyAuth } from '@/utils/api-middleware';
import { getLanguageName, getLanguageConfig, getConjugationPersons, getAvailableTenses, hasTense, getImperativePersons } from '@/constants/language-config';
import type { VerbTense } from '@/constants/language-config';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // Verify authentication
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("API Configuration Error: GEMINI_API_KEY not found.");
    return NextResponse.json({ error: "Server Configuration Error: GEMINI_API_KEY missing." }, { status: 500, headers: corsHeaders });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400, headers: corsHeaders });
  }

  const { wordId, word, tense } = body || {};

  if (!wordId || !word || !tense) {
    return NextResponse.json({ error: "Missing required fields: wordId, word, tense" }, { status: 400, headers: corsHeaders });
  }

  // Valid unlockable tenses (present is always auto-generated, not unlockable)
  const unlockableTenses = ['past', 'future', 'conditional', 'imperative', 'subjunctive', 'imperfect'];
  if (!unlockableTenses.includes(tense)) {
    return NextResponse.json({ error: `Invalid tense '${tense}'. Must be one of: ${unlockableTenses.join(', ')}` }, { status: 400, headers: corsHeaders });
  }

  // Get Supabase client early to fetch word's language
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get word's language from dictionary entry
  const { data: wordEntry, error: wordError } = await supabase
    .from('dictionary')
    .select('language_code')
    .eq('id', wordId)
    .eq('user_id', auth.userId)
    .single();

  if (wordError || !wordEntry) {
    return NextResponse.json({ error: 'Word not found in your dictionary' }, { status: 404, headers: corsHeaders });
  }

  const languageCode = wordEntry.language_code || 'pl';
  const languageConfig = getLanguageConfig(languageCode);
  const languageName = getLanguageName(languageCode);

  // Check if language has conjugation
  if (!languageConfig?.grammar?.hasConjugation) {
    return NextResponse.json({
      error: `${languageName} does not have verb conjugation. Tense unlocking is not available for this language.`
    }, { status: 400, headers: corsHeaders });
  }

  const persons = getConjugationPersons(languageCode);
  const isSlavic = ['pl', 'cs', 'ru', 'uk'].includes(languageCode);

  // Check if this language supports this tense
  if (!hasTense(languageCode, tense as VerbTense)) {
    const availableTenses = getAvailableTenses(languageCode).filter(t => t !== 'present');
    return NextResponse.json({
      error: `${languageName} does not have ${tense} tense. Available tenses: ${availableTenses.join(', ')}`
    }, { status: 400, headers: corsHeaders });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build prompts based on language
    let prompt: string;

    if (tense === 'past') {
      if (isSlavic) {
        prompt = `Give me the COMPLETE past tense conjugation of the ${languageName} verb "${word}" (infinitive form).

${languageName} past tense has GENDER variations. For each person, provide BOTH masculine and feminine forms.

Return a JSON object with this structure (using normalized keys):
{
  "first_singular": { "masculine": "...", "feminine": "..." },
  "second_singular": { "masculine": "...", "feminine": "..." },
  "third_singular": { "masculine": "...", "feminine": "...", "neuter": "..." },
  "first_plural": { "masculine": "...", "feminine": "..." },
  "second_plural": { "masculine": "...", "feminine": "..." },
  "third_plural": { "masculine": "...", "feminine": "..." }
}

The persons in ${languageName} are: ${persons.join(', ')}

For third person singular, include all three: masculine, feminine, neuter.
For other persons, include masculine and feminine variants.

EVERY field must be filled. No nulls or empty strings.`;
      } else {
        prompt = `Give me the COMPLETE past tense conjugation of the ${languageName} verb "${word}" (infinitive form).

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
- first_singular = ${persons[0] || 'I'}
- second_singular = ${persons[1] || 'you'}
- third_singular = ${persons[2] || 'he/she/it'}
- first_plural = ${persons[3] || 'we'}
- second_plural = ${persons[4] || 'you (plural)'}
- third_plural = ${persons[5] || 'they'}

EVERY field must be filled. No nulls or empty strings.`;
      }
    } else if (tense === 'future') {
      prompt = `Give me the COMPLETE future tense conjugation of the ${languageName} verb "${word}" (infinitive form).

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
- first_singular = ${persons[0] || 'I'}
- second_singular = ${persons[1] || 'you'}
- third_singular = ${persons[2] || 'he/she/it'}
- first_plural = ${persons[3] || 'we'}
- second_plural = ${persons[4] || 'you (plural)'}
- third_plural = ${persons[5] || 'they'}

${isSlavic ? `For imperfective verbs, use the compound future. For perfective verbs, use the simple future.` : ''}

EVERY field must be filled. No nulls or empty strings.`;

    } else if (tense === 'conditional') {
      if (isSlavic) {
        prompt = `Give me the COMPLETE conditional mood conjugation of the ${languageName} verb "${word}" (infinitive form).

${languageName} conditional has GENDER variations (formed from past tense + "by" particle). For each person, provide BOTH masculine and feminine forms.

Return a JSON object with this structure:
{
  "first_singular": { "masculine": "...", "feminine": "..." },
  "second_singular": { "masculine": "...", "feminine": "..." },
  "third_singular": { "masculine": "...", "feminine": "...", "neuter": "..." },
  "first_plural": { "masculine": "...", "feminine": "..." },
  "second_plural": { "masculine": "...", "feminine": "..." },
  "third_plural": { "masculine": "...", "feminine": "..." }
}

The persons in ${languageName} are: ${persons.join(', ')}
EVERY field must be filled. No nulls or empty strings.`;
      } else {
        prompt = `Give me the COMPLETE conditional mood conjugation of the ${languageName} verb "${word}" (infinitive form).

The conditional expresses "would do" actions.

Return a JSON object with this structure:
{
  "first_singular": "...",
  "second_singular": "...",
  "third_singular": "...",
  "first_plural": "...",
  "second_plural": "...",
  "third_plural": "..."
}

The persons in ${languageName} are: ${persons.join(', ')}
- first_singular = ${persons[0] || 'I'}
- second_singular = ${persons[1] || 'you'}
- third_singular = ${persons[2] || 'he/she/it'}
- first_plural = ${persons[3] || 'we'}
- second_plural = ${persons[4] || 'you (plural)'}
- third_plural = ${persons[5] || 'they'}

EVERY field must be filled. No nulls or empty strings.`;
      }

    } else if (tense === 'imperative') {
      const impPersons = getImperativePersons(languageCode);
      const personLabels: Record<string, string> = {
        'second_singular': `${persons[1] || 'you'} - "Do it!" (informal singular)`,
        'first_plural': `${persons[3] || 'we'} - "Let's do it!"`,
        'second_plural': `${persons[4] || 'you plural'} - "Do it!" (plural/formal)`
      };

      const personList = impPersons.map(p => `- ${p} (${personLabels[p] || p})`).join('\n');
      const jsonStructure = '{\n' + impPersons.map(p => `  "${p}": "..."`).join(',\n') + '\n}';

      prompt = `Give me the IMPERATIVE mood forms of the ${languageName} verb "${word}" (infinitive form).

Imperatives are commands. ${languageName} has imperative forms for these persons:
${personList}

Return a JSON object:
${jsonStructure}

${isSlavic ? 'For perfective verbs, give the perfective imperative. For imperfective, give imperfective.' : ''}
EVERY field must be filled. No nulls or empty strings.`;

    } else if (tense === 'subjunctive') {
      prompt = `Give me the PRESENT SUBJUNCTIVE conjugation of the ${languageName} verb "${word}" (infinitive form).

The subjunctive mood expresses wishes, doubts, possibilities, necessity, and is used after certain expressions like:
${languageCode === 'es' ? '- "quiero que...", "es importante que...", "ojalá..."' : ''}
${languageCode === 'fr' ? '- "je veux que...", "il faut que...", "bien que..."' : ''}
${languageCode === 'it' ? '- "voglio che...", "è necessario che...", "affinché..."' : ''}
${languageCode === 'pt' ? '- "quero que...", "é importante que...", "embora..."' : ''}
${languageCode === 'ro' ? '- "vreau să...", "trebuie să...", "deși..."' : ''}

Return a JSON object:
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

    } else if (tense === 'imperfect') {
      const imperfectName = languageCode === 'es' ? 'preterito imperfecto' :
                           languageCode === 'fr' ? 'imparfait' :
                           languageCode === 'it' ? 'imperfetto' :
                           languageCode === 'pt' ? 'imperfeito' : 'imperfect';

      prompt = `Give me the IMPERFECT TENSE (${imperfectName}) conjugation of the ${languageName} verb "${word}" (infinitive form).

The imperfect tense expresses:
- Ongoing past actions ("I was eating")
- Habitual past actions ("I used to eat")
- Background descriptions ("It was raining")

Return a JSON object:
{
  "first_singular": "...",
  "second_singular": "...",
  "third_singular": "...",
  "first_plural": "...",
  "second_plural": "...",
  "third_plural": "..."
}

The persons in ${languageName} are: ${persons.join(', ')}
- first_singular = ${persons[0] || 'I'}
- second_singular = ${persons[1] || 'you'}
- third_singular = ${persons[2] || 'he/she/it'}
- first_plural = ${persons[3] || 'we'}
- second_plural = ${persons[4] || 'you (plural)'}
- third_plural = ${persons[5] || 'they'}

EVERY field must be filled. No nulls or empty strings.`;

    } else {
      return NextResponse.json({ error: `Unsupported tense: ${tense}` }, { status: 400, headers: corsHeaders });
    }

    // Build response schema based on language and tense
    const personSchema = {
      first_singular: { type: Type.STRING },
      second_singular: { type: Type.STRING },
      third_singular: { type: Type.STRING },
      first_plural: { type: Type.STRING },
      second_plural: { type: Type.STRING },
      third_plural: { type: Type.STRING }
    };
    const personKeys = ['first_singular', 'second_singular', 'third_singular', 'first_plural', 'second_plural', 'third_plural'];

    let responseSchema: any;

    // Gendered schema for Slavic past/conditional
    const genderedPersonSchema = {
      type: Type.OBJECT,
      properties: {
        masculine: { type: Type.STRING },
        feminine: { type: Type.STRING }
      },
      required: ['masculine', 'feminine']
    };

    const thirdPersonGenderedSchema = {
      type: Type.OBJECT,
      properties: {
        masculine: { type: Type.STRING },
        feminine: { type: Type.STRING },
        neuter: { type: Type.STRING }
      },
      required: ['masculine', 'feminine', 'neuter']
    };

    // Imperative schema (limited persons, varies by language)
    const impPersonsForSchema = getImperativePersons(languageCode);
    const imperativeSchema = {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        impPersonsForSchema.map(p => [p, { type: Type.STRING }])
      ),
      required: impPersonsForSchema
    };

    // Standard 6-person schema
    const standardSchema = {
      type: Type.OBJECT,
      properties: personSchema,
      required: personKeys
    };

    // Gendered 6-person schema (Slavic past/conditional)
    const genderedSchema = {
      type: Type.OBJECT,
      properties: {
        first_singular: genderedPersonSchema,
        second_singular: genderedPersonSchema,
        third_singular: thirdPersonGenderedSchema,
        first_plural: genderedPersonSchema,
        second_plural: genderedPersonSchema,
        third_plural: genderedPersonSchema
      },
      required: personKeys
    };

    // Select schema based on tense and language
    if ((tense === 'past' || tense === 'conditional') && isSlavic) {
      responseSchema = genderedSchema;
    } else if (tense === 'imperative') {
      responseSchema = imperativeSchema;
    } else {
      responseSchema = standardSchema;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const responseText = response.text || '';
    if (!responseText || !responseText.trim().startsWith('{')) {
      console.error("Invalid Gemini response (not JSON):", responseText.substring(0, 200));
      return NextResponse.json({
        error: 'Received invalid response from AI service. Please try again.',
        retryable: true
      }, { status: 502, headers: corsHeaders });
    }

    let conjugationData;
    try {
      conjugationData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError.message, "Response:", responseText.substring(0, 200));
      return NextResponse.json({
        error: 'Failed to parse AI response. Please try again.',
        retryable: true
      }, { status: 502, headers: corsHeaders });
    }

    // Add unlock timestamp
    const tenseDataWithTimestamp = {
      unlockedAt: new Date().toISOString(),
      ...conjugationData
    };

    // Fetch current conjugations
    const { data: entry, error: fetchError } = await supabase
      .from('dictionary')
      .select('conjugations')
      .eq('id', wordId)
      .eq('user_id', auth.userId)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Failed to fetch word conjugations' }, { status: 500, headers: corsHeaders });
    }

    // Parse existing conjugations (may be null, string, or object)
    let conjugations: Record<string, any>;
    try {
      if (typeof entry.conjugations === 'string') {
        conjugations = JSON.parse(entry.conjugations);
      } else {
        conjugations = entry.conjugations || {};
      }
    } catch {
      conjugations = {};
    }

    // Add the new tense data
    conjugations[tense] = tenseDataWithTimestamp;

    // Save back to database
    const { error: updateError } = await supabase
      .from('dictionary')
      .update({ conjugations })
      .eq('id', wordId)
      .eq('user_id', auth.userId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: 'Failed to save tense data' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      tense,
      data: tenseDataWithTimestamp
    }, { status: 200, headers: corsHeaders });

  } catch (e: any) {
    console.error("[unlock-tense] Error:", e);
    return NextResponse.json({ error: 'Failed to unlock tense. Please try again.', retryable: true }, { status: 500, headers: corsHeaders });
  }
}
