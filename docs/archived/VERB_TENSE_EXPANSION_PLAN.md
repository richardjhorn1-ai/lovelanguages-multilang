# Verb Tense Expansion - Implementation Plan

**Created:** 2026-02-01
**Branch:** `feature/verb-tense-expansion`
**Status:** Phase 1 Complete (Language Config)

---

## Overview

Expand verb tense support from basic present/past/future to full conjugation coverage per language, with proper UI in Love Log and integration with Verb Mastery game.

---

## ✅ Phase 1: Foundation (COMPLETE)

- [x] Add `VerbTense` and `TenseStructure` types
- [x] Add `availableTenses`, `tenseStructures`, `imperativePersons` to all 18 languages
- [x] Add helper functions: `getAvailableTenses()`, `getTenseStructure()`, `hasTense()`

---

## Phase 2: API Updates

### 2.1 Update `unlock-tense.ts` to handle all tenses

**Current state:** Only handles 'past' and 'future'
**Target state:** Handle all tenses from language config (conditional, imperative, subjunctive, imperfect)

**Changes needed:**

```typescript
// Before
if (!['past', 'future'].includes(tense)) {
  return res.status(400).json({ error: "Invalid tense. Must be 'past' or 'future'" });
}

// After
const availableTenses = getAvailableTenses(languageCode);
if (!availableTenses.includes(tense) || tense === 'present') {
  return res.status(400).json({ 
    error: `Invalid tense '${tense}' for ${languageName}. Available: ${availableTenses.filter(t => t !== 'present').join(', ')}` 
  });
}
```

**New prompts needed for:**
- `conditional` - Standard and gendered variants
- `imperative` - Limited persons (2sg, 1pl, 2pl typically)
- `subjunctive` - Romance languages
- `imperfect` - Romance languages (separate from past/preterite)

**Files to modify:**
- `api/unlock-tense.ts`

**🤖 Agent Review Point:**
> Before implementing, spawn agent to review current `unlock-tense.ts` prompt structure and suggest optimal prompts for each new tense type. Include schema generation patterns.

---

### 2.2 Update schema builders for new tense structures

**File:** `utils/schema-builders.ts`

**Changes needed:**
- Add schema builders for `conditional` (gendered for Slavic)
- Add schema builder for `imperative` (limited persons)
- Add schema builder for `subjunctive` (standard 6-person)
- Add schema builder for `imperfect` (standard 6-person)

**🤖 Agent Review Point:**
> Spawn agent to audit `schema-builders.ts` and identify all places that need updates for new tense types.

---

## Phase 3: Love Log UI Updates

### 3.1 Dynamic tense tabs based on language config

**Current state:** Hardcoded 3 tabs (present, past, future)
**Target state:** Dynamic tabs from `getAvailableTenses(targetLanguage)`

**UI Pattern Decision:**
- **Desktop:** Dropdown selector (cleaner for 5-7 tenses)
- **Mobile:** Scrollable pill bar or compact dropdown

**Files to modify:**
- `components/LoveLog.tsx`

**Changes needed:**
```typescript
// Before
{(['present', 'past', 'future'] as const).map(tense => ...)}

// After
const availableTenses = getAvailableTenses(targetLanguage);
{availableTenses.map(tense => ...)}
```

**Additional UI changes:**
- Tense labels should be translated (i18n)
- Lock icon logic stays same (present always unlocked, others need unlock)
- Different display for 'limited' tenses (imperative) - fewer rows

**🤖 Agent Review Point:**
> Spawn agent to review Love Log component and identify all hardcoded tense references that need updating.

---

### 3.2 Handle different tense structures in display

**Tense display variants:**

| Structure | Display |
|-----------|---------|
| `standard` | 6 rows (first_singular through third_plural) |
| `gendered` | 6 rows × gender columns (masculine, feminine, neuter for 3rd) |
| `limited` | 2-3 rows only (imperative: 2sg, 1pl, 2pl) |
| `simple` | Single row or note "Same form for all persons" |

**Files to modify:**
- `components/LoveLog.tsx` (conjugation table display section)

---

### 3.3 Add i18n for tense names

**File:** `locales/*/translation.json` (all 18 locales)

**Keys needed:**
```json
{
  "loveLog": {
    "tenses": {
      "present": "Present",
      "past": "Past",
      "future": "Future",
      "conditional": "Conditional",
      "imperative": "Imperative",
      "subjunctive": "Subjunctive",
      "imperfect": "Imperfect"
    }
  }
}
```

**🤖 Agent Review Point:**
> Spawn agent to add tense translations to all 18 locale files.

---

## Phase 4: Verb Mastery Game Integration

### 4.1 Fix key mapping (normalized ↔ display)

**Current bug:** Game uses Polish keys (`ja`, `ty`) but DB has normalized keys (`first_singular`, `second_singular`)

**Solution:** Create mapping utility

