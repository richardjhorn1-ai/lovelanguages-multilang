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
### MODE: LEARN - Structured Teaching

Known vocabulary: [${userLog.slice(0, 30).join(', ')}]

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

// =============================================================================
// ENHANCED COACH MODE PROMPT BUILDER
// =============================================================================

import type { EnhancedCoachContext } from '../types.js';

export interface EnhancedCoachPromptOptions {
  targetLanguage: string;
  nativeLanguage: string;
  context: EnhancedCoachContext;
}

/**
 * Build an enhanced coach prompt using the rich context from coach-context.ts
 * This creates a much more informative and actionable prompt for the AI.
 */
export function buildEnhancedCoachPrompt(options: EnhancedCoachPromptOptions): string {
  const { targetLanguage, nativeLanguage, context } = options;
  const { target, native } = validateLanguagePair(targetLanguage, nativeLanguage);

  // Build celebration section (only if there's something to celebrate)
  let celebrationSection = '';
  if (context.celebrations.milestone || context.celebrations.streak || context.celebrations.recentWin) {
    const celebrations: string[] = [];
    if (context.celebrations.milestone) celebrations.push(`- ${context.celebrations.milestone}`);
    if (context.celebrations.streak) celebrations.push(`- ${context.celebrations.streak}`);
    if (context.celebrations.recentWin) celebrations.push(`- ${context.celebrations.recentWin}`);

    celebrationSection = `
=== CELEBRATE! ===
${celebrations.join('\n')}
`;
  }

  // Build stuck words section
  let stuckWordsSection = '';
  if (context.stuckWords.length > 0) {
    const stuckList = context.stuckWords
      .map(w => `- "${w.word}" (${w.translation}) - failed ${w.failCount}x, ${w.daysSinceAttempt === 0 ? 'today' : w.daysSinceAttempt === 1 ? 'yesterday' : `${w.daysSinceAttempt} days ago`}`)
      .join('\n');
    stuckWordsSection = `
=== STUCK WORDS (need attention) ===
${stuckList}
`;
  }

  // Build improving words section
  let improvingWordsSection = '';
  if (context.improvingWords.length > 0) {
    const improvingList = context.improvingWords
      .map(w => `- "${w.word}" (${w.translation}) - ${w.streak}/5 streak (${5 - w.streak} more to master!)`)
      .join('\n');
    improvingWordsSection = `
=== ALMOST MASTERED ===
${improvingList}
`;
  }

  // Build missions section
  let missionsSection = '';
  if (context.missions.length > 0) {
    const missionsList = context.missions
      .map(m => {
        const priority = m.priority === 'high' ? '[HIGH]' : m.priority === 'medium' ? '[MEDIUM]' : '[LOW]';
        const action = m.suggestedAction === 'challenge' ? 'Create challenge' :
                      m.suggestedAction === 'word_gift' ? 'Send word gift' : 'Send love note';
        return `${priority} ${m.message} → ${action}`;
      })
      .join('\n');
    missionsSection = `
=== TODAY'S MISSIONS ===
${missionsList}
`;
  }

  return `You are a warm, helpful teaching assistant for a ${target.name} speaker helping their partner learn ${target.name}. Your responses should be encouraging, practical, and focused on helping the couple connect through language.

### COACH MODE - Agentic Teaching Assistant

=== QUICK SNAPSHOT ===
- Learner: ${context.learnerName}
- Level: ${context.stats.level} | XP: ${context.stats.xp}
- Words: ${context.stats.totalWords} learned, ${context.stats.masteredCount} mastered
- This week: ${context.velocity.wordsPerWeek} new words, ${context.velocity.practiceConsistency}/7 active days
- Your impact: ${context.teachingImpact.xpContributed} XP contributed, ${context.teachingImpact.wordsMastered} words mastered through teaching
${context.velocity.daysSinceLastPractice > 0 ? `- Last practice: ${context.velocity.daysSinceLastPractice === 1 ? 'yesterday' : `${context.velocity.daysSinceLastPractice} days ago`}` : '- Last practice: today'}
${celebrationSection}${stuckWordsSection}${improvingWordsSection}${missionsSection}
=== YOU CAN HELP ===
When the tutor asks you to do something, propose actions that will be executed automatically:
- "Create a Love Package with [topic] words" → type="word_gift"
- "Make a quiz on weak words" → type="quiz"
- "Send a Quick Fire challenge" → type="quickfire"
- "Send encouragement" → type="love_note"

When proposing an action, include it in the proposedAction field with:
- type: "word_gift", "quiz", "quickfire", or "love_note"
- title: Short description for confirmation UI
- description: What will happen
- Additional fields based on type (words, challengeConfig, noteCategory, etc.)

IMPORTANT: Always describe what you'll do FIRST in replyText, then include the action details in proposedAction.

FORMATTING:
- ${target.name} words go inside **double asterisks**
- Pronunciation goes in [square brackets]: [pronunciation]
- Keep responses warm, conversational, and actionable

GUIDANCE:
- Be practical - give suggestions they can use tonight
- Celebrate their progress when relevant
- Prioritize stuck words that need attention
- Focus on connection over perfection`;
}
