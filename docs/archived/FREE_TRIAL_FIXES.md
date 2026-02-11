# Free Trial Critical Fixes - Implementation Plan

**Created:** 2026-02-01
**Status:** ✅ IMPLEMENTED (pending review)

## Issues Found

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | Backend doesn't check `trial_expires_at` | API bypass vulnerability |
| 2 | 🔴 CRITICAL | API failure doesn't block onboarding | Users enter app with no valid trial |
| 3 | 🔴 HIGH | Banner shows before API call | UX lie, user confusion |
| 4 | 🟡 MEDIUM | No button loading state | Double-click duplicates |
| 5 | 🟡 MEDIUM | Math.floor vs Math.ceil mismatch | Days display inconsistency |
| 6 | 🟡 MEDIUM | Trial data missing from subscription-status | Frontend can't show countdown |
| 7 | 🟢 LOW | Race condition on double-click API | Minor data variance |

---

## Fix 1: Backend Trial Expiry Check (CRITICAL)

**File:** `utils/api-middleware.ts`

**Location:** `requireSubscription()` function (~line 589)

**Current code:**
```typescript
// Step 4: Free tier (explicitly chosen during onboarding)
if (profile.free_tier_chosen_at) {
  return { allowed: true, plan: 'free' };
}
```

**Fixed code:**
```typescript
// Step 4: Free tier (explicitly chosen during onboarding)
if (profile.free_tier_chosen_at) {
  // Check if trial has expired (grandfathered users have no trial_expires_at)
  if (profile.trial_expires_at && new Date(profile.trial_expires_at) <= new Date()) {
    return { 
      allowed: false, 
      plan: 'none', 
      error: 'Your free trial has expired. Please subscribe to continue.' 
    };
  }
  return { allowed: true, plan: 'free' };
}
```

**Also update the SELECT query** to include `trial_expires_at`:
```typescript
.select('subscription_status, subscription_granted_by, promo_expires_at, free_tier_chosen_at, trial_expires_at')
```

---

## Fix 2: Block Onboarding on API Failure (CRITICAL)

**File:** `components/onboarding/Onboarding.tsx`

**Location:** `handleComplete()` function (~line 810)

**Current code:**
```typescript
if (data.selectedPlan === 'free') {
  try {
    const response = await fetch('/api/choose-free-tier', ...);
    if (!response.ok) {
      console.error('[Onboarding] Free tier activation failed:', result);
      // ❌ No user notification, no blocking
    }
  } catch (freeErr) {
    console.error('[Onboarding] Error activating free tier:', freeErr);
    // ❌ Silent failure
  }
  onComplete();  // ❌ Always proceeds
}
```

**Fixed code:**
```typescript
if (data.selectedPlan === 'free') {
  setLoading(true);
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      setError(t('onboarding.errors.authRequired', { defaultValue: 'Please log in again' }));
      setLoading(false);
      return; // Block progression
    }

    const response = await fetch('/api/choose-free-tier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Onboarding] Free tier activation failed:', result);
      setError(result.error || t('onboarding.errors.trialFailed', { defaultValue: 'Failed to start trial. Please try again.' }));
      setLoading(false);
      return; // Block progression
    }

    // Success - store the actual expiry from API response
    if (result.trialExpiresAt) {
      updateData('trialExpiresAt', result.trialExpiresAt);
    }
    
    setLoading(false);
    onComplete();
    
  } catch (freeErr) {
    console.error('[Onboarding] Error activating free tier:', freeErr);
    setError(t('onboarding.errors.networkError', { defaultValue: 'Network error. Please try again.' }));
    setLoading(false);
    return; // Block progression
  }
}
```

**Also need:** Add `loading` and `error` state to `handleComplete`, pass to StartStep.

---

## Fix 3: Move Trial Banner After API Success (HIGH)

**Option A: Remove banner from StartStep entirely**
- Show confirmation on the main dashboard after onboarding completes
- Simpler, avoids timing issues

**Option B: Only show banner after API confirms**
- StartStep waits for API result before showing banner
- More complex, requires state management

**Recommended: Option A**

**Changes:**

1. **Remove `trialExpiresAt` calculation from Onboarding.tsx case 17/11**
2. **Remove banner from StartStep.tsx and TutorStartStep.tsx**
3. **Add welcome banner to main app (e.g., in PersistentTabs or Dashboard)**

