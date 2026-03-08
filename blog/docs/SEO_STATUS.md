# SEO Status - Love Languages Blog

> Central source of truth for SEO work on the multi-language learning blog.
> Last updated: January 22, 2026 (Session 5)
>
> March 8, 2026 update: historical sections below still describe the English-slug standardization phase. The current canonical article policy is localized/transliterated ASCII slugs for non-English native pages, English slugs for English-native pages, with legacy article aliases handled in the data layer rather than `vercel.json`.

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Static Pages** | 1,715 |
| **Blog Articles** | 1,420 |
| **Hero Images** | 719 ✅ |
| **Dictionary Word Pages** | 109 |
| **Comparison Pages** | 18 (all 6 native langs × 3 pages) ✅ |
| **Tool Pages** | 2 |
| **Name Days in Database** | 1,000+ |
| **Native Languages** | 6 (EN, ES, FR, DE, IT, PT) |
| **Target Languages** | 18 |

---

## Google Search Console Status (Jan 21, 2026)

### Indexing Progress

| Date | Indexed | Not Indexed | Impressions |
|------|---------|-------------|-------------|
| Jan 17 | - | - | 0 |
| Jan 18 | - | - | 0 |
| Jan 19 | - | - | 5 |
| **Jan 20** | **338** | 1,189 | - |

**338 pages indexed in 3 days - excellent progress!**

### Coverage Analysis

| Status | Pages | Assessment |
|--------|-------|------------|
| ✅ **Indexed** | 338 | Working correctly |
| ✅ **Alternate with canonical** | 80 | Hreflang working! |
| ⏳ **Discovered - not indexed** | 1,006 | Normal - will index over time |
| ⚠️ **Page with redirect** | 93 | Normal - non-www → www redirects |
| ⚠️ **Crawled - not indexed** | 8 | See investigation below |
| ⚠️ **Redirect error** | 1 | 3-hop redirect chain |
| ⚠️ **Blocked by robots.txt** | 1 | Will auto-resolve |

### Issue Investigation Results

**"Page with redirect" (93 pages)** - NORMAL
- These are non-www → www redirects
- Standard behavior, no action needed

**"Alternate page with proper canonical" (80 pages)** - SUCCESS
- Google recognizes hreflang alternates
- Same article in different native languages correctly linked

**"Crawled but not indexed" (8 pages)** - IDENTIFIED
- `/compare/` - Has intentional `noindex` meta tag (redirect stub)
- Some hub/landing pages may be considered thin initially
- Will index as site gains authority

**"Redirect error" (1 page)** - MINOR
- Caused by 3-hop redirect chain:
  ```
  http://lovelanguages.io/path/
    → https://lovelanguages.io/path/     (HTTP→HTTPS)
    → https://www.lovelanguages.io/path/ (non-www→www)
    → https://www.lovelanguages.io/path  (trailing slash removal)
  ```
- Low impact, Google can follow

**"Blocked by robots.txt" (1 page)** - AUTO-RESOLVING
- robots.txt allows all: `Allow: /`
- Likely stale data from previous crawl

### Performance Signals (First Impressions!)

| Content | Impressions | Position | Action |
|---------|-------------|----------|--------|
| Ukrainian pet names | 13 | 7.85 | EXPAND - top performer |
| Polish content | varies | 1-4 | Maintain, fill gaps |
| "I love you" queries | appearing | varies | Create full series |
| German market | 9 | varies | Create DE-native content |

**26 countries reached** including USA, Germany, Croatia, Mexico, Poland, Brazil

---

## Technical Fixes TODO

### Completed ✅

1. [x] **Add content to `/compare/` landing page**
   - ✅ Transformed from redirect stub to full landing page
   - ✅ Removed noindex, added real content and language selector

2. [x] **Create missing compare pages**
   - ✅ `/compare/de/` - German content created
   - ✅ `/compare/it/` - Italian content created
   - ✅ `/compare/pt/` - Portuguese content created

3. [x] **Add canonical tags to hub pages**
   - ✅ All 7 compare pages now have canonical tags

### Remaining (Low Priority)

4. [ ] **Reduce redirect chain to 1 hop**
   - Currently: HTTP → HTTPS → www → no-trailing-slash (3 hops)
   - Ideal: Direct to final URL in 1 hop
   - Requires Vercel domain-level config

