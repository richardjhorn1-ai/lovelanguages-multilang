# P1 Cost Optimization Plan

This document outlines the P1 (high impact, non-critical) optimizations identified after completing P0 N+1 fixes. Issues are prioritized by **Impact × Ease** score.

---

## NEW: Session Boot Context System

### The Problem

Currently, **every chat message** triggers multiple database queries:
- Tutor sends message → Fetch tutor profile, partner profile, partner vocab, weak spots (4 queries)
- Student sends message → Fetch student profile, vocab context (2+ queries)

This is wasteful because:
1. The data barely changes within a session
2. A user sending 10 messages causes 40 unnecessary database lookups
3. The AI gets the same context info repeated every time

### The Vision

**"Boot" the session once with rich context, then reuse it.**

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT (WASTEFUL)                       │
├─────────────────────────────────────────────────────────────┤
│ Message 1 → Fetch all context → Send to AI                  │
│ Message 2 → Fetch all context AGAIN → Send to AI            │
│ Message 3 → Fetch all context AGAIN → Send to AI            │
│ Message 4 → Fetch all context AGAIN → Send to AI            │
│                                                             │
│ Result: 4× database round-trips, same data each time        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    NEW (EFFICIENT)                          │
├─────────────────────────────────────────────────────────────┤
│ Chat Opens → BOOT: Fetch rich context once → Cache locally  │
│ Message 1 → Use cached context → Send to AI                 │
│ Message 2 → Use cached context → Send to AI                 │
│ Message 3 → Use cached context → Send to AI                 │
│ Message 4 → Use cached context → Send to AI                 │
│                                                             │
│ Result: 1× database round-trip, reused for entire session   │
└─────────────────────────────────────────────────────────────┘
```

### Design: `/api/boot-session` Endpoint

New endpoint called **once** when chat tab loads.

**Request:**
```typescript
POST /api/boot-session
{
  // No body needed - uses auth token to determine role
}
```

**Response for Students:**
```typescript
{
  success: true,
  role: 'student',
  context: {
    // Student's own data
    userId: 'xxx',
    name: 'Richard',
    level: 'Beginner 2',
    xp: 145,

    // Their vocabulary (recent, for AI context)
    vocabulary: [
      { word: 'kocham', translation: 'I love', wordType: 'verb' },
      { word: 'piękna', translation: 'beautiful', wordType: 'adjective' },
      // ... up to 100 recent words
    ],

    // Words they struggle with (high fail rate)
    weakSpots: [
      { word: 'dziękuję', translation: 'thank you', failCount: 5 },
      // ... up to 10 weak words
    ],

    // Learning preferences
    learningGoal: 'Romantic communication',

    // Timestamp for incremental updates later
    bootedAt: '2026-01-07T12:00:00Z'
  }
}
```

**Response for Tutors:**
```typescript
{
  success: true,
  role: 'tutor',
  context: {
    // Tutor's own info
    userId: 'xxx',
    name: 'Michalina',

    // Partner's learning data (what tutors need for coaching)
    partner: {
      userId: 'yyy',
      name: 'Richard',
      level: 'Beginner 2',
      xp: 145,

      // Partner's vocabulary
      vocabulary: [
        { word: 'kocham', translation: 'I love', wordType: 'verb' },
        // ... up to 100 recent words
      ],

      // Partner's weak spots
      weakSpots: [
        { word: 'dziękuję', translation: 'thank you', failCount: 5 },
      ],

      // Recent progress
      wordsLearnedThisWeek: 12,
      lastActive: '2026-01-07T10:30:00Z'
    },

    bootedAt: '2026-01-07T12:00:00Z'
  }
}
```

### Frontend Changes (ChatArea.tsx)

```typescript
// Store context in ref (survives re-renders, doesn't cause re-renders)
const sessionContextRef = useRef<SessionContext | null>(null);
const contextLoadedRef = useRef(false);

// Boot session on mount
useEffect(() => {
  const bootSession = async () => {
    if (contextLoadedRef.current) return; // Already loaded

    const response = await fetch('/api/boot-session', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      sessionContextRef.current = data.context;
      contextLoadedRef.current = true;
    }
  };

  bootSession();
}, []);

