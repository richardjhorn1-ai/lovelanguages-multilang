# Ahrefs Site Audit — March 3, 2026

**Total pages crawled:** 6,283
**Total issues reported:** 172 types

---

## ✅ ALREADY FIXED

| Issue | Count | Fix |
|-------|-------|-----|
| Links to broken page (`/tools/` 404) | 6,283 | Merged `fix/tools-404` — removed vercel.json rewrites blocking SSR |

---

## 🔴 REAL ISSUES — Fix These

### 1. Duplicate H1 tags (709 pages)
**Severity:** Medium-High (SEO impact)
**Root cause:** ~1,786 articles in Supabase have `<h1>` inside `content_html`. The `ArticleLayout.astro` already renders its own `<h1>` from the title prop. So these pages get 2x H1.
**Fix:** Strip `<h1>` tags in `sanitize-content.ts` — one-line regex addition.
**Effort:** 15 min

### 2. Missing alt text on images (6,283 pages)
**Severity:** Medium (accessibility + SEO)
**Root cause:** The favicon/logo `<img src="/favicon.svg" alt="" class="w-6 h-6">` in `Navigation.astro` and footer has `alt=""` (empty). Ahrefs flags this as missing.
**Fix:** Change `alt=""` to `alt="Love Languages"` in Navigation.astro and footer sections of all layout files.
**Effort:** 30 min

### 3. Title too long (2,984 pages)
**Severity:** Low-Medium (Google truncates but still indexes)
**Root cause:** All titles end with ` | Love Languages` suffix. Average length is 71 chars. 2,983 are >70 chars. Removing the suffix would fix 2,659 of them.
**Fix options:**
  - a) Remove ` | Love Languages` suffix from article titles (simplest, loses brand)
  - b) Shorten the suffix to ` | LL` or remove only when title > 55 chars
  - c) Keep as-is — Google handles this fine, it just truncates in SERPs
**Recommendation:** Option (b) — conditional suffix. If title + suffix > 60 chars, drop the suffix.
**Effort:** 30 min (in ArticleLayout.astro's `<title>` tag)

### 4. Four 404 pages
**Severity:** Low (only 4 pages)
**Root cause:** Likely old URLs that were removed. Need to identify which ones.
**Fix:** Add redirects to vercel.json or remove from sitemap.
**Effort:** 15 min once identified

### 5. Pages with only 1 dofollow internal link (2,605 pages)
**Severity:** Medium (weak internal linking hurts SEO)
**Root cause:** Most articles are only linked from their language pair index page (`/learn/en/pl/`). No cross-linking between related articles within content.
**Fix:** Add "Related Articles" internal links in article content or via component. The related articles section at bottom already exists but may not count as strong enough signals.
**Effort:** 2-4 hours (add contextual internal links via ArticleLayout or content update)

### 6. Structured data validation errors (155 Google + 18 schema.org)
**Severity:** Medium (affects rich snippets)
**Root cause:** Likely issues in the BlogPosting, FAQPage, or SpeakableSpecification schema. Need to check with Google Rich Results Test.
**Fix:** Validate and fix JSON-LD templates in ArticleLayout.astro.
**Effort:** 1-2 hours

---

## 🟡 WORTH MONITORING — Lower Priority

### 7. Meta description too long (601) / too short (278)
**Severity:** Low (Google often rewrites meta descriptions anyway)
**Root cause:** Descriptions come from Supabase `description` field. Some articles have very long or very short descriptions.
**Fix:** Could truncate/pad in ArticleLayout, but ROI is low.
**Recommendation:** Ignore for now. Focus on content quality.

### 8. Missing reciprocal hreflang (489 pages)
**Severity:** Low-Medium
**Root cause:** Article A links to Article B via hreflang, but B doesn't link back to A. This happens when some language versions exist but aren't fully cross-referenced in Supabase.
**Fix:** Ensure `getAlternatesByTopicId()` returns complete bidirectional mappings.
**Effort:** 1-2 hours (query/data fix)

### 9. Hreflang group not fully crawled (5,976)
**Severity:** OVERBLOWN
**Root cause:** Ahrefs free tier couldn't crawl all pages, so it flags hreflang targets it hasn't verified. This is a crawler limitation, not a site issue.
**Fix:** None needed. Would resolve with Ahrefs Pro crawl.

### 10. Orphan pages — no internal links (15)
**Severity:** Low
**Root cause:** Likely edge-case pages (support, dictionary, etc.) that aren't linked from navigation.
**Fix:** Add to footer or sitemap navigation.
**Effort:** 15 min

### 11. Slow pages (85)
**Severity:** Low-Medium
**Root cause:** SSR pages with heavy Supabase queries. Caching headers already set.
**Fix:** Check which specific pages are slow. May need query optimization.
**Effort:** 1-2 hours to investigate

---

## 🟢 OVERBLOWN / IGNORE

### 12. 3XX redirects (12) + redirect chains (1) + HTTP→HTTPS (2)
**Verdict:** Normal. These are intentional redirects in vercel.json. The redirect chain is likely a double-hop (http → https → www). Not worth fixing.

### 13. Noindex pages (1)
**Verdict:** Intentional. Probably a utility page.

### 14. Page has no outgoing links (1)
**Verdict:** Likely a standalone page. Not an issue.

### 15. 3XX in sitemap (8) + 4XX in sitemap (3) + noindex in sitemap (1)
**Verdict:** Minor cleanup. Remove redirected/404'd URLs from sitemap generation.
**Effort:** 15 min

### 16. IndexNow pages to submit (6,284)
**Verdict:** Not an issue — this is Ahrefs suggesting we use IndexNow (Bing's indexing API). We already use Google's Indexing API. Could add IndexNow as bonus.

### 17. Page and SERP titles don't match (5)
**Verdict:** Google sometimes rewrites titles. Not actionable.

---

## 📋 PRIORITY FIX ORDER

| # | Issue | Impact | Effort | Priority |
|---|-------|--------|--------|----------|
| 1 | Strip H1 from article content_html | High | 15 min | 🔴 Do now |
| 2 | Fix empty alt text on logo/favicon | Medium | 30 min | 🔴 Do now |
| 3 | Conditional title suffix | Medium | 30 min | 🟡 Soon |
| 4 | Fix 4 actual 404 pages | Low | 15 min | 🟡 Soon |
| 5 | Structured data validation | Medium | 1-2 hrs | 🟡 Soon |
| 6 | Internal linking improvement | High | 2-4 hrs | 🟡 Next sprint |
| 7 | Reciprocal hreflang fix | Low-Med | 1-2 hrs | 🟡 Next sprint |
| 8 | Sitemap cleanup | Low | 15 min | 🟢 Whenever |
| 9 | Orphan pages | Low | 15 min | 🟢 Whenever |

**Estimated total for top 5 fixes: ~2-3 hours**
