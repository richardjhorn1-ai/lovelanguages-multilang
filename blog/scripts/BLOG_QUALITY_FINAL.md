# Blog Content Quality — Final Plan

Source of truth for blog article quality work. Replaces `BLOG_QUALITY_PLAN.md`.

---

## Current State (2026-02-10)

| Metric | Value |
|--------|-------|
| Total articles | 13,484 |
| Language pairs | 324 (18 languages, any as native or target) |
| Avg articles per pair | 41.6 |
| Phase 1 (mechanical fixes) | Complete — 2,236 REAL issues → 35 |
| Phase 2 pilot (deep-sweep) | Complete — es→en, 59 articles, 48 fixed, 2 needs-human |

### What's Been Done

**Phase 1 (Sessions 1-3, 2026-02-09):** Mechanical and AI fixes for broken content.
- 1a: Regex fixes for malformed components, raw MDX, orphan code fences
- 1b: Tag converters (Phrase, PhraseList, VocabCard, ConjugationTable)
- 1c: AI-fixed 2,774 pronunciations, 103 examples, 50 undefined literals, 341 wrong-language
- 1d: Added PhrasePair, PhraseCard, VocabCell, KVocabCard converters
- 1e: Double-hash headers, placeholder text, single-pass AI VocabCard fixes
- 1f: Comprehensive AI+mechanical fixer for all remaining issues
- 1g: Audit false positive cleanup
- **Result: 2,236 → 35 REAL issues (98.4% reduction)**

**Phase 2 Pilot (Session 4, 2026-02-10):** Deep-sweep of es→en pair.
- Pulled 59 articles, ran mechanical detectors, split into 8 batches
- 8 parallel AI agents reviewed and fixed articles
- 48 articles fixed and pushed to Supabase, 9 already clean, 2 needs-human
- **Key finding:** 41% of detected issues were trivially regex-fixable (imports, brackets, CTAs). 59% genuinely needed AI judgment.

---

## Two-Phase Approach Going Forward

### Phase A: Regex Pass (All 13,484 articles)

**Goal:** Eliminate all mechanical/deterministic issues across the entire corpus in a single script run. Zero AI cost. Zero risk of content regression.

**What it fixes:**

| Fix | Detection | Replacement | Est. Articles Affected |
|-----|-----------|-------------|----------------------|
| Import statements | `^import .+ from ['"]@components/.+['"];?\s*$` | Remove line | ~6,354 |
| Double-bracket pronunciations | `pronunciation="[` or `pronunciation='[` | Strip leading `[` and trailing `]` from value | ~4,000+ |
| CTA components | `<CTA[\s\S]*?\/>` | Remove tag | ~6,354 |
| IPA symbol remnants | Known chars: `ʒ ə ɔ ɹ ŋ ɪ ʊ ʌ ɛ ð θ ʃ æ ɑ ɜ ɒ ˈ ˌ` | Map to learner-friendly equivalents | ~200 |
| Legacy props | `polish="X"` / `english="X"` | Convert to `word="X"` / `translation="X"` | ~187 |
| Double-hash headers | `## ## Title` | `## Title` | Already done (480), but re-check |
| `[...]` placeholders | Pronunciation or translation = `[...]` | Clear to empty string | Already done (104), but re-check |

**After regex pass:** Regenerate `content_html` for every modified article using `convertMdxToHtml()`.

**Script:** `blog/scripts/fix-regex-global.mjs` (to be built)

**Validation:** Compare before/after word counts, component counts, and prop completeness. Flag any article where content shrinks by >5% (indicates over-aggressive removal).

---

### Phase B: Gemini Detect → Claude Fix

**Goal:** Use Gemini Flash for cheap bulk detection of semantic issues, then use Claude to fix only confirmed broken articles.

#### Step 1: Gemini Flash Audit (detect-with-gemini.mjs)

Sends compact article props (not full content) to Gemini Flash in batches of 15-20. Checks 9 issue types that require language understanding:

