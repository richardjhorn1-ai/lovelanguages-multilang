# System Prompts Reference

This document explains how AI prompts work in Love Languages, what each mode does, and how to modify them safely.

## Overview

All AI interactions use Google's Gemini API with structured prompts that define Cupid's personality and behavior.

**Key files:**
- `api/chat.ts` - Main chat endpoint with full prompts
- `api/chat-stream.ts` - Streaming endpoint (simplified prompts)
- `api/analyze-history.ts` - Batch vocabulary extraction

## AI Persona: Cupid

Cupid is a warm, encouraging Polish language companion. Key traits:

- **NOT flirty** with the user - encourages romance with their partner
- Celebrates every small win
- Connects vocabulary to relationship moments
- Explains in English first, then shows Polish

### Formatting Rules

All prompts enforce consistent formatting:

| Element | Format | Example |
|---------|--------|---------|
| Polish words | `**double asterisks**` | **kocham** |
| Pronunciation | `[square brackets]` | [KOH-ham] |
| Full example | Combined | **Dzień dobry** [jen DOH-bri] means "good morning" |

## Chat Modes

### Ask Mode (Students)

**Purpose:** Quick Q&A, casual learning

**Characteristics:**
- 2-3 sentence responses max
- Never repeats same word/phrase twice
- Ends with follow-up question
- No tables, bullet points, or long explanations

**When users should use it:** Quick questions, vocabulary lookups, pronunciation help

**Example prompt pattern:**
```
User: "How do I say good morning?"
AI: "Dzień dobry (jen DOH-bri)! Whisper it to them before they open their eyes. Want the casual evening version?"
```

### Ask Mode (Tutors) - UI Label: "Coach"

**Purpose:** Help tutors support their partner's learning

**Characteristics:**
- Detects user intent (learning vs teaching tips)
- Can teach directly OR give teaching strategies
- Warm, supportive tone
- 2-4 sentence responses

**When tutors should use it:** Quick questions about Polish, teaching tips, pronunciation guidance

### Learn Mode

**Purpose:** Structured lessons with rich formatting

**Characteristics:**
- Uses special markdown blocks (`::: table`, `::: drill`)
- Shows all 6 verb conjugations when teaching verbs
- References user's known vocabulary
- Ends with follow-up offering related content

**Special syntax:**
```markdown
::: table
Person | Polish | Pronunciation
---|---|---
I | kocham | KOH-ham
You | kochasz | KOH-hash
:::

::: drill
Tonight's challenge: Say "Kocham cię" while looking into their eyes.
:::
```

**When users should use it:** Formal lessons, verb conjugation practice, grammar deep-dives

### Coach Mode (Tutors Only) - UI Label: "Context"

**Purpose:** Relationship-focused guidance with partner context

**Characteristics:**
- Fetches partner's vocabulary, weak spots, and progress
- Suggests phrases partner already knows
- Creates intimate moments through language
- No vocabulary extraction (tutor isn't the learner)

**Data available to AI:**
- Partner's learned vocabulary
- Words they're struggling with
- Recent words learned
- XP, level, mastery stats

**When tutors should use it:** Personalized suggestions, progress-aware recommendations

## Vocabulary Extraction

Every student chat response includes vocabulary extraction. The AI must populate `newWords` array with complete data.

### Requirements by Word Type

| Type | Required Fields |
|------|-----------------|
| Verb | `conjugations.present` (all 6 persons), `examples` (5), `proTip` |
| Noun | `gender`, `plural`, `examples` (5), `proTip` |
| Adjective | `adjectiveForms` (all 4 genders), `examples` (5), `proTip` |
| Phrase | `examples` (5), `proTip` |

### Conjugation Format

**Present tense (always required for verbs):**
```json
{
  "present": {
    "ja": "jem",
    "ty": "jesz",
    "onOna": "je",
    "my": "jemy",
    "wy": "jecie",
    "oni": "jedzą"
  }
}
```

**Past/Future tenses:** Only extracted when explicitly taught in conversation. Include `unlockedAt` timestamp.

## Context Awareness

The AI receives the last 10 messages of conversation history. This enables:

- Referencing earlier topics ("Earlier you learned X...")
- Avoiding repetition of covered material
- Progressive vocabulary building
- Understanding follow-up questions

**Implementation:** Messages passed as multi-turn format to Gemini API.

## Modifying Prompts

### Safe Changes

- Adjusting tone/personality within Cupid's character
- Adding new example responses
- Tweaking formatting rules
- Adding context awareness instructions

### Risky Changes

- Changing vocabulary extraction schema (breaks database)
- Removing required fields (causes frontend errors)
- Changing mode names (breaks frontend routing)
- Removing formatting rules (breaks markdown rendering)

### Testing Prompt Changes

1. Make changes in `api/chat.ts`
2. Run `npm run build` to verify TypeScript
3. Test in browser with various inputs
4. Check that vocabulary extraction still works
5. Verify markdown renders correctly in ChatArea

## UX Impact Matrix

| Change | Affects | Risk Level |
|--------|---------|------------|
| Tone adjustments | User experience | Low |
| Response length | User experience | Low |
| Formatting rules | Markdown rendering | Medium |
| Extraction schema | Database, Love Log | High |
| Mode definitions | Frontend modes | High |
| Role detection | Tutor/Student experience | Medium |

## Troubleshooting

### AI not extracting vocabulary
- Check that response schema matches expected format
- Verify mode isn't `coach` (no extraction in coach mode)
- Check Gemini API response in browser dev tools

### Markdown not rendering
- Ensure `::: table` and `:::` markers are present
- Check ChatArea.tsx renderContent function
- Verify no HTML artifacts in response

### Context not working
- Check that `messages` array is passed to API
- Verify messages have `role` and `content` fields
- Check API logs for message count

## File Reference

| File | Purpose |
|------|---------|
| `api/chat.ts:251-330` | COMMON_INSTRUCTIONS with formatting rules |
| `api/chat.ts:332-440` | MODE_DEFINITIONS for each mode |
| `api/chat.ts:443-515` | Coach mode with partner context |
| `api/chat.ts:574-641` | Vocabulary extraction schema |
| `api/chat-stream.ts:67-116` | Simplified streaming prompts |
