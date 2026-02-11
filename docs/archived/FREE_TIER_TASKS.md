# Free Tier Implementation — Task Breakdown

**Branch:** `release/security-analytics` (merge into existing)
**Spec:** `docs/FREE_TIER_SPEC.md`

---

## Phase 1: Free Tier Limits

### Task 1.1: Update Rate Limits (Backend)
**Owner:** Bruno
**File:** `utils/api-middleware.ts`

Update `RATE_LIMITS` object:
```typescript
chat: { type: 'text_messages', monthly: { free: 25, standard: 5000, unlimited: null } },
validateWord: { type: 'word_validations', monthly: { free: 50, standard: 2000, unlimited: null } },
validateAnswer: { type: 'answer_validations', monthly: { free: 75, standard: 3000, unlimited: null } },
tts: { type: 'tts_requests', monthly: { free: 100, standard: 1000, unlimited: null } }, // unchanged
liveToken: { type: 'voice_sessions', monthly: { free: 1, standard: 20, unlimited: null } },
gladiaToken: { type: 'listen_sessions', monthly: { free: 1, standard: 40, unlimited: null } },
generateLevelTest: { type: 'level_tests', monthly: { free: 2, standard: 50, unlimited: null } },
submitLevelTest: { type: 'level_test_submissions', monthly: { free: 4, standard: 100, unlimited: null } },
createChallenge: { type: 'challenge_creations', monthly: { free: 5, standard: 200, unlimited: null } },
submitChallenge: { type: 'challenge_submissions', monthly: { free: 10, standard: 500, unlimited: null } },
```

**Acceptance criteria:**
- [ ] All free limits updated as specified
- [ ] Build passes
- [ ] No TypeScript errors

---

### Task 1.2: Rolling 30-Day Reset (Backend)
**Owner:** Bruno
**File:** `utils/api-middleware.ts`

Current logic may use calendar month. Change to rolling 30 days from user's `created_at`.

**Check:** How does `checkRateLimit` currently calculate the period?
**Change:** Use `user.created_at` + rolling 30-day windows

**Acceptance criteria:**
- [ ] Limits reset 30 days from signup, not calendar month
- [ ] Existing users handled correctly

---

### Task 1.3: Limit Hit Popup Component (Frontend)
**Owner:** Felix
**File:** New `components/LimitReachedModal.tsx`

Props:
```typescript
interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'validation' | 'voice' | 'chat' | 'generic';
  onUpgrade: () => void;
  onContinueBasic?: () => void; // only for validation
}
```

UI:
- Title: "You've run out of smart validations" (or appropriate per type)
- Two buttons for validation: "Upgrade" + "Continue without smart validation"
- One button for voice/chat: "Upgrade" (no continue option)

**Acceptance criteria:**
- [ ] Modal matches app design (rounded corners, rose accent)
- [ ] All strings use i18n (no hardcoded English)
- [ ] onContinueBasic only shown for validation type
- [ ] Accessible (focus trap, ESC to close)

---

### Task 1.4: Low Balance Warning Component (Frontend)
**Owner:** Felix
**File:** New `components/LowBalanceWarning.tsx`

Props:
```typescript
interface LowBalanceWarningProps {
  remaining: number;
  limitType: string;
  threshold?: number; // default 5
}
```

Show subtle banner when remaining <= 5 or remaining === 1

UI: Small toast/banner, not intrusive, with "Upgrade" link

**Acceptance criteria:**
- [ ] Shows at 5 remaining and 1 remaining
- [ ] Dismissible
- [ ] All strings use i18n
- [ ] Doesn't block gameplay

---

### Task 1.5: Integrate Limit Popup in Games (Frontend)
**Owner:** Felix
**Files:** 
- `components/FlashcardGame.tsx`
- `components/TutorGames.tsx`
- `components/PlayQuizChallenge.tsx`
- `components/PlayQuickFireChallenge.tsx`

When `validateAnswerSmart` returns rate limit error (429):
1. Show `LimitReachedModal` with type='validation'
2. If user clicks "Continue basic" → use local validation only for rest of session
3. If user clicks "Upgrade" → navigate to paywall

