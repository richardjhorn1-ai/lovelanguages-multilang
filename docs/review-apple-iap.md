# Apple Sign In & RevenueCat IAP Review
**Branch:** `feature/ios-apple-auth-iap`  
**Reviewed:** 2025-07-19  
**Migration:** `042_apple_subscriptions_and_onboarding.sql`

---

## Summary

The integration is **substantially complete and well-structured**. The architecture is solid, the App Store hard requirements (restore button, native auth) are satisfied, and the migration is safe. There are a few gaps worth addressing before submission, noted below.

---

## 1. RevenueCat Integration — Is it complete?

### ✅ What's done well

- **Dynamic import pattern** — `@revenuecat/purchases-capacitor` is loaded lazily via `import()`, so the module never loads on web. Clean.
- **Configuration lifecycle** — `configurePurchases(userId)` is called in `App.tsx` on iOS login, followed immediately by `identifyUser(userId)`. `logOutPurchases()` is called on sign-out. The lifecycle is correct.
- **Product/entitlement mapping** — All 6 product IDs (`standard_weekly`, `standard_monthly`, `standard_yearly`, `unlimited_weekly/monthly/yearly`) are mapped, and both entitlements (`standard_access`, `unlimited_access`) are defined.
- **Webhook handler** — `api/webhooks/revenuecat.ts` is comprehensive: covers INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, UNCANCELLATION, BILLING_ISSUE, PRODUCT_CHANGE. Idempotent via `subscription_events` table (reuses the `stripe_event_id` column). Partner cascade works the same way as Stripe. Auth header verification with `REVENUECAT_WEBHOOK_SECRET` ✅.
- **DB reconciliation on login** — App.tsx checks `getCustomerInfo()` on login and fixes stale subscription state if the webhook was delayed. Good defensive pattern.
- **Restore purchases** — `restorePurchases()` is implemented in `services/purchases.ts` and surfaced in `SubscriptionRequired.tsx` behind the `useIAP` flag. ✅

### ⚠️ Gaps

1. **`revenuecat_customer_id` is never populated.** The migration adds the column, the webhook processes events via `app_user_id` (Supabase UID), but nowhere in the code is `revenuecat_customer_id` written to the `profiles` table. This isn't a blocker (RC uses Supabase UID as the app user ID), but it makes the column misleading. Either populate it in the webhook or remove it.

2. **`SUBSCRIBER_ALIAS` event is unhandled.** The webhook comment lists it but the `switch` falls through to the default `console.log`. If RevenueCat fires this (e.g., anonymous → identified user merge), it's silently ignored. Low risk given you're always passing a user ID, but worth a note/handler.

3. **Offering fallback when RC returns no current offering.** In `PlanSelectionStep`, if `offerings?.current` is null (e.g., no offering configured in RC dashboard yet), `iapPackages` stays empty and the user sees an error when trying to select a paid plan. Acceptable for now, but worth a fallback message like "Prices temporarily unavailable, please try again."

4. **The `free` plan option in `PlanSelectionStep` on iOS** calls `onNext('free', null)` which triggers the Supabase `/api/choose-free-tier/` API — not an App Store purchase. This is fine (free tier = no IAP), but ensure the free trial doesn't inadvertently conflict with any App Store subscription trial offer you may configure in App Store Connect. Apple's guidelines require trial periods to be App Store-managed if you offer them via IAP.

---

## 2. Apple Sign In Edge Cases

### ✅ Handled correctly

- **First sign-in (name capture):** Apple only sends `givenName`/`familyName` on first authorization. The code captures both in `localStorage` (`apple_display_name`) immediately before the Supabase call, then reads and clears it in `App.tsx` during profile creation. This is the correct pattern.
- **Returning user (no name):** Falls back to `userData.user.user_metadata.full_name` → `appleDisplayName` (localStorage) → `'Lover'`. Correct ordering.
- **Cancel/dismiss:** `err.code === '1001'` (ASAuthorizationError.canceled) is caught and silently resets the loading spinner in both `LoginForm.tsx` and `Landing.tsx`. ✅
- **iOS-only native flow:** `Capacitor.getPlatform() === 'ios'` guard is consistent across all three entry points (`LoginForm.tsx`, `Landing.tsx`, `CompactLoginForm.tsx` delegates to `useHeroLogic`). Web falls back to `supabase.auth.signInWithOAuth`. ✅
- **`clientId: 'com.lovelanguages.app'`** matches `capacitor.config.ts` `appId`. Consistent. ✅

