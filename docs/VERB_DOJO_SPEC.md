# Verb Dojo - Game Specification 🥋

**Created:** 2026-02-02
**Status:** Design Complete, Ready for Implementation
**Replaces:** Verb Mastery (old implementation)

---

## Overview

Verb Dojo is a verb conjugation training game that challenges users with random verbs, random tenses, and varied question formats. It's designed to be engaging, challenging, and effective for learning verb patterns across all 18 supported languages.

---

## Core Concept

**Random verb × Random tense × Random mode = Constant variety**

Users don't select a tense upfront. The game throws challenges at them from their entire unlocked verb vocabulary, keeping sessions fresh and unpredictable.

---

## Game Modes

### Mode Selection Screen

```
┌─────────────────────────────────────┐
│         🥋 VERB DOJO                │
│                                     │
│  Select your training style:        │
│                                     │
│  [🔀 Mixed]        ← default        │
│  [🎯 Match Pairs]                   │
│  [✏️ Fill Template]                 │
│  [📋 Multiple Choice]               │
│  [🔊 Audio Type]                    │
│                                     │
│  ─────────────────────────────      │
│  Focus on: [All Tenses ▼]           │
│  (optional tense filter)            │
│                                     │
└─────────────────────────────────────┘
```

### Mode Descriptions

| Mode | Description | Difficulty | UI |
|------|-------------|------------|-----|
| 🔀 **Mixed** | Random mix of all modes | Varies | Default selection |
| 🎯 **Match Pairs** | Drag 6 pronouns to 6 conjugations | Easy | Drag-and-drop |
| ✏️ **Fill Template** | `ja ___` - type the conjugation | Medium | Text input |
| 📋 **Multiple Choice** | Pick correct answer from 4 options | Easy | Tap to select |
| 🔊 **Audio Type** | Hear conjugation, type what you hear | Hard | Audio + text input |

### Focus Mode (Optional Filter)

