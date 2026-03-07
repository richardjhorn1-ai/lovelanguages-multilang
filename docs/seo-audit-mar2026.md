# SEO Audit TODO — March 7, 2026

## Context
Merged `codex/seo-remediation-mar2026` to main. Production deployed and verified clean for sitemaps, canonicals, JSON-LD, legacy stubs. Two independent audits ran: Codex GPT-5.4 and Claude Opus sub-agent. This is the combined findings list. **No changes made — audit only.**

---

## 🔴 CRITICAL — Fix Soon

### 1. Transient Supabase failures return 404 instead of 503
**Found by:** Claude sub-agent
**File:** `blog/src/lib/blog-api.ts` (every function), `blog/src/pages/learn/[...slug].astro` line 55
**Issue:** When Supabase is down or rate-limited, `getArticle()` returns `null`, and the page returns 404. Google will de-index articles during a transient outage.
**Fix:** Return 503 with `Retry-After` header instead of 404 when the failure is Supabase-side, not a genuinely missing article.

### 2. HowTo schema steps are generic templates — spam risk
**Found by:** Claude sub-agent
**File:** `blog/src/layouts/ArticleLayout.astro` lines 183-205
**Issue:** Every HowTo-flagged article gets identical 4 placeholder steps ("Read and understand", "Practice pronunciation", etc.) across all ~11K articles. Google has been cracking down on templated structured data since late 2023 — could flag as spammy and issue manual action against all rich results.
**Fix:** Either generate article-specific steps from content, or remove HowTo schema entirely and rely on FAQ + BlogPosting.

### ~~3. Hreflang can point to deleted/non-canonical articles~~ — FALSE POSITIVE
**Found by:** Claude sub-agent
**Status:** ❌ INVALID — Claude hallucinated this. Code already has `.eq('published', true)` AND `.eq('is_canonical', true)` in `getAlternatesByTopicId()` (line ~479). No action needed.

---

## 🟠 HIGH — Should Fix

### 4. `getLanguagePairs()` fetches ALL published rows (~11,490) and aggregates in JS
**Found by:** Claude sub-agent
**File:** `blog/src/lib/blog-api.ts` lines 149-174
**Issue:** Downloads all rows just to count by language pair. Fires on every hub page. Under crawl load, this hammers Supabase.
**Fix:** Use a Supabase RPC or `GROUP BY` SQL query instead.

### 5. Related articles fetch is unbounded (fetches 50, uses 3)
**Found by:** Claude sub-agent
**File:** `blog/src/pages/learn/[...slug].astro` lines 64-76
**Issue:** Every article page fetches 50 sibling articles to pick 3 related ones. 50× more data than needed per render.
**Fix:** Target query: `limit: 3` with `.eq('category', article.category)`.

### 6. No DB timeouts or retries
**Found by:** Codex GPT-5.4
**File:** `blog/src/lib/blog-api.ts` line 14 (global Supabase client)
**Issue:** No timeout config, no retry logic. Transient network blips become user-visible failures.
**Fix:** Add `fetch` timeout wrapper and simple retry (1 retry, 2s timeout).

### 7. `x-default` hreflang falls back to self for non-English pages
**Found by:** Claude sub-agent
**File:** `blog/src/layouts/ArticleLayout.astro` line ~227
**Issue:** When no English alternate exists, a French article declares itself as `x-default`. French page shouldn't be global default.
**Fix:** Omit `x-default` entirely when no English version exists.

### 8. `vercel.json` nearing redirect limit (~800+ of 1,024 Hobby limit)
**Found by:** Claude sub-agent
**File:** `vercel.json` — 2,325 lines
**Issue:** Each slug rename adds redirects. Will silently fail once limit hit.
**Fix:** Move old-slug redirects to middleware or database lookup.

---

## 🟡 MEDIUM — Nice to Fix

### 9. Reverse article href may be wrong format
**Found by:** Codex GPT-5.4
**File:** `blog/src/layouts/ArticleLayout.astro` line 534
**Issue:** `href={/learn/${reverseArticle.slug}/}` — uses just slug without lang prefix? Need to verify the actual slug format stored in Supabase includes the full path or not.
**Investigate:** Check what `reverseArticle.slug` actually contains.

