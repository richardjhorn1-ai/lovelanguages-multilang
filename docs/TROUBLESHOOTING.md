# Love Languages - Troubleshooting Guide

Issues encountered during MVP to production migration and their solutions.

**Last Updated:** January 29, 2026  
**Total Issues Documented:** 70+

---

## Quick Navigation

- [Environment & Configuration](#environment--configuration) (Issues 1-7)
- [AI & Gemini Integration](#ai--gemini-integration) (Issues 8-19)
- [Games & Scoring](#games--scoring) (Issues 20-33, 51-54)
- [Voice & Audio](#voice--audio) (Issues 11-13, 55-56)
- [Stripe & Payments](#stripe--payments) (Issues 44-47)
- [UI & Theming](#ui--theming) (Issues 24-27, 40-41)
- [Partner & Couple Features](#partner--couple-features) (Issues 57-59)
- [Blog & SEO](#blog--seo) (Issue 60)
- [Known Gaps & TODO](#known-gaps--todo)
- [Appendix: Checklists](#appendix-checklists)

---

## 🔥 Development Anti-Patterns (Jan 2026 Analysis)

Analysis of 225 commits over 2 weeks revealed recurring error patterns. **AVOID THESE.**

### Pattern 1: MDX Syntax Bugs at Scale (25+ fixes)

**The Problem:** AI-generated multilingual content creates invalid MDX syntax that multiplies across languages.

**Examples:**
- Unescaped `<` characters in comparisons (`<3` breaks JSX)
- Quote mismatches in translations (YAML apostrophe issues)
- Wrong component imports (`VocabTable` vs `:::table` markdown)
- `<br>` instead of `<br />` (self-closing JSX)

**Prevention:**
```bash
# Always validate MDX before committing
npm run build  # in blog folder

# Check for common issues
grep -r "<3\|<br>" blog/src/content/articles/
```

**Lesson:** One syntax pattern wrong × 18 languages = 18+ fixes. Validate early.

---

### Pattern 2: SSR vs Static Mode Confusion (10+ fixes)

**The Problem:** Astro hybrid/server mode has different requirements than static mode.

**Symptoms:**
- Pages 404 that work locally
- `getStaticPaths` errors
- Redirects not working

**Key Rules:**
```typescript
// Redirect-only pages MUST have prerender in SSR mode
export const prerender = true;
return Astro.redirect('/somewhere', 301);

// Dynamic routes fetching from DB should NOT prerender
// (no prerender = SSR at request time)
```

**Prevention:**
- Test on Vercel preview BEFORE merging to main
- Check both static pages AND dynamic routes

---

### Pattern 3: React Stale Closures in Games (8+ fixes)

**The Problem:** Timer callbacks and event handlers capture stale state.

**Symptoms:**
- Final scores incorrect when timer expires
- UI shows stale data after async operations
- "Last question stuck" bugs

**Bad Pattern:**
```typescript
// ❌ BAD - captures stale state
useEffect(() => {
  const timer = setInterval(() => {
    setScore(score + 1);  // 'score' is stale!
  }, 1000);
}, []);  // Empty deps = captures initial value
```

**Good Pattern:**
```typescript
// ✅ GOOD - use refs or functional updates
const scoreRef = useRef(score);
useEffect(() => { scoreRef.current = score }, [score]);

useEffect(() => {
  const timer = setInterval(() => {
    setScore(s => s + 1);  // Functional update
    // OR: use scoreRef.current
  }, 1000);
}, []);
```

**Files Fixed:** `FlashcardGame.tsx`, `TutorGames.tsx`, `QuickFire` components

---

### Pattern 4: i18n Race Conditions (6+ fixes)

**The Problem:** Language changes are async but code doesn't await them.

**Symptoms:**
- UI requires double-click to change language
- Content shows stale language after selection
- Hydration mismatches

**Bad Pattern:**
```typescript
// ❌ BAD - not awaited
const handleLanguageChange = (lang) => {
  i18n.changeLanguage(lang);
  updateUI();  // Runs before language actually changed!
};
```

**Good Pattern:**
```typescript
// ✅ GOOD - await the change
const handleLanguageChange = async (lang) => {
  await i18n.changeLanguage(lang);
  updateUI();  // Now safe
};
```

**Files Fixed:** `Hero.tsx`, onboarding components

---

### Pattern 5: Database Schema Drift (3 critical fixes)

**The Problem:** Code uses column names that don't match actual DB schema.

**Example (Critical Bug):**
```typescript
// ❌ Code was using:
{ success_count: prev + 1, fail_count: prev }

// ✅ But DB columns are actually:
{ correct_attempts: prev + 1, total_attempts: total + 1 }
```

**Impact:** Word practice progress was **silently failing** - no errors, just no data saved.

**Prevention:**
- Check actual schema: `supabase db dump --schema public`
- Use TypeScript types generated from DB
- Test that data actually persists (check Supabase dashboard)

---

### Pattern 6: Pushing Experimental Branches to Production

**The Problem:** Merging large experimental branches to main without testing.

**What Happened (Jan 29, 2026):**
- 10+ hour debug session branch merged to main
- Contained: Supabase migration, SSR mode, 18 languages, 50+ other changes
- Result: Multiple production issues discovered post-deploy

**Prevention Process:**
1. ✅ Deploy to Vercel preview branch first
2. ✅ Smoke test: homepage, articles, key flows
3. ✅ For big changes: explicit sign-off from Richard
4. ✅ Never merge without "ready for prod" confirmation

---

### Pattern 7: Internal Links to Non-Existent Articles

**The Problem:** AI-generated content includes internal links to article slugs that don't exist.

**Example:**
```markdown
<!-- AI wrote this link -->
[essential phrases](/learn/en/es/essential-phrases-for-couples/)

<!-- But actual slug is -->
/learn/en/es/spanish-essential-phrases-for-couples/
```

**Scale:** 4,036 broken internal links across 1,813 articles

**Solution:** `scripts/fix-internal-links.mjs` - fuzzy matches broken links to existing articles

**Prevention:**
- Validate internal links during content generation
- Use relative links or link components that verify targets

---

## ✅ Recent Refactoring Completed (Jan 2026)

### Component Splitting - DONE

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| FlashcardGame.tsx | 2,558 lines | 1,357 lines | **46%** |
| TutorGames.tsx | 1,376 lines | 827 lines | **40%** |
| Hero.tsx | 3,038 lines | 1,442 lines | **52%** |

**Extracted Components:**
- `components/games/modes/` - TypeIt, QuickFire, VerbMastery, AIChallenge, Flashcards, MultipleChoice
- `components/games/tutor-modes/` - TutorFlashcards, TutorMultipleChoice, TutorTypeIt, TutorQuickFire, TutorGameResults
- `components/hero/` - InteractiveHearts, LanguageGrid, LoginForm, Section, MobileSection, etc.

---

## Environment & Configuration

### Issue 1: Infinite Recursion in RLS Policies ✅ FIXED

**Error:**
```
Supabase error: infinite recursion detected in policy for relation "profiles"
```

**Cause:**
RLS policies that query the same table they're protecting create infinite loops.

**Solution:**
Create a `SECURITY DEFINER` function with `SET row_security = off`:

```sql
CREATE OR REPLACE FUNCTION get_linked_partner_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET row_security = off  -- Critical fix
SET search_path = public
AS $$
  SELECT linked_user_id FROM profiles WHERE id = user_uuid;
$$;
```

---

### Issue 2: Chat Mode Case Mismatch (400 Bad Request) ✅ FIXED

**Cause:** Database had uppercase mode constraint, frontend used lowercase.

**Solution:**
```sql
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_mode_check;
ALTER TABLE chats ADD CONSTRAINT chats_mode_check CHECK (mode IN ('listen', 'chat', 'tutor'));
```

---

### Issue 3: "Please log in to continue chatting" (401 Unauthorized) ✅ FIXED

**Cause:** Missing environment variables in Vercel.

**Solution:** Include both VITE-prefixed (client) and non-prefixed (server) versions:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

---

### Issue 4: Vercel Project Name Validation ✅ FIXED

**Solution:** Use lowercase with hyphens: `love-languages`

---

### Issue 5: Sensitive Environment Variables in Development ✅ FIXED

**Solution:** For sensitive keys, select only **Production** and **Preview** in Vercel. Use `.env.local` for local dev.

---

### Issue 6: Email Confirmation Blocking Signups ✅ FIXED

**Solution (dev):** Supabase Dashboard → Authentication → Providers → Email → Turn OFF "Confirm email"

---

### Issue 7: Gemini API Key Typo in Vercel ✅ FIXED

**Cause:** `GEMINI_API_KE` instead of `GEMINI_API_KEY`

**Lesson:** Always verify with `vercel env ls`

---

## AI & Gemini Integration

### Issue 8: Mode Names Migration (chat/tutor → ask/learn) ✅ FIXED

**Solution:**
```sql
UPDATE chats SET mode = 'ask' WHERE mode = 'chat';
UPDATE chats SET mode = 'learn' WHERE mode = 'tutor';
```

---

### Issue 9: AI Not Following Formatting Instructions ✅ FIXED

**Problem:** LEARN mode showed plain text tables instead of `::: table` markdown.

**Solution:** Made prompts EXTREMELY explicit with:
- Exact copy-paste patterns
- Complete example responses
- Warning: "If you write a table WITHOUT ::: markers, IT WILL NOT RENDER"

---

### Issue 10: Responses Too Verbose/Repetitive ✅ FIXED

**Solution:** Added explicit "BANNED" section in prompt.

---

### Issue 11: Voice Mode - Gemini Live API Integration ✅ FIXED

**11 debugging attempts documented.** Key lessons:

1. Native audio model ONLY supports `responseModalities: ['AUDIO']` - NOT `['AUDIO', 'TEXT']`
2. Use `outputAudioTranscription: {}` for text transcripts
3. Ephemeral tokens require `apiVersion: 'v1alpha'` on BOTH backend AND frontend
4. Model: `gemini-2.5-flash-native-audio-preview-12-2025`

---

### Issue 12: Voice Mode Speaks Polish First (Should be English-First) ✅ FIXED

**Solution:** Updated prompts to emphasize "ENGLISH FIRST" approach.

---

### Issue 13: Transcription Shows Wrong Script (Arabic/Cyrillic) ⛔ BLOCKED

**Status:** BLOCKED - Gemini Live API does NOT support language hints for `inputAudioTranscription`. Auto-detects with no way to constrain.

---

### Issue 14: Harvest API Transient 500 Error ✅ FIXED

**Solution:** Added JSON validation before parsing, returns `retryable: true` flag.

---

### Issue 15: Voice Mode - Agent Messages Not Saved on Interrupt ✅ FIXED

**Solution:** Save partial transcript before clearing on interruption.

---

### Issue 16: Harvest Not Extracting All Words ⚠️ OPEN

**Problem:** Word harvest only analyzes last 100 messages, missing older vocabulary.

**Files:** `/api/analyze-history.ts` (line 40 - 100 message limit)

**Potential Fixes:**
- Paginate through all messages
- Run incremental extraction on chat session end
- Add "force re-extract" option

---

### Issue 17: CSS Styling Leaking Into Chat Output ✅ FIXED

**Root Cause:** `parseMarkdown()` regex replacements in wrong order.

**Fix:** Process `[brackets]` FIRST, use inline styles to avoid bracket conflicts.

---

### Issue 18: Voice Mode Not Extracting Vocabulary to Love Log ✅ FIXED

**Root Cause:** Stale closure in `stopLive()` function.

**Fix:** Fetch fresh messages from database after voice session ends.

---

### Issue 19: Incomplete Verb Conjugation Data ✅ FIXED

**Solution:** All-or-nothing rule - OMIT entire tense rather than partial data.

---

## Games & Scoring

### Issue 20: Practice Level Tests - "No Theme Found" Error ✅ FIXED

**Solution:** Fixed key format in `getThemeForTransition()` function.

---

### Issue 21: Test Results Review Implementation ✅ FIXED

**Solution:** Added Previous Attempts section with expandable modal on Progress page.

---

### Issue 22: AI Challenge Mode Implementation ✅ COMPLETE

Streak-based mastery with 5 challenge modes implemented as 4th Play tab.

---

### Issue 23: Phase 4 API Refactoring Failed (Vercel Limitation) ⛔ DEFERRED

**Root Cause:** Vercel serverless functions bundle each file independently - sibling imports don't work.

**Decision:** Accepted code duplication. May revisit with build step.

---

### Issue 31: submit-challenge.ts Server/Client Validation Mismatch ✅ FIXED

**Solution:** Created `batchSmartValidate()` function for consistent validation.

---

### Issue 32: TutorGames Type It Stuck on Last Question ✅ FIXED

**Solution:** Added else clause to clear `typeItSubmitted` on last question.

---

### Issue 33: Validation Fallback Inconsistency (Diacritics) ✅ FIXED

**Solution:** Added `normalizeAnswer()` helper with diacritic normalization.

---

### Issue 42: N+1 API/Database Query Patterns ✅ FIXED

**Affected Endpoints:**
- `submit-challenge.ts` - Batch Gemini validation
- `submit-level-test.ts` - Same batch fix
- `complete-word-request.ts` - Batch word enrichment
- `get-game-history.ts` - Single aggregate query

**Cost Savings:** ~90-100% reduction in Gemini API calls.

---

### Issue 43: Gemini Schema Over-Requesting ✅ FIXED

**Solution:** Lightweight schema for tutors (coach mode), minimal schema for previews.

---

### Issue 51: Score Tracking Column Inconsistency ⚠️ OPEN

**Problem:** `FlashcardGame.updateWordScore()` uses `success_count/fail_count` columns, but `submit-challenge.ts` uses `total_attempts/correct_attempts`.

**Impact:** Word progress may not sync correctly between local games and challenges.

**Recommendation:** Consolidate to use same column names, or add migration.

---

### Issue 52: Quick Fire Timer Memory Leak Potential ⚠️ OPEN

**Problem:** `quickFireTimerRef` callback captures stale `sessionAnswers` state. Uses refs as workaround but pattern is fragile.

**Files:** `components/FlashcardGame.tsx:~570`

**Impact:** Final scores may be incorrect if timer expires during async answer processing.

---

### Issue 53: Local Games Don't Award XP 🔴 CRITICAL

**Problem:** `FlashcardGame.tsx` (2,300+ lines) contains ALL local practice modes. Searched entire file - **no call to `incrementXP`**.

**Impact:** Users can grind flashcards for hours and see NO XP growth. XP is essentially just "word count + challenge bonuses".

**Current Behavior:**
- Games save sessions via `saveGameSession()`
- Games update word scores (streaks, learned status)
- Games **NEVER** award XP

**Files:**
- `components/FlashcardGame.tsx` - Missing XP logic
- `api/increment-xp.ts` - Endpoint exists but unused by games

**Recommended Fix:**
```typescript
// After saveGameSession(), add:
await geminiService.incrementXP(correctCount);
```

---

### Issue 54: Verb Mastery Polish Hardcoding ⚠️ TODO

**Problem:** `VERB_PERSONS` array has hardcoded Polish pronouns (ja, ty, on/ona, etc.).

**Files:** `FlashcardGame.tsx:42-48`

**TODO Comment:** `// TODO: ML-12 - Refactor Verb Mastery to be language-aware using getConjugationPersons()`

**Fix:** Replace with dynamic lookup from `LANGUAGE_CONFIGS[targetLanguage].grammar.conjugationPersons`

---

## Voice & Audio

### Issue 35: Gladia API Diarization Not Supported ✅ FIXED

**Solution:** Removed diarization parameters - not supported for live streaming.

---

### Issue 36: Gladia Translations Arrive as Separate Messages ✅ FIXED

**Solution:** Implemented pending transcript system that waits for translations.

---

### Issue 55: `xp-gain` Sound is UNUSED ⚠️ OPEN

**Problem:** `xp-gain.mp3` exists in `/public/sounds/` and is defined in `services/sounds.ts` but never played.

**Recommendation:** Add `sounds.play('xp-gain')` when XP is awarded (games, challenges).

---

### Issue 56: No TTS in Games ⚠️ OPEN

**Problem:** FlashcardGame, PlayQuizChallenge, PlayQuickFireChallenge don't use TTS for pronunciation.

**Impact:** Users can't hear words during practice - learning impact.

**Recommendation:** Add speak button to flashcard word display.

---

## Stripe & Payments

### Issue 44: Stripe Webhook 307 Redirect ✅ FIXED

**Solution:** Use canonical domain with `www` in webhook URL.

---

### Issue 45: Stripe Webhook "Not Configured" Error ✅ FIXED

**Solution:** Add `STRIPE_WEBHOOK_SECRET` to Vercel production environment.

---

### Issue 46: Stripe Price ID Typos ✅ FIXED

**Solution:** Remove double `price_` prefix in environment variables.

---

### Issue 47: Stripe Webhook Handler Logic Bugs (5 Critical Fixes) ✅ FIXED

1. Added `stripe_customer_id` to checkout handler
2. Fixed inverted logic in `subscription.updated` handler
3. Fixed `current_period_end` field access path
4. Made event logging non-blocking
5. Made gift pass creation non-blocking

---

## UI & Theming

### Issue 24: Sticky Note Double Shadow Effect ✅ FIXED

**Solution:** Redesigned as "Motivation Card" with proper theming.

---

### Issue 25: Tutor Progress Page Hardcoded Colors ✅ FIXED

**Solution:** Replaced with CSS variables and dynamic accent colors.

---

### Issue 26: ConversationPractice Icon Type Error ✅ FIXED

**Solution:** Added optional `icon` field to `ConversationScenario` interface.

---

### Issue 27: Loading Dot Colors Not Using Accent Theme ✅ FIXED

**Solution:** Use `bg-[var(--accent-color)]` for all loading dots.

---

### Issue 28: Play Tab Losing State on Navigation ✅ FIXED

**Solution:** Created `PersistentTabs` component that renders all main tabs simultaneously with CSS visibility.

---

### Issue 40: LevelTest Hardcoded Colors Breaking Dark Mode ✅ FIXED

**Solution:** Replaced with CSS variables.

---

### Issue 41: Undefined CSS Variables Used in LevelTest ✅ FIXED

**Solution:** Replaced `--bg-secondary`, `--border-hover`, `--text-muted` with existing variables.

---

## Partner & Couple Features

### Issue 37: Notification Count Not Updating on Dismiss ✅ FIXED

**Solution:** Check if notification was unread before dismissing, then decrement count.

---

### Issue 38: Love Package/Word Gift Words Not Adding to Dictionary ✅ FIXED

**Solution:** Added `dictionary-updated` event dispatch for cross-component communication.

---

### Issue 39: Create Quiz Ignoring New Words Added by Tutor ✅ FIXED

**Solution:** Extract and insert `newWords` into student's dictionary.

---

### Issue 57: No Real-Time Sync Between Partners ⚠️ OPEN

**Problem:** Partner doesn't see updates without refresh. No "partner is online" indicator.

**Impact:** Medium - requires manual refresh to see new challenges/progress.

**Recommendation:** Implement Supabase Realtime subscription for `tutor_challenges` changes.

---

### Issue 58: Challenge Language Filter Missing ⚠️ OPEN

**Problem:** `get-challenges.ts` doesn't filter by `language_code`.

**Impact:** Cross-language challenge pollution possible.

**Files:** `api/get-challenges.ts`

---

### Issue 59: Delink Doesn't Clean word_requests ⚠️ OPEN

**Problem:** Pending word gifts remain after partner breakup.

**Files:** `api/delink-partner.ts`

**Recommendation:** Either delete or mark as cancelled on delink.

---

## Blog & SEO

### Issue 60: Learn Hub Native Language Selector Mismatch ✅ FIXED (Jan 29)

**Problem:** ~~Dutch (nl), Romanian (ro), and Ukrainian (uk) have blog content but are NOT in the Learn Hub's `getStaticPaths`.~~

**Fixed:** Blog now supports all 18 native languages:
```js
const supportedNativeLangs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];
```

### Issue 63: Generic Article Slugs (Supabase Migration) ✅ FIXED (Jan 29)

**Problem:** 1,952 articles had generic slugs like `greetings-and-farewells` instead of `spanish-greetings-and-farewells`.

**Solution:** `blog/scripts/phase2-migrate-content.mjs` renamed all affected slugs.

### Issue 64: Broken Internal Links in Articles ✅ FIXED (Jan 29)

**Problem:** 4,036 internal links pointed to non-existent article slugs.

**Solution:** `scripts/fix-internal-links.mjs` - fuzzy matched 3,886 to correct articles, 150 fell back to language landing pages.

---

## Onboarding Issues

### Issue 61: TryItStep Button Text Not Localized ⚠️ OPEN

**Problem:** Button text is hardcoded English.

**File:** `components/onboarding/steps/student/TryItStep.tsx:101-102`
```tsx
{hasTried ? 'Continue' : 'Skip for now'}  // Not translated!
```

**Fix:** Use `t('onboarding.student.tryIt.continue')` etc.

---

### Issue 62: PlanSelectionStep No Recovery Path for Price Loading Failures ⚠️ OPEN

**Problem:** If prices fail to load, user sees error but "Continue" button is disabled. No escape route.

**File:** `components/onboarding/steps/shared/PlanSelectionStep.tsx:49-75`

**Impact:** User stuck on payment step if API fails.

**Recommendation:** Add skip option or "Continue with Free Trial" fallback.

---

## Additional Fixes (48-50)

### Issue 48: chat-stream.ts Prompt Divergence ✅ FIXED

**Solution:** Deleted `chat-stream.ts` entirely - single endpoint, zero divergence.

---

### Issue 49: Unused Variables in analyze-history.ts ✅ FIXED

**Solution:** Removed dead code.

---

### Issue 50: Migration File Numbering Inconsistencies ✅ DOCUMENTED

**Status:** Historical artifact. Future migrations should continue from 032+.

---

## Known Gaps & TODO

### 🔴 Critical (P0)

| Issue | Description | Status |
|-------|-------------|--------|
| #53 | Local games don't award XP | OPEN |
| #16 | Harvest not extracting all words | OPEN |

### 🟡 Medium Priority (P1)

| Issue | Description | Status |
|-------|-------------|--------|
| #51 | Score tracking column inconsistency | OPEN |
| #52 | Quick Fire timer memory leak potential | OPEN |
| #54 | Verb Mastery Polish hardcoding (ML-12) | TODO |
| #55 | xp-gain sound unused | OPEN |
| #56 | No TTS in games | OPEN |
| #57 | No real-time sync between partners | OPEN |
| #60 | Learn Hub language selector mismatch | OPEN |
| #61 | TryItStep button not localized | OPEN |
| #62 | PlanSelectionStep no error recovery | OPEN |

### 🟢 Low Priority (P2)

| Issue | Description | Status |
|-------|-------------|--------|
| #58 | Challenge language filter missing | OPEN |
| #59 | Delink doesn't clean word_requests | OPEN |
| #23 | API code duplication (Vercel limitation) | DEFERRED |

### ⛔ Blocked

| Issue | Description | Blocker |
|-------|-------------|---------|
| #13 | Transcription wrong script | Gemini API limitation |

---

## Appendix: Checklists

These checklists MUST be followed. Do not skip steps.

### 🌍 Adding a New Language

When adding support for a new language (e.g., Japanese), ALL of these must happen:

**App Changes:**
- [ ] Add to `constants/language-config.ts` — LANGUAGE_CONFIGS
- [ ] Add to `SUPPORTED_LANGUAGE_CODES` array
- [ ] Add flag emoji and native name
- [ ] Add example phrases (hello, I love you, thank you)
- [ ] Create `i18n/locales/{lang}.json` with all translations
- [ ] Import locale in `i18n/index.ts`
- [ ] Test language selector shows new language

**Blog/SEO Changes (if adding as native language):**
- [ ] Add to `blog/src/components/NativeLanguageSelector.astro` — SUPPORTED_NATIVE_LANGS
- [ ] Add to `blog/src/components/Navigation.astro` — SUPPORTED_NATIVE_LANGS
- [ ] Add to `blog/src/middleware.ts` — NATIVE_LANGUAGES set
- [ ] Add to all `[nativeLang]` page getStaticPaths
- [ ] Add content to `blog/src/data/comparison-features.ts` (XX_CONTENT + CONTENT_MAP)
- [ ] Create article directories: `blog/src/content/articles/{lang}/`
- [ ] Check `vercel.json` for conflicting redirects

**Verification:**
- [ ] Test full user flow: select language → onboarding → first lesson
- [ ] Check blog renders correctly with new language
- [ ] Verify sitemap.xml includes new URLs
- [ ] Check no console errors

---

### 📝 Creating a New Blog Article

Before marking complete:

- [ ] No stray commas in frontmatter
- [ ] Date has quotes: `date: '2026-01-25'`
- [ ] readTime is a number, not string: `readTime: 8`
- [ ] No `<3` in content (use ❤️)
- [ ] All component props in quotes
- [ ] Internal links use 3-segment format: `/learn/{native}/{target}/{slug}/`
- [ ] Slug is in ENGLISH (for hreflang matching)
- [ ] MDX compiles: `npm run build` in blog folder
- [ ] Article appears in correct index/category page

---

### ✨ Adding a New Feature

Before considering complete:

**Code Changes:**
- [ ] Check if similar code exists — DON'T duplicate
- [ ] Follow existing patterns in that area
- [ ] Update TypeScript types if adding new data
- [ ] Add to relevant context providers if needed

**Related Updates (often forgotten):**
- [ ] Update related components that display this data
- [ ] Update API routes that touch this data
- [ ] Update games/features that might use this
- [ ] Check dark mode styling (use CSS variables!)
- [ ] Check mobile responsiveness
- [ ] Test on iOS (safe areas, gestures)

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] Test the actual feature end-to-end
- [ ] Check console for errors
- [ ] Test both student and tutor flows if applicable

---

## Environment Variables Reference

### Required for All Environments

```env
# Client-side
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GEMINI_API_KEY=your-key
GLADIA_API_KEY=your-key

# CORS
ALLOWED_ORIGINS=https://www.lovelanguages.io,http://localhost:3000
```

### Vercel Environment Matrix

| Variable | Prod | Preview | Dev | Sensitive |
|----------|------|---------|-----|-----------|
| VITE_* | ✅ | ✅ | ✅ | No |
| SUPABASE_URL | ✅ | ✅ | ❌ | No |
| SUPABASE_SERVICE_KEY | ✅ | ✅ | ❌ | Yes |
| GEMINI_API_KEY | ✅ | ✅ | ❌ | Yes |
| STRIPE_* | ✅ | ✅ | ❌ | Yes |

---

## Quick Debug Commands

```bash
# Check env variable names
cat .env.local | grep -E "^[A-Z]" | cut -d'=' -f1

# List Vercel environment variables
vercel env ls

# TypeScript check
npx tsc --noEmit

# Build check
npm run build

# Stripe webhook testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## Key Lessons Learned

1. **Validate JSON before parsing** - Gemini can return HTML error pages
2. **One source of truth** - Duplicate endpoints WILL diverge
3. **Batch operations** - N+1 patterns kill API costs
4. **CSS variable consistency** - Check `services/theme.ts` for defined variables
5. **Cross-component events** - Use `dictionary-updated` for shared data changes
6. **Webhook resilience** - Non-critical ops in async IIFEs
7. **Persistent tabs** - CSS visibility > React mount/unmount
8. **Diacritic normalization** - Always normalize for Polish comparisons
