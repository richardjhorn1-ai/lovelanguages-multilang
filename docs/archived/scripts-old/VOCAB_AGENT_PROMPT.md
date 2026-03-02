# Vocabulary Bank Generation Task

You are generating vocabulary for **Love Languages**, a couples language learning app. This is NOT a generic dictionary — every example must feel romantic, personal, and relationship-focused.

## Your Assignment

**Native Language:** {NATIVE_LANG} ({NATIVE_CODE})
**Target Languages:** All 17 other languages (one at a time)
**Words per target:** 1000 (in batches of 100)

## Output Location

Save to: `vocab-bank-output/{NATIVE_CODE}/{TARGET_CODE}.json`

Each file is a JSON array of word entries.

## Word Entry Schema

```json
{
  "word": "kocham",
  "translation": "I love",
  "native_lang": "en",
  "target_lang": "pl",
  "word_type": "verb",
  "pronunciation": "KO-ham",
  "gender": null,
  "plural": null,
  "conjugations": { "present": { "first_singular": "kocham", "second_singular": "kochasz", ... } },
  "adjective_forms": null,
  "examples": [
    { "target": "Kocham sposób, w jaki się śmiejesz.", "native": "I love the way you laugh." },
    { "target": "Kocham cię bardziej z każdym dniem.", "native": "I love you more every day." },
    { "target": "Kocham nasze wspólne poranki.", "native": "I love our mornings together." },
    { "target": "Kocham, gdy trzymasz mnie za rękę.", "native": "I love when you hold my hand." },
    { "target": "Kocham to, kim jesteś.", "native": "I love who you are." }
  ],
  "pro_tip": "In Polish, 'kocham' is reserved for deep love. Use 'lubię' for casual liking.",
  "category": "romance",
  "frequency_rank": 42
}
```

## Categories (aim for ~150-200 words each)

1. **romance** — love, heart, kiss, hug, beautiful, forever, marry, dream
2. **daily_life** — morning, coffee, dinner, home, bed, sleep, cook, work
3. **travel** — trip, vacation, beach, hotel, airport, flight, adventure
4. **family** — mother, father, wedding, children, parents, baby
5. **emotions** — happy, sad, excited, nervous, proud, grateful, scared
6. **communication** — understand, explain, listen, speak, feel, believe

## Scenario Bank (inspiration, not limits)

Use these as inspiration for examples, but go beyond them too:

- Morning routines (coffee in bed, lazy Sundays, waking up together)
- Cooking together (making dinner, trying recipes, kitchen dancing)
- Travel moments (airport goodbyes, hotel arrivals, beach days, road trips)
- Meeting family (nervous introductions, holiday dinners, approval moments)
- Date nights (restaurants, movies, walks, stargazing)
- Cozy evenings (Netflix, reading together, rainy days, blanket forts)
- Celebrations (birthdays, anniversaries, milestones, surprises)
- Support moments (bad day comfort, encouragement, being there)
- Playful teasing (inside jokes, silly nicknames, gentle mocking)
- Future planning (moving in, dreams, "someday we'll...", proposals)
- Missing each other (long distance, work trips, counting days)
- Daily affection (random "I love you", hand holding, forehead kisses)
- Intimacy (not explicit, but tender — "the way you look at me")
- Growth together (learning from fights, becoming better, "we've come so far")

## CRITICAL RULES

1. **NO GENERIC EXAMPLES** — Never use "The cat is on the table" or "I go to school"
2. **VARIETY** — Each word's 5 examples must use DIFFERENT scenarios
3. **ROMANTIC CONTEXT** — Every example should feel like something a couple would say
4. **ACCURATE GRAMMAR** — Conjugations, gender, plurals must be correct for the language
5. **NATURAL LANGUAGE** — Examples should sound like real speech, not textbook phrases

## Process

1. Start with first target language
2. Generate 100 words, save to JSON file
3. Generate next 100 words, append to same file
4. Repeat until 1000 words for that target
5. Move to next target language
6. When ALL 17 targets complete, run: `clawdbot gateway wake --text "Done: {NATIVE_CODE} vocab complete (17 languages × 1000 words)" --mode now`

## Target Language Order

Process in this order: en, es, fr, it, pt, ro, de, nl, sv, no, da, pl, cs, ru, uk, el, hu, tr
(Skip your own native language)

## Quality Self-Check

Before saving each batch, verify:
- [ ] All 100 entries have exactly 5 examples
- [ ] No repeated scenarios within a word's examples
- [ ] Examples are romantic/couples-focused
- [ ] Grammar is correct for the target language
- [ ] JSON is valid

GO!
