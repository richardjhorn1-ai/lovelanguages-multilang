# Multi-Language Transformation - Master Plan

> **THE SINGLE SOURCE OF TRUTH** for the multi-language transformation.
> All other planning docs (IMPLEMENTATION_PLAN.md, MULTILANGUAGE_TRANSFORMATION.md, ROADMAP.md ML sections) are superseded by this document.

**Created:** January 10, 2026
**Last Updated:** January 12, 2026
**Status:** IN PROGRESS

---

## Quick Status

| Phase | Description | Status |
|-------|-------------|--------|
| ML-1 | Foundation Files | ✅ Complete |
| ML-2 | Database & Backend APIs | ✅ Complete |
| ML-3 | Type System | ✅ Complete |
| ML-4 | Frontend Components | ✅ Complete |
| ML-5 | Scenarios & Content | ✅ Complete |
| ML-6 | UI Internationalization (i18n) | ✅ Complete |
| ML-6.X | Bug Fixes (from testing) | ✅ Complete |
| ML-7 | Blog Generator System | ✅ Complete |
| ML-8 | Settings & Language Switcher | ✅ Complete |
| ML-9 | Language Switcher UI | ✅ Complete |
| ML-10 | Final Testing & Validation | ⏳ Not Started |
| ML-11 | Add Language (Premium $5.99/mo) | ⏳ Not Started |

