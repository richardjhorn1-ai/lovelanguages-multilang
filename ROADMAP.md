# Love Languages - Product Roadmap

**Updated:** January 10, 2026
**Status:** Transforming to Multi-Language Platform

A language learning app for couples where one partner learns their loved one's native language. Every word learned is a gift of love.

---

## Completed Phases (Polish-Only Era)

### Phase 1: Core Chat
- ASK mode (quick Q&A) and LEARN mode (structured lessons)
- Custom markdown rendering (tables, drills, culture notes)
- Verb teaching with conjugations

### Phase 2: Streaming
- Live text streaming from Gemini
- Smooth typing animation

### Phase 3: Voice Mode
- Real-time voice conversations via Gemini Live API
- Voice output with different personalities per mode
- Transcripts saved to chat history

### Phase 4: Love Log
- Real-time vocabulary extraction from chat
- Complete word data (conjugations, gender, examples)
- Voice mode vocabulary extraction

### Phase 5: Play Section
- Flashcards, Multiple Choice, Type It, Quick Fire
- Verb Mastery Game
- Conversation Practice (8 scenarios + custom)
- AI Challenge Mode (5 modes, streak-based mastery)

### Phase 6: Partner Dashboard
- View partner's progress and struggling words
- Send quiz challenges and Love Packages
- Conversation starters and encouragement

### Phase 8: Codebase Cleanup (14/16)
- Dead code removal, debug flags, API standardization
- Auth logging, theme fixes, bug fixes
- Profile photo upload

### Phase 10: Payments
- Stripe subscriptions (Standard $19/mo, Unlimited $39/mo)
- Partner subscription sharing
- Usage limits by tier

### Phase 11: Security
- Rate limiting via subscription tiers
- Input validation, CORS, RLS fixes
- Error sanitization

### Phase 13: Legal
- Privacy Policy, Terms of Service
- GDPR data export and deletion

---

## Multi-Language Transformation

> **The biggest upgrade this codebase will ever see.**
> See `MULTILANGUAGE_TRANSFORMATION.md` for complete architecture details.

### Phase ML-1: Foundation (Current)
- [x] Create transformation planning document
- [x] Create new repo (lovelanguages-multilang)
- [x] Update documentation for new direction
- [ ] Create `constants/language-config.ts` with all 15 languages
- [ ] Create `utils/prompt-templates.ts` with template functions
- [ ] Add database columns (with 'pl' defaults)
- [ ] Create `user_languages` table

### Phase ML-2: Backend Refactoring
- [ ] Update all API endpoints to accept `languageCode`
- [ ] Refactor AI prompts to use templates
- [ ] Update validation logic per language
- [ ] Rename `/api/polish-transcript` to `/api/process-transcript`
- [ ] Language-aware diacritic handling

### Phase ML-3: Type System
- [ ] Refactor `types.ts` field names (polish -> word)
- [ ] Add language-specific grammar interfaces
- [ ] Update `OnboardingData` to be generic
- [ ] Create `TranslationDirection` type (replace polish_to_english)

### Phase ML-4: Frontend Components
- [ ] Add language selector to onboarding
- [ ] Refactor `FlashcardGame.tsx` direction enums
- [ ] Update all UI copy to use language config
- [ ] Refactor onboarding steps to be language-agnostic
- [ ] Language flag display throughout app

### Phase ML-5: Scenarios & Content
- [ ] Update conversation scenarios with cultural adaptations
- [ ] Create romantic phrases for each language
- [ ] Level test examples per language
- [ ] TTS voice configuration per language

### Phase ML-6: Premium Multi-Language
- [ ] Implement language switcher in settings
- [ ] Add multi-language purchase flow (+$5/language/month)
- [ ] Track per-language progress separately
- [ ] Build language selection UI
- [ ] Update pricing page

---

## Supported Languages (Target: 15+)

| Tier | Languages |
|------|-----------|
| Romance | Spanish, French, Italian, Portuguese, Romanian |
| Germanic | German, Dutch, Swedish, Norwegian, Danish |
| Slavic | Polish, Czech, Russian, Ukrainian |
| Other | Greek, Hungarian, Turkish |

---

## Post-Transformation Phases

### Phase 7: Mobile PWA
- Add to home screen
- Offline flashcard practice
- Push notifications for daily practice
- Mobile-optimized UI

### Phase 9: Integration Testing
Manual testing of user journeys across all languages.

### Phase 12: Scale Resilience
- Gemini/Gladia cost monitoring per language
- Connection pooling
- Bundle size optimization
- Monitoring setup (Sentry, Vercel Analytics)

---

## Future Ideas

- **Milestone celebrations** - "They learned 100 words!" notifications
- **Achievement badges** - Gamification rewards
- **Surprise suggestions** - Contextual romantic phrase recommendations
- **Language pairs beyond English** - e.g., Spanish -> French
- **RTL language support** - Arabic, Hebrew

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
| `MULTILANGUAGE_TRANSFORMATION.md` | Multi-language architecture (source of truth) |
| `CLAUDE.md` | Development guidance |
| `TROUBLESHOOTING.md` | Solved issues reference |
| `DESIGN.md` | UI/UX guidelines |
| `docs/AI_INTEGRATION_GUIDE.md` | AI implementation details |
| `docs/SYSTEM_PROMPTS.md` | AI prompt documentation |
