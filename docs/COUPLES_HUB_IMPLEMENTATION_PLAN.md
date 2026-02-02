# Couples Hub Implementation Plan

**Created:** 2026-02-02
**Last Updated:** 2026-02-02
**Status:** PLANNING
**Goal:** Two-section couples hub with science-backed RALL content + target-language-specific couples articles

---

## Overview

Transform `/learn/[nativeLang]/couples-language-learning` into a rich content hub with:

1. **Section A:** Science-backed "Why Learn Together" articles (behavioral economics, psychology, RALL methodology)
2. **Section B:** Target-language-specific couples content (pet names, romantic phrases, etc.)

**Content Approach:** "Educate on the Problem → Reveal the Scientific Solution → Show the App Was Built on This"

---

## Related Documents

- **Article Outlines:** `COUPLES_METHODOLOGY_ARTICLES_OUTLINES_V2.md` (detailed content for all 8 articles)
- **Content Gap Analysis:** `CONTENT_GAP_ANALYSIS.md`
- **ML Master Plan:** `docs/archived/ML_MASTER_PLAN.md`

---

## Phase 1: Content Architecture & Slugging Convention

### 1.1 New Article Category
Create a new category for science-backed couples/methodology content:
- **Category:** `couples-methodology` ✅ (new category)
- **Distinguishing feature:** These articles have `target_lang = native_lang` (same language = general content)
- **Content approach:** Behavioral economics + psychology research, soft-sell app features

### 1.2 Slugging Convention for General Articles

**Pattern:** `{topic}-for-couples-learning-together`

| Article | Slug |
|---------|------|
| RALL Strategies | `rall-strategies-for-couples-learning-together` |
| Science of Learning Together | `science-of-couples-language-learning` |
| Staying Motivated as a Couple | `staying-motivated-couples-language-learning` |
| AI Coaching for Couples | `ai-coaching-for-couples-learning-together` |
| Couples Learning Roadmap | `couples-language-learning-roadmap` |
| Benefits of Learning Partner's Language | `benefits-learning-partners-language` |

### 1.3 Database Schema Consideration

**Option A:** Use existing schema with convention
- `native_lang = 'en'`, `target_lang = 'en'` (same = general)
- Query: `WHERE native_lang = target_lang`

**Option B:** Add nullable target_lang
- `target_lang = NULL` for general content
- Query: `WHERE target_lang IS NULL`

**Recommendation:** Option A (no schema changes needed)

---

## Phase 2: Create Science-Backed RALL Articles (English)

> **Full outlines:** See `COUPLES_METHODOLOGY_ARTICLES_OUTLINES_V2.md`

### 2.1 Article List (8 articles)

| # | Title | Slug | Science Concepts |
|---|-------|------|------------------|
| 1 | **RALL Strategies That Actually Work** | `rall-strategies-for-couples-learning-together` | Commitment Devices, Hyperbolic Discounting, Information Gap |
| 2 | **The Science Behind Couples Learning Together** | `science-of-couples-language-learning` | Michelangelo Phenomenon, Ideal L2 Self, Pygmalion Effect |
| 3 | **How AI Coaching Keeps You Both on Track** | `ai-coaching-for-couples-learning-together` | Foreign Language Anxiety, Peer Agents, Affective Filter |
| 4 | **From Zero to Conversations: Your Roadmap** | `couples-language-learning-roadmap` | Bloom's Taxonomy, Task-Based Language Teaching (TBLT) |
| 5 | **Why Learning Your Partner's Language Changes Everything** | `benefits-learning-partners-language` | Investment Model, Loss Aversion, Interdependence Theory |
| 6 | **Common Mistakes Couples Make (And How to Avoid Them)** | `couples-language-learning-mistakes` | Cooperative vs Competitive Dynamics, Team Identification |
| 7 | **Making Language Learning a Date Night** | `language-learning-date-night-ideas` | Contextual Learning, Shadowing, Embodied Cognition |
| 8 | **Long-Distance Couples: Learning Together Apart** | `long-distance-couples-language-learning` | Social Presence Theory, Asynchronous Cooperation |

### 2.2 Content Structure (Each Article)

```
1. Hook (validate the struggle)
   "Why willpower isn't enough..."

2. The Science (introduce concept)
   Explain behavioral economics / psychology principle

3. Apply to Couples (make relevant)
   How this concept plays out in relationship context

4. Practical Strategies (actionable)
   5-6 concrete things to do

5. Soft Pitch (show app alignment)
   "We designed [feature] around this principle because..."
```

