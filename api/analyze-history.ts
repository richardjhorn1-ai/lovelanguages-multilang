import { GoogleGenAI, Type } from "@google/genai";
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';
import { extractLanguages } from '../utils/language-helpers.js';
import { getLanguageConfig, getLanguageName, getConjugationPersons } from '../constants/language-config.js';
import { buildVocabularySchema } from '../utils/schema-builders.js';

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
  const limit = await checkRateLimit(supabase, auth.userId, 'analyzeHistory', sub.plan as 'standard' | 'unlimited');
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

  const {
    messages = [],
    currentWords = [],
    targetLanguage: reqTargetLang,
    nativeLanguage: reqNativeLang
  } = body || {};

  if (!Array.isArray(messages) || !Array.isArray(currentWords)) {
    return res.status(400).json({ error: "Invalid payload. Expecting messages and currentWords arrays." });
  }

  // Extract language parameters (defaults to Polish/English for backward compatibility)
  const { targetLanguage, nativeLanguage } = extractLanguages({
    targetLanguage: reqTargetLang,
    nativeLanguage: reqNativeLang
  });
  const targetConfig = getLanguageConfig(targetLanguage);
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  try {
    const ai = new GoogleGenAI({ apiKey });

    const historyText = messages
      .filter((m: any) => m.content && !m.content.includes('[Media Attached]'))
      .map((m: any) => `${(m.role || '').toUpperCase()}: ${m.content}`)
      .join('\n---\n');

    const knownContext = currentWords.length > 0
      ? `User already knows: [${currentWords.slice(0, 50).join(', ')}]`
      : "User is a beginner.";

    // Get language-specific grammar features
    const hasConjugation = targetConfig?.grammar.hasConjugation || false;
    const hasGender = targetConfig?.grammar.hasGender || false;
    const genderTypes = targetConfig?.grammar.genderTypes || [];
    const conjugationPersons = getConjugationPersons(targetLanguage);

    // Get example phrases from the language config
    const helloExample = targetConfig?.examples.hello || 'Hello';
    const iLoveYouExample = targetConfig?.examples.iLoveYou || 'I love you';

    // Build dynamic extraction prompt based on language grammar
    const verbInstructions = hasConjugation && conjugationPersons.length > 0 ? `
FOR VERBS:
- "word": Use INFINITIVE form
- "type": "verb"
- "conjugations": REQUIRED - present tense with all ${conjugationPersons.length} persons: ${conjugationPersons.join(', ')}
  Use normalized keys: { present: { first_singular: "...", second_singular: "...", third_singular: "...", first_plural: "...", second_plural: "...", third_plural: "..." } }
- If the conversation EXPLICITLY TEACHES past or future tense forms, include them with unlockedAt timestamp
- Only include past/future if the AI is actively teaching that tense, not just using it in passing
- NEVER return separate entries for individual conjugated forms` : `
FOR VERBS:
- "word": Use base/infinitive form
- "type": "verb"`;

    const nounInstructions = hasGender ? `
FOR NOUNS:
- "word": Singular nominative form
- "type": "noun"
- "gender": REQUIRED - must be one of: ${genderTypes.join(', ')}
- "plural": REQUIRED - the plural form` : `
FOR NOUNS:
- "word": Singular form
- "type": "noun"
- "plural": Include plural form if applicable`;

    const adjectiveInstructions = hasGender ? `
FOR ADJECTIVES:
- "word": Base form
- "type": "adjective"
- "adjectiveForms": REQUIRED - include forms for: ${genderTypes.join(', ')}, plural
- NEVER return separate entries for individual gender forms` : `
FOR ADJECTIVES:
- "word": Base form
- "type": "adjective"`;

    const validationChecklist = `
=== VALIDATION ===
Before returning, verify:
${hasConjugation ? `[ ] Every verb has conjugations.present with all ${conjugationPersons.length} persons (using normalized keys)` : '[ ] Every verb has base form'}
${hasConjugation ? '[ ] If past/future tense was explicitly taught, include it with unlockedAt timestamp' : ''}
${hasGender ? '[ ] Every noun has gender AND plural' : '[ ] Every noun has plural if applicable'}
${hasGender ? '[ ] Every adjective has adjectiveForms with all required gender forms' : ''}
[ ] Every word has exactly 5 examples
[ ] Every word has a proTip`.trim();

    const prompt = `TASK: ${targetName} Vocabulary Extractor - COMPLETE DATA REQUIRED

Extract ${targetName} vocabulary from the chat history. EVERY entry MUST be complete with all required fields.

${knownContext}

=== EXTRACTION RULES ===
${verbInstructions}
${nounInstructions}
${adjectiveInstructions}

FOR PHRASES:
- "word": The full phrase
- "type": "phrase"

FOR ALL WORDS:
- "examples": REQUIRED - exactly 5 example sentences, each in format: "${targetName} sentence. (${nativeName} translation.)"
- "proTip": REQUIRED - max 60 chars, romantic/practical usage tip
- "importance": 1-5 (5 = essential, 1 = rare)
- "rootWord": The base/dictionary form
- "pronunciation": Include phonetic pronunciation guide

${validationChecklist}

CHAT HISTORY:
${historyText}`;

    // Use dynamic schema based on target language grammar
    const vocabSchema = buildVocabularySchema(targetLanguage);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: vocabSchema
      }
    });

    // Validate response before parsing
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

    const now = new Date().toISOString();
    const sanitizedWords = (parsed.newWords || []).map((w: any) => {
      const sanitized = {
        ...w,
        word: (w.word || '').toLowerCase().trim(),
        rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
      };

      // Ensure unlockedAt is set for any past/future tenses included
      if (sanitized.conjugations) {
        if (sanitized.conjugations.past && !sanitized.conjugations.past.unlockedAt) {
          sanitized.conjugations.past.unlockedAt = now;
        }
        if (sanitized.conjugations.future && !sanitized.conjugations.future.unlockedAt) {
          sanitized.conjugations.future.unlockedAt = now;
        }
      }

      return sanitized;
    });

    // Track usage after successful AI call
    incrementUsage(supabase, auth.userId, RATE_LIMITS.analyzeHistory.type);

    return res.status(200).json({ newWords: sanitizedWords });
  } catch (e: any) {
    console.error("[analyze-history] Error:", e);
    return res.status(500).json({ error: 'Failed to analyze conversation. Please try again.', retryable: true });
  }
}
