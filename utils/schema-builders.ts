/**
 * Dynamic Schema Builders for Multi-Language Gemini API Responses
 *
 * This module generates JSON schemas for Gemini's structured output based on
 * each language's grammatical features. Using normalized keys (first_singular,
 * second_singular, etc.) ensures database consistency while language-specific
 * labels appear in descriptions for AI context.
 *
 * Key principle: Schema structure is consistent across languages, but the
 * AI receives language-specific context through field descriptions.
 */

import { Type } from "@google/genai";
import {
  getLanguageConfig,
  getLanguageName,
  getConjugationPersons,
  getCaseNames,
  getGenderTypes,
  type LanguageConfig
} from '../constants/language-config.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Gemini schema property type
 */
interface SchemaProperty {
  type: typeof Type.STRING | typeof Type.INTEGER | typeof Type.BOOLEAN |
        typeof Type.ARRAY | typeof Type.OBJECT | typeof Type.NUMBER;
  description?: string;
  enum?: string[];
  items?: SchemaProperty | object;
  properties?: Record<string, SchemaProperty | object>;
  required?: string[];
}

/**
 * Complete Gemini response schema
 */
interface GeminiSchema {
  type: typeof Type.OBJECT;
  properties: Record<string, SchemaProperty | object>;
  required?: string[];
}

// =============================================================================
// NORMALIZED CONJUGATION KEYS
// =============================================================================

/**
 * Standard conjugation person keys used across all languages.
 * These provide a consistent database schema while descriptions
 * contain language-specific person labels.
 */
const CONJUGATION_KEYS = [
  'first_singular',   // I: ja, yo, ich, я, etc.
  'second_singular',  // you (informal): ty, tú, du, ты, etc.
  'third_singular',   // he/she/it: on/ona, él/ella, er/sie/es, он/она, etc.
  'first_plural',     // we: my, nosotros, wir, мы, etc.
  'second_plural',    // you (plural): wy, vosotros, ihr, вы, etc.
  'third_plural'      // they: oni, ellos, sie, они, etc.
] as const;

type ConjugationKey = typeof CONJUGATION_KEYS[number];

// =============================================================================
// CORE SCHEMA BUILDERS
// =============================================================================

/**
 * Build conjugation schema based on language.
 * Returns null if the language doesn't have meaningful conjugation.
 *
 * Uses normalized keys (first_singular, etc.) with language-specific
 * person labels in descriptions for AI context.
 *
 * @param languageCode - ISO language code (e.g., 'pl', 'es', 'de')
 * @returns Conjugation schema object or null
 */
export function buildConjugationSchema(languageCode: string): object | null {
  const config = getLanguageConfig(languageCode);

  if (!config?.grammar.hasConjugation || !config.grammar.conjugationPersons) {
    return null;
  }

  const persons = config.grammar.conjugationPersons;

  // Build properties with normalized keys but language-specific descriptions
  const presentProperties: Record<string, object> = {};
  const requiredKeys: string[] = [];

  CONJUGATION_KEYS.forEach((key, index) => {
    if (persons[index]) {
      presentProperties[key] = {
        type: Type.STRING,
        description: `"${persons[index]}" form in ${config.name}`
      };
      requiredKeys.push(key);
    }
  });

  // Base schema with present tense (always required for verbs)
  const conjugationSchema: object = {
    type: Type.OBJECT,
    description: `Verb conjugation for ${config.name}`,
    properties: {
      present: {
        type: Type.OBJECT,
        description: `Present tense conjugation - ALL ${requiredKeys.length} persons required`,
        properties: presentProperties,
        required: requiredKeys
      }
    },
    required: ['present']
  };

  // Add past tense schema for languages with complex past tense
  // (Slavic languages have gendered past tense forms)
  if (['pl', 'cs', 'ru', 'uk'].includes(languageCode)) {
    (conjugationSchema as any).properties.past = buildSlavicPastTenseSchema(config);
  }

  // Add future tense schema
  (conjugationSchema as any).properties.future = {
    type: Type.OBJECT,
    description: 'Future tense - only include if explicitly taught',
    properties: {
      unlockedAt: { type: Type.STRING, description: 'ISO timestamp when this tense was unlocked' },
      ...presentProperties
    }
  };

  return conjugationSchema;
}

