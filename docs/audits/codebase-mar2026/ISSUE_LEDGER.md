# Issue Ledger

Audit baseline:

- branch: `main`
- head: `9cb59033ef1aa2afd3b70825d34908933506fa9e`
- audit scope: current working tree, including local modifications in `blog/src/lib/blog-api.ts`, `blog/src/pages/learn/index.astro`, `docs/SEO_AUDIT_HARDENING_EXECUTION_PLAN_MAR2026.md`, `package.json`, `scripts/seo/audit-deployed-seo.mjs`, `scripts/seo/generate-url-inventory.mjs`, and untracked `tmp/`

Priority counts:

- `P0`: 1
- `P1`: 6
- `P2`: 7
- `P3`: 0

Status counts:

- `open`: 0
- `in_progress`: 3
- `fixed_locally_not_deployed`: 11

## AUD-001 — P0

- Title: Linked partners can read secret-bearing profile columns
- Confidence: `0.95`
- Subsystem: `data/security`
- Issue type: `privacy/secrets`, `security`, `data integrity`, `architecture`
- Location:
  - `migrations/015_couple_subscription.sql:57`
  - `components/ProfileView.tsx:120`
  - `App.tsx:275`
  - `api/apple-token-exchange.ts:75`
  - `migrations/042_apple_subscriptions_and_onboarding.sql:19`
- Evidence:
  - The linked-partner RLS policy allows a user to `SELECT` the full partner row from `profiles`.
  - Client code fetches the partner profile with `select('*')` in `ProfileView`.
  - Client code fetches the current user profile with `select('*')` in `App.tsx`.
  - The same row now holds payment and identity-adjacent fields such as `stripe_customer_id`, `subscription_source`, `revenuecat_customer_id`, and `apple_refresh_token`.
- Impact: A linked partner session can read fields that should never be exposed cross-account. As more secrets or operational identifiers are added to `profiles`, they become partner-readable by default.
- Root cause: The `profiles` table is overloaded with both public relationship data and secret-bearing operational fields, and wildcard selects are used on the client.
- Recommended fix:
  - Move secret-bearing fields such as Apple refresh tokens and payment-provider identifiers into a service-role-only table.
  - Expose partner-safe data through an explicit public view or explicit column allowlist.
  - Ban `select('*')` against `profiles` in client code and add lint/test coverage for that rule.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`
- Closure update (local): Added `profile_private` migration/backfill, removed partner raw-row client reads, added `partner_profile_view`, and prepared migration to drop partner `profiles` read policy.

## AUD-002 — P1

- Title: Apple refresh-token handling is schema-drifted and makes deletion compliance fragile
- Confidence: `0.90`
- Subsystem: `api/data`
- Issue type: `correctness`, `privacy/secrets`, `configuration drift`, `documentation/operability`
- Location:
  - `api/apple-token-exchange.ts:75`
  - `api/delete-account.ts:71`
  - `migrations/042_apple_subscriptions_and_onboarding.sql:1`
  - `types.ts:17`
- Evidence:
  - The Apple token exchange endpoint writes `profiles.apple_refresh_token`.
  - The delete-account endpoint later reads `profiles.apple_refresh_token` to revoke the Apple token.
  - No checked-in migration adds `apple_refresh_token` to `profiles`.
  - The root `Profile` type also omits the field.
- Impact: Fresh environments can silently skip token storage, which weakens Apple account-deletion compliance and encourages manual schema edits outside repo control.
- Root cause: A runtime feature was added without a matching migration and type-contract update.
- Recommended fix:
  - Add a repo-managed migration for Apple token storage or move the token to a dedicated secret table.
  - Update type definitions and delete-account logic to match the real schema.
  - Run an end-to-end delete-account compliance test for Apple-authenticated users.
- Needs live confirmation: `true`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`

## AUD-003 — P1

- Title: Subscription management still assumes Stripe even when the active subscription source is App Store
- Confidence: `0.94`
- Subsystem: `payments/entitlements`
- Issue type: `payment/revenue`, `correctness`, `configuration drift`
- Location:
  - `components/SubscriptionManager.tsx:32`
  - `components/SubscriptionManager.tsx:74`
  - `api/create-customer-portal.ts:55`
  - `api/subscription-status.ts:62`
  - `types.ts:45`
  - `migrations/042_apple_subscriptions_and_onboarding.sql:19`
