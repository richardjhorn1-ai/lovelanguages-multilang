# iOS Launch Spec, Release Matrix, and Execution Program

Last updated: 2026-03-08

## Purpose

This document is the launch contract for shipping Love Languages as a high-quality iPhone-first iOS app. It combines:

1. The decision-complete launch spec.
2. The verified audit state as of this repo pass.
3. The implementation and verification program required for submission.

The goal is not "make the Capacitor build open on an iPhone." The goal is "ship an App Store-ready product with trusted billing state, native-safe return flows, a defensible offline promise, and no hidden launch-critical unknowns."

## Locked Product Decisions

- Launch target is iPhone first.
- Launch bar is best-in-class on the three critical journeys:
  - signup/onboarding -> entitlement -> first real practice
  - invite/linking
  - paying/subscribing and restore purchases
- Offline at launch is practice-first only:
  - cached vocabulary
  - cached scores/progress
  - flashcard/game practice
  - queued sync when network returns
- Native iOS payment surface is Apple IAP only.
- Stripe must not be surfaced as a native purchase path.
- Native deep links and return flows are mandatory for launch quality.
- Push notifications matter, but they are the first acceptable slip if a major launch area must move post-launch.
- Submission readiness includes repo work, Xcode/native configuration, App Store Connect, RevenueCat, Supabase auth redirect configuration, privacy/review requirements, and device QA.

## Success Criteria

Launch is only ready when all of the following are true:

- Client code cannot grant paid access by mutating profile subscription fields.
- Trusted entitlement state is written only by backend-owned paths.
- Invite links, auth returns, password reset links, and purchase-related returns land inside the app correctly.
- A new user can complete onboarding and reach first practice without getting stranded by pending billing or route confusion.
- Restore purchases, account deletion, Sign in with Apple, and privacy disclosures are App Review-safe.
- Practice surfaces remain useful from a cold offline restart after prior cache warmup.
- Repo state, native/Xcode state, dashboard state, and on-device behavior are all verified, not assumed.

## Current Audit Summary

### Repo verified in this session

- Client-side RevenueCat startup reconcile no longer writes subscription state into `profiles`.
- Authenticated client writes to server-managed billing/onboarding/profile-provider fields are now blocked at the database layer by migration `048_profile_client_write_guards.sql`.
- Native callback contract is now explicit in repo:
  - canonical web origin remains `APP_URL`
  - native auth callback is `lovelanguages://auth/callback`
  - repo bridge now handles `appUrlOpen`-style launches for:
    - `https://www.lovelanguages.io/...`
    - `lovelanguages://...`
- Repo now includes:
  - `@capacitor/app` as a dependency
  - `AuthCallback` route
  - native URL bridge wiring
  - native/web-aware auth redirect helpers
- Native Apple Sign In exists in repo, uses a nonce, and stores Apple revocation material through the backend.
- iOS paywall/onboarding purchase UI is Apple IAP only and exposes Restore Purchases.
- Practice-first offline support is real today:
  - vocabulary cache
  - word-score cache
  - queued score/game-session sync
  - reconnect/foreground sync attempts

### Repo-verified launch limitations

- Offline precache only warms the active language on login.
- Chat history is not persisted for offline restart.
- Pending challenges and pending word requests remain online-only.
- Offline sync still lacks explicit queue health UX, backoff strategy, and stuck-queue telemetry.
- Purchase success on iOS now waits for trusted server sync; UX hardening for delayed webhook confirmation is still needed.

### Native/Xcode surface audit result

- No checked-in `ios/` app project exists in this workspace.
- No real `Info.plist`, app entitlements file, URL Types, Associated Domains configuration, `PrivacyInfo.xcprivacy`, or Xcode capability state could be audited from this repo.
- The only iOS artifacts present locally are Capacitor library files under `node_modules/`, which do not verify the actual app target.

### Dashboard audit result

- App Store Connect, RevenueCat, and Supabase dashboard surfaces were not directly accessible from this repo session.
- Local environment scaffolding exists for Apple, RevenueCat, Stripe, and Supabase, but that is not sufficient to classify live dashboard configuration as verified.

## Decision-Complete Launch Spec

### 1. Product Scope

#### In scope at launch

- Email signup.
- Native Sign in with Apple.
- Native-safe auth return handling for any web OAuth that remains exposed.
- Onboarding to entitlement to first practice.
- Invite/linking flows.
- Apple IAP purchase flow.
- Restore purchases.
- Password reset from iPhone.
- Account deletion.
- Practice-first offline support.

