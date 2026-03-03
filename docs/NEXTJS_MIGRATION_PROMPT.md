# Next.js Migration Prompt for Claude Code

Copy everything below the line into a fresh Claude Code session in the `~/lovelanguages-multilang` directory.

---

## Task: Migrate Love Languages from Vite+React SPA + Astro SSR to Next.js App Router

You are migrating a production language learning app (lovelanguages.io) from a dual-build architecture (Vite React SPA + Astro SSR blog) into a single unified Next.js 15 App Router application. This is a large migration (~370 TSX files, ~327 TS files, 699-line App.tsx). Work methodically, component by component. Do NOT rush.

### Current Architecture

**SPA (Vite + React 18 + react-router-dom v6):**
- Entry: `index.tsx` → `App.tsx` (BrowserRouter)
- Components: `components/` (~40+ components)
- Services: `services/` (~16 service files — Supabase, Gemini AI, Stripe, RevenueCat, analytics, offline/PWA, audio)
- Hooks: `hooks/` (5 custom hooks)
- Context: `context/` (ThemeContext, LanguageContext)
- Constants: `constants/` (language config, colors, levels, icons)
- Types: `types.ts`
- i18n: `i18next` + `react-i18next`
- Styling: Tailwind CSS v4 + PostCSS
- API routes: `api/` (~30+ serverless functions deployed as Vercel functions)
- Capacitor: iOS native app support (must remain functional)
- PWA: `vite-plugin-pwa` with service worker

**SSR (Astro + @astrojs/vercel):**
- Location: `blog/`
- Pages: `blog/src/pages/` — `/learn/*`, `/compare/*`, `/tools/*`, `/dictionary/*`, `/support/*`
- Components: `blog/src/components/` (~17 Astro components)
- Layouts: `blog/src/layouts/` (ArticleLayout, BaseLayout)
- Data: Articles fetched from Supabase `blog_articles` table (13,000+ articles)
- Config: `output: 'server'`, `trailingSlash: 'always'`

**Build pipeline (current):**
```
vite build → dist/
cd blog && npm run build → .vercel/output/
cp dist/* into .vercel/output/static/  ← overlay SPA onto Astro output
```

**Vercel config (`vercel.json`):**
- Catch-all rewrite: non-content routes → `/index.html` (SPA)
- 200+ redirects for old slug patterns
- Static rewrites for `/privacy/`, `/terms/`, `/compare/`
- CSP headers, caching headers

**Key dependencies to preserve:**
- `@supabase/supabase-js` — auth, database, realtime
- `@google/genai` + `@google/generative-ai` — AI chat (Gemini)
- `@stripe/stripe-js` + `stripe` — payments
- `@revenuecat/purchases-capacitor` — iOS IAP
- `@capacitor/*` — iOS native bridge
- `i18next` + `react-i18next` — internationalization
- `@phosphor-icons/react` — icon library
- `dompurify` — HTML sanitization
- `react-easy-crop` — avatar uploads
- Tailwind CSS v4

### SPA Routes (from App.tsx)

**Authenticated routes (with Navbar):**
- `/` — ChatArea (persistent tab)
- `/log` — LoveLog (persistent tab)
- `/play` — FlashcardGame (persistent tab)
- `/progress` — Progress (persistent tab)
- `/test` — LevelTest
- `/profile` — ProfileView
- `*` → redirect to `/`

**Public routes (no auth):**
- `/join/:token` — JoinInvite
- `/terms` — TermsOfService
- `/privacy` — PrivacyPolicy
- `/faq` — FAQ
- `/method` — Method
- `/pricing` — Pricing
- `/reset-password` — ResetPassword
- `/:lang` — Landing page per language (18 languages)
- `*` → Landing

**Key patterns:**
- PersistentTabs component keeps `/`, `/log`, `/play`, `/progress` mounted (show/hide via CSS) to preserve state
- Auth state from Supabase `onAuthStateChange`
- Subscription gating via RevenueCat + Stripe
- Offline support via IndexedDB (`idb`)
- PWA with service worker

### Migration Plan — Execute in This Order

**Phase 1: Setup**
1. Create a new branch: `feature/nextjs-migration`
2. Initialize Next.js 15 with App Router in the project root
3. Set up `next.config.js` with:
   - All redirects from `vercel.json`
   - All rewrites from `vercel.json`
   - Headers (CSP, security) from `vercel.json`
   - Tailwind CSS v4 support
   - MDX support if needed
4. Migrate `tsconfig.json` for Next.js path aliases
5. Keep `capacitor.config.ts` — Capacitor must still work

**Phase 2: Core Infrastructure**
6. Move services (`services/*`) — these are mostly client-side, wrap in `'use client'` where needed
7. Move context providers (`context/*`) — create a root `providers.tsx` client component
8. Move hooks (`hooks/*`)
9. Move constants and types
10. Set up i18n for Next.js (consider `next-intl` or keep `i18next` with client-side init)
11. Move `api/` functions → `app/api/` route handlers (convert from Vercel serverless to Next.js route handlers)