---

## Recent SEO Work (Jan 22, 2026 - Session 5)

### Navigation Translations Complete ✅

**Issue:** Navigation buttons showed English text ("Start Learning", "Compare Apps") on all language pages
**Fix:** Added `NAV_TRANSLATIONS` object to `Navigation.astro` with translations for all 6 native languages

| Language | Compare Dropdown | Start Button |
|----------|-----------------|--------------|
| EN | Compare Apps | Start Learning |
| ES | Comparar Apps | Empezar |
| FR | Comparer | Commencer |
| DE | Vergleichen | Starten |
| IT | Confronta | Inizia |
| PT | Comparar | Começar |

### Compare Page Translations Complete ✅

**Issue:** Compare pages for DE/IT/PT showed English content instead of translated content
**Root Cause:**
1. Static files (`/compare/de/index.astro`, etc.) were overriding dynamic route
2. `comparison-features.ts` only had EN/ES/FR translations

**Fixes Applied:**
1. Deleted 3 redundant static files
2. Added full DE_CONTENT, IT_CONTENT, PT_CONTENT (~350 lines each) to `comparison-features.ts`
3. Updated CONTENT_MAP to include all 6 languages
4. Changed `/compare/index.astro` to redirect to `/compare/en/` (avoids duplicate content)

**Result:** All 18 compare pages now fully translated and working

---

## Recent SEO Work (Jan 21, 2026 - Session 4)

### Navbar Compare Links Fixed ✅

**Issue:** Compare dropdown in navbar was causing 404s for DE/IT/PT native users
**Root Cause:** `getStaticPaths()` in compare pages only generated for EN/ES/FR
**Fix:** Updated all 3 compare page files to include all 6 native languages:
- `/compare/[nativeLang]/love-languages-vs-babbel.astro`
- `/compare/[nativeLang]/love-languages-vs-duolingo.astro`
- `/compare/[nativeLang]/index.astro`

Also added UI translations for German, Italian, Portuguese in the compare index page.

### Slug Standardization Complete ✅

**Issue:** ~100+ articles had non-English slugs (French/Spanish), breaking hreflang linking
**Problem Examples:**
- French: `comment-dire-je-taime-en-allemand` instead of `how-to-say-i-love-you-in-german`
- Spanish: `apodos-carinosos-en-aleman` instead of `german-pet-names-terms-of-endearment`

**Fix:** Renamed all files to use standardized English slugs:
- Deleted duplicates where English-slugged versions already existed
- Renamed remaining files to match English slug pattern
- ~100 files processed (48 deleted duplicates, ~50 renamed)

**Slug Patterns Now Standardized:**
| Series | Slug Pattern |
|--------|--------------|
| How to say I love you | `how-to-say-i-love-you-in-{language}.mdx` |
| Pet names | `{language}-pet-names-terms-of-endearment.mdx` |
| Date night vocabulary | `{language}-date-night-vocabulary.mdx` |
| Essential phrases | `{language}-essential-phrases-for-couples.mdx` |
| Pronunciation guide | `{language}-pronunciation-guide.mdx` |
| Greetings | `{language}-greetings-farewells.mdx` |
| Grammar basics | `{language}-grammar-basics.mdx` |

### Content Expansion (Session 4)

**New Articles Created:** ~318 articles across all 18 target languages
- Grammar Basics series: 42 articles
- Meeting Family series: 24 articles
- Date Night Vocabulary series: 14 articles
- Texting Slang series: 28 articles
- Language Comparison series: 41 articles
- Plus ~169 articles from parallel agents for minor languages

**New Images Generated:** 88 images using Glif MCP (Z Image Turbo)

---

## Recent SEO Work (Jan 21, 2026 - Session 3)

### "I Love You" Series Completed ✅

