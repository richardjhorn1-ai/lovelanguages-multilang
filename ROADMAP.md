# Love Languages - Product Roadmap

**Updated:** January 10, 2026
**Status:** 🚀 LIVE at lovelanguages.xyz

A language learning app for couples where one partner learns their loved one's native language. Every word learned is a gift of love.

---

## Completed Phases

### Phase 1: Core Chat ✅
- ASK mode (quick Q&A) and LEARN mode (structured lessons)
- Custom markdown rendering (tables, drills, culture notes)
- Verb teaching with 6 conjugations

### Phase 2: Streaming ✅
- Live text streaming from Gemini
- Smooth typing animation

### Phase 3: Voice Mode ✅
- Real-time voice conversations via Gemini Live API
- Voice output with different personalities per mode
- Transcripts saved to chat history

### Phase 4: Love Log ✅
- Real-time vocabulary extraction from chat
- Complete word data (conjugations, gender, examples)
- Voice mode vocabulary extraction

### Phase 5: Play Section ✅
- Flashcards, Multiple Choice, Type It, Quick Fire
- Verb Mastery Game
- Conversation Practice (8 scenarios + custom)
- AI Challenge Mode (5 modes, streak-based mastery)

### Phase 5.5: AI Challenge ✅
- Weakest Words, Mixed Gauntlet, Romantic Phrases, Least Practiced, Review Mastered
- Streak-based mastery (5 correct = learned)
- Mastery badges in Love Log

### Phase 6: Partner Dashboard ✅
- View partner's progress and struggling words
- Send quiz challenges and Love Packages
- Conversation starters and encouragement

### Phase 8: Codebase Cleanup ✅ (14/16)
- Dead code removal, debug flags, API standardization
- Auth logging, theme fixes, bug fixes
- Profile photo upload

**Deferred:** Onboarding theming (8.7), Audio feedback (8.11)

### Phase 10: Payments ✅
- Stripe subscriptions (Standard $19/mo, Unlimited $39/mo)
- Partner subscription sharing
- Usage limits by tier

### Phase 11: Security ✅
- Rate limiting via subscription tiers
- Input validation, CORS, RLS fixes
- Error sanitization

### Phase 13: Legal ✅
- Privacy Policy, Terms of Service
- GDPR data export and deletion

---

## In Progress

### Phase 9: Integration Testing ⏳
Manual testing of user journeys as issues arise. See `docs/PHASE_9_TEST_CHECKLIST.md`.

---

## Planned

### Phase 7: Mobile PWA
- Add to home screen
- Offline flashcard practice
- Push notifications for daily practice
- Mobile-optimized UI

### Phase 12: Scale Resilience
- Gemini/Gladia cost monitoring
- Connection pooling
- Bundle size optimization
- Monitoring setup (Sentry, Vercel Analytics)

---

## Future Ideas

- **Milestone celebrations** - "They learned 100 words!" notifications
- **Achievement badges** - Gamification rewards
- **Surprise suggestions** - Contextual romantic phrase recommendations

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Tailwind |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini (chat, voice, extraction) |
| Speech | Gladia (Listen Mode transcription) |
| Payments | Stripe |
| Voice | Gemini Live API |

---

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Development guidance |
| `FINAL_PHASES.md` | Launch status and checklist |
| `TROUBLESHOOTING.md` | Solved issues reference |
| `DESIGN.md` | UI/UX guidelines |
| `docs/AI_INTEGRATION_GUIDE.md` | AI implementation details |
| `docs/SYSTEM_PROMPTS.md` | AI prompt documentation |
