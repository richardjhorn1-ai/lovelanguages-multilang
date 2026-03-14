/**
 * Prompt Templates for Multi-Language AI Interactions
 *
 * Language-agnostic prompt builders for AI endpoints.
 * Key principle: AI explains in user's NATIVE language while teaching TARGET language.
 */

import {
  getLanguageConfig,
  getLanguageName,
  getSpecialChars,
  type LanguageConfig
} from '../constants/language-config.js';
import { getExtractionInstructions } from './schema-builders.js';

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
  learningGoal?: string | null;
  partnerContext?: {
    learnerName: string;
    stats: { totalWords: number; masteredCount: number; xp: number; level: string };
    weakSpots?: Array<{ word: string; translation?: string; failCount?: number }>;
    recentWords?: Array<{ word: string; translation?: string }>;
  } | null;
  vocabularySection?: string;
  includeVocabularyExtraction?: boolean;
  includeCoachActions?: boolean;
}

export interface VoicePromptOptions {
  targetLanguage: string;
  nativeLanguage: string;
  mode: ChatMode;
  vocabularySection?: string;
}

function buildChatBlockGuide(): string {
  return `TEXT CHAT BLOCKS (optional - use only when they genuinely improve the answer):
- ::: table ... ::: = structured reference or comparison (conjugations, articles, phrase breakdowns, register contrasts)
- ::: drill ... ::: = one short practice challenge the learner can do right now
- ::: culture[Optional title] ... ::: = etiquette, pragmatics, customs, tone, or relationship context
- ::: slang[Optional title] ... ::: = colloquial, flirty, or more native-sounding alternatives with register guidance

BLOCK RULES:
- Only use the block types: table, drill, culture, slang
- Start each block with its opener on its own line, for example exactly "::: table"
- If you want a title, use brackets like ::: culture[Dating etiquette] rather than free text after the block type
- Close every block with ::: on its own line
- Outside blocks, write normal prose
- Use at most 1-2 blocks in a response, and only when each block has a distinct job
- If a simple answer works, prefer plain prose over a block`;
}

function buildStudentAskPrompt(target: LanguageConfig, native: LanguageConfig): string {
  return `
### ASK MODE - Quick Q&A

Default to plain prose. Stay conversational, concise, and directly useful.
- Usually answer in 2-4 short sentences
- Give the ${target.name} word or phrase with pronunciation, then explain briefly in ${native.name}
- Use at most ONE lightweight enrichment block, usually ::: culture or ::: slang, only if it clearly makes the answer more natural or helpful
- Avoid ::: table and ::: drill unless the user explicitly asks for a breakdown, examples, exercises, practice, or structure
- If the user asks for a simple translation or quick phrase, do not use blocks
- Ask a follow-up question only when it feels natural and useful
`;
}

function buildStudentLearnPrompt(target: LanguageConfig, native: LanguageConfig): string {
  const conjugationLine = target.grammar.hasConjugation && target.grammar.conjugationPersons
    ? `- When teaching a verb, show all ${target.grammar.conjugationPersons.length} key persons (${target.grammar.conjugationPersons.join(', ')}) when that full view helps the learner`
    : '';

  return `
### LEARN MODE - Structured Teaching

Teach one concept well without overwhelming them.
- Skip gushy encouragement and long scene-setting intros; get to the teaching quickly
- Use ::: table for structured reference and comparisons
- Use ::: drill for one actionable practice task
- Use ::: culture to explain etiquette, tone, or why natives phrase it that way
- Use ::: slang to show a more natural, colloquial, or flirtier alternative when relevant
- Use 1-2 blocks max, and only when each one adds something distinct
- Good Learn patterns: table + culture, table + drill, prose + slang
- Keep explanations in ${native.name}; keep the taught language examples in ${target.name}
${conjugationLine}
`;
}

