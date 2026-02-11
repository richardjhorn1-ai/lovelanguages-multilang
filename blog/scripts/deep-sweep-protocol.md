# Deep Sweep Review Protocol

You are reviewing a batch of blog articles for a language-learning website. Each article teaches vocabulary and phrases in a **target language** to speakers of a **native language**.

Your job: review each article for quality issues, fix what you can, and flag what you can't.

## Article Structure

Articles use MDX with these components:

```
<VocabCard word="target word" translation="native translation" pronunciation="phonetics" example="target language sentence" />
<PhraseOfDay word="target phrase" translation="native translation" pronunciation="phonetics" context="usage note" />
<ConjugationTable verb="verb" meaning="translation" conjugations={[{person: "I", word: "conjugated", translation: "english"}]} />
<CultureTip title="Title">Markdown content</CultureTip>
```

**Key rule:** `word` = target language, `translation` = native language. Always.

## Quality Checklist (priority order)

### CRITICAL — content is wrong/misleading

1. **Apology template bug** — VocabCards contain apology words (sorry, forgive, excuse) but the article is about a different topic (food, travel, etc.). Replace VocabCards with vocabulary matching the article's actual topic.

2. **Wrong-language content** — `word` prop in native language instead of target language, or `translation` prop in target language instead of native. Swap them.

3. **Pronunciation mismatches** — Pronunciation clearly belongs to a different word than the one listed. Provide correct pronunciation.

4. **Factually wrong translations** — `word` and `translation` don't match in meaning. Fix the incorrect one.

5. **Title-content mismatch** — Title promises topic X but VocabCards teach topic Y. Replace vocabulary to match the title.

### HIGH — significant quality issues

6. **Missing diacriticals** — Words in accented languages (French, Spanish, Czech, Polish, etc.) written in plain ASCII. Add correct accents: `cafe` → `café`, `nino` → `niño`, `pritel` → `přítel`.

7. **Copied pronunciations** — Same phonetic string reused for 3+ different words. Write unique pronunciation for each word.

8. **Empty/truncated props** — VocabCard with empty `word`, empty `translation`, or suspiciously short values (1-2 chars). Fill in correct values.

9. **English prose in non-English native articles** — Article prose/headers in English when native language is German, Czech, etc. Rewrite prose in the native language.

10. **Examples in wrong language** — `example` prop should be a natural sentence in the **target language**. If it's in the native language or English, rewrite it.

11. **Native-only sections** — Entire sections with zero target-language vocabulary. Add relevant vocabulary or inline target-language words.

### MEDIUM — should be better

12. **Pronunciation = word** — Pronunciation field is just the word copied verbatim. Replace with actual phonetic guide.

13. **Thin content** — Article has very little prose and few components. Mark as `needs_human` if too thin to fix.

14. **Boilerplate filler** — Template text like "Practice Makes Perfect", "Don't be afraid to make mistakes", "is a beautiful way to express". Remove or replace with topic-specific guidance.

15. **Truncated pronunciations** — Pronunciation cut off mid-syllable. Complete the pronunciation.

16. **Examples that just repeat the word** — `example` is identical to `word`. Write a natural sentence using the word in context. Couple/relationship themed where possible.

### LOW — cosmetic

17. **Import statements in content** — Lines like `import VocabCard from '@components/...'`. Remove them.

18. **Legacy props** — `polish="X"` or `english="X"` instead of `word`/`translation`. Convert to standard props.

19. **Double-bracket pronunciations** — Pronunciation starts with `[` which renders as `[[ ]]`. Remove leading bracket.

20. **IPA symbol remnants** — Characters like `ʒ`, `ə`, `ɔ`, `ɹ` in pronunciation. Convert to learner-friendly phonetics.

## Pronunciation Style Guide

Write pronunciations that a native-language speaker can read aloud:

| Native Language | Script | Example |
|----------------|--------|---------|
| ru, uk | Cyrillic | `крю-А-сан` (French croissant for Russian speaker) |
| el | Greek | `κρουα-ΣΑΝ` (French croissant for Greek speaker) |
| All others | Latin + stress CAPS | `krwah-SAHN` |

Rules:
- Break into syllables with hyphens
- Mark stressed syllable with CAPS (Latin) or stress markers (Cyrillic/Greek)
- No IPA symbols ever
- Make it intuitive: write how it sounds, not how it's spelled

## Fix Rules

1. `word` = **target language** word/phrase
2. `translation` = **native language** translation
3. `pronunciation` = learner-friendly phonetics (see style guide above)
4. `example` = natural sentence in **target language**, couple/relationship themed where possible
5. Prose = written in **native language** (the article is FOR native speakers)
6. Preserve article structure — don't remove sections or reorganize
7. Only fix real issues — don't "improve" correct content
8. Keep the same number of VocabCards unless fixing apology template bug
9. When replacing VocabCards (apology template bug), match the article's title topic and difficulty level
10. For apology template bug: write 6-8 new VocabCards on the correct topic with proper word, translation, pronunciation, and example

## Output Format

Write your output as a JSON file with this exact structure:

```json
{
  "batchId": "batch-001",
  "pair": { "native": "en", "target": "es" },
  "reviewedAt": "2026-02-10T12:00:00.000Z",
  "results": [
    {
      "id": "article-uuid",
      "slug": "article-slug",
      "verdict": "clean",
      "notes": "All components correct, vocabulary matches topic."
    },
    {
      "id": "article-uuid",
      "slug": "article-slug",
      "verdict": "fixed",
      "issuesFound": [
        { "type": "missingDiacriticals", "severity": "high", "description": "3 VocabCard words missing French accents" },
        { "type": "wrongLanguageExample", "severity": "high", "description": "2 examples in English instead of French" }
      ],
      "fixedContent": "... complete corrected MDX content ..."
    },
    {
      "id": "article-uuid",
      "slug": "article-slug",
      "verdict": "needs_human",
      "issuesFound": [
        { "type": "titleContentMismatch", "severity": "critical", "description": "Article about food but all vocabulary is about weather" }
      ],
      "notes": "Full rewrite needed — vocabulary completely unrelated to title."
    }
  ],
  "summary": {
    "total": 6,
    "clean": 4,
    "fixed": 1,
    "needsHuman": 1
  }
}
```

## Verdicts

- **`clean`** — No issues found. Article is good as-is. Include brief `notes`.
- **`fixed`** — Issues found and corrected. `fixedContent` must contain the **complete** corrected MDX (not just the changed parts). Include `issuesFound` array.
- **`needs_human`** — Too broken for automated fix (article about completely wrong topic, mostly empty, etc.). Include `issuesFound` and `notes` explaining why.

## Critical Reminders

- `fixedContent` must be the **COMPLETE** article content, not a diff or partial update
- Do not invent new sections or significantly restructure articles
- Do not add CTA components, import statements, or frontmatter
- When fixing apology template bugs, the new vocabulary MUST match the article title
- Every VocabCard must have `word` and `translation` at minimum
- Pronunciations must never contain IPA symbols
- Examples must be in the target language
- Prose must be in the native language
- Double-check your fixes — introducing new errors is worse than leaving existing ones
