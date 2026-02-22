# AEO/GEO Strategy - Love Languages Blog

> Strategic plan for Answer Engine Optimization and Generative Engine Optimization
> Created: January 16, 2026
> **Updated: February 22, 2026**

---

## Executive Summary

**Current State:** 11,933 articles, 18 native languages × 18 target languages, comprehensive schema markup
**Goal:** Become THE authoritative source for couples learning languages together
**Strategy:** Systematic content expansion + structured data optimization for AI citation

### Recent Completions (Feb 2026)
- ✅ FAQ schema on 11,703 articles (bespoke FAQs via Gemini, visible accordion + JSON-LD)
- ✅ E-E-A-T author signals (Organization author with `knowsAbout`, visible byline)
- ✅ DefinitionBlock component (schema.org/DefinedTerm for vocabulary rich results)
- ✅ Tag backfill (4,458 articles fixed — all articles now have `article:tag` meta)
- ✅ AI referral tracking (ChatGPT, Perplexity, Claude, Gemini, etc.)

---

## Part 1: Current Content Inventory

### Article Distribution by Language Pair (Updated Jan 21, 2026)

| Native | PL | DE | ES | FR | IT | PT | EN | NL | EL | RU | TR | CS | DA | HU | NO | RO | SV | UK |
|--------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| **EN** | 73 | 25 | 25 | 25 | 25 | 25 | - | 10 | 10 | 10 | 10 | 8 | 8 | 8 | 8 | 8 | 8 | 8 |
| **ES** | 73 | 25 | - | 25 | 25 | 25 | 25 | 5 | 5 | 5 | 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| **FR** | 73 | 25 | 25 | - | 25 | 25 | 25 | 5 | 5 | 5 | 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| **DE** | 0 | - | 15 | 15 | 15 | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **IT** | 3 | 15 | 15 | 15 | - | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **PT** | 3 | 15 | 15 | 15 | 15 | - | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Total: 1,003 articles** (previously reported 474)

### Category Distribution (estimated from 1,003 articles)
- Phrases: ~340 (34%)
- Vocabulary: ~190 (19%)
- Grammar: ~180 (18%)
- Culture: ~180 (18%)
- Situations: ~100 (10%)
- Pronunciation: ~13 (1%)

### Difficulty Distribution
- Beginner: ~710 (71%)
- Intermediate: ~290 (29%)
- Advanced: 0 (0%) ← **Major Gap**

---

## Part 2: Content Gaps Analysis (Updated Jan 21, 2026)

### Gap Type 1: ~~Missing Native Languages~~ ✅ RESOLVED

German, Italian, and Portuguese native speakers now have content:
- **DE native:** 75 articles (15 each for EN, ES, FR, IT, PT, 0 for PL)
- **IT native:** 78 articles (15 each for DE, EN, ES, FR, PT, 3 for PL)
- **PT native:** 78 articles (15 each for DE, EN, ES, FR, IT, 3 for PL)

### Gap Type 1b: Polish Content for New Native Languages (NEW HIGH PRIORITY)

DE/IT/PT speakers learning Polish is severely underrepresented:

| Pair | Current | Target | Gap |
|------|---------|--------|-----|
| DE→PL | 0 | 50 | 50 |
| IT→PL | 3 | 50 | 47 |
| PT→PL | 3 | 50 | 47 |

**Total needed: 144 articles**

### Gap Type 2: Incomplete Language Pairs

**3-Article Pairs (Need 7 more each to reach 10-article standard):**
| Pair | Missing Topics |
|------|----------------|
| EN/ES/FR → Czech | Greetings, Grammar basics, Pronunciation, Date vocabulary, Family phrases, Difficulty guide, Cultural tips |
| EN/ES/FR → Danish | Same as above |
| EN/ES/FR → Hungarian | Same as above |
| EN/ES/FR → Norwegian | Same as above |
| EN/ES/FR → Romanian | Same as above |
| EN/ES/FR → Swedish | Same as above |
| EN/ES/FR → Ukrainian | Same as above |

**Potential: 21 pairs × 7 articles = 147 new articles**

**5-Article Pairs (Need 5 more each):**
| Pair | Missing Topics |
|------|----------------|
| EN/ES/FR → Greek | Grammar, Pronunciation guide, Date vocabulary, Cultural tips, Family |
| EN/ES/FR → Dutch | Same as above |
| EN/ES/FR → Portuguese | Same as above |
| EN/ES/FR → Russian | Same as above |
| EN/ES/FR → Turkish | Same as above |

**Potential: 15 pairs × 5 articles = 75 new articles**

### Gap Type 3: ~~FR→PL Missing Articles~~ ✅ RESOLVED

FR→PL now has 73 articles, matching EN→PL and ES→PL coverage.