// Pass context to chat API calls
const sendMessage = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      chatId,
      mode,
      // NEW: Pass pre-loaded context instead of re-fetching
      sessionContext: sessionContextRef.current
    })
  });
};
```

### Modified Chat Endpoint (chat.ts)

```typescript
export default async function handler(req, res) {
  const { message, chatId, mode, sessionContext } = req.body;

  let context;

  if (sessionContext && sessionContext.bootedAt) {
    // Use pre-loaded context (efficient path)
    context = sessionContext;
  } else {
    // Fallback: Fetch fresh (backwards compatible)
    context = await fetchContextFromDatabase(auth.userId);
  }

  // Use context for AI prompt...
}
```

### When to Re-Boot (Invalidate Cache)

The frontend should re-fetch context when:

1. **User adds words manually** → Their vocabulary changed
2. **Word gift completed** → New words added
3. **Level test passed** → Level changed
4. **Session is old** → After 30 minutes, re-boot
5. **User explicitly refreshes** → Manual override

```typescript
// Listen for events that invalidate context
useEffect(() => {
  const invalidateContext = () => {
    contextLoadedRef.current = false;
    sessionContextRef.current = null;
    bootSession(); // Re-fetch
  };

  window.addEventListener('dictionary-updated', invalidateContext);
  window.addEventListener('level-changed', invalidateContext);

  return () => {
    window.removeEventListener('dictionary-updated', invalidateContext);
    window.removeEventListener('level-changed', invalidateContext);
  };
}, []);
```

---

## NEW: Incremental Progress Summaries

### The Problem

Currently, every progress summary:
1. Downloads ALL vocabulary (could be 1000+ words)
2. Downloads ALL game sessions
3. Re-analyzes everything from scratch

Even if you generated a summary yesterday and only learned 5 new words.

### The Vision

**First summary = Full analysis. Subsequent summaries = Only new stuff.**

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT (WASTEFUL)                       │
├─────────────────────────────────────────────────────────────┤
│ Summary 1 (Jan 1) → Analyze 100 words                       │
│ Summary 2 (Jan 7) → Analyze 120 words (20 new)              │
│ Summary 3 (Jan 14) → Analyze 150 words (30 new)             │
│                                                             │
│ Total analyzed: 100 + 120 + 150 = 370 word-analyses         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    NEW (EFFICIENT)                          │
├─────────────────────────────────────────────────────────────┤
│ Summary 1 (Jan 1) → Full: Analyze 100 words                 │
│ Summary 2 (Jan 7) → Delta: Analyze 20 NEW words only        │
│ Summary 3 (Jan 14) → Delta: Analyze 30 NEW words only       │
│                                                             │
│ Total analyzed: 100 + 20 + 30 = 150 word-analyses           │
│ Savings: 60% less data processed                            │
└─────────────────────────────────────────────────────────────┘
```

### Design Changes

**1. Track last summary timestamp:**

The `progress_summaries` table already has `created_at`. Use the most recent one.

**2. Modified progress-summary.ts:**

```typescript
// Get timestamp of last summary
const { data: lastSummary } = await supabase
  .from('progress_summaries')
  .select('created_at')
  .eq('user_id', auth.userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

const sinceTimestamp = lastSummary?.created_at || null;

if (sinceTimestamp) {
  // INCREMENTAL: Only fetch new data since last summary
  const { data: newVocabulary } = await supabase
    .from('dictionary')
    .select('word, translation, word_type, unlocked_at')
    .eq('user_id', auth.userId)
    .gt('unlocked_at', sinceTimestamp)  // Only NEW words
    .order('unlocked_at', { ascending: false });

  const { data: newGameSessions } = await supabase
    .from('game_sessions')
    .select('...')
    .gt('completed_at', sinceTimestamp);  // Only NEW sessions

  // AI prompt focuses on "what's new since last time"

} else {
  // FULL: First summary ever - analyze everything
  const { data: allVocabulary } = await supabase
    .from('dictionary')
    .select('...')
    .limit(200);  // Still limit for sanity
}
```

**3. AI prompt changes:**

```typescript
// For incremental summaries
const prompt = `
This is a PROGRESS UPDATE since ${formatDate(sinceTimestamp)}.

**New words learned (${newVocabulary.length}):**
${newVocabulary.map(w => `- ${w.word} (${w.translation})`).join('\n')}

**Games played since last summary:**
${gameStats}

Focus on celebrating what's NEW. Don't repeat analysis of old vocabulary.
`;

// For first summary
const prompt = `
This is a FIRST-TIME learning journey summary.