#### Explicitly limited at launch

- Offline support outside practice surfaces.
- Full chat continuity across offline app restart.
- Pending challenge/request workflows offline.
- Push notifications, if they threaten launch-critical quality elsewhere.
- iPad-specific polish.

### 2. Entitlement and Billing Contract

- `profiles.subscription_*` fields remain the trusted read surface for the app at launch.
- The client may read entitlement state.
- The client must not write entitlement state.
- Entitlement state may only be written by trusted backend paths:
  - Stripe webhook / server billing APIs
  - RevenueCat webhook
  - trusted invite/linking server flows
  - trusted free-tier / promo / trial server flows
- Native iOS billing is Apple IAP only.
- Stripe checkout and Stripe customer portal remain web-only surfaces.
- If a native purchase completes before the backend reflects it, the app may show a short "confirming access" state, but it must not self-grant entitlement.

### 3. Native Routing and Return Contract

- Canonical public links use the production web origin.
- Native auth callback uses custom scheme `lovelanguages://auth/callback`.
- Universal Links should target the same user-facing web origin for:
  - invite links
  - password reset entry
  - auth callback fallback
  - any shareable route that should open the installed app
- Required routed return targets:
  - `/auth/callback`
  - `/reset-password`
  - `/join/:token`
  - `/?subscription=success`
  - `/?subscription=canceled`
- Repo contract:
  - auth redirect builders must choose native callback URLs on native platforms
  - native app must listen for URL opens and push routes into the SPA router
  - auth callback route must exchange/store the Supabase session before redirecting onward

### 4. Offline Contract

- Offline promise is practice-first only.
- Launch-required offline behaviors:
  - cached vocabulary lookup for warmed content
  - cached word scores/progress for warmed content
  - flashcard/game practice from cached data
  - queued score/game-session sync after reconnect
- Explicit launch non-goals:
  - full chat offline history
  - offline invite/linking
  - offline pending challenges/requests
  - offline multi-language precache beyond the active language unless separately approved

### 5. App Review and Privacy Contract

- Sign in with Apple must be enabled in the native target and fully operational.
- Restore Purchases must be visible anywhere native subscription products are offered.
- Account deletion must remain in-app discoverable and revoke Apple refresh tokens when present.
- In-App Purchase capability must be enabled in the native target.
- Privacy manifest and App Privacy answers must reflect actual SDK/data usage.
- Review notes must explain:
  - how to reach paywall and restore purchases
  - how to test Sign in with Apple
  - how invite/linking works
  - how account deletion works
- Screenshots, metadata, and subscription copy must match the actual iPhone UX and Apple IAP pricing model.

### 6. Device QA Contract

- Test on physical iPhones, not simulator-only.
- Required device runs:
  - clean install -> signup/onboarding -> first practice
  - Sign in with Apple -> first practice
  - invite open from Messages/Mail -> signup/login -> linking completion
  - password reset email open -> app return -> password change
  - Apple IAP purchase -> trusted entitlement confirmation -> access unlocked
  - Restore Purchases from a returning install
  - offline practice from a cold restart after prior warm cache
  - reconnect with queued sync

## Release Matrix

Use only these bucket values:

- `repo verified`
- `native/Xcode verified`
- `App Store Connect / RevenueCat / Supabase verified`
- `still unknown`

