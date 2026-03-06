# CLAUDE.md

Developer guidance for Claude Code when working with this repository.

## Project Overview

**Love Languages** — Multi-language learning app for couples. Built with Next.js 15, React, Supabase, Google Gemini. 18 supported languages where any can be native or target.

### Project Status

**Migration complete.** Vite+Astro dual-build fully migrated to unified Next.js 15 App Router (5 phases). The app, blog, API routes, PWA, and CI/CD all run on Next.js.

**Current focus:** Testing, bug-fixing, and hardening the implementation. Look for runtime issues, missing functionality, and regressions.

**Key Document:** `docs/archived/ML_MASTER_PLAN.md` — Source of truth for project status and architecture.

**Key Constraints:**
- `trailingSlash: true` — all URLs must use trailing slashes (enforced in `next.config.js`)
- `NEXT_PUBLIC_*` env vars for client-side, `process.env` for server-side
- `@supabase/ssr` for cookie-based auth (not localStorage)
- PersistentTabs pattern: 4 tabs stay mounted via CSS `display:none` — do not unmount on tab switch
- ISR with 24h revalidation for 13K+ blog articles
- Capacitor iOS app loads from live site via `server.url` — service worker provides offline caching
- `app/sw.ts` is excluded from tsconfig (webworker lib conflicts with DOM lib)

### Remaining Cleanup