/**
 * Build Slavic-specific past tense schema with gendered forms.
 * Polish, Czech, Russian, Ukrainian have gendered past tense.
 */
function buildSlavicPastTenseSchema(config: LanguageConfig): object {
  const persons = config.grammar.conjugationPersons || [];

  // Past tense in Slavic languages has masculine/feminine forms
  const genderedPersonSchema = {
    type: Type.OBJECT,
    properties: {
      masculine: { type: Type.STRING },
      feminine: { type: Type.STRING }
    }
  };

  // Third person also has neuter in some Slavic languages
  const thirdPersonSchema = {
    type: Type.OBJECT,
    properties: {
      masculine: { type: Type.STRING },
      feminine: { type: Type.STRING },
      neuter: { type: Type.STRING }
    }
  };

  const pastProperties: Record<string, object> = {
    unlockedAt: { type: Type.STRING, description: 'ISO timestamp when past tense was unlocked' }
  };

  CONJUGATION_KEYS.forEach((key, index) => {
    if (persons[index]) {
      if (key === 'third_singular') {
        pastProperties[key] = {
          ...thirdPersonSchema,
          description: `"${persons[index]}" past tense forms (m/f/n)`
        };
      } else {
        pastProperties[key] = {
          ...genderedPersonSchema,
          description: `"${persons[index]}" past tense forms (m/f)`
        };
      }
    }
  });

  return {
    type: Type.OBJECT,
    description: 'Past tense with gendered forms - only include if explicitly taught',
    properties: pastProperties
  };
}

/**
 * Build adjective forms schema based on language grammar.
 * Returns schema for gender agreement forms (masculine, feminine, neuter, plural).
 *
 * @param languageCode - ISO language code
 * @returns Adjective forms schema or null if no gender agreement
 */
export function buildAdjectiveFormsSchema(languageCode: string): object | null {
  const config = getLanguageConfig(languageCode);

  if (!config?.grammar.hasGender) {
    return null;
  }

  const genderTypes = config.grammar.genderTypes || [];
  const properties: Record<string, object> = {};
  const required: string[] = [];

  // Add each gender form
  if (genderTypes.includes('masculine')) {
    properties.masculine = { type: Type.STRING, description: 'Masculine form' };
    required.push('masculine');
  }
  if (genderTypes.includes('feminine')) {
    properties.feminine = { type: Type.STRING, description: 'Feminine form' };
    required.push('feminine');
  }
  if (genderTypes.includes('neuter')) {
    properties.neuter = { type: Type.STRING, description: 'Neuter form' };
    required.push('neuter');
  }
  if (genderTypes.includes('common')) {
    properties.common = { type: Type.STRING, description: 'Common gender form' };
    required.push('common');
  }

  // Always include plural
  properties.plural = { type: Type.STRING, description: 'Plural form' };
  required.push('plural');

  return {
    type: Type.OBJECT,
    description: `Adjective gender forms for ${config.name}`,
    properties,
    required
  };
}

/**
 * Build full vocabulary extraction schema for a language.
 * Includes all grammatical features relevant to that language.
 *
 * @param languageCode - ISO language code
 * @returns Complete vocabulary extraction schema
 */