### ⚠️ Gaps

1. **Email relay not handled.** When a user chooses "Hide My Email," Apple provides a relay address like `abc123@privaterelay.appleid.com`. The code stores `userData.user.email` directly into the profile without any special handling. This will work for auth, but:
   - Any transactional emails (password reset, notifications) sent to relay addresses will work fine.
   - **If your app displays the user's email back to them** anywhere in the UI, they'll see the relay address. Consider storing it as-is but not displaying it (or display "Apple ID" instead).
   - No code currently blocks on this — it's a UX consideration, not a bug.

2. **No nonce for replay protection.** The native Apple Sign In call doesn't generate a cryptographic nonce:
   ```ts
   await SignInWithApple.authorize({
     clientId: 'com.lovelanguages.app',
     redirectURI: '',
     scopes: 'email name',
     // nonce: <missing>
   });
   ```
   Supabase's `signInWithIdToken` supports a `nonce` parameter. Without it, a stolen identity token could theoretically be replayed. Apple recommends including a nonce. **Fix:** generate a random nonce, hash it (SHA-256), pass the hash to `authorize()` as `nonce`, and pass the raw nonce to `signInWithIdToken({ nonce: rawNonce })`. Medium-severity security issue.

3. **`authorizationCode` not captured.** Apple provides an `authorizationCode` alongside `identityToken` that's used for server-side token validation and (critically) for revoking access when a user deletes their account. Apple requires apps to support account deletion + token revocation. If you need to handle this (App Review may ask), you'll need to store `authorizationCode` server-side and call Apple's revocation endpoint. This is a **potential App Store rejection reason** for apps that don't implement account deletion properly.

---

## 3. Migration Safety

### ✅ Safe — no data loss risk