**Total vocabulary (${allVocabulary.length} words):**
...
`;
```

---

## Quick Reference: Priority Matrix

| # | Issue | Impact | Effort | Files | Est. Savings |
|---|-------|--------|--------|-------|--------------|
| 1 | Partner vocab fetch unlimited | HIGH | EASY | 1 | 50% DB on coach msgs |
| 2 | progress-summary excessive fetches | HIGH | EASY | 1 | 50% latency |
| 3 | chat vs chat-stream inconsistency | HIGH | HARD | 2 | 80% token cost OR feature parity |
| 4 | Code duplication (CORS/auth) | LOW | MEDIUM | 25 | Maintainability |
| 5 | SELECT * instead of columns | MEDIUM | EASY | 3+ | Minor DB bandwidth |
| 6 | validate-word always full schema | MEDIUM | EASY | 1 | 50% on simple lookups |
| 7 | Partner context no caching | MEDIUM | HARD | 1 | 3 DB queries/msg |
| 8 | Duplicate batchSmartValidate | LOW | MEDIUM | 3 | Maintainability |

---

## Phase 1: Quick Wins (HIGH Impact × EASY Effort)

### P1.1: Limit Partner Vocabulary Fetch

**File:** `api/chat.ts` line 145

**Problem:**
```typescript
// Fetches ALL partner vocabulary (could be 1000+ words)
const { data: vocabulary } = await supabase
  .from('dictionary')
  .select('id, word, translation, unlocked_at')
  .eq('user_id', learnerId);

// But only uses first 30 in the prompt (line 432)
const vocabList = context.vocabulary.slice(0, 30).join(', ');
```

**Fix:**
```typescript
const { data: vocabulary } = await supabase
  .from('dictionary')
  .select('word, translation')  // Only need these 2 fields
  .eq('user_id', learnerId)
  .order('unlocked_at', { ascending: false })  // Most recent first
  .limit(50);  // Fetch slightly more than needed for variety
```

**Impact:** Reduces DB transfer by ~95% for tutors with large vocabularies

---

### P1.2: Optimize progress-summary.ts Fetches

**File:** `api/progress-summary.ts` lines 159-212

**Problems:**
1. Line 159-163: Fetches ALL vocabulary columns, uses only 4
2. Line 200-203: Fetches ALL game session answers, no limit
3. Line 367-374: Only uses first 100 vocab items after fetching all

**Fixes:**

```typescript
// Problem 1: Excessive columns
// Before:
const { data: vocabulary } = await supabase
  .from('dictionary')
  .select('word, translation, word_type, context, unlocked_at')
  .eq('user_id', auth.userId);

// After:
const { data: vocabulary } = await supabase
  .from('dictionary')
  .select('word, translation, word_type, unlocked_at')  // Remove 'context' (large JSON)
  .eq('user_id', auth.userId)
  .limit(100);  // Only need 100 for prompt anyway

// Problem 2: Unlimited game answers
// Before:
const { data: sessionAnswers } = await supabase
  .from('game_session_answers')
  .select('*')
  .in('session_id', sessionIds);

// After:
const { data: sessionAnswers } = await supabase
  .from('game_session_answers')
  .select('session_id, is_correct, explanation')  // Only needed fields
  .in('session_id', sessionIds);
```

**Impact:** 50%+ latency reduction on progress summary generation

---

### P1.3: Add Column Selection to get-challenges.ts

**File:** `api/get-challenges.ts` lines 85, 114

**Problem:**
```typescript
// Fetches all columns including large JSON fields
const { data: challenges } = await supabase
  .from('tutor_challenges')
  .select('*')
  .eq('student_id', auth.userId);

const { data: results } = await supabase
  .from('challenge_results')
  .select('*')
  .in('challenge_id', completedIds);
```

**Fix:**
```typescript
const { data: challenges } = await supabase
  .from('tutor_challenges')
  .select('id, title, challenge_type, status, created_at, tutor_id, config')
  .eq('student_id', auth.userId);

const { data: results } = await supabase
  .from('challenge_results')
  .select('challenge_id, score, correct_answers, total_questions, completed_at')
  .in('challenge_id', completedIds);
```

---

### P1.4: Add Lightweight Mode to validate-word.ts

**File:** `api/validate-word.ts`

**Problem:** Always generates full conjugation data even for simple "is this a real word?" checks.

**Fix:** Add `lightweight` parameter:

```typescript
// Request body
const { polish, english, lightweight } = req.body;

// If lightweight mode, use minimal schema
const schema = lightweight ? {
  type: Type.OBJECT,
  properties: {
    valid: { type: Type.BOOLEAN },
    word: { type: Type.STRING },
    translation: { type: Type.STRING },
    word_type: { type: Type.STRING }
  },
  required: ['valid', 'word', 'translation', 'word_type']
} : fullSchema;
```

**Impact:** 50% token savings on simple validation checks

---

## Phase 2: Medium Effort Fixes

### P2.1: Consolidate Duplicate batchSmartValidate

**Files:**
- `api/submit-challenge.ts` (lines 48-167)
- `api/submit-level-test.ts` (lines 26-126)
- `api/validate-answer.ts` (separate but similar logic)

**Problem:** Same 100+ line `batchSmartValidate` function duplicated in 3 files.

**Options:**

**Option A: Move to services/ (Recommended)**
```typescript
// services/validation.ts
export interface ValidationResult {
  index: number;
  accepted: boolean;
  explanation: string;
}

export function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}

export async function batchSmartValidate(
  answers: Array<{ userAnswer: string; correctAnswer: string; polishWord?: string }>,
  apiKey: string
): Promise<ValidationResult[]> {
  // Full implementation
}
```

Then in API files:
```typescript
import { batchSmartValidate } from '../services/validation';
```

**Note:** This works because `services/` is outside `api/` - Vercel bundles it correctly.

**Option B: Accept duplication (current state)**
- Pros: No risk of Vercel bundling issues
- Cons: 3× maintenance burden, inconsistency risk

---

### P2.2: Investigate chat.ts vs chat-stream.ts

**Files:**
- `api/chat.ts` - Full featured, vocabulary extraction, ~700 lines
- `api/chat-stream.ts` - Streaming only, NO vocab extraction, ~300 lines

**Current State:**
- `chat.ts` extracts vocabulary with every message (expensive)
- `chat-stream.ts` streams text only (cheap, but no auto vocab learning)

**Questions to Answer:**
1. Which endpoint does the frontend actually use?
2. Is vocabulary extraction on every message necessary?
3. Can we add lightweight extraction to streaming?

**Investigation Steps:**
```bash
# Find which endpoint frontend calls
grep -r "api/chat" src/
grep -r "api/chat-stream" src/
```

**Potential Strategies:**

**A. Unify on streaming + separate extraction**
- Use `chat-stream.ts` for all chat (cheap)
- Call `analyze-history.ts` periodically to extract vocab (batch)
- Savings: ~80% on chat costs

**B. Add flag to chat.ts to skip extraction**
- Add `extractVocab: boolean` parameter
- Default to false for casual chat, true for Learn mode
- Savings: ~70% on Ask mode chats

**C. Keep current state**
- Accept 6× cost difference
- May be acceptable if chat volume is low

**✅ DECISION MADE (Sprint 2.5 - Jan 2025):**
Implemented **Strategy A with hybrid approach**:
- Text-only messages → `chat-stream.ts` (streaming) + `analyze-history.ts` (batch extraction)
- Image messages → `chat.ts` (non-streaming, includes extraction)
- Result: ~80% savings on text chat, full features preserved for images

See `components/ChatArea.tsx` handleSend() for implementation.

---

## Phase 3: Architectural Improvements (HARD)

### P3.1: Client-Side Partner Context Caching

**File:** `api/chat.ts` lines 494, 501

**Problem:** Every coach-mode message fetches:
1. Tutor's profile
2. Partner's profile
3. Partner's vocabulary (50+ items)
4. Partner's weak spots

That's 4 DB queries on every single message.

**Solution Options:**

**A. Add caching endpoint**
```typescript
// New endpoint: /api/partner-context
// Returns cached context, refreshes every 5 minutes
export default async function handler(req, res) {
  const cacheKey = `partner-context:${auth.userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const context = await getPartnerContext(supabase, profile);
  await redis.setex(cacheKey, 300, JSON.stringify(context)); // 5 min TTL
  return res.json(context);
}
```

**B. Frontend caching**
```typescript
// In ChatArea.tsx
const partnerContextRef = useRef<PartnerContext | null>(null);
const contextFetchedAt = useRef<number>(0);

