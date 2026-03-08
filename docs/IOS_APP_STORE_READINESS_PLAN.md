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

- A checked-in `ios/` app project now exists in this workspace and is the native source of truth for launch work.
- The native target now compiles successfully via `xcodebuild` for:
  - generic iOS device with code signing disabled
  - iPhone simulator with code signing disabled
- `Info.plist` now registers custom URL scheme `lovelanguages`.
- App entitlements now configure:
  - Sign in with Apple entitlement
  - Associated Domains for `applinks:www.lovelanguages.io`
- The app target is now configured as iPhone-only in the Xcode project.
- Native Apple Sign In no longer depends on the incompatible Capacitor 7 community plugin; the app target now carries a repo-owned native plugin implementation compatible with Capacitor 8 and RevenueCat.
- Still not verified from this session:
  - In-App Purchase capability state in Xcode / Apple Developer portal
  - app-level `PrivacyInfo.xcprivacy`
  - push capability / notification entitlements
  - on-device Universal Link behavior
  - physical-device purchase/auth/linking behavior

### Dashboard audit result

- Live Supabase project `iiusoobuoxurysrhqptx` was audited. `Site URL` is now `https://www.lovelanguages.io`, and both `https://www.lovelanguages.io/auth/callback` and `lovelanguages://auth/callback` are allow-listed. Stale `.xyz` and preview redirects still remain and must be removed after QA.
- Live RevenueCat project `Love Languages` was audited. The App Store app uses bundle ID `com.lovelanguages.app`, all 6 expected products exist, the default offering contains all 6 packages, and live entitlements are currently named `Standard` and `Unlimited`. No RevenueCat webhook is configured yet.
- Live App Store Connect was audited. The app is currently `iOS 1.0 Rejected` with unresolved issues under Guideline 4.8 `Login Services` and Guideline 3.1.1 `Payments - In-App Purchase`. The reviewer used an `iPad Air 11-inch (M3)`.
- Live App Store Connect subscriptions were audited. The `Love Language Plans` group contains all 6 expected subscriptions, but each one is still marked `Missing Metadata`.
- Live TestFlight was audited. Builds `1` and `2` exist and are `Ready to Submit`, but no tester groups or individual testers are attached yet.
- Live Apple Developer was audited. App ID `com.lovelanguages.app` has In-App Purchase, Sign in with Apple, and Push Notifications enabled, but Associated Domains was not enabled in the portal during audit. Service ID `com.lovelanguages.app.auth` exists, but its exact Website URL and Return URL values were not fully inspectable in-session.

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
- iPad distribution and iPad-specific polish until a deliberate iPad pass is approved.

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
- The submitted binary must match the iPhone-first launch decision. Do not submit an iPad-capable build until iPad support is intentionally QA'd and in scope.
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
| Repo | Native Apple Sign In no longer depends on a Capacitor 7-only plugin | repo verified | engineering | The incompatible `@capacitor-community/apple-sign-in` dependency was removed and replaced with a repo-owned native plugin in the app target. | Keep the repo-owned plugin covered by build verification and device QA. |
| Repo | Native purchase UI is Apple IAP only | repo verified | engineering | On iOS, purchase flows use RevenueCat and App Store management; Stripe remains web-only in native-facing UI. | Device QA the actual paywall and upgrade paths. |
| Repo | Restore Purchases is exposed on native subscription surfaces | repo verified | engineering | Present in onboarding plan selection and the subscription-required paywall. | Verify App Review-visible placement on device. |
| Repo | Practice-first offline cache and queue exist | repo verified | engineering | Vocabulary cache, word-score cache, and queued sync are implemented. | Harden backoff, queue-state UX, and telemetry. |
| Repo | Offline precache is active-language only | repo verified | product / engineering | Only the active language is warmed on login. | Decide whether gifted secondary languages need launch support. |
| Repo | Chat survives offline cold restart | repo verified | product / engineering | Not supported today; no offline chat/message persistence is implemented. | Keep out of launch scope or explicitly add later. |
| Repo | Pending challenges/requests work offline | repo verified | product / engineering | Not supported today; these flows remain online-only. | Keep out of launch scope and message clearly in QA notes. |
| Native/Xcode | Real iOS target audited | native/Xcode verified | engineering | A checked-in `ios/` project now exists locally and the target builds with `xcodebuild` for device and simulator with code signing disabled. | Keep the tracked iOS project committed and use it for all native release work. |
| Native/Xcode | iPhone-first target is enforced in the app target | native/Xcode verified | engineering | The Xcode target now sets `TARGETED_DEVICE_FAMILY = 1`. | Confirm the product should stay iPhone-only for launch. |
| Native/Xcode | URL scheme `lovelanguages` registered | native/Xcode verified | engineering | `Info.plist` now includes `CFBundleURLTypes` for `lovelanguages` and simulator `openurl` accepts the custom scheme. | Smoke-test end-to-end auth callback routing on simulator and device. |
| Native/Xcode | Associated Domains configured for Universal Links | native/Xcode verified | engineering | `App.entitlements` now includes `applinks:www.lovelanguages.io`. | Verify the AASA file and actual Universal Link behavior on device. |
| Native/Xcode | Sign in with Apple capability enabled | native/Xcode verified | engineering | `App.entitlements` now includes `com.apple.developer.applesignin`, and the app target carries a native Apple Sign In plugin implementation. | Verify the Apple App ID capability and device sign-in against the live team. |
| Native/Xcode | In-App Purchase capability enabled | App Store Connect / RevenueCat / Supabase verified | engineering | Apple Developer App ID `com.lovelanguages.app` has In-App Purchase enabled. The local target still needs a final Signing & Capabilities pass once production signing is wired. | Confirm the capability in Xcode and upload a fresh build after signing is set. |
| Native/Xcode | Privacy manifest and any required capabilities are correct | still unknown | engineering | The app target still has no checked-in `PrivacyInfo.xcprivacy`; Xcode only scanned framework privacy manifests during build. | Add and verify the app-level privacy manifest against actual SDK/data usage. |
| Native/Xcode | Push capability and notification entitlements are correct | still unknown | engineering | Apple Developer shows Push Notifications enabled for the App ID, but the generated target push entitlements were not audited and the portal showed `Certificates (0)`. | Audit only after higher-priority launch blockers close. |
| App Store Connect / RevenueCat / Supabase | App Store product IDs match repo purchase mapping | App Store Connect / RevenueCat / Supabase verified | engineering / product | RevenueCat project `Love Languages` was audited on March 8, 2026. The App Store app config uses bundle ID `com.lovelanguages.app`, and the product catalog contains `standard_weekly`, `standard_monthly`, `standard_yearly`, `unlimited_weekly`, `unlimited_monthly`, and `unlimited_yearly`. RevenueCat also has a valid in-app purchase key configured, while the separate App Store Connect API key section is still empty. | Keep product IDs aligned and add the App Store Connect API key if you want ongoing product import and metadata sync. |
| App Store Connect / RevenueCat / Supabase | RevenueCat entitlements and offering match repo expectations | App Store Connect / RevenueCat / Supabase verified | engineering | RevenueCat has a default `standard offering` with all 6 expected App Store packages. However, the live entitlement identifiers are `Standard` and `Unlimited`, not the repo’s `standard_access` and `unlimited_access`, so the repo and dashboard are currently out of sync. | Either rename the RevenueCat entitlements to the repo-standard identifiers or make the client robust to identifier drift before launch. |
| App Store Connect / RevenueCat / Supabase | RevenueCat webhook is configured and end-to-end delivery is verified | still unknown | engineering | The RevenueCat webhook is now configured to post to `https://www.lovelanguages.io/api/webhooks/revenuecat` with an Authorization header. A live test on March 8, 2026 reached the endpoint but returned `401`. Investigation found the active Vercel production deployment was still running with a malformed historical `REVENUECAT_WEBHOOK_SECRET`, while the corrected production env is now set but not yet live because a clean redeploy of `main` failed before build completion. | Deploy a build that includes the Vercel install-command fix, then re-run the RevenueCat test event until the webhook returns `200`. |
| Repo | Clean Vercel production rebuilds install nested blog dependencies deterministically | repo verified | engineering | A March 8, 2026 Vercel production redeploy of `main` failed with `npm run build` exit `127` because `blog` dependencies were not installed on a clean cloud build, causing `astro: command not found`. The repo now declares `installCommand: npm ci && npm --prefix blog ci` in `vercel.json`, and the full root build passes locally when run with the production-style env/network assumptions. | Deploy this repo change before the next production redeploy or webhook re-test. |
| App Store Connect / RevenueCat / Supabase | Current uploaded build matches the iPhone-first launch scope | App Store Connect / RevenueCat / Supabase verified | product / engineering | TestFlight build `1.0 (2)` still reports device family `iPhone, iPad`, and the rejected App Review used `iPad Air 11-inch (M3)`. The uploaded build does not yet reflect the local iPhone-only target. | Upload a new build after the iPhone-only target change and use that build for TestFlight and re-review. |
| App Store Connect / RevenueCat / Supabase | Apple portal capability state matches the native routing and billing contract | App Store Connect / RevenueCat / Supabase verified | engineering | Apple Developer App ID `com.lovelanguages.app` has In-App Purchase, Sign in with Apple, and Push Notifications enabled, but Associated Domains was not enabled during audit. | Enable Associated Domains on the App ID, regenerate provisioning, and verify Universal Links on device. |
| App Store Connect / RevenueCat / Supabase | Apple service ID callback config matches Supabase auth expectations | still unknown | engineering | Service ID `com.lovelanguages.app.auth` exists and is linked to the app ID, but the Apple portal modal did not expose the saved Website URL and Return URL clearly enough to verify them in-session. | Verify the Website URL and Return URL against `https://www.lovelanguages.io` and `https://auth.lovelanguages.io/auth/v1/callback`. |
| App Store Connect / RevenueCat / Supabase | Supabase auth redirect allow-list includes both web and native callbacks | App Store Connect / RevenueCat / Supabase verified | engineering | Live Supabase project `iiusoobuoxurysrhqptx` was audited on March 8, 2026. `Site URL` is now `https://www.lovelanguages.io`, and both `https://www.lovelanguages.io/auth/callback` and `lovelanguages://auth/callback` are allow-listed. Stale `.xyz` and preview URLs still remain alongside the current entries. | Remove stale `.xyz` and preview URLs after end-to-end auth QA confirms nothing depends on them. |
| App Store Connect / RevenueCat / Supabase | Apple provider config supports native bundle login and token revocation | App Store Connect / RevenueCat / Supabase verified | engineering | Apple provider is enabled in the live Supabase project and includes client IDs for both `com.lovelanguages.app.auth` and `com.lovelanguages.app`. The OAuth callback shown by Supabase is `https://auth.lovelanguages.io/auth/v1/callback`, which is consistent with the custom auth domain, but the broader redirect/site URL config is stale. | Keep the Apple provider enabled, verify the Apple Developer service ID/app ID entries match these client IDs, and regenerate the OAuth secret on schedule. |
| App Store Connect / RevenueCat / Supabase | Review blockers for login and payments are closed | App Store Connect / RevenueCat / Supabase verified | product / engineering | App Store Connect currently shows `iOS 1.0 Rejected`. Apple’s Feb 17, 2026 message cites unresolved issues under Guideline 4.8 `Login Services` and Guideline 3.1.1 `Payments - In-App Purchase`. | Upload a build with visible Sign in with Apple and no external native purchase path, then respond clearly in Resolution Center. |
| App Store Connect / RevenueCat / Supabase | Review metadata, screenshots, subscription copy, and notes are complete | App Store Connect / RevenueCat / Supabase verified | product / engineering | iPhone screenshots, promotional text, description, keywords, support URL, reviewer accounts, and contact info are present, but all 6 subscriptions in `Love Language Plans` are marked `Missing Metadata` and there are `0` app previews. | Complete the subscription metadata for all 6 products and refresh screenshots/review notes against the current iPhone build. |
| App Store Connect / RevenueCat / Supabase | App Privacy answers are published and consistent with the shipped app | App Store Connect / RevenueCat / Supabase verified | product / engineering | App Privacy is published and lists tracking plus linked/not-linked data categories, but the repo still lacks an app-level `PrivacyInfo.xcprivacy`, so parity is not yet proven. | Cross-check actual SDK/data usage and add the app-level privacy manifest before resubmission. |
| App Store Connect / RevenueCat / Supabase | TestFlight build and tester setup are ready for launch QA | App Store Connect / RevenueCat / Supabase verified | product / engineering | Builds `1` and `2` are present in TestFlight and both are `Ready to Submit`, but build `2` has `0` groups and `0` individual testers attached. | Create internal tester groups, add release notes, and use the next review candidate build for device QA. |
| Device QA | Signup/onboarding -> entitlement -> first practice works on physical iPhone | still unknown | engineering | Not device-tested in this session. | Run clean-install and returning-user QA on physical devices. |
| Device QA | Invite/linking works from Messages/Mail into the app | still unknown | engineering | Repo route handling now exists, but Universal Link and custom-scheme behavior were not device-verified. | Test with fresh links on physical devices. |
| Device QA | Password reset works from iPhone email open to password change | still unknown | engineering | Repo callback contract now exists, but no device validation happened here. | Test email link open, callback, and password change. |
| Device QA | Apple IAP purchase and restore complete without stranded states | still unknown | engineering | Repo gates purchases correctly, but real App Store / RevenueCat / device behavior was not audited. | Test purchase, delayed webhook, restore, and relaunch. |
| Device QA | Offline practice survives reconnect and app relaunch | still unknown | engineering | Repo implementation exists, but no current device evidence was captured. | Run cold-start, reconnect, and queue-retry scenarios on device. |

