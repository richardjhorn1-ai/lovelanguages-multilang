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

export interface LearningJourneyContext {
  level: string;
  totalWords: number;
  topicsExplored: string[];
  canNowSay: string[];
  suggestions: string[];
  struggledWords: Array<{ word: string; translation: string }>;
}

export interface PartnerContext {
  learnerName: string;
  vocabulary: string[];
  weakSpots: Array<{ word: string; translation: string; failCount: number }>;
  recentWords: Array<{ word: string; translation: string }>;
  stats: { totalWords: number; masteredCount: number; xp: number; level: string };
  journey: LearningJourneyContext | null;
}

export interface ChatPromptOptions {
  targetLanguage: string;
  nativeLanguage: string;
  mode: ChatMode;
  userRole: 'student' | 'tutor';
  userLog?: string[];
  partnerName?: string | null;
  partnerContext?: PartnerContext | null;
  journeyContext?: LearningJourneyContext | null;
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
    userLog = [],
    partnerName,
    partnerContext,
    journeyContext
  } = options;

  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);
  const hasConjugation = target.grammar.hasConjugation || false;
  const conjugationPersons = target.grammar.conjugationPersons || [];

  // Build learning journey section
  const learningJourneySection = journeyContext ? `
LEARNER'S JOURNEY:
- Level: ${journeyContext.level} | Words learned: ${journeyContext.totalWords}
- Recent topics: ${journeyContext.topicsExplored.slice(0, 3).join(', ') || 'Just starting'}
- Can now say: ${journeyContext.canNowSay.slice(0, 3).join(', ') || 'Building vocabulary'}
${journeyContext.struggledWords.length > 0 ? `- Needs practice: ${journeyContext.struggledWords.map(w => w.word).join(', ')}` : ''}
- Suggested focus: ${journeyContext.suggestions.slice(0, 2).join(', ') || 'Keep exploring'}
` : '';

  const COMMON = `You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.
${learningJourneySection}
CONTEXT: Use conversation history naturally - build on what they've learned, don't repeat yourself.

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
### MODE: LEARN - Structured Lesson

You MUST use special markdown syntax. This is NON-NEGOTIABLE.

Known vocabulary: [${userLog.slice(0, 30).join(', ')}]

VERB TEACHING RULE:
${hasConjugation ? `When teaching ANY verb, ALWAYS show ALL ${conjugationPersons.length} conjugations (${conjugationPersons.join(', ')}).
This is essential - never show partial conjugations.` : `Show the base/infinitive form and any key variations.`}

YOUR RESPONSE MUST CONTAIN THESE EXACT PATTERNS:

PATTERN 1 - Table (copy this EXACT format):
::: table
Column1 | Column2 | Column3
---|---|---
Row1Col1 | Row1Col2 | Row1Col3
:::

PATTERN 2 - Drill (copy this EXACT format):
::: drill
Your challenge text here
:::

ALWAYS END WITH A FOLLOW-UP QUESTION offering to teach related content.

If you write a table WITHOUT "::: markers, IT WILL NOT RENDER.
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

    const weakWords = partnerContext.weakSpots.slice(0, 5).map(w => w.word).join(', ') || 'None identified';
    const recentWords = partnerContext.recentWords.slice(0, 5).map(w => w.word).join(', ') || 'Just starting';

    return `
### COACH MODE

You're here to assist a ${target.name}-speaking tutor who is teaching their ${native.name}-speaking partner (${partnerContext.learnerName}).

${partnerContext.learnerName.toUpperCase()}'S LEARNING JOURNEY:
- Level: ${partnerContext.stats.level} | Words learned: ${partnerContext.stats.totalWords}
${partnerContext.journey ? `- Topics explored: ${partnerContext.journey.topicsExplored.slice(0, 3).join(', ') || 'Just starting'}
- Can now say: ${partnerContext.journey.canNowSay.slice(0, 3).join(', ') || 'Building vocabulary'}
- Suggested focus: ${partnerContext.journey.suggestions.slice(0, 2).join(', ') || 'Keep exploring'}` : ''}
- Needs practice: ${weakWords}
- Recently learned: ${recentWords}

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
