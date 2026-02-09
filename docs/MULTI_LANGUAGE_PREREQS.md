# Multi-Language Feature Prerequisites

These cross-language contamination issues must be fixed before shipping the multi-language feature (learning two languages simultaneously, or being a tutor for one and student for another).

They do NOT affect single-language users today.

---

## 1. LoveLog sync scans ALL languages

**File:** `components/LoveLog.tsx:163`

`handleSync` fetches ALL messages across ALL chats regardless of language. It marks them `vocabulary_harvested_at` permanently. When multi-lang ships, a user switching languages would harvest wrong-language words AND permanently mark those messages as processed.

**Fix needed:** Filter chats by `language_code` before harvesting.

---

## 2. ChatArea word extraction has no language filter

**Files:** `components/ChatArea.tsx:1027` and `:690`

`extractWordsFromSession` and `stopLive` check existing dictionary words without a `language_code` filter. "hello" in Polish would prevent extracting "hello" for Spanish.

**Fix needed:** Add `language_code` filter to dictionary existence checks.

---

## 3. Progress tutor dashboard shows cross-language scores

**File:** `components/Progress.tsx:249`

`fetchScores` queries `word_scores` without `language_code` filter. Tutor would see all languages mixed together.

**Fix needed:** Add `language_code` filter to the scores query.

---

## 4. Game history has no language filter

**File:** `api/get-game-history.ts`

Shows all game sessions across all languages.

**Fix needed:** Add optional `language_code` filter parameter.