| Issue Type | Severity | What It Catches |
|-----------|----------|----------------|
| `WRONG_LANG_WORD` | HIGH | `word` prop in wrong language (e.g., Italian in Turkish article) |
| `WRONG_LANG_TRANSLATION` | HIGH | `translation` in wrong language |
| `IDENTICAL_PROPS` | MEDIUM | word and translation are the same string |
| `FAKE_PRONUNCIATION` | MEDIUM | Description instead of phonetics, or word copied as pronunciation |
| `COPIED_PRONUNCIATION` | HIGH | Same pronunciation reused for 3+ different words |
| `WRONG_LANG_EXAMPLE` | HIGH | Example sentence not in target language |
| `TITLE_MISMATCH` | CRITICAL | Vocabulary doesn't match article topic |
| `EMPTY_PROPS` | HIGH | Missing word or translation |
| `PRONUNCIATION_MISMATCH` | HIGH | Pronunciation belongs to a different word |

**Process:**
```bash
node blog/scripts/detect-with-gemini.mjs --dry-run         # Preview: extraction stats only
node blog/scripts/detect-with-gemini.mjs --pair it-tr       # Single pair test
node blog/scripts/detect-with-gemini.mjs                    # Full run (~700-900 Gemini calls)
node blog/scripts/detect-with-gemini.mjs --resume           # Resume interrupted run
```

**Output:** `data/gemini-audit-manifest.json` — complete issues manifest with summary stats.

**Cost:** ~$1-3 for all 13,000+ articles (Gemini Flash is very cheap).

#### Step 2: Gemini Fix (fix-with-gemini.mjs)

Using the manifest, sends broken VocabCard/PhraseOfDay props to Gemini Flash for correction. Two modes:

- **Normal fixes** (5 articles/batch): Sends only broken props + issue descriptions. Gemini returns corrected values per card index.
- **TITLE_MISMATCH** (3 articles/batch): Sends all cards + title. Gemini generates entirely new vocabulary matching the topic.

**Process:**
```bash
node blog/scripts/fix-with-gemini.mjs --dry-run                     # Preview: batch counts + cost estimate
node blog/scripts/fix-with-gemini.mjs --pair de-it --limit 5        # Test single pair
node blog/scripts/fix-with-gemini.mjs --issue-type WRONG_LANG_EXAMPLE # Fix most common type
node blog/scripts/fix-with-gemini.mjs --severity critical            # Fix TITLE_MISMATCH articles
node blog/scripts/fix-with-gemini.mjs --concurrency 50 --resume      # Full run, resumable
```

**Fix stitching:** Extracts all component tags with positions, replaces specific props by card index (reverse order for position safety), regenerates HTML, validates, updates Supabase.

**Validation:** Word count >= 50% original, all VocabCard word/translation >= 2 chars, no broken tags.

**Output:** `data/gemini-fix-progress.json` — tracks applied/failed article IDs (resumable).

**Cost:** ~$6-13 for all 6,585 articles (1,620 Gemini calls).

#### Previous Approach (retired)

The original deep-sweep approach (`deep-sweep-prep.mjs` + parallel Claude agents) worked but was expensive (~$50-100) because Claude did both detection AND fixing. The new approach splits these: Gemini detects ($1-3), Gemini fixes ($6-13).

---

## Scripts Inventory

### Active Scripts (use these)

| Script | Purpose | Phase |
|--------|---------|-------|
| `fix-regex-global.mjs` | Global regex pass across all articles | A |
| `detect-with-gemini.mjs` | Gemini Flash semantic audit of all articles | B (detect) |
| `fix-with-gemini.mjs` | **NEW** — Gemini Flash fix pipeline using audit manifest | B (fix) |
| `deep-sweep-apply.mjs` | Validate and apply AI fixes to Supabase (retired by fix-with-gemini) | B (retired) |
| `deep-sweep-protocol.md` | Instructions for AI review agents | B (fix) |
| `deep-sweep-prep.mjs` | Pull articles, detect issues, create batches (retired by detect-with-gemini) | B (retired) |
| `component-converters.mjs` | MDX → HTML conversion. `convertMdxToHtml(content, native, target)` | Both |
| `regen-html.mjs` | Bulk HTML regeneration | Both |
| `audit-content.mjs` | Content audit scanner (3 tiers: REAL/QUALITY/COSMETIC) | Verification |
| `export-articles.mjs` | Export all articles to `data/articles-local.json` | Verification |

