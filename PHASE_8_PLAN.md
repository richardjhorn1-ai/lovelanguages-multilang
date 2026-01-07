# Phase 8: Codebase Integrity & Cleanup Plan

**Created:** January 7, 2026
**Status:** Partially Complete (9/16 phases done)
**Last Updated:** January 7, 2026
**Goal:** Clean, consistent codebase ready for production deployment

## Completion Summary

| Phase | Status | Description |
|-------|--------|-------------|
| 8.1 | ✅ Complete | Dead Code Removal |
| 8.2 | ✅ Complete | Debug Flag Standardization |
| 8.3 | ✅ Complete | Code Deduplication |
| 8.4 | ✅ Complete | TODO Resolution (legacy modes removed) |
| 8.5 | ✅ Complete | API Error Response Standardization |
| 8.6 | ⬜ Pending | Auth Logging Standardization |
| 8.7 | ⬜ Deferred | Onboarding Theme Cleanup |
| 8.8 | ✅ Complete | Level Test Theme Fix |
| 8.9 | ✅ Complete | Create Quiz Word Validation Bug |
| 8.10 | ⬜ Pending | Tutor Word Entry UX |
| 8.11 | ⬜ Deferred | Audio Feedback System |
| 8.12 | ✅ Complete | Notification Count Bug Fix |
| 8.13 | ⬜ Pending | Conversation Practice AI Speaks First |
| 8.14 | ✅ Complete | Love Package Completion Bug |
| 8.15 | ⬜ Pending | Profile Photo Upload Feature |
| 8.16 | ⬜ Pending | Game Quit Functionality |

---

## Overview

This plan addresses all inconsistencies discovered during the codebase audit, organized into testable sub-phases. Each phase has clear success criteria.

---

## Phase 8.1: Dead Code Removal ✅

**Time Estimate:** 5 minutes
**Risk:** Low (unused files)

### Files to Delete

| File | Size | Reason |
|------|------|--------|
| `components/ListenMode.tsx` | 589 lines | Functionality moved to ChatArea.tsx, no imports |
| `schema.sql` | 0 bytes | Empty file |
| `db_schema.sql` | 16 bytes | Corrupted/binary garbage |
| `supabase_schema.sql` | 16 bytes | Corrupted/binary garbage |

### Verification Steps

```bash
# Before deletion - verify ListenMode isn't imported
grep -r "ListenMode" --include="*.tsx" --include="*.ts" .
# Should only show the file itself and TROUBLESHOOTING.md references

# Delete files
rm components/ListenMode.tsx
rm schema.sql db_schema.sql supabase_schema.sql

# Verify build still works
npx tsc --noEmit && npm run build
```

### Success Criteria
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` succeeds
- [x] No runtime errors on app load

---

## Phase 8.2: Debug Flag Standardization ✅

**Time Estimate:** 2 minutes
**Risk:** Low (logging only)

### Changes Required

| File | Line | Current | Change To |
|------|------|---------|-----------|
| `services/live-session.ts` | 29 | `const DEBUG = false;` | `const DEBUG = import.meta.env.DEV;` |

### Verification Steps

```bash
# After change
npx tsc --noEmit

# Manual test: Run `npm run dev`, use voice mode
# Verify debug logs appear in console
# Run `npm run build && npm run preview`
# Verify NO debug logs in production build
```

### Success Criteria
- [x] Debug logs appear in development mode
- [x] No debug logs in production build
- [x] Voice mode still functions correctly

---

## Phase 8.3: Code Deduplication ✅

**Time Estimate:** 5 minutes
**Risk:** Low (utility function)

### Duplicate to Remove

| Location | Action |
|----------|--------|
| `components/hero/demoData.ts:30-37` | Remove `shuffleArray` function |
| `components/hero/demoData.ts:1` | Add import from `utils/array` |

### Changes

```typescript
// components/hero/demoData.ts

// ADD this import at top:
import { shuffleArray } from '../../utils/array';

// REMOVE lines 29-37:
// // Helper to shuffle array
// export const shuffleArray = <T>(array: T[]): T[] => {
//   const shuffled = [...array];
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled;
// };

// UPDATE the export to re-export if needed externally:
export { shuffleArray } from '../../utils/array';
```

### Verification Steps

```bash
npx tsc --noEmit && npm run build

