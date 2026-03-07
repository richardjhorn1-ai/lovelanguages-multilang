# Execution Log

## Baseline

- date: `2026-03-07`
- branch: `main`
- head: `9cb59033ef1aa2afd3b70825d34908933506fa9e`
- dirty working tree:
  - `blog/src/lib/blog-api.ts`
  - `blog/src/pages/learn/index.astro`
  - `docs/SEO_AUDIT_HARDENING_EXECUTION_PLAN_MAR2026.md`
  - `package.json`
  - `scripts/seo/audit-deployed-seo.mjs`
  - `scripts/seo/generate-url-inventory.mjs`
  - `tmp/`

## Repo Shape Checks

Commands run:

- `git status --short --branch`
- `git rev-parse HEAD`
- `git branch --show-current`
- `find api -type f -name '*.ts' | wc -l`
- `find components -type f -name '*.tsx' | wc -l`
- `find blog/src/pages -type f | wc -l`
- `find migrations -maxdepth 1 -type f | wc -l`

Observed:

- API endpoint files: `61`
- React component files: `131`
- Astro page files: `22`
- migrations: `43`

## Static Validation

### Build

- `npm run build`
  - result: pass with degraded postbuild output
  - notable output:
    - app build completed successfully
    - blog postbuild logged `Error fetching article URLs from Supabase: fetch failed`
    - image sitemap generation continued with `Found 0 article URLs`

- `npm run build:blog`
  - result: pass
  - notable output:
    - `Found 1201 blog images`
    - `Found 11933 article URLs`
    - sitemap validation passed

- `npm run build:app`
  - result: pass
  - notable output:
    - `dist/assets/index-DeowfPjW.js` = `3241.61 kB` minified / `931.80 kB` gzip
    - mixed dynamic/static import warning for `constants/language-config.ts`
    - PWA precache: `37 entries`

### Typecheck

- `npx tsc --noEmit`
  - result: fail
  - main failure buckets:
    - root typecheck includes `blog/src/middleware.ts` without Astro type environment
    - root typecheck includes `promo-video/*` without Remotion/Three dependencies in the root project
    - `vitest.config.ts` has a Vite/Vitest plugin type mismatch

### Unit / Integration Tests

- `npx vitest run`
  - result: fail
  - failing buckets:
    - Playwright specs under `e2e/` are being loaded by Vitest as broken suites
    - `tests/generate-invite.test.ts` stubs `single()` chain but runtime now uses `maybeSingle()`
    - `tests/error-boundary.test.tsx` expects old fallback copy and old icon behavior

- `npx vitest run tests/stripe-webhook.test.ts tests/blog-urls.test.ts tests/tts-logging.test.ts tests/vocabulary-extraction.test.ts`
  - result: pass
  - totals:
    - test files: `4`
    - tests: `43`

### Dependency Audit

- `npm audit --audit-level=high --json`
  - result: fail
  - summary:
    - total: `14`
    - high: `8`
    - moderate: `4`
    - low: `2`
  - notable packages:
    - `vite-plugin-pwa`
    - `workbox-build`
    - `rollup`
    - `tar`
    - `minimatch`
    - `serialize-javascript`
    - direct moderate `dompurify`

## SEO Tooling

- `npm run seo:inventory -- --output-dir tmp/seo-audit/latest`
  - result: pass
  - summary:
    - language pairs: `306`
    - native languages: `18`
    - regular articles: `11346`
    - methodology articles: `144`
    - total URLs: `12044`
    - indexable: `12017`
    - excluded: `27`

- `npm run seo:audit -- --base-url https://www.lovelanguages.io --inventory tmp/seo-audit/latest/url-inventory.json --pages-only --sample-size 60 --sitemap-sample-size 10 --output-dir tmp/seo-audit/latest/prod`
  - result: fail
  - summary:
    - checked: `519`
    - passed: `518`
    - failures reported: `68`
    - error counts:
      - `sitemap_missing_expected_url`: `67`
      - `forbidden_internal_link`: `1`
  - notable live findings:
    - production page sitemap is missing `67` expected URLs relative to the current local inventory
    - `/learn/` still links `/learn/couples-language-learning/` in production

Artifacts:

- `tmp/seo-audit/latest/url-inventory.json`
- `tmp/seo-audit/latest/prod/audit-report-production.json`

## Targeted Live Confirmation

- `curl -sSL https://www.lovelanguages.io/support/`
  - result: returned SPA homepage HTML, not the Astro support page
  - canonical observed: `https://www.lovelanguages.io/`

- `curl -sSL https://www.lovelanguages.io/sitemap-pages.xml | rg '/support/'`
  - result: no matches

- `curl -sSL https://www.lovelanguages.io/robots.txt`
  - result:
    - `User-agent: *`
    - `Allow: /`
    - sitemap index points to `https://www.lovelanguages.io/sitemap-index.xml`

## Documentation / Source Reviews

Files inspected during the audit included:

