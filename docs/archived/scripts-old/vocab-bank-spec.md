# Vocabulary Bank Generation Spec

## Overview
Generate pre-computed vocabulary for Love Languages couples app.
NOT a generic dictionary — romantic, relationship-focused examples.

## Structure
- One agent per NATIVE language
- Each generates 1000 common words for each TARGET language (17 targets)
- Output: JSON files in `/vocab-bank-output/{native_lang}/`

## Categories (aim for ~200 words each)
1. **romance** — love, beautiful, heart, kiss, hug, miss, forever
2. **daily_life** — morning, coffee, dinner, bed, home, work
3. **travel** — airport, hotel, beach, adventure, passport, flight
4. **family** — mother, father, wedding, children, parents, family
5. **emotions** — happy, sad, excited, nervous, proud, grateful

## Word Entry Format
```json
{
  "word": "kocham",
  "translation": "I love",
  "native_lang": "en",
  "target_lang": "pl",
  "word_type": "verb",
  "pronunciation": "KO-ham",
  "gender": null,
  "conjugations": { "present": { "first_singular": "kocham", ... } },
  "examples": [
    { "target": "Kocham sposób, w jaki się śmiejesz.", "native": "I love the way you laugh." },
    { "target": "Kocham cię bardziej z każdym dniem.", "native": "I love you more every day." },
    { "target": "Kocham nasze wspólne poranki.", "native": "I love our mornings together." },
    { "target": "Kocham, gdy trzymasz mnie za rękę.", "native": "I love when you hold my hand." },
    { "target": "Kocham to, kim jesteś.", "native": "I love who you are." }
  ],
  "pro_tip": "In Polish, 'kocham' is reserved for deep love. Use 'lubię' for casual liking.",
  "category": "romance",
  "frequency_rank": 1
}
```

## Example Sentence Rules
- **ROMANTIC/COUPLES CONTEXT ONLY**
- No "the cat is on the table" generic stuff
- Include: partner activities, emotions, relationship moments
- Mix of: sweet, playful, everyday romance

## Generation Prompt Template
Use Sonnet (claude-sonnet-4-20250514) for cost efficiency.

Generate in batches of 50 words to avoid timeouts.

## Output Files
`/vocab-bank-output/{native_lang}/{target_lang}.json`
- Array of word entries
- One file per target language
- Append mode (can resume)

## Languages
18 total: en, es, fr, it, pt, ro, de, nl, sv, no, da, pl, cs, ru, uk, el, hu, tr