### 2.3 Article Template (MDX)

```markdown
---
title: "{Title}"
description: "{SEO description - include science hook}"
native_lang: "en"
target_lang: "en"  # Same = general/methodology content
category: "couples-methodology"
tags: ["couples", "rall", "science", "learning-together", "{specific-concept}"]
published: true
---

# {Title}

## The Problem
[Hook - validate the struggle, ~100 words]

## The Science: {Concept Name}
[Explain the behavioral economics / psychology principle, ~200 words]

::: science {Concept Name}
Brief definition that can be pulled as a highlight
:::

## How This Applies to Couples
[Make it relevant to relationship context, ~200 words]

## Practical Strategies
[5-6 actionable items with examples, ~400 words]

## What This Means for Your Learning
[Soft pitch - show app was built on these principles, ~150 words]

<CTA variant="couples" />
```

### 2.4 Generation Process

- [ ] 2.4.1 Generate Article 1 (RALL Strategies) — test format
- [ ] 2.4.2 Review with Richard for tone/approach
- [ ] 2.4.3 Generate remaining 7 articles
- [ ] 2.4.4 Final review pass (science accuracy, soft pitch alignment)
- [ ] 2.4.5 Insert all 8 to Supabase with `native_lang = 'en'`, `target_lang = 'en'`, `category = 'couples-methodology'`
- [ ] 2.4.6 Verify queries return correct articles

### 2.5 Quality Checklist (Per Article)

- [ ] Hook validates a real struggle
- [ ] Science concept explained accessibly (no unexplained jargon)
- [ ] At least one `::: science` block with quotable definition
- [ ] 4+ practical strategies with concrete examples
- [ ] Soft pitch mentions specific app feature (Love Log, Cupid, Playground, etc.)
- [ ] Word count: 1,000-1,400 words
- [ ] Internal links to related articles where relevant

---

## Phase 3: Translate Science-Backed Articles to All Native Languages

### 3.1 Translation Matrix

Translate 8 articles × 17 other languages = **136 articles**

### 3.2 Translation Guidelines for Science Content

**Keep English terms where appropriate:**
- "Michelangelo Phenomenon" → keep in English (established research term)
- "RALL" → keep as acronym, explain in local language
- "Bloom's Taxonomy" → keep in English

**Translate explanations naturally:**
- Science concepts explained in natural target language
- Examples localized (French version references French culture)
- Soft pitches remain consistent (same app features highlighted)

**Quality check:**
- Science accuracy maintained
- Jargon explained, not just translated
- Tone matches Cupid's voice (warm, encouraging, slightly playful)

| Native Lang | Status |
|-------------|--------|
| en | ✅ Source |
| es | ⏳ Pending |
| fr | ⏳ Pending |
| de | ⏳ Pending |
| it | ⏳ Pending |
| pt | ⏳ Pending |
| nl | ⏳ Pending |
| pl | ⏳ Pending |
| ru | ⏳ Pending |
| uk | ⏳ Pending |
| tr | ⏳ Pending |
| ro | ⏳ Pending |
| sv | ⏳ Pending |
| no | ⏳ Pending |
| da | ⏳ Pending |
| cs | ⏳ Pending |
| el | ⏳ Pending |
| hu | ⏳ Pending |

### 3.2 Translation Approach
- Use Claude subagents for translation
- Maintain slug pattern (translate title, keep slug structure)
- Localize examples (e.g., "French speaker learning Polish" for French version)

---

## Phase 4: Update Couples Hub Component

### 4.1 New Component Structure

```
/learn/[nativeLang]/couples-language-learning
├── Hero (translated via couples-translations/*.json)
├── Why Learn Together (translated)
├── Best Languages Grid (existing)
├── Tips Section (translated)
│
├── NEW: Section A - "Why Learn Together" Articles
│   └── CouplesMethodologyArticles.astro
│       - Query: native_lang = X AND target_lang = X
│       - Display: 4-6 article cards
│
├── NEW: Section B - "Couples Content by Language"
│   └── CouplesArticlesByTarget.astro
│       - Query: native_lang = X AND couples keywords
│       - Display: Tabbed/grouped by target_lang
│       - Show top 3 per target, "View all" link
│
├── FAQs (translated)
└── CTA (translated)
```

### 4.2 Supabase Query Functions

**File:** `src/lib/couples-articles.ts`

