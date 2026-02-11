# AEO/GEO Strategy - Love Languages Blog

> Strategic plan for Answer Engine Optimization and Generative Engine Optimization
> Created: January 16, 2026
> **Updated: January 21, 2026**

---

## Executive Summary

**Current State:** 1,003 articles, 6 native languages, strong Polish coverage, basic schema markup
**Goal:** Become THE authoritative source for couples learning languages together
**Strategy:** Systematic content expansion + structured data optimization for AI citation

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

### 3.1 Schema Markup Additions

**HowTo Schema (HIGH PRIORITY)**

Currently missing. Add to all "How to..." articles.

```json
{
  "@type": "HowTo",
  "name": "How to Say I Love You in Polish",
  "description": "Learn to express love in Polish with proper pronunciation",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Learn the phrase",
      "text": "The phrase is 'Kocham Cię' (ko-HAM chyeh)"
    },
    {
      "@type": "HowToStep",
      "name": "Practice pronunciation",
      "text": "Focus on the 'ch' sound which is like clearing your throat"
    }
  ]
}
```

**Affected Articles:** ~50+ "How to..." articles across all pairs

**Speakable Schema (Voice Search)**

Add to key phrase articles for voice assistant citation:

```json
{
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".pronunciation-guide", ".key-phrase", ".answer-box"]
  }
}
```

**FAQ Schema Expansion**

Currently only on hub pages. Add to individual articles:
- Grammar articles: "What is Polish case system?"
- Phrase articles: "How do you pronounce X?"
- Culture articles: "When do Polish people celebrate name days?"

### 3.2 Content Structure Optimization

**Answer Box Pattern**

Add highlighted answer boxes at top of articles:

```html
<div class="answer-box" itemscope itemtype="https://schema.org/Answer">
  <strong>Quick Answer:</strong> "I love you" in Polish is
  <span class="key-phrase">Kocham Cię</span> (ko-HAM chyeh)
</div>
```

**Definition Blocks**

For vocabulary articles, add explicit definitions:

```html
<dl itemscope itemtype="https://schema.org/DefinedTerm">
  <dt itemprop="name">Kochanie</dt>
  <dd itemprop="description">Polish term of endearment meaning "darling" or "sweetheart"</dd>
</dl>
```

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

## Part 5: Content Creation Priority Matrix

### Tier 1: Immediate (Week 1-2)

| Action | Articles | AEO/GEO Impact |
|--------|----------|----------------|
| Fill FR→PL gaps | 5 | Hreflang completion |
| Add HowTo schema to existing | 0 (code change) | Featured snippets |
| Add FAQ schema to articles | 0 (code change) | FAQ rich results |

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
- [ ] FAQ rich results showing
- [ ] HowTo rich results showing
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
- [ ] Total articles: 474 → Target: 900+
- [ ] Language pairs with 10+ articles: 17 → Target: 48
- [ ] Native languages covered: 3 → Target: 6
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

Files to modify for AEO schema improvements:

1. `blog/src/layouts/ArticleLayout.astro` - Add HowTo, Speakable schema
2. `blog/src/components/SEO.astro` - Add FAQ schema for articles
3. `blog/src/components/AnswerBox.astro` - New component for answer boxes
4. `blog/src/components/HowToSteps.astro` - New component for step-by-step

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
*Last updated: January 16, 2026*
