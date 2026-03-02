# Apple App Store Compliance: Sign in with Apple + In-App Purchase

## Why This Is Needed

Apple rejected Love Languages v1.0 for iOS on Feb 17, 2026 (Submission ID: 588a4b7b). Two violations:

- **Guideline 4.8 (Login Services)** — Must offer Sign in with Apple alongside Google OAuth
- **Guideline 3.1.1 (In-App Purchase)** — Subscriptions must be purchasable via IAP on iOS; can't use Stripe alone

## Architecture Decision

- **Sign in with Apple**: Native iOS via `@capacitor-community/apple-sign-in` plugin, token passed to Supabase via `signInWithIdToken()`
- **In-App Purchase**: RevenueCat (`@revenuecat/purchases-capacitor`) for iOS; keep Stripe for web
- **Single source of truth**: Both systems write to the same `profiles` table columns (`subscription_plan`, `subscription_status`, etc.)
- **New column** `subscription_source` distinguishes where the subscription was purchased

---

## Part 1: Sign in with Apple (Native iOS)

### 1.1 Why Native (Not Web OAuth)

`capacitor.config.ts` has `limitsNavigationsToAppBoundDomains: true`. This blocks web OAuth redirects to `appleid.apple.com`. Native Sign in with Apple bypasses WKWebView entirely — iOS presents a system-level dialog.

### 1.2 NPM Package

```bash
npm install @capacitor-community/apple-sign-in
npx cap sync ios
```

The `cap sync` step auto-updates `ios/App/CapApp-SPM/Package.swift` to include the new Swift package.

### 1.3 Apple Developer Portal Configuration

1. **Enable capability on App ID**
   - Go to Certificates, Identifiers & Profiles > Identifiers
   - Find `com.lovelanguages.app`
   - Under Capabilities, check "Sign in with Apple"
   - Save

2. **Create a Services ID** (for web OAuth to continue working)
   - Go to Identifiers > "+" > "Services IDs"
   - Identifier: `com.lovelanguages.app.web`
   - Description: "Love Languages Web"
   - Enable "Sign in with Apple" and Configure:
     - Primary App ID: `com.lovelanguages.app`
     - Web Domain: `<your-supabase-project>.supabase.co`
     - Return URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Save

3. **Create a Sign in with Apple Key**
   - Go to Keys > "+"
   - Name: "Love Languages Sign In"
   - Enable "Sign in with Apple", configure with Primary App ID
   - Continue > Register
   - **Download the `.p8` file** (one-time download only!)
   - Note the **Key ID** (10-character alphanumeric)

4. **Note your Team ID** (visible in Membership Details, 10 chars)

5. **(Optional) Register email relay**
   - Services > Sign in with Apple for Email Communication
   - Register `noreply@lovelanguages.io` so Apple can relay emails for users who hide their address

### 1.4 Supabase Dashboard Configuration

In Authentication > Providers > Apple:
1. Enable the Apple provider
2. Fill in:
   - **Services ID**: `com.lovelanguages.app.web`
   - **Team ID**: your 10-char Team ID
   - **Key ID**: from the `.p8` key
   - **Private Key**: paste the `.p8` file contents
3. **CRITICAL**: Add `com.lovelanguages.app` (the iOS bundle ID) to the authorized client IDs list. Without this, `signInWithIdToken()` will reject tokens issued for the native app.

### 1.5 Xcode Configuration

**Create entitlements file**: `ios/App/App/App.entitlements`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
    <key>com.apple.developer.in-app-purchases</key>
    <true/>
</dict>
</plist>
```

**In Xcode**:
1. Open `ios/App/App.xcodeproj`
2. Select App target > Signing & Capabilities
3. Click "+ Capability" > add "Sign in with Apple"
4. Click "+ Capability" > add "In-App Purchase"
5. Set your Development Team if not already set

### 1.6 Code: New Service — `services/apple-auth.ts`

```typescript
import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { supabase } from './supabase';