# Manual test: Load landing page, verify GameShowcase works
# (Multiple choice options should be shuffled)
```

### Success Criteria
- [x] Build passes
- [x] Landing page GameShowcase functions correctly
- [x] Only one shuffleArray implementation exists

---

## Phase 8.4: TODO Resolution ✅

**Time Estimate:** 15-30 minutes
**Risk:** Medium (database query, feature decision)

### TODO 1: Legacy Chat Mode Migration (`api/chat.ts:493`)

**Current Code:**
```typescript
// TODO: Remove after confirming no 'chat'/'tutor' entries exist in database
```

**Resolution Steps:**

1. **Query database to check for legacy modes:**
```sql
-- Run in Supabase SQL Editor
SELECT mode, COUNT(*) FROM chats GROUP BY mode;

-- If 'chat' or 'tutor' exist:
UPDATE chats SET mode = 'ask' WHERE mode = 'chat';
UPDATE chats SET mode = 'coach' WHERE mode = 'tutor';
```

2. **If no legacy modes exist:** Remove the TODO comment and legacy mapping code
3. **If legacy modes exist:** Run migration, verify, then remove code

### TODO 2: Photo Upload (`components/onboarding/steps/student/PhotoStep.tsx:47`)

**Decision Required:**
- Option A: Implement photo upload with Supabase Storage
- Option B: Remove PhotoStep from onboarding flow entirely

**Recommendation:** Option B (simpler) - Remove PhotoStep if photos aren't being used anywhere in the app.

**To check if photos are used:**
```bash
grep -r "couplePhotoUrl\|avatar_url\|PhotoStep" --include="*.tsx" --include="*.ts" .
```

### Success Criteria
- [x] No TODO comments remain in production code (legacy mode mapping removed)
- [x] Database has no legacy 'chat'/'tutor' mode entries (confirmed via query)
- [ ] PhotoStep either works or is removed (deferred to Phase 8.15)

---

## Phase 8.5: API Error Response Standardization ✅

**Time Estimate:** 20 minutes
**Risk:** Medium (affects error handling)

### Issues to Fix

#### 1. `api/gladia-token.ts:125-128`
**Current:**
```typescript
return res.status(500).json({
  error: 'Failed to initialize Listen Mode',
  details: errorText  // Non-standard field
});
```
**Change to:**
```typescript
return res.status(500).json({
  error: `Failed to initialize Listen Mode: ${errorText}`
});
```

#### 2. `api/submit-game-session.ts:159-164`
**Current:**
```typescript
return res.status(200).json({
  success: true,
  sessionId: session.id,
  session,
  answersError: 'Session saved but detailed answers failed to save'
});
```
**Change to:**
```typescript
// Log the partial failure but don't confuse frontend
console.error('Answers save failed:', answersError);
return res.status(200).json({
  success: true,
  sessionId: session.id,
  session,
  warning: 'Session saved but detailed answers may be incomplete'
});
```

#### 3. Document `retryable` field usage
Add comment in `api/analyze-history.ts` and `api/polish-transcript.ts`:
```typescript
// Note: retryable: true signals frontend to offer retry option
return res.status(502).json({
  error: 'AI service error',
  retryable: true
});
```

### Verification Steps
```bash
npx tsc --noEmit && npm run build