## Concrete Implementation Program

### Phase 0: External Surface Audit

Status: substantially complete.

Required inputs:

- Physical iPhone signing/device access for launch-critical QA.

Exit criteria:

- Every remaining `still unknown` row above is either verified on a physical device or explicitly re-scoped with owner approval.

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
- Registered custom URL scheme `lovelanguages` in the iOS target.
- Added app entitlements for Associated Domains and Sign in with Apple.
- Built and launched the app in an iPhone simulator and successfully triggered the custom URL scheme via `simctl openurl`.

Remaining before release:

- Verify the `apple-app-site-association` file and actual Universal Link takeover on device.
- Enable Associated Domains on the Apple App ID and refresh provisioning after the portal change.
- Device-test invite opens, password reset, and auth callbacks.

### Phase 3: Native Submission Surface Verification

Status: in progress.

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

Status: in progress.

Remaining work:

- resolve the current App Review rejection for Guideline 4.8 and 3.1.1
- complete metadata for all 6 subscription products
- refresh screenshots and review notes against the current iPhone-only build
- create TestFlight internal groups and attach testers
- TestFlight device matrix runs
- final privacy disclosure cross-check

## Immediate Next Actions

1. Apply migration `048_profile_client_write_guards.sql` to the target Supabase project.
2. Deploy a production build that includes the `vercel.json` install-command fix so Vercel can rebuild cleanly and pick up the corrected `REVENUECAT_WEBHOOK_SECRET`.
3. Re-run the RevenueCat test event and confirm the webhook returns `200` and mutates backend state as expected.
4. Enable Associated Domains on Apple Developer App ID `com.lovelanguages.app`, regenerate provisioning, and verify Universal Links on device.
5. Upload a new iPhone-only build that includes the Sign in with Apple and Apple-IAP-only fixes, then use that build for TestFlight and App Review response.
6. Complete metadata for all 6 App Store subscription products and refresh the review notes/screenshots for the new build.
7. Run physical-device tests for:
   - auth callback
   - password reset
   - invite open
   - Apple IAP purchase
   - restore purchases
8. Harden the native purchase pending-confirmation UX if delayed webhook confirmation still feels fragile on device.

## Access Needed To Close Remaining Unknowns

Provide one or more of the following:

- A physical iPhone test path with signing available for device QA.
- The ability to confirm or edit the Apple service ID Website URL and Return URL if they are not already correct.