| Area | Requirement | Status bucket | Owner | Evidence / current state | Next action |
| --- | --- | --- | --- | --- | --- |
| Repo | Client cannot write entitlement state on startup | repo verified | engineering | Startup RevenueCat reconcile is now read-only; no client profile mutation remains in `App.tsx`. | Verify production deploy includes this change. |
| Repo | Authenticated clients cannot mutate server-managed billing/onboarding/profile-provider fields | repo verified | engineering | Migration `048_profile_client_write_guards.sql` blocks these writes. | Apply migration in the target Supabase project. |
| Repo | Native auth callback contract exists | repo verified | engineering | `services/api-config.ts` now builds native callback URLs and web callback URLs explicitly. | Mirror the same contract in Supabase redirect allow-lists and native URL types. |
| Repo | Native URL-open bridge exists for invite/auth/reset/root return flows | repo verified | engineering | `services/native-links.ts`, `AuthCallback`, and `App.tsx` bridge incoming app URLs into the router. | Sync the Capacitor App plugin into the real iOS project and verify on-device. |
| Repo | Native Apple Sign In exists with nonce and backend token exchange | repo verified | engineering | Native Apple auth branches exist in login surfaces; nonce helper and Apple token exchange endpoint are present. | Validate live Apple capability/provider config and deletion revocation on device. |
| Repo | Native purchase UI is Apple IAP only | repo verified | engineering | On iOS, purchase flows use RevenueCat and App Store management; Stripe remains web-only in native-facing UI. | Device QA the actual paywall and upgrade paths. |
| Repo | Restore Purchases is exposed on native subscription surfaces | repo verified | engineering | Present in onboarding plan selection and the subscription-required paywall. | Verify App Review-visible placement on device. |
| Repo | Practice-first offline cache and queue exist | repo verified | engineering | Vocabulary cache, word-score cache, and queued sync are implemented. | Harden backoff, queue-state UX, and telemetry. |
| Repo | Offline precache is active-language only | repo verified | product / engineering | Only the active language is warmed on login. | Decide whether gifted secondary languages need launch support. |
| Repo | Chat survives offline cold restart | repo verified | product / engineering | Not supported today; no offline chat/message persistence is implemented. | Keep out of launch scope or explicitly add later. |
| Repo | Pending challenges/requests work offline | repo verified | product / engineering | Not supported today; these flows remain online-only. | Keep out of launch scope and message clearly in QA notes. |
| Native/Xcode | Real iOS target audited | still unknown | engineering | No checked-in app target was present in this workspace. | Provide access to the real `ios/` app project or Xcode project path. |
| Native/Xcode | URL scheme `lovelanguages` registered | still unknown | engineering | Repo contract exists, but actual URL Types were not auditable. | Inspect target `Info.plist` and test `lovelanguages://auth/callback`. |
| Native/Xcode | Associated Domains configured for Universal Links | still unknown | engineering | No app entitlements file or Associated Domains config available here. | Inspect entitlements, domain association file, and device behavior. |
| Native/Xcode | Sign in with Apple capability enabled | still unknown | engineering | Capability state not visible without the real Xcode target. | Inspect Signing & Capabilities in the app target. |
| Native/Xcode | In-App Purchase capability enabled | still unknown | engineering | Capability state not visible without the real Xcode target. | Inspect Signing & Capabilities in the app target. |
| Native/Xcode | Privacy manifest and any required capabilities are correct | still unknown | engineering | No app target `PrivacyInfo.xcprivacy` was available to audit. | Inspect and reconcile with shipped SDKs and data collection. |
| Native/Xcode | Push capability and notification entitlements are correct | still unknown | engineering | Native project not accessible here. | Audit only after higher-priority launch blockers close. |
| App Store Connect / RevenueCat / Supabase | App Store product IDs match repo purchase mapping | still unknown | engineering / product | Repo expects `standard_*` and `unlimited_*` product IDs via RevenueCat. Live ASC state not audited. | Audit live products and either align dashboard IDs or update repo mapping. |
| App Store Connect / RevenueCat / Supabase | RevenueCat entitlements and offering match repo expectations | still unknown | engineering | Repo expects entitlements `standard_access` and `unlimited_access`; dashboard not audited. | Verify products, packages, offerings, entitlements, and intro offers. |
| App Store Connect / RevenueCat / Supabase | RevenueCat webhook is live and points to the production endpoint | still unknown | engineering | Repo webhook handler exists, but live dashboard configuration was not verified. | Verify webhook URL, bearer token, and event delivery. |
| App Store Connect / RevenueCat / Supabase | Supabase auth redirect allow-list includes both web and native callbacks | still unknown | engineering | Repo now requires both `/auth/callback` on the web origin and `lovelanguages://auth/callback`. | Audit Supabase redirect URLs and Apple provider client IDs. |
| App Store Connect / RevenueCat / Supabase | Apple provider config supports native bundle login and token revocation | still unknown | engineering | Repo contains native Apple auth and token revocation code; provider/dashboard state was not checked. | Verify Apple provider settings and Apple credentials in live environments. |
| App Store Connect / RevenueCat / Supabase | Review metadata, screenshots, subscription copy, and notes are complete | still unknown | product / engineering | No App Store Connect access in this session. | Audit and finalize submission materials. |
| Device QA | Signup/onboarding -> entitlement -> first practice works on physical iPhone | still unknown | engineering | Not device-tested in this session. | Run clean-install and returning-user QA on physical devices. |
| Device QA | Invite/linking works from Messages/Mail into the app | still unknown | engineering | Repo route handling now exists, but Universal Link and custom-scheme behavior were not device-verified. | Test with fresh links on physical devices. |
| Device QA | Password reset works from iPhone email open to password change | still unknown | engineering | Repo callback contract now exists, but no device validation happened here. | Test email link open, callback, and password change. |
| Device QA | Apple IAP purchase and restore complete without stranded states | still unknown | engineering | Repo gates purchases correctly, but real App Store / RevenueCat / device behavior was not audited. | Test purchase, delayed webhook, restore, and relaunch. |
| Device QA | Offline practice survives reconnect and app relaunch | still unknown | engineering | Repo implementation exists, but no current device evidence was captured. | Run cold-start, reconnect, and queue-retry scenarios on device. |

