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
import { getLanguageConfig, getLanguageName, getConjugationPersons } from '../constants/language-config.js';
import { buildLightweightSchema } from '../utils/schema-builders.js';

interface ValidateWordRequest {
  word: string;              // Word in target language (was: polish)
  translation?: string;      // Translation in native language (was: english) - optional, AI generates if not provided
  targetLanguage?: string;   // Target language code (e.g., 'pl', 'es') - defaults via extractLanguages
  nativeLanguage?: string;   // Native language code (e.g., 'en', 'es') - defaults via extractLanguages
  lightweight?: boolean;     // If true, skip full grammatical data (conjugations, etc.)
}

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
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
    const limit = await checkRateLimit(supabase, auth.userId, 'validateWord', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    // Support both new format {word} and legacy format {polish} for backward compatibility
    const requestWord = req.body.word || req.body.polish;
    const { translation, lightweight } = req.body as ValidateWordRequest;

    if (!requestWord) {
      return res.status(400).json({ error: 'Missing word' });
    }

    // Normalize to use 'word' internally
    const word = requestWord;

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
    const targetConfig = getLanguageConfig(targetLanguage);
    const targetName = getLanguageName(targetLanguage);
    const nativeName = getLanguageName(nativeLanguage);

    // Determine mode: generate (no translation) or validate (has translation)
    const generateMode = !translation || translation.trim() === '';
    // Lightweight mode skips full grammatical data (conjugations, gender, etc.)
    const isLightweight = lightweight === true;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      // If no API key, return error for generate mode or original words for validate mode
      if (generateMode) {
        return res.status(500).json({ error: 'AI service required to generate translations' });
      }
      return res.status(200).json({
        success: true,
        validated: {
          word: word.trim(),
          translation: translation?.trim() || '',
          word_type: 'phrase',
          is_slang: false,
          formality: 'neutral',
          was_corrected: false
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build prompt based on mode (generate vs validate) and weight (lightweight vs full)
    // Get language-specific grammar features
    const hasConjugation = targetConfig?.grammar.hasConjugation || false;
    const hasGender = targetConfig?.grammar.hasGender || false;
    const genderTypes = targetConfig?.grammar.genderTypes || [];
    const conjugationPersons = getConjugationPersons(targetLanguage);

    // Build dynamic grammar instructions based on target language features
    const grammarInstructions = isLightweight ? '' : `

IMPORTANT FOR GRAMMATICAL DATA:
${hasConjugation && conjugationPersons.length > 0
  ? `- If it's a VERB: Provide present tense conjugations for all ${conjugationPersons.length} persons (${conjugationPersons.join(', ')})`
  : ''}
${hasGender
  ? `- If it's a NOUN: Provide the grammatical gender (${genderTypes.join('/')}) and plural form`
  : '- If it\'s a NOUN: Provide the plural form'}
${hasGender
  ? `- If it's an ADJECTIVE: Provide forms for each gender (${genderTypes.join(', ')}) and plural`
  : ''}`.trim();

    const prompt = generateMode
      ? `You are a ${targetName} language expert. Translate this ${targetName} word/phrase to ${nativeName} and provide linguistic data.

Input:
- ${targetName}: "${word}"

Your task:
1. Check if the ${targetName} spelling is correct. If not, provide the correct spelling.
2. Provide the accurate ${nativeName} translation.
3. Determine the word type (noun, verb, adjective, adverb, phrase, other)
4. Identify if it's slang or informal language - this is OK, just note it
5. Rate the formality (formal, neutral, informal, vulgar)
6. If you corrected the spelling, briefly explain why
7. Provide pronunciation guide
${grammarInstructions}

NOTES:
- Accept slang and colloquial ${targetName} - it's valid language
- If the word doesn't exist in ${targetName}, still try to guess what they meant
- Set was_corrected to true only if the ${targetName} spelling was incorrect

Return ONLY the JSON object, no other text.`
      : `You are a ${targetName} language expert. Validate and enrich this ${targetName} word/phrase with its ${nativeName} translation.

Input:
- ${targetName}: "${word}"
- ${nativeName}: "${translation}"

Your task:
1. Check if the ${targetName} spelling is correct. If not, provide the correct spelling.
2. Verify the ${nativeName} translation is accurate. If not, provide a better translation.
3. Determine the word type (noun, verb, adjective, adverb, phrase, other)
4. Identify if it's slang or informal language - this is OK, just note it
5. Rate the formality (formal, neutral, informal, vulgar)
6. If you made any corrections, briefly explain why
7. Provide pronunciation guide
${grammarInstructions}

NOTES:
- Accept slang and colloquial ${targetName} - it's valid language
- Be lenient with minor variations
- Only flag as "was_corrected" if spelling was wrong or translation was significantly off
- If the word doesn't exist in ${targetName}, still try to guess what they meant

Return ONLY the JSON object, no other text.`;

    // Lightweight schema - just basic validation without grammar data
    const lightweightSchema = {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING, description: `Corrected ${targetName} word/phrase` },
        translation: { type: Type.STRING, description: `${nativeName} translation` },
        word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
        pronunciation: { type: Type.STRING, description: "Pronunciation guide" },
        is_slang: { type: Type.BOOLEAN, description: "Whether this is slang or colloquial" },
        formality: { type: Type.STRING, enum: ["formal", "neutral", "informal", "vulgar"] },
        was_corrected: { type: Type.BOOLEAN, description: "Whether any corrections were made" },
        correction_note: { type: Type.STRING, description: "Brief explanation if corrections were made" }
      },
      required: ["word", "translation", "word_type", "is_slang", "formality", "was_corrected"]
    };

    // Build dynamic conjugation schema based on language
    const buildConjugationProperties = () => {
      if (!hasConjugation || conjugationPersons.length === 0) return null;

      // Use normalized keys for database consistency
      const presentProperties: Record<string, object> = {};
      const personKeys = ['first_singular', 'second_singular', 'third_singular', 'first_plural', 'second_plural', 'third_plural'];

      conjugationPersons.forEach((person, index) => {
        if (index < personKeys.length) {
          presentProperties[personKeys[index]] = {
            type: Type.STRING,
            description: `"${person}" form`
          };
        }
      });

      return {
        type: Type.OBJECT,
        description: `Present tense conjugations for ${targetName} verbs`,
        properties: {
          present: {
            type: Type.OBJECT,
            properties: presentProperties
          }
        }
      };
    };

    // Build dynamic adjective forms schema based on language gender types
    const buildAdjectiveFormsProperties = () => {
      if (!hasGender) return null;

      const properties: Record<string, object> = {};
      genderTypes.forEach(gender => {
        properties[gender] = { type: Type.STRING, description: `${gender} form` };
      });
      properties.plural = { type: Type.STRING, description: "Plural form" };

      return {
        type: Type.OBJECT,
        description: `Adjective forms for ${targetName}`,
        properties
      };
    };

    // Full schema - includes conjugations, gender, adjective forms, examples
    // Properties are dynamically built based on target language grammar
    const fullSchemaProperties: Record<string, object> = {
      word: { type: Type.STRING, description: `Corrected ${targetName} word/phrase` },
      translation: { type: Type.STRING, description: `${nativeName} translation` },
      word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
      pronunciation: { type: Type.STRING, description: "Pronunciation guide" },
      is_slang: { type: Type.BOOLEAN, description: "Whether this is slang or colloquial" },
      formality: { type: Type.STRING, enum: ["formal", "neutral", "informal", "vulgar"] },
      was_corrected: { type: Type.BOOLEAN, description: "Whether any corrections were made" },
      correction_note: { type: Type.STRING, description: "Brief explanation if corrections were made" },
      plural: { type: Type.STRING, description: "Plural form for nouns" },
      example_sentence: { type: Type.STRING, description: `Example sentence in ${targetName}` },
      example_translation: { type: Type.STRING, description: `${nativeName} translation of example` }
    };

    // Add conjugations if language has verb conjugation
    const conjugationSchema = buildConjugationProperties();
    if (conjugationSchema) {
      fullSchemaProperties.conjugations = conjugationSchema;
    }

    // Add gender if language has grammatical gender
    if (hasGender && genderTypes.length > 0) {
      fullSchemaProperties.gender = {
        type: Type.STRING,
        enum: genderTypes as string[],
        description: `Grammatical gender for nouns (${genderTypes.join('/')})`
      };
    }

    // Add adjective forms if language has gender agreement
    const adjectiveFormsSchema = buildAdjectiveFormsProperties();
    if (adjectiveFormsSchema) {
      fullSchemaProperties.adjective_forms = adjectiveFormsSchema;
    }

    const fullSchema = {
      type: Type.OBJECT,
      properties: fullSchemaProperties,
      required: ["word", "translation", "word_type", "is_slang", "formality", "was_corrected"]
    };

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: isLightweight ? lightweightSchema : fullSchema
      }
    });

    try {
      const validated = JSON.parse(result.text || '{}');

      // Build context object with grammatical data for storage
      const context: any = {};

      if (validated.word_type === 'verb' && validated.conjugations?.present) {
        context.conjugations = validated.conjugations;
      }

      if (validated.word_type === 'noun') {
        if (validated.gender) context.gender = validated.gender;
        if (validated.plural) context.plural = validated.plural;
      }

      if (validated.word_type === 'adjective' && validated.adjective_forms) {
        context.adjective_forms = validated.adjective_forms;
      }

      if (validated.example_sentence) {
        context.example_sentence = validated.example_sentence;
        context.example_translation = validated.example_translation;
      }

      if (validated.is_slang) {
        context.is_slang = true;
      }

      if (validated.formality && validated.formality !== 'neutral') {
        context.formality = validated.formality;
      }

      // Track usage after successful AI call
      incrementUsage(supabase, auth.userId, RATE_LIMITS.validateWord.type);

      return res.status(200).json({
        success: true,
        validated: {
          word: validated.word,
          translation: validated.translation,
          word_type: validated.word_type,
          pronunciation: validated.pronunciation,
          was_corrected: validated.was_corrected,
          correction_note: validated.correction_note,
          context: Object.keys(context).length > 0 ? JSON.stringify(context) : undefined
        }
      });
    } catch {
      // If parsing fails, return original words
      return res.status(200).json({
        success: true,
        validated: {
          word: word.trim(),
          translation: (translation || '').trim(),
          word_type: 'phrase',
          was_corrected: false
        }
      });
    }

  } catch (error: any) {
    console.error('[validate-word] Error:', error);
    return res.status(500).json({ error: 'Failed to validate word. Please try again.' });
  }
}
