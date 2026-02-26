# SEO Fix Plan — Feb 25, 2026

## Status Key
- [ ] Not started
- [x] Done

---

## ✅ Phase 0: Emergency Fix (DONE)
- [x] Added RLS policy for public SELECT on `blog_articles`
- [x] Richard redeployed to clear Vercel cached 404s
- [x] Verified: all 11,933 articles serving HTTP 200

---

## ✅ Phase 1: Quick Code Fixes (DONE — deployed to main)
- [x] 1.1 Removed duplicate Article JSON-LD from SEO.astro (kept BlogPosting in ArticleLayout)
- [x] 1.2 Fixed og:url www mismatch on homepage (+ og:image, twitter:url, twitter:image)
- [x] 1.3 Fixed Twitter meta tags (property→name, added twitter:site @lovelanguagesio)
- [x] 1.4 Added dateModified using Supabase updated_at (+ article:modified_time OG tag)
- [x] Verified live: Googlebot gets full HTML, correct structured data, no redirects

---

## Phase 2: Build & Config Cleanup (low priority)

### 2.1 Remove stale sitemap copy from build script
- **File:** `package.json` build script
- **Action:** Remove `cp -f dist/sitemap-*.xml .vercel/output/static/`
- **Why:** Copies `sitemap-images.xml` from build time as a static file. The SSR version is more up-to-date. Low-impact but stale data.

### 2.2 Remove redundant meta tags from SEO.astro
- **File:** `blog/src/components/SEO.astro`
- **Action:** Remove `<meta name="title">` and `<meta name="language">` tags
- **Why:** Neither is recognized by any search engine or social platform.

---

## 🔥 Phase 3: Content Data Fixes (next up)

### 3.1 Fix broken internal links in articles
- **Scope:** 12 articles, 107 broken links total
- **What:** Links use old format `/learn/slug/` or `/learn/es/slug/` instead of `/learn/{native}/{target}/slug/`. These 302 redirect to `/learn/` hub — dead ends that pass zero PageRank.
- **Affected articles (mostly Polish content):**
  - `en/pl/50-polish-terms-of-endearment-complete-guide-to-polish-pet-names/`
  - `en/pl/best-way-to-learn-polish-for-your-partner-in-2025-complete-guide/`
  - `en/pl/is-polish-hard-to-learn-honest-answer-for-english-speakers/`
  - `es/pl/50-polish-terms-of-endearment-complete-guide-to-polish-pet-names/`
  - `es/pl/best-way-to-learn-polish-for-your-partner-in-2025-complete-guide/`
  - + 7 more
- **Fix:** SQL update in Supabase to rewrite old-format links to correct `/learn/{native}/{target}/slug/` format
- **Steps:**
  1. [x] Audit: 12 articles, 107 links identified
  2. [ ] Map: old slugs → correct native/target/slug paths
  3. [ ] Fix: bulk update content_html in Supabase
  4. [ ] Verify: curl sample articles to confirm links resolve to 200

### 3.2 Fix English FAQ on non-English pages
- **What:** Some non-English articles (e.g. fr/de) have FAQ schema with English questions
- **Scope:** Needs audit — how many non-English articles have English FAQ content
- **Fix:** Either translate FAQ or remove FAQ schema from affected pages

### 3.3 Thin content audit
- **What:** Some articles have <500 words
- **Action:** Identify all articles below threshold, expand or consolidate

---

## Lower Priority (Do When Convenient)
- [ ] Image sitemap only covers 872/11,490 articles — expand coverage
- [ ] OG images are large (236-494 KB) — compress
- [ ] Add `og:image:width/height/alt` tags
- [ ] Add `cache-control: s-maxage` for predictable edge caching
- [ ] HowTo schema steps are generic — make article-specific or remove
- [ ] Title tags over 60 chars on some international articles
- [ ] Meta descriptions over 160 chars on some articles
- [ ] Old `/learn/language/xxx/:path*` redirects drop article slug (vercel.json)

---

## ✅ Google Recovery Actions (Feb 25)
- [x] Resubmitted sitemap-index.xml in GSC
- [x] Resubmitted sitemap-articles.xml in GSC
- [x] Submitted sitemap-pages.xml in GSC
- [x] Request indexing on top 10 articles (Richard doing manually, 10/day limit)
- [ ] Monitor: expect 2-4 week recovery timeline from Feb 1 crash

## 🔥 Feb 26 Findings & Actions

