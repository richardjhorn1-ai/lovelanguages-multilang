/**
 * Prompt Templates for Multi-Language AI Interactions
 *
 * Language-agnostic prompt builders for AI endpoints.
 * Key principle: AI explains in user's NATIVE language while teaching TARGET language.
 */

import {
  getLanguageConfig,
  getSpecialChars,
  type LanguageConfig
} from '../constants/language-config.js';

import type { LevelTheme } from '../constants/levels.js';
export type { LevelTheme };

// =============================================================================
// TYPES
// =============================================================================

export type ChatMode = 'ask' | 'learn' | 'coach';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates that both languages are supported and returns their configs.
 */
function validateLanguagePair(
  targetLanguage: string,
  nativeLanguage: string
): { target: LanguageConfig; native: LanguageConfig } {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target) throw new Error(`Unsupported target language: ${targetLanguage}`);
  if (!native) throw new Error(`Unsupported native language: ${nativeLanguage}`);

  return { target, native };
}

/**
 * Get grammar-specific notes for a language.
 * Used to instruct AI on what grammatical information to include.
 */
export function getGrammarExtractionNotes(targetLanguage: string): string {
  const config = getLanguageConfig(targetLanguage);
  if (!config) return '';

  const notes: string[] = [];

  if (config.grammar.hasConjugation && config.grammar.conjugationPersons) {
    const persons = config.grammar.conjugationPersons.join(', ');
    notes.push(`FOR VERBS: Include present tense conjugation for: ${persons}`);
    if (['pl', 'cs', 'ru', 'uk'].includes(targetLanguage)) {
      notes.push('FOR VERBS: Note aspect (imperfective/perfective) if relevant');
    }
  }

  if (config.grammar.hasGender && config.grammar.genderTypes) {
    const genders = config.grammar.genderTypes.join(', ');
    notes.push(`FOR NOUNS: Include grammatical gender (${genders})`);
    if (targetLanguage === 'de') {
      notes.push('FOR NOUNS: Include definite article (der/die/das)');
    }
  }

  if (config.grammar.hasCases && config.grammar.caseNames) {
    const cases = config.grammar.caseNames.join(', ');
    notes.push(`FOR NOUNS: Cases: ${cases}`);
  }

  if (['ru', 'uk'].includes(targetLanguage)) {
    notes.push('ALPHABET: Cyrillic - include romanization');
  }
  if (targetLanguage === 'el') {
    notes.push('ALPHABET: Greek - include romanization');
  }

  return notes.join('\n');
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Build answer validation prompt for games.
 * Validates user answers with tolerance for typos, synonyms, missing diacritics.
 */
export function buildAnswerValidationPrompt(
  targetLanguage: string,
  nativeLanguage: string
): string {
  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);
  const specialChars = getSpecialChars(targetLanguage);

  return `Validate a learner's answer in a ${target.name} vocabulary game.

CONTEXT: Learning ${target.name} ${target.flag}, native ${native.name} ${native.flag}

VALIDATION RULES (be generous):
1. DIACRITICS: ${specialChars.length > 0
    ? `Accept missing diacritics: ${specialChars.join(' ')}`
    : 'Standard spelling expected'}
2. SYNONYMS: Accept valid synonyms and alternatives
3. TYPOS: Allow 1-2 typos for 5+ char words, 1 for 3-4 char
4. CASE: Ignore capitalization
5. ARTICLES: ${target.grammar.hasArticles ? 'Accept with or without articles' : 'N/A'}

OUTPUT JSON:
{
  "isCorrect": boolean,
  "confidence": "exact" | "close" | "synonym" | "incorrect",
  "feedback": "brief ${native.name} feedback",
  "correctAnswer": "canonical answer",
  "userAnswerNormalized": "cleaned user input",
  "issues": []
}`;
}

/**
 * Build level test generation prompt.
 */
export function buildLevelTestPrompt(
  targetLanguage: string,
  nativeLanguage: string,
  fromLevel: string,
  toLevel: string,
  theme: LevelTheme
): string {
  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);

  return `Create a level-up test for ${target.name} ${target.flag} learner (native ${native.name}).

TEST: ${fromLevel} → ${toLevel}
THEME: "${theme.name}" - ${theme.description}

CONCEPTS TO TEST:
${theme.concepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

QUESTION MIX:
- 60% Multiple Choice (4 options)
- 25% Fill in the Blank
- 15% Translation

REQUIREMENTS:
- Instructions in ${native.name}
- One question per concept minimum
- Difficulty appropriate for level transition

OUTPUT JSON array:
[{
  "type": "multipleChoice" | "fillBlank" | "translation",
  "question": "${native.name} question text",
  "targetText": "${target.name} text if any",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "answer",
  "explanation": "${native.name} explanation",
  "concept": "which concept tested"
}]`;
}