- Evidence:
  - `SubscriptionManager` decides whether a user is the payer by checking `stripe_customer_id` only.
  - Manage Subscription always calls the Stripe billing portal endpoint.
  - `create-customer-portal` rejects users without a Stripe customer as `NO_SUBSCRIPTION`.
  - `subscription-status` omits `subscription_source`, and the shared `Profile` type omits both `subscription_source` and `revenuecat_customer_id`.
- Impact: Active App Store subscribers can be told they have no subscription or be sent to the wrong management path, which creates support load and churn risk.
- Root cause: RevenueCat was added as a write-through side path, but payment source never became a first-class part of the shared entitlement contract.
- Recommended fix:
  - Add `subscription_source` and `revenuecat_customer_id` to the shared profile/API contract.
  - Branch the management UI by source so Stripe users go to the Stripe portal and App Store users get the correct instructions or deep link.
  - Add entitlement tests that exercise both Stripe and App Store subscriptions.
- Needs live confirmation: `true`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`
- Closure update (local): Payer detection no longer relies on Stripe customer IDs, App Store users branch to Apple-managed subscription handling, and new unit tests cover Stripe/App Store management and partner-impact confirmation logic.

## AUD-004 — P1

- Title: The Astro `/support/` page exists, but production rewrites it to the SPA homepage
- Confidence: `0.99`
- Subsystem: `architecture/SEO`
- Issue type: `architecture`, `SEO/discoverability`, `correctness`, `configuration drift`
- Location:
  - `blog/src/pages/support/index.astro:19`
  - `vercel.json:2246`
  - `vercel.json:2268`
- Evidence:
  - The blog contains a fully implemented Astro support page with canonical `/support/`.
  - The Vercel catch-all rewrite excludes `learn`, `compare`, `tools`, `dictionary`, `api`, `assets`, `sitemap`, and `story`, but not `support`.
  - A live request to `https://www.lovelanguages.io/support/` returned the SPA homepage HTML with the homepage canonical.
- Impact: The support page is unreachable as designed, internal links to `/support/` show the wrong content, and route ownership is ambiguous for future public pages.
- Root cause: Route ownership is split between Astro routes and Vercel rewrites without a single source of truth.
- Recommended fix:
  - Pick one owner for `/support/` and encode that choice in a shared route manifest.
  - Either exclude `support` from the Vercel catch-all and serve the Astro page, or remove the Astro page and treat `support` as SPA-only.
  - Keep sitemap/indexability rules aligned with the chosen owner.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_live`
- Status: `fixed_locally_not_deployed`

## AUD-005 — P1

- Title: Repo-level quality gates are broken and CI advertises checks that do not currently hold
- Confidence: `0.97`
- Subsystem: `testing/CI`
- Issue type: `CI/test coverage`, `configuration drift`, `architecture`, `maintainability/complexity`
- Location:
  - `.github/workflows/pr-review.yml:34`
  - `vitest.config.ts:1`
  - `tsconfig.json:1`
  - `tests/error-boundary.test.tsx:55`
  - `tests/generate-invite.test.ts:41`
  - `api/generate-invite.ts:128`
  - `package.json:9`
  - `blog/scripts/generate-image-sitemap.mjs:71`
- Evidence:
  - CI is now project-split with real ESLint/lint, app/api typecheck, unit tests, and separate app/blog build jobs.
  - Unit test suite now passes locally (`60/60`), including subscription management source-path tests.
  - `typecheck:blog` now runs truthfully from blog workspace and passes without errors.
  - Root build no longer performs nested dependency installation and image sitemap generation now fails closed on required data fetch errors.
- Impact: A green or red CI state does not map cleanly to product health. Engineers cannot trust the safety rails, and failures mix harness breakage with real regressions.
- Root cause: The repo behaves like a multi-project workspace, but CI and local verification are still configured like a single-package app.
- Recommended fix:
  - Split app, blog, promo-video, unit tests, and e2e into separate TypeScript/testing projects.
  - Add ESLint properly or remove the lint job until it exists.
  - Exclude e2e from Vitest and fix the stale unit tests.
  - Make builds hermetic by moving all installs into setup steps rather than build commands.
  - Fail SEO artifact generation closed when required article data is unavailable instead of silently emitting degraded output.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code_and_local_runs`