export function shouldUseNativeAppleAuth(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function signInWithAppleNative() {
  const appleResponse = await SignInWithApple.authorize({
    clientId: 'com.lovelanguages.app',
    redirectURI: 'https://www.lovelanguages.io', // Required by plugin, not used for native
    scopes: 'email name',
    state: '',
    nonce: '',
  });

  const identityToken = appleResponse.response.identityToken;
  if (!identityToken) throw new Error('No identity token from Apple');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  });
  if (error) throw error;

  // Apple only provides name on FIRST sign-in ever. Capture it.
  const givenName = appleResponse.response.givenName;
  const familyName = appleResponse.response.familyName;
  if (givenName || familyName) {
    const fullName = [givenName, familyName].filter(Boolean).join(' ');
    await supabase.auth.updateUser({ data: { full_name: fullName } });
  }

  return { data, error: null };
}
```

### 1.7 Code: Modify OAuth Handlers

Three files have duplicate OAuth handlers. Each needs the same native Apple branch inserted before the existing web OAuth flow:

**`hooks/useHeroLogic.ts`** — `handleOAuthSignIn` (lines 251-269)
**`components/Hero.tsx`** — `handleMobileOAuthSignIn` (lines 256-277)
**`components/hero/LoginForm.tsx`** — `handleOAuthSignIn` (lines 65-83)

Pattern for each:
```typescript
import { shouldUseNativeAppleAuth, signInWithAppleNative } from '../services/apple-auth';

// Add at the top of the handler, before the existing signInWithOAuth call:
if (provider === 'apple' && shouldUseNativeAppleAuth()) {
  try {
    await signInWithAppleNative();
    // Success — auth state listener handles the rest
  } catch (err: any) {
    const msg = err?.message || 'Apple Sign In failed';
    // Error code 1001 = user cancelled — don't show error
    if (!msg.includes('cancel') && !msg.includes('1001')) {
      setMessage(msg);
    }
    setOauthLoading(null);
  }
  return;
}
// ... existing web OAuth flow unchanged below
```

**`components/hero-concepts/shared/CompactLoginForm.tsx`** — No changes needed, it delegates to `useHeroLogic`.

### 1.8 Investigation Needed: Google OAuth on iOS

`limitsNavigationsToAppBoundDomains: true` may also break Google OAuth redirects on iOS. This wasn't flagged by Apple but should be tested. If broken, a similar native approach would be needed for Google (using `@codetrix-studio/capacitor-google-auth` or similar).

---

## Part 2: In-App Purchase via RevenueCat

### 2.1 App Store Connect Setup

**Create a Subscription Group**: "Love Languages Plans"

| Product ID | Reference Name | Price | Duration |
|---|---|---|---|
| `com.lovelanguages.app.standard.weekly` | Standard Weekly | $6.99/wk | 1 week |
| `com.lovelanguages.app.standard.monthly` | Standard Monthly | $18.99/mo | 1 month |
| `com.lovelanguages.app.standard.yearly` | Standard Yearly | $68.99/yr | 1 year |
| `com.lovelanguages.app.unlimited.weekly` | Unlimited Weekly | $11.99/wk | 1 week |
| `com.lovelanguages.app.unlimited.monthly` | Unlimited Monthly | $38.99/mo | 1 month |
| `com.lovelanguages.app.unlimited.yearly` | Unlimited Yearly | $139.99/yr | 1 year |

**Note**: Exact prices depend on Apple's available price tiers (e.g., $6.99 not $7.00).

**Free trial**: Set 7-day introductory offer on each product in App Store Connect.

**App Store Shared Secret**: Generate in App Store Connect > App > In-App Purchases > Manage > App-Specific Shared Secret. You'll need this for RevenueCat.

### 2.2 RevenueCat Dashboard Setup

1. Create new project at [app.revenuecat.com](https://app.revenuecat.com)
2. Add the App Store app:
   - Bundle ID: `com.lovelanguages.app`
   - App Store Connect Shared Secret (from step above)
3. Create **Entitlements**:
   - `standard` — grants Standard plan access
   - `unlimited` — grants Unlimited plan access
4. Create **Offerings** > Default Offering with 6 packages:
   - `standard_weekly` → product `com.lovelanguages.app.standard.weekly` → entitlement `standard`
   - `standard_monthly` → product `com.lovelanguages.app.standard.monthly` → entitlement `standard`
   - `standard_yearly` → product `com.lovelanguages.app.standard.yearly` → entitlement `standard`
   - `unlimited_weekly` → product `com.lovelanguages.app.unlimited.weekly` → entitlement `unlimited`
   - `unlimited_monthly` → product `com.lovelanguages.app.unlimited.monthly` → entitlement `unlimited`
   - `unlimited_yearly` → product `com.lovelanguages.app.unlimited.yearly` → entitlement `unlimited`
5. Configure **Webhooks** (Platform Server Notifications):
   - URL: `https://www.lovelanguages.io/api/webhooks/revenuecat`
   - Auth: Bearer token
6. Note your keys:
   - **Public iOS API key** → env var `VITE_REVENUECAT_IOS_KEY`
   - **Webhook bearer token** → env var `REVENUECAT_WEBHOOK_SECRET`

### 2.3 Vercel Environment Variables