- `App.tsx`
- `components/ChatArea.tsx`
- `components/FlashcardGame.tsx`
- `components/ProfileView.tsx`
- `components/SubscriptionManager.tsx`
- `services/offline.ts`
- `services/purchases.ts`
- `services/api-config.ts`
- `api/analytics-event.ts`
- `api/create-customer-portal.ts`
- `api/subscription-status.ts`
- `api/apple-token-exchange.ts`
- `api/delete-account.ts`
- `utils/api-middleware.ts`
- `vercel.json`
- `vite.config.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `tsconfig.json`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_ARCHITECTURE.md`
- `docs/DESIGN.md`
- `docs/review-design-system.md`
- `docs/TESTING_CHECKLIST.md`
- `docs/review-offline-pwa.md`
- `blog/src/layouts/BaseLayout.astro`
- `blog/src/pages/support/index.astro`
- `scripts/seo/generate-url-inventory.mjs`
- `scripts/seo/audit-deployed-seo.mjs`

## Blocked / Partial Checks

- Native project verification is partial because `ios/` and `android/` directories are absent from the repo.
- Full browser-based Playwright execution was not used as the primary audit source in this pass; the repo-level Playwright config was inspected, and live SEO confirmation was done through HTTP-level audit and direct `curl` checks.

## Result

The audit package was generated under:

- `docs/audits/codebase-mar2026/`

The ranked findings are captured in:

- `ISSUE_LEDGER.md`
- `ISSUE_LEDGER.json`

## Follow-up Remediation Pass (2026-03-07)

Commands run:

- `npm run lint`
- `npm run typecheck:app`
- `npm run typecheck:api`
- `npm run build:app`

Code changes:

- added partner-safe client read path:
  - `services/partner-profile.ts`
  - `migrations/045_partner_profile_view_and_private_field_cleanup.sql`
- moved partner-read UI components off direct `profiles` partner fetches:
  - `components/ProfileView.tsx`
  - `components/Progress.tsx`
  - `components/tutor/TutorAnalyticsDashboard.tsx`
  - `components/LoveLog.tsx`
  - `components/FlashcardGame.tsx`
  - `components/TutorGames.tsx`
  - `components/PendingChallenges.tsx`
- tightened analytics ingestion hardening:
  - `api/analytics-event.ts` now includes bounded request rate limiting and anonymous/auth transition integrity checks
- added App Store management branch in account UI:
  - `components/SubscriptionManager.tsx`
- repaired unit-test drift in existing suites:
  - `tests/generate-invite.test.ts` updated for `.maybeSingle()` query chain
  - `components/ErrorBoundary.tsx` fallback copy now has deterministic defaults when i18n keys are missing
  - `tests/error-boundary.test.tsx` expectation updated to icon-based fallback

Validation outcomes:

- `lint`: pass
- `typecheck:app`: pass
- `typecheck:api`: pass
- `typecheck:blog`: fail (`58` errors, Astro/content typing issues in `blog/`)
- `build:app`: pass
- `test:unit`: pass (`57`/`57`)

## Closure Pass (2026-03-07, continued)

Key commands run:

- `npm run typecheck:blog`
- `npm run lint`
- `npm run typecheck:app`
- `npm run typecheck:api`
- `npm run test:unit`
- `npm run build:app`
- `npm run build:blog`
- `npm run seo:validate-routes`
- `npm audit --omit=dev --audit-level=high --json`
- `npm audit --audit-level=high --json`

Additional code and policy changes:

- closed blog Astro typing regressions by updating source files and typings:
  - `blog/src/components/BlogAnalytics.astro`
  - `blog/src/components/CTA.astro`
  - `blog/src/components/LoveNote.astro`
  - `blog/src/components/ArticleCard.astro`
  - `blog/src/components/hub/ArticlesGrid.astro`
  - `blog/src/components/hub/TopicalArticlesGrid.astro`
  - `blog/src/components/hub/FamilyHubLink.astro`
  - `blog/src/layouts/ArticleLayout.astro`
  - `blog/src/pages/learn/[...slug].astro`
  - `blog/src/pages/learn/index.astro`
  - `blog/src/data/couples-translations.ts`
  - `blog/src/data/ui-translations.ts`
- added subscription source-path unit tests and test-safe external navigation hook:
  - `components/SubscriptionManager.tsx`
  - `tests/subscription-manager.test.tsx`
- rebaselined stale docs and source-of-truth pointers:
  - `README.md`
  - `docs/SETUP.md`
  - `docs/TESTING_CHECKLIST.md`
  - `docs/ARCHITECTURE.md`
  - `docs/BACKEND_ARCHITECTURE.md`
  - `docs/review-offline-pwa.md`
  - `docs/review-design-system.md`
- dependency policy closure work:
  - moved build-only packages out of runtime dependency graph (`@capacitor/cli`, `@mdx-js/rollup`)
  - added `overrides.minimatch` to pin safe runtime transitive version
  - updated release workflow to enforce runtime audit and still publish full audit artifact:
    - `.github/workflows/release-security-sweep.yml`

Validation outcomes after closure pass:

- `lint`: pass
- `typecheck:app`: pass
- `typecheck:api`: pass
- `typecheck:blog`: pass (`0` errors, hints only)
- `test:unit`: pass (`60`/`60`)
- `build:app`: pass
- `build:blog`: pass
- `seo:validate-routes`: pass
- runtime dependency audit (`--omit=dev --audit-level=high`): pass (`exit 0`)
- full dependency audit (`--audit-level=high`): fail (`exit 1`) with remaining dev/build-toolchain highs
