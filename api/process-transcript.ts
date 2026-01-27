import { GoogleGenAI, Type } from "@google/genai";
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '../utils/api-middleware.js';
import { extractLanguages } from '../utils/language-helpers.js';
import { getLanguageName } from '../constants/language-config.js';

// Transcript entry from Listen Mode
interface RawTranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  language?: string;
  timestamp: number;
}

// Processed entry with corrections
interface ProcessedEntry {
  id: string;
  speaker: string;
  text: string;
  correctedText?: string;
  language: 'target' | 'native' | 'mixed';  // Language-agnostic
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

  const supabase = createServiceClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Block free users
  const sub = await requireSubscription(supabase, auth.userId);
  if (!sub.allowed) {
    return res.status(403).json({ error: sub.error });
  }

  // Check rate limit
  const limit = await checkRateLimit(supabase, auth.userId, 'processTranscript', sub.plan as SubscriptionPlan);
  if (!limit.allowed) {
    return res.status(429).json({
      error: limit.error,
      remaining: limit.remaining,
      resetAt: limit.resetAt
    });
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

  // Extract language parameters (defaults to Polish/English for backward compatibility)
  const { targetLanguage, nativeLanguage } = extractLanguages(body);
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

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
      contents: `TASK: ${targetName}/${nativeName} Transcript Cleanup & Translation

You are processing a real-time transcription from a ${targetName} language learning conversation.
The transcription has some errors in language detection and may have minor transcription mistakes.

CONTEXT: ${contextLabel || `${targetName} language practice conversation`}

LANGUAGE PAIR:
- Target language (being learned): ${targetName} (${targetLanguage})
- Native language (explanations): ${nativeName} (${nativeLanguage})

YOUR TASKS:
1. CORRECT LANGUAGE DETECTION: Determine if each entry is in the target language ('target'), native language ('native'), or mixed ('mixed')
2. CORRECT TRANSCRIPTION: Fix obvious spelling/transcription errors in ${targetName} text
3. TRANSLATE: Add ${nativeName} translations for ${targetName} text (and ${targetName} translations for ${nativeName} if helpful)
4. PRESERVE MEANING: Don't change the meaning, just clean up errors

TRANSCRIPT TO PROCESS:
${transcriptText}

RULES:
- If text is clearly ${targetName}, mark language as 'target' and provide ${nativeName} translation
- If text is clearly ${nativeName}, mark language as 'native' (no translation needed, or optionally add ${targetName})
- If text mixes both languages, mark as 'mixed' and translate the ${targetName} parts
- For correctedText: only include if you fixed a transcription error, otherwise omit
- Keep translations natural and conversational
- Preserve the speaker attribution exactly as given`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            processedTranscript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Original entry ID" },
                  index: { type: Type.INTEGER, description: "Index from input (0-based)" },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING, description: "Original text" },
                  correctedText: { type: Type.STRING, description: "Corrected text if there were errors, omit if no correction needed" },
                  language: { type: Type.STRING, enum: ["target", "native", "mixed"] },
                  translation: { type: Type.STRING, description: `${nativeName} translation for ${targetName}, or ${targetName} for ${nativeName} (optional)` },
                },
                required: ["index", "speaker", "text", "language"]
              }
            },
            summary: {
              type: Type.STRING,
              description: "Brief 1-2 sentence summary of what was discussed"
            }
          },
          required: ["processedTranscript", "summary"]
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

    // Merge processed data back with original timestamps
    const processedEntries = (parsed.processedTranscript || []).map((entry: any) => {
      const originalEntry = transcript[entry.index] || {};
      return {
        index: entry.index,
        id: entry.id || originalEntry.id || `entry_${entry.index}`,
        speaker: entry.speaker,
        text: entry.correctedText || entry.text,
        originalText: entry.correctedText ? entry.text : undefined,
        language: entry.language,
        languageCode: entry.language === 'target' ? targetLanguage : entry.language === 'native' ? nativeLanguage : 'mixed',
        translation: entry.translation,
        timestamp: originalEntry.timestamp || Date.now(),
      };
    });

    console.log(`[process-transcript] Processed ${transcript.length} entries for user ${auth.userId.substring(0, 8)}... (${targetLanguage}→${nativeLanguage})`);

    // Track usage after successful AI call
    incrementUsage(supabase, auth.userId, RATE_LIMITS.processTranscript.type);

    return res.status(200).json({
      processedTranscript: processedEntries,
      summary: parsed.summary || '',
      originalCount: transcript.length,
      processedCount: processedEntries.length,
      targetLanguage,
      nativeLanguage,
    });

  } catch (e: any) {
    console.error("[process-transcript] Error:", e);
    return res.status(500).json({ error: 'Failed to process transcript. Please try again.', retryable: true });
  }
}