const getPartnerContext = async () => {
  const now = Date.now();
  if (partnerContextRef.current && now - contextFetchedAt.current < 300000) {
    return partnerContextRef.current; // Use cached for 5 min
  }
  const context = await fetchPartnerContext();
  partnerContextRef.current = context;
  contextFetchedAt.current = now;
  return context;
};
```

**C. Include context in chat request (current, but optimize)**
- Reduce context size (already done in P1.1)
- Accept DB cost as necessary

---

## Implementation Order

### Sprint 1: Quick Wins (1-2 hours) ✅ COMPLETE
Simple changes with immediate impact.

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 1.1 | Add `.limit(50)` to partner vocab fetch | `api/chat.ts` | 5 min |
| 1.2 | Add column selection to get-challenges | `api/get-challenges.ts` | 10 min |
| 1.3 | Add lightweight mode to validate-word | `api/validate-word.ts` | 30 min |
| 1.4 | Move batchSmartValidate to services/ | `services/validation.ts`, 3 API files | 45 min |

### Sprint 2: Session Boot System (2-3 hours) ✅ COMPLETE
The big architectural win - fetch context once per session.

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 2.1 | Create `/api/boot-session` endpoint | `api/boot-session.ts` (new) | 45 min |
| 2.2 | Add SessionContext type | `types.ts` | 10 min |
| 2.3 | Integrate boot into ChatArea.tsx | `components/ChatArea.tsx` | 30 min |
| 2.4 | Modify chat.ts to accept sessionContext | `api/chat.ts` | 30 min |
| 2.5 | Add cache invalidation listeners | `components/ChatArea.tsx` | 20 min |
| 2.6 | Test both student and tutor flows | Manual testing | 30 min |

**Savings after Sprint 2:** ~75% reduction in DB queries per chat message

### Sprint 3: Incremental Progress Summaries (1-2 hours) ✅ COMPLETE
Make progress summaries delta-based instead of full re-analysis.

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 3.1 | Detect if first summary vs subsequent | `api/progress-summary.ts` | 15 min |
| 3.2 | Add incremental fetch logic | `api/progress-summary.ts` | 30 min |
| 3.3 | Update AI prompt for delta mode | `api/progress-summary.ts` | 20 min |
| 3.4 | Test first summary + update flows | Manual testing | 30 min |

**Savings after Sprint 3:** ~60% reduction in data processed per summary

### Sprint 4: Investigation & Cleanup (1-2 hours) ✅ COMPLETE
Lower priority improvements.

| # | Task | Files | Status |
|---|------|-------|--------|
| 4.1 | Investigate chat.ts vs chat-stream.ts | Research only | ✅ Done (Sprint 2.5) |
| 4.2 | Document decision on streaming | `P1_OPTIMIZATION_PLAN.md` | ✅ Done |
| 4.3 | Clean up progress-summary.ts fetches | `api/progress-summary.ts` | ✅ Done (Sprint 3) |

**Summary:** All P1 optimizations complete. Streaming decision documented in P2.2 section.

---

## Sprint Checklist

### Before Each Sprint
- [ ] Note current Gemini spend in dashboard
- [ ] Note current Supabase query count
- [ ] Run `npx tsc --noEmit` (baseline)

### After Each Sprint
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Manual test with `vercel dev`
- [ ] Commit changes
- [ ] Note new Gemini spend (after 24-48 hours)
- [ ] Note new query count

---

## Validation Checklist

After each fix:
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Manual test with `vercel dev`
- [ ] Check Gemini dashboard for API call reduction
- [ ] Check Supabase dashboard for query reduction

---

## Cost Tracking

Before implementing, document baseline costs:
- [ ] Current Gemini monthly spend: $____
- [ ] Current Supabase monthly queries: ____
- [ ] Average chat message latency: ____ms

After Sprint 1:
- [ ] Gemini spend reduction: ____%
- [ ] Query reduction: ____%
- [ ] Latency improvement: ____%

---

## Notes

### Vercel Serverless Constraint
Remember: API files cannot import from sibling directories. Only these import patterns work:
- `import x from '../services/x'` ✅ (services/ is outside api/)
- `import x from '../utils/x'` ✅ (utils/ is outside api/)
- `import x from './lib/x'` ❌ (lib/ inside api/ doesn't bundle)

### Testing Strategy
1. Run TypeScript check
2. Run build
3. Test with `vercel dev` locally
4. Deploy to preview branch
5. Monitor costs for 24-48 hours
6. Merge to main if savings confirmed
