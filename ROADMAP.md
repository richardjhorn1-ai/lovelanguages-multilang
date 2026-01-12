# Love Languages - Product Roadmap

**Updated:** January 12, 2026
**Status:** Multi-Language Platform (18 Languages)

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

### Phase 8: Codebase Cleanup
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
- XSS prevention with DOMPurify
- API endpoint hardening

### Phase 13: Legal
- Privacy Policy, Terms of Service
- GDPR data export and deletion

---

## Multi-Language Transformation

> **The biggest upgrade this codebase will ever see.**
> See `ML_MASTER_PLAN.md` for complete architecture details.

### Phase ML-1 through ML-6: Core Transformation ✅

All completed January 10-12, 2026:

| Phase | Description | Status |
|-------|-------------|--------|
| ML-1 | Foundation Files (language-config, prompt-templates, schema-builders) | ✅ Complete |
| ML-2 | Database & Backend APIs (18 endpoints updated) | ✅ Complete |
| ML-3 | Type System (language-agnostic interfaces) | ✅ Complete |
| ML-4 | Frontend Components (LanguageContext, all components) | ✅ Complete |
| ML-5 | Scenarios & Content (universal scenarios, cultural adaptations) | ✅ Complete |
| ML-6 | UI Internationalization (react-i18next, 18 language translations) | ✅ Complete |
| ML-6.X | Bug Fixes (12 hardcoding issues resolved) | ✅ Complete |

### Phase ML-7: Blog Generator System ⏳

Make the Astro blog multi-language aware:
- Update article generator to accept language parameters
- Add `--language` CLI flag to generation script
- VocabCard component backward compatibility

### Phase ML-8: Settings & Language Switcher ⏳

- Language switcher in settings
- Profile language preferences display
- Active language switching for premium users

### Phase ML-9: Premium Multi-Language ⏳

- +$5/language/month add-on
- Language unlocking via Stripe
- Multi-language purchase flow

### Phase ML-10: Final Testing ⏳

Test matrix across 6 representative language pairs.

---

## SEO & Content (From Original Repo)

### Blog System ✅
- Astro static site at `/learn`
- 74 SEO-optimized articles
- Article generator with Claude API

### SEO Tools ✅
- Name Day Finder (70+ Polish names)
- Polish Dictionary (109 words)
- Comparison landing pages (vs Duolingo, vs Babbel)

### Content Infrastructure ✅
- Category filters on blog listing
- Internal linking with Related Articles
- AI-generated hero images

---

## Supported Languages (18 Total)

| Tier | Languages |
|------|-----------|
| Global | **English** (can be native OR target) |
| Romance | Spanish, French, Italian, Portuguese, Romanian |
| Germanic | German, Dutch, Swedish, Norwegian, Danish |
| Slavic | Polish, Czech, Russian, Ukrainian |
| Other | Greek, Hungarian, Turkish |

> Any language can be **native** (AI explains in this) or **target** (what you're learning).

---

## Future Phases

### Phase 7: Mobile PWA
- Add to home screen
- Offline flashcard practice
- Push notifications for daily practice
- Mobile-optimized UI

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
- **RTL language support** - Arabic, Hebrew
- **Asian languages** - Japanese, Korean, Mandarin (different grammar systems)

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
| Blog | Astro (static site generation) |
| i18n | react-i18next |

---

## Documentation

| File | Purpose |
|------|---------|
| `ML_MASTER_PLAN.md` | Multi-language transformation (source of truth) |
| `STATUS.md` | Current project status |
| `CLAUDE.md` | Development guidance |
| `TROUBLESHOOTING.md` | Solved issues reference |
| `DESIGN.md` | UI/UX guidelines |
| `SEO.md` | Blog SEO work tracking |
| `docs/AI_INTEGRATION_GUIDE.md` | AI implementation details |
| `docs/SYSTEM_PROMPTS.md` | AI prompt documentation |
