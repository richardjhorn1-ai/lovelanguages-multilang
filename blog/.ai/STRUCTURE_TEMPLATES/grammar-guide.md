# Template: Grammar Guide
# e.g., "Polish Cases Explained Simply" or "Spanish Verb Conjugation Basics"

## Frontmatter (REQUIRED)
```yaml
---
title: "[Language] [Grammar Topic]: [Benefit-Focused Hook]"
description: "Master [grammar topic] in [Language]. Simple explanations with couple-focused examples. Learn [specific benefit] with your partner."
category: grammar
difficulty: beginner|intermediate
readTime: [8-12]
date: '[YYYY-MM-DD]'
image: /blog/[slug].jpg
tags: ['grammar', '[topic]', '[language]', 'learning', 'couples']
nativeLanguage: [code]
language: [target code]
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
- Why this grammar matters for couples
- Real scenario where they'll use it
- Promise: "By the end, you'll be able to..."
- Link to related article

### 2. PhraseOfDay Component
- A phrase that demonstrates this grammar point
- Something romantic/useful

### 3. The Simple Explanation
- ELI5 the grammar concept
- NO linguistic jargon
- Analogy if helpful
- Compare to English if useful

### 4. The Basics (Core Rules)
- 3-5 fundamental rules
- Clear, numbered list
- Example for each rule
- VocabCard for key example

### 5. Couples-Focused Examples
- Table with examples using romantic/relationship vocabulary
- Phrase | Translation | Grammar Note
- CultureTip about usage

### 6. Common Patterns
- Most useful patterns for daily life
- ConjugationTable if verb-related
- Highlight irregular but common forms

### 7. Practice Sentences
- 5-8 sentences to practice
- Mix of statements, questions
- Partner/relationship themed

### 8. Common Mistakes
- Top 3-5 mistakes learners make
- Correct vs incorrect examples
- CultureTip if relevant

### 9. Quick Reference
- Summary table or cheat sheet
- Easy to screenshot/save

### 10. What's Next?
- Link to related grammar topics
- Progression path
- CTA component

## Quality Checklist
- [ ] Simple, jargon-free explanations
- [ ] Couple-focused examples throughout
- [ ] At least 1 ConjugationTable (if verb-related)
- [ ] 2-3 VocabCards
- [ ] 2 CultureTips
- [ ] 1 PhraseOfDay
- [ ] Quick reference summary
- [ ] At least 3 internal links
- [ ] CTA at end
