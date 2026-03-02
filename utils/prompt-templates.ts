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

// =============================================================================
// CHAT PROMPT BUILDER
// =============================================================================

export interface ChatPromptOptions {
  targetLanguage: string;
  nativeLanguage: string;
  mode: ChatMode;
  userRole: 'student' | 'tutor';
  partnerName?: string | null;
  partnerContext?: {
    learnerName: string;
    stats: { totalWords: number; masteredCount: number; xp: number; level: string };
  } | null;
  vocabularySection?: string;
}

/**
 * Build the complete chat system prompt.
 * Shared between streaming and non-streaming endpoints.
 */
export function buildChatPrompt(options: ChatPromptOptions): string {
  const {
    targetLanguage,
    nativeLanguage,
    mode,
    userRole,
    partnerName,
    partnerContext,
    vocabularySection
  } = options;

  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);
  const hasConjugation = target.grammar.hasConjugation || false;
  const conjugationPersons = target.grammar.conjugationPersons || [];

  // Vocabulary context section (replaces old journey section)
  const vocabBlock = vocabularySection ? `\n${vocabularySection}\n` : '';

  const COMMON = `You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.
${vocabBlock}
CONTEXT: Use conversation history naturally. Don't repeat yourself. Don't recap what the user knows — just teach the next thing.

CORE PRINCIPLES:
- You are NOT flirty with the user - you ENCOURAGE them to be romantic with their partner
- Celebrate every small win enthusiastically
- Connect vocabulary to relationship moments
- Write ALL explanations in ${native.name}, then introduce ${target.name} words with their ${native.name} translation

PACE: Don't overwhelm. One concept at a time. Translate everything helpfully.

FORMAT:
- ${target.name} words in **bold**: **word**
- Pronunciation in [brackets]: [pro-nun-see-AY-shun]
- Example: **${target.examples.hello}** [pronunciation] means "${native.examples.hello}"
`;

  // Mode-specific prompts
  const askPrompt = `
### ASK MODE - Quick Q&A

Be conversational and concise. 2-3 sentences max.
- Give the ${target.name} word once with pronunciation, then move on
- End with a follow-up question to keep the conversation going
- No tables, lists, or lectures - just natural chat
`;

  const learnPrompt = `
### MODE: LEARN - Structured Teaching

RESPONSE STYLE:
- Keep explanations concise - teach one concept well, don't overwhelm
- Use tables for conjugations/declensions (when teaching verbs or grammar)
- Use drills sparingly - only for actionable practice challenges
- Don't force both table AND drill into every response

SPECIAL MARKDOWN (use when appropriate):
::: table
Header1 | Header2
---|---
Data1 | Data2
:::

::: drill
Practice challenge here
:::

${hasConjugation ? `VERBS: When teaching a verb, show all ${conjugationPersons.length} persons (${conjugationPersons.join(', ')}).` : ''}
`;

  const buildCoachPrompt = (): string => {
    if (!partnerContext) {
      return `
### COACH MODE

Your partner hasn't connected their account yet. Encourage the tutor to:
1. Ask their partner to accept the connection request
2. Come back once linked for personalized suggestions
`;
    }

    return `
### COACH MODE

You're here to assist a ${target.name}-speaking tutor who is teaching their ${native.name}-speaking partner (${partnerContext.learnerName}).

GUIDANCE:
- Be practical - give suggestions they can use tonight
- Suggest NEW words to grow their vocabulary
- Focus on connection over perfection
`;
  };

  // Select mode prompt
  let modePrompt: string;
  if (userRole === 'tutor') {
    modePrompt = buildCoachPrompt();
  } else {
    modePrompt = mode === 'learn' ? learnPrompt : askPrompt;
  }

  // Add partner personalization for students
  const personalizedContext = partnerName && userRole === 'student'
    ? `\nREMEMBER: They're learning ${target.name} for ${partnerName}. Reference this naturally.`
    : '';

  return COMMON + modePrompt + personalizedContext;
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
- 60% multiple_choice (4 options each)
- 25% fill_blank
- 15% translation

REQUIREMENTS:
- Write question text and explanations in ${native.name}
- One question per concept minimum
- Difficulty appropriate for ${fromLevel} → ${toLevel} transition
- Use unique IDs: q1, q2, q3, etc.
- Mark each question isCore: true for core concept questions, false for personalized vocabulary questions
- Set each question's theme to the specific concept it tests from the list above`;
}