### Retired Scripts (already used, keep for reference)

| Script | What It Did | Phase |
|--------|------------|-------|
| `fix-mechanical.mjs` | Phase 1a deterministic fixes | 1a |
| `fix-ai.mjs` | Phase 1c AI fixes (pronunciations, examples, wrong-language) | 1c |
| `fix-double-hash.mjs` | Phase 1e-1: `## ## X` → `## X` | 1e |
| `fix-placeholder-text.mjs` | Phase 1e-2: `[...]` removal | 1e |
| `fix-vocabcards.mjs` | Phase 1e-3 single-pass AI VocabCard fixer | 1e |
| `fix-final.mjs` | Phase 1f comprehensive fixer | 1f |
| `fix-ipa.mjs` | IPA symbol replacement | 1 |
| `fix-legacy-props.mjs` | polish=/english= → word=/translation= | 1 |
| `fix-templates.mjs` | Template artifact fixes | 1 |

### Data Files

| Path | Purpose |
|------|---------|
| `data/gemini-audit-manifest.json` | Gemini audit results: all issues + summary stats |
| `data/gemini-audit-progress.json` | Resumable progress tracker for Gemini audit |
| `data/gemini-fix-progress.json` | **NEW** — Resumable progress tracker for Gemini fix pipeline |
| `data/deep-sweep/progress.json` | Global progress tracker for all pairs |
| `data/deep-sweep/{native}-{target}/manifest.json` | Per-pair batch manifest |
| `data/deep-sweep/{native}-{target}/batch-NNN.json` | Batch input (articles + detected issues) |
| `data/deep-sweep/{native}-{target}/fixes-NNN.json` | AI review output (fixes + verdicts) |
| `data/articles-local.json` | Full article export for offline auditing |

---

## Technical Reference

### Column Names (Supabase `blog_articles`)

```
id, slug, native_lang, target_lang, title, description, category,
difficulty, read_time, image, tags, content, content_html, date,
created_at, updated_at, published
```

Note: columns are `native_lang` / `target_lang` (not `native_language` / `target_language`).

### Component Prop Convention

- `word` = **target language** word/phrase
- `translation` = **native language** translation
- `pronunciation` = learner-friendly phonetics for native speakers
- `example` = natural sentence in the **target language**

### Pronunciation Style Guide

| Native Language | Script | Example |
|----------------|--------|---------|
| ru, uk | Cyrillic | `крю-А-сан` |
| el | Greek | `κρουα-ΣΑΝ` |
| All others | Latin + stress CAPS | `krwah-SAHN` |

Rules: Syllable hyphens, stressed syllable in CAPS, no IPA symbols ever.

### extractProp() — Double Quote Only

```javascript
const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
```

### IPA → Learner-Friendly Mapping

| IPA | Replacement | Notes |
|-----|-------------|-------|
| ʃ | sh | |
| ʒ | zh | |
| θ | z (or th) | Depends on native language |
| ð | d (or dh) | Depends on native language |
| ŋ | ng | |
| ə | e (or a) | Schwa — use most natural vowel |
| ɪ | i | Short i |
| ʊ | u | Short u |
| ʌ | a | |
| ɛ | e | |
| æ | a | |
| ɑ | a | |
| ɜ | er | |
| ɒ | o | |
| ɹ | r | |
| ˈ | (CAPS next syllable) | Primary stress |
| ˌ | (ignore) | Secondary stress |

### Batch Sizing for AI Phase

- **Max 4-5 articles per batch** (learned from pilot: 8 articles at 95KB overflowed context)
- Max batch file size: ~60KB
- Max agents per pair: 8 (parallelism limit)
- Retry failed batches by splitting in half

### Validation Rules (deep-sweep-apply.mjs)

1. Fixed content not empty
2. Word count >= 50% of original (prevents truncation)
3. Every VocabCard has `word` (length >= 2) and `translation` (length >= 2)
4. Every PhraseOfDay has `word` and `translation`
5. HTML regeneration succeeds

**Known edge case:** `word="I"` (English pronoun) fails length >= 2 check. Apply manually when encountered.