| Target Language | Status | Native Langs Covered |
|-----------------|--------|---------------------|
| Polish | ✅ Complete | EN, ES, FR, DE, IT, PT (6/6) |
| Ukrainian | ✅ Complete | EN, ES, FR, DE, IT, PT (6/6) |
| Russian | ✅ Complete | EN, ES, FR, DE, IT, PT (6/6) |
| German | ✅ Complete | EN, ES, FR, IT, PT (5/5) |
| Spanish | ✅ Complete | EN, FR, DE, IT, PT (5/5) |
| **French** | ✅ Complete | EN, ES, DE, IT, PT (5/5) |
| **Italian** | ✅ Complete | EN, ES, FR, DE, PT (5/5) |
| **Portuguese** | ✅ Complete | EN, ES, FR, DE, IT (5/5) |

### Pet Names Series Expanded ✅

| Target Language | Status | Native Langs Covered |
|-----------------|--------|---------------------|
| Ukrainian | ✅ Complete | EN, ES, FR, DE, IT, PT (6/6) |
| **Russian** | ✅ Complete | EN, ES, FR, DE, IT, PT (6/6) |
| **Polish** | ✅ Complete | EN, ES, FR, DE, IT, PT (6/6) |

### New Content Summary

| Category | New Articles | Details |
|----------|--------------|---------|
| I Love You (FR/IT/PT targets) | 12 | Completing the series |
| Russian Pet Names | 5 | ES, FR, DE, IT, PT natives |
| Polish Pet Names | 2 | IT, PT natives |
| **Total Session 3** | **19** | |

### Images Added
- 21 new hero images for German native content
- Fixed pet names image naming (russian/polish)

---

## Recent SEO Work (Jan 21, 2026 - Session 2)

### Content Series Completed ✅

**Ukrainian Pet Names (6 articles)** - Top GSC performer expanded
- All 6 native languages now have `/uk/ukrainian-pet-names-terms-of-endearment.mdx`
- Matching slug enables hreflang linking
- Hero image generated: `ukrainian-pet-names-terms-of-endearment.jpg`

**"I Love You" Series Expansion**
| Target | Before | After | Status |
|--------|--------|-------|--------|
| Ukrainian | 0 | 6 | ✅ Complete |
| Polish | 5 | 6 | ✅ Complete |
| Russian | 1 | 6 | ✅ Complete |
| German | 2 | 5 | ✅ Complete (skip DE→DE) |
| Spanish | 3 | 5 | ✅ Complete (skip ES→ES) |

**German Native Content (Critical Gap Filled)**
| Pair | Before | After | Articles Added |
|------|--------|-------|----------------|
| DE→PL | 1 | 11 | +10 |
| DE→UK | 2 | 10 | +8 |

### Compare Section Fixed ✅
- `/compare/index.astro` - Now real landing page (was redirect stub)
- Created `/compare/de/`, `/compare/it/`, `/compare/pt/`
- All 7 compare pages have canonical tags

---

## Recent SEO Work (Jan 21, 2026 - Session 1)

### Hero Images Complete ✅
- Generated 369 missing hero images using Z Image Turbo (Glif MCP)
- All articles now have matching hero images
- Total: 611 images in `/blog/public/blog/`

### Documentation Created ✅
- `ARTICLE_SOP.md` - Comprehensive guide for article creation
  - Directory structure and file naming conventions
  - Frontmatter schema with all required fields
  - MDX components (VocabCard, CultureTip, PhraseOfDay)
  - Hreflang linking strategy for content series
  - Language-specific writing guidelines
  - Validation checklist and troubleshooting

---

## Recent SEO Work (Jan 14, 2026)

### 1. Hreflang Implementation ✅
Fixed multi-language SEO signals in:
- `blog/src/pages/learn/[...slug].astro` - Added alternate version detection
- `blog/src/layouts/ArticleLayout.astro` - Fixed hreflang tag generation

### 2. Title Optimization ✅
Optimized **471 article titles** across all language pairs:
- Max 43 characters (60 with brand suffix)
- Front-loaded keywords
- Removed fluff ("Complete Guide", "for Couples", etc.)
- Preserved numbers

---

## Content Coverage Matrix

### Articles by Language Pair

**Native Language (rows) → Target Language (columns)**

