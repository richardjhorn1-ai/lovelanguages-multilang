# Article Creation SOP (Standard Operating Procedure)

> **Purpose:** This document ensures consistent, correct article creation for the Love Languages multi-language blog. Use this as context when creating content with subagents.

---

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Content Location** | `/blog/src/content/articles/{nativeLanguage}/{targetLanguage}/` |
| **File Format** | `.mdx` (Markdown + JSX components) |
| **URL Generated** | `/learn/{nativeLanguage}/{targetLanguage}/{slug}/` |
| **Image Location** | `/blog/public/blog/{slug}.jpg` |
| **Native Languages** | `en`, `es`, `fr`, `de`, `it`, `pt` (6 total) |
| **Target Languages** | Above 6 + `ro`, `nl`, `sv`, `no`, `da`, `pl`, `cs`, `ru`, `uk`, `el`, `hu`, `tr` (18 total) |

---

## Step 1: Determine File Location

### Directory Structure
```
/blog/src/content/articles/
├── en/                    # English native speakers
│   ├── pl/               # Learning Polish
│   ├── es/               # Learning Spanish
│   ├── fr/               # Learning French
│   └── [16 more targets]
├── es/                    # Spanish native speakers
│   ├── en/               # Learning English
│   ├── pl/               # Learning Polish
│   └── [16 more targets]
├── fr/                    # French native speakers
├── de/                    # German native speakers
├── it/                    # Italian native speakers
└── pt/                    # Portuguese native speakers
```

### Language Code Reference

| Code | Language | Can be Native? | Can be Target? |
|------|----------|----------------|----------------|
| `en` | English | Yes | Yes |
| `es` | Spanish | Yes | Yes |
| `fr` | French | Yes | Yes |
| `de` | German | Yes | Yes |
| `it` | Italian | Yes | Yes |
| `pt` | Portuguese | Yes | Yes |
| `pl` | Polish | No | Yes |
| `ro` | Romanian | No | Yes |
| `nl` | Dutch | No | Yes |
| `sv` | Swedish | No | Yes |
| `no` | Norwegian | No | Yes |
| `da` | Danish | No | Yes |
| `cs` | Czech | No | Yes |
| `ru` | Russian | No | Yes |
| `uk` | Ukrainian | No | Yes |
| `el` | Greek | No | Yes |
| `hu` | Hungarian | No | Yes |
| `tr` | Turkish | No | Yes |

### Rule: No Same-Language Pairs
- NEVER create `en/en/`, `es/es/`, etc.
- Native and target must be different languages

---

## Step 2: Create the MDX File

### File Naming Convention

**Format:** `{seo-optimized-slug}.mdx`

**⚠️ CRITICAL RULE: ALWAYS USE ENGLISH SLUGS**

Regardless of the native language directory (es/, fr/, de/, etc.), the slug MUST be in English. This is essential for hreflang linking to work properly across all native language versions.

**Rules:**
- **ALWAYS English slug** - Even for Spanish/French/German native content
- All lowercase
- Hyphens between words (no spaces or underscores)
- Include target language name for SEO
- Keep under 60 characters if possible
- URL-safe characters only

**Good Examples:**
```
how-to-say-i-love-you-in-polish.mdx        ✅ English slug
ukrainian-pet-names-terms-of-endearment.mdx ✅ English slug
spanish-future-tense-making-plans-together.mdx ✅ English slug
meeting-your-german-partners-family.mdx     ✅ English slug
```

**Bad Examples:**
```
comment-dire-je-taime-en-polonais.mdx  # Wrong: French slug
como-decir-te-amo-en-aleman.mdx        # Wrong: Spanish slug
apodos-carinosos-en-italiano.mdx       # Wrong: Spanish slug
surnoms-affectueux-allemands.mdx       # Wrong: French slug
I_Love_You_Polish.mdx                  # Wrong: uppercase, underscores
how to say i love you.mdx              # Wrong: spaces
polish-article-1.mdx                   # Wrong: not descriptive
```

**Why English Slugs?**
- Hreflang linking requires matching slugs across all native language versions
- Google connects `/learn/en/pl/how-to-say-i-love-you-in-polish/` with `/learn/es/pl/how-to-say-i-love-you-in-polish/`
- Non-matching slugs break this connection and hurt SEO

---

## Step 3: Write Frontmatter

### Required Frontmatter Template

```yaml
---
title: "Your SEO-Optimized Title Here"
description: "A compelling 150-160 character meta description with keywords."
category: phrases
difficulty: beginner
readTime: 8
date: '2026-01-21'
image: '/blog/your-slug-here.jpg'
tags: ['tag1', 'tag2', 'tag3']
language: pl
nativeLanguage: en
---
```

