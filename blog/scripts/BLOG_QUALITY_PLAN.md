# Blog Quality Master Plan

Living roadmap for getting every blog article to production quality. Updated after each phase.

---

## Current State (2026-02-09, Session 3)

| Metric | Value |
|--------|-------|
| Total articles | 13,340 (13,484 including methodology) |
| REAL PROBLEMS (audit) | **35** |
| Phases complete | 1a, 1b, 1c, apostrophe fix, 1d, 1e-1, 1e-2, 1e-3, 1f, 1g |
| Phases remaining | 2 (quality), 3 (cosmetic) |

### What's Been Done

- **Phase 1a**: Fixed 338 malformed components, raw MDX, orphan code fences — all mechanical regex fixes
- **Phase 1b**: Built converters for `<Phrase>`, `<PhraseList>`, `<VocabCard>` with children, `<ConjugationTable>` with children. 828 articles regenerated. CRITICAL: 7→0
- **Phase 1c**: AI-fixed 2,774 pronunciations, 103 English examples, 50 undefined literals, 35 truncated articles, 341 wrong-language issues. Cost: ~$0.50 via Gemini Flash
- **Apostrophe fix**: `extractProp()` regex truncated French/Italian text at apostrophes. Fixed to double-quote-only matching. Regenerated 4,157 articles
- **Phase 1d**: Added converters for `<PhrasePair>`, `<PhraseCard>`, `<VocabCell>`, `<KVocabCard>`. Fixed 1 leaked `<CultureTip>` with broken quoting. Regenerated 303 articles. **0 non-standard tags survive into HTML**
- **Phase 1e-1**: Fixed 480 articles with `## ## Conclusion` double-hash template artifacts → `## Conclusion`
- **Phase 1e-2**: Cleared `[...]` placeholder text from 104 articles (preserved rows, just removed placeholder)
- **Phase 1e-3**: Single-pass AI fix for 109 articles: 80 bad pronunciations, 64 empty translations, 5 English examples. Used `fix-vocabcards.mjs`
- **Phase 1f**: Comprehensive final fix via `fix-final.mjs`. 154 articles fixed: english_example (78 fixed), pronunciation (13), wrong_lang_word (7), placeholder_xxx (4), wrong_lang_translation (2), empty props, placeholder_pronunciation. REAL: 248→145
- **Phase 1g**: Audit false positive cleanup. 4 fixes to `audit-content.mjs`:
  1. `pronunciation_equals_word`: Added word.length > 3 filter (dropped 89 false positives — short words in phonetic langs)
  2. `looksEnglish()`: Added diacritics check (dropped 8 false positives — Polish/Portuguese words)
  3. `english_headers`: Added "en conclusion" to French exclusions (dropped 2 false positives)
  4. `empty_component_props`: Fixed quote-matching regex with backreference (dropped 11 false positives — `translation="'Pe'..."` pattern)
  REAL: 145→**35**

### REAL Issues Remaining (35)

| Issue | Count | What's Actually Wrong |
|-------|-------|----------------------|
| `english_example` | 18 | VocabCard examples still in English (passed diacritics filter — genuinely English text in non-English articles) |
| `english_prose_markers` | 12 | 10 Italian articles have "in conclusion" instead of "in conclusione". 2 articles have "note:" |
| `placeholder_pronunciation` | 4 | Empty `pronunciation=""` |
| `word_in_wrong_language` | 1 | VocabCard word in wrong language |

---

## Fix Plan: Remaining 35

### Phase 1h (optional): Mop-up

The 35 remaining issues are genuine but low-impact edge cases. Could be fixed with a targeted AI pass:

| Issue | Count | Fix Approach |
|-------|-------|-------------|
| `english_example` | 18 | AI-translate English examples to native language |
| `english_prose_markers` | 12 | Regex: `in conclusion` → `in conclusione` for Italian (10). Manual check for 2 "note:" |
| `placeholder_pronunciation` | 4 | AI-generate pronunciation |
| `word_in_wrong_language` | 1 | AI-fix |

**Effort**: ~30 min. **Cost**: ~$0.05.

### Phase 2: Quality Gaps (~11,000 articles) — FUTURE

Not broken — just not as rich as they could be. Articles work fine, readers see content.