| Native | PL | DE | ES | FR | IT | PT | EN | NL | EL | RU | TR | Others |
|--------|----|----|----|----|----|----|----|----|----|----|----|----|
| 🇬🇧 EN | 73 ✅ | 25 | 25 | 25 | 25 | 25 | - | 10 | 10 | 10 | 10 | 8 each |
| 🇪🇸 ES | 73 ✅ | 25 | - | 25 | 25 | 25 | 25 | 5 | 5 | 5 | 5 | 3 each |
| 🇫🇷 FR | 73 ✅ | 25 | 25 | - | 25 | 25 | 25 | 5 | 5 | 5 | 5 | 3 each |
| 🇩🇪 DE | 0 | - | 15 | 15 | 15 | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| 🇮🇹 IT | 3 | 15 | 15 | 15 | - | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| 🇵🇹 PT | 3 | 15 | 15 | 15 | 15 | - | 15 | 0 | 0 | 0 | 0 | 0 |

**Legend:** ✅ = Well covered (50+) | Numbers = Article count

### Coverage Summary (Updated Jan 21, 2026)
- **Total Articles:** 1,003
- **Strong:** Polish as target (219 articles across EN/ES/FR), Major language pairs (25 articles)
- **Medium:** DE/IT/PT native speakers (75-78 articles each, 15 per target)
- **Gaps:** DE/IT/PT natives missing minor language targets (NL, EL, RU, TR, etc.)
- **Polish Gap:** DE→PL (0), IT→PL (3), PT→PL (3) need expansion

---

## Completed Work

### 1. Blog Articles (74 total)

**Batch 1 - Initial Articles (10)** - Committed Jan 9
- How to Say I Love You in Polish
- Polish Pet Names
- 50 Polish Terms of Endearment
- Beautiful Romantic Polish Poems
- Essential Polish Date Night Vocabulary
- Essential Polish Phrases for Long Distance Relationships
- Essential Polish Wedding Phrases
- How to Apologize in Polish
- Good Morning and Goodnight in Polish
- How to Express Your Emotions in Polish

**Batch 2 - Romance & Occasions (14)** - Committed Jan 11
- How to Flirt in Polish
- How to Give Beautiful Compliments in Polish
- How to Say Beautiful in Polish
- Meeting Your Polish Partner's Parents
- Polish Anniversary Wishes
- Polish Birthday Wishes
- Polish Christmas Traditions
- Polish Easter Traditions
- Polish First Date Phrases
- Polish Love Songs to Learn Together
- Polish Proposal and Engagement Phrases
- Polish Romantic Phrases for Every Occasion
- Polish Valentine's Day Traditions
- Writing Love Letters in Polish

**Batch 3 - Situations & Practical (12)** - Committed Jan 11
- Arguing Constructively in Polish
- Moving In Together - Household Vocabulary
- Planning a Polish Honeymoon
- Polish Baby and Pregnancy Vocabulary
- Polish Breakup and Reconciliation Phrases
- Polish Cooking Together - Food Vocabulary
- Polish Humor and Jokes for Couples
- Polish Name Days and Traditions
- Polish Romantic Movies to Watch Together
- Traveling to Poland with Your Partner
- Polish Social Media - Understanding Posts
- Ordering Food in Polish - Restaurant Vocabulary

**Batch 4 - Grammar (10)** - Committed Jan 11
- Polish Adjective Agreement
- Polish Future Tense - Making Plans
- Polish Negation - How to Say No
- Polish Past Tense Made Easy
- Polish Pronouns - I, You, We
- Polish Questions - How to Ask Anything
- Polish Verb Conjugation - Present Tense
- Polish Word Order - Grammar Guide
- Understanding Polish Gender
- Polish Cases Explained Simply

**Batch 5 - Pronunciation (5)** - Committed Jan 11
- 7 Polish Pronunciation Mistakes
- How to Pronounce Polish Letters (ś, ć, ż, ź)
- Polish Pronunciation Guide - Sounds Not in English
- Polish Stress Patterns
- Polish Tongue Twisters for Couples

**Batch 6 - Learning Tips & Practical (13)** - Committed Jan 11
- Best Way to Learn Polish for Your Partner (2025)
- Essential Polish Phrases for Video Calls
- Free vs Paid Polish Learning Apps
- How Long Does It Take to Learn Polish
- Is Polish Hard to Learn
- Learning Polish Alone vs With Your Partner
- Polish at the Doctor - Medical Vocabulary
- Polish at Work - Professional Vocabulary
- Polish Phone Calls - Answering and Making Calls
- Polish Public Transport Phrases
- Polish Shopping Vocabulary
- Polish Small Talk - Conversation Starters
- Polish Texting Slang

