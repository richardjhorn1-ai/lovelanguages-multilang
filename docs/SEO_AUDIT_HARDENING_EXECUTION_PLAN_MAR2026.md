# SEO Audit And Hardening Execution Plan — March 2026

## Purpose

This plan turns the March 2026 SEO remediation into a repeatable release process.

It is written so that a lower-context or lower-capability agent can still succeed if it follows the steps in order, respects the stop conditions, and records evidence at each gate.

This is not a brainstorming document. It is an execution document.

## Current Baseline

The repo already contains a substantial remediation pass that:

- standardizes canonical URLs onto `https://www.lovelanguages.io`
- standardizes trailing-slash HTML canonicals
- removes known bad sitemap entries such as `/compare/`, `/learn/couples-language-learning/`, and `/learn/{native}/all/`
- reduces legacy locale stubs like `/pl/` and `/fr/` to non-indexable redirect shells
- keeps `story.lovelanguages.io` outside the main indexed surface
- excludes `/support/` from the sitemap because it is currently an SPA route without a unique SSR canonical
- includes a deterministic URL inventory generator at `scripts/seo/generate-url-inventory.mjs`
- includes an HTTP-level deployed-site auditor at `scripts/seo/audit-deployed-seo.mjs`

Live preview validation on March 7, 2026 confirmed:

- `sitemap-pages.xml` had `335` unique URLs
- `sitemap-articles.xml` had `11,490` unique URLs
- representative pages returned direct `200`
- sampled canonical, `og:url`, `twitter:url`, and JSON-LD URLs matched

This baseline is good, but it is not the final state of rigor. The remaining task is to make the audit comprehensive, automatable, and hard to regress.

## Current Status On Main

As of the merged remediation on `main`:

- Phase 1 is implemented
- Phase 2 is implemented
- Phase 3 is implemented
- Phase 2 and Phase 3 also have initial automation scripts

The next work is not to recreate those scripts from scratch.

The next work is:

- make the audit tooling portable across environments
- wire the audit into CI and preview deploys
- harden legacy redirect surfaces
- validate production behavior and Search Console outcomes

## Non-Negotiable Invariants

These rules must not be violated:

- Canonical host is always `https://www.lovelanguages.io`
- Canonical HTML pages always use trailing slashes
- Do not broaden index scope beyond real final pages
- `story.lovelanguages.io` stays isolated and non-indexable
- Sitemaps list only final indexable destinations
- Redirect shells, placeholder hubs, legacy locale stubs, and app-only routes are never canonical sitemap candidates
- Each indexable page has exactly one canonical tag
- Canonical, `og:url`, `twitter:url`, JSON-LD URL fields, breadcrumbs, hreflang targets, and sitemap entries must agree exactly

## Read This First

An agent taking over this work should read these files in this order:

1. `docs/SEO_REMEDIATION_RUNBOOK_MAR2026.md`
2. `docs/SEO_AUDIT_HARDENING_EXECUTION_PLAN_MAR2026.md`
3. `blog/src/lib/urls.ts`
4. `blog/src/components/SEO.astro`
5. `blog/src/pages/sitemap-pages.xml.ts`
6. `blog/src/pages/sitemap-articles.xml.ts`
7. `e2e/blog-seo.spec.ts`
8. `public/pl/index.html` and one other locale stub

Do not start editing before understanding the URL contract and the exclusion rules.

## Required Access

The ideal operator has:

- Vercel CLI access to the `lovelanguages-multilang` project
- correct blog environment variables for preview and production
- Supabase read access to the article tables used by the blog
- GitHub Actions or another Linux CI runner that can run browser tests
- read-only Google Search Console access for `https://www.lovelanguages.io`

Optional but useful:

- Screaming Frog
- GA4 read access
- access to the redirect layer if redirects are managed outside app code

## Known Environment Traps

These are already confirmed and must not be rediscovered the hard way:

- The nested repo may not be linked to the correct Vercel project by default. Verify the nested repo itself is linked to `lovelanguages-multilang`.
- A parent workspace may contain older Vercel or Supabase configuration for a different project. Do not trust parent env files without verification.
- If Supabase queries fail with `Could not find the table 'public.blog_articles' in the schema cache`, the repo is likely pointed at the wrong project.
- Vercel preview deployments add `x-robots-tag: noindex` headers. Do not mistake preview-wide `noindex` headers for a production SEO bug.
- Local Playwright on this machine may fail due Chromium permission issues. Prefer HTTP-level audit locally and full browser runs in CI or another runner.

## Required Artifacts

Every serious audit run should produce these artifacts:

- a URL inventory file
- an audit report for preview
- an audit report for production
- raw lists of failing URLs, if any
- a short decision log for any intentional exclusions or exceptions

