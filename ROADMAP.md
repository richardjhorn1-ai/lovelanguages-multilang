# Love Languages - Development Roadmap

**Last Updated:** January 2025  
**Project:** Love Languages Multilang

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
