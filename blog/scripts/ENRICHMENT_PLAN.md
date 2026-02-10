# Phase 3.2: AI Content Enrichment — Master Plan

## Status Overview

| Tier | Scope | Status | Articles |
|------|-------|--------|----------|
| 0 | Mechanical header fixes + audit FP fixes | COMPLETE | 282 articles, 506→2 english_headers |
| 1 | Critical content fixes (lang mismatch, empty props, English markers, truncated) | COMPLETE | 299 articles across 100 batches |
| 2 | Empty sections / critically thin (<300 words) | NOT STARTED | ~5,561 articles |
| 3 | Lighter thin content (300-499 words) | NOT STARTED | ~3,400 articles |

## Tier 1 Quality Review Plan

### Step 1: Sample-based spot check (10-15 articles)
Pick a stratified sample across fix types and languages:
- 3 articles that had `language_fingerprint_mismatch` (check prose is in correct native_lang)
- 3 articles that had `empty_component_props` (check props are filled, relevant, correct language pair)
- 3 articles that had `english_prose_markers` (check English is gone, replacement is natural)
- 3 articles that had `truncated_content` (check continuation is natural, on-topic)
- Spread across different native_lang (ro, da, hu, de, pt, etc.)

### Step 2: Automated quality checks
- Re-run `node blog/scripts/audit-content.mjs` (DONE — remaining: 11 english_prose_markers, 10 empty_component_props, 1 lang mismatch, 10 truncated)
- Spot-check the remaining 11 english_prose_markers — are they real issues or false positives?
- Spot-check the remaining 10 empty_component_props — were they in Tier 1 scope or new?
- Check content_html was regenerated correctly for sample articles (query Supabase)

### Step 3: Visual check
- Pick 3-5 articles, view them on the live blog to confirm rendering is correct
- Check that VocabCard, PhraseOfDay, CultureTip components render with filled props

## Tier 2 Plan: Empty Sections Expansion

### Scope
- ~5,561 articles with `empty_sections` issue
- These have headers/structure but little prose content (<300 words)
- Need AI to write educational content under each section

### Preparation
```bash
node blog/scripts/fix-content-ai.mjs --prepare --tier 2
```
- Batch size: 5 articles per batch (~1,112 batches)
- Will create tier2-batch-001.json through tier2-batch-NNN.json

### Processing Pattern (proven in Tier 1)
- 10 parallel Sonnet subagents per wave
- Each reads batch file, enriches articles, writes result JSON
- Validate with `--apply --dry-run` before applying
- Apply with `--apply` (moves to ai-applied/)
- ~112 waves needed (vs 10 for Tier 1)

### Subagent Prompt Template for Tier 2
```
Read batch file at: .../ai-batches/tier2-batch-NNN.json
For each article: expand empty/thin sections with educational content.
- Write 3-5 paragraphs per empty section in native_lang
- Teach target_lang vocabulary/grammar relevant to the section topic
- Add VocabCard components where appropriate
- Preserve ALL existing components
- No frontmatter/imports/CTA
- Use JSON.stringify() to write output (learned from Tier 1 JSON issues)
Write to: .../ai-results/tier2-batch-NNN.json
```

### Key Learnings from Tier 1 to Apply
1. **JSON escaping**: Emphasize `JSON.stringify()` in prompts — 3 batches had invalid JSON in Tier 1
2. **Component preservation**: Validation caught 1 dropped PhraseOfDay — keep the validation pipeline
3. **Transient DB errors**: Retry on `fetch failed` — always succeeds on second try
4. **Wave size**: 10 parallel agents works well, good throughput without overwhelming
5. **Dry-run first**: Always validate before applying — caught all issues before DB writes

## Tier 3 Plan: Lighter Expansion

### Scope
- ~3,400 articles with 300-499 words (thin but not critically so)
- Decision point: evaluate after Tier 2 whether this is needed
- Batch size: 10 articles per batch (~340 batches)

### Approach
- Similar to Tier 2 but lighter touch
- Add 1-2 paragraphs per thin section rather than 3-5
- Focus on sections that are completely empty vs just short

## Execution Order
1. **Tier 1 Quality Review** ← NEXT
2. **Tier 2 Preparation** (--prepare --tier 2)
3. **Tier 2 Processing** (~112 waves of 10 agents)
4. **Tier 2 Audit verification**
5. **Tier 3 decision point**

## Files Reference
- `blog/scripts/fix-content-ai.mjs` — Main pipeline script (--prepare, --apply, --status, --dry-run)
- `blog/scripts/audit-content.mjs` — Content audit
- `blog/scripts/fix-content-mechanical.mjs` — Tier 0 mechanical fixes
- `blog/scripts/data/ai-batches/` — Input batch files
- `blog/scripts/data/ai-results/` — Pending result files
- `blog/scripts/data/ai-applied/` — Applied result files (100 Tier 1 files here)
- `blog/scripts/data/content-audit.json` — Latest audit results

## Post-Tier 1 Audit Numbers
```
english_headers: 2
truncated_content: 10
language_fingerprint_mismatch: 1
english_prose_markers: 11
empty_component_props: 10
thin_content: 10,938
empty_sections: 5,561
```
