# SEO Remediation Runbook — March 2026

## Summary

This runbook is the source of truth for fixing and maintaining Love Languages SEO after the February 2026 discoverability collapse.

The intended public architecture is:

- App and landing surface at `/`
- Search-focused multilingual content under `/learn/{native}/{target}/...`
- Optional public utility sections only if they are real, canonical, indexable pages
- `story.lovelanguages.io` kept separate and non-indexable while password-gated

The core failure mode was not one bug. Multiple layers disagreed about URL truth at the same time:

- sitemap entries
- redirects
- canonicals
- hreflang
- JSON-LD
- legacy public pages
- host normalization (`www` vs non-`www`)
- path normalization (trailing slash vs no trailing slash)

The remediation goal is simple:

1. Pick one canonical URL for every indexable page.
2. Emit that URL consistently everywhere.
3. Exclude every non-final or non-content URL from SEO surfaces.

## Canonical URL Contract

### Canonical host

- Canonical production host is `https://www.lovelanguages.io`

### Canonical path format

- Canonical HTML pages use trailing slashes
- Non-trailing-slash variants may exist only as redirects to the trailing-slash version
- Redirect URLs are never canonical and never sitemap candidates

### Canonical truth hierarchy

Every public page must have exactly one final canonical URL, and the following must all agree with it:

- HTML canonical tag
- Open Graph URL
- Twitter URL
- JSON-LD URL / `mainEntityOfPage` / breadcrumb items
- hreflang alternate URLs
- sitemap entries
- internal SEO links

### Required helper policy

No page template should hand-type a production canonical URL unless there is no helper available.

Use one shared URL builder for:

- canonical URLs
- hreflang alternates
- sitemap URLs
- JSON-LD URLs

If a new page cannot be expressed through the shared URL helper, the helper must be expanded first.

## Intended Indexable Surfaces

These surfaces are allowed to be indexable if they are real destination pages:

- `/`
- `/learn/`
- `/learn/{native}/`
- `/learn/{native}/{target}/`
- `/learn/{native}/{target}/{article}/`
- methodology and topic pages under `/learn/` if they are real content destinations
- utility sections such as `/compare/*`, `/tools/*`, `/dictionary/*`, `/support/*` only when they are final, canonical, contentful pages

## Explicitly Excluded Surfaces

These surfaces must not appear in sitemap, canonical discovery, or indexable SEO paths:

- redirect shells
- meta-refresh pages
- legacy locale root stubs such as `/pl/`, `/fr/`, etc.
- placeholder pseudo-hubs such as `/learn/{native}/all/`
- generic redirect-only roots such as `/compare/` if `/compare/en/` is the real page
- generic redirect-only roots such as `/learn/couples-language-learning/` if `/learn/en/couples-language-learning/` is the real page
- password-gated `story.lovelanguages.io`
- app-only routes that are not intended as search destinations

## Confirmed Problem Classes

### 1. Sitemap emitted non-final URLs

Observed examples:

- `/learn/couples-language-learning/`
- `/learn/{native}/all/`
- redirect-only utility roots

These are invalid sitemap candidates because they redirect or terminate in `404`.

Rule:

- every sitemap URL must resolve directly to an indexable final page with `200`

### 2. Duplicate canonical tags

Observed example:

- `/compare/en/` emitted two canonical tags because the compare page added one manually while the shared layout already emitted one

Rule:

- exactly one canonical tag per page
- shared layouts own canonical emission by default
- page templates may override only when they must, and never by adding a second canonical

### 3. Schema URLs disagreed with canonical URLs

Observed examples:

- homepage canonical used `https://www.lovelanguages.io/` while schema used `https://lovelanguages.io`
- tools and compare JSON-LD used no-trailing-slash URLs while canonical HTML used trailing slash

Rule:

- schema URL values are first-class canonical signals and must match the page canonical exactly

### 4. Legacy public redirect pages stayed crawlable

Observed examples:

- `/pl/`
- `/fr/`

These pages served redirect HTML with self-canonicals on the wrong host.

Rule:

- a legacy page must either be:
  - a real content page, or
  - a proper redirect with no self-canonical SEO presentation, or
  - removed from public SEO surfaces entirely

### 5. Search Console signal fragmentation

Search Console export showed active fragmentation across:

- `www` vs non-`www`
- trailing slash vs no trailing slash

This means Google was seeing multiple versions of the same logical page as separate URLs.

Rule:

- every route migration must include a host/path canonicalization audit, not just routing logic

## Edge-Case Corrections To The Audit

These are corrections or clarifications from the review of the review:

- `BrowserRouter` migration is not the primary SEO issue; inconsistent canonicalization is
- `story.lovelanguages.io` is already separated and explicitly `noindex`; it should stay isolated, not be treated as a main-site SEO target
- duplicate canonicals were confirmed on `/compare/en/`, not assumed globally across every compare page
- the problem is not that trailing slash is inherently better; the problem is inconsistent use of the chosen trailing-slash convention

## Remediation Phases

### Phase 1 — Canonical integrity

Goal: stop emitting contradictory URL signals

Changes:

- centralize canonical URL generation
- normalize homepage schema to `https://www.lovelanguages.io/`
- remove duplicate canonical emitters
- update all hardcoded schema/metadata URLs to match final canonical form
- ensure every indexable page has one canonical tag only

Acceptance criteria:

- no page emits more than one canonical
- canonical, OG URL, Twitter URL, and JSON-LD URL match exactly on representative pages

### Phase 2 — Sitemap cleanup

Goal: only expose final indexable destinations

Changes:

- remove redirect-only and invalid URLs from page sitemap
- ensure article sitemap contains only canonical article and methodology URLs
- verify every sitemap URL resolves directly to `200`
- do not list locale stubs, redirect shells, or placeholder pseudo-hubs

Acceptance criteria:

- sitemap contains no `/all/` URLs
- sitemap contains no redirect-only roots
- sitemap contains no URL that ends in `301 -> 404`

### Phase 3 — Legacy surface cleanup

Goal: eliminate stale crawlable artifacts from prior migrations

Changes:

- retire or hard-exclude `/pl/`, `/fr/`, and similar locale root stubs
- remove self-canonical redirect HTML behavior from legacy pages
- keep only real public pages in the crawlable surface

Acceptance criteria:

- legacy locale stub pages are absent from sitemap
- legacy locale stubs do not present themselves as canonical public pages

### Phase 4 — Utility section decision enforcement

Goal: keep only real utility pages indexable

Changes:

- keep `/compare/*`, `/tools/*`, `/dictionary/*`, `/support/*` indexable only where the page is real, canonical, contentful, and final
- exclude redirect roots or placeholder pages from SEO surfaces
- if a utility root only routes to a default locale, treat it as non-indexable unless converted into a true landing page

Acceptance criteria:

- every indexable utility page is a final destination page
- compare root behavior is consistent with sitemap and canonical rules

### Phase 5 — Story isolation

Goal: preserve separation of password-gated story content

Changes:

- keep story host out of main sitemaps
- keep story host out of main-site canonical/hreflang systems
- preserve explicit `noindex` while password-gated

Acceptance criteria:

- no story URL appears in main SEO surfaces

## Regression Test Checklist

These tests should live in automated SEO checks and be run on every SEO-related change.

### Canonical tests

- every tested page has exactly one canonical tag
- compare index pages do not emit duplicate canonicals
- homepage canonical uses `https://www.lovelanguages.io/`

### Schema tests

- homepage JSON-LD URL matches homepage canonical exactly
- utility page JSON-LD URLs match their canonical HTML URLs
- breadcrumb JSON-LD URLs use canonical host and trailing slash

### Sitemap tests

- sitemap index returns XML and references only live child sitemaps
- page sitemap contains no `/learn/{native}/all/`
- page sitemap contains no generic `/learn/couples-language-learning/`
- page sitemap contains no redirect-only utility roots
- every sampled sitemap URL resolves directly to `200`
- article sitemap contains a large expected count and no duplicate `<loc>` values

### Legacy/redirect tests

- legacy locale root pages are excluded from sitemap
- legacy locale pages do not self-canonicalize while meta-refreshing
- non-canonical slash/non-slash variants redirect to the canonical URL
- non-`www` variants redirect to canonical `www`

### Isolation tests

- story host is not present in main sitemaps
- story host remains `noindex`

## Developer Rules Going Forward

Before shipping any SEO-affecting change:

1. Decide whether the page is indexable.
2. Define its one canonical URL.
3. Verify that all metadata layers emit that same URL.
4. Verify that the sitemap lists only that final URL.
5. Verify that any legacy URL is a cleanup redirect only, not a sitemap candidate.

Do not add a page to a sitemap because it is public.
Add it only if it is meant to be indexed and is already canonicalized.

Do not keep legacy pages alive because they “still work.”
For SEO, migration leftovers are liabilities unless they are strictly controlled.

## Fresh Session Kickoff Prompt

Use this prompt in a new session:

```text
Read docs/SEO_REMEDIATION_RUNBOOK_MAR2026.md and implement Phase 1 only.

Constraints:
- preserve the canonical host https://www.lovelanguages.io
- preserve trailing slash as the canonical HTML page convention
- do not change story.lovelanguages.io indexing policy
- do not broaden index scope beyond real final pages

Deliver:
- code changes for Phase 1
- any added regression tests
- a concise summary of remaining Phase 2 work
```
