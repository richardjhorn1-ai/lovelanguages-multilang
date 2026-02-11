# 7-Day Free Trial Implementation Plan

**Status:** IMPLEMENTED
**Last Updated:** 2026-02-01

## Overview
Change from usage-based free tier (25 chats/month) to time-based 7-day free trial with full access, then hard paywall.

## Review Feedback Incorporated
- ✅ Merge TrialExpiredPaywall into SubscriptionRequired.tsx
- ✅ Add trial_expires_at to types.ts properly (no more `as any`)
- ✅ Add localStorage persistence for reminder dismissals
- ✅ Use translation keys, not hardcoded copy
- ✅ Add day 0 to reminder days
- ✅ Migration numbered 035

---

## 1. Database Changes

### Migration: `migrations/0XX_free_trial.sql`
```sql
-- Add trial expiry tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;

-- Backfill: existing free tier users get grandfathered (no trial expiry)
-- New users will have trial_expires_at set when they click "Start Free Trial"

-- Index for efficient expiry checks
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON profiles(trial_expires_at) 
WHERE trial_expires_at IS NOT NULL;
```

---

## 2. API Changes

### Modify: `api/choose-free-tier.ts`
```typescript
// BEFORE:
await supabase.from('profiles')
  .update({ free_tier_chosen_at: new Date().toISOString() })
  .eq('id', auth.userId);

// AFTER:
const trialExpiresAt = new Date();
trialExpiresAt.setDate(trialExpiresAt.getDate() + 7); // 7 days from now

await supabase.from('profiles')
  .update({ 
    free_tier_chosen_at: new Date().toISOString(),
    trial_expires_at: trialExpiresAt.toISOString()
  })
  .eq('id', auth.userId);
```

### New: `api/trial-status.ts`
```typescript
import { createApiHandler } from '../utils/api-middleware';

export default createApiHandler(async (req, res, { supabase, auth }) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_expires_at, subscription_status, subscription_plan')
    .eq('id', auth.userId)
    .single();

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const now = new Date();
  const trialExpires = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null;
  
  const hasActiveSubscription = profile.subscription_status === 'active';
  const trialExpired = trialExpires && trialExpires < now;
  const daysRemaining = trialExpires 
    ? Math.max(0, Math.ceil((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return res.json({
    hasActiveSubscription,
    trialExpired,
    trialExpiresAt: profile.trial_expires_at,
    daysRemaining,
    showReminder: daysRemaining !== null && [5, 3, 1].includes(daysRemaining)
  });
});
```

---

## 3. App.tsx Access Control Changes

### Current logic (around line 431):
```typescript
const hasActiveSubscription = profile.subscription_status === 'active';
const hasInheritedAccess = !!profile.subscription_granted_by;
const hasActivePromo = profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date();
const hasChosenFreeTier = !!(profile as any).free_tier_chosen_at;
```

### New logic:
```typescript
const hasActiveSubscription = profile.subscription_status === 'active';
const hasInheritedAccess = !!profile.subscription_granted_by;
const hasActivePromo = profile.promo_expires_at && new Date(profile.promo_expires_at) > new Date();
const hasChosenFreeTier = !!(profile as any).free_tier_chosen_at;

// NEW: Trial expiry check
const trialExpiresAt = (profile as any).trial_expires_at;
const trialExpired = trialExpiresAt && new Date(trialExpiresAt) < new Date();
const isInActiveTrial = hasChosenFreeTier && !trialExpired;

// Calculate days remaining for notifications
const daysRemaining = trialExpiresAt 
  ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  : null;

// Access granted if: paid subscriber OR inherited OR promo OR active trial
const hasAccess = hasActiveSubscription || hasInheritedAccess || hasActivePromo || isInActiveTrial;

// If trial expired and no subscription, show paywall
if (trialExpired && !hasActiveSubscription && !hasInheritedAccess && !hasActivePromo) {
  return <TrialExpiredPaywall />;
}
```

---

## 4. New Component: `TrialExpiredPaywall.tsx`

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TrialExpiredPaywall: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="text-6xl mb-4">💔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your free trial has ended
        </h1>
        <p className="text-gray-600 mb-6">
          We hope you enjoyed learning together! Subscribe to continue your language journey with your partner.
        </p>
        
        <button
          onClick={() => navigate('/pricing')}
          className="w-full bg-accent text-white font-bold py-4 px-6 rounded-full hover:shadow-lg transition-all mb-3"
        >
          View Plans & Subscribe
        </button>
        
        <p className="text-sm text-gray-500">
          Starting at $19/month for couples
        </p>
      </div>
    </div>
  );
};
```

---

## 5. New Component: `TrialReminderNotification.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface Props {
  daysRemaining: number;
  onDismiss: () => void;
}