### 10. `date` fallback creates unstable `datePublished`
**Found by:** Claude sub-agent
**File:** `blog/src/layouts/ArticleLayout.astro` line 100
**Issue:** If article has null `date`, every render uses today's date in JSON-LD. Google sees `datePublished` changing daily = thin content signal.
**Fix:** Fall back to `created_at` or fixed sentinel.

### 11. Topic pages (`/learn/{lang}/topics/{topic}/`) redirect — remove from URL inventory
**Found by:** Automated audit
**Issue:** 108 topic pages return 302 → native hub. Not real destination pages. The URL inventory generator includes them as indexable but they aren't.
**Fix:** Update `generate-url-inventory.mjs` to mark topic pages as redirect/excluded, or verify which topic pages are real vs redirect.

---

## 🟢 TESTING GAPS

### 12. No e2e test for actual article pages
**Found by:** Claude sub-agent
**File:** `e2e/blog-seo.spec.ts`
**Missing:** Article canonical, JSON-LD mainEntityOfPage, hreflang, og:locale tests on real article pages.

### 13. No hreflang reciprocity test
**Found by:** Claude sub-agent
**File:** `e2e/blog-seo.spec.ts`
**Missing:** If page A declares hreflang→B, B must declare hreflang→A. Zero tests for this.

### 14. No Supabase-down scenario test
**Found by:** Claude sub-agent
**Missing:** Test that a Supabase failure returns 503 not 404.

---

---

## 📋 E2E TESTING AUDIT (Claude Opus sub-agent)

### Current Coverage (what's tested)
The `blog-seo.spec.ts` suite (~350 lines, 13 issues) covers:
- Sitemap structure, hygiene, URLs (thorough)
- Hub page canonical/JSON-LD (good)
- Trailing slashes in sitemaps + redirects (good)
- Legacy redirect/stub cleanup (good)
- Cross-sitemap consistency, lastmod integrity
- og:locale format, redirect chains, internal links

### Gap #1: Article pages have ZERO test coverage 🔴
**Risk:** CRITICAL — articles are 99%+ of the site (11,490 of ~11,600 pages)
**What's untested:** Article canonical tags, BlogPosting JSON-LD, BreadcrumbList (5 levels), HowTo/FAQPage conditional schemas, og:type, article:published_time, hreflang tags
**Tests to add:**
- Article returns 200 with exactly 1 canonical (trailing slash)
- Canonical matches og:url
- BlogPosting JSON-LD has valid datePublished/dateModified (dateModified >= datePublished)
- BlogPosting mainEntityOfPage.@id === canonical URL
- BreadcrumbList has 5 items with correct hierarchy, all trailing slashes
- og:type is "article"

### Gap #2: Hreflang reciprocity not tested 🔴
**Risk:** CRITICAL — Google requires reciprocity or ignores hreflang entirely
**Tests to add:**
- Article has self-referencing hreflang
- x-default points to English version (or self if English)
- If A→B hreflang exists, fetch B and verify B→A exists
- Hreflang href URLs return 200 (not 404)
- Hreflang values are valid language codes

### Gap #3: Article JSON-LD schema validation 🟡
**Tests to add:**
- HowTo schema only appears for "How to" titled articles
- FAQPage mainEntity items have non-empty question and answer
- All breadcrumb URLs have trailing slashes

### Gap #4: Article 404 handling and edge cases 🟡
**Tests to add:**
- `/learn/en/pl/nonexistent-slug/` returns 404 (not 500)
- `/learn/en/all/some-slug/` redirects 301 correctly
- `/learn/en/en/some-slug/` returns 404
- Less than 3 slug segments returns 404

### Gap #5: `<html lang="">` attribute correctness 🟡
**Tests to add:**
- French article has `<html lang="fr">`
- html lang matches og:locale language component

---

## ⚡ PERFORMANCE & RELIABILITY AUDIT (Claude Opus sub-agent)

