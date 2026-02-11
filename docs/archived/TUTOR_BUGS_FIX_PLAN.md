# Tutor Features Bug Fix Implementation Plan

**Generated:** 2026-02-03
**Total Issues:** 98 (5 Critical, 18 High, 35 Medium, 40 Low)

---

## Phase 1: Critical Race Conditions & Data Integrity (Priority: IMMEDIATE)

### 1.1 Fix Double Submission Race Condition
**Files:** `api/submit-challenge.ts`, `api/complete-word-request.ts`
**Risk:** Double XP awards, duplicate records

**Current Problem:**
```typescript
// Check happens first
if (challenge.status === 'completed') return error;
// ... long processing ...
// Update happens much later - race window!
await supabase.from('tutor_challenges').update({ status: 'completed' });
```

**Fix:** Use atomic update with WHERE clause
```typescript
// submit-challenge.ts - Replace lines 161-177 and 333-339
const { data: updatedChallenge, error: updateError } = await supabase
  .from('tutor_challenges')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', challengeId)
  .eq('status', 'pending')  // Only update if still pending
  .select()
  .single();

if (!updatedChallenge) {
  return res.status(400).json({ error: 'Challenge already completed or not found' });
}
```

**Apply same pattern to:** `complete-word-request.ts` lines 133-135 and 234-241

---

### 1.2 Fix Concurrent Fetch Race Condition
**File:** `components/tutor/TutorAnalyticsDashboard.tsx`
**Risk:** Wrong period data displayed

**Fix:** Add request ID tracking
```typescript
// Add state
const [requestId, setRequestId] = useState(0);
const currentRequestRef = useRef(0);

// In fetchAnalytics
const fetchAnalytics = async () => {
  const thisRequest = ++currentRequestRef.current;
  setRequestId(thisRequest);

  // ... fetch logic ...

  // Before setting state, check if this is still the current request
  if (thisRequest !== currentRequestRef.current) return; // Stale request

  setAnalytics(data.analytics);
};
```

---

### 1.3 Fix Stale Closure in Language Switch Handler
**File:** `components/tutor/TutorAnalyticsDashboard.tsx`
**Risk:** Wrong period used after language switch

**Fix:** Remove redundant useEffect (main useEffect already handles it)
```typescript
// DELETE lines 50-54 entirely - the main useEffect already has targetLanguage as dependency
// useEffect(() => {
//   const handleLanguageSwitch = () => fetchAnalytics();
//   window.addEventListener('language-switched', handleLanguageSwitch);
//   return () => window.removeEventListener('language-switched', handleLanguageSwitch);
// }, []);
```

---

### 1.4 Fix N+1 Query with Unchecked Error
**File:** `api/tutor-analytics.ts`
**Risk:** Silent failures, incorrect data

**Fix:** Execute inner query separately and check errors
```typescript
// Replace lines 73-81
const { data: tutorChallengeIds, error: challengeIdsError } = await supabase
  .from('tutor_challenges')
  .select('id')
  .eq('tutor_id', auth.userId);

if (challengeIdsError) {
  console.error('Error fetching tutor challenges:', challengeIdsError);
}

const challengeIdList = tutorChallengeIds?.map(c => c.id) || [];

let challengeResults: any[] = [];
if (challengeIdList.length > 0) {
  const { data } = await supabase
    .from('challenge_results')
    .select('xp_earned')
    .in('challenge_id', challengeIdList);
  challengeResults = data || [];
}
```

---

### 1.5 Fix Cache Key Missing Language
**File:** `components/tutor/TutorAnalyticsDashboard.tsx`
**Risk:** Shows wrong language data after switching

**Fix:**
```typescript
// Change line ~60
const cacheKey = `${period}-${targetLanguage}`;
```

---

## Phase 2: High Priority Fixes (Priority: THIS WEEK)

### 2.1 Add Error States to Components
**Files:** `TutorAnalyticsDashboard.tsx`, `ActivityFeed.tsx`, `LoveNoteComposer.tsx`, `TutorGames.tsx`

**Pattern to implement:**
```typescript
const [error, setError] = useState<string | null>(null);

// In fetch functions
try {
  // ... fetch
} catch (err) {
  setError('Failed to load data. Please try again.');
  console.error('Fetch error:', err);
}

// In render
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
    <p>{error}</p>
    <button onClick={retry} className="underline">Try again</button>
  </div>
)}
```

