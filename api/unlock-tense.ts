import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // Check for explicit origin match (not wildcard)
  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    // Explicit match - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard mode - NEVER combine with credentials (security vulnerability)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0) {
    // No match but have allowed origins - use first one
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("API Configuration Error: GEMINI_API_KEY not found.");
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

  const { wordId, word, tense } = body || {};

  if (!wordId || !word || !tense) {
    return res.status(400).json({ error: "Missing required fields: wordId, word, tense" });
  }

  if (!['past', 'future'].includes(tense)) {
    return res.status(400).json({ error: "Invalid tense. Must be 'past' or 'future'" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Different prompts for past vs future tense
    const prompt = tense === 'past'
      ? `Give me the COMPLETE past tense conjugation of the Polish verb "${word}" (infinitive form).

Polish past tense has GENDER variations. For each person, provide BOTH masculine and feminine forms.

Return a JSON object with this EXACT structure:
{
  "ja": { "masculine": "...", "feminine": "..." },
  "ty": { "masculine": "...", "feminine": "..." },
  "onOna": { "masculine": "...", "feminine": "...", "neuter": "..." },
  "my": { "masculine": "...", "feminine": "..." },
  "wy": { "masculine": "...", "feminine": "..." },
  "oni": { "masculine": "...", "feminine": "..." }
}

For onOna (he/she/it), include all three: masculine (on), feminine (ona), neuter (ono).
For other persons, include masculine and feminine variants.

Example for "być" (to be):
{
  "ja": { "masculine": "byłem", "feminine": "byłam" },
  "ty": { "masculine": "byłeś", "feminine": "byłaś" },
  "onOna": { "masculine": "był", "feminine": "była", "neuter": "było" },
  "my": { "masculine": "byliśmy", "feminine": "byłyśmy" },
  "wy": { "masculine": "byliście", "feminine": "byłyście" },
  "oni": { "masculine": "byli", "feminine": "były" }
}

EVERY field must be filled. No nulls or empty strings.`

      : `Give me the COMPLETE future tense conjugation of the Polish verb "${word}" (infinitive form).

For imperfective verbs, use the compound future (będę + infinitive or będę + past participle).
For perfective verbs, use the simple future (conjugated form).

Return a JSON object with this EXACT structure:
{
  "ja": "...",
  "ty": "...",
  "onOna": "...",
  "my": "...",
  "wy": "...",
  "oni": "..."
}

Example for imperfective "robić" (to do/make):
{
  "ja": "będę robić",
  "ty": "będziesz robić",
  "onOna": "będzie robić",
  "my": "będziemy robić",
  "wy": "będziecie robić",
  "oni": "będą robić"
}

Example for perfective "zrobić" (to do/make - completed):
{
  "ja": "zrobię",
  "ty": "zrobisz",
  "onOna": "zrobi",
  "my": "zrobimy",
  "wy": "zrobicie",
  "oni": "zrobią"
}

EVERY field must be filled. No nulls or empty strings.`;

    const responseSchema = tense === 'past'
      ? {
          type: Type.OBJECT,
          properties: {
            ja: {
              type: Type.OBJECT,
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING }
              },
              required: ["masculine", "feminine"]
            },
            ty: {
              type: Type.OBJECT,
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING }
              },
              required: ["masculine", "feminine"]
            },
            onOna: {
              type: Type.OBJECT,
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING },
                neuter: { type: Type.STRING }
              },
              required: ["masculine", "feminine", "neuter"]
            },
            my: {
              type: Type.OBJECT,
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING }
              },
              required: ["masculine", "feminine"]
            },
            wy: {
              type: Type.OBJECT,
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING }
              },
              required: ["masculine", "feminine"]
            },
            oni: {
              type: Type.OBJECT,
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING }
              },
              required: ["masculine", "feminine"]
            }
          },
          required: ["ja", "ty", "onOna", "my", "wy", "oni"]
        }
      : {
          type: Type.OBJECT,
          properties: {
            ja: { type: Type.STRING },
            ty: { type: Type.STRING },
            onOna: { type: Type.STRING },
            my: { type: Type.STRING },
            wy: { type: Type.STRING },
            oni: { type: Type.STRING }
          },
          required: ["ja", "ty", "onOna", "my", "wy", "oni"]
        };

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
      return res.status(502).json({
        error: 'Received invalid response from AI service. Please try again.',
        retryable: true
      });
    }

    let conjugationData;
    try {
      conjugationData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError.message, "Response:", responseText.substring(0, 200));
      return res.status(502).json({
        error: 'Failed to parse AI response. Please try again.',
        retryable: true
      });
    }

    // Add unlock timestamp
    const tenseDataWithTimestamp = {
      unlockedAt: new Date().toISOString(),
      ...conjugationData
    };

    // Update the database
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Fetch current context
    const { data: entry, error: fetchError } = await supabase
      .from('dictionary')
      .select('context')
      .eq('id', wordId)
      .eq('user_id', auth.userId)
      .single();

    if (fetchError || !entry) {
      return res.status(404).json({ error: 'Word not found in your dictionary' });
    }

    // Parse and update context
    let context;
    try {
      context = typeof entry.context === 'string' ? JSON.parse(entry.context) : entry.context;
    } catch {
      context = {};
    }

    // Ensure conjugations object exists
    if (!context.conjugations) {
      context.conjugations = {};
    }

    // Add the new tense
    context.conjugations[tense] = tenseDataWithTimestamp;

    // Save back to database
    const { error: updateError } = await supabase
      .from('dictionary')
      .update({ context: JSON.stringify(context) })
      .eq('id', wordId)
      .eq('user_id', auth.userId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return res.status(500).json({ error: 'Failed to save tense data' });
    }

    return res.status(200).json({
      success: true,
      tense,
      data: tenseDataWithTimestamp
    });

  } catch (e: any) {
    console.error("Unlock Tense Error:", e);
    return res.status(500).json({ error: e.message || 'Internal Server Error', retryable: true });
  }
}
