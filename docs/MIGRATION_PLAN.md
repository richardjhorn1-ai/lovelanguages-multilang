# Next.js 15 Migration Plan — Love Languages

## Context

Love Languages (lovelanguages.io) is a multi-language learning app for couples. Currently running a dual-build architecture: **Vite 5 React SPA** (247 source files) + **Astro 5 SSR blog** (29 components, 22 pages, 14 data files) overlaid via file copy. This causes recurring deployment issues, duplicated config, analytics duplication, font divergence, and SEO/routing headaches. The migration to Next.js 15 App Router unifies everything into a single build.

**Branch:** `feature/nextjs-migration` (created from `origin/main` at `d12e5ccd`)

### Scope Summary (Verified by 9 Exploration Agents)

| Metric | Actual Count |
|--------|-------------|
| App source files | ~247 |
| API route files | **59** (13,915 lines total) |
| Blog Astro components | **29** (7 need `'use client'`, 22 can be RSC) |
| Blog page files | **22** |
| Blog data files | **14** (~1.1MB total) |
| Blog lib files | **4** |
| Files with `react-router-dom` | **24** |
| Files needing `'use client'` | **~114** |
| Files using `window.*` | **30** |
| Files using `document.*` | **23** |
| Files using `localStorage` | **22** |
| Files importing Supabase client | **38** |
| `vercel.json` redirects | **446** |
| Blog legacy redirects | **366** |
| Total redirects to migrate | **812+** |
| Environment variables | **25** (6 client-side, 19 server-side) |
| Playwright e2e tests | **71** (4 files) |
| Vitest unit tests | **7** files |
| API middleware functions | **19** exported (941 lines) |
| PersistentTabs state | **109** useState + **19** useRef |

### Decisions Made

| Decision | Choice |
|----------|--------|
| PersistentTabs | Keep-mounted pattern (CSS display toggling in client layout) |
| i18n | Keep `i18next` + `react-i18next` (not `next-intl`) |
| Capacitor | Must remain functional for iOS builds |
| Blog rendering | ISR with 24-hour revalidation for 13K+ articles |
| PWA/Offline | Must work from day 1 (`@serwist/next`) |
| API routes | Convert Vercel serverless to Next.js route handlers |
| Migration approach | Incremental, phase by phase — build must pass after each phase |
| Trailing slashes | `trailingSlash: true` in next.config |
| Env vars | `VITE_*` → `NEXT_PUBLIC_*` for client-side |
| Supabase auth | Migrate to `@supabase/ssr` with cookie-based auth |
| Blog fonts | Unify to app fonts (Nunito + Manrope) or keep dual fonts with conditional loading |

### Difficulty Ratings (from Deep Analysis)

| Problem | Difficulty | Why |
|---------|-----------|-----|
| PersistentTabs | **VERY HARD** | 109 useState + 19 useRef, active WebSocket connections (Gemini Live, Gladia), no clean Next.js equivalent |
| Supabase Auth | **HARD** | 38 files, needs `@supabase/ssr`, cookie-based auth, server+client split |
| API Middleware | **HARD** | 941 lines, 19 functions, custom `VercelRequest/VercelResponse` → web standard `Request/NextResponse` |
| Subscription Gating | **HARD** | 7-condition access check, runs on every app route, currently in `App.tsx` |
| PWA/Offline | **HARD** | `vite-plugin-pwa` → `@serwist/next`, no SPA navigateFallback equivalent |
| Redirects | **MEDIUM** | 812+ total, some need middleware (dynamic), some can be next.config |
| Blog Migration | **MEDIUM-HARD** | 29 components, 22 pages, 4 JSON-LD schemas, hreflang, 1.1MB data files |

---

## Phase 0: Update CLAUDE.md for Migration Branch

**Why:** Any agent (or future session) working on this branch needs Next.js context, not Vite/Astro.

**File:** `CLAUDE.md` (root)

**Approach:** Keep it simple. Don't try to document the entire migration upfront. Write what an agent needs to know RIGHT NOW to start Phase 1, then update CLAUDE.md at each sanity check as the migration progresses.

**Initial CLAUDE.md should cover:**
- One-line: "This branch is migrating from Vite+Astro to Next.js 15 App Router"
- Current state: which phase we're in, what works, what doesn't yet
- Quick commands: `next dev`, `next build` (replacing Vite commands)
- Key constraint reminders: trailing slashes, `NEXT_PUBLIC_*` env vars, `@supabase/ssr` for auth
- Link to this plan file for full context
- Keep existing CLAUDE.md sections that are still relevant (utils, language params, event system, etc.)