```typescript
// Query 1: General methodology articles
export async function getMethodologyArticles(nativeLang: string) {
  return supabase
    .from('blog_articles')
    .select('slug, title, description, native_lang')
    .eq('native_lang', nativeLang)
    .eq('target_lang', nativeLang)  // Same = general
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(8);
}

// Query 2: Couples articles by target language
export async function getCouplesArticlesByTarget(nativeLang: string) {
  const keywords = ['pet-names', 'love', 'romantic', 'couple', 'date-night', 
                    'compliment', 'endearment', 'partner'];
  
  const { data } = await supabase
    .from('blog_articles')
    .select('slug, title, target_lang, description')
    .eq('native_lang', nativeLang)
    .neq('target_lang', nativeLang)  // Exclude general
    .eq('published', true)
    .or(keywords.map(k => `slug.ilike.%${k}%`).join(','));
  
  // Group by target_lang
  return groupBy(data, 'target_lang');
}
```

### 4.3 Component Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/couples-articles.ts` | CREATE | Supabase query functions |
| `src/components/hub/CouplesMethodologyArticles.astro` | CREATE | Section A component |
| `src/components/hub/CouplesArticlesByTarget.astro` | CREATE | Section B component |
| `src/pages/learn/[nativeLang]/couples-language-learning.astro` | MODIFY | Add new sections |

---

## Phase 5: Testing & Validation

### 5.1 Test Cases

- [ ] English page shows 8 methodology articles
- [ ] English page shows couples articles grouped by 17 target languages
- [ ] French page shows translated methodology articles
- [ ] French page shows French→X couples articles (not English ones)
- [ ] All 18 native language pages load without error
- [ ] Article links resolve correctly
- [ ] Mobile responsive layout works

### 5.2 Validation Queries

```sql
-- Count methodology articles per native lang
SELECT native_lang, COUNT(*) 
FROM blog_articles 
WHERE native_lang = target_lang 
  AND published = true
GROUP BY native_lang;

-- Count couples articles per native lang
SELECT native_lang, COUNT(*) 
FROM blog_articles 
WHERE native_lang != target_lang 
  AND published = true
  AND (slug ILIKE '%pet-names%' OR slug ILIKE '%love%' OR ...)
GROUP BY native_lang;
```

---

## Phase 6: Deployment

### 6.1 Deployment Steps

1. [ ] Create feature branch: `feature/couples-hub-v2`
2. [ ] Implement Phase 4 components
3. [ ] Deploy to Vercel preview
4. [ ] Insert Phase 2 English articles to Supabase
5. [ ] Test preview thoroughly
6. [ ] Insert Phase 3 translated articles (batch)
7. [ ] Final review
8. [ ] Merge to main

### 6.2 Rollback Plan

If issues arise:
- Components have fallback to show nothing if queries fail
- Articles can be unpublished in Supabase without code changes
- Previous page version in git history

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Architecture | 30 min | None |
| Phase 2: English Articles | 2-3 hrs | Phase 1 |
| Phase 3: Translations | 1-2 hrs (parallel subagents) | Phase 2 |
| Phase 4: Components | 2-3 hrs | Phase 1 |
| Phase 5: Testing | 1 hr | Phase 2, 3, 4 |
| Phase 6: Deployment | 30 min | Phase 5 |

**Total:** ~8-10 hours of work

---

## Success Metrics

- [ ] All 18 native language pages have methodology articles
- [ ] All 18 native language pages show grouped couples content
- [ ] Zero console errors on couples hub pages
- [ ] Articles indexed by Google within 1 week
- [ ] User engagement (time on page) improves

---

## Decisions Made

1. **Category:** ✅ Create new `couples-methodology` category
2. **Article count:** ✅ 8 articles (science-backed, see V2 outlines)
3. **Target language display:** TBD — follow existing design patterns
4. **"View all" behavior:** TBD — follow existing design patterns
5. **Content approach:** ✅ "Educate → Science → Soft Pitch" (per NotebookLM strategy)

---

## Appendix: Existing Couples Content Counts

| Native | Total Couples Articles | Articles per Target |
|--------|----------------------|---------------------|
| en | 320 | 12-47 |
| fr | 220 | 9-47 |
| es | 210 | 9-47 |
| nl | 221 | 13 each |
| de | 202 | 11-13 |
| pl | 154 | 9-10 |
| (others) | 150-200 | 8-12 |

This existing content will power Section B immediately.