**Phase 3: App Routes (SPA → Next.js)**
12. Create `app/layout.tsx` with providers, metadata, analytics scripts (PostHog, GA4)
13. Create `app/page.tsx` — Landing/auth gate (the main logic from App.tsx)
14. Move each component to appropriate route:
    - `app/(app)/` — authenticated layout with Navbar + PersistentTabs pattern
    - `app/(app)/page.tsx` — ChatArea
    - `app/(app)/log/page.tsx` — LoveLog
    - `app/(app)/play/page.tsx` — FlashcardGame
    - `app/(app)/progress/page.tsx` — Progress
    - `app/(app)/test/page.tsx` — LevelTest
    - `app/(app)/profile/page.tsx` — ProfileView
    - `app/(public)/join/[token]/page.tsx` — JoinInvite
    - `app/(public)/terms/page.tsx` — TermsOfService
    - `app/(public)/privacy/page.tsx` — PrivacyPolicy
    - `app/(public)/faq/page.tsx`
    - `app/(public)/method/page.tsx`
    - `app/(public)/pricing/page.tsx`
    - `app/(public)/reset-password/page.tsx`
    - `app/[lang]/page.tsx` — Language-specific landing
15. Handle PersistentTabs — this is the trickiest part. Options:
    - Use a client-side layout that keeps components mounted
    - Or accept re-mount on tab switch (simpler, may lose chat scroll position)
16. Move all components from `components/` into `components/` or colocate with routes

**Phase 4: Blog/Content Routes (Astro → Next.js)**
17. Convert Astro pages to Next.js:
    - `app/learn/page.tsx` — Learn index
    - `app/learn/[nativeLang]/page.tsx`
    - `app/learn/[nativeLang]/[targetLang]/page.tsx`
    - `app/learn/[nativeLang]/[targetLang]/[slug]/page.tsx` (catch-all article)
    - `app/learn/[nativeLang]/couples-language-learning/page.tsx`
    - `app/learn/[nativeLang]/topics/[topic]/page.tsx`
    - `app/compare/*` pages
    - `app/dictionary/*` pages
    - `app/tools/*` pages
    - `app/support/page.tsx`
18. Convert Astro components to React server components where possible
19. Implement article fetching from Supabase (these should be Server Components — no client JS)
20. Generate sitemaps using Next.js `sitemap.ts` convention
21. Set up ISR/static generation for content pages (they change rarely)

**Phase 5: Configuration & Build**
22. Remove Vite config, Astro config, old build scripts
23. Update `package.json` scripts
24. Set up `next.config.js` for:
    - Capacitor compatibility (output: 'export' for iOS builds OR handle with conditional config)
    - Image optimization
    - Proper env var handling (NEXT_PUBLIC_ prefix)
25. Handle PWA migration (use `next-pwa` or `@serwist/next`)
26. Clean up `vercel.json` (most config moves to `next.config.js`)

**Phase 6: Testing & Iteration Loop**

THIS IS CRITICAL. After each phase:

1. Run `npm run build` — fix ALL build errors before proceeding
2. Run `npm run dev` — open in browser, check for:
   - Console errors
   - Hydration mismatches
   - Broken routes (click every nav link)
   - Missing styles
   - API calls failing
3. Run existing tests: `npx playwright test` for e2e, check for failures
4. For each error found:
   - Read the full error message
   - Identify the root cause
   - Fix it
   - Re-run to verify
   - Repeat until clean

**Do NOT move to the next phase until the current phase builds and runs cleanly.**

### Important Constraints

- **Never delete the original files until the migration is verified working.** Move/copy first.
- **Preserve all Supabase read-only policy** — never INSERT/UPDATE/DELETE on production data
- **Capacitor must still work** — the iOS app loads from bundled assets. You may need a separate build script (`next export` or conditional config)
- **Environment variables** — rename `VITE_*` to `NEXT_PUBLIC_*` for client-side vars
- **Trailing slashes** — current blog uses trailing slashes (`trailingSlash: 'always'`). Configure Next.js to match: `trailingSlash: true` in next.config.js
- **13,000+ articles** — content pages MUST be server-rendered or statically generated, not client-side fetched
- **SEO preservation** — all existing URLs must continue to work. No broken links.
- **The `/learn/*` routes are the most important pages for SEO** — they drive all organic traffic

### Files to Read First

Before starting, read these files to understand the codebase:
1. `App.tsx` — main routing and auth logic (699 lines)
2. `vercel.json` — all redirects, rewrites, headers
3. `blog/astro.config.mjs` — blog SSR config
4. `capacitor.config.ts` — iOS config
5. `services/supabase.ts` — auth and DB client
6. `services/analytics.ts` — tracking setup
7. `package.json` — all dependencies
8. `index.html` — current entry point with meta tags, analytics scripts

### Success Criteria

The migration is complete when:
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run dev` loads the app without console errors
- [ ] All SPA routes work (auth flow, chat, games, log, profile)
- [ ] All blog/content routes work (`/learn/en/pl/` etc.)
- [ ] API routes work (chat, checkout, auth)
- [ ] Sitemaps generate correctly
- [ ] Playwright e2e tests pass
- [ ] No hydration errors in browser console
- [ ] Capacitor build still works (`npx cap sync ios`)
- [ ] All redirects from old slugs still work

Start with Phase 1. Go.