```typescript
// utils/conjugation-utils.ts

const NORMALIZED_TO_INDEX = {
  first_singular: 0,
  second_singular: 1,
  third_singular: 2,
  first_plural: 3,
  second_plural: 4,
  third_plural: 5
};

export function getPersonLabel(languageCode: string, normalizedKey: string): string {
  const persons = getConjugationPersons(languageCode);
  const index = NORMALIZED_TO_INDEX[normalizedKey];
  return persons[index] || normalizedKey;
}

export function getPersonsForTense(languageCode: string, tense: VerbTense): string[] {
  const structure = getTenseStructure(languageCode, tense);
  if (structure === 'limited') {
    return getImperativePersons(languageCode);
  }
  return Object.keys(NORMALIZED_TO_INDEX);
}
```

**Files to create/modify:**
- Create `utils/conjugation-utils.ts`
- Update `components/games/modes/VerbMastery.tsx`
- Update `components/FlashcardGame.tsx` (remove hardcoded VERB_PERSONS)

**🤖 Agent Review Point:**
> Spawn agent to review VerbMastery component and FlashcardGame to identify all places using hardcoded person keys.

---

### 4.2 Update VerbMastery to read unlocked tenses

**Current state:** Only shows present/past/future in tense selector
**Target state:** Shows all tenses available for language, filtered by what's unlocked in user's vocabulary

**Changes needed:**
```typescript
// Get available tenses for this language
const languageTenses = getAvailableTenses(targetLanguage);

// Filter verbs by which have each tense unlocked
const verbsByTense = useMemo(() => {
  const result: Record<VerbTense, DictionaryEntry[]> = {};
  
  for (const tense of languageTenses) {
    result[tense] = verbs.filter(verb => {
      const conj = verb.conjugations;
      if (tense === 'present') return conj?.present;
      return conj?.[tense]?.unlockedAt; // Other tenses need unlock
    });
  }
  
  return result;
}, [verbs, languageTenses]);
```

---

### 4.3 Add word tracking to VerbMastery

**Current state:** No `updateWordScore` calls - no XP tracking
**Target state:** Track per-verb progress, award XP for verb mastery (10x across all forms)

**Changes needed:**
- Import and use `useScoreTracking` hook
- Call `updateWordScore(verbId, isCorrect)` on each answer
- Consider: Should each conjugation form be tracked separately, or the verb as a whole?

**Decision needed:** 
- Track verb as single word (simpler, current word_scores structure)
- Or track each form separately (more granular, needs schema change)

**Recommendation:** Track verb as single word for now. 10x correct on any form of that verb = mastered.

---

## Phase 5: Testing & Polish

### 5.1 Test unlock flow end-to-end
- [ ] Unlock conditional for Polish verb
- [ ] Unlock imperative for Spanish verb
- [ ] Unlock subjunctive for French verb
- [ ] Verify data appears correctly in Love Log
- [ ] Verify tense appears in Verb Mastery game

### 5.2 Test Verb Mastery game
- [ ] All languages load correct person labels
- [ ] Tense selector shows only available tenses
- [ ] Questions generate correctly for each tense type
- [ ] Gendered past tense (Slavic) displays correctly
- [ ] Imperative (limited persons) works correctly

### 5.3 Edge cases
- [ ] Language with no verb conjugation (if any)
- [ ] Verb with no conjugations at all
- [ ] Partially unlocked verb (present + past only)

---

## Implementation Order

```
Phase 2.1 → 2.2 → 3.1 → 3.2 → 3.3 → 4.1 → 4.2 → 4.3 → 5
   │         │      │                  │
   └─ Agent ─┘      └─── Agent ────────┘
     Review           Review
```

**Suggested agent reviews:**
1. **Before Phase 2:** Review unlock-tense.ts + schema-builders.ts
2. **Before Phase 3:** Review LoveLog.tsx for hardcoded tenses
3. **Before Phase 4:** Review VerbMastery.tsx + FlashcardGame.tsx for key mapping

---

## Estimated Effort

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 2 (API) | 2-3 hours | Prompts need careful crafting |
| Phase 3 (Love Log UI) | 2-3 hours | UI pattern + i18n |
| Phase 4 (Verb Mastery) | 2-3 hours | Key mapping + game logic |
| Phase 5 (Testing) | 1-2 hours | Manual testing across languages |
| **Total** | **7-11 hours** | |

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `constants/language-config.ts` | ✅ Done - tense config |
| `api/unlock-tense.ts` | Add new tense prompts |
| `utils/schema-builders.ts` | Add tense schemas |
| `utils/conjugation-utils.ts` | NEW - key mapping |
| `components/LoveLog.tsx` | Dynamic tenses, display variants |
| `components/games/modes/VerbMastery.tsx` | Language-aware, unlocked tenses |
| `components/FlashcardGame.tsx` | Remove hardcoded VERB_PERSONS |
| `locales/*/translation.json` | Add tense translations |

---

## Questions to Resolve

1. **Verb mastery tracking:** Track whole verb or individual forms?
   - **Recommendation:** Whole verb (simpler)

2. **Imperfect vs Past:** Some Romance languages distinguish these. Keep separate or merge?
   - **Recommendation:** Keep separate (they're different concepts)

3. **Reflexive verbs:** Handle as separate tense or verb property?
   - **Recommendation:** Future feature - verb property, not tense
