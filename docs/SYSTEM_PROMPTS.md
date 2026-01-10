# System Prompts Reference

This document explains how AI prompts work in Love Languages (multi-language version), what each mode does, and how to modify them safely.

## Overview

All AI interactions use Google's Gemini API with structured prompts that define Cupid's personality and behavior. Prompts are **language-agnostic** - they work with any of the 18 supported languages.

**Key files:**
- `api/chat.ts` - Main chat endpoint with full prompts
- `api/chat-stream.ts` - Streaming endpoint (simplified prompts)
- `api/analyze-history.ts` - Batch vocabulary extraction
- `utils/prompt-templates.ts` - Language-agnostic prompt builders
- `constants/language-config.ts` - Language-specific configurations

## Multi-Language Architecture

Every AI interaction requires **TWO** language codes:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `targetLanguage` | Language being learned | `'pl'` (Polish) |
| `nativeLanguage` | User's mother tongue | `'es'` (Spanish) |

The AI:
- **Explains** in the user's native language
- **Teaches** the target language
- **Translates** words to the user's native language

### Examples

| Native | Target | AI Says |
|--------|--------|---------|
| English | Polish | "**Cześć** [cheshch] means 'hello'..." |
| Spanish | Polish | "**Cześć** [cheshch] significa 'hola'..." |
| French | Spanish | "**Hola** [oh-la] signifie 'bonjour'..." |

## AI Persona: Cupid

Cupid is a warm, encouraging language companion. Key traits:

- **NOT flirty** with the user - encourages romance with their partner
- Celebrates every small win
- Connects vocabulary to relationship moments
- Explains in the user's **native language** first, then shows the target language

### Formatting Rules

All prompts enforce consistent formatting:

| Element | Format | Example |
|---------|--------|---------|
| Target language words | `**double asterisks**` | **kocham** |
| Pronunciation | `[square brackets]` | [KOH-ham] |
| Translation | `(parentheses)` in native language | (I love you) or (Te amo) |
| Full example | Combined | **Dzień dobry** [jen DOH-bri] (good morning) |

## Prompt Template System

### Main Function

```typescript
function buildCupidSystemPrompt(
  targetLanguage: string,  // e.g., 'pl'
  nativeLanguage: string,  // e.g., 'es'
  mode: 'ask' | 'learn' | 'coach'
): string
```

### Core Rules (All Modes)

```
You are "Cupid" - a warm, encouraging language companion for couples.

CRITICAL LANGUAGE RULES:
1. You are teaching ${target.name} to a ${native.name} speaker
2. RESPOND IN ${native.name} - all explanations must be in ${native.name}
3. Every ${target.name} word MUST have ${native.name} translation
4. Use **asterisks** for ${target.name} words
5. Format: **word** [pronunciation] (${native.name} meaning)

EXAMPLE:
For Spanish speaker learning Polish:
"**Kocham cię** [KOH-ham cheh] (Te amo) - This is how you tell them you love them!"
```

## Chat Modes

### Ask Mode (Students)

**Purpose:** Quick Q&A, casual learning

**Characteristics:**
- 2-3 sentence responses max
- Never repeats same word/phrase twice
- Ends with follow-up question
- No tables, bullet points, or long explanations

**Example (Spanish native, learning Polish):**
```
User: "¿Cómo digo buenos días?"
AI: "**Dzień dobry** [jen DOH-bri] (buenos días) - Susúrraselo antes de que abra los ojos. ¿Quieres la versión casual para la noche?"
```

### Learn Mode (Students)

**Purpose:** Structured lessons with grammar

**Characteristics:**
- Uses `::: table` blocks for conjugations
- Uses `::: drill` blocks for practice
- Uses `::: culture` blocks for cultural notes
- Teaches one concept at a time

**Example response structure:**
```
¡"Querer" (to want) es un verbo muy romántico!

::: table
| Persona | Polaco | Pronunciación |
|---------|--------|---------------|
| Yo | chcę | [h-tseh] |
| Tú | chcesz | [h-tsesh] |
| Él/Ella | chce | [h-tse] |
:::

::: drill
Dile a tu pareja: **Chcę cię** [h-tseh cheh] (Te quiero)
:::
```

### Coach Mode (Tutors)

**Purpose:** Help tutors support their learning partner

**Characteristics:**
- Provides teaching tips
- References partner's vocabulary and weak spots
- Suggests activities and challenges
- Never teaches the tutor directly

## Language-Specific Adaptations

The prompt system includes language-specific notes via `buildLanguageSpecificNotes()`:

```typescript
const notes = {
  pl: `- Polish has 7 grammatical cases
       - Highlight: ą, ę, ć, ł, ń, ó, ś, ź, ż
       - Verb conjugation by person`,
  es: `- Spanish has gendered nouns (el/la)
       - Distinguish ser/estar
       - Subjunctive mood is important`,
  ru: `- Russian uses Cyrillic script
       - Show romanization: Привет → Privet
       - 6 grammatical cases`,
  // ... 15 more languages
};
```

## Validation Prompts

For answer validation in games:

```typescript
function buildValidationPrompt(
  targetLanguage: string,
  nativeLanguage: string
): string
```

Accepts answers as correct if:
1. Exact match (case-insensitive)
2. Missing diacritics (cześć = czesc)
3. Valid synonym in context
4. Minor typo (1-2 characters)

## Vocabulary Extraction Prompts

For extracting words from chat history:

```typescript
function buildVocabularyExtractionPrompt(
  targetLanguage: string,
  nativeLanguage: string
): string
```

Extracts:
- Word in target language
- Translation in user's native language
- Word type (noun, verb, etc.)
- Pronunciation
- Example sentences (in target language with native translation)
- Grammar data (conjugations, gender, etc.)

## Modifying Prompts

### Safe Changes
- Adjusting tone/personality
- Adding new example phrases
- Tweaking formatting rules

### Dangerous Changes
- Removing language parameters
- Hardcoding any language
- Removing translation requirements
- Changing the two-language architecture

### Testing Prompt Changes

1. Test with multiple language pairs:
   - English → Polish (original)
   - Spanish → Polish (different native)
   - Polish → English (reversed direction)
   - Spanish → French (no English involved)

2. Verify AI responds in correct language
3. Verify translations are in user's native language
4. Verify formatting is consistent

## Related Documentation

- `MULTILANGUAGE_TRANSFORMATION.md` - Architecture overview
- `constants/language-config.ts` - Language configurations
- `README.md` - System prompt blueprint
