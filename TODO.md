## Current Sprint - Post-Merge Cleanup

### 🎯 Phase 1: Clean Up (This Week)

#### 1. TTS in Games 🔊
Games have no audio pronunciation - users can't hear words while practicing.

**Files:** `FlashcardGame.tsx`, `PlayQuizChallenge.tsx`
**Fix:** Add speaker icon buttons that call `speak(word, targetLanguage)`
**Effort:** 1-2 hours

#### 2. Split Giant Components 📦
- `FlashcardGame.tsx` — 2,321 lines 😱
- `ChatArea.tsx` — 1,877 lines
- `TutorGames.tsx` — 1,355 lines

**Target structure:**
```
FlashcardGame/
  ├── index.tsx (orchestration)
  ├── VerbMastery.tsx
  ├── AIChallenge.tsx
  ├── TypeIt.tsx
  ├── MultipleChoice.tsx
  └── hooks/useScores.ts
```

---

### 🎯 Phase 2: Major Features (Next)

#### 3. XP System Overhaul ⭐
- XP not awarded for games (critical bug)
- Levels don't mean anything
- No streak rewards

#### 4. Verb System + Verb Mastery Game 🇵🇱→🌍
- Currently Polish-only
- Add full conjugation support for all languages
- New dedicated Verb Mastery game mode

#### 5. Curriculum/Tutor Guidance 📚
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

## ✅ Recently Completed (Jan 27)

### Security & Analytics Release
- [x] Free tier (25 chats + limited voice)
- [x] Promo codes for creators
- [x] GA4 analytics funnel (signup → onboarding → paywall → checkout)
- [x] Password reset & account settings
- [x] Blog translations (12 languages: en, es, fr, de, it, pt, pl, ru, tr, nl, ro, uk)
- [x] Blog + app unified in same GA4 property
- [x] Verb conjugations fix
- [x] Onboarding words to Love Log
- [x] Analytics for returning users
- [x] CTA copy: "Speak their language, touch their heart"
- [x] Learn Hub: added Dutch, Romanian, Ukrainian

---

## Backlog

### Master Vocabulary Bank
See ROADMAP.md section "E. Master Vocabulary Bank (Cost Optimization)"
Pre-computed vocabulary to reduce AI costs and improve response times.

### Creator/Affiliate Program
See ROADMAP.md section "F. Creator/Affiliate Program"
10% commission for referrals.
