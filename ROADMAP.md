# Love Languages - Development Roadmap

**Last Updated:** February 4, 2026
**Project:** Love Languages Multilang

---

## ✅ Recently Completed (Feb 4, 2026)

### Tutor Experience Enhancement (Complete)
Major investment in tutor role with progression, analytics, and engagement features.

**Features Shipped:**
- ✅ **Coach Mode** — AI-powered agentic actions (word gifts, quizzes, challenges)
- ✅ **Tutor Analytics Dashboard** — Teaching impact, partner progress trends, weak spot intelligence
- ✅ **Tutor XP & Tiers** — 6 tiers from Language Whisperer to Love Linguist
- ✅ **Love Notes System** — Quick messages with templates + free text
- ✅ **Activity Feed** — Shared partner timeline (word mastered, level up, etc.)
- ✅ **Achievement System** — Tutor, student, and couple achievements

**New API Endpoints:**
- `POST /api/execute-coach-action` — Execute AI-suggested actions
- `GET /api/coach-context` — Context for coach mode decisions
- `POST /api/tutor-award-xp` — Award XP for teaching actions
- `GET /api/tutor-stats` — Teaching statistics
- `GET /api/tutor-analytics` — Full dashboard data
- `POST /api/send-love-note` — Send love notes
- `GET /api/activity-feed` — Partner timeline
- `POST /api/check-achievements` — Check and unlock achievements
- `GET /api/achievements` — Get user's achievements

**New Components:**
- `TutorAnalyticsDashboard.tsx` — Main analytics dashboard
- `TeachingImpactCard.tsx` — Hero metrics
- `TrendCharts.tsx` — Progress charts
- `WeakSpotIntelligence.tsx` — Stuck words analysis
- `LoveNoteComposer.tsx` — Send love notes
- `ActivityFeed.tsx` — Partner timeline
- `CoachActionConfirmModal.tsx` — Confirm AI-suggested actions
- `ThinkingIndicator.tsx` — Coach mode thinking state

**Database:**
- `migrations/036_tutor_experience_enhancement.sql`
- `migrations/037_linked_challenges.sql`

---

### SEO & Content Expansion (Feb 4, 2026)

**Features:**
- ✅ **Topic Hub Pages** — Browse articles by topic (pet-names, i-love-you, etc.)
- ✅ **Couples Methodology Articles** — 144 articles (17 languages × 8 topics)
- ✅ **Google Startup Program About Section** — Tabbed interface with team info
- ✅ **llms.txt** — AI agent discoverability file

**Bug Fixes:**
- ✅ Race conditions in challenge submission
- ✅ Data integrity issues in word requests
- ✅ Input validation and sanitization improvements
- ✅ Mobile swipe on bottom sections
- ✅ SSR page warnings (removed unused getStaticPaths)
- ✅ Tutor colors now use user's accent color

---

## ✅ Previously Completed (Feb 1, 2026)

### 7-Day Free Trial System
Replaced permanent free tier with time-limited trial to improve conversion.

**Features:**
- ✅ **7-day trial** — New users get full access for 7 days
- ✅ **Trial reminders** — Notifications at 5, 3, 1, 0 days remaining
- ✅ **Trial expired paywall** — Clean subscription prompt when trial ends
- ✅ **Partner cascade** — When primary subscriber cancels, linked partner loses access
- ✅ **Back button fix** — Pricing page no longer loops to Stripe on cancel

**Files:**
- `api/choose-free-tier.ts` — Trial activation (sets `trial_expires_at`)
- `api/trial-status.ts` — Check trial status endpoint
- `components/TrialReminderNotification.tsx` — In-app reminder banner
- `components/SubscriptionRequired.tsx` — Paywall with trial-expired messaging
- `migrations/035_free_trial.sql` — Database migration

**Docs:** `docs/FREE_TRIAL_IMPLEMENTATION.md`, `docs/FREE_TRIAL_FIXES.md`

---

## ✅ Previously Completed (Jan 29, 2026)

### Blog Infrastructure Overhaul
Migrated blog from static MDX to Supabase-powered SSR.

**Major Changes:**
- ✅ **Supabase migration** — All 5,147 articles now in database (was MDX files)
- ✅ **SSR mode** — Switched from static generation to server-side rendering
- ✅ **18-language support** — Added 6 new languages (Swedish, Norwegian, Danish, Czech, Greek, Hungarian)
- ✅ **Full i18n** — UI translations for all 18 native languages
- ✅ **Slug migration** — Fixed 1,952 articles with generic slugs → language-prefixed slugs
- ✅ **Internal links fix** — Fixed 4,036 broken internal links across 1,813 articles
- ✅ **Compare page redirects** — Fixed 3 redirect pages missing `prerender=true`
- ✅ **Performance** — Added edge cache headers (s-maxage=1d), reduced DB queries from 12+ to 2 per page