# Manual test each affected endpoint:
# - Listen Mode error handling
# - Game session save with simulated error
```

### Success Criteria
- [x] All error responses use `{ error: string }` as primary format
- [x] No `details` field in error responses
- [x] `warning` field used for non-fatal issues (optional)

---

## Phase 8.6: Auth Logging Standardization ⬜

**Time Estimate:** 15 minutes
**Risk:** Low (logging only)

### Files Needing `console.error` in verifyAuth

Add logging to these files when auth fails:

```typescript
// Pattern to add after: if (error || !user) {
if (error || !user) {
  console.error('Auth verification failed:', error?.message || 'No user');
  return null;
}
```

**Files to update:**
- `api/validate-answer.ts`
- `api/generate-level-test.ts`
- `api/submit-level-test.ts`
- `api/get-challenges.ts`
- `api/start-challenge.ts`
- `api/submit-challenge.ts`
- `api/get-word-requests.ts`
- `api/complete-word-request.ts`
- `api/create-word-request.ts`
- `api/get-game-history.ts`
- `api/submit-game-session.ts`
- `api/increment-xp.ts`
- `api/progress-summary.ts`
- `api/unlock-tense.ts`
- `api/validate-word.ts`

### Success Criteria
- [ ] All API files log auth failures
- [ ] Build passes
- [ ] Auth failures appear in Vercel logs

---

## Phase 8.7: Onboarding Theme Cleanup (Optional)

**Time Estimate:** 30-45 minutes
**Risk:** Low (visual only)
**Priority:** Low - can defer to post-launch

### Files with Hardcoded Colors

These files use hardcoded colors instead of CSS variables:

**Tutor Steps:**
- `TeachingStyleStep.tsx` - teal-100, teal-300, teal-50
- `RelationStep.tsx` - teal-100, teal-300, teal-50
- `OriginStep.tsx` - teal-100, teal-300, teal-50
- `PolishConnectionStep.tsx` - teal-100, teal-300, teal-50
- `DreamPhraseStep.tsx` - teal-100
- `TutorStartStep.tsx` - amber-100, purple-100, teal-100
- `TutorPreviewStep.tsx` - amber-100, purple-100

**Student Steps:**
- `StartStep.tsx` - amber-100, teal-100, purple-100
- `FearStep.tsx` - purple-300, purple-50
- `TimeStep.tsx` - blue-100, blue-300, blue-50
- `GoalStep.tsx` - amber-100, amber-300, amber-50
- `WhyStep.tsx` - amber-100
- `PriorStep.tsx` - teal-300, teal-50
- `CelebrationStep.tsx` - amber-100

**Recommended Approach:**
Replace with CSS variable pattern:
```tsx
// Before:
className="bg-teal-100"

// After:
className="bg-[var(--accent-light)]"
// OR use accentHex with opacity:
style={{ backgroundColor: `${accentHex}15` }}
```

### Success Criteria
- [ ] Onboarding steps use theme colors
- [ ] Dark mode looks correct in onboarding
- [ ] No hardcoded color values in onboarding

---

## Execution Order

### Required for Production (Do First)

1. **Phase 8.1** - Dead Code Removal (5 min)
2. **Phase 8.2** - Debug Flag Fix (2 min)
3. **Phase 8.3** - Code Deduplication (5 min)
4. **Phase 8.4** - TODO Resolution (15-30 min)
5. **Phase 8.5** - API Error Standardization (20 min)

**Subtotal: ~1 hour**

### Recommended for Production

6. **Phase 8.6** - Auth Logging (15 min)

### Optional (Can Defer)

7. **Phase 8.7** - Onboarding Theming (30-45 min)

---

## Verification Checklist (After All Phases)

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Production build
npm run build

# 3. Local dev test
npm run dev
# Test: Chat, Voice Mode, Listen Mode, Games, Progress

# 4. Full integration test
vercel dev
# Test all user journeys from FINAL_PHASES.md Phase 9
```

### Final Success Criteria

- [ ] Zero TypeScript errors
- [ ] Production build under 1.5MB
- [ ] All user journeys functional
- [ ] No console errors in production
- [ ] Debug logs only appear in development
- [ ] No TODO/FIXME comments in production code

---

## Phase 8.8: Level Test Theme Fix ✅

**Time Estimate:** 15 minutes
**Risk:** Low (visual only)
**Completed:** January 7, 2026

### Problem

`LevelTest.tsx` uses hardcoded colors that don't respect dark mode or theme settings:
- `bg-[#fdfcfd]` (hardcoded background)
- `bg-white`, `text-gray-800`, `text-gray-500` (no CSS variables)
- `bg-gray-50`, `bg-gray-100` (hardcoded)

### Files to Fix

| File | Lines | Issue |
|------|-------|-------|
| `components/LevelTest.tsx` | 143, 162, 207 | `bg-[#fdfcfd]` hardcoded |
| `components/LevelTest.tsx` | Multiple | `bg-white`, `text-gray-*` instead of CSS vars |

### Changes

```tsx
// Replace hardcoded colors with CSS variables:
bg-[#fdfcfd]      → bg-[var(--bg-primary)]
bg-white          → bg-[var(--bg-card)]
text-gray-800     → text-[var(--text-primary)]
text-gray-500     → text-[var(--text-secondary)]
text-gray-400     → text-[var(--text-secondary)]
bg-gray-50        → bg-[var(--bg-primary)]
bg-gray-100       → bg-[var(--bg-primary)]
border-gray-100   → border-[var(--border-color)]
```

### Success Criteria
- [x] Level Test looks correct in light mode
- [x] Level Test looks correct in dark mode
- [x] All theme accents apply correctly

---