### Field Specifications

| Field | Type | Required | Values/Constraints |
|-------|------|----------|-------------------|
| `title` | string | **Yes** | Max ~60 chars for SEO |
| `description` | string | **Yes** | 150-160 chars, include keywords |
| `category` | enum | **Yes** | `phrases`, `vocabulary`, `grammar`, `culture`, `situations`, `pronunciation` |
| `difficulty` | enum | **Yes** | `beginner`, `intermediate`, `advanced` |
| `readTime` | number | **Yes** | Minutes (typically 5-15) |
| `date` | string | **Yes** | ISO format: `'YYYY-MM-DD'` |
| `image` | string | No | Path: `'/blog/slug.jpg'` |
| `tags` | array | No | 3-6 relevant tags |
| `language` | enum | No | Target language code (derived from path) |
| `nativeLanguage` | enum | No | Native language code (derived from path) |

### Category Guidelines

| Category | Use For | Examples |
|----------|---------|----------|
| `phrases` | Common expressions, romantic phrases, greetings | "How to say I love you", "Pet names" |
| `vocabulary` | Word lists, thematic vocabulary | "100 common words", "Restaurant vocabulary" |
| `grammar` | Language rules, conjugation, structure | "Future tense", "Cases explained" |
| `culture` | Traditions, customs, regional differences | "Christmas traditions", "Meeting the family" |
| `situations` | Practical scenarios, conversations | "Date night", "Phone calls" |
| `pronunciation` | Sounds, accents, speaking | "Pronunciation guide", "Common mistakes" |

---

## Step 4: Write Content

### Content Structure Template

```mdx
---
[frontmatter]
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

# {Title - can match frontmatter or be more detailed}

[Introduction paragraph - 2-3 sentences explaining what reader will learn]

## Section 1: [Main Topic]

[Content with vocabulary cards, tables, tips]

<VocabCard
  word="Target word"
  translation="Native translation"
  pronunciation="pro-NUN-see-AY-shun"
  example="Example sentence using the word."
/>

## Section 2: [Second Topic]

<CultureTip title="Cultural Note" flag="🇵🇱">
Relevant cultural context about this topic.
</CultureTip>

| Target Language | Native Translation | Pronunciation |
|-----------------|-------------------|---------------|
| **Word 1** | Translation 1 | pro-NUN-see-AY-shun |
| **Word 2** | Translation 2 | pro-NUN-see-AY-shun |

## Section 3: [Practice/Application]

<PhraseOfDay
  word="Featured phrase"
  translation="Translation"
  pronunciation="pro-NUN-see-AY-shun"
  context="When and how to use this phrase."
/>

## Conclusion

[Brief summary and encouragement to practice]

<CTA />
```

### Available Components

#### 1. VocabCard - Individual vocabulary item
```mdx
<VocabCard
  word="Kochanie"
  translation="Darling, sweetheart"
  pronunciation="ko-HA-nyeh"
  example="Dzień dobry, kochanie!"
/>
```

#### 2. CultureTip - Cultural context box
```mdx
<CultureTip title="Regional Differences" flag="🇺🇦">
In Western Ukraine, you might hear different expressions...
</CultureTip>
```

**Flag emojis by language:**
- Polish: 🇵🇱 | Ukrainian: 🇺🇦 | Russian: 🇷🇺
- German: 🇩🇪 | French: 🇫🇷 | Spanish: 🇪🇸
- Italian: 🇮🇹 | Portuguese: 🇵🇹 | Dutch: 🇳🇱
- Greek: 🇬🇷 | Turkish: 🇹🇷 | Czech: 🇨🇿
- Hungarian: 🇭🇺 | Romanian: 🇷🇴 | Swedish: 🇸🇪
- Norwegian: 🇳🇴 | Danish: 🇩🇰

#### 3. PhraseOfDay - Featured phrase highlight
```mdx
<PhraseOfDay
  word="Я тебе кохаю"
  translation="I love you"
  pronunciation="ya teh-BEH ko-HA-yu"
  context="The most important phrase for couples learning Ukrainian."
/>
```

#### 4. DefinitionBlock - Vocabulary definition with rich schema
```mdx
<DefinitionBlock
  term="Kochanie"
  definition="Polish term of endearment meaning 'darling' or 'sweetheart', used between romantic partners."
  pronunciation="ko-HA-nyeh"
  partOfSpeech="noun"
  language="Polish"
/>
```
Use for key vocabulary definitions in vocabulary/phrases articles. Renders with purple gradient styling and `schema.org/DefinedTerm` microdata for Google "Definition" rich results.