### Done
- [x] **366 old MDX slug redirects** — deployed in middleware (301 to new Supabase slugs)
- [x] **IndexNow** — all 11,490 URLs submitted to Bing/Yandex
- [x] **Google Indexing API** — enabled, authorized, script built. 61 URLs submitted day 1. Daily cron at 9am submits from sitemap (canonical URLs). Script: `~/clawd/scripts/google_indexing_bulk.py`
- [x] **Analytics bug: signup_completed** — was never firing due to Supabase auth trigger race condition. Fixed in App.tsx to also track in the 23505 (duplicate key) handler.
- [x] **Analytics bug: signup_started** — was firing for OAuth logins too, not just signups. Fixed in Hero.tsx with `isSignUp` guard.

### Key Findings (Feb 26)

#### 415 Duplicate URLs in Google (trailing slash split)
- Google indexed both `/slug` and `/slug/` as separate pages for 415 URLs
- 8,035 impressions split across duplicate versions
- Canonical tags and 308 redirects are correct — Google just hasn't consolidated yet
- **Action:** Wait. Indexing API submissions will help Google discover canonical versions.

#### 88% of Google's top pages are redirect URLs
- Of top 50 pages with clicks, 43 return 301/308 redirects, only 7 return 200 OK
- This is WHY structured data (FAQs, breadcrumbs, review snippets) fluctuates — rich results only show for 200 OK pages
- **Action:** Indexing API is now submitting the correct canonical (200 OK) URLs from sitemap daily

#### Content ROI
- 282 of 332 language pairs have >0 Google impressions
- 50 language pairs have ZERO impressions (1,303 articles = 11% of total)
- Dead weight: mostly Hungarian as native language, small Nordic cross-pairs
- Top performers: "pet names / terms of endearment" and "how to say I love you" articles
- **Action:** No immediate action. Focus on getting existing content indexed first.

#### Funnel Analysis (30 days)
- 372 first visitors → 45 form starts → 42 actual signups → 14 onboarding complete
- Real signup rate: ~11% (was hidden by tracking bug showing 2.3%)
- `last_practice_at` is NULL for every single user — nobody returns to practice
- All signups come from homepage. Zero from blog articles (despite CTAs existing)
- **Action:** Investigate why `last_practice_at` never updates. Consider stronger blog→signup CTAs.

#### Bing vs Google
- Bing: 2,275 indexed, growing ~100/day, 41 clicks/30d
- Google: 468 indexed and falling, 224 clicks/30d (mostly from earlier in period)
- Bing thriving because IndexNow works. Google needs time + Indexing API push.

### Still TODO
- [ ] Fix 107 broken internal links in 12 articles (Phase 3.1 above)
- [ ] Fix English FAQ on non-English pages (Phase 3.2)
- [ ] Investigate `last_practice_at` never updating in code
- [ ] Sticky mobile CTA on blog articles missing UTM params (links to bare `/`)
- [ ] Monitor Indexing API daily submissions and quota increases
- [ ] Image sitemap only covers 872/11,490 articles
- [ ] Flag/remove offensive user account

---

## Troubleshooting Log

### Feb 25, 2026 — Articles 404ing
- **Symptom:** All article URLs returning 404, sitemap empty
- **Root cause:** Supabase RLS policy blocking anon key reads on `blog_articles`
- **Fix:** `CREATE POLICY "Allow public read access on blog_articles" ON public.blog_articles FOR SELECT USING (true);` + redeploy
- **Lesson:** When all dynamic pages 404, check Supabase RLS first. Blog uses anon key.

### Feb 26, 2026 — Indexing API First Batch
- **Mistake:** First batch of 61 URLs submitted to Google Indexing API were pulled from GSC (old redirect URLs) instead of sitemap (canonical URLs)
- **Impact:** Wasted daily quota, but not harmful — Google follows 301s to correct pages
- **Fix:** Script rewritten to pull from sitemap. State file tracks submissions to avoid duplicates.

### Feb 26, 2026 — Analytics Tracking Bugs
- **signup_completed** never fired because Supabase auth trigger creates profile before client insert → 23505 duplicate key error skips tracking. Fixed.
- **signup_started** fired for all OAuth clicks including returning user logins. Fixed with `isSignUp` guard.

### Feb 25, 2026 — Audit False Alarms
Sub-agents reported 3 issues as CRITICAL that turned out wrong on manual verification:
1. ❌ "Static sitemap-index.xml shadows SSR" — only images sitemap is static, index is SSR
2. ❌ "Trailing slashes missing in sitemap" — sub-agent checked stale/cached data
3. ❌ "x-default hreflang broken" — logic already correctly finds English alternate
- **Lesson:** Always verify sub-agent findings with live `curl` before presenting as fact