Store them under an ignored audit directory such as:

- `tmp/seo-audit/latest/` for the current run
- `tmp/seo-audit/YYYY-MM-DD/` for dated snapshots

## Phase 0 — Safe Starting State

### Goal

Start from a clean, reproducible working state and avoid mixing unrelated changes.

### Steps

1. Run `git status --short`
2. Run `git branch --show-current`
3. If the worktree contains unrelated changes, do not revert them
4. Create a dedicated branch with the `codex/` prefix
5. Record current `HEAD` in the audit notes

### Stop Conditions

Stop and ask for direction if:

- there are unrelated modifications in files you must edit and their intent is unclear
- there are merge conflicts
- the repo is not the nested `lovelanguages-multilang` repo

## Phase 1 — Environment Validation

### Goal

Prove that the operator is auditing the right deployment and the right content backend.

### Steps

1. Verify Vercel auth:
   - `vercel whoami`
2. Verify the nested repo is linked to the correct project:
   - inspect `.vercel/project.json`
   - expected project name: `lovelanguages-multilang`
3. Verify local blog env availability:
   - check for `.env.local` in the nested repo
4. Verify Supabase content access with a read-only query:
   - confirm that published article rows exist
5. Deploy or identify a fresh preview build
6. Fetch `/sitemap-pages.xml` and `/sitemap-articles.xml` from that preview

### Evidence Required

- Vercel project name
- preview URL
- article row count greater than zero
- both sitemaps return `200`

### Stop Conditions

Stop and fix environment first if:

- article row count is zero or unexpectedly tiny
- `public.blog_articles` cannot be found
- preview sitemaps render empty or fail

### Course Correction

If Supabase looks empty:

- relink the nested repo to Vercel
- pull the correct envs into the nested repo
- rerun the content query before doing any SEO analysis

## Phase 2 — Build A Deterministic URL Inventory

### Goal

Create a machine-readable source of truth for what the site intends to expose.

### Deliverable

Review and maintain `scripts/seo/generate-url-inventory.mjs` so it outputs a JSON file with:

- `url`
- `kind` such as `page`, `article`, `methodology`, `redirect_shell`, `legacy_stub`
- `expected_indexable`
- `expected_canonical`
- `source` such as `static`, `dynamic_pair`, `article_db`, `manual_exception`

### Rules

- Include every canonical sitemap candidate
- Include every known exclusion candidate
- Include legacy redirect surfaces explicitly so they can be tested
- Include compare utility pages, tools pages, dictionary pages, support pages, methodology pages, and article pages

### Verification

The inventory generator must fail if:

- canonical URLs do not use `https://www.lovelanguages.io`
- canonical HTML URLs do not end with `/`
- duplicate canonical URLs are generated
- excluded placeholder routes like `/learn/{native}/all/` appear

### Course Correction

If the current inventory script is hard to extend because route logic is fragmented:

- do not paper over it with a manual list
- first centralize route knowledge into helpers or shared route manifests

## Phase 3 — Build An HTTP SEO Auditor

### Goal

Audit the deployed site without depending on a browser for every check.

### Deliverable

Review and maintain `scripts/seo/audit-deployed-seo.mjs`, which should accept:

- `--base-url`
- `--inventory`
- `--sample-size` or `--full`
- `--output`

### Checks Per URL

For each URL, verify:

- HTTP status is correct
- final response is direct `200` for canonical pages
- canonical tag count is exactly one on indexable pages
- canonical target equals expected canonical
- `og:url` equals canonical where present
- `twitter:url` equals canonical where present
- JSON-LD `url`, `mainEntityOfPage`, and breadcrumb URLs agree with canonical
- hreflang alternates use canonical host and trailing slash
- legacy or redirect-only pages are not presented as indexable canonicals
- internal links do not point to known redirect-only roots

### Sitemap Checks

Verify:

- every sitemap response is valid XML
- no duplicate `<loc>` values
- every page-sitemap URL appears in the inventory as indexable
- every article-sitemap URL appears in the inventory as an article or methodology page
- excluded routes do not appear

### Mandatory Failure Conditions

Fail the audit if any of these happen:

- canonical host mismatch
- missing trailing slash on canonical HTML URL
- duplicate canonical tags
- sitemap URL returns redirect or non-`200`
- sitemap contains excluded route classes
- canonical points to a different logical page
- non-indexable legacy page self-canonicalizes to itself

### Output Format

The script must emit:

- summary counts
- failing URL list
- error type counts
- machine-readable JSON output

Do not rely on console logs alone.

## Phase 4 — Redirect Hardening

### Goal

Replace soft redirect shells with cleaner server-side behavior where possible.

