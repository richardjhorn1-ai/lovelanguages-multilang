# Offline Mode + Background Sync — Feature Plan

**Status:** READY TO IMPLEMENT
**Created:** 2026-02-04
**Revised:** 2026-02-04
**Goal:** Complete the offline mode infrastructure — wire up existing code and add sync

---

## Executive Summary

**Good news:** Most of the offline infrastructure already exists but isn't wired up.

| Component | Status |
|-----------|--------|
| Network detection | ✅ Built (`services/offline.ts`) |
| Vocabulary caching | ✅ Built & working |
| Offline UI indicator | ✅ Built (`OfflineIndicator.tsx`) |
| Score queueing | ✅ Built but **not used** |
| Sync on reconnect | ❌ **Not implemented** |
| word_scores caching | ❌ **Not implemented** |

**Revised estimate:** 3-5 hours (down from 10-16)

---

## What Works Offline Currently

| Feature | Offline? | Implementation |
|---------|----------|----------------|
| App shell (UI) | ✅ | Cached by Workbox service worker |
| Static assets | ✅ | Cached by Workbox |
| Google Fonts | ✅ | Cache-first strategy in `vite.config.ts` |
| Network detection | ✅ | `services/offline.ts` (Capacitor + browser fallback) |
| Vocabulary caching | ✅ | `services/offline.ts` → localStorage |
| Offline banner | ✅ | `OfflineIndicator.tsx` with i18n |
| **Games** | ⚠️ Partial | Vocab loads from cache, but scores don't save |
| **Chat** | ❌ | Needs Gemini API |
| **Love Log** | ❌ | Could use cached vocab (not wired up) |
| **Progress** | ❌ | Needs stats from Supabase |

---

## Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                      EXISTING CODE                          │
├─────────────────────────────────────────────────────────────┤
│  services/offline.ts     → Network detection, vocab cache,  │
│                            score queue (UNUSED)             │
│  hooks/useOffline.ts     → React hook for offline state     │
│  OfflineIndicator.tsx    → Banner UI with i18n              │
│  FlashcardGame.tsx       → Uses cached vocab when offline   │
└─────────────────────────────────────────────────────────────┘
                              │
                    GAP: Not wired up
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      MISSING PIECES                         │
├─────────────────────────────────────────────────────────────┤
│  useScoreTracking.ts     → Needs offline queue integration  │
│  Sync trigger            → Process queue on reconnect       │
│  word_scores cache       → Not cached, games need it        │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Task 1: Wire Up Score Queueing
**Effort:** 30-45 minutes
**File:** `components/FlashcardGame.tsx` (line 318-322)

**Important:** The `useScoreTracking` hook exists but is **unused**. Score updates happen directly in FlashcardGame.

**Current code:**
```typescript
// Always tries Supabase, fails silently offline
await supabase.from('word_scores').upsert(scoreUpdate, {
  onConflict: 'user_id,word_id'
});
```

**Change to:**
```typescript
import { offline } from '../services/offline';

// Check network before DB call
if (offline.getIsOnline()) {
  await supabase.from('word_scores').upsert(scoreUpdate, {
    onConflict: 'user_id,word_id',
  });
} else {
  // Queue for later sync
  offline.queueScoreUpdate(profile.id, scoreUpdate);
}
```

**Also update local state immediately** so UI reflects the change even when offline.

---

### Task 2: Add word_scores Caching
**Effort:** 45 minutes - 1 hour
**File:** `services/offline.ts`

**Add new methods:**
```typescript
const OFFLINE_WORD_SCORES_KEY = 'love-languages-offline-word-scores';

cacheWordScores(userId: string, languageCode: string, scores: WordScore[]): void {
  // Similar pattern to cacheVocabulary
}

getCachedWordScores(userId: string, languageCode: string): WordScore[] | null {
  // Similar pattern to getCachedVocabulary
}
```

**Update `useScoreTracking.ts`** to:
1. Cache scores after fetching from Supabase
2. Load from cache when offline

---

### Task 3: Implement Sync on Reconnect
**Effort:** 1-2 hours
**Files:** `services/offline.ts`, new `services/offline-sync.ts`

**Add to `services/offline.ts`:**
```typescript
// In constructor, after network listener setup:
Network.addListener('networkStatusChange', async (status) => {
  if (status.connected) {
    await this.processPendingSync();
  }
});

// Also trigger on app focus
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && this.isOnline) {
    await this.processPendingSync();
  }
});
```