export function buildVocabularySchema(languageCode: string): GeminiSchema {
  const config = getLanguageConfig(languageCode);
  const langName = config?.name || languageCode;

  // Base properties common to all languages
  const wordProperties: Record<string, object> = {
    word: {
      type: Type.STRING,
      description: `The word in ${langName} (dictionary/base form)`
    },
    translation: {
      type: Type.STRING,
      description: 'Translation to the user\'s native language'
    },
    pronunciation: {
      type: Type.STRING,
      description: 'Phonetic pronunciation guide'
    },
    type: {
      type: Type.STRING,
      enum: ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'preposition', 'conjunction', 'other'],
      description: 'Grammatical word type'
    },
    importance: {
      type: Type.INTEGER,
      description: 'Importance rating 1-5 (5 = essential vocabulary, 1 = rare/advanced)'
    },
    proTip: {
      type: Type.STRING,
      description: 'Usage tip or memory trick (max 60 characters)'
    },
    examples: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: `5 example sentences. Format: "${langName} sentence. (Native translation.)"`
    },
    rootWord: {
      type: Type.STRING,
      description: 'Base/dictionary form (for conjugated or declined words)'
    },
    context: {
      type: Type.STRING,
      description: 'Context or category (e.g., "romantic", "daily life", "food")'
    }
  };

  // Add gender if language has grammatical gender
  if (config?.grammar.hasGender && config.grammar.genderTypes) {
    wordProperties.gender = {
      type: Type.STRING,
      enum: [...config.grammar.genderTypes],
      description: `Grammatical gender (for nouns): ${config.grammar.genderTypes.join(', ')}`
    };
  }

  // Add plural form for nouns
  wordProperties.plural = {
    type: Type.STRING,
    description: 'Plural form (for nouns)'
  };

  // Add conjugations if language has verb conjugation
  if (config?.grammar.hasConjugation) {
    const conjSchema = buildConjugationSchema(languageCode);
    if (conjSchema) {
      wordProperties.conjugations = conjSchema;
    }
  }

  // Add adjective forms if language has gender agreement
  if (config?.grammar.hasGender) {
    const adjSchema = buildAdjectiveFormsSchema(languageCode);
    if (adjSchema) {
      wordProperties.adjectiveForms = adjSchema;
    }
  }

  // Add article information if language has articles
  if (config?.grammar.hasArticles) {
    wordProperties.article = {
      type: Type.STRING,
      description: 'Definite article (e.g., "der", "die", "das" for German; "le", "la" for French)'
    };
  }

  // Required fields for all entries
  const requiredFields = ['word', 'translation', 'type', 'importance', 'examples', 'proTip'];

  return {
    type: Type.OBJECT,
    properties: {
      newWords: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: wordProperties,
          required: requiredFields
        }
      }
    },
    required: ['newWords']
  };
}

/**
 * Build lightweight schema for quick word validation.
 * Used when adding individual words - doesn't need full grammar.
 *
 * @returns Lightweight validation schema
 */
export function buildLightweightSchema(): GeminiSchema {
  return {
    type: Type.OBJECT,
    properties: {
      word: {
        type: Type.STRING,
        description: 'The corrected/normalized word in target language'
      },
      translation: {
        type: Type.STRING,
        description: 'Translation to native language'
      },
      word_type: {
        type: Type.STRING,
        enum: ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'preposition', 'conjunction', 'other'],
        description: 'Grammatical word type'
      },
      pronunciation: {
        type: Type.STRING,
        description: 'Phonetic pronunciation guide'
      },
      was_corrected: {
        type: Type.BOOLEAN,
        description: 'true if the original word had spelling/diacritic errors'
      },
      correction_note: {
        type: Type.STRING,
        description: 'Explanation of what was corrected (only if was_corrected is true)'
      },
      gender: {
        type: Type.STRING,
        description: 'Grammatical gender if applicable'
      },
      example_sentence: {
        type: Type.STRING,
        description: 'One example sentence using the word'
      },
      example_translation: {
        type: Type.STRING,
        description: 'Translation of the example sentence'
      }
    },
    required: ['word', 'translation', 'word_type', 'was_corrected']
  };
}

/**
 * Build schema for level test question generation.
 *
 * @returns Level test questions schema
 */
export function buildLevelTestSchema(): GeminiSchema {
  return {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: 'Unique question ID (q1, q2, etc.)'
            },
            type: {
              type: Type.STRING,
              enum: ['multiple_choice', 'fill_blank', 'translation'],
              description: 'Question type'
            },
            question: {
              type: Type.STRING,
              description: 'The question text (in native language)'
            },
            context: {
              type: Type.STRING,
              description: 'Additional context if needed'
            },
            targetText: {
              type: Type.STRING,
              description: 'Target language text in the question (if any)'
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'For multiple choice - exactly 4 options'
            },
            correctAnswer: {
              type: Type.STRING,
              description: 'The correct answer'
            },
            explanation: {
              type: Type.STRING,
              description: 'Why this answer is correct (in native language)'
            },
            theme: {
              type: Type.STRING,
              description: 'Which concept this question tests'
            },
            isCore: {
              type: Type.BOOLEAN,
              description: 'true if testing core concept, false if personalized'
            }
          },
          required: ['id', 'type', 'question', 'correctAnswer', 'theme', 'isCore']
        }
      }
    },
    required: ['questions']
  };
}