**Acceptance criteria:**
- [ ] Modal appears on 429 response
- [ ] "Continue basic" works (game continues with exact-match only)
- [ ] "Upgrade" navigates to subscription page
- [ ] Game state preserved when modal shown

---

### Task 1.6: Voice Session 2-Minute Hard Stop (Frontend)
**Owner:** Felix
**Files:**
- Voice chat component (find it)
- Listen mode component (find it)

Add timer that:
1. Shows countdown when approaching 2 min
2. Hard stops at 2:00
3. Shows `LimitReachedModal` with type='voice'

**Acceptance criteria:**
- [ ] Timer visible during voice session
- [ ] Session ends at exactly 2:00
- [ ] Modal shown with upgrade option
- [ ] Audio/connection properly cleaned up

---

### Task 1.7: Update Usage Dashboard for Free Tier (Frontend)
**Owner:** Felix
**File:** `components/UsageSection.tsx`

Currently shows usage for paid users. Update to:
1. Show limits for free tier users too
2. Show "X of Y used" format
3. Visual progress bar
4. Highlight when close to limit (<=5)

**Acceptance criteria:**
- [ ] Free users see their limits
- [ ] Progress bars for each limit type
- [ ] Visual warning when close to limit
- [ ] "Upgrade for unlimited" CTA

---

### Task 1.8: Signup Copy Update (Frontend)
**Owner:** Felix
**Files:**
- `components/Hero.tsx`
- `components/hero/LoginForm.tsx`

Add subtle, persistent text: "Start learning for $0.00"

Placement: Near signup button, subtle but visible
Style: Should feel additive, not change existing layout

**Acceptance criteria:**
- [ ] Copy visible on signup/signin
- [ ] Doesn't disrupt existing design
- [ ] Uses i18n
- [ ] A/B testable (easy to change copy later)

---

### Task 1.9: Translations (All 18 Languages)
**Owner:** Felix (use AI translation, Richard reviews)
**Files:** `i18n/locales/*.json` (18 files)

New strings:
```json
{
  "limits": {
    "outOfValidations": "You've run out of smart validations",
    "outOfVoice": "You've reached your voice session limit", 
    "outOfChat": "You've reached your conversation limit",
    "continueBasic": "Continue without smart validation",
    "upgrade": "Upgrade",
    "remaining": "{{count}} remaining",
    "warningLow": "Only {{count}} left",
    "usageOf": "{{used}} of {{total}} used"
  },
  "signup": {
    "freeStart": "Start learning for $0.00"
  }
}
```

**Acceptance criteria:**
- [ ] All 18 locale files updated
- [ ] Translations are natural (not robotic)
- [ ] Placeholders ({{count}}) preserved

---

## Phase 2: Promo Codes

### Task 2.1: Database Migration (Backend)
**Owner:** Bruno

Create Supabase migration:

```sql
-- Add promo expiry to profiles
ALTER TABLE profiles ADD COLUMN promo_expires_at timestamptz;

-- Promo codes table
CREATE TABLE promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  grant_days int DEFAULT 7,
  max_uses int DEFAULT 50,
  current_uses int DEFAULT 0,
  expires_at timestamptz,
  created_by text, -- e.g., 'postedapp-sophie'
  created_at timestamptz DEFAULT now()
);

-- Track redemptions
CREATE TABLE promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  code_id uuid REFERENCES promo_codes(id),
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, code_id)
);

-- Index for fast lookups
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_redemptions_user ON promo_redemptions(user_id);
```

**Acceptance criteria:**
- [ ] Migration runs without errors
- [ ] profiles.promo_expires_at column exists
- [ ] promo_codes and promo_redemptions tables created

---

### Task 2.2: Update Rate Limit Logic (Backend)
**Owner:** Bruno
**File:** `utils/api-middleware.ts`

Update `checkRateLimit` to check `promo_expires_at`:
- If `promo_expires_at > now()`, treat user as "standard" tier
- Otherwise use their normal subscription status

