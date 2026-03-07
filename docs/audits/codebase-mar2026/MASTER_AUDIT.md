# Master Audit

## Executive Summary

This audit covers the full current working tree of `lovelanguages-multilang` on `main` at `9cb59033ef1aa2afd3b70825d34908933506fa9e`, including local modifications that have not yet been committed. The codebase is not failing because of one isolated bug. It is carrying four systemic problems at once:

1. data and secret boundaries are weak
2. route ownership is fragmented across multiple runtimes
3. the repo behaves like a multi-project workspace but its tooling does not
4. design and documentation sources of truth are stale or split

The highest-risk finding was `AUD-001`: linked partners could read the full `profiles` row while provider state lived on that same row. That boundary has now been remediated in the local tree (partner-safe view + private-state cleanup migration), but remains pending deployment confirmation.

The next tier of risk is operational and revenue-facing:

- App Store subscription management is now source-aware in UI and covered by unit tests, but still needs live confirmation (`AUD-003`)
- `/support/` ownership is fixed in local config but not yet confirmed in production (`AUD-004`)
- CI/test signals are now materially trustworthy in local runs and CI wiring (`AUD-005`)
- analytics ingestion hardening is fixed locally and awaiting deployment (`AUD-006`)

The audit also confirmed an important deployment fact: production SEO is still behind the current working tree. The local tree contains fixes that production has not yet picked up (`AUD-014`).

## Finding Counts

- `P0`: 1
- `P1`: 6
- `P2`: 7
- `P3`: 0

Detailed finding records live in `ISSUE_LEDGER.md` and `ISSUE_LEDGER.json`.

## Top P0/P1 Findings

| ID | Priority | Summary | Status |
| --- | --- | --- | --- |
| `AUD-001` | `P0` | Linked partners can read secret-bearing profile columns | `fixed_locally_not_deployed` |
| `AUD-002` | `P1` | Apple refresh-token handling is schema-drifted | `fixed_locally_not_deployed` |
| `AUD-003` | `P1` | App Store subscription management still assumes Stripe | `fixed_locally_not_deployed` |
| `AUD-004` | `P1` | `/support/` Astro page is rewritten to the SPA homepage in production | `fixed_locally_not_deployed` |
| `AUD-005` | `P1` | CI/test gates are broken and misleading | `fixed_locally_not_deployed` |
| `AUD-006` | `P1` | Analytics ingestion accepts arbitrary `user_id` | `fixed_locally_not_deployed` |
| `AUD-014` | `P1` | Production SEO is behind the current working tree | `fixed_locally_not_deployed` |

## Systemic Themes

### 1. Boundaries are under-specified

`profiles` is simultaneously a public relationship table, a user-settings table, a subscription state table, and now a secret-bearing operational table. Public route ownership is also distributed across React, Astro, Vercel, and Workbox. In both cases, the system is relying on convention instead of hard boundaries.

### 2. Repo topology and toolchain topology do not match

The repo contains at least four meaningful surfaces:

- the React app
- the Astro blog
- the promo-video package
- the Capacitor mobile wrapper

Root verification is now split into project-aware scripts/jobs (`typecheck:app`, `typecheck:api`, `typecheck:blog`, `test:unit`, separate app/blog builds) and currently passes in local validation.

### 3. Documentation says "done" in places where the code clearly says "not yet"

This is most obvious in the design system docs, testing checklist, and architecture notes. The repo is carrying multiple conflicting truths at once.

## Subsystem Summaries

### Architecture

- Route ownership is the central architectural weakness. `vercel.json`, `App.tsx`, Astro pages, the PWA fallback denylist, and the SEO inventory each know a different subset of the route map.
- The concrete failure is `/support/`, but the underlying issue is broader than that.
- Current-state and target-state architecture docs are in `ARCHITECTURE_CURRENT_STATE.md` and `ARCHITECTURE_TARGET_STATE.md`.

### Security, Privacy, and Data

- `AUD-001` and `AUD-002` are the most important data findings.
- Local remediation now removes partner reads from raw `profiles` via an allowlisted partner view and migrates provider fields to `profile_private`; deployment confirmation is pending.
- `AUD-006` is remediated locally with JWT-derived identity, origin allowlisting, payload checks, and ingestion rate limiting.

### Payments and Entitlements