**Batch 7 - FAQ/Informational (10)** - Committed Jan 11
- 100 Most Common Polish Words
- Can You Learn Polish from TV Shows and Movies
- Do Polish People Speak English
- How Many People Speak Polish
- How to Type Polish Characters on English Keyboard
- Is Polish Similar to Russian
- What Are Polish Diminutives
- What Is the Polish Alphabet
- What Polish Dialect Should I Learn
- Why Does Polish Have So Many Consonants

---

### 2. Programmatic SEO Pages

#### Polish Dictionary (109 words)
**Location:** `/dictionary/[slug]`

**Categories covered:**
- Romance & Love (14 words): kocham, miłość, kochanie, skarbie, całować, etc.
- Basic Greetings (8 words): cześć, dzień dobry, dziękuję, proszę, etc.
- Family (11 words): rodzina, mama, tata, teściowa, babcia, dziadek, etc.
- Food & Drink (14 words): jeść, pić, pierogi, wino, kawa, bigos, żurek, etc.
- Common Verbs (6 words): być, mieć, chcieć, iść, rozumieć, mówić
- Numbers (6 words): jeden, dwa, trzy, pięć, dziesięć, sto
- Time & Days (8 words): dzisiaj, jutro, wczoraj, poniedziałek, weekend, etc.
- Emotions (6 words): szczęśliwy, smutny, zmęczony, głodny, zły, podekscytowany
- Travel & Places (10 words): podróż, samolot, hotel, Polska, Warszawa, Kraków, etc.
- Body Parts (5 words): oczy, uśmiech, włosy, ręka, usta
- Common Phrases (11 words): jak się masz, dobrze, na zdrowie, kocham cię, etc.

**Features per word page:**
- Pronunciation guide
- Example sentences (Polish + English)
- Word type badge (noun, verb, adjective, etc.)
- Difficulty level (beginner, intermediate, advanced)
- Conjugation tables (for verbs)
- Adjective forms (masculine, feminine, neuter, plural)
- Cultural notes
- Related words with internal linking
- Tags for categorization

**SEO elements:**
- Schema.org DefinedTerm markup
- Breadcrumb schema
- Unique meta descriptions
- Internal linking between related words

---

### 3. Interactive Tools

#### Polish Name Day Finder
**Location:** `/tools/name-day-finder`

**Features:**
- Search 1,000+ Polish names
- Includes formal names AND diminutives (Katarzyna + Kasia)
- Shows days until next name day
- Today's celebrating names
- Cultural facts about imieniny
- Helpful "not found" tips

**SEO elements:**
- Schema.org WebApplication markup
- FAQ-style content blocks

---

### 4. Comparison Landing Pages

#### Love Languages vs Duolingo
**Location:** `/compare/love-languages-vs-duolingo`

**Content:**
- Feature comparison table
- Pricing comparison
- "When to choose" honest guidance
- FAQ section with Schema.org FAQPage markup

#### Love Languages vs Babbel
**Location:** `/compare/love-languages-vs-babbel`

**Content:**
- Feature comparison table
- Learning approach differences
- "When to choose" honest guidance
- FAQ section with Schema.org FAQPage markup

---

### 5. Navigation & Structure

**Global Navigation** (multi-language ready)
**Location:** `src/data/navigation.ts`

**Sections:**
- Learn (dropdown): All Articles, Dictionary, Grammar, Vocabulary, Culture
- Tools (dropdown): Name Day Finder, All Tools
- Compare (dropdown): vs Duolingo, vs Babbel, All Comparisons

**Features:**
- Data-driven configuration
- Language selector (hidden when single language)
- Mobile-responsive with hamburger menu
- Sticky header

---

### 6. Conversion Optimization

**Completed elements:**
- CTA component used across all pages
- Testimonials section on homepage
- Lead magnet signup (Polish phrases PDF)
- FAQ schema markup
- Trust badges and social proof

---

## Discussed & Approved (Not Yet Built)

### High Priority

1. **Affiliate Resource Hubs**
   - "Best Polish Books for Beginners"
   - "Polish Movies on Netflix"
   - "Polish Music Playlists"
   - Revenue: Amazon/streaming affiliate links

