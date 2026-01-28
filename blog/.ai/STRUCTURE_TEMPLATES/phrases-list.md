# Template: Phrases List Article
# e.g., "50 Polish Terms of Endearment" or "100 Most Common Spanish Words"

## Frontmatter (REQUIRED)
```yaml
---
title: "[Number] [Language] [Topic] [Emotional Hook]"
description: "[Action verb] [number] [topic]. [Benefit for couples]. [Max 160 chars]"
category: vocabulary
difficulty: beginner|intermediate|advanced
readTime: [estimated minutes]
date: '[YYYY-MM-DD]'
image: /blog/[slug].jpg
tags: ['[topic]', '[subtopic]', 'vocabulary', 'romance', 'couples']
nativeLanguage: [en|es|fr|de|it|pt|pl|nl|ru|uk|tr|ro|cs|el|hu|sv|no|da]
language: [target language code]
---
```

## Imports (REQUIRED)
```mdx
import VocabCard from '@components/VocabCard.astro';
import ConjugationTable from '@components/ConjugationTable.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';
```

## Structure

### 1. Opening Hook (1 paragraph)
- Emotional connection to couples
- Why this topic matters for love/relationships
- Mention what reader will learn
- Link to one related article

### 2. PhraseOfDay Component
```mdx
<PhraseOfDay
  word="[phrase in target language]"
  translation="[English translation]"
  pronunciation="[phonetic guide]"
  context="[when to use with partner]"
/>
```

**IMPORTANT:** Always use `word=` and `translation=` props, NOT language-specific names like `swedish=` or `polish=`.

### 3. Section 1: Essential/Basics (items 1-10)
- Intro paragraph explaining this category
- Table with columns: [Language] | English | Pronunciation | When to Use
- VocabCard for 1-2 highlights
- CultureTip if relevant

### 4. Section 2: Category (items 11-20)
- Themed grouping (e.g., "Animal-Inspired", "Food-Related")
- Table format
- Brief context for the category

### 5. Section 3: Category (items 21-30)
- Continue themed groupings
- Tables with examples

### 6. Section 4+: Continue until complete
- Keep grouping thematically
- Each section: 8-12 items max

### 7. How to Use Section
- Practical tips for using these with partner
- Common mistakes to avoid
- CultureTip about cultural context

### 8. Closing + CTA
- Encouraging wrap-up (1 paragraph)
- CTA component:
```mdx
<CTA />
```

## Component Props Reference

### VocabCard (use for highlighted vocabulary)
```mdx
<VocabCard
  word="[word in target language]"
  translation="[English translation]"
  pronunciation="[phonetic guide]"
  example="[example sentence]"
/>
```

### CultureTip
```mdx
<CultureTip flag="[flag emoji for target language]" title="[Short Title]">
[Cultural insight or tip - 1-3 sentences]
</CultureTip>
```

**Flag emojis:** en=🇬🇧 es=🇪🇸 fr=🇫🇷 de=🇩🇪 it=🇮🇹 pt=🇵🇹 pl=🇵🇱 nl=🇳🇱 ru=🇷🇺 uk=🇺🇦 tr=🇹🇷 ro=🇷🇴 cs=🇨🇿 el=🇬🇷 hu=🇭🇺 sv=🇸🇪 no=🇳🇴 da=🇩🇰

**CRITICAL:** Always use `word=` and `translation=` props for VocabCard and PhraseOfDay. Do NOT use language-specific props like `swedish=`, `polish=`, `spanish=`, etc.

## Quality Checklist
- [ ] Every phrase has pronunciation guide
- [ ] At least 3 internal links to other articles
- [ ] 2-3 CultureTip components
- [ ] 1 PhraseOfDay at top
- [ ] 1-2 VocabCard highlights per major section
- [ ] Tables are properly formatted
- [ ] Emotional hook in opening
- [ ] CTA at end
- [ ] **All VocabCard/PhraseOfDay use `word=` and `translation=` props**
