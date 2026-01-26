# Love Languages - Development Roadmap

**Last Updated:** January 2026  
**Project:** Love Languages Multilang

---

## 📊 Analytics Implementation (Do First — Data Foundation)

**Before optimizing, we need to see what's happening.**

Comprehensive event tracking to understand the full user journey. See `docs/ANALYTICS_IMPLEMENTATION.md` for full spec.

### Event Categories
- **Acquisition:** Blog views, CTA clicks, source attribution
- **Activation:** Signup, onboarding steps, first word, first chat
- **Monetization:** Paywall views, plan selection, checkout, conversion
- **Engagement:** Chat, games, vocabulary, challenges, voice
- **Retention:** Streaks, partner invites, return visits
- **Churn signals:** Errors, rage clicks, abandoned features

### Agent Assignments
| Agent | Responsibility |
|-------|----------------|
| Felix 🎨 | `services/analytics.ts`, frontend event triggers |
| Bruno 🔧 | Supabase events table, server-side validation |
| Diana 🚀 | GA4 configuration, BigQuery export |
| Sofia ✍️ | Blog-specific events, content performance |

### Phases
1. **Foundation** — Core funnel events (signup → paywall → convert)
2. **Engagement** — Feature usage events
3. **Analysis** — GA4 funnels, dashboards
4. **Optimization** — A/B tests, automated reports

### Success = Answering These Questions
- Where do users come from?
- Where do they drop off?
- What features drive retention?
- What content converts best?
- Why do people churn?

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

### Password Reset in UI
Supabase supports it, but no UI button exists. Users can't reset password themselves.

**Fix:** Add "Forgot password?" link to login, "Change password" in profile settings.

**Effort:** Quick (1 hour)

### Email Change Self-Service
Let users change their own email in profile settings.

**Effort:** Quick (Supabase has `updateUser()`)

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

### Paywall Hits Too Early
Users hit the paywall before experiencing value. Current state: `free: 0` on almost all endpoints. Free users can't chat, validate words, or do anything meaningful.

**Options:**
1. **Free allowance** — 10 chats, 20 word validations, 1 level test, etc. Let them taste it.
2. **Time-based trial** — 7 days full access, no card required. Convert after they're hooked.

**Files:** `utils/api-middleware.ts` → `RATE_LIMITS`

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

### D. Component Architecture Refactor
Giant components are unmaintainable and slow to iterate on.

**Problems:**
- `FlashcardGame.tsx` — 2,321 lines
- `ChatArea.tsx` — 1,877 lines
- `TutorGames.tsx` — 1,355 lines
- `Progress.tsx` — 1,287 lines

**Needs:**
- Split into focused, testable components
- Shared hooks for common logic
- Enables faster iteration on other improvements

**Related items:** #11

---

## 🔥 Critical (Blocking/Broken)

### 1. XP System Doesn't Award XP for Local Games
Local practice games (flashcards, multiple choice, type-it, quick fire, verb mastery) don't award XP. Users can practice all day and see 0 XP gained. XP is essentially just a proxy for "number of words in dictionary."

**Files:**
- `components/FlashcardGame.tsx` — no `incrementXP` call anywhere in 2,300 lines
- `api/increment-xp.ts` — exists but unused by games
- `services/gemini.ts` — `incrementXP()` wrapper

**Fix:** After `saveGameSession()`, call `incrementXP(correctCount)` or similar formula.

**Effort:** Quick (30 min)

---

### 2. Score Tracking Column Mismatch
Local games write to `success_count`/`fail_count` columns, but partner challenges write to `total_attempts`/`correct_attempts`. Word progress may not sync correctly between features.

**Files:**
- `components/FlashcardGame.tsx` (line ~380) — uses `success_count`/`fail_count`
- `api/submit-challenge.ts` — uses `total_attempts`/`correct_attempts`

**Fix:** Align column names, add migration if needed.

**Effort:** Medium (2-3 hours, need DB migration)

---

### 3. Sound Plays "Correct" for Wrong Answers
Multiple places play `sounds.play('correct')` regardless of whether the answer is correct or incorrect.