**New Languages (Blog + App):**
- 🇸🇪 Swedish (sv)
- 🇳🇴 Norwegian (no)
- 🇩🇰 Danish (da)
- 🇨🇿 Czech (cs)
- 🇬🇷 Greek (el)
- 🇭🇺 Hungarian (hu)

**Scripts Created:**
- `scripts/fix-internal-links.mjs` — Fuzzy-match broken links to correct articles
- `scripts/find-404s.mjs` — Check articles against live site
- `blog/scripts/phase2-migrate-content.mjs` — Rename generic slugs in Supabase

---

## ✅ Previously Completed (Jan 27, 2026)

### Security & Analytics Release
Merged `release/security-analytics` → `main`

**Features:**
- ✅ ~~Free tier (25 chats + limited voice)~~ → Replaced with 7-day trial (Feb 1)
- ✅ Promo codes system for creators
- ✅ Password reset & account settings
- ✅ Blog translations (12 languages)

**Analytics:**
- ✅ Full funnel: signup_started → onboarding_step → onboarding_completed → paywall_view → plan_selected → checkout_started → subscription_completed/failed
- ✅ Blog + app unified in same GA4 (G-LWVWLRMW3R)
- ✅ CTA click tracking from blog

**Fixes:**
- ✅ Verb conjugations in Love Log
- ✅ Onboarding words saved to dictionary
- ✅ Analytics for returning users (was queued forever)
- ✅ Learn Hub: added Dutch, Romanian, Ukrainian

---

## 📊 Analytics Implementation

### ✅ Phase 1: Core Funnel (DONE)

Tracking the full conversion funnel:
```
signup_started → signup_completed → onboarding_step → onboarding_completed →
paywall_view → plan_selected → checkout_started → subscription_completed/failed
```

This answers: **"Where do users drop off?"**

### ⏸️ Phase 2: Engagement Tracking (CONDITIONAL)

**Trigger criteria — implement when ANY of these are true:**
- [ ] 100+ signups (need retention data at scale)
- [ ] Conversion rate known and we're optimizing for retention
- [ ] Specific question like "do game users convert better?"

**Events to add when triggered:**
- Chat: `chat_message_sent`, `chat_response_received`
- Games: `game_started`, `game_completed`, `word_practiced`
- Learning: `word_added`, `level_test_completed`
- Retention: `streak_maintained`, `partner_invited`
- Churn: `error_encountered`, `feature_abandoned`

Full spec: `docs/ANALYTICS_IMPLEMENTATION.md`

### ⏸️ Phase 3: Advanced Analytics (CONDITIONAL)

**Trigger criteria:**
- [ ] 1000+ users (need volume for cohort analysis)
- [ ] Revenue > €1000/mo (worth investing in optimization)

**What to add:**
- Supabase events table for raw data
- BigQuery export for complex queries
- Cohort retention dashboards
- A/B testing infrastructure

---

## 📚 Skills Development

Formalize repeatable workflows into skills. See `SKILLS_TODO.md` for full list.

**Priority skills (create first):**
- `security-review` — code security audit workflow
- `testing-workflow` — formalize 4-level testing
- `agent-workflow` — formalize agent team management
- `create-article` — multi-language article generation

**With major features:**
- `add-game` — after XP overhaul
- `add-language` — after Verb System

These make operations repeatable, teachable to agents, and potentially shareable via ClawdHub.

---

## 🔒 Code Review & Security Automation (Do First)

Set up before next coding session. Claude writes fast — including bugs.

### Add Security Checklist to CLAUDE.md
```markdown
## Before completing any task:
- [ ] Scan for hardcoded secrets, API keys, passwords
- [ ] Check for SQL injection, shell injection, path traversal
- [ ] Verify all user inputs are validated
- [ ] Run `npx tsc --noEmit && npm run build`
- [ ] Check for type errors
```

### Pre-commit Hooks
Block bad commits locally before they ever get pushed.

```bash
pip install pre-commit
# Add .pre-commit-config.yaml with:
# - gitleaks (secrets)
# - eslint/prettier
# - tsc --noEmit
```

### Automated Scanners
- `gitleaks detect` — leaked secrets
- `semgrep` — SAST, OWASP top 10
- `npm audit` — dependency CVEs

### GitHub Action for PR Review
Add `.github/workflows/pr-review.yml` to auto-check PRs.

### Self-Testing Prompts in Workflow
Add to agent workflow:
- "Write 20 unit tests designed to break this function"
- "Find every security vulnerability in this file"
- "Audit for leaked secrets"