## Phase 8.9: Create Quiz Word Validation Bug Fix ✅

**Time Estimate:** 30-45 minutes
**Risk:** Medium (feature fix)

### Problem

When tutors add new words in CreateQuizChallenge, the words are NOT validated or corrected:
1. Frontend sends `newWords` array in request body
2. **BUG:** Backend (`api/create-challenge.ts:89`) ignores `newWords` entirely
3. Words are stored as-is without spelling correction

### Root Cause

```typescript
// api/create-challenge.ts line 89
const { challengeType, title, config, wordIds } = req.body;
// ❌ Missing: newWords is not extracted!
```

### Solution

1. **Extract `newWords` from request body**
2. **Validate each new word via AI** (similar to `validate-word.ts` logic)
3. **Store corrected words in `words_data`**
4. **Return corrections to frontend for tutor review**

### Implementation

```typescript
// api/create-challenge.ts

// Line 89 - Extract newWords
const { challengeType, title, config, wordIds, newWords } = req.body;

// After fetching existing words, process new words
if (newWords && newWords.length > 0) {
  // Validate each new word with AI
  for (const nw of newWords) {
    const validated = await validateWord(nw.polish, nw.english);
    wordsData.push({
      word: validated.word,
      translation: validated.translation,
      word_type: validated.word_type || 'phrase',
      // No id - these are new words
    });
  }
}
```

### Success Criteria
- [x] New words in quiz are validated/corrected
- [ ] Tutor sees corrected spelling before sending (deferred - requires UI update)
- [x] Student receives correctly spelled words
- [x] Words are added to student's Love Log after completion

**Implementation Note:** Words are now created in student's dictionary via `api/create-challenge.ts`. Full validation UI deferred to Phase 8.10.

---

## Phase 8.10: Tutor Word Entry UX Improvement ⬜

**Time Estimate:** 45 minutes
**Risk:** Medium (UX change)

### Problem

Current flow requires tutor to enter BOTH Polish AND English when adding words. Users want:
1. Enter Polish word only
2. English translation auto-generates
3. Option to review/edit before adding

### Affected Components

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| `CreateQuizChallenge.tsx` | Two inputs (Polish + English) | Polish input → Generate button → Review |
| `WordRequestCreator.tsx` (custom mode) | Two inputs | Polish input → Auto-generate → Edit option |

### Implementation Approach

```tsx
// New flow for adding words:
1. Input: Polish word only
2. Button: "Generate Translation"
3. Show: Generated English + word type + pronunciation
4. Allow: Edit translation before adding
5. Button: "Add to Quiz/Package"
```

### API Enhancement

Create or extend `validate-word.ts` to:
- Accept Polish only (no English required)
- Return: corrected Polish, generated English, word_type, pronunciation

### Success Criteria
- [ ] Tutor can enter Polish only
- [ ] English auto-generates with option to edit
- [ ] Word type detected automatically
- [ ] Pronunciation guide shown

---

## Phase 8.11: Audio Feedback System

**Time Estimate:** 1-2 hours
**Risk:** Low (new feature, additive)

### Problem

No audio feedback when users get answers correct/incorrect. Missing reward sounds diminish gamification.

### Sounds Needed

| Event | Sound | Notes |
|-------|-------|-------|
| Correct answer | Cheerful chime | Short, satisfying |
| Wrong answer | Soft "bonk" | Not harsh/punishing |
| Streak milestone (5) | Celebration | Slightly longer |
| Level up | Fanfare | More elaborate |
| Game complete | Success | Upbeat |
| XP gained | Coin/sparkle | Subtle |

### Implementation Approach

```typescript
// services/sound.ts
const sounds = {
  correct: new Audio('/sounds/correct.mp3'),
  wrong: new Audio('/sounds/wrong.mp3'),
  streak: new Audio('/sounds/streak.mp3'),
  levelUp: new Audio('/sounds/level-up.mp3'),
  complete: new Audio('/sounds/complete.mp3'),
  xp: new Audio('/sounds/xp.mp3'),
};

export const playSound = (sound: keyof typeof sounds) => {
  // Check user preference (add to profile settings)
  if (userPrefersSounds) {
    sounds[sound].currentTime = 0;
    sounds[sound].play().catch(() => {}); // Ignore autoplay errors
  }
};
```

### Files to Update