**Files:**
- `components/FlashcardGame.tsx` (lines ~460, ~480) — `handleChallengeFlashcardResponse()` and `handleChallengeMcSelect()`

**Fix:** Add conditional: `sounds.play(isCorrect ? 'correct' : 'incorrect')` — but first need to add an `incorrect.mp3` sound file.

**Effort:** Quick (add sound file + 3 line changes)

---

### 4. Learn Hub Missing 3 Languages
Dutch (nl), Romanian (ro), and Ukrainian (uk) have blog content but aren't in Learn Hub's `getStaticPaths`. Users can't select these as native languages.

**Files:**
- `/blog/src/pages/learn/[nativeLang]/index.astro`
- `/blog/src/pages/learn/[nativeLang]/[targetLang]/index.astro`

**Fix:** Add `nl`, `ro`, `uk` to `supportedNativeLangs` array.

**Effort:** Quick (5 min)

---

## 🛠 High Priority (Should Fix Soon)

### 5. Verb Mastery Only Works for Polish
`VERB_PERSONS` array has hardcoded Polish pronouns. Other languages can't use Verb Mastery mode.

**Files:**
- `components/FlashcardGame.tsx` (lines 42-50) — hardcoded array
- `constants/language-config.ts` — has `getConjugationPersons()` function

**Fix:** Replace `VERB_PERSONS` with dynamic lookup from `LANGUAGE_CONFIGS[targetLanguage].grammar.conjugationPersons`

**Effort:** Medium (1-2 hours)

---

### 6. `xp-gain` Sound Never Used
The `xp-gain.mp3` sound effect exists but is never played anywhere in the app.

**Files:**
- `public/sounds/xp-gain.mp3` — unused asset
- `services/sounds.ts` — defines but never triggers

**Fix:** Play when XP is awarded (games, challenges, word additions).

**Effort:** Quick (add calls in 3-4 places)

---

### 7. No TTS in Games
Flashcards, quizzes, and challenges don't have TTS pronunciation buttons. Users can't hear words while practicing.

**Files:**
- `components/FlashcardGame.tsx` — no TTS integration
- `components/PlayQuizChallenge.tsx` — no TTS
- `services/audio.ts` — TTS service exists

**Fix:** Add speaker icon buttons that call `speak(word, targetLanguage)`.

**Effort:** Medium (1-2 hours)

---

### 8. Quick Fire Timer Memory Leak Risk
Timer callback captures stale state. Uses refs as workaround but pattern is fragile. Final scores may be incorrect if timer expires during async answer processing.

**Files:**
- `components/FlashcardGame.tsx` (line ~570) — `quickFireTimerRef`

**Fix:** Refactor timer logic to use proper cleanup and state management.

**Effort:** Medium (1-2 hours)

---

### 9. No Exit Confirmation for In-Progress Games
Users can accidentally lose progress by clicking back button mid-game. Especially problematic for Quick Fire with timer running.

**Files:**
- `components/FlashcardGame.tsx`
- `components/TutorGames.tsx`

**Fix:** Add `beforeunload` handler and/or confirmation modal.

**Effort:** Quick (30 min)

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

### 11. Split Giant Components
Hard to maintain, slow to test.

**Files:**
- `components/FlashcardGame.tsx` — **2,321 lines** 😱
- `components/ChatArea.tsx` — **1,877 lines**
- `components/TutorGames.tsx` — **1,355 lines**
- `components/Progress.tsx` — **1,287 lines**

**Suggested Structure:**
```
FlashcardGame/
  ├── index.tsx (orchestration)
  ├── VerbMastery.tsx
  ├── AIChallenge.tsx
  ├── TypeIt.tsx
  ├── MultipleChoice.tsx
  └── hooks/useScores.ts
```

**Effort:** Large (full refactor, ~1-2 days per component)

---

### 12. No Volume Control
Only mute/unmute toggle exists. Volume is fixed at 0.5.

**Files:**
- `services/sounds.ts` — hardcoded `volume: 0.5`
- `components/ProfileView.tsx` — mute toggle only

**Fix:** Add volume slider to ProfileView, persist preference.

