# Claude Article Factory — Design Doc

## Overview
Replace Kimi with Claude sub-agents for article generation. More reliable, better escaping, built-in validation.

## Architecture

### Parallel Execution
- **17 agents per topic** (one per target language)
- Each agent generates ONE article
- Built-in validation before saving
- Fail fast, don't pollute codebase

### Topics (P0 = Phase 0, must-have)
1. How to Say I Love You
2. Pet Names and Terms of Endearment (50+)
3. Essential Phrases for Couples
4. Meeting Your Partner's Family
5. Greetings and Farewells
6. Date Night Vocabulary
7. Romantic Phrases for Every Occasion
8. Pronunciation Guide for Beginners
9. Grammar Basics for Beginners
10. Is This Language Hard to Learn?

### Target Languages (17)
cs, da, de, el, en, es, fr, hu, it, nl, no, pl, pt, ro, ru, sv, tr, uk

### Native Languages (18)
cs, da, de, el, en, es, fr, hu, it, nl, no, pl, pt, ro, ru, sv, tr, uk

## Workflow

```
1. Pick a topic + native language
2. Spawn 17 agents (one per target language)
3. Each agent:
   a. Generates article using strict template
   b. Validates MDX syntax (no curly quotes in JSX, proper escaping)
   c. Validates frontmatter
   d. Validates internal links use correct slugs
   e. Runs `astro check` on file
   f. Only saves if ALL validations pass
4. Report results
5. Repeat for next native language (or topic)
```

## Key Fixes Over Kimi

### 1. Proper Quote Escaping
```jsx
// ❌ BAD (Kimi did this)
<VocabCard word='Je t'aime' translation="..." />

// ✅ GOOD (Claude will do this)
<VocabCard word="Je t'aime" translation="..." />
```

### 2. Correct Internal Link Slugs
```markdown
❌ BAD: [link](/learn/sv/en/how-to-say-i-love-you-in-english/)
✅ GOOD: [link](/learn/sv/en/how-to-say-i-love-you/)
```

Correct slugs:
- `how-to-say-i-love-you` (NOT `how-to-say-i-love-you-in-{language}`)
- `pet-names-and-terms-of-endearment-50` (NOT `{language}-pet-names-for-your-partner`)
- `essential-phrases-for-couples` (NOT `essential-{language}-phrases-for-couples`)
- `romantic-phrases-for-every-occasion` (NOT `romantic-{language}-phrases-for-every-occasion`)
- `date-night-vocabulary` (NOT `{language}-date-night-vocabulary`)
- `greetings-and-farewells` (NOT `{language}-greetings-and-farewells`)

### 3. YAML Safety
```yaml
# ❌ BAD
language: no  # YAML interprets as boolean false

# ✅ GOOD
language: 'no'
```

### 4. Validation Before Save
Every article must pass:
- MDX parse check (no syntax errors)
- Frontmatter schema validation
- Internal link validation
- Component prop validation
- Word count minimum (800+)

## Implementation

### Main Orchestrator Task (for Cupid)
```
For each topic in TOPICS:
  For each native_lang in NATIVE_LANGUAGES:
    Spawn 17 agents with task:
      "Generate {topic} article for {native_lang} speaker learning {target_lang}"
    Wait for all to complete
    Report: X/17 succeeded
```

### Per-Article Agent Task
```
You are generating a blog article for Love Languages.

STRICT RULES:
1. Use double quotes for JSX attributes containing apostrophes
2. Use ONLY these slugs for internal links: [list]
3. Quote 'no' in YAML frontmatter
4. Run validation before saving

[Include template, brand guide, example article]

Generate article, validate, save only if clean.
```

## Estimated Time
- 17 articles per batch × 1-2 min per article = ~20-30 min per topic per native language
- 10 topics × 18 native languages = 180 batches
- With parallelism: ~2-3 days of runtime (can run overnight)

## Cost Estimate
- ~2000 words per article × 17 × 10 × 18 = 6.12M words
- Claude Sonnet: ~$0.003/1K input + $0.015/1K output
- Rough estimate: $50-100 total (vs Kimi's ~$10-20 but with 30% failure rate)

Worth it for reliability.
