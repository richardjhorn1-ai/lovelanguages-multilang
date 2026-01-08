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

// Transcript entry from Listen Mode
interface RawTranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  language?: string;
  timestamp: number;
}

// Polished entry with corrections
interface PolishedEntry {
  id: string;
  speaker: string;
  text: string;
  correctedText?: string;
  language: 'pl' | 'en' | 'mixed';
  translation?: string;
  timestamp: number;
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

  const { transcript = [], contextLabel = '' } = body || {};

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: "Invalid payload. Expecting non-empty transcript array." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format transcript for Gemini
    const transcriptText = transcript
      .map((entry: RawTranscriptEntry, idx: number) =>
        `[${idx}] ${entry.speaker} (detected: ${entry.language || 'unknown'}): "${entry.text}"`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `TASK: Polish/English Transcript Cleanup & Translation

You are processing a real-time transcription from a Polish language learning conversation.
The transcription has some errors in language detection and may have minor transcription mistakes.

CONTEXT: ${contextLabel || 'Polish language practice conversation'}

YOUR TASKS:
1. CORRECT LANGUAGE DETECTION: Determine if each entry is Polish ('pl'), English ('en'), or mixed ('mixed')
2. CORRECT TRANSCRIPTION: Fix obvious spelling/transcription errors in Polish text
3. TRANSLATE: Add English translations for Polish text (and Polish translations for English if helpful)
4. PRESERVE MEANING: Don't change the meaning, just clean up errors

TRANSCRIPT TO PROCESS:
${transcriptText}

RULES:
- If text is clearly Polish, mark language as 'pl' and provide English translation
- If text is clearly English, mark language as 'en' (no translation needed, or optionally add Polish)
- If text mixes both languages, mark as 'mixed' and translate the Polish parts
- For correctedText: only include if you fixed a transcription error, otherwise omit
- Keep translations natural and conversational
- Preserve the speaker attribution exactly as given`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polishedTranscript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Original entry ID" },
                  index: { type: Type.INTEGER, description: "Index from input (0-based)" },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING, description: "Original text" },
                  correctedText: { type: Type.STRING, description: "Corrected text if there were errors, omit if no correction needed" },
                  language: { type: Type.STRING, enum: ["pl", "en", "mixed"] },
                  translation: { type: Type.STRING, description: "English translation for Polish, or Polish for English (optional)" },
                },
                required: ["index", "speaker", "text", "language"]
              }
            },
            summary: {
              type: Type.STRING,
              description: "Brief 1-2 sentence summary of what was discussed"
            }
          },
          required: ["polishedTranscript", "summary"]
        }
      }
    });

    // Validate response
    // Note: retryable: true signals frontend to offer retry option for transient AI errors
    const responseText = response.text || '';
    if (!responseText || !responseText.trim().startsWith('{')) {
      console.error("Invalid Gemini response (not JSON):", responseText.substring(0, 200));
      return res.status(502).json({
        error: 'Received invalid response from AI service. Please try again.',
        retryable: true
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError.message, "Response:", responseText.substring(0, 200));
      return res.status(502).json({
        error: 'Failed to parse AI response. Please try again.',
        retryable: true
      });
    }

    // Merge polished data back with original timestamps
    const polishedEntries = (parsed.polishedTranscript || []).map((entry: any) => {
      const originalEntry = transcript[entry.index] || {};
      return {
        index: entry.index,  // Include index for client-side matching
        id: entry.id || originalEntry.id || `entry_${entry.index}`,
        speaker: entry.speaker,
        text: entry.correctedText || entry.text,
        originalText: entry.correctedText ? entry.text : undefined,
        language: entry.language,
        translation: entry.translation,
        timestamp: originalEntry.timestamp || Date.now(),
      };
    });

    console.log(`[polish-transcript] Processed ${transcript.length} entries for user ${auth.userId}`);

    return res.status(200).json({
      polishedTranscript: polishedEntries,
      summary: parsed.summary || '',
      originalCount: transcript.length,
      polishedCount: polishedEntries.length,
    });

  } catch (e: any) {
    console.error("Polish Transcript Error:", e);
    return res.status(500).json({ error: e.message || 'Internal Server Error', retryable: true });
  }
}