**Effort:** Quick (1 hour)

---

### 13. No Keyboard Navigation for Multiple Choice
Can't use 1/2/3/4 or A/B/C/D keys to select options.

**Files:**
- `components/FlashcardGame.tsx` — multiple choice rendering

**Fix:** Add keydown listener mapping numbers/letters to options.

**Effort:** Quick (30 min)

---

### 14. No Reduced Motion Support
3D flip animations may cause motion sickness. No alternative non-animated mode.

**Files:**
- `components/FlashcardGame.tsx` — flip animation CSS

**Fix:** Add `prefers-reduced-motion` media query support.

**Effort:** Quick (30 min)

---

### 15. Loading States Inconsistent
Different loading indicators across components (text vs bouncing dots vs mixed).

**Files:**
- Various components

**Fix:** Create unified `LoadingSpinner` component, replace all instances.

**Effort:** Quick (1 hour)

---

### 16. Word Streak Not Visible in Game UI
`correct_streak` is tracked but not displayed. Users don't know how close they are to "learning" a word.

**Files:**
- `components/FlashcardGame.tsx` — has streak logic, no UI

**Fix:** Add streak indicator (e.g., "3/5 🔥") near word display.

**Effort:** Quick (30 min)

---

### 17. Console.log Cleanup
Debug statements in production code.

**Files:**
- `components/ChatArea.tsx`
- `components/FlashcardGame.tsx`
- `components/BugReportModal.tsx`
- `api/*.ts` (multiple files)

**Fix:** Remove or replace with proper logging service.

**Effort:** Quick (1 hour)

---

### 18. Legacy Polish Fields in Types
`polishConnection`, `polishOrigin` fields in `types.ts` are from pre-multilingual era.

**Files:**
- `types.ts` (lines 56-60)

**Fix:** Remove after verifying no usage, add migration if needed.

**Effort:** Quick (check usage, 30 min)

---

## 🌍 Content Expansion

### 19. 6 Languages Missing Blog Content
Swedish, Norwegian, Danish, Czech, Greek, Hungarian have app support but no blog articles.

**Priority Order (by market size):**
1. Swedish (sv) — large market, high English proficiency
2. Czech (cs) — Central European corridor
3. Greek (el) — tourism market
4. Hungarian (hu)
5. Norwegian (no)
6. Danish (da)

**Files:**
- `/blog/src/content/articles/{lang}/` — need new directories
- Article generation scripts in `/blog/`

**Effort:** Large (content generation per language)

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

### 23. Achievements System
No achievements currently. Could add: "First 100 XP", "10-day streak", "100 words mastered", etc.

**Effort:** Large (design + DB + UI)

---

### 24. Partner Analytics Dashboard
Let tutors see learner's daily streak, weak words, time spent practicing, challenge completion rate.

**Effort:** Large (new component + APIs)

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

| Item | Time |
|------|------|
| Add `nl`, `ro`, `uk` to Learn Hub selector | 5 min |
| Play `xp-gain` sound when XP awarded | 15 min |
| Add exit confirmation for games | 30 min |
| Add keyboard shortcuts (1-4) for MC | 30 min |
| Add streak indicator in game UI | 30 min |
| Add volume slider | 45 min |
| Remove console.log statements | 30 min |
| Add reduced-motion support | 30 min |

---

## Priority Matrix

| Issue | Urgency | Impact | Effort |
|-------|---------|--------|--------|
| XP not awarded for games | 🔴 High | 🔴 High | Quick |
| Score column mismatch | 🔴 High | 🔴 High | Medium |
| Learn Hub missing langs | 🔴 High | 🟡 Medium | Quick |
| Verb Mastery Polish-only | 🟡 Medium | 🔴 High | Medium |
| TTS missing in games | 🟡 Medium | 🔴 High | Medium |
| Component splitting | 🟢 Low | 🔴 High | Large |
| SRS implementation | 🟢 Low | 🔴 High | Large |
| Mobile app deployment | 🟢 Low | 🔴 High | Large |

---

*This roadmap is a living document. Update as items are completed or priorities shift.*