All three `ALTER TABLE` statements use `ADD COLUMN IF NOT EXISTS`:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_progress JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_source TEXT DEFAULT 'stripe';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT;
```

- **`onboarding_progress JSONB`** — nullable, no default. Existing rows stay NULL. Safe.
- **`subscription_source TEXT DEFAULT 'stripe'`** — has a default value. Existing rows will get `'stripe'` on backfill (PostgreSQL `ADD COLUMN` with a non-null default is instant in PG 11+ via metadata only). Existing web subscribers correctly labeled as `'stripe'`. ✅
- **`revenuecat_customer_id TEXT`** — nullable, no default. Existing rows stay NULL. Safe.
- **Index** uses `IF NOT EXISTS`. Re-runnable. ✅
- **No `DROP`, `TRUNCATE`, or destructive operations.** Zero data loss risk.
- **Migration is idempotent** — can be re-applied without error.

**One note:** `subscription_source DEFAULT 'stripe'` means existing users who already have an App Store subscription (if any were onboarded before this migration) won't have `'app_store'` set automatically. The DB reconciliation in `App.tsx` handles this at next login by detecting active RC entitlements and updating the profile. This is fine.

---

## 4. App Store Review Rejection Risks

| Risk | Status |
|------|--------|
| Native Sign In with Apple (required when any social login is offered) | ✅ Implemented |
| Restore Purchases button visible in subscription screen | ✅ Present in `SubscriptionRequired.tsx` |
| Restore Purchases button present during onboarding plan selection | ⚠️ **Missing** (see below) |
| In-app purchases go through Apple (no external payment link on iOS) | ✅ `useIAP` routes to RevenueCat |
| No external payment links visible to iOS users | Needs verification |
| Account deletion with Apple token revocation | ⚠️ Not implemented |
| App privacy policy accessible without login | Not reviewed (out of scope) |

### ⚠️ Restore button missing from `PlanSelectionStep`

The `SubscriptionRequired.tsx` screen (shown when a user hits a paywalled feature) correctly shows "Restore Purchases" on iOS. However, `PlanSelectionStep.tsx` (the onboarding plan picker) does **not** have a restore button. Apple's guidelines state restore must be accessible "where subscription products are offered." The App Review team often flags this.

**Fix:** Add the same restore button to `PlanSelectionStep` when `useIAP` is true:
```tsx
{useIAP && (
  <button onClick={handleRestorePurchases} className="...">
    Restore Purchases
  </button>
)}
```

### ⚠️ Free trial via non-Apple mechanism on iOS

The free trial (7-day) is activated via `/api/choose-free-tier/` (server-side, not App Store). Apple requires that if you offer a free trial for a subscription, it must go through App Store subscriptions (introductory offers). Offering a free trial outside of the App Store on iOS is **a grey area** that can trigger App Review scrutiny. 

Options:
- Configure a 7-day introductory offer in App Store Connect (free trial for first subscription period) and let RevenueCat handle it.
- Or rename it "Free Plan" rather than "7-Day Free Trial" to avoid ambiguity.

---

## 5. Security Concerns

### 🔴 Medium: No nonce in Apple Sign In flow

As noted above, the `identityToken` exchange with Supabase is performed without a nonce. This enables token replay attacks. Fix with SHA-256 nonce generation.

### ✅ Webhook authentication is correct

`REVENUECAT_WEBHOOK_SECRET` is verified via `Authorization: Bearer <secret>` header comparison. Standard pattern, correctly implemented.

### ✅ No IAP verification bypass possible

Purchase flow: RevenueCat SDK → App Store → RevenueCat webhook → your DB. The client never self-reports subscription status to your API — it all flows through RevenueCat webhooks. This is the secure pattern (vs. trusting the client).

### ✅ Service key used only in webhook

`SUPABASE_SERVICE_KEY` is only used in `api/webhooks/revenuecat.ts` (server-side). Not exposed to client. ✅

### ⚠️ Low: `VITE_REVENUECAT_API_KEY` is a public API key

This is expected — RevenueCat iOS API keys are designed to be embedded in the app (similar to Firebase). Not a security issue, but worth a comment in the env file noting it's safe to be public.

### ⚠️ Low: `intended_role` stored in localStorage before OAuth

Before the Apple Sign In redirect, `localStorage.setItem('intended_role', selectedRole)` is set. This persists across sessions and could be read/modified by injected scripts. Low risk given it's just a UX hint (not a permission decision), but worth noting.

---

## Recommended Fixes (Priority Order)

1. **[Medium / App Review Risk]** Add nonce to Apple Sign In calls (`LoginForm.tsx`, `Landing.tsx`)
2. **[App Review Risk]** Add "Restore Purchases" button to `PlanSelectionStep` on iOS
3. **[App Review Risk / Future]** Implement account deletion + Apple token revocation endpoint
4. **[App Review Consideration]** Evaluate whether free trial should be an App Store introductory offer instead of server-side
5. **[Low]** Populate `revenuecat_customer_id` in webhook, or remove the column
6. **[Low]** Handle `SUBSCRIBER_ALIAS` webhook event explicitly
7. **[UX]** Handle Apple email relay display gracefully in the UI

---

## Files Reviewed

- `services/purchases.ts` — RevenueCat wrapper
- `migrations/042_apple_subscriptions_and_onboarding.sql` — DB changes
- `api/webhooks/revenuecat.ts` — Subscription event handler
- `components/hero/LoginForm.tsx` — Apple Sign In (hero flow)
- `components/Landing.tsx` — Apple Sign In (landing flow)
- `components/hero-concepts/shared/CompactLoginForm.tsx` — Apple Sign In (concept flow)
- `components/onboarding/Onboarding.tsx` — Progress persistence
- `components/onboarding/steps/shared/PlanSelectionStep.tsx` — IAP plan selection
- `components/SubscriptionRequired.tsx` — Restore purchases
- `App.tsx` — RC initialization, Apple name capture, DB reconciliation
- `capacitor.config.ts` — App ID, iOS config
- `package.json` — Dependencies (`@revenuecat/purchases-capacitor ^12.2.0`, `@capacitor-community/apple-sign-in ^7.1.0`)