2. **Wedding/Proposal Niche Pages**
   - "Polish Wedding Traditions" comprehensive guide
   - "How to Propose in Polish"
   - "Polish Wedding Vows"

### Medium Priority

3. **More Dictionary Words**
   - Target: 500+ words (currently 109)
   - Categories to expand: weather, clothing, home, work, hobbies

4. **More Comparison Pages**
   - vs Pimsleur
   - vs Rosetta Stone
   - vs iTalki
   - vs Polish Pod 101

5. **Location-Based Pages**
   - "Learn Polish in [City]" for major US/UK cities
   - "Polish Community in [City]"

### Lower Priority

6. **User-Generated Content**
   - Success stories from couples
   - Community phrase submissions

7. **Quiz/Assessment Tool**
   - "What's Your Polish Level?" quiz
   - Lead capture opportunity

---

## Technical SEO Status

| Element | Status |
|---------|--------|
| Sitemap | Auto-generated via @astrojs/sitemap |
| robots.txt | Configured |
| Meta descriptions | On all pages |
| Open Graph tags | On all pages |
| Schema.org markup | Articles, Dictionary, Tools, FAQs |
| Internal linking | Dictionary cross-links, related articles |
| Mobile responsive | Yes |
| Page speed | Static site, fast |
| HTTPS | Via Vercel |

---

## Branch Status

| Branch | Status | Content |
|--------|--------|---------|
| `main` | Production | Security fixes, conversion optimization |
| `feature/name-day-finder` | Ready to merge | Name Day Finder, Dictionary, Comparison pages, Navigation, 74 articles |
| `security/xss-input-validation` | Merged | XSS prevention |

---

## Content Expansion Strategy

### Phase 1: Polish Content for New Native Languages ✅ PARTIALLY COMPLETE

German, Italian, and Portuguese native speakers now have content, but Polish as target is weak.

**Current State:**
| Language Pair | Current | Target | Status |
|---------------|---------|--------|--------|
| 🇩🇪 DE → 🇵🇱 PL | 0 | 50 | ❌ Needs creation |
| 🇮🇹 IT → 🇵🇱 PL | 3 | 50 | ⚠️ Needs expansion |
| 🇵🇹 PT → 🇵🇱 PL | 3 | 50 | ⚠️ Needs expansion |

**How to generate:**
```bash
cd blog
ANTHROPIC_API_KEY=xxx npm run generate -- \
  --language pl \
  --nativeLanguage de \
  --topic "Polish greetings for German speakers" \
  --category phrases
```

### Phase 2: Expand High-Demand Target Languages ✅ COMPLETE

EN→ES, EN→FR, EN→DE, EN→IT now have 25 articles each.

| Language Pair | Current | Target | Status |
|---------------|---------|--------|--------|
| 🇬🇧 EN → 🇪🇸 ES | 25 | 50 | ⚠️ Halfway |
| 🇬🇧 EN → 🇫🇷 FR | 25 | 50 | ⚠️ Halfway |
| 🇬🇧 EN → 🇩🇪 DE | 25 | 50 | ⚠️ Halfway |
| 🇬🇧 EN → 🇮🇹 IT | 25 | 50 | ⚠️ Halfway |

### Phase 3: Cross-Pollinate Content

For each well-performing EN article, create ES and FR versions with same slug for hreflang benefits.

**Process:**
1. Identify top 20 EN→PL articles by traffic
2. Create ES→PL and FR→PL versions with SAME slug
3. Hreflang tags will auto-connect them

### Essential Article Topics (Per Language Pair)

Every language pair should have these core articles:

- [ ] "How to Say I Love You in [Language]"
- [ ] "50 [Language] Pet Names & Endearments"
- [ ] "100 Most Common [Language] Words"
- [ ] "[Language] Pronunciation Guide"
- [ ] "Is [Language] Hard to Learn?"
- [ ] "[Language] Grammar Basics for Beginners"
- [ ] "Romantic [Language] Phrases for Couples"
- [ ] "Meeting Your [Language] Partner's Parents"
- [ ] "[Language] vs [Native Language]: Key Differences"
- [ ] "[Language] Date Night Vocabulary"

