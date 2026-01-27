
## Pending Issues (2026-01-27)

### 1. Onboarding Words → Love Log Inconsistency
**Problem:** Onboarding gives 10 XP but doesn't add learned words to Love Log
**Proposed fix:**
- Add onboarding vocabulary to Love Log (language-agnostic)
- Award 1 XP per word instead of flat 10 XP
- Words encountered in onboarding flow should persist to dictionary table
**Consideration:** Need to track which words are shown during onboarding per language pair

### 2. Verb Conjugations Empty in Love Log
**Problem:** Verb conjugations display as empty in Love Log
**Likely cause:** `conjugation` field not being saved or retrieved correctly from dictionary table
**To investigate:** Check how verbs are being stored vs displayed in LoveLog.tsx