### Gap Type 4: Advanced Content (ZERO)

No advanced-level articles exist across entire blog.

**AEO Impact:** Advanced content targets:
- Long-tail queries ("advanced Polish subjunctive for conditional wishes")
- Higher intent users (more likely to convert)
- Less competition in SERPs

**Recommended Topics:**
- Advanced grammar deep-dives (subjunctive, conditional, aspect)
- Idiomatic expressions and slang
- Regional dialects and variations
- Literary/formal language
- Business/professional contexts

### Gap Type 5: Pronunciation Content (Only 2 articles)

Pronunciation is underrepresented but highly searchable.

**AEO-Optimized Pronunciation Topics:**
- "How to pronounce [specific word]" pages (programmatic)
- Audio pronunciation guides
- Comparison pages ("Polish ś vs English sh")
- Tongue placement diagrams

---

## Part 3: AEO Implementation Plan

### 3.1 Schema Markup — Implementation Status

**HowTo Schema** ✅ DONE
- Automatically added to all articles with "how-to" in the slug
- Rendered in `ArticleLayout.astro` as JSON-LD
- ~1,000+ articles have HowTo schema

**Speakable Schema** ✅ DONE
- Added to all articles via CSS selectors: `.speakable-phrase`, `.speakable-vocab`
- VocabCard and PhraseOfDay components use these classes
- Enables voice search citation for key phrases

**FAQ Schema** ✅ DONE (11,703 articles)
- Bespoke FAQs stored in `faq_items` JSONB column in Supabase
- Generated via `blog/scripts/generate-faqs-gemini.mjs` (Gemini 2.0 Flash)
- Visible accordion on page + FAQPage JSON-LD in head
- 98% coverage across all language pairs

**E-E-A-T Author Signals** ✅ DONE
- Rich Organization author JSON-LD with `knowsAbout` array
- Visible "By Love Languages Editorial Team" byline on every article
- Organization schema includes founder info, contact, social profiles

### 3.2 Content Structure Optimization

**Answer Box Pattern** — Deferred
- Considered but not implemented — would require bulk AI generation for 12K+ articles
- Can be revisited if a lightweight approach is found

**DefinitionBlock Component** ✅ DONE
- `blog/src/components/DefinitionBlock.astro` created
- Uses `schema.org/DefinedTerm` microdata for Google "Definition" rich results
- Purple gradient styling (distinct from VocabCard and PhraseOfDay)
- Converter added to `component-converters.mjs` with translations for all 18 languages
- Usage: `<DefinitionBlock term="Kochanie" definition="..." pronunciation="..." partOfSpeech="noun" language="Polish" />`

**Numbered Lists for "Top X" Articles**

Ensure all list articles use proper `<ol>` with schema:

```json
{
  "@type": "ItemList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Kocham Cię - I love you"}
  ]
}
```

### 3.3 New AEO-Focused Content Types

**Comparison Articles (vs other languages)**
- "Polish vs Russian: Which is Easier for English Speakers?"
- "Spanish vs Portuguese for English Speakers"
- These target "[language] vs [language]" queries

**"Is X hard to learn?" Series**
- Currently only for Polish
- Create for all 18 target languages
- Target featured snippet: "Is [language] hard to learn?"

**Quick Reference Pages**
- "Polish Numbers 1-100" (table format)
- "Polish Alphabet with Pronunciation"
- "Polish Days of the Week"
- Highly structured = AI-extractable

---

## Part 4: GEO Implementation Plan

### 4.1 City-Level Pages

**URL Structure:** `/learn/locations/[city]/[language]/`

**Priority Cities (Polish diaspora):**
1. Chicago (1.5M+ Polish-Americans)
2. New York City
3. Los Angeles
4. Detroit
5. Philadelphia

**Page Template:**
- H1: "Learn Polish in [City]"
- Local Polish community info
- Polish restaurants/shops/cultural centers
- Local tutoring options
- Online learning recommendation (your app)
- FAQ with LocalBusiness schema (if applicable)

**Schema:**
```json
{
  "@type": "WebPage",
  "about": {
    "@type": "City",
    "name": "Chicago"
  },
  "mentions": {
    "@type": "Language",
    "name": "Polish"
  }
}
```

### 4.2 Country Pages

**URL Structure:** `/learn/country/[country]/[language]/`

**Examples:**
- `/learn/country/usa/polish/` - Americans learning Polish
- `/learn/country/uk/polish/` - Brits learning Polish
- `/learn/country/germany/polish/` - Germans learning Polish

**Content:**
- Why [nationality] learn [language]
- Common challenges for [nationality] speakers
- Cultural connections between countries
- Visa/immigration info (if relevant)

### 4.3 Regional Content

