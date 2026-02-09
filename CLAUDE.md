# CLAUDE.md

Developer guidance for Claude Code when working with this repository.

## Project Overview

**Love Languages** — Multi-language learning app for couples. Built with React, Supabase, Google Gemini. 18 supported languages where any can be native or target.

**Key Document:** `docs/archived/ML_MASTER_PLAN.md` — Source of truth for project status and architecture.

## Agent Rules

**CRITICAL: Read this section before making any changes.**

### Requirements First

For complex or ambiguous tasks, confirm **goal, constraints, and non-goals** before writing code. Ask clarifying questions up front — don't assume. This prevents wasted work and context-loss rework.

### Session Handoff

Context does not persist between sessions. When resuming work that references a "previous session" or "earlier conversation," ask to clarify the specific goal and any decisions made. Use `/session-summary` at end of sessions to capture context for next time.

### Debugging

**Get error logs first.** Ask for actual error messages/logs before speculating about causes. Don't guess — diagnose. Use `/debug` for structured workflow.

**For mobile/simulator tasks:** Default to simulator testing unless user explicitly requests physical device.

### Parallel Agents

Use Task sub-agents for independent, parallelizable work (audits, multi-file searches, research). Don't parallelize dependent tasks. Don't duplicate work a sub-agent is already doing.

### Shared Utilities — USE, DON'T COPY

These utilities exist in `utils/`. **Import them, never copy the code:**

| File | Key Exports | Use For |
|------|-------------|---------|
| `api-middleware.ts` | `setCorsHeaders`, `verifyAuth`, `createServiceClient`, `getSubscriptionPlan`, `checkRateLimit` | All API endpoints |
| `language-helpers.ts` | `extractLanguages`, `getProfileLanguages`, `requireLanguagePair`, `validateLanguageCode` | Language params from requests or profiles |
| `prompt-templates.ts` | `buildChatPrompt`, `buildAnswerValidationPrompt`, `buildLevelTestPrompt`, `buildEnhancedCoachPrompt` | All Gemini AI prompts |
| `schema-builders.ts` | `buildConjugationSchema`, `buildVocabularySchema`, `buildLevelTestSchema`, `buildAnswerValidationSchema` + more | Gemini structured output schemas |
| `answer-helpers.ts` | `normalizeAnswer`, `isCorrectAnswer`, `validateAnswerSmart` | Answer validation in games/challenges |
| `sanitize.ts` | `sanitizeInput`, `sanitizeHtml`, `escapeHtml` | User input sanitization |
| `logger.ts` | `logger`, `generateRequestId` | Structured logging (not console.log) |
| `date-helpers.ts` | `formatRelativeTime`, `formatShortDate`, `getDaysSince` | Date formatting |
| `array.ts` | `shuffleArray` | Array manipulation |

### Language Parameters

Use the centralized helpers — never manual fallbacks like `|| 'pl'` or `|| 'en'`.

| Context | Use This |
|---------|----------|
| Frontend (React) | `useLanguage()` from `context/LanguageContext` |
| API — from request body | `extractLanguages(req.body)` from `utils/language-helpers` |
| API — from user profile | `getProfileLanguages(supabase, userId)` from `utils/language-helpers` |
| API — strict validation | `requireLanguagePair(target, native)` — throws on invalid |

**Intentional exceptions** (use stored record language, not profile):
`submit-level-test`, `submit-challenge`, `complete-word-request`, `unlock-tense`, `complete-invite`

### Common Mistakes — DO NOT DO

