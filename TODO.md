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

### 1. XP System ⭐ — COMPLETE
- [x] VerbDojo XP (streak-based: 1 XP per 5 correct)
- [x] Word mastery celebration (5x streak shows animation)
- [x] Award 1 XP when word hits 5x streak (+ xp-gain sound)
- [ ] **Optional:** Review what "levels" mean and if they need improvement

### 2. Content & SEO 📈
- [x] Submit updated sitemap to GSC — DONE
- [x] English titles with language-prefix slugs — DONE
- [x] Topic images on all articles — DONE (but ~9k have lazy/repetitive images)
- [ ] Monitor indexing (requesting 10 hub pages/day per Google limits)
- [ ] Improve ~9k articles with samey/repetitive images
- [ ] Generate remaining articles for full parity (~17-24k more)

### 3. ChatArea.tsx Split 📦
Still at 1,877 lines. Refactor when there's bandwidth.

---

## 🎯 Phase 3: iOS Launch 📱 (Valentine's Target)

**Detailed specs:**
- `docs/OFFLINE_MODE_PLAN.md` — Full offline architecture + decisions
- `docs/IOS_TESTING_PLAN.md` — 60+ test cases
- `docs/PWA_INSTALL_GUIDE.md` — PWA fallback instructions

### Track 1: Offline Mode (Richard building now)
| Task | Status | Time |
|------|--------|------|
| Phase 1: IndexedDB setup | ☐ | 2-3h |
| Phase 2: Cache population | ☐ | 2-3h |
| Phase 3: Offline detection + UI | ☐ | 1-2h |
| Phase 4: Offline-first fetching | ☐ | 2-3h |
| Phase 5: Background sync queue | ☐ | 2-3h |
| i18n strings (18 langs) | ☐ | 1h |

### Track 2: iOS App
| Task | Status | Notes |
|------|--------|-------|
| Apple Developer account | ⏳ | Enrollment rejected, emailed support |
| Capacitor iOS build | ☐ | `npx cap add ios` done |
| iOS testing (full suite) | ☐ | See `IOS_TESTING_PLAN.md` |
| App Store assets | ☐ | Screenshots, description |
| TestFlight internal | ☐ | Richard + Misia |
| TestFlight beta | ☐ | ~10 external testers |
| App Store submission | ☐ | Review 1-3 days |

### Track 3: Launch Prep
| Task | Status |
|------|--------|
| Landing page polish | ☐ |
| Product Hunt draft | ☐ |
| Social content (IG/TikTok) | ☐ |
| Press kit | ☐ |

### Timeline
| Date | Milestone |
|------|-----------|
| Feb 4-7 | Offline mode |
| Feb 7 | Apple account (hopefully) |
| Feb 8-9 | iOS testing + fixes |
| Feb 10 | TestFlight internal |
| Feb 11-12 | Beta + fixes |
| Feb 13 | App Store submit |
| Feb 14 | 💘 Launch (if approved) |

**Fallback:** PWA-first launch if App Store delayed

---

## 🎯 Future Features

### Spaced Repetition System (SRS) 🧠
- Proper review scheduling (Anki-like intervals)
- Track `next_review` dates for vocabulary
- Resurface words at optimal intervals

### Partner Real-Time Sync 💕
- Supabase realtime subscriptions for partner activity
- Live updates when partner completes challenges
- No more manual refresh needed

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

### Master Vocabulary Bank ⏸️ PAUSED
Pre-computed vocabulary to reduce AI costs.
**Status:** ~26K words generated, paused due to Claude Code credit limits (85% weekly used).
**Next:** Bulk insert to Supabase, connect app, then continue slowly.
See `docs/VOCAB_BANK_STATUS.md` for full details.

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

## 🎯 Marketing & Growth

### PostedApp UGC Campaign (Active)
**Started:** Feb 5, 2026
**Status:** Brief posted, awaiting creator responses

Launched UGC creator campaign on PostedApp to get authentic couple content promoting Love Languages. Paying creators to make organic-style videos showcasing the app for international couples.

**Brief highlights:**
- Full creative freedom for creators
- Focus on authentic, non-ad-like content
- Themes: storytime, couple moments, funny/relatable, spicy/cheeky
- CTA: lovelanguages.io, 7-day free trial

**Next:** Review incoming creator pitches, select creators, track content performance

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