**Current Focus:** ML-10 Final Testing & Validation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Supported Languages](#supported-languages)
3. [Phase Details - Completed](#completed-phases)
4. [Phase ML-6.X - Bug Fixes](#phase-ml-6x-bug-fixes-current)
5. [Phase ML-7 - Blog Generator](#phase-ml-7-blog-generator-system)
6. [Phase ML-8 - Settings & Switcher](#phase-ml-8-settings--language-switcher)
7. [Phase ML-9 - Premium Multi-Language](#phase-ml-9-premium-multi-language)
8. [Phase ML-10 - Testing & Validation](#phase-ml-10-testing--validation)
9. [Original Hardcoding Audit](#original-hardcoding-audit)
10. [Success Criteria](#success-criteria)

---

## Executive Summary

### What We're Building

Transform Love Languages from a **Polish-only** app into a **language-agnostic** platform supporting **18 languages** where:

- Any language can be the user's **native** language (AI explains in this)
- Any language can be the user's **target** language (what they're learning)
- This creates **306 possible language pairs** (18 × 17)

### Architecture Decision

Every API endpoint and component receives BOTH:
- `targetLanguage` - What the user is learning (e.g., 'pl')
- `nativeLanguage` - The user's mother tongue (e.g., 'es')

```typescript
// EVERY API call includes both
POST /api/chat
{
  targetLanguage: 'pl',    // Learning Polish
  nativeLanguage: 'es',    // Spanish speaker
  mode: 'learn',
  message: '...'
}
```

---

## Supported Languages (18)

| Tier | Languages |
|------|-----------|
| **Global** | English (en) |
| **Romance** | Spanish (es), French (fr), Italian (it), Portuguese (pt), Romanian (ro) |
| **Germanic** | German (de), Dutch (nl), Swedish (sv), Norwegian (no), Danish (da) |
| **Slavic** | Polish (pl), Czech (cs), Russian (ru), Ukrainian (uk) |
| **Other** | Greek (el), Hungarian (hu), Turkish (tr) |

---

## Completed Phases

### ML-1: Foundation Files ✅

**Completed:** January 10, 2026

Created core infrastructure:
- `constants/language-config.ts` - All 18 language configurations
- `utils/prompt-templates.ts` - 10 language-agnostic AI prompt builders
- `utils/schema-builders.ts` - 13 dynamic JSON schemas per language
- `utils/language-helpers.ts` - 13 API helper functions

### ML-2: Database & Backend APIs ✅

**Completed:** January 10, 2026

- Added `language_code` column to 13 tables (with 'pl' default for backward compatibility)
- Added `profiles.native_language`, `profiles.active_language`, `profiles.languages[]`
- Updated 18 API endpoints to accept language parameters:
  - chat.ts, chat-stream.ts, validate-word.ts, analyze-history.ts
  - live-token.ts, gladia-token.ts, tts.ts, process-transcript.ts
  - generate-level-test.ts, submit-level-test.ts
  - create-challenge.ts, submit-challenge.ts
  - create-word-request.ts, complete-word-request.ts
  - validate-answer.ts, unlock-tense.ts, progress-summary.ts, boot-session.ts

### ML-3: Type System ✅

**Completed:** January 10, 2026

- Refactored `types.ts` field names (polish → word, english → translation)
- Added language-specific grammar interfaces
- Created `TranslationDirection` type (target_to_native | native_to_target)
- Normalized conjugation interfaces across languages

### ML-4: Frontend Components ✅

**Completed:** January 10, 2026

- Created `LanguageContext` with `useLanguage()` hook
- Updated ChatArea.tsx, LoveLog.tsx, FlashcardGame.tsx with language params
- Updated Progress.tsx, LevelTest.tsx, challenge creators
- Updated services: audio.ts, gemini.ts, live-session.ts, gladia-session.ts

### ML-5: Scenarios & Content ✅

**Completed:** January 10, 2026

- Made conversation scenarios language-agnostic with cultural adaptations
- Created dynamic romantic phrase generation per language pair
- Updated level test examples to be language-aware
- Refactored onboarding steps (PolishConnectionStep → LanguageConnectionStep)
- Updated Hero marketing copy for any language

### ML-6: UI Internationalization ✅

**Completed:** January 11-12, 2026

This phase was **added during implementation** (not in original plan):

- Installed react-i18next
- Migrated ~800+ strings across 50+ components
- Created translations for all 18 languages
- Implemented Language Selection UX on Hero page (ML-6.11)

**Sub-tasks completed:**
- ML-6.1: react-i18next setup
- ML-6.2-6.8: Component migrations (ChatArea, Progress, FlashcardGame, LoveLog, Onboarding, Games, Hero, etc.)
- ML-6.9a-d: All 18 language translations
- ML-6.11: Language Selection UX with URL routing

---

## Phase ML-6.X: Bug Fixes ✅

**Status:** ✅ Complete
**Completed:** January 12, 2026

Testing revealed hardcoded Polish references that were fixed.

### Bugs Fixed

| ID | File | Issue | Fix |
|----|------|-------|-----|
| 6.X.0 | `Hero.tsx` | Profile defaults override localStorage | Updates profile with localStorage after sign-in |
| 6.X.1 | `ChatArea.tsx` | `.polish`/`.english` properties | Changed to `.word`/`.translation` |
| 6.X.2 | `LoveLog.tsx` | Missing language filter | Added `.eq('language_code', targetLanguage)` |
| 6.X.3 | `FlashcardGame.tsx` | Missing language filter | Added `.eq('language_code', targetLanguage)` |
| 6.X.4 | `TutorGames.tsx` | Missing languageParams | Added to all API calls + queries |
| 6.X.5 | `FlashcardGame.tsx` | Hardcoded "Polish → English" | Now uses `${targetName} → ${nativeName}` |
| 6.X.6 | `Progress.tsx` | "Expert Polish" theme | Changed to "Expert Level" |
| 6.X.7 | `ChatArea.tsx` | `polishTranscript()` function | Renamed to `processTranscript()` |
| 6.X.8 | `levels.ts` | Polish examples, "Expert Polish" | Changed to generic "Expert Level" |
| 6.X.9 | `en.json` (all locales) | Hardcoded "Kocham cię" | Now uses `{{iLoveYou}}` placeholder |
| 6.X.A | `PlanSelectionStep.tsx` | Double subscription selection | Blocks Continue until prices load |
| 6.X.B | `SubscriptionRequired.tsx` | No Stripe cancel handling | Shows friendly message on `?subscription=canceled` |

### Future Improvement: levels.ts Examples

The Polish example words in `constants/levels.ts` (like cześć, kocham cię) remain as internal reference content used for level test generation. The UI displays use i18n translations which are language-aware.

**Potential refactor:** Move level examples to `LANGUAGE_CONFIGS` to make them fully language-aware. This would allow level tests to show examples in the user's target language rather than Polish. Lower priority since tests use AI generation anyway.

### Low Severity - Deferred

| ID | File | Issue |
|----|------|-------|
| 6.X.12 | `api/tts.ts` | Should use `extractLanguages()` helper |
| 6.X.13 | 4 API files | Missing language-helpers imports |
| 6.X.14 | 17 locale files | Missing some keys from en.json |

These are minor consistency issues that don't affect functionality.

---

## Phase ML-7: Blog Generator System

**Status:** ✅ Complete
**Priority:** Medium

> **Note:** On January 12, 2026, the complete blog system was imported from the original repo via cherry-pick. This includes:
> - 74 SEO-optimized Polish learning articles
> - Astro static site at `/learn`
> - Article generator with Claude API
> - Name Day Finder tool (70+ names)
> - Polish Dictionary (109 words)
> - Comparison landing pages (vs Duolingo, vs Babbel)
>
> The blog infrastructure is complete but Polish-only. This phase makes it multi-language.

### Files to Modify

| File | Changes |
|------|---------|
| `utils/article-generator.ts` | Add language params, use prompt templates |
| `scripts/generate-article.ts` | Add `--language` CLI flag |
| `api/admin/generate-article.ts` | Accept language in request |
| `components/blog/MDXComponents.tsx` | `VocabCard`: `polish` → `word`, CultureTip: add `flag` prop |
| `content/articles.ts` | Add `language` field to ArticleMeta |
| `blog/src/content/config.ts` | Add `language` to schema |

### Key Changes

**article-generator.ts:**
```typescript
// Before
const SYSTEM_PROMPT = `You are an expert Polish language educator...`;

// After
import { buildBlogArticlePrompt } from './prompt-templates';

export interface GenerationOptions {
  topic: string;
  targetLanguage?: string;  // NEW
  nativeLanguage?: string;  // NEW
}

const systemPrompt = buildBlogArticlePrompt(targetLanguage, nativeLanguage);
```

**MDXComponents.tsx VocabCard:**
```typescript
// Before
export const VocabCard: React.FC<{
  polish: string;
  english: string;
}> = ({ polish, english }) => ...

// After (with backward compatibility)
export const VocabCard: React.FC<{
  word: string;
  translation: string;
  polish?: string;   // Deprecated
  english?: string;  // Deprecated
}> = ({ word, translation, polish, english }) => {
  const displayWord = word || polish || '';
  const displayTranslation = translation || english || '';
  ...
};
```

### ML-7 Verification Checklist

- [ ] Article generator accepts language parameters
- [ ] CLI tool has `--language` flag
- [ ] Generated articles include language in frontmatter
- [ ] VocabCard works with both old and new props
- [ ] CultureTip accepts custom flag emoji
- [ ] Existing Polish articles still display correctly
- [ ] New language articles can be generated

---

## Phase ML-8: Settings & Language Switcher

**Status:** ✅ Complete
**Priority:** Medium

### Features Implemented

1. **LanguagesSection.tsx** - Integrated into ProfileView
   - Shows native language (read-only display)
   - Lists unlocked target languages with word counts
   - Switch button for inactive languages
   - Add Language button (placeholder for ML-11)

2. **api/switch-language.ts** - Backend endpoint
   - Validates language is in user's `languages[]` array
   - Updates `active_language` in database

### Files Created/Modified

| File | Status |
|------|--------|
| `components/LanguagesSection.tsx` | ✅ Created |
| `components/ProfileView.tsx` | ✅ Integrated LanguagesSection |
| `api/switch-language.ts` | ✅ Created |

---

## Phase ML-9: Language Switcher UI

**Status:** ✅ Complete
**Priority:** Medium

### Features Implemented

1. **LanguagesSection.tsx** - Full language management in Profile tab
   - Shows native language (read-only)
   - Lists all unlocked target languages with word counts
   - "Active" badge shows current learning language
   - "Switch Language" button for inactive languages
   - "Add Language" button (placeholder - see ML-11)

2. **api/switch-language.ts** - Serverless endpoint
   - Validates language is in user's `profile.languages[]`
   - Updates `profiles.active_language` in database
   - Security: Prevents switching to unapproved languages

3. **Event-based UI Updates** (LS-1)
   - `language-switched` event dispatched on switch
   - LoveLog, FlashcardGame, Progress listen and refresh immediately

---

## Phase ML-10: Testing & Validation

**Status:** ⏳ Not Started
**Priority:** High (final phase)

### Representative Test Pairs

| Pair | Why Important |
|------|---------------|
| en → pl | Original, must work perfectly |
| es → pl | Different native language |
| en → es | Different target language |
| es → fr | No English involved |
| en → ru | Cyrillic script |
| en → el | Greek script |

### Test Checklist

For EACH test pair, verify:

- [ ] Onboarding flow completes
- [ ] Chat mode works (Ask & Learn)
- [ ] AI responds in native language
- [ ] Vocabulary extraction works
- [ ] Love Log shows correct words
- [ ] Games filter by language
- [ ] Voice mode works
- [ ] Listen mode works
- [ ] Level tests generate correctly
- [ ] Progress tracking is per-language
- [ ] Partner features work

---

## Phase ML-11: Add Language (Premium Feature)

**Status:** ⏳ Not Started
**Priority:** Medium
**Price:** $5.99/language/month

### Feature Overview

Allow users to learn additional languages beyond their initial choice for $5.99/month per language. This is **solo learning** - their partner is not included in the new language.

### User Flow

```
1. Profile → Languages Section → "Add Language" button
2. Modal opens with available languages (excludes native + already unlocked)
3. User selects a language (e.g., Spanish)
4. Info displayed: "This is solo learning - your partner won't be included"
5. Stripe Checkout → $5.99/month recurring subscription
6. On success → language added to profile.languages[]
7. User can now switch to Spanish and start learning
```

### Modal Design

```
┌─────────────────────────────────────────────────┐
│  🌍 Add a New Language                          │
│                                                 │
│  Learn another language for $5.99/month         │
│                                                 │
│  ⚠️ Note: This is solo learning.               │
│  Your partner won't be included in this         │
│  language - it's just for you!                  │
│                                                 │
│  [🇪🇸 Spanish]  [🇫🇷 French]  [🇩🇪 German]     │
│  [🇮🇹 Italian]  [🇵🇹 Portuguese] ...           │
│                                                 │
│  [Cancel]              [Continue - $5.99/mo]    │
└─────────────────────────────────────────────────┘
```

### Files to Create/Modify

| File | Type | Purpose |
|------|------|---------|
| `components/AddLanguageModal.tsx` | NEW | Language picker with solo learning notice |
| `api/create-language-checkout.ts` | NEW | Creates Stripe checkout with language in metadata |
| `api/webhooks/stripe.ts` | MODIFY | Handle `checkout.session.completed` for language add-on |
| `api/webhooks/stripe.ts` | MODIFY | Handle `customer.subscription.deleted` to remove language |
| `components/LanguagesSection.tsx` | MODIFY | Wire up modal to "Add Language" button |

### Stripe Setup Required

1. Create product in Stripe: "Additional Language"
2. Create price: $5.99/month recurring
3. Add environment variable: `STRIPE_PRICE_LANGUAGE_ADDON`

### Webhook Handling

**On `checkout.session.completed`:**
```typescript
// Extract language from metadata
const languageCode = session.metadata?.language_code;
if (languageCode && session.metadata?.type === 'language_addon') {
  // Add to user's languages array
  await supabase.rpc('array_append_unique', {
    table_name: 'profiles',
    column_name: 'languages',
    row_id: userId,
    new_value: languageCode
  });
}
```

**On `customer.subscription.deleted`:**
```typescript
// Check if this was a language addon subscription
const languageCode = subscription.metadata?.language_code;
if (languageCode) {
  // Remove from user's languages array (but keep their vocabulary)
  await supabase.rpc('array_remove', {
    table_name: 'profiles',
    column_name: 'languages',
    row_id: userId,
    value_to_remove: languageCode
  });

  // If this was their active language, switch to first available
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_language, languages')
    .eq('id', userId)
    .single();

  if (profile?.active_language === languageCode) {
    await supabase
      .from('profiles')
      .update({ active_language: profile.languages[0] })
      .eq('id', userId);
  }
}
```

### Key Behaviors

| Scenario | Behavior |
|----------|----------|
| User cancels subscription | Language removed from array, vocabulary preserved |
| User re-subscribes later | Language re-added, all previous vocabulary accessible |
| Partner tries to access | Partner only sees original shared language |
| User switches to new lang | All data already partitioned by `language_code` |

### Database Notes

No schema changes needed:
- `profiles.languages` TEXT[] already supports multiple languages
- `profiles.active_language` already tracks current language
- Trigger `ensure_active_in_languages` keeps data consistent
- All data tables have `language_code` column

### Verification Checklist

- [ ] Modal shows only available languages (not native, not already unlocked)
- [ ] Solo learning warning displayed clearly
- [ ] Stripe checkout creates subscription with language metadata
- [ ] Webhook adds language to array on success
- [ ] User can switch to new language immediately
- [ ] Webhook removes language on cancellation
- [ ] Vocabulary preserved after cancellation
- [ ] Active language switches if cancelled language was active

---

## Original Hardcoding Audit

This audit was created at project start. Items are marked as fixed or still pending.

### API Endpoints

| File | Status | Issue |
|------|--------|-------|
| `api/chat.ts` | ✅ Fixed | System prompt mentions Polish |
| `api/chat-stream.ts` | ✅ Fixed | Same |
| `api/live-token.ts` | ✅ Fixed | Voice instructions mention Polish |
| `api/gladia-token.ts` | ✅ Fixed | `source_language: 'polish'` |
| `api/polish-transcript.ts` | ✅ Fixed | Renamed to `process-transcript.ts` |
| `api/validate-word.ts` | ✅ Fixed | Validation prompt |
| `api/validate-answer.ts` | ✅ Fixed | Diacritic handling |
| `api/analyze-history.ts` | ✅ Fixed | Vocabulary extraction |
| `api/generate-level-test.ts` | ✅ Fixed | Test generation |
| `api/tts.ts` | ⚠️ Minor | Should use extractLanguages() |

### Frontend Components

| File | Status | Issue |
|------|--------|-------|
| `ChatArea.tsx` | ✅ Fixed | Added `normalizeTranscriptEntries()` for backward compat |
| `LoveLog.tsx` | ✅ Fixed | Language filter + `language-switched` listener |
| `FlashcardGame.tsx` | ✅ Fixed | Language filter + `language-switched` listener |
| `Progress.tsx` | ✅ Fixed | Language filter + `language-switched` listener |
| `Hero.tsx` | ✅ Fixed | Marketing copy |
| `ConversationPractice.tsx` | ✅ Fixed | Scenarios |

### Constants

| File | Status | Issue |
|------|--------|-------|
| `conversation-scenarios.ts` | ✅ Fixed | Universal scenarios |
| `romantic-phrases.ts` | ✅ Fixed | Dynamic generation |
| `levels.ts` | 🔴 Bug | Polish examples, "Expert Polish" |
| `language-config.ts` | ✅ Fixed | Source of truth |

### Types

| Location | Status | Issue |
|----------|--------|-------|
| `RomanticPhrase` interface | ✅ Fixed | `word`/`translation` |
| `OnboardingData` interface | ✅ Fixed | Generic fields |
| `TypeItDirection` type | ✅ Fixed | `target_to_native` |

### Blog Generator

| File | Status | Issue |
|------|--------|-------|
| `utils/article-generator.ts` | ⏳ ML-7 | Polish system prompt |
| `components/blog/MDXComponents.tsx` | ⏳ ML-7 | VocabCard `polish` prop |
| `content/articles.ts` | ⏳ ML-7 | No language field |
| 24 MDX articles | ⏳ ML-7 | Polish-only content |

---

## Success Criteria

### Phase Completion

Each phase is complete when:

1. ✅ All files in phase are modified/created
2. ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
3. ✅ App builds successfully (`npm run build`)
4. ✅ Phase verification checklist passes
5. ✅ No regressions in existing functionality

### Final Transformation Complete When

| Criterion | Verification |
|-----------|--------------|
| All 18 languages selectable | Test onboarding |
| Any native → target pair works | Test 6 pairs |
| AI explains in native language | Verify chat |
| Translations in native language | Check vocab cards |
| All features work for any pair | Full test matrix |
| Existing Polish users unaffected | Test existing accounts |
| Blog generator multi-language | Generate Spanish article |
| Premium multi-language works | Test language purchase |
| Per-language progress tracked | Check Progress page |

---

## Rollback Procedures

### Database Rollback

```sql
-- Remove language columns if needed
ALTER TABLE dictionary DROP COLUMN IF EXISTS language_code;
ALTER TABLE word_scores DROP COLUMN IF EXISTS language_code;
-- etc.
```

### Code Rollback

```bash
# Revert to last working commit
git revert HEAD~[number]

# Or reset to specific commit
git reset --hard [commit-hash]
```

---

## Archived Documents

The following documents are superseded by this file:

- `IMPLEMENTATION_PLAN.md` → Archive to `docs/archived/`
- `MULTILANGUAGE_TRANSFORMATION.md` → Archive to `docs/archived/`
- `ROADMAP.md` ML sections → Keep non-ML content, remove ML phases
- `CLEANUP_PLAN.md` → Delete (merged into ML-6.X)
- `TASK.md` → Delete (was ML-6.11 specific)

---

## Changelog

| Date | Change |
|------|--------|
| Jan 10, 2026 | Created IMPLEMENTATION_PLAN.md with 16 phases |
| Jan 10, 2026 | Completed ML-1 through ML-5 |
| Jan 11, 2026 | Added ML-6 (i18n) - not in original plan |
| Jan 12, 2026 | Completed ML-6.11 Language Selection UX |
| Jan 12, 2026 | Created this unified document |
| Jan 12, 2026 | Identified ML-6.X bugs from testing |
| Jan 12, 2026 | Imported blog system from original repo (74 articles, Name Day Finder, Dictionary) |
| Jan 12, 2026 | Imported security fixes (XSS prevention, API hardening) |
| Jan 12, 2026 | DB-1: Added language integrity constraints (CHECK constraints, trigger) |
| Jan 12, 2026 | DB-2: Fixed Listen Mode schema (polish/english → target/native) |
| Jan 12, 2026 | LS-1: Added language-switched event listeners to components |
| Jan 12, 2026 | Marked ML-7, ML-8, ML-9 as complete |
| Jan 12, 2026 | Added ML-11: Add Language premium feature ($5.99/mo) |

---

*This document is the single source of truth for the multi-language transformation.*
*Last updated: January 12, 2026*