/**
 * Build schema for answer validation response.
 *
 * @returns Answer validation schema
 */
export function buildAnswerValidationSchema(): GeminiSchema {
  return {
    type: Type.OBJECT,
    properties: {
      accepted: {
        type: Type.BOOLEAN,
        description: 'true if the answer should be accepted'
      },
      confidence: {
        type: Type.STRING,
        enum: ['exact', 'close', 'synonym', 'incorrect'],
        description: 'How closely the answer matches: exact (perfect), close (minor typo/diacritic), synonym (valid alternative), incorrect (wrong)'
      },
      explanation: {
        type: Type.STRING,
        description: 'Brief explanation of why accepted/rejected'
      },
      correctAnswer: {
        type: Type.STRING,
        description: 'The canonical correct answer'
      },
      userAnswerNormalized: {
        type: Type.STRING,
        description: 'The user\'s answer, cleaned and normalized'
      },
      issues: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Specific issues with the answer (empty if correct)'
      }
    },
    required: ['accepted', 'explanation']
  };
}

/**
 * Build schema for challenge question generation.
 *
 * @param challengeType - 'quiz' or 'quickfire'
 * @returns Challenge schema
 */
export function buildChallengeSchema(challengeType: 'quiz' | 'quickfire'): GeminiSchema {
  if (challengeType === 'quickfire') {
    // Quickfire is simple word-translation pairs
    return {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: 'Word in one language' },
              answer: { type: Type.STRING, description: 'Translation' },
              direction: {
                type: Type.STRING,
                enum: ['target_to_native', 'native_to_target'],
                description: 'Translation direction'
              }
            },
            required: ['word', 'answer', 'direction']
          }
        }
      },
      required: ['items']
    };
  }

  // Quiz has multiple question types
  return {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['translate', 'fill_blank', 'multiple_choice'],
              description: 'Question type'
            },
            question: { type: Type.STRING, description: 'The question text' },
            answer: { type: Type.STRING, description: 'Correct answer' },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'For multiple choice - 4 options'
            },
            hint: { type: Type.STRING, description: 'Optional hint' }
          },
          required: ['type', 'question', 'answer']
        }
      }
    },
    required: ['items']
  };
}

/**
 * Build schema for batch answer validation.
 * Used to validate multiple answers in a single API call.
 *
 * @returns Batch validation schema
 */
export function buildBatchValidationSchema(): GeminiSchema {
  return {
    type: Type.OBJECT,
    properties: {
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            index: {
              type: Type.INTEGER,
              description: 'Index of the answer being validated (0-based)'
            },
            accepted: {
              type: Type.BOOLEAN,
              description: 'true if the answer should be accepted'
            },
            explanation: {
              type: Type.STRING,
              description: 'Brief explanation'
            }
          },
          required: ['index', 'accepted']
        }
      }
    },
    required: ['results']
  };
}

/**
 * Build schema for word enrichment (adding context to words).
 * Used when tutors create word gifts/challenges.
 *
 * @param languageCode - Target language code
 * @returns Word enrichment schema
 */
export function buildWordEnrichmentSchema(languageCode: string): GeminiSchema {
  const config = getLanguageConfig(languageCode);

  const wordSchema: Record<string, object> = {
    word: { type: Type.STRING, description: 'The word (corrected if needed)' },
    translation: { type: Type.STRING, description: 'Translation' },
    pronunciation: { type: Type.STRING, description: 'Pronunciation guide' },
    word_type: {
      type: Type.STRING,
      enum: ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other']
    },
    example: { type: Type.STRING, description: 'Example sentence' },
    example_translation: { type: Type.STRING, description: 'Example translation' },
    pro_tip: { type: Type.STRING, description: 'Usage tip (max 60 chars)' }
  };

  // Add gender for languages with grammatical gender
  if (config?.grammar.hasGender) {
    wordSchema.gender = {
      type: Type.STRING,
      enum: config.grammar.genderTypes || ['masculine', 'feminine', 'neuter']
    };
  }

  return {
    type: Type.OBJECT,
    properties: {
      words: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: wordSchema,
          required: ['word', 'translation', 'word_type']
        }
      }
    },
    required: ['words']
  };
}