Add to Vercel project settings:
```
VITE_REVENUECAT_IOS_KEY=<public iOS API key from RevenueCat>
REVENUECAT_WEBHOOK_SECRET=<webhook bearer token from RevenueCat>
```

### 2.4 Database Migration

**File**: `supabase/migrations/037_revenuecat_subscription_source.sql`

```sql
-- Add subscription source to distinguish Stripe vs IAP
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_source VARCHAR(20) DEFAULT 'stripe';
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rc_customer_id VARCHAR(100);

COMMENT ON COLUMN profiles.subscription_source
  IS 'Payment source: stripe, revenuecat, partner, promo';
COMMENT ON COLUMN profiles.rc_customer_id
  IS 'RevenueCat customer ID for IAP subscribers';

CREATE INDEX IF NOT EXISTS idx_profiles_rc_customer
  ON profiles(rc_customer_id) WHERE rc_customer_id IS NOT NULL;

-- Add event_source to subscription_events
-- NOTE: We intentionally keep the column named stripe_event_id
-- and reuse it for RevenueCat event IDs too. This avoids a risky
-- column rename that would break the existing Stripe webhook.
ALTER TABLE subscription_events
  ADD COLUMN IF NOT EXISTS event_source VARCHAR(20) DEFAULT 'stripe';

COMMENT ON COLUMN subscription_events.event_source
  IS 'Source: stripe or revenuecat';
```

This migration is additive and non-breaking. Existing Stripe flow continues working unchanged.