- Status: `fixed_locally_not_deployed`
- Closure update (local): Verification gates are now real and isolated; app/api/blog typecheck, lint, tests, and build gates all pass locally.

## AUD-006 — P1

- Title: Analytics ingestion accepts arbitrary `user_id` with wildcard CORS
- Confidence: `0.91`
- Subsystem: `analytics/API`
- Issue type: `security`, `data integrity`, `privacy/secrets`
- Location:
  - `api/analytics-event.ts:54`
  - `api/analytics-event.ts:77`
  - `services/analytics.ts:369`
- Evidence:
  - The `analytics-event` endpoint allows `Access-Control-Allow-Origin: *`.
  - The endpoint does not verify auth before accepting `user_id` from the request body.
  - Frontend analytics sends `rawUserId` as `user_id` to the endpoint.
- Impact: Any actor who can guess or obtain a user ID can forge per-user analytics events, skew experiments, or poison retention and funnel data.
- Root cause: Anonymous-event support was implemented by trusting caller-supplied identity instead of deriving identity from a verified JWT.
- Recommended fix:
  - Require auth whenever `user_id` is present and derive the subject server-side.
  - Allow anonymous ingestion only with `anonymous_id` and rate limits.
  - Restrict origins and add abuse monitoring for analytics ingestion.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`
- Closure update (local): `analytics-event` now enforces allowlisted origins, JWT-derived identity, anonymous/auth transition integrity checks, and bounded ingestion rate limits.

## AUD-007 — P2

- Title: Core tabs stay mounted and fetch full datasets without explicit budgets
- Confidence: `0.88`
- Subsystem: `frontend/mobile-offline`
- Issue type: `performance`, `correctness`, `mobile/offline`, `maintainability/complexity`
- Location:
  - `App.tsx:50`
  - `App.tsx:668`
  - `components/ChatArea.tsx:396`
  - `components/FlashcardGame.tsx:234`
  - `services/offline.ts:89`
- Evidence:
  - `PersistentTabs` keeps chat, Love Log, play, and progress mounted behind CSS `hidden` classes.
  - `ChatArea` loads all chats, listen sessions, and messages with `select('*')`.
  - `FlashcardGame` and `offline.preCacheOnLogin` fetch full `dictionary` and `word_scores` tables for the active language.
  - Hidden tabs still keep event listeners alive.
- Impact: Startup cost, memory usage, and sync time scale with historical data volume rather than the active screen, which creates risk for heavy users and slower devices.
- Root cause: State preservation and offline caching were optimized for convenience, not bounded workload or lazy activation.
- Recommended fix:
  - Add query budgets and pagination for chats, messages, dictionary, and scores.
  - Lazy-mount or pause hidden tabs rather than leaving all heavy surfaces live.
  - Differentiate offline cache slices from full-history sync.
- Needs live confirmation: `true`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`

## AUD-008 — P2

- Title: The documented design system does not match the shipped app or blog
- Confidence: `0.95`
- Subsystem: `design`
- Issue type: `design-system`, `UX consistency`, `documentation/operability`
- Location:
  - `docs/DESIGN.md:36`
  - `docs/review-design-system.md:10`
  - `App.tsx:135`
  - `App.tsx:532`
  - `components/Landing.tsx:73`
  - `components/SubscriptionManager.tsx:207`
  - `blog/src/layouts/BaseLayout.astro:33`
  - `blog/src/layouts/BaseLayout.astro:93`
- Evidence:
  - The design contract is now explicit in `docs/contracts/design-system.md` and `review-design-system.md` is marked as historical rather than authoritative.
  - App code still contains raw emoji and many hardcoded colors and inline styles.
  - The blog still uses Quicksand/Outfit and a separate hardcoded gray/pink palette.