/**
 * Build schema for transcript processing (Listen Mode).
 *
 * @returns Transcript processing schema
 */
export function buildTranscriptSchema(): GeminiSchema {
  return {
    type: Type.OBJECT,
    properties: {
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Original or corrected text' },
            language: { type: Type.STRING, description: 'Language code (e.g., "pl", "en")' },
            translation: { type: Type.STRING, description: 'Translation if in target language' },
            speaker: { type: Type.STRING, description: 'Speaker identifier if distinguishable' }
          },
          required: ['text', 'language']
        }
      },
      vocabularyNotes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING },
            context: { type: Type.STRING, description: 'How the word was used' }
          },
          required: ['word', 'translation']
        }
      }
    },
    required: ['segments']
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get language-specific extraction instructions for vocabulary.
 * Used to build AI prompts alongside schemas.
 *
 * @param languageCode - Target language code
 * @returns Extraction instructions string
 */
export function getExtractionInstructions(languageCode: string): string {
  const config = getLanguageConfig(languageCode);
  if (!config) return '';

  const instructions: string[] = [];

  // Conjugation instructions
  if (config.grammar.hasConjugation && config.grammar.conjugationPersons) {
    const persons = config.grammar.conjugationPersons;
    instructions.push(`FOR VERBS: Use infinitive form as "word". Include conjugations.present with ALL ${persons.length} forms:`);
    CONJUGATION_KEYS.forEach((key, i) => {
      if (persons[i]) {
        instructions.push(`  - ${key}: "${persons[i]}" form`);
      }
    });
  }

  // Gender instructions
  if (config.grammar.hasGender) {
    const genders = config.grammar.genderTypes?.join(', ') || 'masculine, feminine, neuter';
    instructions.push(`FOR NOUNS: Include "gender" field with value: ${genders}`);
    instructions.push(`FOR ADJECTIVES: Include "adjectiveForms" with all gender variants`);
  }

  // Article instructions
  if (config.grammar.hasArticles) {
    if (['de'].includes(languageCode)) {
      instructions.push('FOR NOUNS: Include "article" (der/die/das)');
    } else if (['fr'].includes(languageCode)) {
      instructions.push('FOR NOUNS: Include "article" (le/la/les)');
    } else if (['nl'].includes(languageCode)) {
      instructions.push('FOR NOUNS: Indicate de-word or het-word');
    }
  }

  // Script instructions
  if (['ru', 'uk'].includes(languageCode)) {
    instructions.push('ALPHABET: Words are in Cyrillic. Include pronunciation romanization.');
  }
  if (languageCode === 'el') {
    instructions.push('ALPHABET: Words are in Greek script. Include pronunciation romanization.');
  }

  return instructions.join('\n');
}

/**
 * Get the conjugation person label for a given key and language.
 * Useful for displaying forms to users.
 *
 * @param key - Normalized key (e.g., 'first_singular')
 * @param languageCode - Target language code
 * @returns The language-specific label (e.g., 'ja' for Polish, 'yo' for Spanish)
 */
export function getConjugationLabel(key: ConjugationKey, languageCode: string): string | null {
  const persons = getConjugationPersons(languageCode);
  const index = CONJUGATION_KEYS.indexOf(key);

  if (index === -1 || !persons[index]) {
    return null;
  }

  return persons[index];
}

/**
 * Map from language-specific person to normalized key.
 * Useful when importing data with native language keys.
 *
 * @param person - Language-specific person label (e.g., 'ja', 'yo')
 * @param languageCode - Target language code
 * @returns Normalized key or null if not found
 */
export function normalizeConjugationKey(person: string, languageCode: string): ConjugationKey | null {
  const persons = getConjugationPersons(languageCode);
  const index = persons.findIndex(p =>
    p.toLowerCase() === person.toLowerCase() ||
    p.toLowerCase().includes(person.toLowerCase())
  );

  if (index === -1 || index >= CONJUGATION_KEYS.length) {
    return null;
  }

  return CONJUGATION_KEYS[index];
}
