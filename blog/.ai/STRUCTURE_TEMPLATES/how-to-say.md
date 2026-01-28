# Template: How to Say [X] in [Language]
# e.g., "How to Say I Love You in Polish" or "How to Say Beautiful in Spanish"

## Frontmatter (REQUIRED)
```yaml
---
title: "How to Say [X] in [Language]: [Number] Ways for Couples"
description: "Learn [number] ways to say [X] in [Language]. From casual [phrase] to romantic [phrase] - perfect for couples. With pronunciation guides."
category: vocabulary
difficulty: beginner
readTime: [5-8]
date: '[YYYY-MM-DD]'
image: /blog/how-to-say-[x]-in-[language].jpg
tags: ['[x]', '[language]', 'phrases', 'romance', 'couples', 'pronunciation']
nativeLanguage: [code]
language: [target code]
---
```

## Imports (REQUIRED)
```mdx
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';
```

## Structure

### 1. Opening Hook (1 paragraph)
- Why this particular word/phrase matters for couples
- Emotional connection
- Promise of what they'll learn
- Link to related article

### 2. PhraseOfDay Component
```mdx
<PhraseOfDay
  [language]="[most romantic version]"
  english="[translation]"
  pronunciation="[phonetic]"
  context="[when to use with partner]"
/>
```

### 3. The Quick Answer
- Most common/useful way first
- Pronunciation guide
- VocabCard for this main phrase

### 4. Formal vs Informal
- Table comparing formal and informal versions
- When to use each
- CultureTip about formality in this culture

### 5. Romantic Variations (5-10)
- Different ways to say it romantically
- Table with phrase | pronunciation | context/feeling
- VocabCards for 2-3 highlights

### 6. Regional Variations (if applicable)
- Different regions/dialects
- Brief explanations

### 7. Common Mistakes
- What NOT to say
- Embarrassing mix-ups to avoid
- CultureTip if relevant

### 8. Using It in Sentences
- 3-5 example sentences
- Show the phrase in context
- Partner-relevant scenarios

### 9. Related Phrases
- 5-10 related expressions
- Brief table
- Links to other articles

### 10. Closing + CTA
- Encouraging wrap-up
- CTA component

## Quality Checklist
- [ ] Main phrase with clear pronunciation
- [ ] At least 8-12 variations total
- [ ] 2-3 VocabCards
- [ ] 2 CultureTips
- [ ] 1 PhraseOfDay
- [ ] Example sentences
- [ ] At least 2 internal links
- [ ] Emotional hook in opening
- [ ] CTA at end