---

### 2.2 Fix Division by Zero in TrendCharts
**File:** `components/tutor/TrendCharts.tsx`

**Fix line 30:**
```typescript
// Change from:
const x = (index / (data.length - 1 || 1)) * 100;

// To:
const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
```

---

### 2.3 Fix Notification Type Mismatches
**File:** `components/Navbar.tsx`

**Fix getNotificationIcon (lines 142-153):**
```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'challenge': return '🎮';           // Was 'challenge_received'
    case 'challenge_complete': return '🏆';  // Was 'challenge_completed'
    case 'word_request': return '🎁';        // Correct
    case 'gift_complete': return '🎊';       // Correct
    case 'love_note': return '💕';           // Correct
    case 'challenge_request': return '🙋';   // Correct
    default: return '💌';
  }
};
```

**Fix click navigation (lines 282-291 AND 543-548):**
```typescript
onClick={() => {
  if (!notification.read_at) markAsRead(notification.id);
  if (notification.type === 'challenge' ||
      notification.type === 'challenge_complete' ||
      notification.type === 'challenge_request') {
    navigate('/play');
  } else if (notification.type === 'word_request' ||
             notification.type === 'gift_complete') {
    navigate('/play');
  } else if (notification.type === 'love_note') {
    navigate('/progress');
  }
  setIsNotificationsOpen(false);
}}
```

---

### 2.4 Fix Missing Type Definitions
**File:** `types.ts`

**Add to Profile interface (~line 43):**
```typescript
last_practice_at?: string;
nudges_enabled?: boolean;
last_nudge_at?: string;
```

**Add to TutorChallenge interface (~line 420):**
```typescript
language_code?: string;
```

**Add to WordRequest interface (~line 469):**
```typescript
language_code?: string;
```

**Update NotificationType (line 486):**
```typescript
export type NotificationType =
  | 'challenge'
  | 'challenge_complete'
  | 'challenge_request'
  | 'word_request'
  | 'gift_complete'
  | 'love_note';
```

**Add GradedAnswer interface and update ChallengeResult:**
```typescript
export interface GradedAnswer {
  wordId?: string;
  word?: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  correctAnswer: string;
}

export interface ChallengeResult {
  // ... existing fields
  answers: GradedAnswer[];  // Was any[]
}
```

---

### 2.5 Fix TutorGames savePreference Type Mismatch
**File:** `components/TutorGames.tsx`

**Fix getSavePreference (line 201-203):**
```typescript
const getSavePreference = (): 'ask' | 'always' | 'never' => {
  const stored = localStorage.getItem(SAVE_PREF_KEY);
  if (stored === 'always' || stored === 'never') return stored;
  return 'ask';  // Default instead of null
};
```

---

### 2.6 Fix Modal Accessibility
**File:** `components/engagement/LoveNoteComposer.tsx`

**Add escape key handler and backdrop click:**
```typescript
// Add useEffect for escape key
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  document.body.style.overflow = 'hidden';  // Prevent background scroll
  return () => {
    document.removeEventListener('keydown', handleEscape);
    document.body.style.overflow = '';
  };
}, [onClose]);

// Add onClick to backdrop div (line 82)
<div
  className="fixed inset-0 bg-black/50 ..."
  onClick={onClose}  // Add this
>
  <div onClick={(e) => e.stopPropagation()}>  // Prevent closing when clicking modal
```