---

## 🤖 Self-Service & Support Automation

Reduce manual support burden before it becomes a ceiling.

### ✅ Password Reset in UI (DONE Jan 27)
~~Supabase supports it, but no UI button exists.~~

**Fixed:** Added "Forgot password?" link + dedicated /reset-password page + "Change password" in Account Settings.

### ✅ Email Change Self-Service (DONE Jan 27)
~~Let users change their own email in profile settings.~~

**Fixed:** Added email change in Account Settings.

### FAQ Enhancement
FAQ exists but could be smarter:
- Train AI tutor on FAQ content
- Add pricing explanation
- Add "How do I...?" common questions
- Link FAQ from error states / confusion points

### Help Chatbot
The tutor already knows the product. Could add a "Help" mode that answers account/billing/how-to questions instead of language learning.

---

## 💰 Monetization & Conversion (User Feedback)

Real feedback from early users — high priority.

### ✅ Paywall Hits Too Early (FIXED Jan 27)
~~Users hit the paywall before experiencing value.~~

**Fixed:** Implemented free tier with:
- 25 chats/month
- 1 voice chat/month (2 min max)
- 1 level test/month
- 5 word requests, 10 flashcard games

See `docs/FREE_TIER_SPEC.md` for full details.

---

### Pricing Display Psychology
Show smaller numbers to reduce friction.

**Changes needed:**
- Show monthly equivalent for yearly plans ("$5.75/mo" not "$69")
- Lead with monthly option, yearly as "save 70%"
- Remove or de-emphasize large annual totals

**Files:** `components/PricingPage.tsx`, `components/onboarding/steps/shared/PlanSelectionStep.tsx`

---

### Custom Learning Goals
Let users input open-ended goals like "meet the in-laws" or "order food on vacation." Tutor focuses content around their specific goal.

**Currently:** Fixed goal options during onboarding.
**Needed:** Free-text goal input → stored in profile → tutor references it.

---

## 🏗️ Major System Improvements

These are foundational systems that need holistic redesign, not quick fixes.

### A. XP & Progression System Overhaul
The current XP system is essentially "number of words in dictionary." Needs complete rethink.

**Problems:**
- XP not awarded for actual practice (games, challenges)
- Levels don't mean anything
- No daily/streak incentives
- Score tracking columns inconsistent (`success_count` vs `total_attempts`)

**Needs:**
- XP formula based on actual learning (practice, streaks, mastery)
- Meaningful level progression
- Daily bonuses, streak rewards
- Unified score tracking across all features
- Connect XP to skill progression, not just word count

**Related items:** #1, #2, #6, #16, #22

---

### B. Verb System & Conjugation
Verb Mastery is Polish-only and limited to 3 tenses. Real languages have many more.

**Problems:**
- Hardcoded Polish pronouns in Verb Mastery
- Only present/past/future — missing conditional, subjunctive, imperative, perfect, etc.
- No way to add new tenses
- Love Log doesn't handle verbs properly

**Needs:**
- Per-language conjugation structures (each language is different)
- Full tense support (varies by language)
- Verb data generation/sourcing pipeline
- Love Log verb integration
- Works for all 18 languages

**Related items:** #5, #20

---

### C. Curriculum & Tutor Guidance
No structured learning path. Users wander aimlessly.

**Problems:**
- Tutor has no curriculum to follow
- No connection between learned words and next steps
- No milestones or progression targets
- Each language needs its own path (grammar structures differ)

**Needs:**
- Per-language learning curriculum
- Tutor targets based on user's current vocabulary
- "You've learned X, now practice Y" guidance
- Fixed progression milestones per level
- Connect vocabulary → grammar → conversation skills

**Related items:** #24

---

### D. Component Architecture Refactor — MOSTLY DONE ✅
~~Giant components are unmaintainable and slow to iterate on.~~

**Completed (Jan 28):**
| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| FlashcardGame.tsx | 2,558 | 1,357 | **46%** ✅ |
| TutorGames.tsx | 1,376 | 827 | **40%** ✅ |
| Hero.tsx | 3,038 | 1,442 | **52%** ✅ |

**Still TODO:**
- `ChatArea.tsx` — 1,877 lines
- `Progress.tsx` — 1,287 lines

**Related items:** #11

---

### E. Master Vocabulary Bank (Cost Optimization)
Currently every word extraction requires AI to generate translations, conjugations, gender, etc. This is expensive and slow. Pre-computed vocabulary would be instant and free for common words.

**Current flow:**
```
Chat → AI extracts words → AI generates all word data → Save to user dictionary
```