- `.env.local` still has 3 `VITE_*` fallback vars — remove once Vercel env vars confirmed working
- `lib/supabase-blog.ts` has `VITE_*` fallbacks — remove after above
- `capacitor.config.ts` has `webDir: 'dist'` — update for Next.js if needed for local Capacitor builds
- `tests/error-boundary.test.tsx` — tests expect hardcoded English text but component uses `i18n.t()` keys
- GitHub Actions secrets need renaming: `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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
| `api-middleware.ts` | `getCorsHeaders`, `verifyAuth`, `createServiceClient`, `getSubscriptionPlan`, `checkRateLimit` | All API endpoints |
| `language-helpers.ts` | `extractLanguages`, `getProfileLanguages`, `requireLanguagePair`, `validateLanguageCode` | Language params from requests or profiles |
| `prompt-templates.ts` | `buildChatPrompt`, `buildAnswerValidationPrompt`, `buildLevelTestPrompt`, `buildEnhancedCoachPrompt` | All Gemini AI prompts |
| `schema-builders.ts` | `buildConjugationSchema`, `buildVocabularySchema`, `buildLevelTestSchema`, `buildAnswerValidationSchema` + more | Gemini structured output schemas |
| `answer-helpers.ts` | `normalizeAnswer`, `isCorrectAnswer`, `validateAnswerSmart` | Answer validation in games/challenges |
| `sanitize.ts` | `sanitizeInput`, `sanitizeHtml`, `escapeHtml` | User input sanitization |
| `logger.ts` | `logger`, `generateRequestId` | Structured logging (not console.log) |
| `date-helpers.ts` | `formatRelativeTime`, `formatShortDate`, `getDaysSince` | Date formatting |
| `array.ts` | `shuffleArray` | Array manipulation |
| `lib/tts-utils.ts` | `buildCacheLogContext` | TTS cache logging (extracted from route — Next.js routes can't export non-route functions) |

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
8. **Exporting non-route functions from route files** — Next.js route files (`app/api/**/route.ts`) only allow specific exports (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, plus config). Put shared logic in `lib/` or `utils/`
9. **Including `app/sw.ts` in tsconfig** — The service worker uses `/// <reference lib="webworker" />` which conflicts with DOM lib. It must stay in tsconfig `exclude`

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
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # Next.js production build (includes Serwist SW bundling)
npm run start            # Serve production build
npx tsc --noEmit         # TypeScript check
npm test                 # Vitest unit tests
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright E2E tests (against Vercel preview)
```

## Architecture

### API Pattern

All endpoints in `app/api/` use Next.js route handlers. Pattern: `export async function POST(request: Request)`. Every handler: CORS → auth → logic → response. See `utils/api-middleware.ts` for the standard pattern.

### Key Directories

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router (routes, layouts, pages) |
| `app/(app)/` | Authenticated app routes (home, log, play, progress, profile) |
| `app/(blog)/` | Blog routes (`/learn/`, `/compare/`, `/dictionary/`) |
| `app/api/` | Next.js API route handlers (61 endpoints) |
| `components/` | React components |
| `constants/language-config.ts` | 18 language configurations |
| `utils/` | Shared utilities (prompts, schemas, middleware, helpers) |
| `services/` | Gemini, Supabase, WebSocket clients |
| `lib/` | Blog data layer, Supabase clients, URL helpers |
| `blog/src/data/` | Blog data files (used via `@blog-data/*` tsconfig alias) |
| `data/` | Legacy redirect map (`legacy-redirects.json`) |
| `e2e/` | Playwright E2E tests (excluded from vitest) |
| `tests/` | Vitest unit tests |
| `migrations/` | SQL migrations (run manually in Supabase) |

### PWA & Service Worker

- `@serwist/next` wraps `next.config.js` — bundles `app/sw.ts` → `public/sw.js`
- SW caches Google Fonts (CacheFirst, 1yr) + Next.js pages/assets via `defaultCache`
- `public/manifest.json` — PWA manifest (standalone, portrait)
- SW is disabled in development (`process.env.NODE_ENV === "development"`)
- Capacitor iOS app gets offline support automatically via WKAppBoundDomains

### Custom Markdown Blocks

AI outputs special blocks rendered by `ChatArea.tsx`:
- `::: table` — Conjugation tables
- `::: drill` — Practice challenges
- `::: culture [Title]` — Cultural notes
- `::: slang [Title]` — Slang notes (aliases to culture card)

### User Roles

- **Students**: Ask/Learn modes, games, vocabulary tracking
- **Tutors**: Coach mode only, create challenges, send word gifts

### Key Files

| File | Purpose |
|------|---------|
| `app/(app)/layout.tsx` | Auth gates, PersistentTabs, app shell |
| `components/ChatArea.tsx` | Text/voice chat, Listen Mode |
| `components/LoveLog.tsx` | Vocabulary browser |
| `components/FlashcardGame.tsx` | 7 game modes |
| `components/Progress.tsx` | XP, levels, test history |
| `types.ts` | All TypeScript interfaces |
| `middleware.ts` | Host redirects, legacy slug redirects, auth session refresh, llms.txt headers |
| `next.config.js` | Redirects, security headers, CSP, Serwist PWA wrapper |
| `docs/archived/ML_MASTER_PLAN.md` | Source of truth for project status |
| `docs/TROUBLESHOOTING.md` | 61 solved issues |

## Testing

```bash
npm test                                                                # Vitest unit tests
npm run test:watch                                                      # Vitest watch mode
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:e2e    # E2E against preview
npx tsc --noEmit && npm run build                                       # Type check + build
```

Test accounts: `testaccount[1-8]@gmail.com` / `tester[1-8]`

**Vitest notes:**
- E2e tests (`e2e/`) are excluded from vitest — they run via Playwright only
- `@vitejs/plugin-react` is NOT used — vitest runs standalone with jsdom

## Security

### Known Issues (from security audit 2026-03-04)

| Issue | Severity | File | Status |
|-------|----------|------|--------|
| `analytics-event` uses wildcard CORS `*` | High | `app/api/analytics-event/route.ts` | Fixed — uses `getCorsHeaders()` now |
| `debug-coach` leaks diagnostics on non-prod | Medium | `app/api/debug-coach/route.ts` | Fixed — admin-only via `verifyAdminAuth()` |
| RevenueCat webhook signature validation | Medium | `app/api/webhooks/revenuecat/route.ts` | Verified — bearer token auth at lines 90-101 |
| Rate limiter fails-open when DB is down | Low | `utils/api-middleware.ts` | Fixed — `failClosed: true` on chat, tts, process-transcript |
| API routes read `NEXT_PUBLIC_*` before server vars | Low | Various API routes | Fixed — all 16 routes now prefer `SUPABASE_URL` |

### Security Strengths

- 56/61 API routes correctly use `verifyAuth()`
- 5 intentionally public routes: webhooks (2), analytics, invite validation, llms.txt
- Supabase parameterized queries throughout — no raw SQL
- DOMPurify for HTML sanitization in `ChatArea.tsx`
- Stripe webhook signature verification with idempotency
- Strong CSP, HSTS, X-Frame-Options DENY, Permissions-Policy in `next.config.js`
- Rate limiting with multi-tier subscription support

### Before Committing

- [ ] No hardcoded secrets in code or comments
- [ ] User inputs sanitized (`sanitizeInput()` from `utils/sanitize.ts`)
- [ ] Every API endpoint calls `verifyAuth(req)` first
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

Client-side (6): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_REVENUECAT_API_KEY`, `NEXT_PUBLIC_API_BASE_URL`
Server-side (19): `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GLADIA_API_KEY`, `GOOGLE_CLOUD_TTS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and more — see `.env.example`

### Blog URL Convention

**All URLs use trailing slashes.** Enforced by `trailingSlash: true` in `next.config.js`.

| Rule | Example |
|------|---------|
| Article URLs | `/learn/{native}/{target}/{slug}/` |
| Hub pages | `/learn/{native}/{target}/` |
| All internal links | Must end with `/` |
| Canonical URLs | Always trailing slash |
| Sitemap URLs | Always trailing slash |

**Use URL helpers** from `lib/blog-urls.ts` — never hardcode URL patterns:
- `canonicalUrl(pathname)` — full URL with trailing slash
- `articleUrl(native, target, slug)` — article path
- `hubUrl(native, target?)` — hub page path
- `normalizePathname(path)` — ensure trailing slash

## Cost Optimization

Gemini API is the main cost driver:

1. **Batch operations** — Never loop N API calls; use array schemas
2. **Local-first validation** — Try exact match before calling AI
3. **Limit fetching** — Use `.limit()` and `.select()` specific columns

See `docs/TROUBLESHOOTING.md` Issues #42-43.

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
| `language-switched` | `LanguagesSection` | `LoveLog`, `FlashcardGame`, `Progress`, `ChatArea`, `useGameDeck`, `useScoreTracking` | `{ languageCode }` |
| `test-completed` | `LevelTest` | `Progress` | `{ passed, score }` |

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

---

## Patterns Learned During Migration

### Next.js Route Handler Rules
- Route files (`app/api/**/route.ts`) can ONLY export: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, plus `dynamic`, `runtime`, `revalidate` config
- Any shared function must live in `lib/` or `utils/` — not in route files
- Pattern: `export async function POST(request: Request)` — no `req, res`

### TypeScript + Service Workers
- `app/sw.ts` uses `/// <reference lib="webworker" />` which replaces DOM globals
- Including it in the main tsconfig causes hundreds of "Cannot find name 'window'" errors
- Solution: add `"app/sw.ts"` to tsconfig `exclude` — Serwist compiles it separately

