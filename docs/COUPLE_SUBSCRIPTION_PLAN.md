# Couple Subscription System - Implementation Plan

**Created:** January 8, 2026
**Status:** Planning
**Estimated Effort:** 3-4 hours

---

## Executive Summary

Implement a "Couple Pass" subscription model where one payment grants access to two accounts (payer + partner). Partners are linked via invite, and the partner's access is tied to the payer's subscription lifecycle.

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Current State Analysis](#2-current-state-analysis)
3. [System Design](#3-system-design)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Webhook Logic](#6-webhook-logic)
7. [UI Components](#7-ui-components)
8. [User Flows](#8-user-flows)
9. [Edge Cases](#9-edge-cases)
10. [Implementation Phases](#10-implementation-phases)
11. [Testing Checklist](#11-testing-checklist)
12. [Usage Limits](#12-usage-limits)

---

## 1. Requirements

### Core Features
- **Couple Pass**: One subscription = two accounts (payer + partner)
- **Invite System**: Payer generates ONE invite link for partner
- **Linked Fate**: Partner's access tied to payer's subscription
- **Re-invite**: After breakup, payer can invite someone new
- **Breakup Flow**: Either partner can initiate unlinking (with fun UX)
- **Subscription Management**: Payer can manage/cancel via Stripe portal

### Business Rules
- Only active subscribers can generate invites
- Maximum ONE partner per subscription
- Partner inherits same plan and limits as payer
- Payer cancellation revokes partner access
- Breakup revokes partner access but preserves payer subscription
- Partner can become independent by subscribing themselves

---

## 2. Current State Analysis

### What Exists
| Component | Status | Notes |
|-----------|--------|-------|
| `api/generate-invite.ts` | ✅ Exists | Creates 7-day invite tokens |
| `api/validate-invite.ts` | ✅ Exists | Public endpoint for pre-auth validation |
| `api/complete-invite.ts` | ✅ Exists | Links accounts bidirectionally |
| `api/webhooks/stripe.ts` | ✅ Exists | Handles subscription events |
| `api/create-checkout-session.ts` | ✅ Exists | Creates Stripe checkout |
| `JoinInvite.tsx` | ✅ Exists | UI for accepting invites |
| `SubscriptionRequired.tsx` | ✅ Exists | Paywall component |

### What's Missing
| Component | Status | Notes |
|-----------|--------|-------|
| `subscription_granted_by` column | ❌ Missing | Track inherited subscriptions |
| Invite → subscription grant logic | ❌ Missing | complete-invite doesn't grant access |
| `api/delink-partner.ts` | ❌ Missing | Breakup endpoint |
| `api/create-customer-portal.ts` | ❌ Missing | Stripe portal access |
| Inherited subscription check | ❌ Missing | App.tsx only checks own subscription |
| Cascade on cancel/update | ❌ Missing | Webhook doesn't update partner |
| Subscription management UI | ❌ Missing | No way to manage/cancel |
| Breakup UI | ❌ Missing | No way to unlink |
| Invite UI for subscribers | ❌ Missing | No prompt to invite partner |

---

## 3. System Design

### Subscription Ownership Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAYER (Subscription Owner)                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ stripe_customer_id: "cus_xxx"                            │    │
│  │ subscription_plan: "unlimited"                           │    │
│  │ subscription_status: "active"                            │    │
│  │ subscription_granted_by: NULL  ← Pays directly           │    │
│  │ linked_user_id: "partner-uuid"                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ INVITES                           │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PARTNER (Inherited Access)                               │    │
│  │ stripe_customer_id: NULL  ← No Stripe relationship       │    │
│  │ subscription_plan: "unlimited"  ← Mirrors payer          │    │
│  │ subscription_status: "active"   ← Mirrors payer          │    │
│  │ subscription_granted_by: "payer-uuid"  ← Tracks source   │    │
│  │ linked_user_id: "payer-uuid"                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Access Control Logic

```typescript
function hasSubscriptionAccess(profile: Profile): boolean {
  // Direct subscription
  if (profile.subscription_status === 'active') return true;

  // Inherited subscription (partner granted)
  if (profile.subscription_granted_by) return true;

  // Beta tester override
  if (isBetaTester(profile.email)) return true;

  return false;
}
```

### Invite Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Payer   │────▶│ Generate │────▶│  Share   │────▶│ Partner  │
│ Pays $   │     │  Invite  │     │  Link    │     │ Accepts  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                   │
     │                                                   ▼
     │                                            ┌──────────┐
     │                                            │  Link    │
     │                                            │ Accounts │
     │                                            └──────────┘
     │                                                   │
     ▼                                                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    BOTH HAVE ACCESS                          │
│  Payer: subscription_status = 'active'                       │
│  Partner: subscription_granted_by = payer.id                 │
└──────────────────────────────────────────────────────────────┘
```

### Breakup Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Initiate │────▶│ Confirm  │────▶│  Delink  │────▶│ Revoke   │
│ Breakup  │     │ "goodbye"│     │ Accounts │     │ Partner  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                  ┌───────────┐
                                  │ Payer can │
                                  │ re-invite │
                                  └───────────┘
```

---

## 4. Database Schema

### Migration: `015_couple_subscription.sql`

```sql
-- ============================================================
-- Migration 015: Couple Subscription System
-- Enables "one pays, partner gets free" model
-- ============================================================

-- 1. Add inherited subscription tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_granted_by UUID REFERENCES profiles(id);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_granted_at TIMESTAMPTZ;

-- 2. Ensure linked_user_id exists (may already be present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linked_user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN linked_user_id UUID REFERENCES profiles(id);
  END IF;
END $$;

-- 3. Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_linked_user
ON profiles(linked_user_id) WHERE linked_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_granted_by
ON profiles(subscription_granted_by) WHERE subscription_granted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 4. Add comments for documentation
COMMENT ON COLUMN profiles.subscription_granted_by IS
  'UUID of the payer who granted this user free access. NULL if user pays directly.';

COMMENT ON COLUMN profiles.subscription_granted_at IS
  'When the inherited subscription was granted.';

COMMENT ON COLUMN profiles.linked_user_id IS
  'UUID of linked partner (bidirectional relationship).';

-- 5. RLS policy for partner lookup (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can view linked partner profile'
  ) THEN
    CREATE POLICY "Users can view linked partner profile" ON profiles
      FOR SELECT USING (id = (SELECT linked_user_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;
```

### Updated profiles table structure

```
profiles
├── id UUID (PK)
├── email TEXT
├── role VARCHAR ('student' | 'tutor')
├── full_name TEXT
├── ...existing fields...
│
├── # Subscription fields (existing)
├── subscription_plan VARCHAR ('none' | 'standard' | 'unlimited')
├── subscription_status VARCHAR ('active' | 'inactive' | 'past_due' | 'canceled')
├── subscription_period VARCHAR ('monthly' | 'yearly')
├── subscription_started_at TIMESTAMPTZ
├── subscription_ends_at TIMESTAMPTZ
├── stripe_customer_id VARCHAR
│
├── # Couple system fields
├── linked_user_id UUID (FK → profiles.id)      -- Partner link
├── subscription_granted_by UUID (FK → profiles.id)  -- Who granted access
└── subscription_granted_at TIMESTAMPTZ         -- When access was granted
```

---

## 5. API Endpoints

### 5.1 Update: `api/generate-invite.ts`

**Changes:**
- Require active subscription to generate invite
- Allow only ONE active (unused, unexpired) invite at a time
- Return existing invite if one exists (don't create duplicate)

```typescript
// Key logic changes:

// 1. Must have active subscription
if (profile.subscription_status !== 'active') {
  return res.status(403).json({
    error: 'Active subscription required',
    code: 'SUBSCRIPTION_REQUIRED'
  });
}

// 2. Can't invite if inherited subscription (only payers can invite)
if (profile.subscription_granted_by) {
  return res.status(403).json({
    error: 'Only subscription owners can invite partners',
    code: 'NOT_SUBSCRIPTION_OWNER'
  });
}

// 3. Can't have two partners
if (profile.linked_user_id) {
  return res.status(400).json({
    error: 'Already linked to a partner',
    code: 'ALREADY_LINKED'
  });
}

// 4. Check for existing active invite
const { data: existingInvite } = await supabase
  .from('invite_tokens')
  .select('token, expires_at')
  .eq('created_by', profile.id)
  .is('used_at', null)
  .gt('expires_at', new Date().toISOString())
  .single();

if (existingInvite) {
  return res.status(200).json({
    token: existingInvite.token,
    expiresAt: existingInvite.expires_at,
    isExisting: true,
    message: 'Returning your existing invite link'
  });
}

// 5. Create new invite (7 days validity)
// ... existing creation logic ...
```

### 5.2 Update: `api/complete-invite.ts`

**Changes:**
- Grant inherited subscription when linking
- Set `subscription_granted_by` on partner profile

```typescript
// After successfully linking accounts:

// 1. Get inviter's subscription info
const { data: inviter } = await supabase
  .from('profiles')
  .select('id, subscription_plan, subscription_status, subscription_ends_at')
  .eq('id', invite.created_by)
  .single();

// 2. Grant inherited subscription to joining user
if (inviter?.subscription_status === 'active') {
  const { error: grantError } = await supabase
    .from('profiles')
    .update({
      subscription_plan: inviter.subscription_plan,
      subscription_status: 'active',
      subscription_ends_at: inviter.subscription_ends_at,
      subscription_granted_by: inviter.id,
      subscription_granted_at: new Date().toISOString()
    })
    .eq('id', joiningUser.id);

  if (grantError) {
    console.error('[complete-invite] Failed to grant subscription:', grantError);
    // Don't fail the invite - linking succeeded, subscription grant is secondary
  } else {
    console.log(`[complete-invite] Granted ${inviter.subscription_plan} access to ${joiningUser.id}`);
  }
}

// 3. Return success with subscription info
return res.status(200).json({
  success: true,
  message: 'Successfully linked with partner',
  subscription: inviter?.subscription_status === 'active' ? {
    plan: inviter.subscription_plan,
    grantedBy: inviter.id,
    expiresAt: inviter.subscription_ends_at
  } : null
});
```

### 5.3 New: `api/delink-partner.ts`

**Purpose:** Handle "breakup" - unlink accounts and revoke inherited access

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS and method check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify user
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Get current user's profile with partner info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, linked_user_id, subscription_granted_by, subscription_status, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No partner to unlink' });
    }

    const partnerId = profile.linked_user_id;
    const isPayer = !profile.subscription_granted_by;
    const now = new Date().toISOString();

    // 1. Delink both profiles (bidirectional)
    const { error: delinkError1 } = await supabase
      .from('profiles')
      .update({ linked_user_id: null })
      .eq('id', profile.id);

    const { error: delinkError2 } = await supabase
      .from('profiles')
      .update({ linked_user_id: null })
      .eq('id', partnerId);

    if (delinkError1 || delinkError2) {
      console.error('[delink-partner] Delink error:', delinkError1 || delinkError2);
      return res.status(500).json({ error: 'Failed to unlink accounts' });
    }

    // 2. Handle subscription access
    if (isPayer) {
      // I'm the payer - revoke partner's inherited access
      await supabase
        .from('profiles')
        .update({
          subscription_plan: 'none',
          subscription_status: 'inactive',
          subscription_granted_by: null,
          subscription_granted_at: null,
          subscription_ends_at: null
        })
        .eq('id', partnerId);

      console.log(`[delink-partner] Revoked access for partner ${partnerId}`);
    } else {
      // I'm the partner with inherited access - I lose it
      await supabase
        .from('profiles')
        .update({
          subscription_plan: 'none',
          subscription_status: 'inactive',
          subscription_granted_by: null,
          subscription_granted_at: null,
          subscription_ends_at: null
        })
        .eq('id', profile.id);

      console.log(`[delink-partner] User ${profile.id} lost inherited access`);
    }

    // 3. Expire any pending invites from either party
    await supabase
      .from('invite_tokens')
      .update({ expires_at: now })
      .in('created_by', [profile.id, partnerId])
      .is('used_at', null);

    // 4. Return appropriate message
    return res.status(200).json({
      success: true,
      wasPayingUser: isPayer,
      message: isPayer
        ? 'Accounts unlinked. Your subscription continues. You can invite a new partner.'
        : 'Accounts unlinked. You\'ll need your own subscription to continue learning.'
    });

  } catch (err: any) {
    console.error('[delink-partner] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 5.4 New: `api/create-customer-portal.ts`

**Purpose:** Generate Stripe Customer Portal URL for subscription management

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_granted_by, linked_user_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      // Check if they have inherited subscription
      if (profile?.subscription_granted_by) {
        return res.status(400).json({
          error: 'Cannot manage inherited subscription',
          code: 'INHERITED_SUBSCRIPTION',
          message: 'Ask your partner to manage the subscription.'
        });
      }
      return res.status(400).json({ error: 'No subscription found' });
    }

    // Determine return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lovelanguages.xyz';
    const returnUrl = `${baseUrl}/profile?tab=subscription`;

    // Create Stripe portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.status(200).json({
      url: session.url,
      hasPartner: !!profile.linked_user_id
    });

  } catch (err: any) {
    console.error('[create-customer-portal] Error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
```

---

## 6. Webhook Logic

### Update: `api/webhooks/stripe.ts`

#### 6.1 On Subscription Canceled

```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  // 1. Find payer by customer ID
  const { data: payer } = await supabase
    .from('profiles')
    .select('id, linked_user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!payer) {
    console.error('[stripe-webhook] No profile found for customer:', customerId);
    break;
  }

  // 2. Cancel payer's subscription
  await supabase
    .from('profiles')
    .update({
      subscription_plan: 'none',
      subscription_status: 'canceled',
      subscription_ends_at: new Date().toISOString()
    })
    .eq('id', payer.id);

  console.log(`[stripe-webhook] Canceled subscription for ${payer.id}`);

  // 3. Revoke ALL inherited subscriptions from this payer
  const { data: revokedUsers, error: revokeError } = await supabase
    .from('profiles')
    .update({
      subscription_plan: 'none',
      subscription_status: 'canceled',
      subscription_granted_by: null,
      subscription_granted_at: null,
      subscription_ends_at: new Date().toISOString()
    })
    .eq('subscription_granted_by', payer.id)
    .select('id, email');

  if (revokedUsers?.length) {
    console.log(`[stripe-webhook] Revoked access for ${revokedUsers.length} partner(s)`);
  }

  // 4. Non-blocking event log
  logSubscriptionEvent(supabase, {
    user_id: payer.id,
    event_type: 'subscription_canceled',
    stripe_event_id: event.id,
    metadata: {
      revoked_partners: revokedUsers?.map(u => u.id) || []
    }
  });

  break;
}
```

#### 6.2 On Subscription Updated

```typescript
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  // Get plan info
  const priceId = subscription.items.data[0]?.price?.id;
  const { plan, period } = getPlanFromPriceId(priceId);
  const periodEnd = subscription.current_period_end;
  const status = subscription.status;

  // Map Stripe status to app status
  let appStatus: string;
  if (status === 'active' || status === 'trialing') {
    appStatus = 'active';
  } else if (status === 'past_due') {
    appStatus = 'past_due';
  } else {
    appStatus = 'inactive';
  }

  // Find user by metadata or customer ID
  let userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
    userId = data?.id;
  }

  if (!userId) {
    console.error('[stripe-webhook] No user found for subscription update');
    break;
  }

  // 1. Update payer's subscription
  await supabase
    .from('profiles')
    .update({
      subscription_plan: plan,
      subscription_status: appStatus,
      subscription_period: period,
      subscription_ends_at: new Date(periodEnd * 1000).toISOString()
    })
    .eq('id', userId);

  console.log(`[stripe-webhook] Updated subscription for ${userId}: ${plan} (${appStatus})`);

  // 2. Update partner's inherited subscription to match
  const { data: updatedPartners } = await supabase
    .from('profiles')
    .update({
      subscription_plan: plan,
      subscription_status: appStatus,
      subscription_ends_at: new Date(periodEnd * 1000).toISOString()
    })
    .eq('subscription_granted_by', userId)
    .select('id');

  if (updatedPartners?.length) {
    console.log(`[stripe-webhook] Updated ${updatedPartners.length} partner(s) to match`);
  }

  // Non-blocking event log
  logSubscriptionEvent(supabase, {
    user_id: userId,
    event_type: 'subscription_updated',
    stripe_event_id: event.id,
    plan,
    status: appStatus,
    metadata: {
      updated_partners: updatedPartners?.map(u => u.id) || []
    }
  });

  break;
}
```

---

## 7. UI Components

### 7.1 `components/BreakupModal.tsx`

A "breakup" themed confirmation modal for unlinking accounts.

**Features:**
- Two-step confirmation (warning → type "goodbye")
- Shows consequences clearly
- Different messaging for payer vs partner
- Fun but respectful theming

**Key states:**
1. `warning` - Initial warning with consequences
2. `confirm` - Type "goodbye" to confirm
3. `processing` - Loading state
4. `complete` - Success (auto-closes)

### 7.2 `components/SubscriptionManager.tsx`

Displays subscription status and management options.

**For payers:**
- Shows plan, status, renewal date
- "Manage Subscription" button → Stripe portal
- Warning if partner will lose access

**For inherited subscriptions:**
- Shows "Free access from [partner]"
- No management options
- "Ask your partner to manage"

### 7.3 `components/InvitePartnerSection.tsx`

Shown to paying users without a partner.

**Features:**
- Prominent "Invite Your Partner" CTA
- Generate/display invite link
- Copy link button
- Show pending invite status
- Cancel invite option

### 7.4 `components/PartnerSection.tsx`

Shown in profile when linked to partner.

**Features:**
- Partner avatar and name
- Partner role (tutor/student)
- "Unlink" button with breakup flow
- Subscription status indicator

---

## 8. User Flows

### 8.1 New Subscriber Flow

```
1. User signs up → Onboarding → Paywall
2. User clicks "Subscribe" → Stripe Checkout
3. Payment successful → Redirect with success=true
4. App shows success toast
5. User sees "Invite Your Partner!" prompt
6. User generates invite link
7. User shares link with partner
8. Partner clicks link → Signs up or logs in
9. Partner accepts invite → Linked + free access
10. Both can now use the app
```

### 8.2 Partner Acceptance Flow

```
1. Partner receives invite link
2. Clicks link → /join/[token]
3. If not logged in → Sign up / Log in
4. Shown invite details (from whom, what plan)
5. Clicks "Join as Partner"
6. Accounts linked bidirectionally
7. Partner receives inherited subscription
8. Redirected to app with success message
```

### 8.3 Subscription Cancellation Flow

```
1. Payer goes to Profile → Subscription
2. Clicks "Manage Subscription"
3. Warning shown: "Partner will lose access"
4. Confirms → Stripe Customer Portal
5. Cancels in Stripe portal
6. Webhook received → Both accounts updated
7. Both lose access at end of billing period
```

### 8.4 Breakup Flow

```
1. Either partner goes to Profile → Partner section
2. Clicks "Unlink"
3. Warning modal shown with consequences
4. Types "goodbye" to confirm
5. Accounts unlinked
6. If initiator had inherited access → Loses it
7. If initiator was payer → Partner loses access
8. Payer can now invite someone new
```

---

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Partner already subscribed** | Keep their own subscription, don't override |
| **Payer cancels mid-cycle** | Both have access until period ends |
| **Partner breaks up** | Partner loses inherited access immediately |
| **Payer breaks up** | Partner loses access, payer keeps subscription |
| **Payer upgrades** | Partner automatically upgraded |
| **Payer downgrades** | Partner automatically downgraded |
| **Payment fails** | Both marked as `past_due`, grace period |
| **Invite expires** | Partner must request new invite |
| **Payer deletes account** | Partner loses access |
| **Partner wants independence** | Can subscribe, becomes own payer |
| **Both break up, reconcile** | Payer generates new invite |
| **Invite while already linked** | Error: "Already has partner" |
| **Accept own invite** | Error: "Cannot invite yourself" |

---

## 10. Implementation Phases

### Phase 1: Database (5 min)
- [ ] Create and run migration `015_couple_subscription.sql`
- [ ] Verify columns added in Supabase

### Phase 2: Invite System Updates (30 min)
- [ ] Update `api/generate-invite.ts` - require subscription, single invite
- [ ] Update `api/complete-invite.ts` - grant inherited subscription
- [ ] Test: Subscriber can generate invite
- [ ] Test: Partner gets subscription on accept

### Phase 3: Webhook Cascade (20 min)
- [ ] Update `webhooks/stripe.ts` - cascade cancellation
- [ ] Update `webhooks/stripe.ts` - cascade plan changes
- [ ] Test: Cancel payer → partner loses access
- [ ] Test: Upgrade payer → partner upgraded

### Phase 4: Delink API (20 min)
- [ ] Create `api/delink-partner.ts`
- [ ] Handle both payer and partner initiating
- [ ] Expire pending invites on breakup
- [ ] Test: Payer breakup → can re-invite
- [ ] Test: Partner breakup → loses access

### Phase 5: Customer Portal API (15 min)
- [ ] Create `api/create-customer-portal.ts`
- [ ] Handle inherited subscription case
- [ ] Test: Payer can access portal
- [ ] Test: Partner gets appropriate error

### Phase 6: App.tsx Update (5 min)
- [ ] Update subscription check to include inherited
- [ ] Test: Partner with inherited access can use app

### Phase 7: UI Components (45 min)
- [ ] Create `BreakupModal.tsx`
- [ ] Create `SubscriptionManager.tsx`
- [ ] Create `InvitePartnerSection.tsx`
- [ ] Create or update `PartnerSection.tsx`

### Phase 8: Profile Integration (20 min)
- [ ] Add subscription section to ProfileView
- [ ] Add partner section with unlink
- [ ] Add invite section for eligible users
- [ ] Wire up all components

### Phase 9: Testing (30 min)
- [ ] Full flow: Subscribe → Invite → Accept
- [ ] Cancel flow: Cancel → Both lose access
- [ ] Breakup flow: Unlink → Access revoked
- [ ] Re-invite flow: After breakup → New invite works

**Total Estimated Time: 3-4 hours**

---

## 11. Testing Checklist

### Subscription Flow
- [ ] New user can subscribe
- [ ] Subscriber sees "Invite Partner" prompt
- [ ] Subscriber can generate invite link
- [ ] Invite link works (validates correctly)
- [ ] Partner can accept invite
- [ ] Partner gets inherited subscription
- [ ] Partner can access app features

### Cancellation Flow
- [ ] Payer can access Stripe portal
- [ ] Cancellation updates payer's status
- [ ] Cancellation revokes partner's access
- [ ] Partner sees appropriate messaging

### Breakup Flow
- [ ] Either party can initiate breakup
- [ ] Confirmation requires typing "goodbye"
- [ ] Payer breakup → Partner loses access
- [ ] Partner breakup → Partner loses access
- [ ] After breakup, payer can re-invite
- [ ] Pending invites are expired

### Edge Cases
- [ ] Partner with existing subscription keeps it
- [ ] Upgrade cascades to partner
- [ ] Downgrade cascades to partner
- [ ] Can't invite if already linked
- [ ] Can't accept own invite
- [ ] Expired invite shows error

---

## 12. Usage Limits

Both payer and partner share the same plan limits:

| Feature | Standard | Unlimited |
|---------|----------|-----------|
| Text messages | 5,000/month | Unlimited |
| Voice mode | 60 min/month | Unlimited |
| Listen mode | 120 min/month | Unlimited |
| Level tests | 10/month | Unlimited |
| AI Challenges | 50/month | Unlimited |
| Games/Flashcards | Unlimited | Unlimited |
| Love Log words | Unlimited | Unlimited |

**Note:** Limits are per-user, not shared. Each person in the couple gets their own allocation.

---

## Appendix: File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `migrations/015_couple_subscription.sql` | New | Add database columns |
| `api/generate-invite.ts` | Update | Require subscription, single invite |
| `api/complete-invite.ts` | Update | Grant inherited subscription |
| `api/webhooks/stripe.ts` | Update | Cascade cancel/update to partner |
| `api/delink-partner.ts` | New | Breakup endpoint |
| `api/create-customer-portal.ts` | New | Stripe portal access |
| `App.tsx` | Update | Check inherited subscription |
| `components/BreakupModal.tsx` | New | Breakup confirmation UI |
| `components/SubscriptionManager.tsx` | New | Subscription display/manage |
| `components/InvitePartnerSection.tsx` | New | Invite partner UI |
| `components/PartnerSection.tsx` | New/Update | Partner display with unlink |
| `components/ProfileView.tsx` | Update | Integrate new components |