**Polish Dialects:**
- "Silesian Polish: What You Need to Know"
- "Warsaw Polish vs Krakow Polish"
- Target local search queries

---

## Part 4b: AI Referral Tracking ✅ DONE

AI referral tracking is already implemented in both:
- `blog/src/layouts/BaseLayout.astro` (blog)
- `index.html` (main app)

**Tracked AI Sources:**
- ChatGPT (`chatgpt.com`)
- Perplexity (`perplexity.ai`)
- Claude (`claude.ai`)
- Google Gemini/Bard (`gemini.google.com`, `bard.google.com`)
- Microsoft Copilot (`copilot.microsoft.com`)
- Bing (`bing.com`)
- You.com (`you.com`)
- Phind (`phind.com`)

**How it works:**
- Checks `document.referrer` and `utm_source` for AI sources
- Fires GA4 `ai_referral_landing` event with source, referrer, and landing page
- Sets `traffic_channel: 'ai_referral'` user property for segmentation
- Viewable in GA4 under Events → `ai_referral_landing`

---

## Part 5: Content Creation Priority Matrix

### Tier 1: ~~Immediate~~ ✅ COMPLETED

| Action | Status | AEO/GEO Impact |
|--------|--------|----------------|
| ~~Fill FR→PL gaps~~ | ✅ Done | Hreflang completion |
| ~~Add HowTo schema~~ | ✅ Done (auto for how-to slugs) | Featured snippets |
| ~~Add FAQ schema~~ | ✅ Done (11,703 articles) | FAQ rich results |
| ~~Add E-E-A-T signals~~ | ✅ Done | Author trust |
| ~~Add DefinitionBlock~~ | ✅ Done | Definition rich results |
| ~~Backfill article tags~~ | ✅ Done (4,458 articles) | Meta tag coverage |

### Tier 2: High Priority (Week 3-4)

| Action | Articles | AEO/GEO Impact |
|--------|----------|----------------|
| DE→PL articles | 50 | New market capture |
| IT→PL articles | 50 | New market capture |
| Chicago/NYC city pages | 2 | Local search |
| "Is X hard?" for all languages | 15 | Featured snippets |

### Tier 3: Medium Priority (Month 2)

| Action | Articles | AEO/GEO Impact |
|--------|----------|----------------|
| Expand 3-article pairs to 10 | 147 | Complete coverage |
| Expand 5-article pairs to 10 | 75 | Complete coverage |
| PT→PL articles | 50 | Brazilian market |
| More city pages (10 cities) | 10 | Local search |

### Tier 4: Ongoing

| Action | Articles | AEO/GEO Impact |
|--------|----------|----------------|
| Advanced content for Polish | 20 | Long-tail capture |
| EN→ES expansion (10→50) | 40 | High volume |
| EN→FR expansion (10→50) | 40 | High volume |
| Dictionary expansion (109→500) | Programmatic | Definition snippets |

---

## Part 6: Duplicate Prevention System

### Article Tracking Database

Create a tracking file to prevent duplicates:

**File:** `blog/src/data/article-registry.json`

```json
{
  "topics": {
    "how-to-say-i-love-you": {
      "canonicalSlug": "how-to-say-i-love-you-in-{language}",
      "pairs": {
        "en-pl": { "status": "published", "path": "en/pl/how-to-say-i-love-you-in-polish.mdx" },
        "es-pl": { "status": "published", "path": "es/pl/how-to-say-i-love-you-in-polish.mdx" },
        "fr-pl": { "status": "missing" },
        "de-pl": { "status": "planned" }
      }
    }
  }
}
```

### Pre-Generation Checklist

Before generating any article:
1. Check if topic exists in registry
2. Check if language pair is covered
3. If duplicate found, generate for missing pairs only

### Slug Standardization

All articles on same topic should share slug pattern for hreflang benefits:
- EN: `how-to-say-i-love-you-in-polish`
- ES: `como-decir-te-quiero-en-polaco` ← Same semantic slug, localized
- FR: `comment-dire-je-taime-en-polonais`

---

## Part 7: Implementation Commands

### Generate Missing FR→PL Articles

```bash
cd blog

# 1. How to say I love you (missing from FR)
npm run generate -- -l pl --nativeLanguage fr -t "Comment dire je t'aime en polonais" -c phrases

# 2. Typing Polish characters (missing from FR)
npm run generate -- -l pl --nativeLanguage fr -t "Comment taper les caractères polonais sur clavier français" -c phrases

# 3. Is Polish hard to learn (missing from FR)
npm run generate -- -l pl --nativeLanguage fr -t "Le polonais est-il difficile à apprendre pour les francophones" -c culture

# 4. Polish past tense (missing from FR)
npm run generate -- -l pl --nativeLanguage fr -t "Le passé en polonais - raconter sa journée à son partenaire" -c grammar

# 5. Polish phone calls (missing from FR)
npm run generate -- -l pl --nativeLanguage fr -t "Appels téléphoniques en polonais - maîtriser les conversations" -c situations
```