---

## Estimated Scale

| Phase | Articles | Approach | Est. Time | Est. Cost | Status |
|-------|----------|----------|-----------|-----------|--------|
| A (regex) | 13,484 | Single script, paginated | ~10 min | $0 | Done |
| B1 detect (Gemini) | 12,327 | ~800 Gemini Flash calls | ~2 min | ~$1-3 | Done |
| B1 fix (Gemini) | 6,585 | 1,620 Gemini Flash calls | ~13 min | ~$6-8 | Done |
| B2 detect (Gemini) | ~12,300 | ~800 Gemini Flash calls | ~2-5 min | ~$1-3 | **Next** |
| B2 fix (Gemini) | TBD | TBD | ~10-15 min | ~$5-10 | **Next** |
| B2 retry failures | ~196 | Single --resume run | ~2 min | ~$0.50 | **Next** |

Both phases are resumable via `--resume`. Fix phase filters by pair, issue type, or severity.

---

## Phase B2: Second Pass — Pronunciation + Residual Fixes

### Context

Phase B1 fixed **6,389 articles / 42,242 props** — eliminating the critical and high-severity language issues (wrong-language words, title mismatches, identical props). Post-fix verification revealed:

- **FAKE_PRONUNCIATION** is the dominant remaining issue (~4k across the corpus). Pronunciations that are descriptions, sentences, or the word itself copied rather than phonetic guides.
- **PRONUNCIATION_MISMATCH** — pronunciation that belongs to a different word than assigned.
- **Pronunciation quality** — missing vowel length, wrong stress markers, imprecise transliteration.
- **Residual WRONG_LANG** — some wrong-language issues that the first pass introduced or didn't catch.
- **196 unfixed articles** from B1 (transient DB errors + validation failures).

### Plan

#### Step 1: Re-run Full Detector

The B1 re-runs overwrote the original manifest. Need a fresh scan of all articles post-fix.

```bash
node blog/scripts/detect-with-gemini.mjs --model gemini-2.5-flash --concurrency 20
```

This gives us the new baseline — how many issues remain after B1.

#### Step 2: Retry B1 Failures

```bash
node blog/scripts/fix-with-gemini.mjs --resume
```

The 196 articles in `gemini-fix-progress.json` that failed due to transient DB errors or validation issues. The `--resume` flag skips already-applied articles and retries the rest.

**Note:** Need to clear the `failed` entries from the progress file first, so they're eligible for retry:
```bash
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('blog/scripts/data/gemini-fix-progress.json','utf-8')); p.failed={}; fs.writeFileSync('blog/scripts/data/gemini-fix-progress.json',JSON.stringify(p,null,2));"
```

#### Step 3: Fix New Manifest Issues

Run `fix-with-gemini.mjs` on the fresh B2 manifest. The script already handles all issue types including FAKE_PRONUNCIATION.

```bash
# Reset fix progress for B2 (keep B1 applied list to avoid re-fixing)
node blog/scripts/fix-with-gemini.mjs --concurrency 50 --resume
```

#### Step 4: Pronunciation-Targeted Pass (if needed)

If FAKE_PRONUNCIATION persists after B2, consider a targeted prompt that's more specific about pronunciation rules:

- Send ONLY the word + current pronunciation + native language
- Explicit format examples: `"krwah-SAHN"` not `"like croissant in French"`
- Batch 10-15 per call (small responses)
- Could reuse `fix-ipa.mjs` pattern with an updated prompt

### Expected Outcome