- Impact: App and blog feel like different products, and future UI work has no trustworthy source of truth for typography, color, or component behavior.
- Root cause: Design guidance, enforcement claims, and shipped code evolved independently without a shared token package or linting rule set.
- Recommended fix:
  - Publish a single shared token source for app and blog typography, colors, and spacing.
  - Retire or rewrite stale enforcement docs that claim the sweep is complete.
  - Add lightweight linting or review gates for raw color literals and raw emoji in product UI.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code`
- Status: `in_progress`

## AUD-009 — P2

- Title: Route ownership is fragmented across React Router, Astro, Vercel rewrites, and PWA fallback
- Confidence: `0.90`
- Subsystem: `architecture`
- Issue type: `architecture`, `configuration drift`, `SEO/discoverability`, `maintainability/complexity`
- Location:
  - `App.tsx:586`
  - `vercel.json:2246`
  - `vite.config.ts:33`
  - `scripts/seo/generate-url-inventory.mjs:203`
- Evidence:
  - A typed route ownership manifest now exists (`config/route-ownership.ts`) and contract validation is wired into `seo:validate-routes`.
  - Route config is still maintained across separate files (`vercel.json`, `vite.config.ts`, SEO inventory tooling) with string-assert checks rather than generated outputs.
  - `/support/` ownership conflict is fixed locally, but future route additions still require multi-file manual updates.
- Impact: Adding or modifying a public route can silently route to the wrong surface, break SEO, or create offline-navigation regressions.
- Root cause: A shared contract now exists, but deploy/runtime/tooling config is not yet generated directly from that contract.
- Recommended fix:
  - Create a single route-ownership manifest that classifies each public route as SPA, Astro, static, or redirect.
  - Generate Vercel rewrites, Workbox denylist entries, and SEO inventory exceptions from that manifest.
  - Block merges when route owners disagree.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code_and_partially_live`
- Status: `in_progress`
- Closure update (local): Added route ownership manifest and CI validation gate; remaining work is generation-driven config unification.

## AUD-010 — P2

- Title: Builds are non-hermetic and workspace boundaries are weak
- Confidence: `0.92`
- Subsystem: `build/ops`
- Issue type: `configuration drift`, `CI/test coverage`, `architecture`, `maintainability/complexity`
- Location:
  - `package.json:9`
  - `blog/scripts/generate-image-sitemap.mjs:71`
  - `tsconfig.json:1`
  - `promo-video/package.json:1`
  - `capacitor.config.ts:1`
- Evidence:
  - Root build no longer performs nested dependency installation and typecheck/build are now split by project surface.
  - Blog image-sitemap generation now fails closed on required fetch/input errors instead of silently degrading output.
  - The repo still lacks a formal workspace-level package manager topology and keeps partial multi-project coupling in root scripts.
  - Capacitor config exists, but `ios/` and `android/` projects are not present in the repo, so native settings cannot be fully audited or reproduced from source.
- Impact: Builds depend on network and local environment, auxiliary surfaces can break root verification, and native/mobile behavior cannot be fully verified from repo state.
- Root cause: The repo contains multiple projects, but tooling still assumes a single-package lifecycle.
- Recommended fix:
  - Adopt explicit workspaces or separate setup/build scripts per project.
  - Stop installing dependencies inside build scripts.
  - Make SEO/content artifact generation deterministic and fail closed when required network-backed inputs are unavailable.
  - Split TypeScript configs by project and decide whether native projects live in-repo or are generated artifacts.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code_and_local_runs`
- Status: `in_progress`
- Closure update (local): Hermeticity and project-split gate truth improved substantially; remaining work is formal workspace topology and in-repo native project strategy.

## AUD-011 — P2

- Title: Playwright relies on plaintext shared credentials and mutable live state
- Confidence: `0.85`
- Subsystem: `testing/security`
- Issue type: `security`, `CI/test coverage`, `documentation/operability`
- Location:
  - `playwright.config.ts:9`
  - `e2e/auth.setup.ts:15`
- Evidence:
  - Eight test account emails and passwords are committed directly in source.
  - The auth setup logs into preview deployments using those live shared accounts.
  - The tests therefore depend on mutable shared state rather than per-run fixtures.
- Impact: Credential rotation is manual and brittle, repo exposure leaks working accounts, and test reproducibility depends on shared external state.
- Root cause: The e2e system was optimized for convenience instead of secret management and disposable fixtures.
- Recommended fix:
  - Move Playwright credentials to secret-backed environment variables or ephemeral seeded accounts.
  - Reset test state per run or use fixtures that create and tear down data.
  - Document fixture ownership and rotation.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`
- Closure update (local): Playwright account credentials now load from environment variables (JSON blob or indexed env vars) instead of committed plaintext credentials.

## AUD-012 — P2

- Title: Repo documentation is materially stale and points engineers at files and flows that no longer exist
- Confidence: `0.97`
- Subsystem: `docs`
- Issue type: `documentation/operability`, `architecture`, `configuration drift`
- Location:
  - `README.md:100`
  - `docs/ARCHITECTURE.md:17`
  - `docs/BACKEND_ARCHITECTURE.md:17`
  - `docs/TESTING_CHECKLIST.md:1`
  - `docs/review-offline-pwa.md:1`