**New sync processing method:**
```typescript
async processPendingSync(): Promise<void> {
  const pendingScores = this.getPendingScores(currentUserId);
  if (pendingScores.length === 0) return;

  // Process each pending score
  for (const score of pendingScores) {
    try {
      await supabase.from('word_scores').upsert({
        user_id: currentUserId,
        word_id: score.wordId,
        // Need to fetch current score and apply delta
        // OR store full score object in queue
      });
    } catch (error) {
      console.warn('Sync failed for score:', score.wordId);
      // Keep in queue for retry
      return;
    }
  }

  this.clearPendingScores(currentUserId);
}
```

**Issue to resolve:** Current `queueScoreUpdate` only stores `wordId` and `isCorrect`. For proper sync, we need the full score object or need to compute deltas. See Task 3a below.

---

### Task 3a: Fix Queue Data Structure
**Effort:** 30 minutes
**File:** `services/offline.ts`

The current queue stores minimal data:
```typescript
interface OfflineScore {
  wordId: string;
  isCorrect: boolean;
  timestamp: string;
}
```

**Problem:** Can't reconstruct the full `word_scores` row for upsert.

**Options:**
1. **Store full score object** — Queue the entire `scoreUpdate` object from `useScoreTracking`
2. **Replay approach** — Fetch current score on sync, apply queued correct/incorrect deltas

**Recommendation:** Option 1 (store full object) is simpler and more reliable.

**Change `queueScoreUpdate` signature:**
```typescript
// Old
queueScoreUpdate(userId: string, wordId: string, isCorrect: boolean): void

// New
queueScoreUpdate(userId: string, scoreUpdate: WordScoreUpdate): void

interface WordScoreUpdate {
  word_id: string;
  language_code: string;
  total_attempts: number;
  correct_attempts: number;
  correct_streak: number;
  learned_at: string | null;
}
```

---

### Task 4: Testing
**Effort:** 1 hour

| Scenario | Test |
|----------|------|
| Go offline mid-game | Banner appears, can continue playing |
| Answer questions offline | Scores update in UI, queued locally |
| Come back online | Queue syncs automatically |
| Check Supabase after sync | Scores match what was played offline |
| Offline cold start | Games load from cached vocabulary |
| No cached data + offline | Shows "connect to get started" message |

---

## Files to Modify

| File | Change |
|------|--------|
| `services/offline.ts` | Add word_scores caching, game session queueing, fix queue structure, add sync processing |
| `components/FlashcardGame.tsx` | Wire up offline queue for scores AND game sessions |
| `components/ChatArea.tsx` | Add offline detection, disable input when offline |
| `components/LoveLog.tsx` | Fall back to cached vocabulary when offline (medium priority) |
| `hooks/useOffline.ts` | Expose word_scores cache methods |

**No new files needed** — extend existing infrastructure.

**Note:** `components/games/hooks/useScoreTracking.ts` exists but is unused. Could refactor FlashcardGame to use it, but that's a bigger change. For MVP, fix FlashcardGame directly.

---

## Estimated Effort (Revised)

| Task | Time |
|------|------|
| 1. Wire up score queueing | 30 min |
| 2. Queue game sessions | 1 hour |
| 3. Add word_scores caching | 45 min |
| 4. Implement sync on reconnect | 1.5 hours |
| 5. Disable chat when offline | 30 min |
| 6. LoveLog offline fallback | 30 min |
| 7. Testing | 1 hour |
| **Total** | **5-6 hours** |

See "Revised Task List" in Final Review section for detailed breakdown.

---

## Decision Points — Still Relevant

### Conflict Resolution
- **Decision:** For word_scores, use **max-wins** for counters, not last-write-wins
- `correct_attempts`: `Math.max(local, server)`
- `correct_streak`: `Math.max(local, server)`
- `learned_at`: Keep earliest non-null value
- Prevents losing progress if same word practiced on two devices

### Storage Limits
- **Current:** localStorage (~5-10MB limit)
- **Sufficient for:** Most users with <2000 words
- **Future:** Migrate to IndexedDB if users hit limits (not MVP)

### What's Disabled Offline
| Feature | Offline Behavior |
|---------|------------------|
| Chat | Show "unavailable offline" (already in OfflineIndicator) |
| Listen Mode | Disable (needs TTS API) |
| Adding new words | Queue for sync OR disable (TBD) |
| Tutor features | Disable (need partner sync) |

---

## i18n Status