**Props:**
- `term` (required) — The word being defined
- `definition` (required) — The definition text
- `pronunciation` (optional) — Phonetic pronunciation guide
- `partOfSpeech` (optional) — noun, verb, adjective, etc.
- `language` (optional) — Language name (e.g. "Polish", "Spanish")

#### 5. CTA - Call-to-action (no props, place at end)
```mdx
<CTA />
```

#### 6. Markdown Tables - For vocabulary lists
```mdx
| Ukrainian | English | Pronunciation |
|-----------|---------|---------------|
| **Кохання** | Love | ko-HA-nya |
| **Серце** | Heart | SER-tse |
```

---

## Step 5: Create Hero Image

### Image Requirements

- **Format:** JPG
- **Location:** `/blog/public/blog/`
- **Naming:** Match article slug exactly
- **Size:** Recommended 1200x630px (social sharing optimized)

### Naming Convention

```
Article: /blog/src/content/articles/en/uk/ukrainian-pet-names-terms-of-endearment.mdx
Image:   /blog/public/blog/ukrainian-pet-names-terms-of-endearment.jpg
Reference in frontmatter: image: '/blog/ukrainian-pet-names-terms-of-endearment.jpg'
```

### Image Generation (via Glif MCP)

Use Z Image Turbo (ID: `cmincelxf0000l104qgpz7iaa`):

```
Prompt guidelines by topic:
- Romance/I love you: "intimate moment, soft lighting, holding hands"
- Pet names: "playful and affectionate, laughing together"
- Grammar/study: "study session, notebooks and coffee, focused but happy"
- Restaurant/dining: "elegant restaurant setting, reviewing menu together"
- Family/meeting parents: "warm family gathering, welcoming atmosphere"
- Phone calls: "one partner on phone, the other helping with phrases"
- Texting: "texting each other playfully, smartphones in hand"
- Pronunciation: "one partner teaching the other, focused on mouth movements"
- Travel: "scenic landscape, travel vocabulary, couple exploring"
```

---

## Step 6: Validation Checklist

Before committing, verify:

### File Location
- [ ] Directory exists: `/blog/src/content/articles/{native}/{target}/`
- [ ] Native language is one of: `en`, `es`, `fr`, `de`, `it`, `pt`
- [ ] Target language is different from native
- [ ] Filename is lowercase with hyphens

### Frontmatter
- [ ] All required fields present: `title`, `description`, `category`, `difficulty`, `readTime`, `date`
- [ ] `category` is valid enum value
- [ ] `difficulty` is valid enum value
- [ ] `date` is ISO format (YYYY-MM-DD)
- [ ] `language` matches target language directory
- [ ] `nativeLanguage` matches native language directory

### Content
- [ ] Component imports at top (after frontmatter)
- [ ] Main heading matches/relates to title
- [ ] VocabCard components have all 4 props
- [ ] CultureTip has title and flag
- [ ] Tables use proper markdown format
- [ ] CTA component at the end

### Image
- [ ] Image file exists at `/blog/public/blog/{slug}.jpg`
- [ ] Frontmatter `image` path matches: `'/blog/{slug}.jpg'`

---

## Complete Example

### File: `/blog/src/content/articles/en/uk/how-to-say-i-love-you-in-ukrainian.mdx`

```mdx
---
title: "How to Say I Love You in Ukrainian"
description: "Learn romantic ways to say 'I love you' in Ukrainian. Perfect phrases for couples learning Ukrainian together."
category: phrases
difficulty: beginner
readTime: 7
date: '2026-01-21'
image: '/blog/how-to-say-i-love-you-in-ukrainian.jpg'
tags: ['ukrainian-phrases', 'romantic-ukrainian', 'i-love-you', 'couples-learning']
language: uk
nativeLanguage: en
---

import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

# How to Say I Love You in Ukrainian: A Guide for Couples

Learning to express love in your partner's native language is one of the most meaningful gestures you can make. Ukrainian has beautiful, heartfelt ways to say "I love you" that go beyond simple translation.

## The Essential Phrase

<PhraseOfDay
  word="Я тебе кохаю"
  translation="I love you"
  pronunciation="ya teh-BEH ko-HA-yu"
  context="The most common and heartfelt way to express love in Ukrainian."
/>

## Romantic Variations

| Ukrainian | English | Pronunciation | When to Use |
|-----------|---------|---------------|-------------|
| **Я тебе кохаю** | I love you | ya teh-BEH ko-HA-yu | Everyday declaration |
| **Я тебе люблю** | I love you (softer) | ya teh-BEH lyub-LYU | Affectionate, casual |
| **Кохаю тебе** | Love you | ko-HA-yu teh-BEH | Quick, familiar |

<CultureTip title="Кохаю vs Люблю" flag="🇺🇦">
Ukrainian has two verbs for love: "кохати" (romantic love) and "любити" (general love/like). Use "кохаю" for romantic partners and "люблю" for family, friends, or things you enjoy.
</CultureTip>

## Deepening Your Expression

<VocabCard
  word="Ти моє все"
  translation="You are my everything"
  pronunciation="ty mo-YE vse"
  example="Ти моє все, кохана."
/>

<VocabCard
  word="Я без тебе не можу"
  translation="I can't live without you"
  pronunciation="ya bez TEH-beh ne MO-zhu"
  example="Я без тебе не можу жити."
/>

## Practice Together

Try saying these phrases to your partner today. Start with "Я тебе кохаю" and build up to the more expressive variations as you grow more comfortable with Ukrainian pronunciation.

<CTA />
```