Users can optionally filter to specific tenses:
- "All Tenses" (default)
- "Present only"
- "Past only"
- "Future only"
- etc. (based on language's available tenses)

---

## Question Formats

### 🎯 Match Pairs

Show one verb + one tense. User drags all 6 pronouns to their conjugations.

```
┌─────────────────────────────────────┐
│  robić (to do) - PRESENT            │
│                                     │
│  Pronouns:        Conjugations:     │
│  ┌────┐           ┌────────┐        │
│  │ ja │ ───────→  │ robię  │        │
│  └────┘           └────────┘        │
│  ┌────┐           ┌────────┐        │
│  │ ty │           │ robisz │        │
│  └────┘           └────────┘        │
│  ┌──────┐         ┌────────┐        │
│  │on/ona│         │ robi   │        │
│  └──────┘         └────────┘        │
│  ┌────┐           ┌────────┐        │
│  │ my │           │ robimy │        │
│  └────┘           └────────┘        │
│  ┌────┐           ┌────────┐        │
│  │ wy │           │ robicie│        │
│  └────┘           └────────┘        │
│  ┌─────┐          ┌────────┐        │
│  │ oni │          │ robią  │        │
│  └─────┘          └────────┘        │
│                                     │
│  [Check Answers]                    │
└─────────────────────────────────────┘
```

**Scoring:** Counts as 1 challenge (not 6). Must get all 6 correct for it to count as "correct".

**Gendered tenses (Slavic past/conditional):** Show both masculine and feminine forms as valid drop targets, or accept either.

### ✏️ Fill Template

Clear, unambiguous format showing exactly what's expected.

```
┌─────────────────────────────────────┐
│  kochać (to love) - PAST            │
│                                     │
│  Complete the conjugation:          │
│                                     │
│  ja ___________                     │
│                                     │
│  [        kochałem        ]         │
│                                     │
│  [Submit]                           │
└─────────────────────────────────────┘
```

**Gendered answers:** AI validation accepts both masculine (kochałem) and feminine (kochałam) as correct.

### 📋 Multiple Choice

Pick the correct conjugation from 4 options.

```
┌─────────────────────────────────────┐
│  mówić (to speak) - FUTURE          │
│                                     │
│  "they will speak" = ?              │
│                                     │
│  ○ będę mówić                       │
│  ○ będziesz mówić                   │
│  ● będą mówić        ← selected     │
│  ○ będziemy mówić                   │
│                                     │
│  [Submit]                           │
└─────────────────────────────────────┘
```

**Distractors:** Other conjugations of the same verb (different persons).

### 🔊 Audio Type

Hear the conjugation, type what you heard.

```
┌─────────────────────────────────────┐
│  🔊 Listen and type                 │
│                                     │
│  [▶️ Play Audio]                    │
│                                     │
│  What did you hear?                 │
│  [        robię          ]          │
│                                     │
│  [Submit]                           │
└─────────────────────────────────────┘
```

**Note:** Mark as Phase 2 implementation (requires more audio integration work).

---

## Question Generation

### Algorithm

```typescript
function generateQuestion(userVerbs: Verb[], selectedMode: Mode, focusTense?: Tense) {
  // 1. Pick random verb from user's vocabulary
  const verb = pickRandom(userVerbs);
  
  // 2. Get tenses unlocked for this verb
  let availableTenses = getUnlockedTenses(verb);
  
  // 3. Apply focus filter if set
  if (focusTense) {
    availableTenses = availableTenses.filter(t => t === focusTense);
  }
  
  // 4. Pick random tense
  const tense = pickRandom(availableTenses);
  
  // 5. Pick mode (random if Mixed)
  const mode = selectedMode === 'mixed' ? pickRandomMode() : selectedMode;
  
  // 6. Generate question for that mode
  return generateQuestionForMode(verb, tense, mode);
}
```

### Smart Cycling (No Immediate Repeats)

To keep sessions fresh:

1. Maintain a queue of all verb+tense combinations
2. When user gets a combo **correct**, move it to the back of the queue
3. When user gets a combo **wrong**, keep it near the front (will repeat sooner)
4. Never repeat a combo until the user has cycled through others

```typescript
interface VerbTenseCombo {
  verbId: string;
  tense: VerbTense;
  correctStreak: number; // 0 = just got wrong, higher = mastered
}

// Queue management
function onCorrectAnswer(combo: VerbTenseCombo, queue: VerbTenseCombo[]) {
  combo.correctStreak++;
  // Move to back of queue
  queue.splice(queue.indexOf(combo), 1);
  queue.push(combo);
}

function onWrongAnswer(combo: VerbTenseCombo, queue: VerbTenseCombo[]) {
  combo.correctStreak = 0;
  // Keep near front (will come back soon)
  // Could also shuffle into first third of queue
}
```

---

## XP System

### Streak-Based Rewards

XP is earned through correct answer streaks, not per-answer.

| Streak | XP Earned | Total XP |
|--------|-----------|----------|
| 5 correct in a row | +1 XP | 1 |
| 10 correct in a row | +1 XP | 2 |
| 15 correct in a row | +1 XP | 3 |
| ... | ... | ... |

**Break the streak = reset to 0**

### What Counts as "Correct"

| Mode | Correct if... |
|------|---------------|
| Match Pairs | All 6 matches are correct |
| Fill Template | Answer matches (AI validated) |
| Multiple Choice | Selected correct option |
| Audio Type | Typed matches audio (AI validated) |

### XP Display During Game

```
┌─────────────────────────────────────┐
│  🔥 Streak: 4    │    ⭐ XP: 2      │
│  ▓▓▓▓░ (1 more for +1 XP)          │
└─────────────────────────────────────┘
```

---

## Session Flow

### 1. Entry

User enters Verb Dojo from Games menu.

### 2. Mode Selection

- Choose mode (or Mixed by default)
- Optionally filter to specific tense(s)

### 3. Gameplay Loop

```
┌─────────────────────────────────────┐
│                                     │
│   Generate Question                 │
│         ↓                           │
│   Display Challenge                 │
│         ↓                           │
│   User Answers                      │
│         ↓                           │
│   Validate (AI or simple match)     │
│         ↓                           │
│   Show Feedback                     │
│         ↓                           │
│   Update Streak + XP                │
│         ↓                           │
│   Update Queue (cycling)            │
│         ↓                           │
│   Loop (until user exits)           │
│                                     │
└─────────────────────────────────────┘
```

### 4. Exit

- User can exit anytime
- Show session summary: questions answered, streak, XP earned
- XP is saved to profile

### 5. Session Length

**Endless until exit** - no fixed number of questions. User trains as long as they want.

---

## Language Support

### Dynamic Person Labels

Each language has its own pronouns:

| Language | Pronouns |
|----------|----------|
| Polish | ja, ty, on/ona, my, wy, oni |
| French | je, tu, il/elle, nous, vous, ils/elles |
| Spanish | yo, tú, él/ella, nosotros, vosotros, ellos |
| etc. | ... |

Pull from `LANGUAGE_CONFIGS[lang].grammar.conjugationPersons`

### Normalized Keys (Database)

Database stores conjugations with normalized keys:
- `first_singular`, `second_singular`, `third_singular`
- `first_plural`, `second_plural`, `third_plural`

Map these to display labels using language config.

### Gendered Tenses (Slavic)

For languages with gendered past/conditional:
- AI validation accepts either masculine or feminine
- Match Pairs could show: `ja (m) → robiłem`, `ja (f) → robiłam`
- Or: single drop zone that accepts either

**Future enhancement:** Ask user's gender preference in onboarding for more personalized questions.

### Limited Tenses (Imperative)

Imperative only has 2-3 persons (not 6):
- 2nd singular: "do it!" (ty)
- 1st plural: "let's do it!" (my)
- 2nd plural: "do it!" (wy)

Match Pairs for imperative would show 3 pairs, not 6.

---

## Technical Implementation

### Files to Modify/Create

| File | Changes |
|------|---------|
| `components/games/modes/VerbDojo.tsx` | NEW - main component |
| `components/games/modes/VerbDojo/MatchPairs.tsx` | NEW - drag-drop game |
| `components/games/modes/VerbDojo/FillTemplate.tsx` | NEW - text input game |
| `components/games/modes/VerbDojo/MultipleChoice.tsx` | NEW - selection game |
| `components/games/modes/VerbDojo/AudioType.tsx` | NEW - audio game (Phase 2) |
| `components/games/modes/VerbDojo/types.ts` | NEW - shared types |
| `components/games/modes/VerbDojo/useVerbQueue.ts` | NEW - queue/cycling hook |
| `components/FlashcardGame.tsx` | Update to use VerbDojo instead of VerbMastery |
| `constants/language-config.ts` | Already done ✅ |

### Key Dependencies

- Drag-and-drop library for Match Pairs (react-dnd or similar)
- AI validation for Fill Template / Audio Type (existing)
- TTS for Audio Type (existing)

---

## Implementation Phases

### Phase 1: Core Structure (MVP)
- [ ] VerbDojo component shell
- [ ] Mode selection screen
- [ ] Question generation with cycling
- [ ] XP streak system

### Phase 2: Game Modes
- [ ] Fill Template mode
- [ ] Multiple Choice mode
- [ ] Match Pairs mode (with drag-drop)

### Phase 3: Polish
- [ ] Audio Type mode
- [ ] Focus mode (tense filter)
- [ ] Session summary screen
- [ ] Animations and feedback

### Phase 4: Enhancements
- [ ] Progress tracking per verb
- [ ] User gender preference
- [ ] Difficulty scaling
- [ ] Achievements/milestones

---

## Open Questions

1. **Drag-drop library** - react-dnd? @dnd-kit? Native HTML5?
2. **Mobile UX for Match Pairs** - drag works on mobile? Or tap-to-select?
3. **Progress tracking** - how to persist verb mastery levels?
4. **Mixed mode ratio** - equal distribution or weighted by difficulty?

---

## Success Metrics

- Users complete more verb practice sessions
- Higher retention of verb conjugations (fewer wrong answers over time)
- Positive feedback on variety/engagement
- XP earned in Verb Dojo vs other games

---

*Last updated: 2026-02-02 01:00 CET*