**Already implemented** in `OfflineIndicator.tsx`:
- `offline.offlineMode` — "Offline"
- `offline.title` — "You're offline"
- `offline.canPractice` — "You can still practice with {{count}} cached words"
- `offline.noCache` — "No cached vocabulary available"
- `offline.lastSync` — "Last synced: {{time}}"
- `offline.never` — "Never"
- `offline.justNow`, `offline.minsAgo`, `offline.hoursAgo`, `offline.daysAgo`

**May need to add:**
- `offline.syncing` — "Syncing..."
- `offline.syncComplete` — "All caught up!"
- `offline.pendingSync` — "{{count}} actions waiting to sync"

---

## Out of Scope (Future)

1. **IndexedDB migration** — Only if localStorage limits become a problem
2. **Service Worker Background Sync** — Limited iOS support, app-level sync is sufficient
3. **Love Log offline** — Lower priority, games are primary use case
4. **Progress page offline** — Would need to cache stats
5. **Push notifications** — Separate feature entirely

---

## Open Questions

1. **Should adding words work offline?**
   - Pro: Better UX
   - Con: Word validation needs Gemini, could queue invalid words
   - **Recommendation:** Disable word adding offline for MVP

2. **Auth token expiry after long offline period?**
   - Supabase tokens expire (default 1 hour)
   - If offline for hours, sync might fail on reconnect
   - **Recommendation:** Check `supabase.auth.getSession()` before sync, refresh if needed

---

## Final Review — Additional Gaps (2026-02-04)

### High Priority (Should fix with MVP)

#### 1. Game Session Saving
**File:** `FlashcardGame.tsx:371-405`

`saveGameSession()` calls `/api/submit-game-session` when a game ends. Saves:
- Game mode, correct/incorrect counts, total time, individual answers
- Awards XP based on performance

**Impact:** Entire game session lost if offline when finishing (no XP, no history).

**Fix:** Queue game session for sync alongside word scores.

#### 2. Score Updates in FlashcardGame (not useScoreTracking!)
**File:** `FlashcardGame.tsx:318-322`

The score update is directly in FlashcardGame, NOT using the `useScoreTracking` hook:
```typescript
await supabase.from('word_scores').upsert(scoreUpdate, {
  onConflict: 'user_id,word_id'
});
```

**Note:** `useScoreTracking.ts` exists but is **unused** — it was built for a refactor that never happened.

**Fix:** Add offline check here, not in the unused hook.

#### 3. ChatArea — No Offline Handling
**File:** `ChatArea.tsx`

- No `isOnline` check anywhere
- Send button not disabled offline
- User can type and send, gets silent failure
- No offline message/banner

**Fix:** Add offline detection, disable input, show message.

### Medium Priority (Nice to have)

#### 4. LoveLog — Could Use Cached Vocab
**File:** `LoveLog.tsx`

- Always fetches from Supabase
- Fails completely offline
- Could easily show cached words read-only

**Fix:** Fall back to `getCachedVocabulary()` when offline.

#### 5. XP Increment Calls
`geminiService.incrementXP()` called in 5 places, all fail silently offline.

**Recommendation:** Accept XP loss for MVP. Game session sync can recalculate XP on server.

### Low Priority (Post-MVP)

#### 6. Challenge Completion
`PlayQuickFireChallenge.tsx` and `PlayQuizChallenge.tsx` call `/api/submit-challenge`.

**Recommendation:** Show "complete challenges while online" message. Partner features are inherently online.

---

## Revised Task List

| # | Task | File(s) | Priority | Time |
|---|------|---------|----------|------|
| 1 | Add offline check to score updates | `FlashcardGame.tsx:318` | High | 30 min |
| 2 | Queue game sessions for sync | `FlashcardGame.tsx`, `services/offline.ts` | High | 1 hour |
| 3 | Add word_scores caching | `services/offline.ts` | High | 45 min |
| 4 | Implement sync on reconnect | `services/offline.ts` | High | 1.5 hours |
| 5 | Disable chat input when offline | `ChatArea.tsx` | High | 30 min |
| 6 | LoveLog offline fallback | `LoveLog.tsx` | Medium | 30 min |
| 7 | Testing | — | High | 1 hour |
| | **Total** | | | **5-6 hours** |

---

## Changelog

- **2026-02-04 (v3):** Final review. Found additional gaps: game session saving, ChatArea offline handling, LoveLog fallback. Corrected that score updates are in FlashcardGame.tsx (not useScoreTracking hook which is unused). Revised estimate to 5-6 hours.
- **2026-02-04 (v2):** Revised after discovering existing infrastructure. Reduced scope from 10-16 hours to 3-5 hours. Removed unnecessary IndexedDB migration and new file creation.
- **2026-02-04 (v1):** Initial plan (did not audit existing code).
