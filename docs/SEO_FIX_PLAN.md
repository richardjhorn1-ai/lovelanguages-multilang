# SEO Fix Plan — Ahrefs Audit March 2026

**Branch:** `fix/ahrefs-seo-audit`
**Goal:** Fix all real issues from Ahrefs crawl + add internal linking to all articles

---

## Phase 1: Quick Wins (same session, ~1.5 hrs)

### Fix 1: H1 → H2 conversion in article content
- [ ] Edit `blog/src/lib/sanitize-content.ts`
- [ ] If H1 in content matches article title → remove it entirely
- [ ] If H1 in content differs from title → convert to H2
- [ ] Test with a few articles that have H1 in content

### Fix 2: Meaningful alt text on images
- [ ] `blog/src/components/Navigation.astro` — `alt=""` → `alt="Love Languages"`
- [ ] `blog/src/layouts/ArticleLayout.astro` footer — `alt=""` → `alt="Love Languages"`
- [ ] `blog/src/pages/learn/index.astro` footer — same
- [ ] `blog/src/pages/learn/[nativeLang]/index.astro` footer — same
- [ ] `blog/src/pages/learn/[nativeLang]/[targetLang]/index.astro` footer — same
- [ ] `blog/src/pages/learn/[nativeLang]/couples-language-learning.astro` footer — same
- [ ] `blog/src/pages/learn/[nativeLang]/topics/[topic]/index.astro` footer — same
- [ ] `blog/src/pages/tools/index.astro` footer — same
- [ ] `blog/src/pages/tools/name-day-finder.astro` footer — same
- [ ] `blog/src/pages/support/index.astro` footer — same
- [ ] `blog/src/pages/dictionary/index.astro` footer — same
- [ ] `blog/src/pages/dictionary/[slug].astro` footer — same
- [ ] `blog/src/pages/compare/` all files — same
- [ ] Add `role="img"` + `aria-label` to emoji fallback divs in ArticleLayout hero

### Fix 3: Conditional title suffix
- [ ] Edit `blog/src/layouts/ArticleLayout.astro` or `BaseLayout.astro`
- [ ] Logic: if `title.length + " | Love Languages".length > 60` → use title only
- [ ] Otherwise append ` | Love Languages`
- [ ] Verify with a few long/short titles

---

## Phase 2: Structural Fixes (~2 hrs)

### Fix 4: Sitemap cleanup
- [ ] Remove 404 URLs from `blog/src/pages/sitemap-pages.xml.ts`
- [ ] Remove redirected URLs from sitemap generation
- [ ] Verify sitemap-index.xml renders as XML (not caught by SPA rewrite)

### Fix 5: Structured data validation
- [ ] Test 3-5 articles with Google Rich Results Test
- [ ] Fix JSON-LD template issues in ArticleLayout.astro
- [ ] Common issues: missing required fields, wrong types in FAQPage/SpeakableSpecification
- [ ] Re-test after fix

### Fix 6: Reciprocal hreflang
- [ ] Audit `getAlternatesByTopicId()` in `blog/src/lib/blog-api.ts`
- [ ] Ensure bidirectional mappings (if A→B exists, B→A must too)
- [ ] Check articles flagged with missing reciprocal tags

---

## Phase 3: Internal Linking (5am side project, ~2 weeks)

### Strategy
Use the EN→PL articles as the template. Those articles have 10-12 natural contextual links each, pointing to related articles in the same language pair. The ~11,000 translated articles have zero internal links. We replicate the EN→PL pattern across all language pairs.

### Process per language pair
1. **Pull** all articles for the pair from Supabase → local JSON
2. **Build keyword map** — for each article, extract: slug, title, category, H2 headings, key topics
3. **Find link opportunities** — scan each article's text for natural mentions of topics covered by sibling articles
4. **Insert links** — wrap matched text with `<a href="/learn/{native}/{target}/{slug}/">` 
5. **Limit** — max 10-12 links per article (match EN→PL quality, not spammy)
6. **Review** — diff output for the pair, spot-check 3-5 articles
7. **Upload** — batch update `content_html` in Supabase

### Execution order
Start with pairs that have the most articles/traffic, English first:

| # | Pair | Articles | Priority |
|---|------|----------|----------|
| 1 | en→pl | ~70 | Template (already done) |
| 2 | en→fr | ~50 | High traffic |
| 3 | en→de | ~50 | High traffic |
| 4 | en→es | ~50 | High traffic |
| 5 | en→it | ~50 | High traffic |
| 6 | en→pt | ~50 | High traffic |
| 7 | fr→* | ~300 | Second native lang |
| 8 | es→* | ~300 | Third native lang |
| 9 | de→* | ~300 | Continue... |
| 10+ | remaining pairs | ~9,000+ | Batch the rest |

### Technical details
- Script: `scripts/add-internal-links.py` (or .ts)
- Input: Supabase articles (pulled to `data/articles/{native}-{target}.json`)
- Output: Modified JSON with updated `content_html`
- Upload script: `scripts/upload-linked-articles.py`
- All diffs saved to `data/link-diffs/` for review

### 5am Cron Job
- One language pair per night
- Pull → link → save locally → commit to branch
- Richard reviews diffs before upload

---

## Summary

| Phase | Fixes | Effort | Timeline |
|-------|-------|--------|----------|
| 1 | H1 fix, alt text, title suffix | ~1.5 hrs | Now |
| 2 | Sitemap, structured data, hreflang | ~2 hrs | This week |
| 3 | Internal linking (all articles) | ~2 weeks | 5am side project |

**Total SEO impact:** Fixes issues affecting 6,283+ pages, adds 100k+ internal links across the blog.
