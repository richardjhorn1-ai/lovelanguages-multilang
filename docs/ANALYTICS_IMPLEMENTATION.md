# Analytics Implementation Guide

> **Last updated:** March 2026
> **Replaces:** `docs/archived/ANALYTICS_IMPLEMENTATION.md` (original planning doc)

Comprehensive reference for Love Languages' analytics infrastructure. Covers all event destinations, the full event taxonomy, implementation patterns, and debugging.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Three Destinations](#three-destinations)
3. [Event Taxonomy](#event-taxonomy)
4. [Implementation Patterns](#implementation-patterns)
5. [Blog Analytics](#blog-analytics)
6. [Debugging](#debugging)
7. [Adding New Events](#adding-new-events)
8. [Privacy & Consent](#privacy--consent)

---

## Architecture Overview

All analytics flow through a single `AnalyticsService` singleton in `services/analytics.ts`. Every event is automatically enriched and sent to **three destinations** — no component ever talks to GA4, PostHog, or Supabase directly (except the blog, which uses a lightweight dual-send helper).

```
┌───────────────────────────────────┐
│         React Components          │
│  (Landing, Chat, Games, etc.)     │
└───────────────┬───────────────────┘
                │  analytics.track('event_name', { params })
                ▼
┌───────────────────────────────────┐
│     AnalyticsService (singleton)  │
│     services/analytics.ts         │
│                                   │
│  • Type-safe EventName union      │
│  • Auto-enrichment (timestamp,    │
│    session_duration, user_id)     │
│  • Event queueing until identify  │
│  • Debug mode logging             │
└──┬──────────┬──────────┬──────────┘
   │          │          │
   ▼          ▼          ▼
┌──────┐  ┌────────┐  ┌──────────┐
│ GA4  │  │PostHog │  │ Supabase │
│gtag()│  │capture │  │  /api/   │
│      │  │        │  │analytics │
│      │  │        │  │ -event/  │
└──────┘  └────────┘  └──────────┘
```

### Blog (Astro SSR)

The blog has its own lightweight tracking in `BlogAnalytics.astro` that sends to GA4 + PostHog directly (no AnalyticsService import possible in Astro).

---

## Three Destinations

### 1. Google Analytics 4 (GA4)

| Item | Value |
|------|-------|
| Measurement ID | `G-ZJWLDBC5QP` |
| Loaded in | `index.html` (app) + `BaseLayout.astro` (blog) |
| API | `window.gtag('event', name, params)` |
| Special events | `purchase` (revenue tracking on subscription_completed) |
| Web Vitals | LCP, FID, INP, CLS via `initWebVitals()` |

### 2. PostHog

| Item | Value |
|------|-------|
| Project API Key | `phc_xvUI7lnN0lwitluz83jKHGB4HPivRJ4pJ2QT58GXVlV` |
| Host | `https://us.i.posthog.com` |
| Loaded in | `index.html` (app) + `BaseLayout.astro` (blog) |
| API | `window.posthog.capture(name, params)` |
| Config | `person_profiles: 'identified_only'`, `capture_pageview: false` (SPA), `capture_pageleave: true` |
| Blog config | `capture_pageview: true` (MPA — Astro handles full page loads) |
| Identity | `posthog.identify()` called in `AnalyticsService.identify()` |
| Reset | `posthog.reset()` called on logout |

### 3. Supabase (Per-User Journey)

| Item | Value |
|------|-------|
| Table | `analytics_events` |
| Endpoint | `POST /api/analytics-event/` (Edge Runtime) |
| Auth | Service key (server-side only) |
| Allowlist | 50+ events validated in `api/analytics-event.ts` |
| Skipped events | `page_view`, `scroll`, `user_engagement` (too high frequency) |
| Payload | `user_id`, `anonymous_id`, `event_name`, `event_params`, `page_path`, `referrer`, `session_id` |

---

## Event Taxonomy

### Acquisition

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `page_view` | `page_path`, `page_title` | `App.tsx` via `trackPageView()` | SPA-aware, fires on route changes |
| `cta_click` | `cta_location`, `cta_text`, `destination` | Various CTA buttons | |
| `app_store_click` | `platform` | App store links | |
| `ai_referral_landing` | `ai_source`, `referrer`, `landing_page` | `index.html` + `captureReferralSource()` | Detects 9 AI engines |
| `blog_referral_landing` | `utm_source`, `utm_medium`, `utm_campaign`, etc. | `captureReferralSource()` | UTM param capture |

### Signup & Auth

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `signup_started` | `method` (email/google/apple) | `Landing.tsx`, `Hero.tsx` | **Guarded by `isSignUp`** — won't fire on login |
| `signup_completed` | `method`, `referral_source` | `App.tsx` (3 code paths) | Handles success, duplicate, recovery. Ref + localStorage dedup |
| `user_logged_in` | `method` | `App.tsx` returning-user path | **Session-deduped** (`sessionStorage` key per userId) |
| `user_logged_out` | — | `Navbar.tsx` before `signOut()` | Also calls `posthog.reset()` |

### Onboarding

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `onboarding_step` | `step_number`, `step_name`, `role`, `total_steps`, `time_on_previous_step_ms` | `Onboarding.tsx` | Tracks time between steps |
| `onboarding_completed` | `role`, `total_steps`, `steps_completed`, `total_time_ms`, `target_language`, `native_language`, `selected_plan` | `Onboarding.tsx` | Timing via `useRef(Date.now())` |

### Monetization

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `paywall_view` | `trigger_reason`, `page_context` | `SubscriptionRequired.tsx` | Ref-guarded against double-fire |
| `paywall_dismissed` | `time_viewed_ms` | `SubscriptionRequired.tsx` | |
| `plan_selected` | `plan`, `billing_period` | `SubscriptionRequired.tsx` | |
| `checkout_started` | `plan`, `billing_period`, `price`, `currency` | `SubscriptionRequired.tsx` | Both Stripe (web) and RevenueCat (iOS) |
| `subscription_completed` | `plan`, `billing_period`, `price`, `currency` | `App.tsx` (web) + `SubscriptionRequired.tsx` (iOS) | Also fires GA4 `purchase` event for revenue |
| `subscription_failed` | `plan`, `billing_period`, `error_message`, `platform` | `SubscriptionRequired.tsx` catch block | iOS path |
| `trial_started` | `plan`, `trial_days` | `SubscriptionRequired.tsx` | Both web + iOS |
| `trial_converted` | `trial_duration_ms` | `App.tsx` | Fires when trial user completes purchase. Uses `sessionStorage` flag + profile-dependent `useEffect` |
| `trial_expired` | `user_id` | `SubscriptionRequired.tsx` | Fires on paywall mount when trial is expired. **Session-deduped** |

### Engagement

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `chat_message_sent` | `mode`, `message_length`, `session_message_count` | `ChatArea.tsx` | |
| `chat_response_received` | `mode`, `response_time_ms` | `ChatArea.tsx` | |
| `word_added` | `target_lang`, `source`, `word_count_total` | `ChatArea.tsx`, `LoveLog.tsx` | |
| `game_started` | `game_type`, `word_count`, `difficulty` | All 7 game modes | |
| `game_completed` | `game_type`, `score`, `duration_ms`, `accuracy` | All 7 game modes | |
| `level_test_started` | `target_lang` | `LevelTest.tsx` | |
| `level_test_completed` | `target_lang`, `level_result`, `score` | `LevelTest.tsx` | |
| `voice_session_started` | `mode` (voice/listen) | Voice components | |
| `voice_session_ended` | `mode`, `duration_ms` | Voice components | |
| `tts_played` | `target_lang`, `word_or_phrase` | LoveLog word detail | |
| `challenge_created` | `challenge_type`, `word_count` | Challenge components | |
| `challenge_completed` | `challenge_type`, `score` | Challenge components | |
| `word_practiced` | `game_type`, `correct`, `streak` | Game components | |
| `first_word_added` | `word`, `target_lang` | First vocab word | |
| `first_chat_message` | `mode`, `target_lang` | First AI interaction | |
| `first_game_played` | `game_type`, `score` | First game completion | |

### Retention

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `session_start` | `days_since_last`, `session_count_total` | Auto | |
| `streak_maintained` | `streak_count`, `activity_type` | `useScoreTracking.ts` | Fires at multiples of 5 (`STREAK_TO_LEARN`) only |
| `streak_broken` | `streak_count`, `previous_streak_count` | `useScoreTracking.ts` | Fires when broken streak was ≥ 5 |
| `partner_invited` | `invite_method` | Partner invite flow | |
| `partner_joined` | `inviter_user_id` | Partner accept flow | |

> **Note on streak naming:** `streak_count` represents consecutive correct answers in word practice games, NOT calendar days. The `STREAK_TO_LEARN` constant (5) determines mastery.

### Churn Signals

| Event | Parameters | Where Fired | Notes |
|-------|-----------|-------------|-------|
| `error_encountered` | `error_type`, `error_message`, `page_context` | Error boundaries | |
| `feature_abandoned` | `feature`, `time_spent_ms`, `completion_percent` | Various | |
| `account_deleted` | `reason`, `days_active` | Account deletion | |

### Blog-Only Events (Astro)

These are tracked in `BlogAnalytics.astro` and sent to GA4 + PostHog (not Supabase):

| Event | Parameters | Notes |
|-------|-----------|-------|
| `scroll_depth` | `percent` (25/50/75/100), `native_lang`, `target_lang`, `article_slug` | Threshold-based |
| `time_on_page` | `seconds` (30/60/120/300), `native_lang`, `target_lang`, `article_slug` | Threshold-based |
| `article_view` | `native_lang`, `target_lang`, `article_slug`, `page_path` | On page load |
| `outbound_click` | `url`, `native_lang`, `target_lang` | External link clicks |
| `app_link_click` | `destination`, `native_lang`, `target_lang`, `article_slug` | Internal CTA clicks |
| `blog_sticky_cta_click` | — | `ArticleLayout.astro` sticky CTA |

---

## Implementation Patterns

### 1. Importing & Basic Usage

```typescript
import { analytics } from '../services/analytics';

// Simple tracking
analytics.track('game_completed', {
  game_type: 'flashcard',
  score: 85,
  duration_ms: 45000,
  accuracy: 0.85,
});

// Convenience methods (type-safe params)
analytics.trackSignupStarted('google');
analytics.trackCheckoutStarted({ plan: 'standard', billing_period: 'monthly', price: 19, currency: 'USD' });
```

### 2. User Identification

```typescript
// Called after auth — queued events flush automatically
analytics.identify(userId, {
  native_language: 'en',
  target_language: 'pl',
  subscription_plan: 'standard',
});
```

The service queues all events (except `page_view`) until `identify()` is called. After identification, the queue flushes automatically.

### 3. Session Deduplication

For events that should fire **once per browser session** (not on every page refresh), use `sessionStorage`:

```typescript
// Pattern: sessionStorage guard
const guardKey = `login_tracked_${userId}`;
if (!sessionStorage.getItem(guardKey)) {
  sessionStorage.setItem(guardKey, 'true');
  analytics.trackLogin(provider);
}
```

Used for: `user_logged_in`, `trial_expired`, `trial_converted`.

### 4. Component-Level Deduplication

For events that should fire once per component mount, use `useRef`:

```typescript
const trackedRef = useRef(false);

useEffect(() => {
  if (!trackedRef.current) {
    trackedRef.current = true;
    analytics.track('paywall_view', { trigger_reason, page_context });
  }
}, []);
```

Used for: `paywall_view`, `onboarding_completed`.

### 5. Timing Patterns

Track how long something takes using `useRef(Date.now())`:

```typescript
const startTime = useRef(Date.now());

// Later, at completion:
analytics.track('onboarding_completed', {
  total_time_ms: Date.now() - startTime.current,
});
```

### 6. Milestone-Based Events (Streak Pattern)

For events that could fire very frequently (e.g., every correct answer), gate on milestones:

```typescript
const STREAK_TO_LEARN = 5;

// Only fire at multiples of 5
if (isCorrect && newStreak >= STREAK_TO_LEARN && newStreak % STREAK_TO_LEARN === 0) {
  analytics.track('streak_maintained', { streak_count: newStreak });
}
```

### 7. Profile-Dependent Events

When an event depends on profile data that loads asynchronously:

```typescript
// Step 1: Set a flag when the trigger happens
sessionStorage.setItem('subscription_just_completed', 'true');

// Step 2: Watch for profile to load
useEffect(() => {
  if (profile?.free_tier_chosen_at && sessionStorage.getItem('subscription_just_completed')) {
    sessionStorage.removeItem('subscription_just_completed');
    analytics.track('trial_converted', { trial_duration_ms: /* compute */ });
  }
}, [profile]);
```

---

## Blog Analytics

The Astro blog (`blog/`) has a separate tracking setup because it can't import the React `AnalyticsService`.

### Setup

1. **GA4 + PostHog scripts** are loaded in `blog/src/layouts/BaseLayout.astro`
2. **Engagement events** are tracked in `blog/src/components/BlogAnalytics.astro`

### How BlogAnalytics.astro Works

A `trackEvent()` helper sends to both GA4 and PostHog:

```javascript
function trackEvent(eventName, params) {
  if (hasGtag()) gtag('event', eventName, params);
  if (hasPostHog()) window.posthog.capture(eventName, params);
}
```

Language context (`nativeLang`, `targetLang`, `articleSlug`) is extracted from the URL path structure: `/learn/{nativeLang}/{targetLang}/{slug}`.

---

## Debugging

### Enable Debug Mode

Set in browser console:
```javascript
localStorage.setItem('analytics_debug', 'true');
```

Or automatic on `localhost`. All events log as `[Analytics] Event: event_name { params }`.

### Verify Events

1. **GA4**: Use [GA4 DebugView](https://analytics.google.com/) → Admin → DebugView
2. **PostHog**: Check [PostHog dashboard](https://us.posthog.com/) → Activity → Live Events
3. **Supabase**: Query `analytics_events` table directly

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Events not appearing | Not identified yet | Events queue until `identify()` — check auth flow |
| Duplicate events | Missing dedup guard | Add `useRef` or `sessionStorage` guard |
| PostHog events missing | Script not loaded | Check `hasPostHog()` in console |
| Supabase 400 error | Event not in allowlist | Add to `ALLOWED_EVENTS` in `api/analytics-event.ts` |
| Blog events in GA4 only | Old BlogAnalytics.astro | Ensure `trackEvent()` helper is used (sends to both) |

---

## Adding New Events

### Checklist

1. **Add to `EventName` type** in `services/analytics.ts` (line ~163)
2. **Add to Supabase allowlist** in `api/analytics-event.ts` `ALLOWED_EVENTS` set
3. **Create interface** (optional) for typed params in `services/analytics.ts`
4. **Add convenience method** (optional) on `AnalyticsService` class
5. **Fire the event** in the appropriate component
6. **Add dedup guard** if the event could fire multiple times unintentionally
7. **Update this document** with the new event in the taxonomy table

### Example: Adding a `settings_changed` Event

```typescript
// 1. Add to EventName (services/analytics.ts)
type EventName =
  // ... existing events
  | 'settings_changed';

// 2. Add to Supabase allowlist (api/analytics-event.ts)
const ALLOWED_EVENTS = new Set([
  // ... existing events
  'settings_changed',
]);

// 3. Fire in component
analytics.track('settings_changed', {
  setting: 'theme',
  old_value: 'light',
  new_value: 'dark',
});
```

---

## Privacy & Consent

- **User IDs** are hashed (`hashUserId()`) before sending to GA4/PostHog
- **Raw user IDs** are only sent to Supabase (our own database)
- **Anonymous IDs** (`ll_anonymous_id` in localStorage) track pre-auth users
- **PostHog** uses `person_profiles: 'identified_only'` — no anonymous user profiles created
- **No PII** in event parameters
- **PostHog project API key** (`phc_...`) is a public write-only token — safe for client-side code (same security model as GA4 measurement IDs)

---

## Key Files

| File | Purpose |
|------|---------|
| `services/analytics.ts` | Core AnalyticsService — all tracking logic |
| `api/analytics-event.ts` | Supabase Edge Function — event allowlist + storage |
| `index.html` | GA4 + PostHog script tags (app) |
| `blog/src/layouts/BaseLayout.astro` | GA4 + PostHog script tags (blog) |
| `blog/src/components/BlogAnalytics.astro` | Blog engagement tracking |
| `components/Landing.tsx` | Signup tracking |
| `components/onboarding/Onboarding.tsx` | Onboarding step + completion tracking |
| `components/SubscriptionRequired.tsx` | Paywall, checkout, trial events |
| `App.tsx` | Auth lifecycle, subscription success, trial conversion |
| `components/Navbar.tsx` | Logout tracking |
| `components/games/hooks/useScoreTracking.ts` | Streak milestone events |