**Optimized flow:**
```
Chat → AI extracts word stems → Lookup in master_vocabulary →
  ├─ Found? → Copy to user dictionary (instant, free)
  └─ Not found? → AI generates → Save + add to master vocab for future users
```

**Implementation:**
1. New `master_vocabulary` table:
   - `word` + `language_code` (source language)
   - `translations` JSONB ({"en": "...", "es": "...", "de": "..."})
   - `conjugations`, `gender`, `plural`, `adjective_forms`
   - `verified` boolean, `usage_count` integer
2. Seed with top 3,000-5,000 words per supported language
3. Modify extraction APIs to lookup first, AI fallback
4. Auto-add AI-generated words to master vocab (crowdsourced growth)

**Benefits:**
- 80-90% reduction in vocab-related AI costs
- Faster response times (no AI latency for common words)
- Consistent quality (vetted translations)
- Scales with users (each new word benefits everyone)

**Trigger:** When AI costs become significant or user base grows

**Related items:** analyze-history.ts, chat.ts, vocabulary extraction

---

### F. Creator/Affiliate Program
Allow creators to earn commission by referring new subscribers.

**How it works:**
1. Creators get a unique referral code/link (e.g., `lovelanguages.io/?ref=CREATOR123`)
2. When someone subscribes via that link, creator earns 10% commission
3. Creators can track referrals and earnings in-app

**Implementation:**
1. **Database:**
   - `creator_codes` table: code, user_id, commission_rate, created_at
   - `referrals` table: referrer_id, referred_user_id, subscription_id, commission_amount, paid_at
2. **Stripe Integration:**
   - Track referral source on checkout
   - Calculate commission on subscription payments
   - Stripe Connect for payouts OR manual tracking
3. **UI:**
   - Creator dashboard in profile (referral count, earnings, payout history)
   - Generate referral link button
   - "Enter Creator Code" input (already visible to all users)
4. **Logic:**
   - Validate creator codes on entry
   - Apply referral tracking cookie/param
   - Commission calculation on webhook

**Trigger:** When ready to scale through influencers/affiliates

**Related items:** AccountSettings.tsx (Creator Code input already added)

---

### G. Tutor Experience Enhancement ✅ COMPLETE (Feb 4, 2026)

~~The tutor role needs investment before iOS launch. Currently tutors have no progression, limited feedback, and minimal engagement hooks.~~

**Status:** Fully implemented. See "Recently Completed (Feb 4, 2026)" section above.

**Problems:**
- Tutors earn zero XP and have no progression
- Limited visibility into teaching effectiveness
- No bidirectional engagement (only tutor → student)
- No personalization of teaching suggestions
- `love_note` notification type exists but unused

**Current State (Gaps):**

| Feature | Students | Tutors |
|---------|----------|--------|
| XP | ✅ Games, challenges, gifts | ❌ Nothing |
| Levels | ✅ Beginner → Master | ❌ None |
| Streaks | ✅ Word mastery | ❌ None |
| Achievements | ❌ None | ❌ None |

**Four Pillars:**

#### 1. Partner Engagement (Priority)
- **Love Notes** — Quick messages using templates + optional free text
  - Templates: Encouragement, Check-ins, Celebrations
  - Context-aware suggestions based on activity
  - Rate limit: 10/day
- **Challenge Requests** — Student can ask tutor for help
  - Request types: General, Topic-based, Specific words
  - Pre-fills challenge creator with requested content
- **Activity Feed** — Shared timeline in Progress.tsx
  - Events: Word mastered, Level up, Challenge completed, Streak milestones
  - Privacy: NO wrong answers, NO detailed time tracking
- **Nudge System** — Gentle reminders
  - Student inactive 2 days → Tutor sees "Send encouragement?"
  - Student inactive 5 days → "Create a fun challenge?"
  - Max 1 nudge per 3 days, users can disable
- **Celebration Moments** — Shared milestones
  - Level up: Full-screen modal + partner notification
  - 7-day streak: Badge + notification
  - Perfect challenge: Animation + partner notification

#### 2. Teaching Analytics Dashboard
- **Teaching Impact Card** — XP Contributed, Words Mastered, Challenge Success Rate
- **Partner Progress Trends** — Line charts (Week/Month/All-time)
- **Challenge Analytics** — Completion rate, average score, by type
- **Weak Spot Intelligence** — Stuck words (multiple failures, no improvement 7+ days)
- **Learning Velocity** — Words/week, mastery rate, practice consistency
- **Recommendations** — Rule-based suggestions (top 3)

