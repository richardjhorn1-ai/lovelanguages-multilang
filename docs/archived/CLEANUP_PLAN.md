# Code Cleanup Plan

This document outlines redundant code that should be consolidated to reduce maintenance burden and ensure consistency.

---

## CL-1: Consolidate Validation Logic

**Status:** SKIPPED (risky - API files work correctly, consolidation would add risk for minimal benefit)
**Priority:** High
**Estimated Savings:** ~180 lines removed

### Problem
Validation logic is duplicated across 4 files:
- `services/validation.ts` (shared module - 100 lines)
- `api/submit-level-test.ts` (copy - 90 lines)
- `api/submit-challenge.ts` (copy - 90 lines)
- `api/validate-answer.ts` (partial copy - 40 lines)

### Solution
API files CAN import from `../services/` and `../utils/` - this is already done for other modules. The duplication was likely from early development.

**Steps:**
1. Verify `services/validation.ts` has all needed exports:
   - `ValidationResult` interface
   - `AnswerToValidate` interface
   - `fastMatch()` function
   - `batchSmartValidate()` function

2. Update `api/submit-challenge.ts`:
   ```typescript
   import { ValidationResult, AnswerToValidate, fastMatch, batchSmartValidate } from '../services/validation.js';
   ```
   - Remove local copies of interfaces and functions
   - Note: API version uses `buildAnswerValidationPrompt()` - may need to pass language params

3. Update `api/submit-level-test.ts`:
   - Same pattern as above

4. Update `api/validate-answer.ts`:
   - Import `fastMatch` from services
   - Remove local copy

### Considerations
- The API versions of `batchSmartValidate` take `targetLanguage` and `nativeLanguage` params and use `buildAnswerValidationPrompt()`
- The `services/validation.ts` version has a hardcoded prompt
- **Decision needed:** Either:
  - A) Update `services/validation.ts` to accept language params (preferred)
  - B) Keep API-specific versions but share interfaces and `fastMatch`

---

## CL-2: Consolidate LEVEL_THEMES

**Status:** COMPLETED
**Priority:** Medium
**Estimated Savings:** ~90 lines removed

### Problem
`LEVEL_THEMES` is defined in two places:
- `constants/levels.ts` - Full version with `examples` array (Polish phrases)
- `api/generate-level-test.ts` - Partial version without `examples`

### Solution
Keep single source of truth in `constants/levels.ts`, import in API.

**Steps:**
1. Update `constants/levels.ts`:
   - Remove Polish `examples` arrays (they're not used by the API)
   - Or keep them but mark as optional/deprecated

2. Update `api/generate-level-test.ts`:
   ```typescript
   import { LEVEL_THEMES, LevelTheme, getThemeForTransition } from '../constants/levels.js';
   ```
   - Remove local `LEVEL_THEMES` definition (~90 lines)
   - Remove local `getThemeForTransition` function

3. Verify the imported version works correctly

---

## CL-3: Consolidate LevelTheme Interface

**Status:** COMPLETED
**Priority:** Medium
**Estimated Savings:** ~15 lines removed

### Problem
`LevelTheme` interface defined in 3 places:
- `constants/levels.ts`
- `utils/prompt-templates.ts`
- `api/generate-level-test.ts` (imports from prompt-templates)

### Solution
Single definition in `constants/levels.ts`, export and import elsewhere.

**Steps:**
1. Keep `LevelTheme` in `constants/levels.ts` (canonical location)

2. Update `utils/prompt-templates.ts`:
   ```typescript
   import type { LevelTheme } from '../constants/levels.js';
   export type { LevelTheme }; // Re-export for convenience
   ```

3. Update `api/generate-level-test.ts`:
   - Already imports from prompt-templates, just remove if using constants directly

---

## CL-4: Remove Legacy Polish Audio Wrappers

**Status:** COMPLETED
**Priority:** Low
**Estimated Savings:** ~30 lines removed

### Problem
`services/audio.ts` has legacy Polish-specific wrappers that are no longer needed:
```typescript
speakPolish(text) → speak(text, 'pl')
getPolishVoices() → getVoicesForLanguage('pl')
fallbackSpeakPolish(text) → fallbackSpeak(text, 'pl')
```

### Solution
Remove these wrappers after confirming no usage.

**Steps:**
1. Search for usages:
   ```bash
   grep -r "speakPolish\|getPolishVoices\|fallbackSpeakPolish" --include="*.ts" --include="*.tsx"
   ```

2. If any usages found, update them to use generic functions:
   - `speakPolish(word)` → `speak(word, targetLanguage)`
   - Already done in `LoveLog.tsx`

3. Remove from `services/audio.ts`:
   - `getPolishVoices()` function
   - `fallbackSpeakPolish()` function
   - `speakPolish()` function

4. Update exports

---

## CL-5: Remove Unused quickPhrases

**Status:** COMPLETED
**Priority:** Low
**Estimated Savings:** ~30 lines removed

### Problem
`FlashcardGame.tsx` has a `quickPhrases` useMemo that computes data but is never used in the render.

### Solution
Either remove it or connect it to the UI if intended.

**Steps:**
1. Search for usage: `quickPhrases.` or `quickPhrases[`
2. If unused, remove the entire useMemo block (~30 lines)
3. If intended for tutor dashboard, create a TODO for connecting it

---

## CL-6: Clean Up services/validation.ts

**Status:** COMPLETED
**Priority:** Medium
**Estimated Savings:** Improved maintainability

### Problem
After CL-1, `services/validation.ts` needs to be updated to be language-aware.

### Solution
Update to accept language parameters like the API versions.

**Steps:**
1. Update `batchSmartValidate` signature:
   ```typescript
   export async function batchSmartValidate(
     answers: AnswerToValidate[],
     targetLanguage: string,
     nativeLanguage: string,
     apiKey?: string
   ): Promise<ValidationResult[]>
   ```

2. Import and use `buildAnswerValidationPrompt` from prompt-templates

3. Remove hardcoded English prompt

---

## Summary

| Task | Priority | Lines Saved | Status |
|------|----------|-------------|--------|
| CL-1 | High | ~180 | SKIPPED (risky) |
| CL-2 | Medium | ~90 | COMPLETED |
| CL-3 | Medium | ~15 | COMPLETED |
| CL-4 | Low | ~30 | COMPLETED |
| CL-5 | Low | ~30 | COMPLETED |
| CL-6 | Medium | - | COMPLETED |

**Actual savings:** ~165 lines removed (CL-2, CL-3, CL-4, CL-5)

---

## Execution Order

Recommended order to minimize conflicts:

1. **CL-3** (LevelTheme interface) - Foundation for CL-2
2. **CL-2** (LEVEL_THEMES) - Uses consolidated interface
3. **CL-6** (Update services/validation.ts) - Foundation for CL-1
4. **CL-1** (Validation consolidation) - Uses updated service
5. **CL-4** (Legacy audio) - Independent
6. **CL-5** (quickPhrases) - Independent

---

## Notes

- Always run `npx tsc --noEmit` after each change
- Test affected features manually:
  - Level tests (CL-1, CL-2, CL-3)
  - Challenge submission (CL-1)
  - Answer validation (CL-1)
  - TTS playback (CL-4)
  - Play section games (CL-5)