| Metric | After B1 | Target After B2 |
|--------|----------|-----------------|
| WRONG_LANG_* issues | ~90% reduced | ~95%+ reduced |
| TITLE_MISMATCH | ~95% reduced | ~98%+ reduced |
| FAKE_PRONUNCIATION | Largely untouched | ~80% reduced |
| PRONUNCIATION_MISMATCH | Partially reduced | ~70% reduced |
| Spot-check pass rate | 4/8 (50%) | 6/8+ (75%+) |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | Three-tier classification (REAL/QUALITY/COSMETIC) | Clear priority ordering |
| 2026-02-09 | Local JSON for auditing | 5.6s vs Supabase timeout |
| 2026-02-09 | extractProp: double quotes only | 99.998% use double quotes |
| 2026-02-09 | pronunciation_equals_word <= 3 chars = correct | Phonetic languages genuinely have pron = word for short words |
| 2026-02-10 | Two-phase approach (regex then AI) | 41% of issues are trivially regex-fixable — no need for AI |
| 2026-02-10 | Max 4-5 articles per AI batch | 8-article batch at 95KB caused context overflow |
| 2026-02-10 | needs_human for 100%-wrong-language articles | Full rewrites should be human-reviewed, not auto-applied |
| 2026-02-10 | Pronunciation style: Latin+CAPS stress for most languages | Consistent, learner-friendly, no IPA |
| 2026-02-10 | Gemini detect + Claude fix (split approach) | Gemini Flash for bulk detection (~$1-3) vs original deep-sweep ($50-100 combined) |
| 2026-02-10 | 15-20 articles per Gemini batch | Props-only payload is small enough for larger batches than full-content fixes |
| 2026-02-10 | Props-only extraction for detection | ~500-1000 chars/article vs 5-15K for full MDX, dramatically reduces token cost |
| 2026-02-10 | Iterative detect→fix cycles | One pass doesn't catch everything — fixes can introduce new issues, and detection is non-deterministic. Run B2 to mop up. |
| 2026-02-10 | FAKE_PRONUNCIATION as B2 priority | Most common remaining issue after B1. Medium severity but affects learner experience. |

---

## Progress Log

### 2026-02-09 Sessions 1-3: Phase 1 Complete
- Built infrastructure, audit, and fix pipeline
- 2,236 → 35 REAL issues (98.4% reduction)
- See `BLOG_QUALITY_PLAN.md` for detailed session-by-session log

### 2026-02-10 Session 4: Pilot + Plan
- Deep-sweep pilot on es→en (59 articles)
- 48 articles fixed, 9 clean, 2 needs-human
- Analysis revealed 41/59% regex/AI split
- Created two-phase approach
- **Next: Run Phase A (regex pass) across all 13,484 articles**

### 2026-02-10 Session 5: Gemini Audit Script
- Built `detect-with-gemini.mjs` — Gemini Flash semantic audit
- Sends compact props (not full content) in batches of 15-20
- 9 issue types: wrong-language, fake pronunciation, title mismatch, etc.
- Resumable via `--resume` flag, progress saved every 5 batches

### 2026-02-10 Session 6: Gemini Audit Complete + Fix Pipeline
- Ran full audit: 12,327 articles scanned, 6,585 with issues, 31,870 total issues
- Top issues: WRONG_LANG_EXAMPLE (18,521), FAKE_PRONUNCIATION (3,964), WRONG_LANG_WORD (3,940)
- Built `fix-with-gemini.mjs` — Gemini Flash fix pipeline using audit manifest
- Two prompt modes: normal fixes (broken props only) and TITLE_MISMATCH (full vocab replacement)
- Tested: 10 de-it articles fixed (9 success, 1 validation catch), resume works correctly

### 2026-02-10 Session 7: B1 Full Run + Verification
- **Full fix run:** 6,389 articles fixed, 42,242 props corrected, 13 min, ~$6-8
- 196 failures (2.8%): transient DB errors + Gemini returning empty props, all caught by validation
- **Detector re-runs (3 pairs):** Critical/high language issues largely eliminated
  - de-it: 33→18 articles with issues (remaining: pronunciation)
  - es-pl: 36→29 articles (remaining: FAKE_PRONUNCIATION + TITLE_MISMATCH residual)
  - uk-hu: 26→32 articles (FAKE_PRONUNCIATION dominant — 107/147 issues, medium severity)
- **Gemini spot-check (8 diverse pairs):** 4/8 PASS, 4/8 FAIL on minor pronunciation nitpicks
- **Key finding:** WRONG_LANG issues are fixed. FAKE_PRONUNCIATION (~4k) is the dominant remaining issue.
- **Note:** Re-runs overwrote original manifest. Not critical — fixes already in Supabase.
- **Next: Phase B2 — re-detect full corpus, retry failures, fix pronunciation issues**