### Content Generation Commands

**Single article:**
```bash
npm run generate -- -l pl -t "Topic" -c vocabulary -d beginner
```

**Batch generation (run multiple times):**
```bash
# German speakers learning Polish
for topic in "greetings" "pet names" "pronunciation" "grammar basics" "i love you"; do
  npm run generate -- -l pl --nativeLanguage de -t "Polish $topic for German speakers" -c phrases
done
```

### Priority Order (Updated)

1. **DE→PL** (50 articles) - German market, currently 0 articles
2. **IT→PL** (47 more) - Currently only 3 articles
3. **PT→PL** (47 more) - Currently only 3 articles
4. **EN→ES** (25 more) - Currently 25, target 50
5. **EN→FR** (25 more) - Currently 25, target 50
6. **Minor languages** - Expand 8-article pairs to 15+

---

## GSC-Driven Content Plan (January 2026)

> Based on real Google Search Console data from first indexing. 68 impressions, 26 countries, strong position signals.

### 🎯 What's Already Working

| Content Type | Performance | Action |
|--------------|-------------|--------|
| **Ukrainian pet names** | 13 impressions, pos 7.85 | DOUBLE DOWN - create variants |
| **Polish content** | Pos 1-4 across languages | Expand to all native languages |
| **"I love you" queries** | Multiple languages appearing | Create for ALL 18 languages |
| **German market** | 9 impressions | Create more DE native content |

### 📈 Immediate Priority: Ukrainian Content Expansion

Ukrainian is our breakout performer! Create these articles in ALL 6 native languages:

**EN Native → Ukrainian:**
- [x] Ukrainian Romantic Phrases for Couples ✅ (performing)
- [x] Ukrainian Pet Names & Terms of Endearment ✅ (6 native langs)
- [x] How to Say I Love You in Ukrainian ✅ (6 native langs)
- [ ] Ukrainian Pronunciation Guide for English Speakers
- [ ] Ukrainian Cyrillic Alphabet for Beginners
- [ ] Meeting Your Ukrainian Partner's Family
- [ ] Ukrainian Date Night Vocabulary
- [ ] Ukrainian Texting Slang for Couples

**ES/FR/DE/IT/PT Native → Ukrainian:**
- [x] German speakers learning Ukrainian - 10 articles created
- [ ] Romance language speakers (ES/FR/IT/PT) - needs expansion

### 📈 "I Love You" Content Series

High-intent, converting queries. Create for EVERY target language:

| Language | EN Native | ES Native | FR Native | DE Native | IT Native | PT Native |
|----------|-----------|-----------|-----------|-----------|-----------|-----------|
| Polish | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ← COMPLETE
| Ukrainian | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ← COMPLETE
| Russian | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ← COMPLETE
| German | ✅ | ✅ | ✅ | - | ✅ | ✅ | ← COMPLETE
| French | ✅ | [ ] | - | [ ] | [ ] | [ ] |
| Spanish | ✅ | - | ✅ | ✅ | ✅ | ✅ | ← COMPLETE
| Italian | ✅ | [ ] | [ ] | [ ] | - | [ ] |
| Portuguese | [ ] | [ ] | [ ] | [ ] | [ ] | - |
| Dutch | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Greek | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Turkish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Czech | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Swedish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Norwegian | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Danish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Hungarian | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Romanian | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

### 📈 Pet Names / Terms of Endearment Series

Second-highest performing category. Expand across all language pairs:

**Priority targets (based on GSC):**
1. ✅ Ukrainian pet names → all native languages - COMPLETE (6 articles)
2. [ ] Polish pet names → DE/IT/PT native (gaps)
3. [ ] Russian pet names → all native languages
4. [ ] Turkish pet names → all native languages

### 📈 German Market Expansion

9 impressions from Germany. Create more DE-native content:

**DE Native Articles Created:**
- [x] DE→PL: 11 articles (was 0, now 11) ✅ SIGNIFICANT PROGRESS
- [x] DE→UK: 10 articles (was 2, now 10) ✅ SIGNIFICANT PROGRESS
- [ ] DE→RU: Russian content for German speakers
- [ ] DE→TR: Turkish content for German speakers

### 📈 Country-Specific Opportunities

Based on GSC country data:

