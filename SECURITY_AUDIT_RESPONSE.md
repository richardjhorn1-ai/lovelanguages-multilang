# Security Audit Response & Next Steps Plan

## Audit Fixes Completed

### Issues (Actionable Defects) - ALL FIXED

| # | Issue | Status | Verification |
|---|-------|--------|--------------|
| 1 | Unauthenticated answer validation API | FIXED | Added `verifyAuth()` check before Gemini call in `api/validate-answer.ts:94-97` |
| 2 | Chat API lacks method guard | FIXED | Added POST check at `api/chat.ts:218-221`, removed diagnostic endpoint exposure |
| 3 | Unimplemented photo upload | FIXED | Removed misleading button, added "Coming soon" text in `PhotoStep.tsx` |

### Concerns (Security/Operational Risks) - ALL FIXED

| # | Concern | Status | Verification |
|---|---------|--------|--------------|
| 1 | CORS wildcard + credentials | FIXED | Updated `setCorsHeaders()` in all 30 API files - wildcard now excludes credentials |
| 2 | Shared TTS cache | FIXED | Added `userId` to cache key hash in `api/tts.ts:60-64` |
| 3 | Unbounded prompt inputs | FIXED | Added input limits in `api/live-token.ts:203-234` (userName: 50, userLog: 30x200, scenario: 500) |

---

## Remaining Security Gaps (Not in Codex Audit)

### HIGH PRIORITY

#### 1. Open Redirect in Stripe Checkout
**File:** `api/create-checkout-session.ts:145-147`
**Risk:** Client can specify arbitrary `successUrl` / `cancelUrl`, enabling phishing attacks.
```typescript
// Current (vulnerable):
const finalSuccessUrl = successUrl || `${origin}/profile?subscription=success`;

// Fix: Whitelist allowed redirect paths
const ALLOWED_PATHS = ['/profile', '/pricing', '/'];
const parsedUrl = new URL(successUrl, origin);
if (!ALLOWED_PATHS.some(p => parsedUrl.pathname.startsWith(p))) {
  return res.status(400).json({ error: 'Invalid redirect URL' });
}
```

#### 2. Missing Prompt Length Limit in Chat API
**File:** `api/chat.ts`
**Risk:** Unlimited prompt length can cause high API costs and potential denial of service.
```typescript
// Add after body parsing:
const MAX_PROMPT_LENGTH = 10000;
if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
  return res.status(400).json({ error: 'Prompt too long' });
}
```

#### 3. XP Manipulation Risk
**File:** `api/increment-xp.ts:84-88`
**Risk:** Client specifies XP amount (1-100). Malicious client can always send max.
**Mitigation:** Not critical for MVP, but consider server-calculated XP from game results.

### MEDIUM PRIORITY

#### 4. No Rate Limiting
**Risk:** API abuse, cost overruns, potential DoS.
**Solution:** Implement Vercel Edge Config or use `usage_tracking` table that already exists.

#### 5. Error Message Leakage
**Risk:** Some endpoints return raw error messages that may leak internal details.
**Solution:** Sanitize all error responses before returning to client.

#### 6. Code Duplication (verifyAuth)
**Risk:** Security fix requires updating 31 files.
**Note:** Acceptable due to Vercel serverless constraints, but document pattern clearly.

---

## Audit Advice Implementation Status

| Recommendation | Status | Notes |
|----------------|--------|-------|
| Proper auth (JWT) | DONE | Using Supabase JWT via `verifyAuth()` |
| Sanitize all inputs | PARTIAL | Need prompt length limits, done for live-token |
| Handle CORS properly | DONE | Fixed wildcard + credentials issue |
| DDoS protection | EXTERNAL | Configure via Vercel/Cloudflare |
| Firewall / IP filtering | EXTERNAL | Configure at hosting level |
| API key security | ACCEPTABLE | Using env vars; secrets manager is better for production |
| Throttling / Rate limiting | NOT DONE | Priority for next phase |
| Database RLS policies | EXISTS | Verify in Supabase dashboard |
| MFA | NOT DONE | Enable via Supabase Auth settings |
| Secrets manager | NOT DONE | Consider for production |

---

## Next Steps Plan

### Phase 1: Critical Security Hardening - COMPLETED

1. **Fix Open Redirect** in `create-checkout-session.ts` ✅
   - Added `validateRedirectUrl()` function
   - Validates URLs against allowed origins
   - Supports relative paths and absolute URLs
   - Location: Lines 144-180

2. **Add Prompt Length Limits** to `chat.ts` ✅
   - Max 10,000 characters for prompt
   - Max 50 messages in history, each max 5,000 chars
   - Max 50 userLog items, each max 200 chars
   - Location: Lines 256-286

3. **Add Rate Limiting** to `chat.ts` ✅
   - Uses existing `usage_tracking` table
   - Plan-based limits: none=50/day, standard=500/day, unlimited=5000/day
   - Returns 429 with clear error message when exceeded
   - Location: Lines 230-285

### Phase 2: Error Handling & Monitoring (This Week)

1. **Sanitize Error Responses**
   - Create `sanitizeError()` helper
   - Never return raw error.message to client

2. **Add React Error Boundary**
   - Wrap App.tsx children
   - Graceful error UI instead of crash

3. **Set Up Error Monitoring**
   - Consider Sentry or similar
   - Track API failures and client errors

### Phase 3: Infrastructure Security (Before Launch)

1. **Enable DDoS Protection**
   - Vercel DDoS protection (included in Pro)
   - Or Cloudflare in front

2. **Configure Firewall Rules**
   - Block suspicious IPs
   - Geo-restrictions if needed

3. **Review RLS Policies**
   - Audit all Supabase table policies
   - Ensure proper row-level security

4. **Enable MFA Option**
   - Configure in Supabase Auth
   - Optional for users initially

### Phase 4: Code Quality (Post-Launch)

1. **Refactor Large Components**
   - FlashcardGame.tsx (2,243 lines → multiple files)
   - Use `useReducer` for complex state

2. **Extract Custom Hooks**
   - `useAuth()` - centralized auth state
   - `useGame()` - game state management
   - `useVocabulary()` - dictionary operations

3. **Add Pagination**
   - LoveLog vocabulary list
   - Game history

---

## Files Modified in This Audit

### API Files (31 total)
- `api/validate-answer.ts` - Added auth + CORS fix
- `api/chat.ts` - Added POST guard + CORS fix
- `api/tts.ts` - Added user_id to cache + CORS fix
- `api/live-token.ts` - Added input validation + CORS fix
- 27 other API files - CORS fix only

### Component Files (1)
- `components/onboarding/steps/student/PhotoStep.tsx` - Removed misleading UI

---

## Verification Commands

```bash
# TypeScript check (passed)
npx tsc --noEmit

# Build check
npm run build

# Local testing with Stripe
vercel dev
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Summary

**Codex Audit Items:** 6/6 FIXED
**Additional Security Gaps:** 3 HIGH, 3 MEDIUM identified
**TypeScript Status:** PASSING
**Recommended Priority:** Fix open redirect and add prompt limits before launch