export const TrialReminderNotification: React.FC<Props> = ({ daysRemaining, onDismiss }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  const messages: Record<number, { emoji: string; title: string; subtitle: string }> = {
    5: {
      emoji: '⏰',
      title: '5 days left in your trial',
      subtitle: 'Enjoying learning together? Keep it going!'
    },
    3: {
      emoji: '💕',
      title: '3 days left in your trial', 
      subtitle: "Don't lose your progress — subscribe to continue"
    },
    1: {
      emoji: '🚨',
      title: 'Last day of your trial!',
      subtitle: 'Subscribe now to keep learning with your partner'
    }
  };

  const msg = messages[daysRemaining];
  if (!msg || !visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-rose-100 p-4 max-w-sm">
        <button 
          onClick={() => { setVisible(false); onDismiss(); }}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-3">
          <span className="text-2xl">{msg.emoji}</span>
          <div>
            <p className="font-bold text-gray-900">{msg.title}</p>
            <p className="text-sm text-gray-600 mt-1">{msg.subtitle}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-3 text-sm font-bold text-accent hover:underline"
            >
              View plans →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 6. Onboarding Changes

### Modify: `steps/shared/PlanSelectionStep.tsx`

Update the free tier selection to clearly communicate 7-day trial:

```tsx
// In the free plan card:
<div className="text-center">
  <h3 className="font-bold text-lg">Free Trial</h3>
  <p className="text-3xl font-black my-2">7 days</p>
  <p className="text-sm text-gray-600">Full access, then $19/mo</p>
</div>

// Benefits list:
<ul>
  <li>✓ Full access for 7 days</li>
  <li>✓ AI tutor conversations</li>
  <li>✓ Voice practice</li>
  <li>✓ All games & exercises</li>
  <li>✓ Cancel anytime</li>
</ul>

// CTA button:
<button>Start 7-Day Free Trial</button>
```

### Modify: `steps/student/StartStep.tsx` & `steps/tutor/TutorStartStep.tsx`

After trial starts, show confirmation:

```tsx
// Add trial started confirmation if just activated
{justStartedTrial && (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
    <p className="font-bold text-green-800">🎉 Your 7-day free trial has started!</p>
    <p className="text-sm text-green-700">You have full access until {trialExpiresDate}.</p>
  </div>
)}
```

---

## 7. Types Update

### Modify: `types.ts`
```typescript
interface Profile {
  // ... existing fields ...
  
  // Trial fields
  free_tier_chosen_at?: string;
  trial_expires_at?: string;  // NEW
}
```

---

## 8. Messaging Summary

| Location | Copy |
|----------|------|
| Plan selection card | "7-Day Free Trial" |
| Plan selection subtitle | "Full access, then $19/mo" |
| CTA button | "Start 7-Day Free Trial" |
| Trial started | "🎉 Your 7-day free trial has started! Full access until [date]." |
| 5 days reminder | "5 days left in your trial — Enjoying learning together? Keep it going!" |
| 3 days reminder | "3 days left — Don't lose your progress, subscribe to continue" |
| 1 day reminder | "🚨 Last day! Subscribe now to keep learning with your partner" |
| Trial expired title | "Your free trial has ended" |
| Trial expired body | "We hope you enjoyed learning together! Subscribe to continue your language journey." |
| Trial expired CTA | "View Plans & Subscribe" |

---

## 9. Migration Path for Existing Users

- **Paid subscribers:** No change
- **Users with `subscription_granted_by`:** No change (inherited access)
- **Users with `promo_expires_at`:** No change (promo access)
- **Existing free tier users (`free_tier_chosen_at` set, no `trial_expires_at`):** Grandfathered - continue with usage-based limits
- **New users:** Get 7-day trial with `trial_expires_at` set

This ensures no existing users are suddenly locked out.

---

## 10. Files to Modify

1. `migrations/0XX_free_trial.sql` — NEW
2. `types.ts` — Add `trial_expires_at`
3. `api/choose-free-tier.ts` — Set trial expiry
4. `api/trial-status.ts` — NEW
5. `App.tsx` — Add trial expiry check
6. `components/TrialExpiredPaywall.tsx` — NEW
7. `components/TrialReminderNotification.tsx` — NEW  
8. `components/onboarding/steps/shared/PlanSelectionStep.tsx` — Update copy
9. `components/onboarding/steps/student/StartStep.tsx` — Add confirmation
10. `components/onboarding/steps/tutor/TutorStartStep.tsx` — Add confirmation
