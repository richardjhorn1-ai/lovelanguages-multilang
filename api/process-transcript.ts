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
  entryId: string;    // Stable frontend entry ID for correlation
  speaker: string;
  text: string;
  language?: string;
  timestamp: number;
  isBookmarked?: boolean;
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

  const { transcript = [], contextLabel: rawContextLabel = '', gladiaSummary: rawGladiaSummary = '' } = body || {};
  const contextLabel = typeof rawContextLabel === 'string'
    ? rawContextLabel.trim().replace(/\0/g, '').slice(0, 500) : '';
  const gladiaSummary = typeof rawGladiaSummary === 'string'
    ? rawGladiaSummary.trim().replace(/\0/g, '').slice(0, 500) : '';

  // Extract language parameters (defaults to Polish/English for backward compatibility)
  const { targetLanguage, nativeLanguage } = extractLanguages(body);
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: "Invalid payload. Expecting non-empty transcript array." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format transcript for Gemini with entry IDs and bookmark flags
    const transcriptText = transcript
      .map((entry: RawTranscriptEntry, idx: number) => {
        const bookmark = entry.isBookmarked ? '★BOOKMARKED ' : '';
        const entryId = entry.entryId || entry.id || `entry_${idx}`;
        return `[${idx}|${entryId}] ${bookmark}${entry.speaker} (detected: ${entry.language || 'unknown'}): "${entry.text}"`;
      })
      .join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `TASK: Bilingual Transcript Cleanup for ${targetName}/${nativeName} Language Learning

You are processing a real-time transcription from a bilingual conversation.
The speech-to-text system uses code_switching mode which introduces specific artifacts:

CONTEXT: ${contextLabel || `${targetName} language practice conversation`}
${gladiaSummary ? `\nAUDIO SUMMARY FROM SPEECH ENGINE: ${gladiaSummary}\nUse this summary to understand what was actually said — it helps distinguish garbled transcription artifacts from genuine speech.\n` : ''}

LANGUAGE PAIR:
- Target language (being learned): ${targetName} (${targetLanguage})
- Native language (explanations): ${nativeName} (${nativeLanguage})

KNOWN ARTIFACTS:
1. GARBLED CROSS-LANGUAGE: The same spoken audio may be transcribed twice — once
   correctly in the actual language, once as garbled phonetic text in the wrong language.
   Example: Polish "Bardzo lubię ostrość" might also appear as English "But so Lu Bay ostrich"
2. SENTENCE FRAGMENTS: Short utterances may be split across multiple entries
3. LANGUAGE MISDETECTION: An entry's detected language may be wrong
4. PROGRESSIVE REFINEMENT: Same utterance appears multiple times with increasing
   accuracy. Keep ONLY the most complete/accurate version.

YOUR TASKS (in order):
1. IDENTIFY GARBLED ENTRIES: If an entry is garbled phonetic nonsense from misdetected
   language, mark it for removal. Do NOT try to reconstruct what was said — mark
   confidence as "low" and set isGarbled: true
2. DEDUPLICATE: When the same audio produced two entries (one correct, one garbled),
   remove the garbled one. But if someone genuinely repeated themselves, keep both.
3. CORRECT LANGUAGE: Set the actual language ('target' or 'native') based on the text content
4. FIX MINOR ERRORS: Fix obvious transcription typos (NOT wholesale rewrites)
5. TRANSLATE: Add ${nativeName} translation for ${targetName} entries, AND ${targetName}
   translation for ${nativeName} entries (both directions for learning value)
6. MERGE FRAGMENTS: Consecutive short entries from same speaker in same language
   within 3 seconds can be merged into one entry

TRANSCRIPT TO PROCESS:
${transcriptText}

RULES:
- ★BOOKMARKED entries must NEVER be removed or merged away. They can be corrected/translated.
- Return entryId for every processed entry (from the [index|entryId] format in input)
- For removed entries, list their indices in removedIndices
- For merged entries, list all original indices in mergedIndices
- Set confidence: "high" for clean entries, "medium" for corrected, "low" for uncertain
- isGarbled: true only for entries that were phonetic nonsense in wrong language
- If text is clearly ${targetName}, mark language as 'target' and provide ${nativeName} translation
- If text is clearly ${nativeName}, mark language as 'native' and provide ${targetName} translation
- If text mixes both languages, mark as 'mixed' and translate both parts
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
                  index: { type: Type.INTEGER, description: "Original array index" },
                  entryId: { type: Type.STRING, description: "Original entry ID for correlation" },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING, description: "Cleaned text (minor fixes only)" },
                  originalText: { type: Type.STRING, description: "Only if text was changed from original" },
                  language: { type: Type.STRING, enum: ["target", "native", "mixed"] },
                  translation: { type: Type.STRING, description: "Translation in opposite language" },
                  confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  isGarbled: { type: Type.BOOLEAN, description: "Was original garbled phonetic text" },
                  isBookmarked: { type: Type.BOOLEAN, description: "Preserve bookmark status" },
                  mergedIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Original indices merged into this entry"
                  },
                },
                required: ["index", "entryId", "speaker", "text", "language", "confidence"]
              }
            },
            removedIndices: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "Indices removed as unsalvageable garbled duplicates"
            },
            summary: {
              type: Type.STRING,
              description: "Brief 1-2 sentence summary of what was discussed"
            }
          },
          required: ["processedTranscript", "removedIndices", "summary"]
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

    // Merge processed data back with original timestamps and compute languageCode
    const processedEntries = (parsed.processedTranscript || []).map((entry: any) => {
      const originalEntry = transcript[entry.index] || {};
      return {
        index: entry.index,
        entryId: entry.entryId || originalEntry.entryId || originalEntry.id || `entry_${entry.index}`,
        id: entry.entryId || originalEntry.id || `entry_${entry.index}`,
        speaker: entry.speaker,
        text: entry.text,
        originalText: entry.originalText,
        language: entry.language,
        languageCode: entry.language === 'target' ? targetLanguage : entry.language === 'native' ? nativeLanguage : 'mixed',
        translation: entry.translation,
        confidence: entry.confidence,
        isGarbled: entry.isGarbled || false,
        isBookmarked: entry.isBookmarked || originalEntry.isBookmarked || false,
        mergedIndices: entry.mergedIndices,
        timestamp: originalEntry.timestamp || Date.now(),
      };
    });

    const removedIndices = parsed.removedIndices || [];
    const keptCount = processedEntries.length;
    const removedCount = removedIndices.length;

    console.log(`[process-transcript] Processed ${transcript.length} entries → ${keptCount} kept, ${removedCount} removed for user ${auth.userId.substring(0, 8)}... (${targetLanguage}→${nativeLanguage})`);

    // Track usage after successful AI call
    incrementUsage(supabase, auth.userId, RATE_LIMITS.processTranscript.type);

    return res.status(200).json({
      processedTranscript: processedEntries,
      removedIndices,
      summary: parsed.summary || '',
      originalCount: transcript.length,
      processedCount: keptCount,
      targetLanguage,
      nativeLanguage,
    });

  } catch (e: any) {
    console.error("[process-transcript] Error:", e);
    return res.status(500).json({ error: 'Failed to process transcript. Please try again.', retryable: true });
  }
}