**Add ARIA attributes:**
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="love-note-title"
>
```

---

### 2.7 Fix Stats Not Refreshing
**File:** `components/tutor/TutorAnalyticsDashboard.tsx`

**Remove the `if (!stats)` check so stats refresh on tab revisit:**
```typescript
// Change lines 107-122 - always fetch stats, not just when null
try {
  const response = await fetch('/api/tutor-stats', {
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    setStats(data.tutor.stats);
  }
} catch (error) {
  console.error('Failed to fetch stats:', error);
}
```

---

### 2.8 Fix Missing Auth Error Handling
**Files:** `ActivityFeed.tsx`, `LoveNoteComposer.tsx`

**Add session check before API calls:**
```typescript
const session = await supabase.auth.getSession();
if (!session.data.session?.access_token) {
  setError('Session expired. Please refresh the page.');
  return;
}
```

---

## Phase 3: Medium Priority Fixes (Priority: NEXT SPRINT)

### 3.1 Add Input Sanitization
**Files:** `api/create-challenge.ts`, `api/create-word-request.ts`

**Import and use sanitizeInput:**
```typescript
import { sanitizeInput } from '../utils/sanitize';

// Sanitize user input
const sanitizedTitle = sanitizeInput(title, 100);
const sanitizedInputText = sanitizeInput(inputText, 500);

// For new words in create-challenge.ts
const wordText = sanitizeInput((w.word || w.polish || ''), 100).toLowerCase().trim();
const translationText = sanitizeInput((w.translation || w.english || ''), 100).trim();
```

---

### 3.2 Add Rate Limiting to Missing Endpoints
**Files:** `api/tutor-analytics.ts`, `api/tutor-stats.ts`, `api/create-word-request.ts`

**Add after auth check:**
```typescript
const sub = await getSubscriptionPlan(supabase, auth.userId);
const limit = await checkRateLimit(supabase, auth.userId, 'analytics', sub.plan);
if (!limit.allowed) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    resetAt: limit.resetAt
  });
}
```

---

### 3.3 Add Missing Error Handling to Supabase Queries
**File:** `api/tutor-analytics.ts`

**Pattern for all queries:**
```typescript
const { data: activityData, error: activityError } = await supabase
  .from('activity_feed')
  .select('...')
  // ...

if (activityError) {
  console.error('Error fetching activity data:', activityError);
  // Continue with empty data rather than failing entirely
}
```

Apply to lines: 73, 85, 95, 119, 143, 187, 232, 239, 269

---

### 3.4 Add Array Length Validation
**Files:** `api/submit-challenge.ts`, `api/create-challenge.ts`

```typescript
// submit-challenge.ts after line 154
if (!answers || !Array.isArray(answers) || answers.length === 0 || answers.length > 100) {
  return res.status(400).json({ error: 'Invalid answers: must be array with 1-100 items' });
}

// create-challenge.ts for wordIds
if (wordIds && wordIds.length > 50) {
  return res.status(400).json({ error: 'Too many words: maximum 50 allowed' });
}
```

---

### 3.5 Add language_code to Database Inserts
**Files:** `api/submit-challenge.ts`, `api/complete-word-request.ts`

```typescript
// submit-challenge.ts line 311-325 - add to challenge_results insert
language_code: targetLanguage,