```typescript
// Pseudo-logic
const plan = profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date()
  ? 'standard'
  : profile.subscription_plan || 'free';
```

**Acceptance criteria:**
- [ ] Users with active promo get standard limits
- [ ] Expired promo falls back to free/subscription

---

### Task 2.3: Promo Redemption API (Backend)
**Owner:** Bruno
**File:** New `api/promo-redeem.ts`

POST `/api/promo/redeem`
Body: `{ code: string }`

Logic:
1. Validate user is authenticated
2. Check user doesn't have active subscription (error if they do)
3. Check user doesn't have active promo (error if they do)
4. Find code in promo_codes table
5. Check code exists, not expired, under max_uses
6. Increment current_uses
7. Create promo_redemptions record
8. Set profiles.promo_expires_at = now + grant_days
9. Return success

Error responses:
- 400: "You already have an active subscription"
- 400: "You already have active creator access"
- 404: "Invalid or expired code"
- 400: "This code has reached its limit"

**Acceptance criteria:**
- [ ] Valid code grants access
- [ ] All error cases handled
- [ ] current_uses incremented
- [ ] promo_expires_at set correctly

---

### Task 2.4: Promo Status API (Backend)
**Owner:** Bruno
**File:** New `api/promo-status.ts`

GET `/api/promo/status`

Returns:
```json
{
  "hasPromo": true,
  "expiresAt": "2026-02-02T00:00:00Z",
  "daysRemaining": 7
}
```

**Acceptance criteria:**
- [ ] Returns correct promo status
- [ ] daysRemaining calculated correctly

---

### Task 2.5: Promo UI in Settings (Frontend)
**Owner:** Felix
**File:** `components/AccountSettings.tsx`

Add section "Creator Access":
- If no promo active: Show input "Have a creator code?" + Apply button
- If promo active: Show "Creator access expires in X days"
- If subscribed: Don't show this section at all

**Acceptance criteria:**
- [ ] Input field for code
- [ ] Apply button calls /api/promo/redeem
- [ ] Success/error messages shown
- [ ] Active promo shows expiry
- [ ] Hidden for subscribers

---

### Task 2.6: Promo Expiry Message (Frontend)
**Owner:** Felix

When promo_expires_at passes:
- User drops to free tier (automatic via backend)
- Show message on next app open: "Your creator access has ended. Need more time? Email creators@lovelanguages.io"

**Acceptance criteria:**
- [ ] Message shows after promo expires
- [ ] Dismissible
- [ ] Email link works

---

### Task 2.7: Translations (Frontend)
**Owner:** Felix
**Files:** All 18 locale files

New strings:
```json
"promo": {
  "title": "Creator Access",
  "enterCode": "Have a creator code?",
  "placeholder": "Enter code",
  "apply": "Apply",
  "success": "Creator access activated! Enjoy {{days}} days of unlimited access.",
  "activeUntil": "Creator access expires in {{days}} days",
  "expired": "Your creator access has ended. Need more time? Email creators@lovelanguages.io",
  "errorInvalid": "Invalid or expired code",
  "errorSubscribed": "You already have an active subscription",
  "errorActive": "You already have active creator access",
  "errorMaxUses": "This code has reached its limit"
}
```

**Acceptance criteria:**
- [ ] All strings in all 18 locales
- [ ] Natural translations

---

## Testing Checklist

### Free Tier Tests
- [ ] New user gets 25 chat limit
- [ ] Limit decrements correctly
- [ ] 429 returned when limit hit
- [ ] Modal appears in games
- [ ] "Continue basic" works
- [ ] "Upgrade" navigates correctly
- [ ] Voice stops at 2 minutes
- [ ] Low balance warning at 5 and 1
- [ ] Usage dashboard shows free limits
- [ ] Rolling 30-day reset works

### Edge Cases
- [ ] Mid-game limit hit handled gracefully
- [ ] Offline behavior (no crash)
- [ ] Partner features still work for free users (within limits)
- [ ] Downgrade from paid resets to free limits