### 2.5 NPM Package

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync ios
```

**Note**: Adding two new SPM dependencies at once (apple-sign-in + revenuecat) could cause Xcode build issues. If so, add and sync one at a time.

### 2.6 Type Changes

**File**: `types.ts` — Add to Profile interface (after line 36, after `stripe_customer_id`):

```typescript
subscription_source?: 'stripe' | 'revenuecat' | 'partner' | 'promo';
rc_customer_id?: string;
```

### 2.7 New Service: `services/revenuecat.ts`

Singleton wrapping the RevenueCat SDK:

```typescript
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import type { PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { supabase } from './supabase';

class RevenueCatService {
  private initialized = false;
  private isNative = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async initialize(userId: string): Promise<void> {
    if (!this.isNative || this.initialized) return;
    const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
    if (!apiKey) return;

    await Purchases.configure({ apiKey, appUserID: userId });
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    this.initialized = true;
  }

  isAvailable(): boolean {
    return this.isNative && this.initialized;
  }

  async getOfferings() {
    if (!this.isAvailable()) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current || null;
  }

  async purchase(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    if (!this.isAvailable()) return { success: false, error: 'Not available' };

    try {
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      const hasAccess = result.customerInfo.entitlements.active['standard']
        || result.customerInfo.entitlements.active['unlimited'];

      if (hasAccess) {
        await this.syncToBackend(result.customerInfo);
        return { success: true, customerInfo: result.customerInfo };
      }
      return { success: false, error: 'No entitlements after purchase' };
    } catch (err: any) {
      if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { success: false, error: 'cancelled' };
      }
      return { success: false, error: err.message || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (!this.isAvailable()) return { success: false, error: 'Not available' };
    try {
      const result = await Purchases.restorePurchases();
      await this.syncToBackend(result.customerInfo);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async openManagement(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await Purchases.showManageSubscriptions();
    } catch {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  }

  private async syncToBackend(customerInfo: CustomerInfo): Promise<void> {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      let plan: string = 'none';
      let period: string = 'monthly';

      if (customerInfo.entitlements.active['unlimited']) {
        plan = 'unlimited';
        period = this.extractPeriod(customerInfo.entitlements.active['unlimited'].productIdentifier);
      } else if (customerInfo.entitlements.active['standard']) {
        plan = 'standard';
        period = this.extractPeriod(customerInfo.entitlements.active['standard'].productIdentifier);
      }

      await fetch('/api/sync-iap-status/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan, period }),
      });
    } catch {
      // Non-fatal — webhook provides durable sync
    }
  }

  private extractPeriod(productId: string): string {
    if (productId.includes('weekly')) return 'weekly';
    if (productId.includes('yearly')) return 'yearly';
    return 'monthly';
  }
}

export const revenuecat = new RevenueCatService();
```

### 2.8 New Hook: `hooks/usePayment.ts`

Abstracts Stripe vs RevenueCat for UI components:

```typescript
import { useState, useEffect } from 'react';
import { revenuecat } from '../services/revenuecat';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface UsePaymentReturn {
  isIAP: boolean;
  iapPrices: Map<string, string>;   // "standard_monthly" → "$18.99" (localized)
  iapPackages: Map<string, PurchasesPackage>;
  loading: boolean;
  purchaseIAP: (plan: string, period: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  openManagement: () => Promise<void>;
}

export function usePayment(): UsePaymentReturn {
  const isIAP = revenuecat.isAvailable();
  const [iapPrices, setIapPrices] = useState<Map<string, string>>(new Map());
  const [iapPackages, setIapPackages] = useState<Map<string, PurchasesPackage>>(new Map());
  const [loading, setLoading] = useState(isIAP);

  useEffect(() => {
    if (!isIAP) return;
    loadOfferings();
  }, [isIAP]);

  const loadOfferings = async () => {
    const offering = await revenuecat.getOfferings();
    if (!offering) { setLoading(false); return; }

    const prices = new Map<string, string>();
    const packages = new Map<string, PurchasesPackage>();

    for (const pkg of offering.availablePackages) {
      const id = pkg.identifier; // e.g. "standard_monthly"
      prices.set(id, pkg.product.priceString); // e.g. "$18.99"
      packages.set(id, pkg);
    }

    setIapPrices(prices);
    setIapPackages(packages);
    setLoading(false);
  };

  const purchaseIAP = async (plan: string, period: string) => {
    const pkg = iapPackages.get(`${plan}_${period}`);
    if (!pkg) return { success: false, error: 'Package not found' };
    return revenuecat.purchase(pkg);
  };

  return {
    isIAP,
    iapPrices,
    iapPackages,
    loading,
    purchaseIAP,
    restorePurchases: () => revenuecat.restorePurchases(),
    openManagement: () => revenuecat.openManagement(),
  };
}
```

### 2.9 Initialize RevenueCat in `App.tsx`

After `fetchProfile` succeeds (~line 283, where profile data is available):

```typescript
import { revenuecat } from './services/revenuecat';

// Inside fetchProfile success path:
if (data?.id) {
  revenuecat.initialize(data.id);
}
```

---

## Part 3: API Endpoints

### 3.1 New: `api/webhooks/revenuecat.ts`

Mirrors `api/webhooks/stripe.ts` (same patterns: idempotency, partner cascade, gift passes).

**Key differences from Stripe webhook:**
- Auth via `Authorization: Bearer <token>` header (not Stripe signature)
- JSON body (not raw body — `bodyParser: true`)
- RevenueCat event types: `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`
- `app_user_id` = Supabase user ID (set during `Purchases.configure()`)
- Event ID stored in existing `stripe_event_id` column (reused) with `event_source: 'revenuecat'`

**Product ID mapping:**
```typescript
const PRODUCT_MAP: Record<string, { plan: string; period: string }> = {
  'com.lovelanguages.app.standard.weekly':   { plan: 'standard',  period: 'weekly' },
  'com.lovelanguages.app.standard.monthly':  { plan: 'standard',  period: 'monthly' },
  'com.lovelanguages.app.standard.yearly':   { plan: 'standard',  period: 'yearly' },
  'com.lovelanguages.app.unlimited.weekly':  { plan: 'unlimited', period: 'weekly' },
  'com.lovelanguages.app.unlimited.monthly': { plan: 'unlimited', period: 'monthly' },
  'com.lovelanguages.app.unlimited.yearly':  { plan: 'unlimited', period: 'yearly' },
};
```

**Event handling:**

| RevenueCat Event | Action | Mirrors Stripe Event |
|---|---|---|
| `INITIAL_PURCHASE` | Activate subscription, set `subscription_source: 'revenuecat'`, cascade to partner | `checkout.session.completed` |
| `RENEWAL` | Update dates, confirm active | `customer.subscription.updated` |
| `PRODUCT_CHANGE` | Update plan/period | `customer.subscription.updated` |
| `CANCELLATION` | Deactivate, 7-day win-back trial, revoke partner access | `customer.subscription.deleted` |
| `EXPIRATION` | Same as cancellation | `customer.subscription.deleted` |
| `BILLING_ISSUE` | Set `past_due` | `invoice.payment_failed` |

**Gift pass creation**: For unlimited yearly on `INITIAL_PURCHASE`, create gift pass (same logic as Stripe webhook lines 150-180).

### 3.2 New: `api/sync-iap-status.ts`

Called by frontend immediately after successful IAP purchase for instant UI feedback (webhook is the durable sync but may take seconds).

```typescript
import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { plan, period } = req.body || {};
  if (!['standard', 'unlimited'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const supabase = createServiceClient();
  await supabase.from('profiles').update({
    subscription_plan: plan,
    subscription_status: 'active',
    subscription_period: period || 'monthly',
    subscription_source: 'revenuecat',
    subscription_started_at: new Date().toISOString(),
  }).eq('id', auth.userId);

  return res.status(200).json({ success: true });
}
```

**Note**: Only allows activating, not deactivating. Deactivation only happens via webhook.

**Race condition**: Both this endpoint and the webhook may fire for the same purchase. Since both write identical values, this is safe (idempotent).

### 3.3 Modify: `api/subscription-status.ts`

Add `source` to the subscription response:
```typescript
subscription: {
  plan, status, period, endsAt, startedAt,
  source: profile?.subscription_source || 'stripe',  // NEW
}
```

### 3.4 Modify: `api/create-customer-portal.ts`

Add check for IAP subscribers before opening Stripe portal:
```typescript
if (profile?.subscription_source === 'revenuecat') {
  return res.status(400).json({
    error: 'IAP_SUBSCRIPTION',
    message: 'Manage your subscription in your device\'s App Store settings.'
  });
}
```

---

## Part 4: Frontend UI Changes (Detailed)

### Design Principles for These Changes

- **Minimal disruption**: Keep existing layout and styling. Only add IAP branching.
- **Localized prices**: On iOS, RevenueCat returns localized prices (e.g., "$18.99", "18,99 EUR"). These replace the hardcoded `$` + USD amounts.
- **Dark mode**: `SubscriptionRequired.tsx` uses hardcoded Tailwind (paywall, shown pre-theme). `PricingPage.tsx` and `SubscriptionManager.tsx` use CSS variables. New UI must match each component's existing pattern.
- **i18n**: New user-facing strings should use translation keys. For the initial implementation, English strings are acceptable — translation keys can be added in a follow-up.
- **Mobile spacing**: All components already handle responsive layout (grid-cols-1 → md:grid-cols-3). New elements (restore button, trust text) must fit naturally in the existing flow.

### 4.1 `components/SubscriptionRequired.tsx`

**Import and hook setup:**
```typescript
import { usePayment } from '../hooks/usePayment';

// Inside component:
const { isIAP, iapPrices, purchaseIAP, restorePurchases, loading: iapLoading } = usePayment();
```

**Price display** (lines 398-407 — plan card price area):
When `isIAP`, show localized App Store price instead of calculated USD:
```tsx
<div className="mb-4">
  {isIAP && plan.id !== 'free' ? (
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold text-gray-900">
        {iapPrices.get(`${plan.id}_${billingPeriod}`) || '...'}
      </span>
    </div>
  ) : (
    // Existing USD price display (lines 399-407) — unchanged
  )}
</div>
```

**Subscribe handler** (`handleSubscribe`, lines 171-281):
Insert IAP branch after the free tier check (after line 174):
```typescript
if (isIAP && selectedPlan !== 'free') {
  setLoading(true);
  setError(null);
  analytics.trackCheckoutStarted({ plan: selectedPlan, billing_period: billingPeriod, price: 0, currency: 'IAP' });

  const result = await purchaseIAP(selectedPlan, billingPeriod);
  if (result.success) {
    analytics.track('subscription_completed', { plan: selectedPlan, source: 'iap' });
    onSubscribed();
  } else if (result.error !== 'cancelled') {
    setError(result.error || 'Purchase failed');
    analytics.track('subscription_failed', { plan: selectedPlan, error_type: 'iap_failed', error_message: result.error });
  }
  setLoading(false);
  return;
}
```

**Restore Purchases button** — After the subscribe button (after line 461), before trust signals:
```tsx
{isIAP && (
  <button
    onClick={async () => {
      setLoading(true);
      setError(null);
      const result = await restorePurchases();
      if (result.success) onSubscribed();
      else setError(result.error || 'No purchases to restore');
      setLoading(false);
    }}
    disabled={loading}
    className="w-full mt-3 py-3 rounded-2xl font-medium text-sm text-gray-600
               border border-gray-200 hover:bg-gray-50 transition-colors
               disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Restore Previous Purchase
  </button>
)}
```
Full-width secondary button with `mt-3` gap from the primary CTA. Matches the component's rounded-2xl style.

**Trust signals** (lines 464-468):
When `isIAP` and paid plan selected:
```tsx
{isIAP && selectedPlan !== 'free'
  ? 'Payment managed securely by Apple'
  : selectedPlan === 'free'
    ? t('subscription.choice.free.noCardRequired')
    : t('subscription.common.securePayment')}
```

### 4.2 `components/PricingPage.tsx`

**Import and hook:**
```typescript
import { usePayment } from '../hooks/usePayment';
const { isIAP, iapPrices, purchaseIAP, restorePurchases, openManagement } = usePayment();
```

**Price display** (lines 357-364):
```tsx
<span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
  {isIAP ? iapPrices.get(`${plan.id}_${billingPeriod}`) || '...' : `$${price}`}
</span>
{!isIAP && (
  <span style={{ color: 'var(--text-secondary)' }}>/{periodLabel}</span>
)}
```
On IAP, the localized price string is self-contained (e.g., "$18.99"). No need for the period suffix — the billing toggle already indicates the period.

**Subscribe handler** (`handleSubscribe`, lines 80-117):
```typescript
const handleSubscribe = async (planId: string, period: string) => {
  if (isIAP) {
    setCheckoutLoading(planId);
    setError(null);
    const result = await purchaseIAP(planId, period);
    if (result.success) {
      await fetchSubscriptionStatus();
    } else if (result.error !== 'cancelled') {
      setError(result.error || 'Purchase failed');
    }
    setCheckoutLoading(null);
    return;
  }
  // Existing Stripe flow unchanged...
};
```

Update the button onClick to pass plan id and period:
```tsx
onClick={() => isIAP
  ? handleSubscribe(plan.id, billingPeriod)
  : priceId && handleSubscribe(priceId, billingPeriod)}
```

**Manage subscription** (lines 119-142):
```typescript
const handleManageSubscription = async () => {
  if (status?.subscription?.source === 'revenuecat') {
    await openManagement();
    return;
  }
  // Existing Stripe portal flow...
};
```

**Restore link** — After pricing cards (after line 421), before gift passes:
```tsx
{isIAP && (
  <div className="mt-8 text-center">
    <button
      onClick={async () => {
        const result = await restorePurchases();
        if (result.success) fetchSubscriptionStatus();
      }}
      className="text-sm underline hover:no-underline"
      style={{ color: 'var(--text-secondary)' }}
    >
      Restore Previous Purchase
    </button>
  </div>
)}
```
Styled as a text link with CSS variables (matches dark mode). `mt-8` spacing to separate from cards.

**Cancel anytime text** (line 459):
```tsx
{isIAP
  ? 'Manage or cancel anytime in your device Settings'
  : t('subscription.pricing.cancelAnytime')}
```

**SubscriptionStatus interface** (lines 8-35):
Add `source` to subscription:
```typescript
subscription: {
  plan: string;
  status: string;
  period: string | null;
  endsAt: string | null;
  source?: string;  // NEW
};
```

### 4.3 `components/SubscriptionManager.tsx`

**Props** (lines 5-16):
Add to profile interface:
```typescript
subscription_source?: string;
```

**isPayer check** (line 30):
```typescript
const isPayer = (profile.stripe_customer_id || profile.subscription_source === 'revenuecat') && !isInherited;
```

**Manage subscription** (lines 70-105):
Add IAP branch:
```typescript
import { revenuecat } from '../services/revenuecat';

const handleManageSubscription = async () => {
  if (hasPartner && isPayer && !showWarning) {
    setShowWarning(true);
    return;
  }

  // IAP subscriber — open App Store management
  if (profile.subscription_source === 'revenuecat') {
    await revenuecat.openManagement();
    return;
  }

  // Existing Stripe portal flow...
};
```

**Restore button** — In the payer section (after line 291), inside the card:
```tsx
{Capacitor.isNativePlatform() && (
  <button
    onClick={async () => {
      const result = await revenuecat.restorePurchases();
      if (result.success) window.location.reload();
    }}
    className="w-full mt-3 py-2 text-sm text-[var(--text-secondary)] underline hover:no-underline"
  >
    Restore Previous Purchase
  </button>
)}
```

### 4.4 `components/onboarding/steps/shared/PlanSelectionStep.tsx`

**Price loading** (`fetchPrices`, lines 46-87):
Add IAP branch at the start:
```typescript
import { revenuecat } from '../../../../services/revenuecat';

const fetchPrices = async () => {
  if (revenuecat.isAvailable()) {
    const offering = await revenuecat.getOfferings();
    if (offering) {
      const prices = new Map<string, string>();
      for (const pkg of offering.availablePackages) {
        prices.set(pkg.identifier, pkg.product.priceString);
      }
      setIapPrices(prices);
      setIsIAP(true);
      setLoading(false);
      return;
    }
  }
  // Existing Stripe price fetch...
};
```

**Price display** (lines 322-334):
```tsx
{isIAP ? (
  <div className="text-2xl md:text-3xl font-bold text-gray-900">
    {iapPrices.get(`${plan.id}_${billingPeriod}`) || '...'}
  </div>
) : (
  // Existing USD display
)}
```

**Continue button** (line 382):
When IAP, pass package identifier instead of Stripe price ID:
```typescript
onNext(
  selectedPlan || 'standard',
  isIAP ? `${selectedPlan}_${billingPeriod}` : getPriceId()
)
```

### 4.5 `components/onboarding/Onboarding.tsx` (~line 904)

**Checkout branch**:
```typescript
} else if (data.selectedPriceId) {
  if (revenuecat.isAvailable()) {
    // IAP purchase flow
    const parts = data.selectedPriceId.split('_'); // e.g. "standard_monthly"
    const plan = parts[0];
    const period = parts[1];
    const offering = await revenuecat.getOfferings();
    const pkg = offering?.availablePackages.find(p => p.identifier === data.selectedPriceId);

    if (pkg) {
      const result = await revenuecat.purchase(pkg);
      if (result.success) {
        onComplete();
        return;
      }
      if (result.error === 'cancelled') {
        setSaving(false);
        return; // Stay on plan selection
      }
      // Show error
      alert(result.error || 'Purchase failed. Please try again.');
      setSaving(false);
      return;
    }
  }
  // Existing Stripe checkout flow...
```

### 4.6 Apple Subscription Disclosure Requirements

Apple requires subscription apps to display on any purchase screen:
- Auto-renewal terms
- Link to Terms of Service
- Link to Privacy Policy

Add below the trust signals on both `SubscriptionRequired.tsx` and `PricingPage.tsx`:
```tsx
{isIAP && selectedPlan !== 'free' && (
  <p className="text-center text-xs text-gray-400 mt-2 px-4 leading-relaxed">
    Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
    Payment will be charged to your Apple ID account.{' '}
    <a href="https://www.lovelanguages.io/terms/" className="underline">Terms</a>
    {' '}&{' '}
    <a href="https://www.lovelanguages.io/privacy/" className="underline">Privacy Policy</a>
  </p>
)}
```

---

## Part 5: Edge Cases & Cross-Platform Behavior

| Scenario | What Happens |
|---|---|
| Web subscriber opens iOS app | Profile has `source: 'stripe'`, `status: 'active'` — no paywall shown. "Manage" opens Stripe portal. |
| IAP subscriber opens web | Profile has `source: 'revenuecat'`, `status: 'active'` — no paywall shown. "Manage" shows "Manage in App Store" message. |
| IAP subscriber cancels, tries Stripe on web | Works. `subscription_source` updates to `stripe`. |
| Reinstall / new device | "Restore Previous Purchase" → `Purchases.restorePurchases()` → syncs to backend. |
| Both sync endpoint and webhook fire | Both write identical values (same plan, status, period) — idempotent, no conflict. |
| Apple issues refund | RevenueCat sends `CANCELLATION` → webhook deactivates subscription + revokes partner access. |
| Apple billing grace period (6-16 days) | RevenueCat sends `BILLING_ISSUE` → `past_due` status. If resolved, `RENEWAL`. If not, `EXPIRATION`. |
| Partner inheritance from IAP subscriber | Same as Stripe — `subscription_granted_by` set on partner profile. Webhook cascades all changes. |

---

## File Summary

### New Files (7)
| File | Purpose |
|------|---------|
| `services/apple-auth.ts` | Native Apple Sign In + Supabase token exchange |
| `services/revenuecat.ts` | RevenueCat SDK wrapper (initialize, purchase, restore, manage) |
| `hooks/usePayment.ts` | Platform-aware payment abstraction for UI |
| `api/webhooks/revenuecat.ts` | Server webhook for RevenueCat subscription events |
| `api/sync-iap-status.ts` | Immediate IAP status sync for instant UI |
| `ios/App/App/App.entitlements` | Sign in with Apple + IAP capabilities |
| `supabase/migrations/037_revenuecat_subscription_source.sql` | DB: subscription_source, rc_customer_id, event_source |

### Modified Files (12)
| File | Change Summary |
|------|---------------|
| `hooks/useHeroLogic.ts` | Native Apple auth branch in `handleOAuthSignIn` |
| `components/Hero.tsx` | Native Apple auth branch in `handleMobileOAuthSignIn` |
| `components/hero/LoginForm.tsx` | Native Apple auth branch in `handleOAuthSignIn` |
| `types.ts` | Add `subscription_source`, `rc_customer_id` to Profile |
| `App.tsx` | Initialize RevenueCat after profile load |
| `components/SubscriptionRequired.tsx` | IAP prices, purchase flow, restore button, trust signals, Apple disclosure |
| `components/PricingPage.tsx` | IAP prices, purchase flow, manage→App Store, restore link, disclosure |
| `components/SubscriptionManager.tsx` | Manage→App Store for IAP, isPayer check, restore |
| `components/onboarding/steps/shared/PlanSelectionStep.tsx` | Load RevenueCat offerings, IAP price display |
| `components/onboarding/Onboarding.tsx` | IAP purchase branch in checkout (~line 904) |
| `api/subscription-status.ts` | Add `source` to subscription response |
| `api/create-customer-portal.ts` | Reject IAP subscribers with helpful message |

### Unchanged (confirmed no modifications needed)
| File | Why |
|------|-----|
| `utils/api-middleware.ts` | `getSubscriptionPlan()` reads same profile columns — works for both sources |
| `api/webhooks/stripe.ts` | `stripe_event_id` column NOT renamed — no changes |
| `api/create-checkout-session.ts` | Web-only endpoint |
| `components/LimitReachedModal.tsx` | Just navigates to /pricing |
| Rate limiting code | Reads plan from profiles regardless of source |

---

## Implementation Order

**Phase A — Sign in with Apple (can deploy independently)**
1. Database migration (additive, non-breaking)
2. `npm install @capacitor-community/apple-sign-in && npx cap sync ios`
3. Create `ios/App/App/App.entitlements` + enable in Xcode
4. Apple Developer Portal + Supabase Dashboard config
5. Create `services/apple-auth.ts`
6. Modify 3 OAuth handlers
7. Build, test on iOS simulator/device
8. Deploy → resubmit to App Review for Guideline 4.8

**Phase B — In-App Purchase**
1. App Store Connect: create subscription products
2. RevenueCat Dashboard: create project, entitlements, offerings, webhook
3. Add Vercel env vars
4. `npm install @revenuecat/purchases-capacitor && npx cap sync ios`
5. Update `types.ts`
6. Create `services/revenuecat.ts` + `hooks/usePayment.ts`
7. Create `api/webhooks/revenuecat.ts` + `api/sync-iap-status.ts`
8. Modify `api/subscription-status.ts` + `api/create-customer-portal.ts`
9. Add RevenueCat initialization to `App.tsx`
10. Modify all frontend components (SubscriptionRequired, PricingPage, SubscriptionManager, PlanSelectionStep, Onboarding)
11. Test in StoreKit Sandbox on physical device
12. Deploy → resubmit to App Review for Guideline 3.1.1

---

## Testing Checklist

### Sign in with Apple
- [ ] iOS: Tap Apple button → native dialog appears (not web redirect)
- [ ] iOS: Complete sign-in → Supabase session created, profile loaded
- [ ] iOS: Cancel sign-in → no error shown, back to login screen
- [ ] iOS: Sign in with same Apple ID again → existing account linked
- [ ] Web: Apple OAuth still works (web redirect flow)
- [ ] Web: Google OAuth still works
- [ ] Web: Email/password login still works

### In-App Purchase
- [ ] iOS: Paywall shows App Store prices (localized, not hardcoded USD)
- [ ] iOS: Tap subscribe → native App Store purchase sheet appears
- [ ] iOS: Complete purchase → subscription active, app unlocked immediately
- [ ] iOS: Cancel purchase sheet → back to paywall, no error
- [ ] iOS: "Restore Previous Purchase" works after reinstall
- [ ] iOS: "Manage Subscription" opens App Store settings
- [ ] iOS: Subscription cancellation (via Settings) → webhook fires → profile deactivated
- [ ] iOS: Partner cascade works (subscribe → partner gets access, cancel → partner loses access)
- [ ] Web: Stripe checkout still works (unchanged)
- [ ] Web: Stripe portal still works for web subscribers
- [ ] Web: IAP subscriber on web sees "Manage in App Store" message
- [ ] Webhook idempotency: same event sent twice → only processed once
- [ ] Sandbox auto-renewal: weekly sub renews every 3 minutes in sandbox

### Cross-Platform
- [ ] Subscribe on web → open iOS app → no paywall, subscription shown
- [ ] Subscribe on iOS → open web → no paywall, subscription shown
- [ ] Cancel IAP → subscribe via Stripe on web → works, source updates to `stripe`

---

## Open Questions / Risks

1. **Google OAuth on iOS**: `limitsNavigationsToAppBoundDomains: true` may break Google OAuth too. Test this early — may need native Google auth plugin.
2. **Apple price tiers**: Exact prices may differ slightly from Stripe (e.g., $6.99 vs $7.00). Cosmetic difference but could confuse users switching platforms.
3. **RevenueCat free tier**: Free up to $2,500/month in tracked revenue, then 1% fee. Evaluate at scale.
4. **Existing subscribers**: Users who already subscribed via Stripe (during web-only period) won't have IAP entitlements. They should NOT be prompted to buy again on iOS.
5. **Two SPM dependencies at once**: Adding apple-sign-in + revenuecat simultaneously may cause Xcode build issues. If so, add one at a time.
