## Current Sprint - Post-Blog Overhaul

**Last Updated:** February 1, 2026

### ✅ Completed (Feb 1)

#### 7-Day Free Trial 🎁
- [x] New users get 7-day trial on signup (replaces permanent free tier)
- [x] Trial expired paywall with subscription options
- [x] Trial reminder notifications at 5, 3, 1, 0 days remaining
- [x] Back button fix on pricing page (no Stripe redirect loop)
- [x] Partner access cascade when primary subscription canceled
- [x] Migration: `035_free_trial.sql`

**Docs:** `docs/FREE_TRIAL_IMPLEMENTATION.md`, `docs/FREE_TRIAL_FIXES.md`

---

### ✅ Completed (Jan 29)

#### Blog Infrastructure Overhaul
- [x] Migrate 5,147 articles from MDX to Supabase
- [x] Switch to SSR mode (Astro server output)
- [x] Add 6 new languages (sv, no, da, cs, el, hu)
- [x] Full i18n for UI in all 18 native languages
- [x] Fix 1,952 generic slugs → language-prefixed slugs
- [x] Fix 4,036 broken internal links
- [x] Fix compare page redirects (prerender=true)
- [x] Add edge cache headers (s-maxage=1d)
- [x] Reduce DB queries (12+ → 2 per page)

---

### 🎯 Phase 1: Clean Up (This Week)

#### ✅ 1. TTS in Games 🔊 — DONE (Jan 28)
~~Games have no audio pronunciation - users can't hear words while practicing.~~

**Fixed during component split:** All 6 game modes now have Volume2 speaker buttons that call `speak(word, targetLanguage)`:
- Flashcards, MultipleChoice, TypeIt, QuickFire, VerbMastery, AIChallenge

#### ✅ 1b. TTS in Chat 🔊 — DONE (Feb 1)
~~Users couldn't hear pronunciation of foreign words in chat messages.~~

**Fixed:** Click any highlighted foreign word in chat to hear pronunciation:
- Added `data-word` attribute to bold words in `parseMarkdown`
- Click handler on `RichMessageRenderer` using event delegation
- Hover styles (dotted underline) indicate clickability

#### ✅ 2. Split Giant Components 📦 — DONE (Jan 28)

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| FlashcardGame.tsx | 2,558 | 1,357 | **46%** |
| TutorGames.tsx | 1,376 | 827 | **40%** |
| Hero.tsx | 3,038 | 1,442 | **52%** |

**Extracted to:**
- `components/games/modes/` — TypeIt, QuickFire, VerbMastery, AIChallenge, Flashcards, MultipleChoice
- `components/games/tutor-modes/` — TutorFlashcards, TutorMultipleChoice, TutorTypeIt, TutorQuickFire, TutorGameResults
- `components/hero/` — InteractiveHearts, LanguageGrid, LoginForm, etc.

---

### 🎯 Phase 2: Priority Features (Next)

#### 1. XP System — Word & Verb Mastery ⭐
Games already award XP (5 correct in a row). Missing: mastery rewards.

**Specific asks:**
- [ ] Award XP when a **word/phrase** hits 5x correct streak (per-word tracking exists)
- [ ] Award XP when a **verb** hits 10x correct streak across all forms
- [ ] Review what "levels" mean and if they need improvement

#### 2. Verb System Overhaul 🔧
Current state is limited. Needs full review and rework.

**Tense coverage gaps:**
- [ ] Only present/future/past supported
- [ ] Missing: conditional, imperative, subjunctive, reflexive verbs

**Data pipeline:**
- [ ] Review how conjugations get populated (unlock system + API call?)
- [ ] Ensure all tenses can be filled for all languages

**Verb Mastery Game:**
- [ ] Review current implementation (unclear how it works)
- [ ] Rework/rebuild as needed after understanding current state

**UI (Love Log):**
- [ ] Review verb display in Love Log
- [ ] Ensure all tenses are viewable

#### 3. ChatArea.tsx Split 📦
Still at 1,877 lines. Refactor after above priorities.

---

### 🎯 Phase 3: Future Features

#### Curriculum/Tutor Guidance 📚
- No structured learning path
- Tutor needs curriculum to follow
- Per-language progression milestones

---

### 🎯 Phase 3: iOS Launch 📱

#### 6. Heavy Testing
- Full regression testing
- Edge cases
- Performance testing

#### 7. TestFlight → App Store
- Capacitor build
- Apple submission

---

## ✅ Previously Completed (Jan 27)

### Security & Analytics Release
- [x] Free tier (25 chats + limited voice)
- [x] Promo codes for creators
- [x] GA4 analytics funnel (signup → onboarding → paywall → checkout)
- [x] Password reset & account settings
- [x] Blog translations (12 languages)
- [x] Blog + app unified in same GA4 property
- [x] Verb conjugations fix
- [x] Onboarding words to Love Log
- [x] Analytics for returning users
- [x] CTA copy: "Speak their language, touch their heart"
- [x] Learn Hub: added Dutch, Romanian, Ukrainian

---

## Backlog

### Homepage First-Screen Improvement
**Goal:** Show immediate value instead of language selection as first step on desktop.
The current flow (select languages → login/signup) doesn't communicate value fast enough.
Consider: hero with benefits/screenshots first, THEN language selection.
**Complexity:** High (touches core onboarding flow)
**Priority:** After SEO phase

### Master Vocabulary Bank
See ROADMAP.md section "E. Master Vocabulary Bank (Cost Optimization)"
Pre-computed vocabulary to reduce AI costs and improve response times.

### Creator/Affiliate Program
See ROADMAP.md section "F. Creator/Affiliate Program"
10% commission for referrals.

---

## Lessons Learned (Jan 29)

**Don't push experimental branches to main without testing.**

Process going forward:
1. Preview deployment on Vercel branch — verify it works
2. Run basic smoke test (homepage, articles, key flows)
3. If big change (DB migrations, architecture) — ping Richard for sign-off
4. No merging without explicit "ready for prod" confirmation
