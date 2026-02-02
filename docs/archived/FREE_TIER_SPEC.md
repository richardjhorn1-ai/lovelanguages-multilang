# Free Tier & Promo Codes Spec

## Decisions (2026-01-26)

### Free Tier Limits

| Feature | Free | Standard | Unlimited |
|---------|------|----------|-----------|
| Chat messages | 25 | 5000 | ∞ |
| Word validations | 50 | 2000 | ∞ |
| Answer validations | 75 | 3000 | ∞ |
| TTS requests | 100 | 1000 | ∞ |
| Voice chat | 1 session (2 min max) | 20 | ∞ |
| Listen mode | 1 session (2 min max) | 40 | ∞ |
| Level tests | 2 | 50 | ∞ |
| Challenges | 5 create / 10 submit | 200/500 | ∞ |

### Limit Reset
- Rolling 30 days from signup (not calendar month)

### Partner Model
- Inviter pays, partner gets free access automatically
- No unpaid pairs exist
- Partners don't see each other's rate limits

---

## Limit Hit Behavior

### Mid-Game (Validations)
- Show popup: "You've run out of smart validations"
- Two buttons:
  1. "Upgrade" → paywall
  2. "Continue without smart validation" → basic exact-match only

### Voice Sessions
- Hard stop at 2 minutes
- Show upgrade prompt

### Low Balance Warnings
- Show notification at 5 remaining
- Show notification at 1 remaining

---

## Promo Codes

### Scope
- PostedApp creators only (for now)
- **ACCESS codes, not referral codes**
- Purpose: Let creators USE the app to make content
- Creators do NOT share codes with audience
- Content drives traffic → users sign up normally → free tier converts them

### Rules
- One active code at a time per user
- Max 50 uses per code (abuse prevention)
- Branded format: e.g., `CREATOR-SOPHIE`

### If Subscribed User Enters Code
- Throw error (codes are for free users only)

### Code Expiry (Creator Access Ends)
- Immediately drop to free tier
- Show message: "Your creator access has ended. Email us if you need more time."

### Entry Point
- Settings only (for now)

---

## Signup Flow Changes

### Copy
- Add: "Start learning for $0.00" (or similar)
- Placement: Subtle on signup/signin side
- Persistent (always visible, not contextual)
- Additive to existing copy (don't remove anything)

### Goal
- Well-placed, highly converting
- Makes free tier clear without being pushy

---

## Abuse Prevention

### Multiple Accounts
- IP-based signup restrictions

### Promo Codes
- Max 50 uses per code
- Track redemptions

---

## Refunds
- If user gets refund, keep access for their paid period
- Don't revoke immediately

---

## Technical Changes Required

### Database
```sql
-- Promo codes table
create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  grant_days int default 7,
  max_uses int default 50,
  current_uses int default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Track redemptions
create table promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  code_id uuid references promo_codes(id),
  redeemed_at timestamptz default now(),
  expires_at timestamptz not null
);
```

### Files to Update
1. `utils/api-middleware.ts` - Update free tier limits
2. `AccountSettings.tsx` - Add promo code input
3. `UsageSection.tsx` - Adjust for free tier display
4. Games components - Add limit-hit popup
5. Voice components - Add 2-min hard stop
6. Signup/signin - Add "$0.00" copy
7. `i18n/locales/*.json` (18 files) - All new strings

### New Strings Needed
- `limits.outOfValidations` - "You've run out of smart validations"
- `limits.continueBasic` - "Continue without smart validation"
- `limits.upgrade` - "Upgrade"
- `limits.remaining` - "{{count}} remaining"
- `limits.warningLow` - "Only {{count}} left"
- `promo.enterCode` - "Have a creator code?"
- `promo.apply` - "Apply"
- `promo.success` - "Creator access activated!"
- `promo.error.invalid` - "Invalid or expired code"
- `promo.error.alreadySubscribed` - "You already have a subscription"
- `promo.error.maxUses` - "This code has reached its limit"
- `promo.expired` - "Your creator access has ended. Email us if you need more time."
- `signup.freeStart` - "Start learning for $0.00"

---

## Out of Scope (For Now)
- Creator portal / special signup flow
- App Store (not launched yet)
- Email notifications for low balance
- Promo code attribution tracking

---

## Open Question
- Promo code attribution: Do we want to track which creator's code drove which signup? (for paying creators based on conversions later)