function buildCoachPrompt(
  target: LanguageConfig,
  native: LanguageConfig,
  partnerContext: ChatPromptOptions['partnerContext'],
  includeCoachActions: boolean
): string {
  if (!partnerContext) {
    return `
### COACH MODE

Your partner has not connected their account yet.
- Encourage the tutor to ask their partner to accept the connection request
- Explain that once linked, you can tailor ideas to the learner's progress
- Keep the guidance warm, practical, and concise
`;
  }

  const weakWords = partnerContext.weakSpots?.slice(0, 5).map((word) => word.word).join(', ') || 'None identified yet';
  const recentWords = partnerContext.recentWords?.slice(0, 5).map((word) => word.word).join(', ') || 'Just getting started';

  const actionSection = includeCoachActions
    ? `
=== ACTIONS (Optional Superpower) ===

Beyond conversation, you can also CREATE and SEND things directly to ${partnerContext.learnerName} through this app.

Use proposedAction only when the tutor explicitly wants you to create or send something for their partner.

Examples that SHOULD use proposedAction:
- "create a quiz on food"
- "send some words about flirting"
- "make a challenge for tonight"
- "send encouragement"

Examples that should stay normal conversation:
- "what should I teach next?"
- "what words is she struggling with?"
- "help me explain this naturally"

If you use proposedAction:
1. Briefly explain what you're creating in replyText
2. Include the action in proposedAction
3. Assume they will confirm before it sends

Action types:
- word_gift: send vocabulary (words must always be in ${target.name} with translations in ${native.name})
- quiz: send a quiz challenge
- quickfire: send a timed speed challenge
- love_note: send a short encouragement message
`
    : '';

  return `
### COACH MODE - Teaching Assistant

You're assisting a ${target.name}-speaking tutor who is teaching their ${native.name}-speaking partner (${partnerContext.learnerName}).

=== QUICK SNAPSHOT ===
- Level: ${partnerContext.stats.level} | XP: ${partnerContext.stats.xp}
- Words: ${partnerContext.stats.totalWords} learned, ${partnerContext.stats.masteredCount} mastered
- Review soon: ${weakWords}
- Recent focus: ${recentWords}

COACH STYLE:
- Be practical, concise, and useful for a real lesson tonight
- Help the tutor sound natural, teach clearly, and keep the moment warm
- culture and slang guidance are especially helpful when tone, register, or nativeness matters
- table and drill are fine when the tutor explicitly wants structure, examples, or an exercise
- Do not force partner data into every reply; use it when it sharpens the advice
- Suggest NEW words or better phrasing when it truly helps connection
${actionSection}
`;
}

function buildVocabularyExtractionSection(targetLanguage: string): string {
  return `
VOCABULARY EXTRACTION:
Extract every new ${getLanguageName(targetLanguage)} word you teach into the newWords array.
${getExtractionInstructions(targetLanguage)}
`;
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
    learningGoal,
    partnerContext,
    vocabularySection,
    includeVocabularyExtraction = false,
    includeCoachActions = false,
  } = options;

  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);
  const vocabBlock = vocabularySection ? `\n${vocabularySection}\n` : '';

  const COMMON = `You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.
${vocabBlock}
CONTEXT: Use conversation history naturally. Build on what they already know. Don't repeat yourself or recap more than necessary.

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
- Keep prose warm and natural, not robotic or lecture-heavy

${buildChatBlockGuide()}
`;

  let modePrompt: string;
  if (userRole === 'tutor') {
    modePrompt = buildCoachPrompt(target, native, partnerContext, includeCoachActions);
  } else if (mode === 'learn') {
    modePrompt = buildStudentLearnPrompt(target, native);
  } else {
    modePrompt = buildStudentAskPrompt(target, native);
  }

  const personalizedContext = partnerName && userRole === 'student'
    ? `\nREMEMBER: They're learning ${target.name} for ${partnerName}. Reference this naturally.`
    : '';

  const goalContext = learningGoal && userRole === 'student'
    ? `\nLEARNING GOAL: Their immediate goal is "${learningGoal}". Keep examples and encouragement relevant to that goal when it fits naturally.`
    : '';

  const extractionSection = includeVocabularyExtraction
    ? `\n${buildVocabularyExtractionSection(targetLanguage)}`
    : '';

  return `${COMMON}${modePrompt}${personalizedContext}${goalContext}${extractionSection}`;
}

/**
 * Build shared voice instructions for ask/learn/coach modes.
 * Voice mode gets the same semantic guidance as text chat, but never uses markdown blocks.
 */
export function buildVoiceModeInstruction(options: VoicePromptOptions): string {
  const { targetLanguage, nativeLanguage, mode, vocabularySection } = options;
  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);
  const vocabBlock = vocabularySection ? `\n${vocabularySection}\n` : '';

  const COMMON = `You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.
${vocabBlock}
VOICE RULES:
- Speak naturally and conversationally
- Speak primarily in ${native.name}, then introduce ${target.name} words and pronunciation
- Keep responses concise (usually 2-3 short sentences)
- Do not use markdown, tables, bullet lists, or block syntax
- If a cultural note or more native-sounding alternative would help, give it as one short spoken aside rather than turning it into a lesson
`;

  const ASK = `
ASK MODE:
- Default to quick conversational help, not a mini-lesson
- Answer the question directly first
- Only give a brief cultural or native-usage aside when it clearly improves the answer
`;

  const LEARN = `
LEARN MODE:
- Teach one concept at a time
- You may briefly add cultural context, nativeness, or a short practice prompt when it helps learning
- For verbs or grammar, explain the next useful step rather than dumping every detail at once
`;

  const COACH = `
COACH MODE:
- Help the tutor explain things clearly and naturally to their partner
- Offer teachable phrasing, pronunciation help, and short cultural or register notes when useful
- Keep it practical and concise because they may be mid-lesson
`;

  const modePrompt = mode === 'learn' ? LEARN : mode === 'coach' ? COACH : ASK;
  return `${COMMON}${modePrompt}`;
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