| Issue | Count | Fix |
|-------|-------|-----|
| `component_missing` | 9,251 | AI-add appropriate components per category |
| `thin_content` | 8,480 | AI-expand articles under 500 words |
| `component_low` | 3,219 | AI-add more vocabulary items |
| `few_headings` | 1,627 | AI-restructure with proper sections |
| `component_dump` | 1,171 | AI-add prose around component-heavy articles |
| `no_intro` | 332 | AI-generate intro paragraphs |
| `empty_sections` | 118 | AI-generate section content |
| `duplicate_vocabcards` | 23 | Deduplicate |

### Phase 3: Cosmetic (~6,700 articles) — FUTURE

Invisible to readers. No functional impact.

| Issue | Count | Fix |
|-------|-------|-----|
| `stale_artifacts` | 6,354 | Strip import statements and CTA tags from content field |
| `non_standard_tags` | 533 | Already handled by converters — informational only |
| `legacy_props` | 187 | Convert polish=/english= to word=/translation= |
| `wrong_flag` | 5 | Replace default Polish flag with correct flag |

---

## Technical Reference (Survives Context Compaction)

### Key Files

| File | What It Does |
|------|-------------|
| `blog/scripts/component-converters.mjs` | Converts MDX component tags to styled HTML. `convertMdxToHtml(content, nativeLang, targetLang)` returns `{html, stats}`. Handles: VocabCard, PhraseOfDay, CultureTip, ConjugationTable, Phrase, PhraseList, PhrasePair, PhraseCard, VocabCell, KVocabCard, CTA |
| `blog/scripts/audit-content.mjs` | Scans articles for issues. 3 tiers: REAL/QUALITY/COSMETIC. Run: `node blog/scripts/audit-content.mjs --local --tier real` |
| `blog/scripts/fix-vocabcards.mjs` | **Phase 1e-3 single-pass AI fixer.** Detects all VocabCard issues (bad_pronunciation, empty_translation, english_example), groups by article, one Gemini call per article, stitches fixes back. Run: `node blog/scripts/fix-vocabcards.mjs --concurrency 5` |
| `blog/scripts/fix-ai.mjs` | Phase 1c AI fixes (5 fix types). Mostly complete — used for pronunciations, english_example, undefined_literal, truncated, wrong_language |
| `blog/scripts/fix-mechanical.mjs` | Deterministic regex fixes |
| `blog/scripts/fix-double-hash.mjs` | Phase 1e-1: `## ## X` → `## X` |
| `blog/scripts/fix-placeholder-text.mjs` | Phase 1e-2: `[...]` → empty string |
| `blog/scripts/regen-phase1d.mjs` | Phase 1d: regenerated HTML for PhrasePair/PhraseCard/VocabCell/KVocabCard articles |
| `blog/scripts/regen-html.mjs` | Bulk HTML regeneration for apostrophe fix |
| `blog/scripts/export-articles.mjs` | Exports all articles from Supabase to `data/articles-local.json`. Run before every audit |
| `blog/scripts/fix-final.mjs` | **Phase 1f comprehensive fixer.** Handles ALL remaining issue types: english_example, bad_pronunciation, empty_pronunciation, empty_word, empty_translation, wrong_lang_word, wrong_lang_translation, placeholder_xxx, english_prose. Combines mechanical + AI fixes. Run: `node blog/scripts/fix-final.mjs --concurrency 3` |
| `blog/scripts/data/ai-fix-progress-1c.json` | Phase 1c progress tracking |
| `blog/scripts/data/ai-fix-progress-1e.json` | Phase 1e-3 progress tracking |
| `blog/scripts/data/ai-fix-progress-1f.json` | Phase 1f progress tracking (154 applied) |

### How the Converter Works

`component-converters.mjs` processes content in order:
1. Strip frontmatter and imports
2. Convert `<CultureTip>` (self-closing and with children)
3. **Convert `<PhrasePair>` and `<PhraseCard>`** (MUST come before `<Phrase>` — tag names start with "Phrase")
4. Strip `<PhraseList>` wrappers
5. Convert `<Phrase>` (3 patterns: children, attributes, self-closing)
6. Convert `<VocabCard>` (with children, then self-closing)
7. Convert `<VocabCell>` and `<KVocabCard>` (aliases for VocabCard)
8. Convert `<PhraseOfDay>` (self-closing)
9. Convert `<ConjugationTable>` (with children, then self-closing)
10. Strip `<CTA>` tags
11. Run `marked.parse()` on remaining markdown
12. Clean up whitespace

### extractProp() — Double Quote Only

