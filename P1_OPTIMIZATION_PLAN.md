# P1 Cost Optimization Plan

This document outlines the P1 (high impact, non-critical) optimizations identified after completing P0 N+1 fixes. Issues are prioritized by **Impact × Ease** score.

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

### Sprint 1: Quick Wins (1-2 hours)
1. ✅ P1.1 - Limit partner vocab fetch
2. ✅ P1.2 - Optimize progress-summary
3. ✅ P1.3 - Add column selection
4. ✅ P1.4 - Lightweight validate-word mode

### Sprint 2: Consolidation (2-4 hours)
5. ⬜ P2.1 - Move batchSmartValidate to services/
6. ⬜ P2.2 - Investigate chat vs chat-stream (decision only)

### Sprint 3: Architecture (4-8 hours)
7. ⬜ P3.1 - Partner context caching (if needed after Sprint 1)

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
