# SEO Fix Plan — Ahrefs Audit March 2026

**Goal:** Fix all real issues from Ahrefs crawl + add internal linking to all articles

---

## Phase 1: Quick Wins ✅ COMPLETE (Mar 3)

### Fix 1: H1 → H2 conversion in article content ✅
- `blog/src/lib/sanitize-content.ts` — regex converts all `<h1>` to `<h2>` before trim
- ~1,786 articles had H1 in content_html on top of layout's H1

### Fix 2: Meaningful alt text on images ✅
- `alt=""` → `alt="Love Languages"` on favicon/logo img across 17 files
- Navigation.astro, ArticleLayout.astro footer, all page templates

### Fix 3: Conditional title suffix ✅
- `blog/src/components/SEO.astro` — only append ` | Love Languages` if total ≤60 chars
- 2,984 pages had titles >70 chars that were getting truncated in SERPs

**Merged to main:** commit `c7e28eee`

---

## Phase 2: Structural Fixes (TODO)

### Fix 4: Sitemap cleanup
- [ ] Remove 404 URLs from sitemap generation
- [ ] Remove redirected URLs from sitemap
- [ ] Verify sitemap-index.xml renders as XML

### Fix 5: Structured data validation
- [ ] Test with Google Rich Results Test
- [ ] Fix JSON-LD template issues in ArticleLayout.astro
- [ ] Re-test after fix

### Fix 6: Reciprocal hreflang
- [ ] Audit `getAlternatesByTopicId()` in `blog/src/lib/blog-api.ts`
- [ ] Ensure bidirectional mappings
- [ ] Fix articles with missing reciprocal tags

---

## Phase 3: Internal Linking ✅ COMPLETE (Mar 3)

### What was shipped
Three-pass approach to maximize coverage:

**V1 (deprecated):** English-only topic patterns. Only 22% coverage.

**V2 — Multilingual inline links** (`scripts/add-internal-links-v2.py`):
- 20 topic dictionaries translated to all 18 languages
- Title/H2 phrase matching (multi-word only, native language text)
- Heading stoplist (Conclusion/Introduction in 18 languages)
- **Result: 7,983 articles, 29,641 inline links**

**Pass 2 — Related Articles sections** (`scripts/add-related-articles.py`):
- Appends `<h2>Related Articles</h2>` (in native language) + `<ul>` list
- Groups by category + slug-topic similarity (30 topic clusters)
- Only targets articles with <3 internal links after V2
- **Result: 8,304 articles, 40,989 related links**

### Combined results
| Metric | Value |
|--------|-------|
| Articles updated | 11,495 / 11,789 (97.5%) |
| Total links added | ~70,630 |
| Inline links (V2) | 29,641 |
| Related section links (Pass 2) | 40,989 |
| Failures | 0 |

### Scripts
| Script | Purpose |
|--------|---------|
| `scripts/add-internal-links-v2.py` | V2 multilingual inline links |
| `scripts/add-related-articles.py` | Pass 2 related articles sections |
| `scripts/upload-internal-links.py` | Merge V2+Pass2, upload to Supabase |
| `scripts/add-internal-links.py` | V1 (deprecated, English-only) |

### Local data backup
- `data/articles-v2/` — 306 JSON files with V2 inline link output
- `data/articles-v2-pass2/` — 306 JSON files with Pass 2 related output
- `data/link-diffs-v2/` — V2 diff summaries
- `data/link-diffs-v2-pass2/` — Pass 2 diff summaries

---

## Summary

| Phase | Status | Impact |
|-------|--------|--------|
| 1. Quick wins (H1, alt, titles) | ✅ Done | 6,283+ pages fixed |
| 2. Structural (sitemap, schema, hreflang) | 🔲 TODO | TBD |
| 3. Internal linking | ✅ Done | 70,630 links across 11,495 articles |