| File | Integration Points |
|------|-------------------|
| `FlashcardGame.tsx` | Correct/wrong answers, streaks, completion |
| `PlayQuizChallenge.tsx` | Answer feedback, completion |
| `PlayQuickFireChallenge.tsx` | Answer feedback, time warning, completion |
| `LevelTest.tsx` | Completion, pass/fail |
| `Progress.tsx` | Level up notification |
| `ProfileView.tsx` | Sound toggle setting |

### Sound Sources

- Use royalty-free sounds from:
  - freesound.org
  - mixkit.co
  - Or generate with AI (ElevenLabs, etc.)
- Keep files small (<50KB each)
- Format: MP3 (best compatibility)

### User Settings

Add to `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN sound_enabled BOOLEAN DEFAULT true;
```

### Success Criteria
- [ ] Sounds play on correct/wrong answers
- [ ] Sounds play on streaks and level ups
- [ ] User can toggle sounds on/off in settings
- [ ] Sounds don't block gameplay (async)
- [ ] Works on mobile browsers

---

## Phase 8.12: Notification Count Bug Fix ✅

**Time Estimate:** 5 minutes
**Risk:** Low (simple state fix)
**Completed:** January 7, 2026

### Problem

When dismissing a notification, the unread count badge doesn't update. User must refresh the page to see correct count.

### Root Cause

In `Navbar.tsx:130-137`, `dismissNotification` removes the notification from the array but doesn't decrement `unreadCount`:

```typescript
const dismissNotification = async (notificationId: string) => {
  await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  setNotifications(prev => prev.filter(n => n.id !== notificationId));
  // ❌ Missing: unreadCount not updated!
};
```

### Solution

```typescript
const dismissNotification = async (notificationId: string) => {
  // Check if notification was unread before dismissing
  const notification = notifications.find(n => n.id === notificationId);
  const wasUnread = notification && !notification.read_at;

  await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  setNotifications(prev => prev.filter(n => n.id !== notificationId));

  // Decrement count if dismissed notification was unread
  if (wasUnread) {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }
};
```

### Success Criteria
- [x] Dismissing unread notification decrements badge
- [x] Dismissing already-read notification doesn't change badge
- [x] Badge shows correct count after multiple dismissals

---

## Phase 8.13: Conversation Practice - AI Speaks First ⬜

**Time Estimate:** 30 minutes
**Risk:** Medium (API behavior change)

### Problem

In Conversation Practice (voice scenarios), the user must speak first. The AI should initiate the conversation based on its role (waiter, taxi driver, etc.).

### Current Behavior

1. User selects scenario (e.g., "Café")
2. Connection established
3. System prompt says "START THE CONVERSATION"
4. **But:** Code immediately starts listening for user audio
5. AI waits for user to speak first

### Root Cause

In `services/live-session.ts:141-146`:
```typescript
log('SDK session connected, starting audio...');
this.setState('listening');

// Immediately starts recording user audio
this.audioRecorder = new AudioRecorder();
await this.startListening();
```

The AI never receives a trigger to start speaking.

### Solution

After connection, send an initial text message to prompt the AI to speak first:

```typescript
// services/live-session.ts - after session connected

log('SDK session connected');

// For conversation scenarios, prompt AI to start the conversation
if (this.config.mode === 'conversation' && this.config.conversationScenario) {
  log('Conversation mode: prompting AI to start...');

  // Send text prompt to trigger AI's opening line
  await this.session.sendClientContent({
    turns: [{
      role: 'user',
      parts: [{ text: '[The customer/visitor has just arrived. Begin the conversation in Polish as instructed.]' }]
    }],
    turnComplete: true
  });

  this.setState('speaking'); // AI will respond first
} else {
  this.setState('listening');
}

// Then initialize audio recorder
this.audioRecorder = new AudioRecorder();
await this.startListening();
```

### Alternative Approach

Use Gemini's `generationConfig.responseModalities` with `AUDIO` to ensure the model auto-generates audio on connection. The system prompt already instructs it to start - we may just need to give it a moment before starting user audio capture.

### Success Criteria
- [ ] AI speaks first when conversation starts
- [ ] AI greeting matches scenario (waiter says "Dzień dobry, co podać?")
- [ ] User can then respond naturally
- [ ] Works for all 8 conversation scenarios

---

## Phase 8.14: Love Package Completion Bug Fix ✅

**Time Estimate:** 30-45 minutes
**Risk:** Medium (affects word saving and UX)
**Completed:** January 7, 2026

### Problems Reported

