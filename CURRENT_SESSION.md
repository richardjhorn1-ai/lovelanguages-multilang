# Current Session Context

**Purpose:** Preserve conversation context through auto-compaction. Delete when session complete.

**Last Updated:** 2025-01-24

---

## Session Goal

Meta-analysis and cleanup of the Love Languages codebase to make it "bulletproof" for AI agents and achieve enterprise-level quality. The codebase has grown organically and agents keep making the same mistakes because knowledge isn't captured properly.

---

## Prioritized TODO - Enterprise Quality Roadmap

### Tier 1A: Document What EXISTS Today (COMPLETED)

| # | Task | Why Critical | Status |
|---|------|--------------|--------|
| 1.1 | Update CLAUDE.md with "Agent Guidelines" section | Stops agents repeating mistakes | ✅ Done |
| 1.2 | Document shared utilities (USE, DON'T COPY) | Prevents code duplication | ✅ Done |
| 1.3 | Document language defaults location | Stops hardcoded `\|\| 'pl'` | ✅ Done |
| 1.4 | Document event system matrix | Clarifies component communication | ✅ Done |
| 1.5 | Add "Common Mistakes" section | Explicit anti-patterns | ✅ Done |
| 1.6 | Document localStorage keys | Prevents key conflicts | ✅ Done |
| 1.7 | Document PersistentTabs pattern | Explains why tabs stay mounted | ✅ Done |
| 1.8 | Document monster components with risk levels | Prevents careless changes | ✅ Done |

### Tier 1B: Create Missing Infrastructure (COMPLETED)

| # | Task | Why Critical | Status |
|---|------|--------------|--------|
| 1B.1 | Create `utils/answer-helpers.ts` | Shared answer validation | ✅ Done |
| 1B.2 | ~~Create `constants/defaults.ts`~~ | ~~Single source for defaults~~ | ❌ Wrong approach - deleted |

**Correction:** Hardcoded defaults are the problem, not the solution. The fix is to:
- Remove all `|| 'pl'` and `|| 'en'` fallbacks
- APIs: Require language params, return 400 if missing
- Frontend: Use LanguageContext (prompts user to select if needed)

### Tier 1C: Document New Infrastructure (COMPLETED)

| # | Task | Why Critical | Status |
|---|------|--------------|--------|
| 1C.1 | Update CLAUDE.md with `answer-helpers.ts` docs | Agents know to use it | ✅ Done |
| 1C.2 | Update CLAUDE.md with "NO SILENT FALLBACKS" rule | Agents stop adding `\|\| 'pl'` | ✅ Done |

### Tier 2: Code Consolidation (COMPLETED)

| # | Task | Files Affected | Status |
|---|------|----------------|--------|
| 2.1 | ~~Create `utils/answer-helpers.ts`~~ | ~~New file~~ | ✅ Done (Tier 1B) |
| 2.2 | Replace duplicate `normalizeAnswer()` with import | FlashcardGame, TutorGames, PlayQuickFireChallenge, PlayQuizChallenge | ✅ Done |
| 2.3 | Replace duplicate `validateAnswerSmart()` with import | Same 4 files | ✅ Done |
| 2.4 | Replace manual `\|\| 'en'` fallbacks with `getProfileLanguages()` | 6 API files | ✅ Done |

**Tier 2 Summary:**
- 4 game components now import from `utils/answer-helpers.ts`
- 6 API files now use `getProfileLanguages()` instead of manual fallbacks
- `api/submit-level-test.ts` intentionally kept - uses test record's language settings, not profile

**Files updated:**
- `components/FlashcardGame.tsx` - removed ~50 lines of duplicate code
- `components/TutorGames.tsx` - removed ~45 lines
- `components/PlayQuizChallenge.tsx` - removed ~40 lines
- `components/PlayQuickFireChallenge.tsx` - removed ~40 lines
- `api/progress-summary.ts` - uses `getProfileLanguages()` + `createServiceClient()`
- `api/boot-session.ts` - uses `getProfileLanguages()` + `createServiceClient()`
- `api/create-challenge.ts` - uses `getProfileLanguages()`
- `api/submit-challenge.ts` - uses `getProfileLanguages()`
- `api/complete-word-request.ts` - uses `getProfileLanguages()` + `createServiceClient()`
- `api/create-word-request.ts` - uses `getProfileLanguages()` + `createServiceClient()`

### Tier 3: Component Simplification (COMPLETED)

| # | Task | Lines Saved | Risk | Status |
|---|------|-------------|------|--------|
| 3.1 | Extract `InteractiveHearts` from Hero.tsx | ~414 | Low | ✅ Done |
| 3.2 | Extract `WordParticleEffect` from Hero.tsx | ~537 | Low | ✅ Done |
| 3.3 | Extract `Section` from Hero.tsx | ~88 | Low | ✅ Done |
| 3.4 | Extract `MobileSection` from Hero.tsx | ~87 | Low | ✅ Done |
| 3.5 | Extract `LanguageGrid` from Hero.tsx | ~158 | Low | ✅ Done |
| 3.6 | Extract `LoginForm` from Hero.tsx | ~207 | Medium | ✅ Done |
| 3.7 | Extract `LanguageIndicator` from Hero.tsx | ~46 | Low | ✅ Done |
| 3.8 | Create shared `heroConstants.ts` | ~21 | Low | ✅ Done |
| 3.9 | Create shared `heroHighlighting.tsx` | ~93 | Low | ✅ Done |
| 3.10 | Create `hero/index.ts` barrel export | ~19 | Low | ✅ Done |

**Tier 3 Summary:**
- Hero.tsx reduced from **3038 lines to 1442 lines** (52% reduction)
- Created 10 new files in `components/hero/`:
  - `heroConstants.ts` - BRAND colors, types (HeroRole, SelectionStep), POPULAR_LANGUAGES
  - `heroHighlighting.tsx` - Highlight component and renderWithHighlights utility
  - `InteractiveHearts.tsx` - Canvas-based floating hearts with physics
  - `WordParticleEffect.tsx` - Word-to-heart particle animation
  - `Section.tsx` - Desktop marketing section + LOGO_PATH constant
  - `MobileSection.tsx` - Mobile carousel card component
  - `LanguageGrid.tsx` - Language selector with popular/all toggle
  - `LoginForm.tsx` - Auth form with OAuth support
  - `LanguageIndicator.tsx` - Current language display with change button
  - `index.ts` - Barrel export for clean imports
- Hero.tsx now only contains: ANIMATION_STYLES, section content data, and the main Hero component
- TypeScript compiles cleanly

### Tier 4: Code Cleanup (COMPLETED)

| # | Task | Status |
|---|------|--------|
| 4.1 | Remove dead `level-changed` event listener | ✅ Done |
| 4.2 | Fix localStorage key inconsistency (`preferredLanguage` → `preferredNativeLanguage`) | ✅ Done |
| 4.3 | Remove debug console.log statements from components | ✅ Done |

**Tier 4 Summary:**
- Removed dead `level-changed` event listener from ChatArea.tsx
- Fixed localStorage key: `preferredLanguage` → `preferredNativeLanguage` with backward compatibility
- Removed 23 debug console.log statements from 6 component files:
  - `ChatArea.tsx` - 12 debug logs removed
  - `JoinInvite.tsx` - 6 debug logs removed
  - `LoveLog.tsx` - 2 debug logs removed
  - `InviteLinkCard.tsx` - 2 debug logs removed
  - `FlashcardGame.tsx` - 1 debug log removed
  - `Progress.tsx` - 1 debug log removed
- Kept all console.error statements for actual error handling
- Kept all console.log in api/, services/, scripts/ (operational logging with prefixes)

### Tier 5: Future Refactoring (After Stabilization)

| # | Task | Complexity | Status |
|---|------|------------|--------|
| 5.1 | Split FlashcardGame.tsx by game mode | High | Not Started |
| 5.2 | Split ChatArea.tsx (extract message renderers) | Medium | Not Started |
| 5.3 | Reduce useState count in FlashcardGame (56 → ?) | High | Not Started |

---

---

## Key Findings from Deep Analysis

### 1. Duplicate Code (PARTIALLY FIXED)

These functions are copy-pasted across 4 files instead of shared:

| Function | Files |
|----------|-------|
| `normalizeAnswer()` | FlashcardGame, TutorGames, PlayQuickFireChallenge, PlayQuizChallenge |
| `validateAnswerSmart()` | FlashcardGame, TutorGames, PlayQuickFireChallenge |

**Solution:** ✅ Created `utils/answer-helpers.ts`. Pending: migrate the 4 files to import from there (Tier 2.2-2.3).

### 2. Scattered Manual Fallbacks (MUST FIX)

**Infrastructure exists:** `utils/language-helpers.ts` provides:
- `getProfileLanguages(supabase, userId)` - fetches from profiles table
- `extractLanguages(body)` - extracts from request body
- Centralized `DEFAULT_LANGUAGES` fallback for backward compatibility

**Problem:** 7 API files bypass this with manual `|| 'en'` fallbacks.

**Solution:** Replace manual fallbacks with `getProfileLanguages()` calls. See Tier 2.4 for specific files.

### 3. localStorage Key Inconsistency

- Target: `preferredTargetLanguage` ✓ Clear
- Native: `preferredLanguage` ✗ Ambiguous (should be `preferredNativeLanguage`)

### 4. Dead Code

`level-changed` event is listened to in ChatArea.tsx but **never dispatched anywhere**.

### 5. Monster Components (State Explosion)

| Component | useState calls | Lines | Notes |
|-----------|---------------|-------|-------|
| FlashcardGame.tsx | 56 | 2,373 | |
| ChatArea.tsx | 36 | 1,892 | |
| TutorGames.tsx | 32 | 1,398 | |
| Hero.tsx | 20 | ~~3,038~~ **1,442** | ✅ Tier 3 - Reduced 52% |

### 6. Language Switching Feature

User clarified: Language switching is **not yet implemented** - only planned with UI components. So missing event listeners are not bugs, just incomplete work.

---

## Branch Cleanup (COMPLETED)

- ✅ Deleted `elevenlabs-voice-migration` (agent lied about Gemini language support)
- ✅ Deleted `feature/capacitor-ios` (weekly subscriptions already in main)
- ✅ Deleted `feature/font-consistency` (merged)
- ✅ Deleted all other stale branches
- ✅ Origin now only has `main`

---

## Uncommitted Changes (PENDING)

| Category | Count | Status |
|----------|-------|--------|
| Blog articles (MDX) | 868 | Ready to commit |
| Blog images (JPG) | 48 | Ready to commit |
| Promo video | 22 files | Ready to commit |
| `api/tts-elevenlabs.ts` | 1 | Ready to commit (standalone TTS endpoint) |
| `CONTENT_PLAN.md` | 1 | Ready to commit |

---

## Documentation Gap Analysis

**Existing docs are good but missing:**

1. **"USE, DON'T COPY"** warnings for shared functions
2. **Central defaults location** documentation
3. **Complete event matrix** (who dispatches/listens what)
4. **"DON'T DO"** section for common agent mistakes

---

## Current Action

**Tiers 1, 2, 3 & 4 COMPLETE.**

**Tier 1 - Documentation:**
- Created `utils/answer-helpers.ts` - Shared validation functions
- Updated CLAUDE.md with comprehensive Agent Guidelines

**Tier 2 - Code Consolidation:**
- Migrated 4 game files to use `answer-helpers.ts` (~175 lines of duplicate code removed)
- Fixed 6 API files to use `getProfileLanguages()` instead of manual fallbacks
- Standardized supabase client creation with `createServiceClient()`

**Tier 3 - Component Simplification:**
- Extracted 7 components from Hero.tsx to `components/hero/`
- Created shared utilities (heroConstants, heroHighlighting)
- Hero.tsx reduced from 3038 → 1442 lines (52% reduction)

**Tier 4 - Code Cleanup:**
- Removed dead event listener
- Fixed localStorage key naming with backward compatibility
- Removed 23 debug console.log statements from components

**Next:** Tier 5 - Future Refactoring (optional, high complexity)

---

## User Preferences Noted

- Don't delete/change code without explicit approval
- Check thoroughly before claiming something exists/doesn't exist
- User can't test all 18 languages personally
- Blog 404 issues being handled in separate chat