### Per-Article SSR Load Profile
Every hit to `/learn/[native]/[target]/[slug]/` triggers 3 sequential Supabase queries:

| # | Function | Rows | Est. transfer |
|---|----------|------|---------------|
| 1 | `getArticle()` | 1 row | ~25-55 KB (`select('*')`) |
| 2 | `getArticlesByLangPair(limit:50)` | up to 50 rows | ~30 KB |
| 3 | `getAlternatesByTopicId()` | ~17 rows | <1 KB |

**Total: 3 HTTP requests, ~51 rows, ~56-86 KB per render**

### P1: No application-level caching 🔴
**File:** `blog-api.ts`, `astro.config.mjs`
**Issue:** Zero caching between SSR and Supabase. Vercel edge CDN (`s-maxage=86400`) is the only protection. On fresh deploy + Googlebot crawl: 1,000+ unique URLs = 3,000+ simultaneous Supabase queries with no cache absorption.
**Fix:** Add in-memory LRU cache with TTL for `getArticlesByLangPair` and `getAlternatesByTopicId` (identical data for every article in same lang pair). Even 60s TTL would collapse thousands of redundant queries.

### P2: `select('*')` over-fetches ~2x data 🟠
**File:** `blog-api.ts` line 59
**Issue:** Returns both `content` (markdown, ~8KB) and `content_html` (rendered HTML, ~18KB). Page only uses `content_html` with `content` as fallback. ~25-55KB per row when targeted select would be ~20-35KB.
**Fix:** Replace `select('*')` with explicit column list excluding `content`.

### P3: Fetch 50 rows to display 3 🟠
(Same as finding #5 above)
**File:** `[...slug].astro` lines 67-77
**Fix:** 2 targeted queries: `WHERE category = X LIMIT 3` then fallback if needed.

### P4: Queries run sequentially, not in parallel 🟡
**File:** `[...slug].astro` lines 53, 67, 98
**Issue:** `getArticlesByLangPair` and `getAlternatesByTopicId` are independent but run sequentially. Could save ~50-150ms per render with `Promise.all()`.

### P5: Errors silently return empty data 🟡
(Same as finding #1 above — different angle)
**Issue:** `getArticlesByLangPair` and `getAlternatesByTopicId` errors return `[]` silently. Articles render without related articles or hreflang tags. **SEO degrades silently with no alerting.**

---

## Codex GPT-5.4 vs Claude Opus — Comparison

### What Codex caught that Claude didn't:
- Reverse article slug format concern (line 534)
- Emphasized the scale risk of every page hitting Supabase more concisely

### What Claude caught that Codex didn't:
- HowTo schema spam risk (specific Google policy)
- x-default hreflang fallback issue
- vercel.json redirect limit risk
- date fallback instability
- Specific testing gaps (5 distinct missing test scenarios)
- getLanguagePairs() inefficiency (specific query optimization)

### Assessment:
- **Codex GPT-5.4**: Better at broad architectural concerns and spotting routing/URL issues. Faster at seeing "this pattern doesn't look right" at a glance. Struggled with reading large files (kept timing out).
- **Claude Opus sub-agent**: More thorough, found more issues, cited specific lines and Google policies. Better at understanding SEO implications and testing gaps. Handled large file reads easily.
- **Best workflow**: Use Codex for quick pattern-spotting on focused questions. Use Claude sub-agents for comprehensive deep audits. Run both and compare.

---

## Production Audit Log (required by execution plan)

- **Commit:** 9cb59033 (merge of codex/seo-remediation-mar2026)
- **Environment:** Production (www.lovelanguages.io)
- **Preview URL:** lovelanguages-multilang-q9pwuw9lc-richardjhorn1-6035s-projects.vercel.app
- **Article count:** 11,933 (Supabase), 11,490 (sitemap)
- **Page sitemap count:** 334
- **Article sitemap count:** 11,490
- **Preview audit:** ✅ PASS — 572 checks, 0 failures
- **Production audit (post-merge):** 108 canonical_mismatch on topic pages (302 redirects, not real pages — expected)
- **All other production checks:** PASS
- **Final result:** PASS (topic page redirects are architectural, not a regression)