---

## Hreflang Linking (Critical for SEO)

### How It Works

Articles about the **same topic** in **different native languages** are automatically connected via hreflang tags when they share the **same slug**.

**⚠️ CRITICAL: All slugs must be in ENGLISH regardless of native language**

**Example - "I Love You in Ukrainian" across all native languages:**

```
/articles/en/uk/how-to-say-i-love-you-in-ukrainian.mdx  ← English native (English slug)
/articles/es/uk/how-to-say-i-love-you-in-ukrainian.mdx  ← Spanish native (SAME English slug)
/articles/fr/uk/how-to-say-i-love-you-in-ukrainian.mdx  ← French native (SAME English slug)
/articles/de/uk/how-to-say-i-love-you-in-ukrainian.mdx  ← German native (SAME English slug)
```

**❌ WRONG - This breaks hreflang linking:**
```
/articles/en/uk/how-to-say-i-love-you-in-ukrainian.mdx  ← English slug
/articles/es/uk/como-decir-te-amo-en-ucraniano.mdx      ← Spanish slug - NO MATCH!
/articles/fr/uk/comment-dire-je-taime-en-ukrainien.mdx  ← French slug - NO MATCH!
```

**Generated hreflang tags:**
```html
<link rel="alternate" hreflang="en" href="/learn/en/uk/how-to-say-i-love-you-in-ukrainian/" />
<link rel="alternate" hreflang="es" href="/learn/es/uk/how-to-say-i-love-you-in-ukrainian/" />
<link rel="alternate" hreflang="fr" href="/learn/fr/uk/how-to-say-i-love-you-in-ukrainian/" />
<link rel="alternate" hreflang="de" href="/learn/de/uk/how-to-say-i-love-you-in-ukrainian/" />
<link rel="alternate" hreflang="x-default" href="/learn/en/uk/how-to-say-i-love-you-in-ukrainian/" />
```

### Rule: Use SAME ENGLISH SLUG Across Native Languages

When creating a content series (like "I Love You"), use the **same English-based slug** for all versions:

| Native | Target | Slug (ENGLISH - MUST MATCH) | Title (in native language) |
|--------|--------|----------------------------|---------------------------|
| EN | UK | `how-to-say-i-love-you-in-ukrainian` | How to Say I Love You in Ukrainian |
| ES | UK | `how-to-say-i-love-you-in-ukrainian` | Cómo Decir Te Quiero en Ucraniano |
| FR | UK | `how-to-say-i-love-you-in-ukrainian` | Comment Dire Je T'aime en Ukrainien |
| DE | UK | `how-to-say-i-love-you-in-ukrainian` | Ich Liebe Dich auf Ukrainisch |

**Why?** Google uses hreflang to:
1. Show the right version to users based on their language
2. Consolidate ranking signals across all versions
3. Prevent duplicate content penalties

### Standard Slug Patterns

| Content Type | English Slug Pattern | Example |
|--------------|---------------------|---------|
| I Love You | `how-to-say-i-love-you-in-{language}` | `how-to-say-i-love-you-in-polish` |
| Pet Names | `{language}-pet-names-terms-of-endearment` | `polish-pet-names-terms-of-endearment` |
| Date Night | `{language}-date-night-vocabulary` | `german-date-night-vocabulary` |
| Essential Phrases | `{language}-essential-phrases-for-couples` | `french-essential-phrases-for-couples` |
| Pronunciation | `{language}-pronunciation-guide` | `italian-pronunciation-guide` |
| Greetings | `{language}-greetings-farewells` | `spanish-greetings-farewells` |
| Grammar Basics | `{language}-grammar-basics` | `russian-grammar-basics` |
| Meeting Family | `meeting-your-{language}-partners-family` | `meeting-your-german-partners-family` |
| Is X Hard | `is-{language}-hard-to-learn` | `is-polish-hard-to-learn` |
| 100 Words | `100-common-{language}-words` | `100-common-spanish-words` |