#### 3. Tutor Gamification
- **Tutor XP System** — Earned by enabling partner's success
  - Create Challenge: 2 XP
  - Send Word Gift: 2 XP
  - Partner completes challenge: 3 XP
  - Partner scores 80%+: +1 bonus
  - Partner scores 100%: +2 bonus
  - Partner masters gifted word: 1 XP
- **6 Tutor Tiers:**
  - Language Whisperer (0-100 XP)
  - Phrase Poet (100-300 XP)
  - Vocabulary Virtuoso (300-600 XP)
  - Grammar Guardian (600-1000 XP)
  - Fluency Fairy (1000-1500 XP)
  - Love Linguist (1500+ XP)
- **Teaching Streaks** — 48-hour grace period, one auto-freeze/week
- **20 Achievements** — 8 tutor, 8 student, 4 couple

#### 4. Personalization (Lite)
- **Adaptive Difficulty** — Suggest challenge settings based on recent performance
- **Learning Path Suggestions** — "What to teach next" based on vocabulary gaps

**New Tables:**
- `achievement_definitions` — Achievement metadata
- `user_achievements` — User's unlocked achievements
- `tutor_stats` — Teaching statistics
- `challenge_requests` — Student requests for challenges
- `activity_feed` — Partner timeline events

**Profile Changes:**
- `tutor_xp` INT DEFAULT 0
- `tutor_tier` INT DEFAULT 1
- `last_practice_at` TIMESTAMPTZ
- `nudges_enabled` BOOLEAN DEFAULT true

**New API Endpoints:**
- `POST /api/tutor-award-xp` — Award XP for teaching actions
- `GET /api/tutor-stats` — Get teaching statistics
- `GET /api/tutor-analytics` — Full dashboard data
- `POST /api/check-achievements` — Check and unlock achievements
- `GET /api/achievements` — Get user's achievements
- `POST /api/send-love-note` — Send love note
- `POST /api/create-challenge-request` — Student requests challenge
- `GET /api/activity-feed` — Get partner timeline

**New Components:**
- `TutorAnalyticsDashboard.tsx` — Main analytics dashboard
- `TeachingImpactCard.tsx` — Hero metrics
- `TrendCharts.tsx` — Progress charts
- `WeakSpotIntelligence.tsx` — Stuck words
- `AchievementBadge.tsx` — Badge display
- `AchievementUnlockModal.tsx` — Unlock celebration
- `LoveNoteComposer.tsx` — Send love notes
- `ChallengeRequestForm.tsx` — Student request UI
- `ActivityFeed.tsx` — Partner timeline
- `NudgeBanner.tsx` — Reminder display

**Key Files to Modify:**
- `Progress.tsx` — Replace tutor view with analytics dashboard
- `TutorGames.tsx` — Add streak indicator, handle challenge requests
- `Navbar.tsx` — Love note button, new notification types
- `api/submit-challenge.ts` — Award tutor XP
- `api/complete-word-request.ts` — Award tutor XP
- `types.ts` — Add new interfaces
- `constants/levels.ts` — Add tutor tier definitions

**Tone Guidelines:**
| Instead of | Use |
|------------|-----|
| "Partner failed 12 words" | "12 words need more practice together" |
| "They haven't practiced in 5 days" | "Great opportunity to play together!" |
| "Low accuracy: 45%" | "These words are challenging - focused practice time" |

**Post-Launch (v2):**
- Shared Goals (complex asymmetric tracking)
- Learning Style Detection (AI-heavy)
- Mood-Aware Interactions (over-engineered)
- XP multipliers (weekend bonus, streak multiplier)
- Tier unlocks/rewards

**Related:** #23 Achievements, #24 Partner Analytics Dashboard

---

## 🔥 Critical (Blocking/Broken)

### ✅ 1. XP System for Games (FIXED)
~~Local practice games don't award XP.~~

**Fixed:** `api/submit-game-session.ts` now awards 1 XP for every 5 consecutive correct answers:
```js
if (currentStreak === 5) {
  xpAwarded++;
  currentStreak = 0;
}
```

---

### ✅ 2. Score Tracking Column Mismatch (NOT AN ISSUE)
~~Local games write to `success_count`/`fail_count` columns, but partner challenges write to `total_attempts`/`correct_attempts`.~~

**Verified Jan 29:** All components use consistent columns (`total_attempts`/`correct_attempts`). No mismatch exists. Roadmap was outdated.

---

### ✅ 3. Sound Feedback for Answers (FIXED Jan 29)
~~Multiple places play `sounds.play('correct')` regardless of answer.~~

**Decision:** No negative sounds for wrong answers — just no positive sound.

**Fixed:** Only play sound/haptic for correct answers:
```typescript
if (result.isCorrect) {
  sounds.play('correct');
  haptics.trigger('correct');
}
```