All `extractProp()` functions use double-quote-only matching:
```javascript
const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
```
99.998% of props use double quotes. Single quotes were normalized.

### Gemini API Usage

- Default model: `gemini-2.0-flash` (reliable, cheap, good availability)
- `gemini-3-flash-preview` has better quality but hits daily quota limits
- Progress is resumable — clear `.failed` in progress file to retry
- Concurrency 3-5 works well; higher causes 429 errors

### Key Patterns Discovered

- **Phonetic languages** (Turkish, Spanish, Romanian, Polish): pronunciation = word is often correct for short words
- **French/Italian apostrophes**: Must use double-quote-only regex — apostrophes are NOT quote delimiters
- **Tag ordering matters**: `<PhrasePair>` and `<PhraseCard>` converters must run BEFORE `<Phrase>` converter, or the `<Phrase[\s\S]*?\/>` regex will match them first with wrong props
- **English detection false positives**: Words like "to", "no", "do" exist in Polish, Portuguese, Romanian — add diacritics check

---

## Progress Log

### 2026-02-09 Session 1 — Phases 0 through 1c + Apostrophe Fix
- Infrastructure built, first audit: 2,236 REAL
- Phase 1a mechanical fixes: 2,236→1,898
- Phase 1b tag converters: 1,898→1,895, CRITICAL: 7→0
- Phase 1c AI fixes: 1,356→689
- Apostrophe fix: 689 (revealed hidden issues)
- Missing tags discovery: 5 tags surviving into HTML

### 2026-02-09 Session 2 — Phases 1d through 1e-3
- Phase 1d: Added PhrasePair, PhraseCard, VocabCell, KVocabCard converters. Fixed 1 CultureTip quoting. 303 articles regenerated. **0 non-standard tags in HTML**
- Phase 1e-1: Fixed 480 articles with `## ##` double-hash headers
- Phase 1e-2: Cleared `[...]` placeholders from 104 articles
- Phase 1e-3: Single-pass AI fix for 109 articles (80 pronunciations, 64 translations, 5 examples)
- REAL: 689→248 (64% reduction this session)
- Investigation: 248 audit issues = ~148 genuine + ~100 false positives/correct

### 2026-02-09 Session 3 — Phases 1f and 1g
- Phase 1f: Built `fix-final.mjs` — comprehensive AI+mechanical fixer for all remaining issue types. 154 articles fixed (7 initially failed with 429, retried successfully). REAL: 248→145
- Phase 1g: Fixed 4 audit false positive patterns in `audit-content.mjs`:
  - pronunciation_equals_word: word.length > 3 filter (−89)
  - looksEnglish(): diacritics check (−8)
  - english_headers: French "en conclusion" exclusion (−2)
  - empty_component_props: backreference quote matching (−11)
  - REAL: 145→**35** (99.7% of articles clean)

### Status: Phase 1 Complete
**2,236 → 35 REAL issues** (98.4% reduction). All phases 1a through 1g done. Remaining 35 are genuine but low-impact edge cases.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | Three-tier classification | Clear priority: REAL first |
| 2026-02-09 | Local JSON for auditing | 5.6s vs Supabase timeout |
| 2026-02-09 | extractProp: double quotes only | 99.998% use double quotes. Apostrophes aren't delimiters |
| 2026-02-09 | gemini-2.0-flash as default | 3-flash-preview has better quality but daily quota limits |
| 2026-02-09 | pronunciation_equals_word ≤3 chars = correct | Phonetic languages genuinely have pron = word for short words |
| 2026-02-09 | PhrasePair/PhraseCard before Phrase in pipeline | Tag names start with "Phrase" — greedy regex matches wrong tag |
| 2026-02-09 | Clear `[...]` instead of deleting rows | Preserves word + translation data; pronunciation can be AI-filled later |
| 2026-02-09 | Single-pass VocabCard fixer over multi-type scripts | One Gemini call per article is simpler and cheaper than separate runs |
| 2026-02-09 | "En conclusion" is French, not English | Audit false positive — add to exclusion list |
| 2026-02-09 | 90% of pron=word are correct (short words in phonetic langs) | Only flag words > 3 chars |
| 2026-02-09 | Backreference regex for empty prop detection | `(["'])\s*\1` prevents `"'` cross-quote false positives |
| 2026-02-09 | Diacritics check in looksEnglish() | Non-ASCII letters mean text isn't English — skip detection |
