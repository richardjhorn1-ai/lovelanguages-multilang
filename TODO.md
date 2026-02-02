## Current Sprint - Post-Blog Overhaul

**Last Updated:** February 2, 2026

### ✅ Completed (Feb 2)

#### Verb Tense Expansion + VerbDojo 🥋
- [x] **VerbDojo game mode** — New conjugation practice game with 3 modes:
  - Fill Template (type the conjugation)
  - Match Pairs (drag pronouns to forms)
  - Multiple Choice
- [x] **Dynamic tense system** — All 18 languages now have proper tense configs:
  - Romance: present, past, imperfect, future, conditional, imperative, subjunctive
  - Slavic: present, past, future, conditional, imperative (with gendered past/conditional)
  - Germanic: present, past, future, conditional, imperative
- [x] **Unlock tense API** — Users can unlock past/future/conditional/etc for any verb
- [x] **Neuter gender column** — Slavic 3rd person singular now shows masculine/feminine/neuter
- [x] **VerbDojo translations** — All 33 strings translated to 17 languages
- [x] **Love Log improvements** — Type signature fix, translation fallbacks

**Docs:** `docs/VERB_DOJO_SPEC.md`, `docs/VERB_TENSE_EXPANSION_PLAN.md` (→ archived)

---

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

### ✅ Completed (Jan 28)

#### TTS in Games 🔊
All 6 game modes now have Volume2 speaker buttons that call `speak(word, targetLanguage)`:
- Flashcards, MultipleChoice, TypeIt, QuickFire, VerbMastery, AIChallenge

#### TTS in Chat 🔊 (Feb 1)
Click any highlighted foreign word in chat to hear pronunciation.

#### Split Giant Components 📦

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| FlashcardGame.tsx | 2,558 | 1,357 | **46%** |
| TutorGames.tsx | 1,376 | 827 | **40%** |
| Hero.tsx | 3,038 | 1,442 | **52%** |

---

## 🎯 Up Next

### 1. XP System Overhaul ⭐
- [ ] Award XP when a **word/phrase** hits 5x correct streak
- [ ] Award XP when a **verb** hits 10x correct streak across all forms
- [ ] Review what "levels" mean and if they need improvement
- [ ] VerbDojo XP integration (streak-based: 1 XP per 5 correct)

### 2. Content & SEO 📈
- [ ] Generate topic images via Glif API (~25-30 images for reuse)
- [ ] Submit updated sitemap to GSC (13,363 articles)
- [ ] Monitor indexing (only 884/13,363 = 7.5% indexed)
- [ ] Fix English title/description on non-English articles
- [ ] Generate remaining articles for full parity (~17-24k more)

### 3. AIChallenge Integration 🤖
- [ ] Wire AIChallenge component to game flow (created but not active)

### 4. ChatArea.tsx Split 📦
Still at 1,877 lines. Refactor after priorities above.

---

## 🎯 Phase 3: iOS Launch 📱

### Heavy Testing
- [ ] Full regression testing
- [ ] Edge cases & error states
- [ ] Performance testing on device

### TestFlight → App Store
- [ ] Capacitor build
- [ ] TestFlight beta
- [ ] Apple submission
- [ ] PostedApp creator marketplace (needs TestFlight first)

---

## 🎯 Future Features

### Curriculum/Tutor Guidance 📚
- No structured learning path currently
- Tutor needs curriculum to follow
- Per-language progression milestones

### Couple Subscription 💑
See `docs/COUPLE_SUBSCRIPTION_PLAN.md`
Two accounts for one payment.

### Creator/Affiliate Program
10% commission for referrals.
See ROADMAP.md section "F. Creator/Affiliate Program"

### Master Vocabulary Bank
Pre-computed vocabulary to reduce AI costs.
See ROADMAP.md section "E. Master Vocabulary Bank"

---

## ✅ Previously Completed (Jan 27)

### Security & Analytics Release
- [x] Free tier (25 chats + limited voice) → superseded by 7-day trial
- [x] Promo codes for creators
- [x] GA4 analytics funnel (50+ events)
- [x] Password reset & account settings
- [x] Blog translations (12 languages)
- [x] Verb conjugations fix
- [x] Onboarding words to Love Log
- [x] Analytics for returning users

---

## Backlog

### Homepage First-Screen Improvement
Show immediate value instead of language selection as first step.
**Complexity:** High | **Priority:** After iOS launch

---

## Lessons Learned

See `docs/TROUBLESHOOTING.md` for bug patterns and shipping checklist.

Key lessons:
1. Always update ALL 18 locales when adding translation keys
2. Test on iOS Safari - flex/min-height behaves differently
3. Never delete user data in error handlers
4. Check sanitizer allowlists when adding data-* attributes
5. Don't hardcode grammar assumptions - languages vary