---

### ✅ 4. Learn Hub Missing 3 Languages (FIXED Jan 27)
~~Dutch (nl), Romanian (ro), and Ukrainian (uk) have blog content but aren't in Learn Hub's `getStaticPaths`.~~

**Fixed:** Added full UI_TEXT translations for nl, ro, uk. All 12 languages now supported.

---

## 🛠 High Priority (Should Fix Soon)

### 5. Verb Mastery Only Works for Polish (INFRASTRUCTURE READY)
`VERB_PERSONS` array has hardcoded Polish pronouns. Other languages can't use Verb Mastery mode.

**Status (Jan 29):**
- ✅ All 18 languages have `conjugationPersons` defined in `language-config.ts`
- ✅ Helper functions exist: `getConjugationPersons(code)`, `getConjugationLabel(key, code)`
- ✅ Schema builders use normalized keys that map correctly
- ❌ `FlashcardGame.tsx` lines 38-46 has hardcoded Polish pronouns

**Fix:** ~20 lines to wire up:
```typescript
import { getConjugationPersons } from '../constants/language-config';
// Replace hardcoded VERB_PERSONS with dynamic builder using targetLanguage
```

**Tenses supported:** Present ✅, Past ✅, Future ✅, Conditional ❌, Subjunctive ❌

**Effort:** Quick (30 min — infrastructure is ready, just needs wiring)

---

### 6. `xp-gain` Sound Never Used
The `xp-gain` sound is defined but never played anywhere in the app.

**Status (Jan 29):**
- ✅ Sound defined in `services/sounds.ts` (type + file list)
- ✅ Haptic pattern defined in `services/haptics.ts`
- ❌ `sounds.play('xp-gain')` called 0 times in codebase

**Where to add:**
- `PlayQuizChallenge.tsx` — result screen showing `xp_earned`
- `PlayQuickFireChallenge.tsx` — result screen showing `xp_earned`
- `FlashcardGame.tsx` — game completion
- `WordGiftLearning.tsx` — shows `+{xpEarned} XP`

**Effort:** Quick (15 min — add 4 calls)

---

### ✅ 7. TTS in Games — DONE (Jan 28)
~~Flashcards, quizzes, and challenges don't have TTS pronunciation buttons.~~

**Fixed during component split (Jan 28):** All 6 game modes now have Volume2 speaker buttons:
- ✅ Flashcards — `speak(currentWord.word, targetLanguage)`
- ✅ MultipleChoice — `speak(currentWord.word, targetLanguage)`
- ✅ TypeIt — `speak(prompt, targetLanguage)` (when target→native)
- ✅ QuickFire — `speak(currentWord.word, targetLanguage)`
- ✅ VerbMastery — `speak(currentQuestion.infinitive, targetLanguage)`
- ✅ AIChallenge — Multiple locations for word pronunciation

---

### ✅ 7b. TTS in Chat — DONE (Feb 1)
~~Users can't hear pronunciation of foreign words shown in chat messages.~~

**Fixed:** Click any highlighted (bold) foreign word in chat to hear pronunciation.
- Added `data-word` attribute to bold words in `parseMarkdown`
- Click handler on `RichMessageRenderer` using event delegation
- Hover styles (dotted underline) indicate clickability
- Also added `data-word` to DOMPurify's allowed attributes

---

### 8. Quick Fire Timer Memory Leak Risk
Timer callback captures stale state. Uses refs as workaround but pattern is fragile. Final scores may be incorrect if timer expires during async answer processing.

**Files:**
- `components/FlashcardGame.tsx` (line ~570) — `quickFireTimerRef`

**Fix:** Refactor timer logic to use proper cleanup and state management.

**Effort:** Medium (1-2 hours)

---

### ⚠️ 9. Exit Confirmation for In-Progress Games (PARTIAL)
~~Users can accidentally lose progress by clicking back button mid-game.~~

**Status (Jan 29):**
- ✅ `FlashcardGame.tsx` — Implemented! Has `beforeunload` + custom `ExitConfirmModal`
- ❌ `TutorGames.tsx` — NOT implemented, needs adding

**Remaining fix:** Copy exit confirmation pattern to TutorGames.tsx

**Effort:** Quick (15 min)

---

### 10. Offline Game Sessions Not Saved
`useOffline()` hook caches vocabulary but game sessions aren't cached and score updates aren't queued. Offline play records are lost.

**Files:**
- `services/offline.ts` — has `queueScoreUpdate()` but unused
- `components/FlashcardGame.tsx` — doesn't use offline queue

**Fix:** Integrate offline score queueing for local games.

**Effort:** Medium (2-3 hours)

---

