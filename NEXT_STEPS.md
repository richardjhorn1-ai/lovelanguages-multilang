# Next Steps - Love Languages

**Date:** January 3, 2025
**Last Session:** Issues 12-15 fixes + Love Log navigation

---

## What We Just Completed

### Issue 12: Voice Mode English-First
- Updated system prompts in `/api/live-token.ts`
- Pattern: English explanation → Polish word → pronunciation tip
- Both ASK and LEARN modes now speak primarily in English

### Issue 13: Transcription Wrong Script
- **BLOCKED** - Gemini Live API does not support `languageCode` or `languageCodes` on `inputAudioTranscription`
- Attempted both singular and array formats, both rejected by API
- Must accept that Polish pronunciation attempts may transcribe as wrong scripts
- See TROUBLESHOOTING.md for full investigation

### Issue 14: Harvest API Error Handling
- Added JSON validation before parsing in `/api/analyze-history.ts`
- Returns `retryable: true` flag for client retry logic
- Returns 502 for upstream errors, 500 for internal errors

### Issue 15: Voice Mode - Agent Messages on Interrupt
- Fixed in `/services/live-session.ts`
- Partial model transcripts now saved before clearing on interrupt
- Previously, interrupting lost the agent's message entirely

### Love Log Card Improvements
- Added `ChevronLeft` icon to `/constants.tsx`
- Added forward/backward navigation for examples: `[<] 2/5 [>]`
- Moved pro-tip out of box, now subtle text above forms button

---

## Open Issues

### Issue 16: Harvest Not Extracting All Words (OPEN)
**Problem:** "Update" button doesn't extract all Polish words from chat history.

**Possible Causes:**
1. 100 message limit in `/components/LoveLog.tsx` line 40
2. Prompt limitations - Gemini may miss vocabulary
3. Known words filtering may be too aggressive
4. Large conversations may exceed effective extraction

**Files to Investigate:**
- `/api/analyze-history.ts` - extraction prompt (lines 99-119)
- `/components/LoveLog.tsx` - `handleHarvest()` function

**Potential Fixes:**
1. Increase/remove message limit
2. Paginate through all messages in batches
3. Improve extraction prompt specificity
4. Add "force re-extract" option ignoring known words
5. Multiple extraction passes

**See:** TROUBLESHOOTING.md Issue 16

---

## Issue Status Summary

| Issue | Description | Status |
|-------|-------------|--------|
| 12 | Voice mode Polish-first | FIXED |
| 13 | Transcription wrong script | BLOCKED (API limitation) |
| 14 | Harvest API 500 error | FIXED |
| 15 | Agent messages not saved on interrupt | FIXED |
| 16 | Harvest not extracting all words | OPEN |

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `/api/live-token.ts` | English-first prompts |
| `/api/analyze-history.ts` | JSON validation, better error handling |
| `/services/live-session.ts` | Save model transcript on interrupt |
| `/components/LoveLog.tsx` | Forward/backward navigation, pro-tip styling |
| `/constants.tsx` | Added ChevronLeft icon |
| `TROUBLESHOOTING.md` | Updated issues 12-16 |

---

## Quick Start Next Session

```bash
cd "/Users/richardhorn/Trying Claude Code/L.L.3.0"

# Start dev server
vercel dev

# Priority: Fix Issue 16 (harvest not getting all words)
# Files to look at:
#   - /api/analyze-history.ts (extraction prompt)
#   - /components/LoveLog.tsx (handleHarvest, line 37-84)
```

### To Continue Issue 16:

1. **Check message limit:**
   ```
   /components/LoveLog.tsx line 40: .limit(100)
   ```
   Consider increasing or paginating.

2. **Review extraction prompt:**
   ```
   /api/analyze-history.ts lines 99-119
   ```
   May need to be more explicit about extracting ALL vocabulary.

3. **Check known words filter:**
   ```
   /components/LoveLog.tsx line 43-44
   ```
   `knownWords` filter may be too aggressive.

---

## Documentation Reference

- `TROUBLESHOOTING.md` - All issues with full context
- `ROADMAP.md` - Product roadmap
- `docs/` - Additional documentation

---

*Voice mode now works with English-first approach and saves interrupted messages. Next priority: fix word harvesting completeness.*
