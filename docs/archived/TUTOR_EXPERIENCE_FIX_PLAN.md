# Tutor Experience Enhancement - Fix Plan

**Created:** 2026-02-02
**Status:** Pending Review

This plan addresses all issues found during the comprehensive code review of the Tutor Experience Enhancement feature.

---

## Phase 1: Critical Fixes (Unblocks Testing)

These issues will cause immediate crashes or completely broken functionality.

### 1.1 Fix LoveNoteComposer Interface Mismatch
**Files:** `components/engagement/LoveNoteComposer.tsx`, `components/tutor/TutorAnalyticsDashboard.tsx`
**Issue:** Component expects `partnerName`, `onClose`, `onSent`, `suggestedCategory` but receives `isOpen`, `senderId`, `recipientId`, `senderName`
**Fix:** Update LoveNoteComposer interface to accept:
```typescript
interface LoveNoteComposerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  onSent?: () => void;
}
```
Remove `senderId`/`recipientId` - component should get these from session/profile.

### 1.2 Add Missing Icons
**File:** `constants/icons.tsx`
**Issue:** `ICONS.BarChart`, `ICONS.Lightbulb`, `ICONS.Send` don't exist
**Fix:** Add imports from @phosphor-icons/react:
```typescript
import { ChartBar, Lightbulb, PaperPlaneTilt } from '@phosphor-icons/react';
// Add to ICONS:
BarChart: createIcon(ChartBar),
Lightbulb: createIcon(Lightbulb),
Send: createIcon(PaperPlaneTilt),
```

### 1.3 Fix TutorGames API Response Path
**File:** `components/TutorGames.tsx:175`
**Issue:** Uses `statsData.stats` but API returns `{ tutor: { stats: {...} } }`
**Fix:** Change to `statsData.tutor?.stats`

### 1.4 Fix TrendCharts Divide by Zero
**File:** `components/tutor/TrendCharts.tsx:86`
**Issue:** When all accuracy values are 0, divides by zero
**Fix:**
```typescript
const nonZeroAccuracy = accuracyValues.filter(v => v > 0);
const avgAccuracy = nonZeroAccuracy.length > 0
  ? Math.round(nonZeroAccuracy.reduce((a, b) => a + b, 0) / nonZeroAccuracy.length)
  : 0;
```

### 1.5 Add try/catch to fetchPartnerProfile
**File:** `components/tutor/TutorAnalyticsDashboard.tsx:94-106`
**Issue:** No error handling - will crash on Supabase query failure
**Fix:** Wrap in try/catch, log error

---

## Phase 2: Type System Fixes

These issues cause TypeScript mismatches and silent failures.

### 2.1 Fix TutorStats Interface (snake_case → camelCase)
**File:** `types.ts:576-584`
**Issue:** Interface uses `teaching_streak` but API returns `teachingStreak`
**Fix:** Update to camelCase to match API:
```typescript
export interface TutorStats {
  challengesCreated: number;
  giftsSent: number;
  perfectScores: number;
  wordsMastered: number;
  teachingStreak: number;
  longestStreak: number;  // Add this missing field
  lastTeachingAt: string | null;
}
```

### 2.2 Add Missing Profile Fields
**File:** `types.ts` (Profile interface)
**Issue:** Missing `tutor_xp` and `tutor_tier`
**Fix:** Add to Profile interface:
```typescript
tutor_xp?: number;
tutor_tier?: number;
```

### 2.3 Fix LoveNote Type to Match DB
**File:** `types.ts:660-667`
**Issue:** Has `template_id` but DB uses `template_category`, `template_text`; missing `read_at`
**Fix:**
```typescript
export interface LoveNote {
  id: string;
  sender_id: string;
  recipient_id: string;
  template_category?: string;
  template_text?: string;
  custom_message?: string;
  read_at?: string | null;
  created_at: string;
}
```

### 2.4 Add Missing ActivityEventType
**File:** `types.ts:627-635`
**Issue:** Missing `'love_note'` type
**Fix:** Add `| 'love_note'` to the union

### 2.5 Fix TutorGames Property Access
**File:** `components/TutorGames.tsx:552-556`
**Issue:** Uses `tutorStats.teaching_streak` (snake_case) after Phase 2.1 changes
**Fix:** Update to `tutorStats.teachingStreak` (camelCase)

---

## Phase 3: Data & Query Fixes

These issues cause incorrect data or missing functionality.

### 3.1 Add Language Filtering to Analytics
**File:** `api/tutor-analytics.ts`
**Issue:** Queries don't filter by `language_code` - multi-language users get wrong data
**Status:** ✅ DEFERRED - Users can only learn one language at a time currently. Added TODO comment in the API file documenting what needs to change if multi-language learning is added.
**Fix (when needed):** Add `.eq('language_code', targetLanguage)` to all relevant queries:
- Line 102-107 (word_scores)
- Line 181-192 (word_scores with dictionary join)
- Line 226-230 (dictionary)
- Line 233-238 (word_scores)
- Line 263-267 (activity_feed)