| Country | Signal | Content Strategy |
|---------|--------|------------------|
| 🇺🇸 USA | Base traffic | Maintain EN-native focus |
| 🇩🇪 Germany | 9 impressions | Expand DE-native content |
| 🇭🇷 Croatia | Appearing | Create Croatian as target |
| 🇲🇽 Mexico | Appearing | Optimize ES-native content |
| 🇵🇱 Poland | Appearing | Polish speakers learning other languages |
| 🇧🇷 Brazil | Appearing | Optimize PT-native content |

### 📈 Near-Ranking Optimization (Position 6-20)

Pages ranking on page 2. Optimize these first:

**Actions for near-ranking pages:**
1. Add 200-300 more words of valuable content
2. Improve internal linking (add 3-5 links from/to)
3. Optimize meta descriptions with CTR-boosting language
4. Add FAQ sections with schema markup
5. Update timestamps (freshness signal)

### 📊 Content Generation Batches

**Batch 1: Ukrainian Expansion (108 articles)**
- 6 native languages × 18 Ukrainian topics = 108 articles

**Batch 2: "I Love You" Complete (102 articles)**
- 6 native × 17 target languages = 102 articles

**Batch 3: Pet Names Complete (102 articles)**
- 6 native × 17 target languages = 102 articles

**Batch 4: Polish Gap Fill (144 articles)**
- DE→PL: 50 articles
- IT→PL: 47 articles
- PT→PL: 47 articles

**Batch 5: German Native Expansion (100 articles)**
- DE→various: Fill gaps across all target languages

**Total New Content Target: ~550 articles**

### 🔧 Technical SEO Quick Wins

1. [ ] Add internal links from high-ranking to new content
2. [ ] Create topic clusters around performing content
3. [ ] Add FAQ schema to all "How to say I love you" pages
4. [ ] Optimize images with WebP format
5. [ ] Add structured data for language learning content

---

## Next Actions

### Completed ✅
1. [x] Merge `feature/name-day-finder` to `main`
2. [x] Add DE/IT/PT native language content (75-78 articles each)
3. [x] Generate 369 missing hero images (611 total now)
4. [x] Ukrainian content expansion - pet names & "I love you" (12 articles)
5. [x] "I Love You" series: PL, UK, RU, DE, ES targets complete
6. [x] DE→PL expansion (0 → 11 articles)
7. [x] DE→UK expansion (2 → 10 articles)
8. [x] Compare section fixed (all 7 native language pages)

### Next Priority
9. [ ] "I Love You" series: FR, IT, PT targets (remaining gaps)
10. [ ] Pet names series: Polish, Russian, Turkish
11. [ ] Expand IT→PL from 3 to 50 articles
12. [ ] Expand PT→PL from 3 to 50 articles
13. [ ] DE→RU and DE→TR content
14. [ ] Expand dictionary to 200+ words
15. [ ] Build affiliate resource hub

---

## File Locations

```
blog/
├── src/
│   ├── content/articles/     # 1,040+ MDX blog posts (6 native × 18 target langs)
│   ├── data/
│   │   ├── polish-dictionary.ts   # 109 words, 2154 lines
│   │   ├── polish-name-days.ts    # 1000+ names, 591 lines
│   │   └── navigation.ts          # Multi-language nav config
│   ├── pages/
│   │   ├── dictionary/
│   │   │   ├── [slug].astro       # Dynamic word pages
│   │   │   └── index.astro        # Dictionary index
│   │   ├── tools/
│   │   │   ├── name-day-finder.astro
│   │   │   └── index.astro
│   │   ├── compare/
│   │   │   ├── love-languages-vs-duolingo.astro
│   │   │   ├── love-languages-vs-babbel.astro
│   │   │   ├── index.astro        # Main compare landing
│   │   │   ├── [nativeLang]/index.astro  # Language-specific
│   │   │   └── de/, it/, pt/      # New native lang pages
│   │   └── learn/
│   │       ├── [...slug].astro    # Article pages
│   │       └── index.astro        # Article index
│   └── components/
│       └── Navigation.astro       # Global nav
├── public/blog/                   # 611 hero images
├── ARTICLE_SOP.md                 # Article creation guide
└── SEO_STATUS.md                  # This file
```