### Generate DE→PL Articles (Batch)

```bash
cd blog

# Core topics for German speakers learning Polish
topics=(
  "Polnische Liebesausdrücke und Kosenamen"
  "Wie sagt man Ich liebe dich auf Polnisch"
  "Polnische Aussprache für Deutsche"
  "Polnische Grammatik Grundlagen"
  "Die wichtigsten polnischen Phrasen für Paare"
  "Polnische Begrüßungen und Verabschiedungen"
  "Polnische Komplimente für deinen Partner"
  "Polnische Schimpfwörter die du vermeiden solltest"
  "Polnisch vs Deutsch Unterschiede"
  "Ist Polnisch schwer zu lernen für Deutsche"
)

for topic in "${topics[@]}"; do
  npm run generate -- -l pl --nativeLanguage de -t "$topic" -c phrases
done
```

---

## Part 8: Success Metrics

### AEO Metrics
- [ ] Featured snippets captured (track via Search Console)
- [x] FAQ rich results — FAQPage schema on 11,703 articles
- [x] HowTo rich results — HowTo schema on how-to articles
- [ ] Position 0 rankings

### GEO Metrics
- [ ] Local pack appearances (city pages)
- [ ] "Near me" query traffic
- [ ] City-specific organic traffic

### AI Citation Metrics
- [ ] Mentions in ChatGPT/Claude responses (manual testing)
- [ ] Perplexity citations
- [ ] Google AI Overview citations

### Content Metrics
- [x] Total articles: 11,933 (was 474 at strategy creation)
- [x] Language pairs covered: 306 (18×17)
- [x] Native languages covered: 18 (was 3 at strategy creation)
- [ ] Advanced articles: 0 → Target: 50

---

## Appendix A: Complete Topic Checklist

### Essential Topics (Every Language Pair Should Have)

- [ ] How to say "I love you"
- [ ] Pet names and terms of endearment (50+)
- [ ] 100 most common words
- [ ] Pronunciation guide for native speakers
- [ ] "Is [language] hard to learn?"
- [ ] Grammar basics for beginners
- [ ] Romantic phrases for couples
- [ ] Meeting partner's family
- [ ] Date night vocabulary
- [ ] Compliments for your partner

### Extended Topics (10+ article pairs)

- [ ] Wedding/engagement phrases
- [ ] Anniversary wishes
- [ ] Birthday wishes
- [ ] Holiday traditions
- [ ] Love songs to learn together
- [ ] Movies to watch together
- [ ] Texting slang
- [ ] Arguing constructively
- [ ] Apology phrases
- [ ] Long-distance relationship phrases

### Deep Topics (50+ article pairs)

- [ ] All grammar topics (cases, tenses, gender, etc.)
- [ ] All pronunciation topics
- [ ] Cultural deep-dives
- [ ] Regional variations
- [ ] Formal vs informal speech
- [ ] Professional vocabulary
- [ ] Medical vocabulary
- [ ] Travel vocabulary
- [ ] Food vocabulary
- [ ] Advanced idiomatic expressions

---

## Appendix B: Schema Implementation Files

Files containing AEO schema:

1. `blog/src/layouts/ArticleLayout.astro` — BlogPosting, BreadcrumbList, HowTo, FAQPage, Speakable, Organization author (all JSON-LD)
2. `blog/src/components/DefinitionBlock.astro` — schema.org/DefinedTerm (microdata)
3. `blog/src/components/VocabCard.astro` — `.speakable-vocab` CSS class for Speakable
4. `blog/src/components/PhraseOfDay.astro` — `.speakable-phrase` CSS class for Speakable
5. `blog/src/layouts/BaseLayout.astro` — AI referral tracking (GA4)

### FAQ Pipeline Scripts
- `blog/scripts/generate-faqs-gemini.mjs` — Generate bespoke FAQs using Gemini 2.0 Flash
- `blog/scripts/export-for-faqs.mjs` — Export article data for FAQ generation
- `blog/scripts/upload-faqs.mjs` — Merge + deduplicate + upload FAQs to Supabase
- `blog/scripts/backfill-tags.mjs` — Backfill missing article:tag meta tags

---

## Next Steps

1. **Review this document** - Confirm priorities align with business goals
2. **Create article registry** - Prevent duplicates going forward
3. **Implement HowTo schema** - Code change, no new articles needed
4. **Fill FR→PL gaps** - 5 articles
5. **Begin DE→PL expansion** - 50 articles
6. **Create Chicago city page** - Test GEO approach

---

*Document maintained by: Claude Code*
*Last updated: February 22, 2026*
