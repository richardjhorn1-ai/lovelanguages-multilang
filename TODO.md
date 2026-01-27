## Pending Issues (2026-01-27)

### ✅ FIXED: Onboarding Words → Love Log
**Fixed in:** commit 9112c1d
- Onboarding now saves 2 starter words (hello, I love you) to dictionary
- Awards 1 XP per word (2 XP total instead of flat 10 XP)
- Words appear in Love Log with source="onboarding"

### ✅ FIXED: Verb Conjugations Empty in Love Log
**Fixed in:** commits 9112c1d, 3589439, 9f4815e
**Root cause:** UI used Polish-specific keys (ja, ty, onOna) but API returns normalized keys (first_singular, second_singular, etc.)
**Fixes applied:**
1. Updated LoveLog.tsx to use normalized keys
2. Added backward compatibility helper for legacy Polish keys
3. Added auto-backfill: if AI returns verbs without conjugations, makes follow-up request to fill them

---

## Backlog

### Master Vocabulary Bank
See ROADMAP.md section "E. Master Vocabulary Bank (Cost Optimization)"
Pre-computed vocabulary to reduce AI costs and improve response times.