**NOT in initial CLAUDE.md** (add during later sanity checks):
- Full directory structure (it's changing — document once stable)
- Component patterns (discover and document as we go)
- Blog architecture (document when Phase 4 complete)

**CLAUDE.md will be updated at every sanity check** to reflect current reality.

---

## Phase 1: Next.js Foundation Setup [COMPLETED]

**Goal:** Next.js boots, Tailwind works, TypeScript compiles. No features yet.

**Status:** Complete. Next.js 15.5.12 installed. Build passes (~2s). Dev server boots (~1.3s). HTTP 200 on `/`.

**Lessons Learned:**
- `vite/client` types must remain in tsconfig during incremental migration — otherwise all 247 source files using `import.meta.env` fail type checking
- `vite.config.ts`, `vitest.config.ts`, `promo-video/` all need explicit tsconfig exclude — Next.js type-checks everything in `include` patterns
- Redirects (445 static) cleanly imported from JSON file — keeps `next.config.js` readable
- 1 conditional redirect (story.lovelanguages.io host-based) deferred to middleware (Phase 2)
- 8 `vercel.json` rewrites not migrated — they're SPA fallbacks that become unnecessary with Next.js routing

### 1.1 Install Dependencies

- Add: `next@15`, `@supabase/ssr`, `@serwist/next`
- Keep ALL existing deps (React 18, Supabase, Stripe, i18next, Capacitor, etc.)
- Remove: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` (keep files until Phase 5 cleanup)
- Remove: `@mdx-js/rollup` (0 MDX files exist in project)
- Do NOT remove `@vitejs/plugin-react` from devDeps yet (Vitest still needs it until Phase 6)

### 1.2 Create `next.config.js`

- `trailingSlash: true`
- Migrate redirects from `vercel.json` — **446 redirects** (static ones as `redirects()`, dynamic ones need middleware)
- Migrate **8 rewrites** from `vercel.json` (SPA fallback rewrites become unnecessary)
- Migrate **3 header rules** from `vercel.json` (cache-control for `/learn/` and `/compare/`, security headers with CSP)
- `images.remotePatterns` for `wfunhsvacrhirucqlyov.supabase.co`
- `transpilePackages` for any ESM-only deps
- PostCSS config for Tailwind v4

### 1.3 Update `tsconfig.json`

- Change `"jsx": "react-jsx"` → `"preserve"` for Next.js
- Remove `"vite/client"` from `"types"` array
- Keep path aliases `"@/*": ["./*"]` (compatible)
- Keep `"moduleResolution": "bundler"` (compatible)
- Note: no `"strict": true` exists currently — do not add it

### 1.4 Update CSS

- `src/index.css` (624 lines): Change `#root` selector (lines 99-102) to Next.js equivalent (`#__next` or `:root`)
- Update `tailwind.config.js` content paths: remove `./index.html`, add `./app/**/*.{ts,tsx}`
- Blog has separate `tailwind.config.cjs` with different fonts (Outfit+Quicksand vs Nunito+Manrope) — plan font unification strategy

### 1.5 Create minimal `app/layout.tsx`

- Root HTML shell from `index.html`:
  - All meta tags (title, description, keywords, canonical, OG, Twitter Card, theme-color, apple-mobile-web-app)
  - Favicon/icons (SVG favicon, apple-touch-icon, mask-icon)
  - JSON-LD SoftwareApplication schema
  - Google Fonts: Nunito, Manrope, Montserrat, Inter, Quicksand, Source Sans 3
  - Blog adds: Outfit, Quicksand (already in list)
  - Analytics scripts: PostHog (`phc_xvUI...`), GA4 (`G-ZJWLDBC5QP`) with AI referral detection
- Import global CSS
- Basic metadata export

### 1.6 Create `app/page.tsx`

- Simple placeholder to verify Next.js boots

### 1.7 Update `package.json` scripts

- `"dev": "next dev"`
- `"build": "next build"`
- `"start": "next start"`
- Keep Capacitor scripts, update to use Next.js build output
- Keep `test` and `test:e2e` scripts (will update in Phase 6)

### 1.8 Verify

- `npm run dev` boots
- `npm run build` succeeds
- Page loads in browser
- No TypeScript errors

### Critical files to reference
- `vercel.json` (90KB, 2235 lines) — redirects/rewrites/headers source
- `vite.config.ts` — current build/PWA config
- `tailwind.config.js` — content paths, custom fonts, dark mode
- `tsconfig.json` — current TS config
- `index.html` — all meta, scripts, fonts, analytics to migrate
- `src/index.css` — `#root` selector, Tailwind v4 setup

---

## Phase 2: Core Infrastructure Migration

**Goal:** All services, contexts, hooks, API middleware, and Supabase auth work in Next.js.

**Current Status:** All sub-phases complete (2.1–2.7). Phase 2 sanity check passed.

### 2.1 Supabase Auth Migration (HARD — 38 files) [COMPLETED]

This is foundational — almost everything depends on auth working.

- Install `@supabase/ssr`
- Create server-side Supabase client (`lib/supabase-server.ts`) using cookies
- Create client-side Supabase client (`lib/supabase-browser.ts`) using `createBrowserClient`
- Create Next.js middleware (`middleware.ts`) for session refresh on every request
- Update all 38 files that import from `services/supabase.ts`:
  - Server components/API routes → use server client
  - Client components → use browser client
  - `supabase.auth.onAuthStateChange` (App.tsx lines 172-197) → adapt for cookie-based flow

**Status:** Complete. Created `lib/supabase-server.ts` (server client with cookies), `lib/supabase-middleware.ts` (middleware client), `middleware.ts` (session refresh). Browser client remains in `services/supabase.ts` with `'use client'`.

### 2.2 Environment Variables (25 total) [COMPLETED]

Rename in all source files:
- `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `VITE_GA4_MEASUREMENT_ID` → `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `VITE_REVENUECAT_API_KEY` → `NEXT_PUBLIC_REVENUECAT_API_KEY`
- `VITE_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL`
- 19 server-side vars unchanged (SUPABASE_SERVICE_KEY, GEMINI_API_KEY, GLADIA_API_KEY, GOOGLE_CLOUD_TTS_API_KEY, STRIPE_SECRET_KEY, etc.)
- Replace ALL `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
- Replace ALL `import.meta.env.*` (server-side) → `process.env.*`
- Update `.env.example`, `.env.local`
- Blog uses fallback pattern: `import.meta.env.VITE_* || import.meta.env.SUPABASE_*` — simplify to `process.env.*`

**Status:** Complete. All `import.meta.env` references replaced with `process.env` across services, hooks, and config files. `.env.example` updated.

### 2.3 Services (`services/*`) [COMPLETED]

Add `'use client'` to browser-only services:
- `supabase.ts` → replaced by new client/server split (2.1)
- `analytics.ts` — uses `window`, `document`
- `sounds.ts` — uses `HTMLAudioElement`
- `theme.ts` — uses `localStorage`, `document`
- `haptics.ts` — uses Capacitor bridge
- `offline-storage.ts` — uses IndexedDB
- `api-config.ts` — `apiFetch` wrapper, uses `import.meta.env`, conditionally prepends base URL for Capacitor

**Status:** Complete. 14 service files marked with `'use client'`.

### 2.4 Context Providers [COMPLETED]

Create `app/providers.tsx` — client component wrapping:
- `ThemeProvider` (from `context/ThemeContext.tsx`)
- `LanguageProvider` (from `context/LanguageContext.tsx`)
- i18next initialization (currently in `I18nSyncWrapper`, not a context provider)
- Wire into `app/layout.tsx`

**Status:** Complete. `app/providers.tsx` wraps ThemeProvider + LanguageProvider + i18n sync. Wired into `app/layout.tsx`.

### 2.5 Hooks, Constants, Types [COMPLETED]

- `hooks/*` → keep in place, add `'use client'` where using browser APIs
- `constants/*` → keep in place (static data, server-safe)
- `types.ts` → keep in place

**Status:** Complete. `'use client'` added to hooks, constants/icons.tsx, context files, and i18n/index.ts.

### 2.6 API Middleware Rewrite (HARD — 941 lines, 19 functions) [COMPLETED]

**File:** `utils/api-middleware.ts`

**Status:** Complete. Rewritten for web-standard `Request`/`NextResponse`. Key new functions: `getCorsHeaders(request)` returns Headers, `handleCorsPreflightResponse(request)` returns NextResponse for OPTIONS, `getStreamingCorsHeaders(request)` for SSE, `createErrorResponse()` returns NextResponse. Backward-compat wrappers (`setCorsHeaders`, `setStreamingCorsHeaders`, `setSecurityHeaders`) added at end of file so old `api/` routes still work during migration — remove these in Phase 5 cleanup.

**Lessons Learned:**
- Renaming exports breaks all consumers immediately — backward-compat wrappers are essential for incremental migration
- `.js` extension imports in utils worked with Vite but fail with Next.js webpack — removed all `.js` extensions from `utils/` imports

### 2.7 Convert API Routes (61 files) [COMPLETED]

Pattern change for all endpoints:
```typescript
// Old: export default function handler(req: VercelRequest, res: VercelResponse)
// New: export async function POST(request: Request) → NextResponse
```

**By category (11 groups):**

| Category | Files | Lines | Special Considerations |
|----------|-------|-------|----------------------|
| Auth | 10 | 1,827 | Cookie-based auth with `@supabase/ssr` |
| Chat/AI | 7 | 2,775 | `chat.ts` (796 lines), SSE streaming in `chat-stream.ts` |
| Games | 11 | 2,763 | `generate-level-test.ts` has `maxDuration: 60` |
| Vocabulary | 7 | 1,594 | `complete-word-request.ts` has `maxDuration: 30`, background processing |
| Subscription | 6 | 849 | Stripe checkout/portal/promos |
| Tutor | 3 | 774 | Analytics, awards, stats |
| Social | 6 | 831 | Love notes, achievements, notifications |
| Voice/Audio | 5 | 1,026 | Google Cloud TTS, ElevenLabs, Gladia, LiveKit |
| Webhooks | 2 | 818 | Stripe (raw body parsing!), RevenueCat |
| Admin | 1 | 126 | Article generation |
| Other | 2 | 321 | `analytics-event` (NO AUTH), bug reports |

**Special API features requiring careful handling:**
- **SSE streaming** (`chat-stream.ts`): Must use `ReadableStream` with Next.js route handlers
- **Raw body parsing** (`stripe-webhook.ts`): Stripe signature verification needs raw body — use `export const runtime = 'nodejs'` and read raw body
- **`maxDuration`** configs: `analyze-history` (60s), `complete-word-request` (30s), `generate-level-test` (60s) — set via `export const maxDuration = N`
- **In-memory caching** (`coach-context.ts`): Works in serverless but cache may not persist — evaluate if acceptable
- **Background processing** (`complete-word-request.ts`): `waitUntil`-style processing after response sent

**Status:** Complete. 61 route files created in `app/api/`. All conversions follow the standard pattern: imports changed to `@/` aliases, `setCorsHeaders`→`getCorsHeaders`+`handleCorsPreflightResponse`, `handler`→named exports (POST/GET/OPTIONS), `req.body`→`await request.json()`, `res.status().json()`→`NextResponse.json()`. Special cases handled: SSE streaming (ReadableStream), webhooks (raw body via `await request.text()`), edge runtime (analytics-event), admin auth (generate-article). Build verified passing.

**Lessons Learned:**
- 5 parallel agents converting ~12 files each is the sweet spot for efficiency
- Next.js route files only allow specific exports (GET, POST, OPTIONS, runtime, config, etc.) — helper functions must NOT be exported
- Both `api/` and `app/api/` can coexist during migration, but `app/api/` takes precedence for Next.js

### Verify Phase 2
- All API routes respond (test with curl/fetch)
- Auth flow works with cookie-based sessions
- No `import.meta.env` references remain
- TypeScript compiles

### Critical files
- `utils/api-middleware.ts` (941 lines) — rewrite for Next.js
- `services/supabase.ts` — replace with client/server split
- `services/api-config.ts` — update `apiFetch` for Next.js
- `context/ThemeContext.tsx`, `context/LanguageContext.tsx` — provider wrapping
- All 59 files in `api/` — convert to route handlers

---

## Phase 3: App Routes & Components (SPA Features)

**Goal:** All authenticated app features work — chat, games, log, progress, profile. PersistentTabs functional.

### 3.1 PersistentTabs Implementation (VERY HARD)

**The single hardest problem in this migration.**

Current implementation (`App.tsx` lines 51-93):
- 4 tabs (ChatArea, LoveLog, FlashcardGame, Progress) stay mounted simultaneously
- CSS `display: none/block` toggles visibility
- **109 useState + 19 useRef** across these components maintain state
- Active WebSocket connections (Gemini Live voice, Gladia transcription) must NOT disconnect on tab switch

**Next.js approach — Client layout with keep-mounted pattern:**
```
app/(app)/layout.tsx — 'use client'
  ├── Auth gate + subscription check
  ├── Navbar
  └── <div> with ALL 4 tab components always mounted
      ├── <div style={{display: pathname === '/' ? 'block' : 'none'}}><ChatArea/></div>
      ├── <div style={{display: pathname === '/log' ? 'block' : 'none'}}><LoveLog/></div>
      ├── <div style={{display: pathname === '/play' ? 'block' : 'none'}}><FlashcardGame/></div>
      └── <div style={{display: pathname === '/progress' ? 'block' : 'none'}}><Progress/></div>
```

The `page.tsx` files for these routes can be minimal (empty or metadata-only) since the layout handles rendering.

Use `usePathname()` from `next/navigation` to determine active tab. Browser URL changes but components stay mounted.

### 3.2 Auth Gate & Subscription Check

Port from `App.tsx` lines 625-649 — 7-condition access check:
1. Active subscription
2. Inherited partner access
3. Active promo
4. Free tier
5. Beta tester flag
6. Grandfathered account
7. Active trial

This runs in `(app)/layout.tsx` as client-side check. Redirect to landing if not authenticated.

### 3.3 react-router-dom Migration (24 files)

Replace across all 24 files:
- `useNavigate()` (14 files) → `useRouter()` from `next/navigation`
- `Link` component (6 files) → `Link` from `next/link` (`to` → `href`)
- `useParams()` (5 files) → `useParams()` from `next/navigation`
- `useLocation()` (4 files) → `usePathname()` + `useSearchParams()`
- `useSearchParams()` (3 files) → `useSearchParams()` from `next/navigation`
- `Navigate` component (2 files) → `redirect()` or `useRouter().push()`
- `BrowserRouter` (1 file, App.tsx) → removed entirely (Next.js has built-in routing)

Then remove `react-router-dom` from `package.json`.

### 3.4 `'use client'` Audit (~114 files)

Nearly every component uses React hooks. Add `'use client'` to all files that use:
- `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`
- Browser APIs (`window`, `document`, `localStorage`, `navigator`)
- Event handlers (`onClick`, `onChange`, etc.)

Files that can remain Server Components (no hooks, no browser APIs):
- Static display components with no interactivity
- Layout wrappers that only pass children
- Most blog components (22 of 29)

### 3.5 App Routes

**Authenticated (under `(app)` route group):**
- `app/(app)/page.tsx` — ChatArea (default tab, minimal since layout mounts it)
- `app/(app)/log/page.tsx` — LoveLog
- `app/(app)/play/page.tsx` — FlashcardGame
- `app/(app)/progress/page.tsx` — Progress
- `app/(app)/test/page.tsx` — LevelTest (not a persistent tab)
- `app/(app)/profile/page.tsx` — ProfileView (not a persistent tab)

**Public routes:**
- `app/(public)/join/[token]/page.tsx` — JoinInvite
- `app/(public)/terms/page.tsx`
- `app/(public)/privacy/page.tsx`
- `app/(public)/faq/page.tsx`
- `app/(public)/method/page.tsx`
- `app/(public)/pricing/page.tsx`
- `app/(public)/reset-password/page.tsx`

**Language landing pages:**
- `app/[lang]/page.tsx` — dynamic route for 18 languages
- `generateStaticParams()` from `SUPPORTED_LANGUAGE_CODES`

**Root page:**
- `app/page.tsx` — Landing/Hero (unauthenticated) or redirect to `/(app)` (authenticated)

### 3.6 Static HTML Pages (keep as static)

These pages in `public/` should remain as static files:
- `public/story/index.html` (51KB) — password-protected pitch/investor deck, self-contained
- `public/privacy/index.html` — standalone privacy page for Apple App Store links
- `public/terms/index.html` — standalone terms page for external links
- `public/de/`, `es/`, `fr/`, `it/`, `pl/`, `pt/` — SEO redirect pages with localized meta tags
  - These could optionally become Next.js redirects in `next.config.js`, but keeping as static works fine

### Verify Phase 3
- All 4 persistent tabs render and switch without state loss
- WebSocket connections survive tab switches
- Auth flow works end-to-end (signup, login, logout, password reset)
- All public routes render
- Language landing pages work
- No `react-router-dom` imports remain
- No hydration errors in console

### Critical files
- `App.tsx` — PersistentTabs (51-93), routes (586-687), auth (172-197), subscription check (625-649)
- `components/Navbar.tsx` — tab navigation
- All 24 files with `react-router-dom` imports

---

## Phase 4: Blog/Content Routes (Astro → Next.js)

**Goal:** All 13K+ blog articles render via ISR. 22 blog page types work. SEO preserved. Sitemaps work.

### 4.1 Port Blog Data Layer

Move to root-level `lib/`:
- `blog/src/lib/blog-api.ts` → `lib/blog-api.ts` — **15 Supabase query functions**:
  `getArticle`, `getArticlesByLangPair`, `getArticlesByNativeLang`, `getLanguagePairs`, `getNativeLanguages`, `getTargetLanguages`, `getArticlesByCategory`, `searchArticles`, `getAllSlugs`, `getArticlesByTopic`, `getTopicCounts`, `getArticleCount`, `getArticleCountsByTargetLang`, `getAlternatesByTopicId`, `getCanonicalForTopic`
- `blog/src/lib/urls.ts` → `lib/blog-urls.ts` — 6 URL helper functions
- `blog/src/lib/sanitize-content.ts` → `lib/sanitize-content.ts`
- `blog/src/lib/split-content.ts` → `lib/split-content.ts` — splits HTML at ~45% for mid-article CTA

All use server-side Supabase client. Update `import.meta.env` fallback pattern → `process.env`.

### 4.2 Port Blog Data Files (~1.1MB)

Move to `lib/blog-data/` or `data/`:
- `article-registry.json` (640KB) — article metadata index
- `comparison-features.ts` (168KB) — language comparison data
- `language-hub-data.ts` (97KB) — hub page content
- `polish-dictionary.ts` (73KB) — dictionary entries
- `ui-translations.ts` (56KB) — UI string translations
- `methodology-articles.ts` (45KB) — methodology content
- `legacy-redirects.json` (38KB) — 366 old slug mappings
- `polish-name-days.ts` (22KB) — name day data
- `language-info.ts` (12KB) — language metadata
- `navigation.ts` (5KB) — nav config
- `couples-translations.ts` (3KB)
- `topic-info.ts` (2KB)
- `couples-translations/` (18 JSON files) — per-language translations
- `couples-content/` (4 JSON files) — landing page content

### 4.3 Convert Blog Components (29 total)

**22 Server Components** (no changes needed beyond Astro→React syntax):
ArticleCard, ConjugationTable, CultureTip, FAQ, LeadMagnet, PhraseOfDay, RALLMethodologySection, Testimonials, VocabCard, DefinitionBlock, SEO, CouplesCTA, CouplesContent, CouplesFAQ, CouplesHero, CouplesTestimonials, HubArticleList, HubHero, HubLanguageGrid, HubStats, HubTopicGrid, HubCouplesCTA

**7 Client Components** (need `'use client'`):
- `CTA` — uses `gtag()` for conversion tracking
- `LanguageSelector` — interactive dropdown
- `LoveNote` — uses `gtag()`
- `NativeLanguageSelector` — navigation on selection
- `Navigation` — mobile dropdown menu
- `BlogAnalytics` — heavy JS for scroll/time/click tracking
- ArticleLayout sticky CTA script — gtag tracking

**Convert layouts:**
- `BaseLayout.astro` (278 lines) → part of `app/learn/layout.tsx`
  - Fonts: Outfit + Quicksand (blog-specific) — decide: unify with app fonts or conditional load
  - GA4 + PostHog analytics (same IDs as app — dedup)
  - AI referral traffic detection script
  - `.prose` styling system
- `ArticleLayout.astro` (630 lines) → `components/blog/ArticleLayout.tsx`
  - 4 JSON-LD schemas: BlogPosting (always), BreadcrumbList (always), HowTo (conditional), FAQPage (conditional)
  - SpeakableSpecification targeting CSS selectors
  - Hreflang tags via `topic_id` matching + x-default
  - Related articles, reverse language pair links, cross-language articles
  - Sticky mobile CTA with gtag tracking

### 4.4 Create Blog Routes (22 pages → Next.js routes)

**Article pages (ISR):**
- `app/learn/[nativeLang]/[targetLang]/[slug]/page.tsx`
  - Server Component, `revalidate = 86400` (24 hours)
  - `generateStaticParams()` for top articles, rest on-demand
  - `generateMetadata()` — title, description, OG tags, hreflang

**Hub/index pages:**
- `app/learn/page.tsx` — learn index
- `app/learn/[nativeLang]/page.tsx` — language hub (localized content from `language-hub-data.ts`)
- `app/learn/[nativeLang]/[targetLang]/page.tsx` — language pair hub
- `app/learn/[nativeLang]/couples-language-learning/page.tsx`
- `app/learn/[nativeLang]/topics/[topic]/page.tsx`

**Methodology articles (MISSED in original plan):**
- `app/learn/[nativeLang]/couples-language-learning/methodology/page.tsx` — methodology index
- `app/learn/[nativeLang]/couples-language-learning/methodology/[slug]/page.tsx` — individual articles
  - Note: methodology index uses direct Supabase queries, not `blog-api.ts`

**Compare pages (MISSED in original plan):**
- `app/compare/[nativeLang]/page.tsx` — localized comparison index (51KB page!)
- `app/compare/[nativeLang]/love-languages-vs-babbel/page.tsx` — vs Babbel
- `app/compare/[nativeLang]/love-languages-vs-duolingo/page.tsx` — vs Duolingo
- Compare also has 3 redirect pages in Astro → convert to `next.config.js` redirects

**Dictionary (MISSED in original plan):**
- `app/dictionary/page.tsx` — Polish dictionary index
- `app/dictionary/[slug]/page.tsx` — dictionary entry (uses 73KB static data)

**Tools (MISSED in original plan):**
- `app/tools/name-day-finder/page.tsx` — interactive client-side search tool (needs `'use client'`)

**Support:**
- `app/support/page.tsx`

### 4.5 Sitemaps (4 files + image sitemap)

The blog currently generates multiple sitemaps:
- `app/sitemap.ts` — main sitemap index
- Need to handle: article sitemap (13K+ URLs), hub sitemap, compare sitemap, methodology sitemap
- May need `generateSitemaps()` for pagination (Next.js convention for large sitemaps)
- Image sitemap for article images
- Canonical URL filtering logic

### 4.6 Blog Middleware / Redirects

**366 legacy slug redirects** from `blog/src/data/legacy-redirects.json`:
- Static 301 redirects → can go in `next.config.js` `redirects()`
- But 366 + 446 from vercel.json = 812+ total — test if Next.js handles this many in config, or use middleware

**2-segment to 3-segment URL migration:**
- `/learn/pl/slug/` → `/learn/en/pl/slug/` (inserts `en` as default native lang)
- Must be in Next.js middleware (dynamic logic)

**llms.txt discovery headers:**
- Blog sets `X-Robots-Tag` and `Link` headers for llms.txt on ALL responses
- Add to Next.js middleware or `next.config.js` headers

### Verify Phase 4
- Article pages render with correct content
- JSON-LD schemas present (4 types)
- Hreflang tags correct
- Hub pages render with localized content
- Methodology articles accessible
- Compare pages work
- Dictionary pages work
- Name day finder works (interactive)
- Sitemaps generate correctly
- All 812+ redirects work
- Trailing slashes on all blog URLs

### Critical files
- `blog/src/lib/blog-api.ts` — 15 Supabase queries
- `blog/src/lib/urls.ts` — URL helpers
- `blog/src/layouts/ArticleLayout.astro` (630 lines) — JSON-LD, hreflang, meta
- `blog/src/layouts/BaseLayout.astro` (278 lines) — fonts, analytics, prose styles
- All 29 components in `blog/src/components/`
- All 22 pages in `blog/src/pages/`
- All 14 data files in `blog/src/data/`
- `blog/src/middleware.ts` — 3 middleware operations

---

## Phase 5: PWA, Capacitor, CI/CD & Cleanup

**Goal:** PWA offline works, Capacitor iOS builds, CI/CD passes, tests updated, old files removed.

### 5.1 PWA with `@serwist/next` (HARD)

- Service worker registration
- Offline fallback page
- Runtime caching rules (port from `vite.config.ts`):
  - Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) — CacheFirst
  - Static assets — CacheFirst
  - API responses — NetworkFirst or StaleWhileRevalidate
- **No SPA `navigateFallback` equivalent** in Next.js:
  - Vite PWA falls back to `index.html` for all navigation
  - Next.js has per-route pages — need `navigateFallbackDenylist` approach or custom offline page
  - Blog routes (`/learn/*`) should NOT be cached for offline (server-rendered)
  - App routes should work offline via cached API responses

### 5.2 Capacitor Compatibility

- **`capacitor.config.ts`**: Change `webDir: 'dist'` → `'out'`
- Build script for iOS: `next build` (need `output: 'export'` for static export, or conditional)
  - Challenge: Next.js `output: 'export'` disables ISR, API routes, middleware
  - Solution: Capacitor iOS app uses live server URL (`https://www.lovelanguages.io`) per `ios/App/App/capacitor.config.json` → `server.url`
  - So Capacitor may NOT need static export at all — verify this
- `npx cap sync ios` must work
- Verify 7 Capacitor plugins: SignInWithApple, Filesystem, Haptics, Network, Share, StatusBar, Purchases

### 5.3 CI/CD Updates (`.github/workflows/pr-review.yml`)

Current workflow WILL BREAK. Update all 5 jobs:
- `security-scan` — may need path updates
- `type-check` — runs `npx tsc --noEmit`, should work with updated tsconfig
- `lint` — update ESLint config if needed
- `build` — change from Vite to Next.js build, update env vars:
  - `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL` in GitHub secrets
  - `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `dependency-audit` — should work as-is

### 5.4 Test Infrastructure Updates

**Playwright (71 tests, 4 files):**
- `playwright.config.ts`: Change `baseURL` from `http://localhost:5173` → `http://localhost:3000`
- Update `webServer` command from Vite to Next.js dev server
- Test content should mostly work, but verify selectors

**Vitest (7 test files):**
- `vitest.config.ts` currently uses `@vitejs/plugin-react` — Vite-specific
- Options:
  a. Keep Vitest, update config to not need Vite plugin (Vitest works standalone)
  b. Switch to Jest (more common with Next.js)
  - Recommend: Keep Vitest, just update config — less churn

### 5.5 Clean Up Old Files

After verifying ALL features work:
- Remove `vite.config.ts`
- Remove `blog/` directory entirely (all content migrated)
- Remove `index.html` (Next.js generates its own)
- Remove `blog/astro.config.mjs` and all Astro deps
- Slim `vercel.json` — most config now in `next.config.js`
- Remove from package.json: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `astro`, `@astrojs/*`
- Update `.gitignore`: add `.next/`, remove `dist/`
- Remove `src/` directory wrapper if `app/` replaces it

### Verify Phase 5
- PWA installs and provides offline functionality
- Capacitor: `npx cap sync ios` succeeds
- CI/CD: all 5 jobs pass on PR
- Playwright: 71 tests pass
- Vitest: 7 test files pass
- No old Vite/Astro files remain
- `npm run build` clean with zero warnings

### Critical files
- `vite.config.ts` (PWA/workbox config to port)
- `capacitor.config.ts` — `webDir` change
- `ios/App/App/capacitor.config.json` — server.url verification
- `.github/workflows/pr-review.yml` — CI/CD updates
- `playwright.config.ts` — port/baseURL change
- `vitest.config.ts` — remove Vite dependency

---

## Phase 6: Final Verification & QA

**Goal:** Everything works. Zero regressions. Production-ready.

### Full Checklist

**Build & Dev:**
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run dev` loads without console errors
- [ ] `npx tsc --noEmit` passes
- [ ] No hydration errors in browser console

**Auth:**
- [ ] Signup with email
- [ ] Login with email
- [ ] Login with Apple (Capacitor)
- [ ] Logout
- [ ] Password reset
- [ ] Cookie-based sessions work (no localStorage auth tokens)
- [ ] Session refresh via middleware

**App Features (PersistentTabs):**
- [ ] All 4 tabs render (Chat, Log, Play, Progress)
- [ ] Tab state persists when switching
- [ ] WebSocket connections survive tab switches
- [ ] Chat sends/receives messages (Gemini API)
- [ ] Voice chat works (Gemini Live)
- [ ] Games load and play correctly
- [ ] Level test generates and scores
- [ ] LoveLog shows vocabulary entries
- [ ] Progress page renders charts
- [ ] Profile page loads and saves

**Subscription/Access:**
- [ ] Free tier access works
- [ ] Trial flow works
- [ ] Stripe checkout works
- [ ] Subscription gating blocks premium features for free users
- [ ] Beta tester flag grants access

**Blog/Content:**
- [ ] Article pages render at `/learn/en/pl/slug/`
- [ ] Hub pages render at `/learn/en/pl/`
- [ ] Methodology articles at `/learn/en/couples-language-learning/methodology/`
- [ ] Compare pages at `/compare/en/`
- [ ] Dictionary pages at `/dictionary/`
- [ ] Name day finder at `/tools/name-day-finder/`
- [ ] JSON-LD schemas present (BlogPosting, BreadcrumbList, HowTo, FAQPage)
- [ ] Hreflang tags correct on articles
- [ ] ISR revalidation works (stale page serves, revalidates in background)

**SEO & Routing:**
- [ ] Sitemaps generate at `/sitemap.xml`
- [ ] All 446 vercel.json redirects work
- [ ] All 366 blog legacy redirects work
- [ ] 2-segment → 3-segment URL migration works
- [ ] Trailing slashes enforced on all URLs
- [ ] Canonical URLs correct
- [ ] OG tags present on all pages
- [ ] llms.txt headers present

**Infrastructure:**
- [ ] PWA installs and works offline
- [ ] Capacitor: `npx cap sync ios` succeeds
- [ ] CI/CD: all 5 jobs pass
- [ ] Playwright: 71 e2e tests pass
- [ ] Vitest: unit tests pass
- [ ] Mobile responsive layout works
- [ ] Dark mode works
- [ ] Analytics: PostHog + GA4 tracking
- [ ] 25 env vars all working

**API Routes (spot-check):**
- [ ] Auth endpoints (boot-session, login, logout)
- [ ] Chat endpoint (non-streaming)
- [ ] Chat-stream endpoint (SSE)
- [ ] Stripe webhook (raw body parsing)
- [ ] RevenueCat webhook
- [ ] TTS endpoints
- [ ] Game endpoints
- [ ] Rate limiting works

### Verification Method
- `preview_start` to run dev server
- `preview_snapshot` / `preview_screenshot` to verify pages
- `preview_console_logs` for errors
- `preview_network` for API calls
- Playwright tests for e2e flows
- Manual curl for API endpoints
- Lighthouse for performance/SEO scores

---

## Ongoing: Main Branch Sync

The glassmorphism redesign just shipped. Bug fixes and tweaks may land on `main`. Periodically:
1. `git fetch origin main`
2. `git merge origin/main` into `feature/nextjs-migration`
3. Resolve conflicts — apply fixes to Next.js equivalents
4. Re-verify build after merge

---

## Execution Order Summary

| Phase | Description | Key Metric |
|-------|------------|------------|
| **0** | Update CLAUDE.md | 1 file |
| **1** | Next.js foundation | Boot + build pass |
| **2** | Infrastructure (services, auth, API) | 59 API routes + 38 auth files + 941-line middleware |
| **3** | App routes & components | 24 router files + ~114 client files + PersistentTabs |
| **4** | Blog/content routes | 29 components + 22 pages + 14 data files + 812 redirects |
| **5** | PWA, Capacitor, CI/CD, cleanup | 71 Playwright + 7 Vitest + CI workflow |
| **6** | Final verification | 50+ checklist items |

**Rule: Build must pass after each phase. Do not proceed to next phase with errors.**

**Rule: Verify with `preview_*` tools after each phase — do not rely on "it should work."**

---

## Sanity Checks (Between Every Phase)

After completing each phase, run a structured sanity check before proceeding. This is NOT optional — it's a phase gate.

### What the Sanity Check Does

1. **Progress Audit** — What was actually completed vs what was planned? Any shortcuts taken? Any files skipped?

2. **Approach Review** — Is the approach we chose still the best one? Now that we've done the work, would a different pattern have been simpler? Are we over-engineering anything?

3. **Efficiency Scan** — Are there patterns emerging that we can extract into helpers? Are we doing repetitive work that could be batched? Are we rewriting things that could be adapted with minimal changes?

4. **Devil's Advocate** — What could go wrong with what we just built? What assumptions are we making that might not hold in production? What edge cases are we ignoring? What will break when the user does something unexpected?

5. **Mission Check** — Are we still on track for the core mission (unified Next.js build that deploys cleanly)? Are we getting pulled into yak-shaving? Is the scope creeping?

6. **CLAUDE.md Update** — Update CLAUDE.md with current state: what's done, what's next, any new patterns or conventions discovered during this phase.

### Sanity Check Schedule

| After Phase | Key Questions |
|------------|---------------|
| Phase 0 | Is the CLAUDE.md clear enough for a cold-start agent? |
| Phase 1 | Does the Next.js foundation match our existing patterns, or are we fighting the framework? Should we adjust our approach for later phases based on what we learned? |
| Phase 2 | Is the API middleware rewrite clean, or are we carrying legacy patterns? Is the Supabase auth migration solid, or are there auth edge cases (expired tokens, concurrent sessions)? Are all 59 API routes actually needed, or can some be consolidated? |
| Phase 3 | Is PersistentTabs actually working reliably, or is it fragile? Should we reconsider the approach? Are there hydration issues we're papering over? Is the react-router-dom removal complete with zero traces? |
| Phase 4 | Are blog pages rendering correctly with ISR? Are we hitting Supabase rate limits with 13K+ articles? Is the font situation resolved or are we carrying tech debt? Are all 812+ redirects actually working? |
| Phase 5 | Does the PWA actually work offline, or are we faking it? Does Capacitor still build? Are all CI/CD jobs green? Are we leaving dead code behind? |
| Phase 6 | Final honest assessment — would we ship this tomorrow? What's the actual risk? |

### Plan Maintenance (Part of Every Sanity Check)

6. **Update the Migration Plan** — At each sanity check, also update `docs/MIGRATION_PLAN.md` (the in-repo copy):
   - Mark completed tasks with `[x]`
   - Add any new tasks discovered during the phase
   - Adjust scope estimates if reality differs from plan (it will)
   - Document decisions made and WHY (not just what)
   - Note any blocked items or dependencies discovered
   - Update difficulty ratings if something was easier/harder than expected
   - Add "Lessons Learned" notes for future phases

This ensures the plan is a **living document** that reflects reality, not a stale artifact from before we started.

---

## Plan Location & Agent Navigation

**This file (`docs/MIGRATION_PLAN.md`) is the source of truth.** It is committed to the `feature/nextjs-migration` branch and updated at every sanity check.

**CLAUDE.md references this plan** so any agent can find it immediately.

### How Agents Navigate the Plan

The plan is structured for quick scanning:
- **Scope Summary table** at the top — see the full scale at a glance
- **Difficulty Ratings table** — know what's hard before starting
- **Each phase** has: Goal (1 line), numbered tasks, critical files list, verify checklist
- **Sanity Check section** — what to do between phases
- **Phase 6 checklist** — comprehensive final verification (50+ items)

When starting a new session on this migration:
1. Read `CLAUDE.md` for current state
2. Read `docs/MIGRATION_PLAN.md` for full plan
3. Find the current phase (marked in CLAUDE.md)
4. Read that phase's tasks and critical files
5. Execute, then run the sanity check before moving on