1. Words aren't adding properly to Love Log
2. After completion, user is taken back to popup instead of closing
3. Love Package doesn't get removed from word gifts section

### Root Causes Found

#### Issue 1: Silent API failure in `WordGiftLearning.tsx:40-47`

```typescript
const data = await response.json();
if (data.success) {
  setResult(data);
}
// ❌ BUG: No else clause - if success is false, nothing happens
// User sees loading forever with no feedback
```

**Fix:**
```typescript
const data = await response.json();
if (data.success) {
  setResult(data);
} else {
  // Show error to user
  alert(data.error || 'Failed to save words. Please try again.');
  setCompleting(false);
}
```

#### Issue 2: Silent word skipping in `api/complete-word-request.ts:218-221`

```typescript
if (dictError) {
  console.error('Error adding word:', dictError);
  continue;  // ❌ Silently skips failed words
}
```

**Fix:** Track failed words and return them in response:
```typescript
const failedWords: string[] = [];
// ...
if (dictError) {
  console.error('Error adding word:', dictError);
  failedWords.push(word.word);
  continue;
}
// ...
return res.status(200).json({
  success: true,
  wordsAdded: addedWords.length,
  wordsFailed: failedWords.length,
  failedWords: failedWords.length > 0 ? failedWords : undefined,
  // ...
});
```

#### Issue 3: Missing `dictionary-updated` event

When Love Package completes, LoveLog doesn't know new words were added.

**Fix in `WordGiftLearning.tsx` after success:**
```typescript
if (data.success) {
  setResult(data);
  // Dispatch event so LoveLog refreshes
  window.dispatchEvent(new CustomEvent('dictionary-updated', {
    detail: { count: data.wordsAdded, source: 'love-package' }
  }));
}
```

#### Issue 4: Potential upsert conflict

The upsert uses `onConflict: 'user_id,word'` but the `word` is lowercased. If the same word exists with different casing, it might fail.

**Verify:** Check if `dictionary` table has proper unique constraint:
```sql
-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'dictionary'::regclass;
```

### Files to Update

| File | Changes |
|------|---------|
| `components/WordGiftLearning.tsx` | Add error handling, dispatch dictionary-updated event |
| `api/complete-word-request.ts` | Track and report failed words |

### Testing

1. Send a Love Package from tutor account
2. Open on student account
3. Complete all words
4. Verify:
   - [ ] Modal closes after clicking "Done"
   - [ ] Words appear in Love Log immediately
   - [ ] Love Package removed from pending gifts
   - [ ] XP is awarded correctly
   - [ ] If any words fail, user sees which ones

### Success Criteria
- [x] API failures show error message to user
- [x] All words are added to Love Log
- [x] Love Log auto-refreshes after completion (via `dictionary-updated` event)
- [x] Completed packages removed from pending list
- [ ] Failed words are reported to user (partial - logged server-side)

---

## Phase 8.15: Profile Photo Upload Feature ⬜

**Time Estimate:** 45-60 minutes
**Risk:** Medium (new feature, Supabase Storage)

### Feature Requirements

1. **Onboarding PhotoStep**: Upload photo with crop/resize/center
2. **Profile View**: Click profile image to change it
3. **Storage**: Use Supabase Storage for images
4. **Display**: Show profile photo in Navbar, Profile, and anywhere user info appears

### Implementation

