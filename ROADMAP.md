# Love Languages - Product Roadmap

> **For current status and multi-language transformation details, see `ML_MASTER_PLAN.md`**

A language learning app for couples where one partner learns their loved one's native language. Every word learned is a gift of love.

---

## Supported Languages (18)

| Tier | Languages |
|------|-----------|
| Global | **English** (can be native OR target) |
| Romance | Spanish, French, Italian, Portuguese, Romanian |
| Germanic | German, Dutch, Swedish, Norwegian, Danish |
| Slavic | Polish, Czech, Russian, Ukrainian |
| Other | Greek, Hungarian, Turkish |

> Any language can be **native** (AI explains in this) or **target** (what you're learning).

---

## Completed Phases (Historical)

### Polish-Only Era

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Core Chat (ASK/LEARN modes) | ✅ |
| 2 | Streaming Responses | ✅ |
| 3 | Voice Mode (Gemini Live) | ✅ |
| 4 | Love Log & Vocabulary | ✅ |
| 5 | Play Section (5 game modes) | ✅ |
| 5.5 | AI Challenge Mode | ✅ |
| 6 | Partner Dashboard | ✅ |
| 8 | Codebase Cleanup | ✅ |
| 10 | Stripe Payments | ✅ |
| 11 | Security Hardening | ✅ |
| 13 | Legal & Compliance | ✅ |

### Multi-Language Transformation

| Phase | Description | Status |
|-------|-------------|--------|
| ML-1 | Foundation Files | ✅ |
| ML-2 | Database & Backend APIs | ✅ |
| ML-3 | Type System | ✅ |
| ML-4 | Frontend Components | ✅ |
| ML-5 | Scenarios & Content | ✅ |
| ML-6 | UI Internationalization | ✅ |
| ML-7 | Blog Generator System | ✅ |
| ML-8 | Settings & Language Switcher | ✅ |
| ML-9 | Language Switcher UI | ✅ |
| ML-10 | Final Testing & Validation | ⏳ In Progress |
| ML-11 | Add Language Premium ($5.99/mo) | ⏳ Planned |

---

## Future Ideas

- **Milestone celebrations** - "They learned 100 words!" notifications
- **Achievement badges** - Gamification rewards
- **RTL language support** - Arabic, Hebrew
- **Asian languages** - Japanese, Korean, Mandarin

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
| E2E Testing | Playwright |