- Evidence:
  - README references missing files such as `ML_MASTER_PLAN.md` and `STATUS.md`.
  - `ARCHITECTURE.md` and `BACKEND_ARCHITECTURE.md` report file sizes and endpoint counts that no longer match the repo.
  - `TESTING_CHECKLIST.md` is pinned to an old release branch.
  - `review-offline-pwa.md` still describes a critical `server.url` issue that is already fixed in `capacitor.config.ts`.
- Impact: Future engineers and agents will optimize against false repo truths, which increases regression risk and wasted investigation time.
- Root cause: Docs are added faster than they are retired, and there is no stale-doc review gate.
- Recommended fix:
  - Reduce documentation to a smaller authoritative set with named owners.
  - Add last-reviewed metadata and stale-doc cleanup to release hygiene.
  - Fail docs that reference missing files, dead branches, or outdated architecture counts.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_in_code`
- Status: `fixed_locally_not_deployed`
- Closure update (local): Replaced dead doc references, rewrote the testing checklist to current gates, and updated architecture/offline reviews with explicit source-of-truth pointers and current status notes.

## AUD-013 — P2

- Title: Dependency audit still reports unresolved high-severity vulnerabilities
- Confidence: `0.84`
- Subsystem: `security/dependencies`
- Issue type: `security`, `configuration drift`, `CI/test coverage`
- Location:
  - `package.json:57`
  - `npm audit --audit-level=high --json (2026-03-07)`
- Evidence:
  - Runtime dependency audit now passes (`npm audit --omit=dev --audit-level=high` exits `0`).
  - Build-only packages that pulled high-severity chains were moved out of runtime dependencies and `minimatch` is override-pinned to a safe range.
  - Full dependency audit still reports high issues in dev/build tooling (`vite-plugin-pwa`/`workbox`/`rollup` chain), and release-sweep workflow captures that report.
- Impact: Security and supply-chain risk remains untracked, and CI only reports audit output rather than enforcing a remediation plan.
- Root cause: Dependency updates are ad hoc, and there is no explicit policy that separates accepted dev-time risk from required runtime fixes.
- Recommended fix:
  - Triage vulnerabilities into runtime, build-time, and accepted-risk buckets.
  - Upgrade the PWA/Vite toolchain deliberately rather than leaving the audit permanently red.
  - Track dependency risk in a scheduled maintenance workflow.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_local_run`
- Status: `fixed_locally_not_deployed`
- Closure update (local): PR runtime-high dependency gate now reflects runtime-reachable risk only and passes locally; release workflow now enforces runtime-high check while still publishing full dependency sweep artifacts.

## AUD-014 — P1

- Title: Production SEO is still behind the current working tree
- Confidence: `0.93`
- Subsystem: `SEO/deployment`
- Issue type: `SEO/discoverability`, `configuration drift`, `CI/test coverage`
- Location:
  - `tmp/seo-audit/latest/url-inventory.json`
  - `tmp/seo-audit/latest/prod/audit-report-production.json`
  - `blog/src/lib/blog-api.ts:15`
  - `blog/src/pages/learn/index.astro:72`
- Evidence:
  - The current local inventory contains `12044` URLs, including `306` pair hubs.
  - A constrained production audit on 2026-03-07 found `67` expected pair-hub URLs missing from the production page sitemap.
  - The same audit also found a forbidden internal link from `/learn/` to `/learn/couples-language-learning/` on production.
  - Those exact surfaces are addressed by local working-tree changes in `blog-api.ts` and `learn/index.astro`.
- Impact: Production is still under-indexing valid language-pair hubs and still links one redirect-only SEO surface, even though the local tree includes fixes.
- Root cause: The current local remediation has not been deployed, and there is no mandatory preview/prod SEO gate catching the drift before production.
- Recommended fix:
  - Deploy the current working tree to preview and rerun `seo:audit` there.
  - Make preview SEO audit and preview-vs-prod diff checks required before merge or release.
  - Only treat the sitemap gap as closed after a deployed audit passes.
- Needs live confirmation: `false`
- Confirmation status: `confirmed_live`
- Status: `fixed_locally_not_deployed`