1. **Copying validation** — Import from `utils/answer-helpers.ts`, never local copies
2. **Manual language fallbacks** — Use `getProfileLanguages()` or `extractLanguages()`
3. **Looping API calls** — Never `for (item) { await callGemini(item) }` — use batch schemas
4. **Direct Supabase imports** — Use `createServiceClient()` from api-middleware (22 files still import directly as tech debt — don't add more)
5. **Skipping auth** — Every API must call `verifyAuth(req)` first
6. **console.log** — Use `logger` from `utils/logger.ts` instead
7. **Creating unnecessary files** — Check if shared utilities already exist

## Skills & Commands

| Command | Type | Purpose |
|---------|------|---------|
| `/debug` | Command | Structured debugging workflow — gather evidence, trace, diagnose, fix |
| `/audit` | Command | Codebase audit (security, pattern compliance, or full) with parallel agents |
| `/session-summary` | Command | End-of-session context capture for handoff |
| `/design` | Skill | UI/UX design system — colors, typography, components, mobile, motion |
| `/remotion-best-practices` | Skill | Remotion video creation best practices |

## Quick Commands

```bash
npm run dev              # Vite dev server (localhost:5173)
vercel dev               # Full stack with APIs (localhost:3000)
npx tsc --noEmit         # TypeScript check
npm run build            # Production build
npm run test:e2e         # Playwright E2E tests
```

## Architecture

### API Pattern

All endpoints accept `targetLanguage` and `nativeLanguage`. Every handler: CORS → auth → logic → response. See `utils/api-middleware.ts` for the standard pattern.

### Key Directories

| Path | Purpose |
|------|---------|
| `api/` | Vercel serverless functions |
| `components/` | React components |
| `constants/language-config.ts` | 18 language configurations |
| `utils/` | Shared utilities (prompts, schemas, middleware, helpers) |
| `services/` | Gemini, Supabase, WebSocket clients |
| `blog/` | Astro static site for SEO |
| `e2e/` | Playwright E2E tests |
| `migrations/` | SQL migrations (run manually in Supabase) |

### Vercel Serverless Limitation

API files cannot import from sibling directories. Shared code goes in `utils/` or `services/`.

### Custom Markdown Blocks

AI outputs special blocks rendered by `ChatArea.tsx`:
- `::: table` — Conjugation tables
- `::: drill` — Practice challenges
- `::: culture [Title]` — Cultural notes
- `::: slang [Title]` — Slang notes (aliases to culture card)

### User Roles

- **Students**: Ask/Learn modes, games, vocabulary tracking
- **Tutors**: Coach mode only, create challenges, send word gifts

### Key Files & Docs

| File | Purpose |
|------|---------|
| `App.tsx` | Routes, auth, PersistentTabs |
| `ChatArea.tsx` | Text/voice chat, Listen Mode |
| `LoveLog.tsx` | Vocabulary browser |
| `FlashcardGame.tsx` | 7 game modes |
| `Progress.tsx` | XP, levels, test history |
| `types.ts` | All TypeScript interfaces |
| `docs/archived/ML_MASTER_PLAN.md` | Source of truth for project status |
| `TROUBLESHOOTING.md` | 61 solved issues |
| `docs/SYSTEM_PROMPTS.md` | AI prompt documentation |

## Testing

```bash
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:e2e  # Against preview
npm run test:e2e:ui                                                     # Interactive
npx tsc --noEmit && npm run build                                       # Type check + build
```

Test accounts: `testaccount[1-6]@gmail.com` / `tester[1-6]`

## Cost Optimization

Gemini API is the main cost driver:

1. **Batch operations** — Never loop N API calls; use array schemas
2. **Local-first validation** — Try exact match before calling AI
3. **Limit fetching** — Use `.limit()` and `.select()` specific columns

See `TROUBLESHOOTING.md` Issues #42-43.

## Component & State Reference

### Monster Components — Handle With Care

High state complexity. Changes require thorough testing:

| Component | useState | Lines | Risk |
|-----------|----------|-------|------|
| `ChatArea.tsx` | 39 | ~2,000 | High |
| `FlashcardGame.tsx` | 24 | 1,372 | High |
| `TutorGames.tsx` | 24 | 923 | High |
| `Hero.tsx` | 18 | 1,464 | Medium |

### Event System

| Event | Dispatched By | Listened By | Payload |
|-------|---------------|-------------|---------|
| `dictionary-updated` | `ChatArea`, `WordGiftLearning`, `Onboarding` | `LoveLog`, `ChatArea` | `{ count, source? }` |
| `language-switched` | `LanguagesSection` | `LoveLog`, `FlashcardGame`, `Progress`, `useGameDeck`, `useScoreTracking` | `{ languageCode }` |

### localStorage Keys

| Key | Purpose | Set By |
|-----|---------|--------|
| `preferredTargetLanguage` | Target language | `App`, `Hero`, `LanguagesSection` |
| `preferredNativeLanguage` | Native language | `App`, `Hero` |
| `preferredLanguage` | Legacy fallback (read-only) | Not set (legacy) |
| `intended_role` | student/tutor | `LoginForm`, `Hero`, `RoleSelection` |
| `THEME_STORAGE_KEY` | Light/dark theme | `services/theme.ts` |
| `MUTE_STORAGE_KEY` | Audio mute | `services/sounds.ts` |
| `HAPTICS_STORAGE_KEY` | Haptic toggle | `services/haptics.ts` |

`LanguageContext` reads from Supabase profile, not localStorage. localStorage is for pre-login preferences and service settings.

### PersistentTabs

Tabs stay mounted via CSS (`display: none`) rather than unmounting. All tabs initialize on first load, event listeners in hidden tabs still fire, state persists across tab switches.

### Known Security Gap

`api/analytics-event.ts` — bypasses middleware entirely. No CORS, no auth, direct Supabase import. Needs refactoring.

## Security & Git Workflow

### Before Committing

- [ ] No hardcoded secrets in code or comments
- [ ] User inputs sanitized (`sanitizeInput()` from `utils/sanitize.ts`)
- [ ] Every API endpoint calls `verifyAuth(req)`
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

### Before Pushing

- [ ] NOT on `main` — create feature branch first
- [ ] `git diff` looks correct, no debug code
- [ ] Change verified working (browser, console, network)

### Git Workflow

- **ONE branch per feature/session** — don't create branches for every small fix
- **Batch commits** — commit locally, push once when ready
- **Push sparingly** — each push triggers a Vercel build
- **Consolidate** — related fixes go in one push

### Environment Variables

Client-side: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
Server-side: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GLADIA_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### Blog URL Convention

**All URLs use trailing slashes.** This is enforced by `vercel.json` (`trailingSlash: true`).

| Rule | Example |
|------|---------|
| Article URLs | `/learn/{native}/{target}/{slug}/` |
| Hub pages | `/learn/{native}/{target}/` |
| All internal links | Must end with `/` |
| Canonical URLs | Always trailing slash |
| Sitemap URLs | Always trailing slash |

**Use `blog/src/lib/urls.ts`** for URL building — never hardcode URL patterns in templates:
- `canonicalUrl(pathname)` — full URL with trailing slash
- `articleUrl(native, target, slug)` — article path
- `hubUrl(native, target?)` — hub page path
- `normalizePathname(path)` — ensure trailing slash

**Never hardcode URL patterns** like `` `https://www.lovelanguages.io${Astro.url.pathname}` ``. Use the helper instead.

---

## Mistakes (don't repeat these)

2026-01-25: Pushed GA4 integration and heart background fix directly to main instead of creating a branch first. Richard had to wait for rebuilds of broken code.

2026-01-25: Fixed CSP for googletagmanager.com but didn't notice the console also showed fonts.googleapis.com being blocked. Had to do two separate deploys when one would have caught both.

2026-01-25: Implemented GA4 with dynamic script loading which caused ERR_UNSAFE_REDIRECT. Should have used Google's standard script tag approach from the start.

2026-01-25: The SEO analyst reported blog dates were wrong (2026 vs 2025) but it's actually 2026. I didn't catch that the agent was confused about the current year.
