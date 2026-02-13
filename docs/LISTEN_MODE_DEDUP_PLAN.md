# Fix Listen Mode Duplicate & Garbled Transcripts

## Context

Listen Mode shows excessive duplicates, progressive refinement artifacts, and cross-language pairs as separate entries. We've done several rounds of fixing the dedup logic with increasingly complex heuristics, and it's still broken.

The core problem: **we throw away the primary key Gladia gives us, then build 70 lines of fuzzy matching to compensate.**

### What Gladia provides vs what we do with it

| Gladia field | Purpose | What we do |
|-------------|---------|-----------|
| `data.id` | Unique utterance ID, stable across partial/final | **Discard it.** Generate synthetic IDs (`transcript_N`) |
| `code_switching: true` | ONE utterance per audio segment, one detected language | Configured correctly, but then **duplicate the output client-side with heuristics** |
| `utterance.translations[lang]` | Embedded translation for the utterance | Extract it (works) |
| Separate `type: 'translation'` messages | Translation arriving after transcript | Handle in `handleTranslationUpdate` (works) |
| `utterance.confidence` | Transcription reliability | Extract, **never use** |
| `data.stable` | "This partial won't change" | **Ignore** |

### What Gladia's docs say

- Code switching produces **ONE utterance per audio segment** with one detected language
- `data.id` is **unique across partial and final messages** for the same utterance
- Translations are embedded in the utterance OR sent as separate messages
- Our config (`code_switching: true`, `translation: true`, `endpointing: 1.0`) is correct

### Why the current dedup is broken

70 lines of heuristics (ChatArea.tsx lines 926-995) that all fail:

| Bug | What happens | Root cause |
|-----|-------------|-----------|
| Time window too short | Duplicates slip through | 3s window, Gladia can send >3s apart |
| Cross-language keeps both | Two entries instead of one | Length threshold never triggers |
| Extension merge fragile | Doesn't catch refinements | Char-based, case-sensitive, checks 1 entry |
| Undefined language breaks everything | All dedup short-circuits | `recent.language && entry.language` gates every check |

**None of these bugs would exist if we used `data.id`.**

## Plan: Actually use Gladia's data. Delete the heuristics.

### Principle

Gladia tells us which utterances are the same via `data.id`. Trust it. Don't rebuild that logic client-side.

### Change 1: Preserve Gladia's utterance ID
**File:** `services/gladia-session.ts`

- Add `gladiaId?: string` to `TranscriptChunk` interface
- Extract `transcriptData.id` and pass it through
- Keep synthetic `id` for React keys (unchanged)

```typescript
// Line ~400 — add alongside existing fields:
gladiaId: transcriptData.id || undefined,
```

~3 lines changed.

**File:** `components/ChatArea.tsx`
- Add `gladiaId?: string` to `TranscriptEntry` interface
- Map `chunk.gladiaId` → `entry.gladiaId` in entry creation

~2 lines changed.

### Change 2: Replace 70 lines of dedup with ~15
**File:** `components/ChatArea.tsx` (lines 926-995)

Delete the entire cross-language dedup, same-language dedup, and extension merge sections. Replace with:

```
For each final transcript:

1. GLADIA ID match — same gladiaId exists in recent entries?
   → Replace with newest. Done.

2. EXACT TEXT match — case-insensitive trim match in recent entries?
   → Drop. Done.

3. Otherwise → Add as new entry.
```

That's it. No time windows. No language checks. No word overlap. No length ratios.

**Why this is enough:**
- `data.id` handles: progressive refinement, partial→final updates, same utterance re-sent
- `code_switching: true` handles: bilingual audio produces ONE entry, not two
- Embedded translations handle: translation arrives with the utterance
- `handleTranslationUpdate` handles: late-arriving separate translation messages
- Exact text match handles: edge case where Gladia assigns different IDs to identical text
- Gemini post-processing handles: any remaining garble or artifacts

**What we stop doing:**
- Cross-language merge logic (code_switching already does this)
- Word overlap / extension merge (data.id already does this)
- Length ratio comparison (data.id already does this)
- Time window management (data.id doesn't need one)
- Language-gated dedup (no language checks needed)

### Change 3: Add progressive refinement to Gemini prompt
**File:** `api/process-transcript.ts` (lines 119-124)

Add to KNOWN ARTIFACTS — safety net for anything that slips past client dedup:
```
4. PROGRESSIVE REFINEMENT: Same utterance appears multiple times with increasing
   accuracy. Keep ONLY the most complete/accurate version.
```

~3 lines changed.

### Change 4: Bump speech threshold
**File:** `api/gladia-token.ts` (line 105)

`speech_threshold: 0.7` → `0.75`. Slightly stricter noise filtering. Conservative, reversible.

1 line changed.

## What we're NOT doing

| Considered | Why not |
|-----------|---------|
| Keeping any heuristic dedup steps | `data.id` + exact text match covers it. If edge cases appear, we add targeted fixes — not preemptive heuristics |
| Client-side cross-language merge | `code_switching: true` already produces one utterance per segment. If we see duplicates, that's a Gladia config issue to investigate |
| Confidence-based filtering | Risky threshold tuning, Gemini handles garble |
| Settling buffer / debounce | Adds latency, React functional updater is sequential |

## Files Modified

1. `services/gladia-session.ts` — add `gladiaId` to TranscriptChunk, extract from `transcriptData.id` (~3 lines)
2. `components/ChatArea.tsx` — add `gladiaId` to TranscriptEntry, **delete ~70 lines of dedup, replace with ~15** (net reduction)
3. `api/process-transcript.ts` — 1 new artifact description in Gemini prompt (~3 lines)
4. `api/gladia-token.ts` — `0.7` → `0.75` (1 line)

## Verification

1. `npx tsc --noEmit` — type check
2. `npm run build` — production build
3. Manual test: start Listen Mode, speak mixed Polish/English, verify:
   - No duplicate entries
   - Progressive refinement collapses to single entry
   - Translations appear on the correct entry
   - Bookmarks preserved through dedup replacements
   - Gemini post-processing still cleans remaining garble

## If edge cases appear after deploy

If `code_switching` doesn't actually prevent cross-language duplicates:
- First investigate Gladia config (are we getting two `data.id`s for the same audio?)
- Only then add a targeted fix for the specific case — not a preemptive heuristic pipeline