## ✨ Improvements (Polish)

### ✅ 11. Split Giant Components — MOSTLY DONE (Jan 28)

**Completed:**
- ✅ `FlashcardGame.tsx` — 2,558 → 1,357 lines (46% reduction)
- ✅ `TutorGames.tsx` — 1,376 → 827 lines (40% reduction)
- ✅ `Hero.tsx` — 3,038 → 1,442 lines (52% reduction)

**Extracted to:**
- `components/games/modes/` — TypeIt, QuickFire, VerbMastery, AIChallenge, Flashcards, MultipleChoice
- `components/games/tutor-modes/` — TutorFlashcards, TutorMultipleChoice, TutorTypeIt, TutorQuickFire, TutorGameResults
- `components/hero/` — InteractiveHearts, LanguageGrid, LoginForm, etc.

**Still TODO:**
- `ChatArea.tsx` — 1,877 lines
- `Progress.tsx` — 1,287 lines

---

### 12. No Volume Control (API READY)
Only mute/unmute toggle exists in UI. Volume is fixed at 0.5.

**Status (Jan 29):**
- ✅ `services/sounds.ts` has `setVolume(vol)` and `getVolume()` methods ready
- ❌ UI only shows mute toggle (ProfileView.tsx lines 470-510)
- ❌ Volume slider not exposed to users

**Fix:** Add volume slider to ProfileView that calls `sounds.setVolume()`, persist preference.

**Effort:** Quick (45 min)

---

### 13. No Keyboard Navigation for Multiple Choice (PARTIAL)
Can't use 1/2/3/4 or A/B/C/D keys to select options.

**Status (Jan 29):**
- ✅ Enter key works for text input submission (TypeIt, QuickFire, VerbMastery, AIChallenge)
- ❌ No 1/2/3/4 or A/B/C/D keys for multiple choice selection

**Fix:** Add keydown listener in MultipleChoice.tsx mapping numbers to options.

**Effort:** Quick (30 min)

---

### 14. No Reduced Motion Support
Animations may cause motion sickness. No reduced motion alternative.

**Status (Jan 29):**
- ❌ Zero `prefers-reduced-motion` media queries in app code
- ❌ `animate-pulse`, `animate-ping`, `animate-spin`, `slide-in`, `fade-in` all run without checks
- ⚠️ ARIA attributes partial (dialogs good, incomplete elsewhere)
- ❌ No `sr-only` screen reader text found

**Fix:** Add global CSS:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Effort:** Quick (15 min for global fix)

---

### 15. Loading States Inconsistent
Different loading indicators across components (text vs bouncing dots vs mixed).

**Files:**
- Various components

**Fix:** Create unified `LoadingSpinner` component, replace all instances.

**Effort:** Quick (1 hour)

---

### ✅ 16. Word Streak Visible in Game UI (FIXED)
~~`correct_streak` is tracked but not displayed.~~

**Fixed:** `StreakIndicator` component shows "3/5 🔥" in Flashcards, MultipleChoice, TypeIt modes.

---

### ✅ 17. Console.log Cleanup (FIXED)
~~Debug statements in production code.~~

**Fixed:** All console.log statements removed from components (0 remaining).

---

### 18. Legacy Polish Fields in Types
`polishConnection`, `polishOrigin` fields in `types.ts` are from pre-multilingual era.

**Files:**
- `types.ts` (lines 56-60)

**Fix:** Remove after verifying no usage, add migration if needed.

**Effort:** Quick (check usage, 30 min)

---

## 🌍 Content Expansion

### ✅ 19. All 18 Languages Have Blog Content (VERIFIED Jan 29)
~~Swedish, Norwegian, Danish, Czech, Greek, Hungarian have app support but no blog articles.~~

**Status:** 5,147 total articles across all 18 native languages:

| Language | Articles | | Language | Articles |
|----------|----------|---|----------|----------|
| 🇬🇧 en | 493 | | 🇷🇴 ro | 286 |
| 🇫🇷 fr | 477 | | 🇳🇱 nl | 285 |
| 🇪🇸 es | 426 | | 🇹🇷 tr | 282 |
| 🇮🇹 it | 361 | | 🇺🇦 uk | 281 |
| 🇩🇪 de | 359 | | 🇵🇱 pl | 266 |
| 🇵🇹 pt | 350 | | 🇷🇺 ru | 262 |
| 🇸🇪 sv | 170 | | 🇳🇴 no | 170 |
| 🇭🇺 hu | 170 | | 🇬🇷 el | 170 |
| 🇩🇰 da | 170 | | 🇨🇿 cs | 169 |

**en→pl specifically:** 86 articles ✅