// complete-word-request.ts line 203-210 - add to gift_words insert
language_code: targetLanguage,
```

---

### 3.6 Fix WeakSpotIntelligence Unbounded Render
**File:** `components/tutor/WeakSpotIntelligence.tsx`

**Add slice to improvingWords (around line 93):**
```typescript
{improvingWords.slice(0, 10).map((word) => (
```

---

### 3.7 Disable Period Buttons During Refresh
**File:** `components/tutor/TutorAnalyticsDashboard.tsx`

**Add disabled prop to period buttons (lines 273-287 and 470-490):**
```typescript
<button
  key={p}
  onClick={() => setPeriod(p)}
  disabled={refreshing}
  className={`... ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
>
```

---

### 3.8 Fix Timezone Inconsistencies
**File:** `api/tutor-analytics.ts`

**Use consistent UTC-based comparisons:**
```typescript
// Cache end date outside loop (line 153)
const endDate = new Date();
for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dateKey = d.toISOString().split('T')[0];
  // ...
}

// Use consistent date comparison
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const isRecent = s.updated_at && new Date(s.updated_at).getTime() > sevenDaysAgo.getTime();
```

---

### 3.9 Add Notification Creation Error Handling
**Files:** `api/create-challenge.ts`, `api/submit-challenge.ts`, `api/send-love-note.ts`, `api/complete-word-request.ts`

**Pattern:**
```typescript
const { error: notificationError } = await supabase.from('notifications').insert({...});
if (notificationError) {
  console.error('Error creating notification:', notificationError);
  // Don't fail the request, notification is non-critical
}
```

---

### 3.10 Fix Achievement Spread Null Issue
**File:** `api/tutor-stats.ts`

**Add null guard (line 118-122):**
```typescript
achievements: achievements?.map(a => ({
  code: a.achievement_code,
  unlockedAt: a.unlocked_at,
  ...(a.achievement || {}),  // Guard against null
})) || [],
```

---

## Phase 4: Low Priority Fixes (Priority: BACKLOG)

### 4.1 Code Cleanup
- Remove unused `useMemo` import from TutorAnalyticsDashboard.tsx ✅ (already done)
- Remove unused `languageParams` destructure from TutorAnalyticsDashboard.tsx
- Remove unused `getTutorTierFromXP` import from tutor-analytics.ts
- Remove unused `partnerId` prop from ActivityFeed.tsx OR implement filtering
- Extract duplicated period selector into a shared component

### 4.2 Accessibility Improvements
- Add `role="tab"` and `aria-selected` to tab buttons
- Add `aria-label` to stat cards in TeachingImpactCard
- Add `role="img"` and `aria-label` to SVG charts in TrendCharts
- Add focus ring styles to all interactive elements
- Add `aria-pressed` to filter buttons in ActivityFeed

### 4.3 Type Safety Improvements
- Add proper VercelRequest/VercelResponse types to API handlers
- Change `any` types to proper interfaces throughout
- Narrow `action_type` in TutorAnalytics to `'challenge' | 'love_note'`

### 4.4 Performance Optimizations
- Parallelize independent database queries in tutor-analytics.ts
- Add query limits to unbounded queries (line 269 activity_feed)
- Consider pagination for large datasets

### 4.5 UX Improvements
- Show remaining love notes count after sending
- Add success feedback before closing LoveNoteComposer
- Add "load more" loading state in ActivityFeed
- Show warning if word gift has 0 words

### 4.6 Configuration Constants
- Extract magic numbers (60 seconds, 5 XP, etc.) into constants
- Make max character lengths shared between client and server
- Extract notification message templates

---

## Testing Checklist

### After Phase 1
- [ ] Rapidly click period buttons - no wrong data shown
- [ ] Submit same challenge twice simultaneously - only one succeeds
- [ ] Complete same word request twice - only one succeeds
- [ ] Switch language then period - correct data shown

### After Phase 2
- [ ] API failure shows error message to user
- [ ] TrendCharts with 1 data point renders correctly
- [ ] Clicking notifications navigates to correct page
- [ ] Love note modal closes with Escape key
- [ ] Love note modal closes when clicking backdrop
- [ ] Background doesn't scroll when modal is open

### After Phase 3
- [ ] Malicious input in challenge title is sanitized
- [ ] Rate limit triggers after excessive requests
- [ ] Empty answers array returns 400 error
- [ ] 100+ word challenge returns 400 error

---

## Estimated Effort

| Phase | Issues | Estimated Time |
|-------|--------|----------------|
| Phase 1 | 5 Critical | 2-3 hours |
| Phase 2 | 18 High | 4-6 hours |
| Phase 3 | 35 Medium | 6-8 hours |
| Phase 4 | 40 Low | 4-6 hours |
| **Total** | **98** | **16-23 hours** |

---

## Files Modified Summary

| File | Phase(s) | Changes |
|------|----------|---------|
| `api/submit-challenge.ts` | 1, 3 | Race condition, validation, language_code |
| `api/complete-word-request.ts` | 1, 3 | Race condition, language_code |
| `api/tutor-analytics.ts` | 1, 3 | Query fixes, error handling, timezone |
| `api/create-challenge.ts` | 3 | Sanitization, validation |
| `api/create-word-request.ts` | 3 | Sanitization, rate limiting |
| `api/tutor-stats.ts` | 2, 3 | Error handling, null guards |
| `components/tutor/TutorAnalyticsDashboard.tsx` | 1, 2, 3 | Cache key, race condition, error state |
| `components/tutor/TrendCharts.tsx` | 2 | Division by zero |
| `components/tutor/WeakSpotIntelligence.tsx` | 3 | Slice improvingWords |
| `components/Navbar.tsx` | 2 | Notification types, navigation |
| `components/TutorGames.tsx` | 2 | Type fix, error handling |
| `components/engagement/ActivityFeed.tsx` | 2 | Error state, auth check |
| `components/engagement/LoveNoteComposer.tsx` | 2 | Modal accessibility |
| `types.ts` | 2 | Missing fields, type updates |