## Concrete Implementation Program

### Phase 0: External Surface Audit

Status: blocked on access, not on repo work.

Required inputs:

- Real native iOS project path containing the app target.
- App Store Connect access to the production app record and TestFlight.
- RevenueCat dashboard access to products, entitlements, offerings, and webhooks.
- Supabase dashboard access to Auth provider and redirect settings.

Exit criteria:

- Every `still unknown` row above is either verified or explicitly re-scoped with owner approval.

### Phase 1: Entitlement Trust Boundary

Status: in progress in this session.

Done in repo:

- Removed client-side entitlement writes from app startup.
- Added database-level write guards for server-managed profile fields.

Remaining before release:

- Apply migration in the live Supabase project.
- Verify no remaining external/mobile code path depends on client mutation as entitlement truth.
- QA delayed RevenueCat webhook behavior so the user sees a short pending-confirmation state, not a broken paywall loop.

### Phase 2: Native Deep Links and Return Flows

Status: in progress in this session.

Done in repo:

- Added native/web-aware auth callback URL builders.
- Added native URL-open bridge.
- Added `AuthCallback` route handling for Supabase session completion.

Remaining before release:

- Sync the Capacitor App plugin into the real iOS project.
- Register URL scheme and Universal Links in the native target.
- Add required Supabase redirect URLs.
- Device-test invite opens, password reset, and auth callbacks.

### Phase 3: Native Submission Surface Verification

Status: not started; blocked on the real native project and dashboard access.

Required verification:

- `Info.plist`
- app entitlements
- Associated Domains
- URL Types
- Sign in with Apple capability
- In-App Purchase capability
- privacy manifest
- background modes / push setup if retained for launch

### Phase 4: Journey Hardening

Status: partially started; repo still needs polish after the trust-boundary and deep-link foundations.

Remaining work:

- polish pending App Store confirmation UX after purchase/restore
- make invite/linking interruption-safe across app background/foreground transitions
- validate that the first-practice path cannot dead-end on stale onboarding or billing state

### Phase 5: Offline Hardening

Status: not started in this session.

Remaining work:

- add retry/backoff policy
- surface queue health and stuck-sync states
- decide whether any secondary-language cache warmup is needed for launch
- decide whether chat stays intentionally online-only at launch

### Phase 6: Mobile Runtime Quality

Status: not started in this session.

Remaining work:

- safe areas
- keyboard behavior
- foreground/resume handling
- microphone interruption handling
- mobile-only telemetry for deep-link and purchase failures

### Phase 7: Submission Readiness

Status: not started in this session.

Remaining work:

- App Store metadata and screenshots
- review notes and tester accounts
- TestFlight device matrix runs
- final privacy disclosure cross-check

## Immediate Next Actions

1. Apply migration `048_profile_client_write_guards.sql` to the target Supabase project.
2. Provide access to the real iOS app project so URL schemes, entitlements, capabilities, and privacy manifests can be audited.
3. Audit live App Store Connect, RevenueCat, and Supabase settings against the matrix.
4. Run physical-device tests for:
   - auth callback
   - password reset
   - invite open
   - Apple IAP purchase
   - restore purchases
5. Harden the native purchase pending-confirmation UX if delayed webhook confirmation still feels fragile on device.

## Access Needed To Close Remaining Unknowns

Provide one or more of the following:

- The filesystem path to the real iOS app target if it lives outside this repo.
- A checked-in `ios/` project added to this workspace.
- App Store Connect access or exported screenshots/config evidence.
- RevenueCat dashboard access or exported offering/webhook screenshots.
- Supabase Auth dashboard access or exported redirect/provider screenshots.
