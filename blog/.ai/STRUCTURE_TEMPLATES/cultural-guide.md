# Template: Cultural Guide
# e.g., "Polish Christmas Traditions for Couples" or "Spanish Valentine's Day Phrases"

## Frontmatter (REQUIRED)
```yaml
---
title: "[Language] [Cultural Topic]: [Emotional Hook for Couples]"
description: "Discover [cultural topic] in [country/culture]. Essential traditions, phrases, and tips for couples celebrating together."
category: culture
difficulty: beginner
readTime: [8-12]
date: '[YYYY-MM-DD]'
image: /blog/[slug].jpg
tags: ['culture', '[topic]', '[language]', 'traditions', 'couples']
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

### 1. Opening Hook (1-2 paragraphs)
- Set the scene emotionally
- Why this cultural knowledge matters for your relationship
- What makes this tradition special
- Link to related article

### 2. PhraseOfDay Component
- The most important phrase for this occasion
- Something they'll definitely use

### 3. Background & History
- Brief, interesting history (2-3 paragraphs max)
- Focus on romantic/family aspects
- CultureTip with surprising fact

### 4. Key Traditions
- 5-8 main traditions/customs
- Each with:
  - What it is
  - Why it matters
  - How couples participate
- VocabCard for related vocabulary

### 5. Essential Phrases (Table)
- 10-15 phrases specific to this occasion
- Phrase | Pronunciation | Translation | When to Use
- CultureTip about proper usage

### 6. What to Expect
- If visiting partner's family for this occasion
- Do's and Don'ts
- Gift-giving customs if relevant
- VocabCard for key phrase

### 7. Food & Drinks
- Traditional foods associated with the occasion
- Table of food names with translations
- What your partner might serve

### 8. Modern Celebrations
- How younger generations celebrate
- Social media phrases
- Contemporary twists

### 9. Phrases to Impress
- 5-7 phrases that show cultural knowledge
- Will impress partner's family
- CultureTip about when to use

### 10. Closing + CTA
- Warm, encouraging wrap-up
- Invitation to experience it with partner
- CTA component

## Quality Checklist
- [ ] Rich cultural context, not just vocabulary
- [ ] Romantic/couple angle throughout
- [ ] At least 15-20 relevant phrases
- [ ] 3-4 CultureTips
- [ ] 2-3 VocabCards
- [ ] 1 PhraseOfDay
- [ ] Food/tradition vocabulary
- [ ] At least 2 internal links
- [ ] CTA at end