### Blog Data Layer
- `blog/src/data/` still exists and is actively used via `@blog-data/*` tsconfig path alias
- ~20 components import from `@blog-data/` — don't delete this directory
- URL helpers live in `lib/blog-urls.ts` (not `blog/src/lib/urls.ts`)
- Legacy redirects live in `data/legacy-redirects.json` (366 entries)

### Stale Cache After Build
- Running `npm run build` then `npm run dev` causes stale `.next` cache errors
- Fix: `rm -rf .next` before starting dev server after a production build
- Symptoms: `ENOENT: middleware-manifest.json`, `Cannot find module ./XXXX.js`

### Symlinks in public/
- `public/blog/` was originally a symlink to `blog/public/blog/` — broke when blog dir was restructured
- Now a real directory containing 1202 blog images
- Watch for symlink breakage when restructuring directories

---

## Mistakes (don't repeat these)

2026-01-25: Pushed GA4 integration and heart background fix directly to main instead of creating a branch first. Richard had to wait for rebuilds of broken code.

2026-01-25: Fixed CSP for googletagmanager.com but didn't notice the console also showed fonts.googleapis.com being blocked. Had to do two separate deploys when one would have caught both.

2026-01-25: Implemented GA4 with dynamic script loading which caused ERR_UNSAFE_REDIRECT. Should have used Google's standard script tag approach from the start.

2026-01-25: The SEO analyst reported blog dates were wrong (2026 vs 2025) but it's actually 2026. I didn't catch that the agent was confused about the current year.

2026-03-04: Exported `buildCacheLogContext` from `app/api/tts/route.ts` — Next.js build failed with "not a valid Route export field". Route files only allow specific exports. Moved to `lib/tts-utils.ts`.

2026-03-04: Deleted `blog/` directory without realizing `blog/src/data/` is still actively used by 20+ components via `@blog-data/*` tsconfig alias. Had to restore from git.

2026-03-04: Deleted `blog/public/blog/` which broke `public/blog` symlink → build failed with ENOENT. Had to restore 1202 images and replace symlink with real directory.