### Target Surfaces

- `/pl/`, `/fr/`, `/de/`, `/es/`, `/it/`, `/pt/`
- `/compare/`
- root-level compare detail redirects such as `/compare/love-languages-vs-duolingo/`

### Preferred Outcome

Convert `200 + meta refresh` shells into true HTTP `301` or `308` redirects while preserving:

- absence from sitemap
- non-indexable behavior
- correct destination

### Constraint

If infrastructure makes true redirects difficult in the current release, retain the existing `noindex` shells but open a tracked follow-up. Do not silently declare the problem solved.

### Verification

For every migrated redirect:

- request old URL
- confirm expected redirect status
- confirm final destination
- confirm old URL is absent from sitemap

## Phase 5 — Preview Validation Gate

### Goal

Catch SEO regressions before merge.

### Required Checks On A Fresh Preview

1. Run the HTTP audit script against preview
2. Run build locally or in CI
3. Run `e2e/blog-seo.spec.ts` in a working CI environment
4. Manually inspect at least these URLs:
   - `/`
   - `/learn/`
   - `/learn/en/`
   - `/learn/en/pl/`
   - `/compare/en/`
   - `/tools/name-day-finder/`
   - one live article page from the article sitemap
   - `/sitemap-pages.xml`
   - `/sitemap-articles.xml`
   - `/compare/`
   - `/pl/`

### Important Caveat

Preview-wide `x-robots-tag: noindex` headers are expected on Vercel preview. Do not fail the build solely because preview responses carry that header.

Instead, verify:

- HTML metadata and canonical behavior
- route status behavior
- sitemap content
- redirect behavior

## Phase 6 — Production Validation Gate

### Goal

Confirm that real search-facing behavior matches preview expectations.

### Required Checks

1. Run the HTTP audit script against production
2. Confirm canonical pages return direct `200`
3. Confirm noindex/redirect surfaces behave as designed
4. Re-fetch both sitemaps and compare counts against preview
5. Diff preview and prod audit outputs

### Fail If

- production canonical host differs from `www`
- production serves non-trailing canonical HTML URLs
- preview passed but production route behavior differs materially

## Phase 7 — Search Console Reconciliation

### Goal

Validate that Google is interpreting the site the way the code intends.

### Required Checks

- sitemap submission health
- duplicate without user-selected canonical
- alternate page with proper canonical tag
- excluded by `noindex`
- crawled currently not indexed
- indexed pages count trend

### Decision Rules

- If Search Console shows `www` vs non-`www` fragmentation, reopen canonicalization work immediately
- If redirect shells appear as indexed, prioritize real server redirects
- If live canonical pages are excluded, inspect canonical conflicts and render parity first

## Verification Matrix

Every final implementation should verify at least one page from each class:

- homepage
- learn hub
- native-language learn hub
- language-pair hub
- normal article
- methodology hub
- methodology article
- compare hub
- compare detail page
- tools hub
- tool detail page
- dictionary hub
- dictionary detail page
- support page
- legacy locale stub
- compare root redirect shell

Do not declare success after checking only one surface type.

## CI Requirements

At minimum, CI should run:

1. `npm run build:blog`
2. URL inventory generation
3. HTTP SEO audit against preview
4. browser-based SEO regression tests in a working runner

The merge gate should fail on SEO audit errors.

## Logging Discipline

An executing agent must keep a short audit log with:

- commit hash audited
- environment audited
- preview URL
- article count
- page sitemap count
- article sitemap count
- failures found
- fixes applied
- final pass/fail result

Do not rely on memory or chat history as the only record.

## Definition Of Done

The work is only done when all of the following are true:

- URL inventory is generated deterministically
- deployed HTTP audit passes on preview
- browser-based SEO regression suite passes in CI
- production audit passes
- known legacy redirect surfaces are either upgraded to real redirects or explicitly tracked as a remaining exception
- Search Console shows no new canonical fragmentation after deployment

## Fast Failure Heuristics

If any of these happen, stop normal auditing and fix the root cause first:

- article sitemap is nearly empty
- page sitemap contains `/all/`
- page sitemap contains `/compare/`
- canonical host is not `www`
- preview and production are using different data backends
- one page emits two canonicals

## Recommended Next Build-Out

The next engineer or agent should work in this order:

1. Make the existing inventory and audit scripts portable and CI-friendly
2. Add a CI workflow that deploys preview then runs the audit
3. Harden legacy redirect shells into real redirects where feasible
4. Automate production audit runs and preview-vs-prod diffing
5. Add a Search Console review checklist after production deploy

This order matters. Do not start with Search Console dashboards before the code-level and HTTP-level audit tools are stable and portable.
