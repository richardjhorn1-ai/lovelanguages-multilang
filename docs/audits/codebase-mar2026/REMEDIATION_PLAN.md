# Remediation Plan

## Operating Rules

- Fix `P0` and `P1` findings before broad refactors.
- Restore truthful verification before relying on new tests.
- Treat preview and production audits as separate gates.
- Do not merge route or payment changes without a route-owner and entitlement-contract update.

## Phase 0 — Contain the P0 Secret Boundary

Target findings:

- `AUD-001`
- `AUD-002`

Actions:

1. stop storing secret-bearing fields on partner-readable `profiles`
2. introduce a private table or equivalent boundary for Apple refresh tokens and provider IDs
3. replace client `select('*')` on `profiles` with explicit field lists
4. add regression coverage:
   - partner cannot read private fields
   - delete-account still has access to required private fields server-side

Verification:

- partner profile fetch returns only partner-safe columns
- Apple delete-account flow still has what it needs
- no client query against `profiles` uses `select('*')`

Course correction:

- if data migration is risky, first narrow RLS and explicit selects before moving data
- if a manual hotfix column exists in prod, backfill through a real migration rather than preserving drift

## Phase 1 — Make Verification Honest

Target findings:

- `AUD-005`
- `AUD-010`
- `AUD-011`
- `AUD-013`

Actions:

1. split verification by project:
   - app
   - blog
   - promo-video
   - unit tests
   - e2e
2. fix or remove the fake ESLint gate
3. separate Vitest from Playwright discovery
4. make root build hermetic by removing nested `npm install` from the build script
5. move Playwright credentials to env-backed fixtures or ephemeral accounts
6. document dependency-risk ownership and triage
7. make blog SEO artifact generation fail closed when required article fetches fail instead of silently emitting degraded sitemap output

Verification:

- `tsc` runs per project and is green where expected
- `vitest` does not load `e2e/*.spec.ts`
- CI jobs represent checks that actually exist
- build steps do not mutate dependency state during execution
- SEO build artifacts either generate from complete inputs or fail explicitly

Course correction:

- if the full repo cannot be made green immediately, start by making failures truthful and isolated
- a smaller honest CI matrix is better than a larger misleading one

## Phase 2 — Normalize Payment and Entitlement Contracts

Target findings:

- `AUD-003`

Actions:

1. add `subscription_source` and provider IDs to the shared contract
2. return source-aware data from `/api/subscription-status`
3. update account UI to choose a management path by source
4. add tests for:
   - Stripe payer
   - inherited subscription
   - App Store payer
   - promo / free-tier user

Verification:

- App Store payer does not hit Stripe-only portal flow
- inherited user still cannot manage partner-owned billing
- subscription UI copy is correct for each source

Course correction:

- if source detection is incomplete, do not ship UI copy that implies management is supported when it is not

## Phase 3 — Centralize Route Ownership

Target findings:

- `AUD-004`
- `AUD-009`
- `AUD-014`

Actions:

1. create a single route-ownership manifest
2. encode `/support/` ownership explicitly
3. derive or validate:
   - Vercel rewrite rules
   - PWA navigate fallback denylist
   - SEO inventory exceptions
4. deploy current local SEO fixes through preview
5. block release until preview and production SEO audits agree

Verification:

- `/support/` serves the intended owner in preview
- preview `seo:audit` passes against the current inventory
- production catches up with missing pair hubs and the stale couples link

Course correction:

- if a route cannot have a unique SEO surface, mark it deliberately as SPA-only everywhere instead of leaving half-implemented public pages in source

## Phase 4 — Bound Query Costs and Hidden Runtime Work

Target findings:

- `AUD-007`

Actions:

1. add explicit pagination and fetch budgets to:
   - chats
   - messages
   - dictionary
   - word scores
2. change `PersistentTabs` behavior so heavy surfaces do not keep full runtime behavior when hidden
3. instrument query counts and payload sizes
4. cap offline precache scope or make it incremental

Verification:

- initial app load does not fetch entire historical datasets
- hidden tabs do not keep unnecessary listeners or data churn alive
- offline cache size and sync time are measurable and bounded

Course correction:

- if unmounting breaks user experience, pause background behavior before rewriting the full navigation model

## Phase 5 — Reconcile the Design System and Docs

Target findings:

- `AUD-008`
- `AUD-012`

Actions:

1. rewrite docs so they describe current truth, not desired truth
2. converge app/blog typography and token sources
3. clean the highest-signal violations first:
   - raw emoji in product UI
   - hardcoded colors in app shell and account UI
   - blog base layout font mismatch
4. add lightweight doc/link validation

Verification:

- design docs match shipped fonts and token sources
- app/blog typography is intentionally shared or intentionally documented as divergent
- stale branch/file references are removed

Course correction:

- do not try to redesign every page at once
- first establish a truthful token contract and then migrate surfaces to it

## Phase 6 — Live Validation and Release Discipline

Target findings:

- all `P1` items
- deployment drift in `AUD-014`

Actions:

1. preview deploy every SEO, routing, or entitlement change
2. run:
   - `npm run seo:inventory`
   - `npm run seo:audit -- --base-url <preview-url> ...`
3. spot-check payment and partner-linking flows
4. inspect Search Console after production deploy

Verification:

- preview audit passes
- prod audit matches preview after release
- Search Console stops reporting duplicate/alternate-canonical drift for the addressed surfaces

## Recommended Ownership

Suggested owner groups:

- security/data boundary: backend + Supabase owner
- CI/tooling split: platform/build owner
- payments: backend + account-UI owner
- route ownership/SEO: blog + platform owner
- design/docs: frontend/design system owner

## Stop Conditions

Stop normal feature work if either of these is still open:

- `AUD-001`
- `AUD-005`

Reason:

- one is a real secret-boundary flaw
- the other means the repo cannot reliably tell you whether fixes are safe
