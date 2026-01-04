# Next Steps - Love Languages

**Date:** January 4, 2026
**Last Session:** Progress System Phase 5 + AI Challenge Mode planning

---

## What We Just Completed

### Progress Page Enhancements
- **Previous Level Tests** - Users can practice any level test they've passed
  - Dropdown shows all completed levels with theme names
  - "Checking In", "First Words of Love", etc.
- **Learning Journey Diary** - Book/diary format with saved AI analyses
  - Left panel: Index of all journal entries
  - Right panel: Full content with topics, grammar, suggestions
  - Entries show summarized titles instead of truncated text
- **Reordered Layout** - Love Log Stats now appears above Learning Journey
- **Fixed Module Resolution** - Inlined constants in API files to fix Vercel serverless issues

### Play Section Enhancements (Phase 5)
- **Three Practice Modes**: Flashcards, Multiple Choice, Type It
- **Bidirectional Type It**: Polish→English AND English→Polish
- **Tab navigation** with session stats

### AI Challenge Mode Outline (Added to ROADMAP.md)
- Data capture strategy for play sessions
- Weakness detection algorithm
- Challenge types (Word Blitz, Reverse Practice, Conjugation Drill, etc.)
- Database schema for tracking
- XP integration plan

### Files Modified
| File | Changes |
|------|---------|
| `components/Progress.tsx` | Previous levels, reordering, journal titles |
| `components/FlashcardGame.tsx` | 3 practice modes, bidirectional typing |
| `api/generate-level-test.ts` | Inlined level constants |
| `api/submit-level-test.ts` | Inlined pass threshold |
| `ROADMAP.md` | Added Phase 5.5 AI Challenge Mode |
| `NEXT_STEPS.md` | This file |

---

## Current System Status

### Working Features
| Feature | Status |
|---------|--------|
| Text chat vocabulary extraction | ✅ Real-time |
| Voice mode vocabulary extraction | ✅ Post-session |
| Verb conjugations (present) | ✅ All 6 persons |
| Verb conjugations (past/future) | ✅ Complete or omitted |
| Noun gender + plural | ✅ Required |
| Adjective forms | ✅ All 4 required |
| Example sentences | ✅ 5 per word |
| Pro-tips | ✅ Required |

### Data Quality Rules (Enforced)
- Verbs: ALL 6 conjugations for present tense (ja, ty, onOna, my, wy, oni)
- Verbs: Past/future only if ALL 6 can be filled (no partial data)
- Nouns: Gender (masculine/feminine/neuter) + plural form
- Adjectives: All 4 forms (masculine, feminine, neuter, plural)
- All words: 5 examples + pro-tip

---

## Next Priority: Phase 5.5 - AI Challenge Mode

**Goal:** Capture play session data to generate personalized AI challenges.

### Core Concept
The Play section now has 3 modes (Flashcards, Multiple Choice, Type It), but we're not capturing the data. This is a missed opportunity to identify weak words and create targeted practice.

### Key Features to Build
1. **Data Capture** - Log every play attempt with word_id, mode, correct/incorrect, response time
2. **Struggle Score** - Calculate which words need the most practice
3. **AI Challenge Generator** - Use Gemini to create personalized challenges
4. **XP Rewards** - +15 XP for completing a challenge, +25 XP for perfect score

### Implementation Steps
1. Add `play_attempts` table to database
2. Update `FlashcardGame.tsx` to log attempts
3. Create `/api/generate-challenge.ts`
4. Build `components/AIChallenge.tsx` UI

See `ROADMAP.md` Phase 5.5 for full details.

---

## Also Planned: Tense Mastery System

**Goal:** Track which tenses the user has LEARNED for each verb.

A user might know "kocham" (I love - present) but not "kochałem" (I loved - past). We should track this progression.

See `ROADMAP.md` Phase 4.5 for details.

---

## Open Issues

### Issue 16: Harvest Not Extracting All Words (LOW PRIORITY)
Now that real-time extraction works, the manual "Update" button is less critical. But if needed:
- `/api/analyze-history.ts` - extraction prompt
- `/components/LoveLog.tsx` - `handleHarvest()` function
- Consider paginating through all messages

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `/components/ChatArea.tsx` | Fixed `stopLive()` stale closure |
| `/api/chat.ts` | Updated prompts for complete tense data |
| `/api/analyze-history.ts` | Updated prompts for complete tense data |
| `ROADMAP.md` | Added Phase 4.5 Tense Mastery System |
| `TROUBLESHOOTING.md` | Added Issues 18-19 |
| `NEXT_STEPS.md` | This file |

---

## Quick Start Next Session

```bash
cd "/Users/richardhorn/Trying Claude Code/L.L.3.0"

# Start dev server
vercel dev

# Priority: Implement Tense Mastery System
# See ROADMAP.md Phase 4.5 for details
```

---

## Documentation Reference

- `ROADMAP.md` - Product roadmap with Phase 4.5 details
- `TROUBLESHOOTING.md` - All issues 1-19 with solutions
- `docs/AI_INTEGRATION_GUIDE.md` - Voice mode implementation
- `docs/FORMATTING.md` - Markdown rendering pipeline

---

*Voice mode and text chat both extract vocabulary correctly. Data quality is enforced. Next: track tense learning progress.*