### Content Series Template

For high-value topics, create **all 6 native language versions** with matching slugs:

```
Topic: "I Love You in [Target]"
Slug: how-to-say-i-love-you-in-[target]

Create 6 files:
├── en/[target]/how-to-say-i-love-you-in-[target].mdx  (English content)
├── es/[target]/how-to-say-i-love-you-in-[target].mdx  (Spanish content)
├── fr/[target]/how-to-say-i-love-you-in-[target].mdx  (French content)
├── de/[target]/how-to-say-i-love-you-in-[target].mdx  (German content)
├── it/[target]/how-to-say-i-love-you-in-[target].mdx  (Italian content)
└── pt/[target]/how-to-say-i-love-you-in-[target].mdx  (Portuguese content)
```

---

## Language-Specific Writing Guidelines

### When Native Language is NOT English

Articles for non-English native speakers should be written IN that native language:

**Spanish Native (es/):**
- Title: "Cómo Decir Te Quiero en Ucraniano"
- Description in Spanish
- All explanations in Spanish
- Translations from Ukrainian → Spanish

**French Native (fr/):**
- Title: "Comment Dire Je T'aime en Ukrainien"
- Description in French
- All explanations in French
- Translations from Ukrainian → French

**German Native (de/):**
- Title: "Wie Man Ich Liebe Dich auf Ukrainisch Sagt"
- Description in German
- All explanations in German
- Translations from Ukrainian → German

---

## Batch Creation Commands

### For Subagent Context

When creating multiple articles, provide this context:

```
Create [N] articles following /blog/ARTICLE_SOP.md specifications:

Target: {nativeLanguage} speakers learning {targetLanguage}
Directory: /blog/src/content/articles/{nativeLanguage}/{targetLanguage}/
Topics: [list of topics]

Requirements:
1. Follow SOP frontmatter format exactly
2. Write content in {nativeLanguage}
3. Include translations to {nativeLanguage}
4. Use appropriate components (VocabCard, CultureTip, etc.)
5. Generate image prompts for each article
```

---

## Troubleshooting

### Build Errors

**"Invalid frontmatter"**
- Check enum values match exactly (case-sensitive)
- Verify date format is `'YYYY-MM-DD'` with quotes
- Ensure all required fields present

**"Cannot find module '@components/...'"**
- Verify import paths are exactly as shown
- Check component names match (case-sensitive)

**"Page not found after deploy"**
- Verify directory structure is correct
- Check file extension is `.mdx`
- Rebuild: `npm run build`

### Common Mistakes

1. **Wrong directory** - Double-check native/target order
2. **Missing quotes on date** - Use `'2026-01-21'` not `2026-01-21`
3. **Invalid category** - Must be one of 6 exact values
4. **Image path wrong** - Must start with `/blog/`
5. **Writing in wrong language** - Match native language of directory

---

## Automatic SEO Features (No Action Needed)

The following are handled automatically by `ArticleLayout.astro` — no manual setup required:

### FAQs
- **Bespoke FAQ data** is stored in the `faq_items` JSONB column in Supabase (`blog_articles` table)
- If an article has `faq_items`, the layout automatically renders:
  - A visible FAQ accordion section at the bottom of the article
  - `FAQPage` JSON-LD structured data in the `<head>`
- **11,703 articles** currently have FAQs (98% coverage)
- FAQs are generated via `blog/scripts/generate-faqs-gemini.mjs` and uploaded via `blog/scripts/upload-faqs.mjs`
- Writers do NOT need to add FAQ content manually

### Author Byline (E-E-A-T)
- Every article automatically displays a "By **Love Languages Editorial Team**" byline
- The author JSON-LD uses a rich `Organization` schema with `knowsAbout` fields
- No frontmatter or component needed — it's part of the layout

### Other Automatic Schema
- `BlogPosting` — every article
- `BreadcrumbList` — every article
- `HowTo` — articles with "how-to" in slug
- `Speakable` — voice search optimization via CSS selectors (`.speakable-phrase`, `.speakable-vocab`)

---

## Related Documentation

- `SEO_STATUS.md` - Content strategy and GSC insights
- `AEO_GEO_STRATEGY.md` - Answer Engine / Generative Engine Optimization strategy
- `ML_MASTER_PLAN.md` - Project overview and architecture
- `TROUBLESHOOTING.md` - Common issues and solutions
