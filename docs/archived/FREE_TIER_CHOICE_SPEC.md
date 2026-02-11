# Free Tier Choice Screen — Spec

## Overview

After onboarding, users MUST choose a plan before entering the app. This includes a "Free" option that's honest about limitations. This positions Love Languages as a premium app while still allowing users to try it.

---

## User Flow

```
Signup → Role Selection → Onboarding → Plan Choice (required) → App
```

---

## Plan Choice Screen (SubscriptionRequired Update)

### Layout

Three cards side by side (or stacked on mobile):

| Free | Standard | Unlimited |
|------|----------|-----------|
| $0/mo | $X/mo | $X/mo |

### Free Card Copy

**Title:** Free Trial

**Price:** $0.00/month

**Features (honest about limits):**
- ✓ 25 AI conversations/month
- ✓ 50 word validations/month  
- ✓ Basic vocabulary games
- ✗ Voice chat (1 try only)
- ✗ Listen mode (1 try only)
- ✗ Unlimited challenges

**CTA Button:** "Start Free"

**Subtext:** "Perfect for trying Love Languages"

### Standard/Unlimited Cards

Keep existing copy but ensure contrast with Free tier.

### Premium Positioning Banner

Above or below cards:
> "Love Languages is designed for motivated couples who are serious about learning their partner's language. Choose your path."

Or softer:
> "Every love story deserves the right words. Choose how you want to learn."

---

## Behavior

1. User MUST click one of the three options
2. No "Skip" or "X" to close
3. Clicking "Start Free" → enters app with free tier
4. Clicking Standard/Unlimited → Stripe checkout → enters app

---

## Profile Subscription Manager Update

### For Free Users (no subscription)

Show card:
```
┌─────────────────────────────────────┐
│ 📊 Your Plan                        │
│                                     │
│ FREE TRIAL                          │
│ 25 conversations • Limited features │
│                                     │
│ [Upgrade to unlock everything →]    │
└─────────────────────────────────────┘
```

Clicking "Upgrade" → shows SubscriptionRequired modal/page with Standard/Unlimited options (not Free, since they're already free)

### For Paid Users

Keep existing behavior (shows plan, manage via Stripe portal)

### For Promo Users

Show:
```
┌─────────────────────────────────────┐
│ ✨ Creator Access                   │
│                                     │
│ Full access expires in 5 days       │
│                                     │
│ [Subscribe to keep access →]        │
└─────────────────────────────────────┘
```

---

## Translations Needed

```json
"subscription": {
  "choice": {
    "title": "Choose your plan",
    "subtitle": "Every love story deserves the right words",
    "free": {
      "title": "Free Trial",
      "price": "$0",
      "perMonth": "/month",
      "features": {
        "conversations": "25 AI conversations/month",
        "validations": "50 word validations/month",
        "games": "Basic vocabulary games",
        "voiceLimited": "Voice chat (1 try)",
        "listenLimited": "Listen mode (1 try)",
        "challengesLimited": "5 partner challenges"
      },
      "cta": "Start Free",
      "subtext": "Perfect for trying Love Languages"
    }
  },
  "manager": {
    "freePlan": "Free Trial",
    "freeDescription": "25 conversations • Limited features",
    "upgradeButton": "Upgrade to unlock everything",
    "promoExpires": "Full access expires in {{days}} days",
    "subscribeToKeep": "Subscribe to keep access"
  }
}
```

---

## Technical Changes

### 1. Revert App.tsx paywall removal
Put back the SubscriptionRequired check, but modify it to allow users who chose "free"

### 2. Add "free" plan tracking
Option A: Use `subscription_plan = 'free'` (explicit)
Option B: Null subscription + `free_tier_chosen_at` timestamp (tracks when they chose)

Recommend Option B — cleaner, tracks conversion funnel

### 3. Update SubscriptionRequired component
- Add Free tier card
- Handle "Start Free" click → set free_tier_chosen_at → enter app
- Style all three tiers consistently

### 4. Update SubscriptionManager component
- Detect free users (no subscription, no promo)
- Show free plan card with upgrade button
- Upgrade button opens pricing modal

### 5. Database migration
```sql
ALTER TABLE profiles ADD COLUMN free_tier_chosen_at timestamptz;
```

### 6. Update App.tsx logic
```typescript
// Allow users who:
// - Have active subscription
// - Have inherited access (partner)
// - Have active promo
// - Have chosen free tier (free_tier_chosen_at is set)
// - Are beta testers
```

---

## Files to Change

| File | Change |
|------|--------|
| `migrations/034_free_tier_choice.sql` | Add free_tier_chosen_at column |
| `components/SubscriptionRequired.tsx` | Add Free option, handle selection |
| `components/SubscriptionManager.tsx` | Show free plan + upgrade for free users |
| `App.tsx` | Check free_tier_chosen_at in access logic |
| `i18n/locales/*.json` (18 files) | New strings |

---

## Open Questions

1. Should "Upgrade" in profile open a modal or navigate to /pricing page?
2. Do we want analytics events for plan choice? (e.g., `plan_selected: free`)
3. Should free users see upgrade prompts elsewhere (e.g., periodic reminders)?

---

## Pricing Display Update

### Period Toggle
- Options: Weekly / Monthly / Yearly
- Default: **Monthly** (easiest to understand)
- Style: Segmented control (pill-style toggle, on-brand)

### Price Display Format
Show monthly equivalent prominently, total in smaller text:

**For Monthly:**
```
$19/month
```

**For Yearly:**
```
$5.75/month
($69 billed annually)
```

**For Weekly:**
```
$7/week
($28 billed monthly)
```

### Legal Note
Must show total charge amount (the amount actually billed). Monthly equivalent can be prominent but total must be visible.

---

## NOT in scope (future)

- A/B testing different copy
- Time-limited free trial (e.g., 7 days then must choose)
- Upgrade prompts in-app beyond limit warnings