**New component:** `TrialWelcomeBanner.tsx`
```typescript
// Shows once after trial starts, stored in localStorage
const WELCOME_SHOWN_KEY = 'trial_welcome_shown';

export const TrialWelcomeBanner: React.FC<{ trialExpiresAt: string }> = ({ trialExpiresAt }) => {
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem(WELCOME_SHOWN_KEY);
  });

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const expiryDate = new Date(trialExpiresAt).toLocaleDateString(...);

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 m-4">
      <p className="font-bold text-green-800">🎉 Your 7-day free trial is active!</p>
      <p className="text-sm text-green-700">Full access until {expiryDate}</p>
      <button onClick={handleDismiss}>Got it</button>
    </div>
  );
};
```

---

## Fix 4: Add Button Loading State (MEDIUM)

**File:** `components/onboarding/steps/student/StartStep.tsx` (and TutorStartStep)

**Add props:**
```typescript
interface StartStepProps {
  // ... existing
  loading?: boolean;
  error?: string | null;
}
```

**Update button:**
```typescript
<NextButton
  onClick={onComplete}
  disabled={loading}
  accentColor={accentColor}
>
  {loading ? (
    <span className="flex items-center gap-2">
      <Spinner /> Starting...
    </span>
  ) : (
    t('onboarding.student.start.button')
  )}
</NextButton>

{error && (
  <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
)}
```

---

## Fix 5: Standardize Math.floor (MEDIUM)

**File:** `api/trial-status.ts` (~line 61)

**Current:**
```typescript
Math.ceil((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
```

**Fixed:**
```typescript
Math.floor((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
```

---

## Fix 6: Add Trial Data to subscription-status (MEDIUM)

**File:** `api/subscription-status.ts`

**Add to SELECT:**
```typescript
.select('..., free_tier_chosen_at, trial_expires_at')
```

**Add to response:**
```typescript
return res.json({
  // ... existing fields
  trial: {
    active: !!profile.free_tier_chosen_at && (!profile.trial_expires_at || new Date(profile.trial_expires_at) > now),
    expiresAt: profile.trial_expires_at,
    daysRemaining: profile.trial_expires_at 
      ? Math.max(0, Math.floor((new Date(profile.trial_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null,
    isGrandfathered: !!profile.free_tier_chosen_at && !profile.trial_expires_at
  }
});
```

---

## Fix 7: Atomic Double-Click Prevention (LOW)

**File:** `api/choose-free-tier.ts`

**Replace check-then-update with conditional update:**
```typescript
// Remove the separate check (step 6)
// Replace step 7 with:

const { data: updateResult, error: updateError } = await supabase
  .from('profiles')
  .update({
    free_tier_chosen_at: now.toISOString(),
    trial_expires_at: trialExpiresAt.toISOString()
  })
  .eq('id', auth.userId)
  .is('free_tier_chosen_at', null)  // Only update if not already set
  .select('id');

if (updateError) {
  console.error('[choose-free-tier] Update failed:', updateError.message);
  return res.status(500).json({ error: 'Failed to activate free trial' });
}

if (!updateResult || updateResult.length === 0) {
  // Row wasn't updated - already has free tier
  return res.status(400).json({
    error: 'You have already activated the free tier',
    code: 'ALREADY_FREE_TIER'
  });
}
```

---

## Implementation Order

1. **Fix 1** - Backend trial check (blocks the security hole)
2. **Fix 2** - Block onboarding on failure (prevents broken state)
3. **Fix 7** - Atomic update (prevents race condition)
4. **Fix 5** - Math.floor consistency
5. **Fix 6** - Trial data in status API
6. **Fix 4** - Button loading state
7. **Fix 3** - Move banner (UX improvement)

---

## Files to Modify

| File | Fixes |
|------|-------|
| `utils/api-middleware.ts` | #1 |
| `components/onboarding/Onboarding.tsx` | #2, #3 |
| `components/onboarding/steps/student/StartStep.tsx` | #3, #4 |
| `components/onboarding/steps/tutor/TutorStartStep.tsx` | #3, #4 |
| `api/trial-status.ts` | #5 |
| `api/subscription-status.ts` | #6 |
| `api/choose-free-tier.ts` | #7 |
| `components/TrialWelcomeBanner.tsx` | #3 (NEW) |

---

## Testing Checklist

- [ ] Expired trial user cannot access API endpoints
- [ ] API failure during onboarding shows error, blocks progression
- [ ] Double-click on "Start" button doesn't create duplicate requests
- [ ] Days remaining shows consistently across frontend/API
- [ ] Grandfathered users still have access
- [ ] New trial users see welcome banner after onboarding
- [ ] Paid subscribers unaffected
- [ ] Partner-inherited access unaffected