**Note:** When querying `blog_articles`, use batches or `Prefer: count=exact` header — Supabase has 1000-row default limit.

---

### 20. Verb Mastery Past/Future Tense
UI exists for present/past/future tense selection, but most verbs only have present tense populated. No mechanism to generate other tenses.

**Files:**
- `components/FlashcardGame.tsx` (line ~730) — tense UI
- Conjugation data sources

**Fix:** Either populate verb conjugation data or disable UI for unavailable tenses.

**Effort:** Large (data sourcing/generation)

---

## 🚀 Future Features

### 21. Spaced Repetition System (SRS)
Current: word is "learned" after 5 consecutive correct. No review scheduling.

**Current:**
- `components/FlashcardGame.tsx` — `STREAK_TO_LEARN = 5`

**Improvement:** Implement proper SRS with Anki-like intervals for review scheduling.

**Effort:** Large (algorithm + UI + DB schema changes)

---

### 22. Daily Login / Streak Rewards
No daily login bonus, no streak rewards for consecutive days, no incentive loops.

**Implementation:**
- Track `last_login_date` in profile
- Award bonus XP for first game of day
- Add streak counter with bonus multipliers

**Effort:** Medium (2-3 hours)

---

### ✅ 23. Achievements System (DONE Feb 4, 2026)
~~No achievements currently. Could add: "First 100 XP", "10-day streak", "100 words mastered", etc.~~

**Fixed:** Full achievement system with tutor, student, and couple achievements. Includes `check-achievements` API, `AchievementBadge` component, unlock celebrations.

---

### ✅ 24. Partner Analytics Dashboard (DONE Feb 4, 2026)
~~Let tutors see learner's daily streak, weak words, time spent practicing, challenge completion rate.~~

**Fixed:** `TutorAnalyticsDashboard` with teaching impact metrics, partner progress trends, weak spot intelligence, and activity feed.

---

### 25. Native Mobile App Deployment
Capacitor configured but not fully deployed. iOS project exists but untested on devices.

**Files:**
- `capacitor.config.ts`
- `/ios/` directory

**Next Steps:**
- Test on physical devices
- App Store submission
- Push notifications

**Effort:** Large (testing + submission process)

---

## Quick Wins (< 1 hour each)

| Item | Time | Status |
|------|------|--------|
| ~~Add `nl`, `ro`, `uk` to Learn Hub~~ | 5 min | ✅ Done |
| Play `xp-gain` sound when XP awarded | 15 min | ⚠️ Open |
| ~~Add exit confirmation for games~~ | 30 min | ✅ FlashcardGame done, TutorGames needs it |
| Add keyboard shortcuts (1-4) for MC | 30 min | ⚠️ Open (Enter works, numbers don't) |
| ~~Add streak indicator in game UI~~ | 30 min | ✅ Done |
| Add volume slider | 45 min | ⚠️ Open (API ready, needs UI) |
| ~~Remove console.log statements~~ | 30 min | ✅ Done |
| Add reduced-motion support | 15 min | ⚠️ Open (global CSS fix) |
| Wire up Verb Mastery multilingual | 30 min | ⚠️ Open (infrastructure ready) |
| ~~Add TTS to one game mode~~ | ~~15 min~~ | ✅ Done (Jan 28) |

---

## Priority Matrix

| Issue | Urgency | Impact | Effort | Status |
|-------|---------|--------|--------|--------|
| ~~XP not awarded for games~~ | 🔴 High | 🔴 High | Quick | ✅ Done |
| ~~Score column mismatch~~ | 🔴 High | 🔴 High | Medium | ✅ Not an issue |
| ~~Learn Hub missing langs~~ | 🔴 High | 🟡 Medium | Quick | ✅ Done |
| ~~Tutor Experience~~ | 🔴 High | 🔴 High | Large | ✅ Done (Feb 4) |
| ~~Partner Analytics~~ | 🟡 Medium | 🔴 High | Large | ✅ Done (Feb 4) |
| ~~Achievements System~~ | 🟡 Medium | 🔴 High | Large | ✅ Done (Feb 4) |
| Verb Mastery Polish-only | 🟡 Medium | 🔴 High | Quick | ⚠️ Infrastructure ready |
| TTS missing in games | 🟡 Medium | 🔴 High | Quick | ⚠️ Service ready |
| ~~Component splitting~~ | 🟢 Low | 🔴 High | Large | ✅ Mostly Done |
| SRS implementation | 🟢 Low | 🔴 High | Large | ⚠️ Open |
| Mobile app deployment | 🟢 Low | 🔴 High | Large | ⚠️ Open |

---

*This roadmap is a living document. Update as items are completed or priorities shift.*
