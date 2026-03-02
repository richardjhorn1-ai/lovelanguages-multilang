# Vocabulary Bank Status

**Last Updated:** 2026-02-04

## Current State: PAUSED ⏸️

Generation paused due to Claude Code weekly usage limits (85% used, 2 days until reset).

## What We Have

**Location:** `vocab-bank-output/{native_lang}/{target_lang}.json`

| Native Lang | Words | Files | Status |
|-------------|-------|-------|--------|
| Romanian (ro) | ~17,000 | 17 | ✅ BATCH 1 COMPLETE |
| Turkish (tr) | ~1,259 | 2 | partial |
| Dutch (nl) | ~1,100 | 2 | partial |
| Ukrainian (uk) | ~1,087 | 2 | partial |
| Polish (pl) | ~1,067 | 11 | partial |
| Portuguese (pt) | ~653 | 1 | partial |
| French (fr) | ~580 | 1 | partial |
| Swedish (sv) | ~436 | 1 | partial |
| Czech (cs) | ~430 | 2 | partial |
| English (en) | ~413 | 6 | partial |
| German (de) | ~382 | 1 | partial |
| Norwegian (no) | ~375 | 1 | partial |
| Russian (ru) | ~280 | 1 | partial |
| Spanish (es) | ~233 | 1 | partial |
| Danish (da) | ~200 | 1 | partial |
| Hungarian (hu) | ~187 | 3 | partial |
| Greek (el) | ~165 | 2 | partial |
| Italian (it) | ~125 | 1 | partial |

**Totals:**
- 56 JSON files
- 28MB data  
- ~26,000 word entries
- 1 language fully complete (Romanian - all 17 targets × 1000 words)

## Goal

- **Per pair:** 5,000 words (e.g., ro→en should have 5000)
- **Per native language:** 5,000 × 17 targets = 85,000 words
- **Total:** 18 native × 85,000 = 1.53M entries

## What's NOT Done Yet

1. ❌ Supabase `vocabulary_bank` table is empty (migration created, not populated)
2. ❌ App not connected to check vocabulary_bank before Gemini calls
3. ❌ Most languages incomplete (only Romanian finished batch 1)

## Next Steps (When Credits Available)

1. **Bulk insert** existing JSON files into Supabase
2. **Connect app** to use vocabulary_bank as primary source
3. **Continue generation** slowly (2-3 agents, not 18) to avoid burning credits
4. **Prioritize** high-traffic language pairs (EN→PL, PL→EN based on user data)

## Generation Approach

- Uses Claude Code with `--dangerously-skip-permissions --model sonnet`
- Agents need Down+Return to accept bypass warning
- Agents die around 30min mark (session timeout?)
- Spec file: `scripts/VOCAB_AGENT_PROMPT.md`

## Credit Usage Notes

- 18 parallel agents burned ~85% weekly Claude Code limit in one night
- Weekly limit resets every Thursday (Feb 6, 2026 at 1pm Amsterdam)
- Future runs: use 2-3 agents max, spread over days

## Related Files

- `scripts/VOCAB_AGENT_PROMPT.md` — Agent instructions
- `scripts/vocab-bank-spec.md` — Schema and category definitions
- `supabase/migrations/036_vocabulary_bank.sql` — Table schema (not yet applied)