- Subscription management now branches by source (Stripe portal vs App Store management) and the entitlement payload includes self/shared/effective sections.
- Unit tests now cover source-aware management behavior and partner-impact confirmation.
- Remaining risk is deployment confirmation across live billing surfaces.

### Frontend, Mobile, and Offline

- The app has a workable offline foundation, but current data loading is still unbounded.
- Persistent mounted tabs keep expensive surfaces alive even when hidden.
- Capacitor config itself looks healthier than the stale offline review doc suggests, but native projects are not present in-repo, so some iOS assumptions remain unverified.

### Blog, SEO, and Content Tooling

- Local SEO tooling is strong enough now to surface deployed drift, which is exactly what happened in this audit.
- The current working tree appears materially better than production on sitemap completeness and redirect-root linking.
- Blog image-sitemap generation now fails closed when required fetches fail, preventing silent degraded sitemap output.
- The blog also forms a second design system, which increases maintenance cost and route-ownership confusion.

### Testing, CI, and Build

- Lint, app/api/blog typecheck, and unit tests now run as real gates and pass locally.
- Root build is hermetic with no nested install, and sitemap generation fails closed on missing required inputs.
- Runtime dependency audit (`npm audit --omit=dev --audit-level=high`) is now green.

### Design and Documentation

- The app and blog do not share a single credible design system in practice.
- Stale docs were rebaselined to current contracts/audit artifacts and historical snapshots are now marked explicitly.
- Remaining work is code-level token convergence and emoji/raw-color cleanup across app/blog.

## Hotspot Files

These are the highest-risk or highest-complexity files reviewed during the audit:

- `components/landing/showcase/demoContent.ts`
- `components/ChatArea.tsx`
- `blog/src/data/language-hub-data.ts`
- `blog/src/data/polish-dictionary.ts`
- `blog/src/data/comparison-features.ts`
- `components/onboarding/Onboarding.tsx`
- `components/Landing.tsx`
- `components/Hero.tsx`
- `components/FlashcardGame.tsx`
- `components/Progress.tsx`
- `components/LoveLog.tsx`
- `api/chat.ts`
- `blog/src/lib/blog-api.ts`

The most important hotspot pattern is not just file size. It is "large file plus shared responsibility plus direct database calls plus UI state."

## Visual / Design-System Summary

The React app and Astro blog are currently operating as adjacent but distinct visual systems:

- the app loads Nunito/Manrope and is supposed to be CSS-variable driven
- the blog loads Quicksand/Outfit and carries its own editorial gray/pink palette
- several app surfaces still use hardcoded colors and raw emoji despite docs prohibiting both

See `DESIGN_SYSTEM_AUDIT.md` for the full comparison and flow review.

## Live Confirmation Summary

Targeted live confirmation was intentionally narrow and mapped back to existing findings.

Confirmed live:

- `https://www.lovelanguages.io/support/` serves the SPA homepage shell, not the Astro support page (`AUD-004`)
- production `sitemap-pages.xml` does not include `/support/`
- constrained production SEO audit:
  - `334` page-sitemap URLs
  - `11490` article-sitemap URLs
  - `67` expected page-sitemap URLs missing relative to the current local inventory
  - `1` forbidden internal link from `/learn/` to `/learn/couples-language-learning/`

Interpretation:

- the local working tree is ahead of production on some SEO fixes
- there is still no deployment gate proving that local SEO changes reached prod

## What Was Verified Successfully

- `npm run build:blog` passed
- `npm run build:app` passed, but produced a `3.24 MB` main chunk warning
- `npm run lint` passed
- `npm run typecheck:app` passed
- `npm run typecheck:api` passed
- `npm run typecheck:blog` passed (`0` errors, hints only)
- `npm run test:unit` passed (`60/60`)
- `npm run seo:inventory -- --output-dir tmp/seo-audit/latest` passed
- `npm run seo:validate-routes` passed
- `npm audit --omit=dev --audit-level=high` passed

These positives materially improve gate truthfulness and close the local `AUD-005` gate-correctness gap.

## Definition of Done for This Audit

This audit should be treated as complete only when:

- P0 and P1 items have owners and remediation branches
- route ownership is made explicit enough to remove `/support/`-style ambiguity
- repo verification is split into honest project-level gates
- the preview/prod SEO audit path is enforced before deployment

The execution order to get there is in `REMEDIATION_PLAN.md`.