### 3.2 Add INSERT Policy for tutor_stats
**File:** `migrations/036_tutor_experience_enhancement.sql`
**Issue:** No INSERT policy - tutors can't create initial stats record
**Fix:** Add after line 148:
```sql
CREATE POLICY "tutor_stats_insert" ON tutor_stats
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

### 3.3 Fix URL Construction for Local Dev
**Files:** `api/submit-challenge.ts:383`, `api/create-challenge.ts:179`, `api/create-word-request.ts:197`
**Issue:** Empty string prefix doesn't work in Node.js fetch
**Fix:** Use full URL or internal function call:
```typescript
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;
```

---

## Phase 4: Component Robustness

These fixes improve reliability and error handling.

### 4.1 Add Error States to Components
**Files:** `TutorAnalyticsDashboard.tsx`, `TutorGames.tsx`, `ActivityFeed.tsx`
**Issue:** API failures logged but no user feedback
**Fix:** Add `error` state and display error UI when fetch fails

### 4.2 Add Optional Chaining for Nested Access
**Files:** Multiple
**Fixes:**
- `TutorAnalyticsDashboard.tsx:85`: `data.tutor?.stats`
- `TutorAnalyticsDashboard.tsx:258`: `analytics?.stuck_words?.length`
- `TutorAnalyticsDashboard.tsx:268`: `analytics?.recommendations?.length`
- `ActivityFeed.tsx:74`: `data?.pagination?.hasMore`

### 4.3 Add language-switched Event Listener
**File:** `components/tutor/TutorAnalyticsDashboard.tsx`
**Issue:** Dashboard doesn't refresh when language changes
**Fix:** Add useEffect listener:
```typescript
useEffect(() => {
  const handleLanguageSwitch = () => fetchAnalytics();
  window.addEventListener('language-switched', handleLanguageSwitch);
  return () => window.removeEventListener('language-switched', handleLanguageSwitch);
}, []);
```

### 4.4 Fix Notification Click Navigation
**File:** `components/Navbar.tsx:282-287`
**Issue:** `love_note`, `gift_complete`, `challenge_request` don't navigate
**Fix:** Add navigation handlers for these types

---

## Phase 5: Code Quality & Cleanup

These are improvements for maintainability.

### 5.1 Consolidate Achievement Conditions
**Files:** `api/tutor-award-xp.ts`, `api/check-achievements.ts`
**Issue:** Same achievement conditions duplicated in two files
**Status:** DEFERRED - Duplication is minimal and code is stable. Can consolidate if achievement logic changes.

### 5.2 Add Tier Colors to Constants ✅
**Files:** `constants/levels.ts`, `components/tutor/TutorAnalyticsDashboard.tsx`
**Issue:** Tier colors hardcoded in component
**Fix:** Added `color` property to `TutorTier` interface and `TUTOR_TIERS` constant. Updated dashboard to use `tier.color`.

### 5.3 Extract Date Formatting Utils ✅
**Files:** Multiple components
**Issue:** Same date formatting copy-pasted
**Fix:** Created `utils/date-helpers.ts` with `formatShortDate`, `formatRelativeTime`, `formatLongDate`, `formatMediumDate`, `getDaysUntil`, `getDaysSince`. Components can gradually migrate to use these.

### 5.4 Add Missing Translation Keys
**File:** `i18n/locales/en.json`
**Issue:** ~50+ translation keys using fallback defaults
**Status:** DEFERRED - Fallback defaults work fine. Can add proper keys when doing i18n audit.

### 5.5 Remove Unused Exports ✅
**File:** `constants/levels.ts`
**Issue:** `getAchievementByCode`, `getAchievementsByCategory` never used
**Fix:** Removed both functions - APIs use `ACHIEVEMENT_DEFINITIONS.find()` directly.

---

## Testing Checklist

After each phase, verify:

- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes (ignoring script files)
- [ ] App loads without console errors
- [ ] Tutor can view Progress tab (analytics dashboard)
- [ ] Tutor can view Play tab (streak badge if applicable)
- [ ] Tutor can send Love Note from Progress tab
- [ ] Challenges/word gifts award tutor XP
- [ ] Teaching streak increments on activity

---

## Estimated Scope

| Phase | Files Changed | Complexity |
|-------|---------------|------------|
| Phase 1 | 5 files | Low - straightforward fixes |
| Phase 2 | 3 files | Low - type changes |
| Phase 3 | 5 files | Medium - query modifications |
| Phase 4 | 4 files | Medium - add error handling |
| Phase 5 | 6 files | Low - refactoring |

**Total:** ~15 unique files, mostly small targeted changes

---

## Dependencies

- Phase 2 depends on Phase 1 (can't test types without working components)
- Phase 3 can run in parallel with Phase 2
- Phase 4 depends on Phases 1-2
- Phase 5 can run anytime after Phase 1

---

## Notes

- Migration changes (Phase 3.2) require running the updated SQL in Supabase
- Translation keys (Phase 5.4) can be deferred - fallback defaults work
- The branch situation needs to be resolved before merging to main