#### 1. Supabase Storage Setup
```sql
-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- RLS policy: users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policy: avatars are publicly readable
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### 2. Image Crop Component
Use `react-image-crop` or `react-easy-crop` library:
```bash
npm install react-easy-crop
```

```tsx
// components/ImageCropper.tsx
import Cropper from 'react-easy-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // 1 for square profile pics
}
```

#### 3. PhotoStep Enhancement
```tsx
// components/onboarding/steps/student/PhotoStep.tsx
- File input to select image
- ImageCropper modal for crop/resize
- Upload to Supabase Storage
- Return public URL via onNext(url)
```

#### 4. Profile Photo in ProfileView
```tsx
// components/ProfileView.tsx
- Make avatar clickable
- Open same ImageCropper modal
- Update profile.avatar_url on save
```

#### 5. Update Profile Type
```typescript
// types.ts - avatar_url already exists!
interface Profile {
  avatar_url?: string;  // ✓ Already defined
  // ...
}
```

### Files to Create/Update

| File | Action |
|------|--------|
| `components/ImageCropper.tsx` | **CREATE** - Reusable crop component |
| `components/onboarding/steps/student/PhotoStep.tsx` | **UPDATE** - Implement upload |
| `components/ProfileView.tsx` | **UPDATE** - Add click to change |
| `components/Navbar.tsx` | **UPDATE** - Show avatar if exists |
| `migrations/013_avatar_storage.sql` | **CREATE** - Storage bucket setup |

### Success Criteria
- [ ] User can upload photo in onboarding with crop
- [ ] Photo saved to Supabase Storage
- [ ] Profile shows uploaded photo
- [ ] User can change photo from profile
- [ ] Navbar shows avatar thumbnail

---

## Phase 8.16: Game Quit Functionality

**Time Estimate:** 30-45 minutes
**Risk:** Low (UX improvement)

### Problem

Users cannot quit mid-game in all game modes. Some modes trap users until completion.

### Current State

| Game Mode | Quit Option | Status |
|-----------|-------------|--------|
| Flashcard | ✅ Back button in header | OK |
| Multiple Choice | ✅ Back button | OK |
| Type It | ✅ Back button | OK |
| AI Challenge | ❌ No quit during challenge | **NEEDS FIX** |
| Quick Fire | ⚠️ Timer-based, no pause | **NEEDS FIX** |
| Verb Mastery | ❌ No quit during | **NEEDS FIX** |
| PlayQuizChallenge | ✅ X button (but asks no confirm) | OK |
| PlayQuickFireChallenge | ⚠️ Only visible on countdown | **NEEDS FIX** |

### Implementation

Add consistent quit functionality:
1. **Header with quit button** in all game states
2. **Confirmation dialog** ("Quit game? Progress will be lost")
3. **Clean state reset** on quit

```tsx
// Reusable quit confirmation component
const QuitConfirmDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-[var(--bg-card)] p-6 rounded-2xl max-w-sm">
      <h3 className="font-bold text-lg mb-2">Quit Game?</h3>
      <p className="text-[var(--text-secondary)] mb-4">
        Your progress in this session won't be saved.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 bg-[var(--bg-primary)] rounded-xl font-bold">
          Keep Playing
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold">
          Quit
        </button>
      </div>
    </div>
  </div>
);
```

### Files to Update

| File | Changes Needed |
|------|---------------|
| `FlashcardGame.tsx` | Add quit to AI Challenge, Verb Mastery modes |
| `PlayQuickFireChallenge.tsx` | Add persistent quit button during gameplay |

### Success Criteria
- [ ] All game modes have quit option
- [ ] Quit shows confirmation dialog
- [ ] State resets cleanly on quit
- [ ] No orphaned game sessions in database

---

## Updated Execution Order

### Required for Production (Do First) - Critical Bugs

1. **Phase 8.1** - Dead Code Removal (5 min)
2. **Phase 8.2** - Debug Flag Fix (2 min)
3. **Phase 8.3** - Code Deduplication (5 min)
4. **Phase 8.4** - TODO Resolution (15-30 min)
5. **Phase 8.5** - API Error Standardization (20 min)
6. **Phase 8.8** - Level Test Theme Fix (15 min)
7. **Phase 8.9** - Create Quiz Word Validation Bug Fix (30-45 min) 🐛
8. **Phase 8.12** - Notification Count Bug Fix (5 min) 🐛
9. **Phase 8.14** - Love Package Completion Bug Fix (30-45 min) 🐛

**Subtotal: ~2.5 hours**

### Recommended for Production - UX Improvements

10. **Phase 8.6** - Auth Logging (15 min)
11. **Phase 8.10** - Tutor Word Entry UX (45 min)
12. **Phase 8.13** - Conversation Practice AI Speaks First (30 min)
13. **Phase 8.15** - Game Quit Functionality (30-45 min)

**Subtotal: ~2 hours**

### Nice to Have (Can Defer)

14. **Phase 8.7** - Onboarding Theming (30-45 min)
15. **Phase 8.11** - Audio Feedback System (1-2 hours)

**Subtotal: ~2.5 hours**

### Total Estimated Time: ~7 hours

---

## Next Steps After Phase 8

Once Phase 8 is complete, proceed to:

1. **Phase 9: Data Routing & Integration Testing** - Full API verification matrix
2. **Phase 10: Stripe Payments** - Subscription system
3. **Phase 11: Security Hardening** - Rate limiting, RLS audit

See `FINAL_PHASES.md` for complete details.
