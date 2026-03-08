# iOS Excellence Program: Launch Spec and Implementation Plan

Last updated: 2026-03-08

## Purpose

This document is the working contract for shipping Love Languages as a high-quality iPhone-first iOS app. It is intentionally split into two tracks:

1. A launch spec the team can hold itself to.
2. An implementation program that executes against that spec.

The goal is not "make Capacitor run on iPhone." The goal is "ship an App Store-ready product with a reliable first-user experience, correct entitlement handling, strong native returns/deep links, and a clear, defensible offline promise."

## Fixed Product Decisions

These decisions are treated as locked unless explicitly changed later.

- Launch target is iPhone first.
- Quality bar is best-in-class for launch-critical journeys, not just "good enough for TestFlight."
- Offline promise at launch is practice-first only:
  - cached vocabulary
  - cached scores/progress
  - flashcard/game practice
  - queued sync when the network returns
- Native iOS payment surface must be Apple IAP only.
- Stripe must not be surfaced as a purchase path in native iOS.
- Push notifications are important, but if one major area must slip after launch, push is the first allowed to slip.
- Launch-critical journeys are:
  - signup/onboarding -> entitlement -> first real practice
  - invite/linking
  - paying/subscribing and restore purchases
- Native deep links and return flows are mandatory for launch quality.
- The plan must include repo work plus Xcode/native configuration, App Store Connect, RevenueCat, Supabase auth redirect configuration, privacy/review requirements, and on-device QA.

## Success Criteria

The iOS launch is successful only if all of the following are true:

- New users can sign up, complete onboarding, obtain entitlement, and reach first practice without route dead ends or ambiguous states.
- Paid users are never marked entitled from client-side guesswork.
- Invite links, password resets, auth returns, and purchase returns open into the app cleanly.
- Practice surfaces remain useful during intermittent or absent connectivity.
- Account deletion, restore purchases, Sign in with Apple, and privacy disclosures are App Review-safe.
- Repo state, native project state, dashboard/config state, and device behavior are all verified as part of release readiness.

## Current Confirmed Repo Findings

These are the known gaps that this program must address.

### Trust boundaries

- The client currently reconciles RevenueCat on iOS and writes subscription state directly into `profiles` during app startup.
- Profile RLS allows users to update their own profile broadly, so entitlement fields are not server-authoritative yet.

### Deep links and native return flows

- There is no repo-verified native `appUrlOpen` handling for auth returns, invite links, password reset flows, or purchase returns.
- URL building is still primarily web-first and points at the production web domain.

### Native project visibility

- Capacitor config exists in repo, but the `ios/` project is not present in this workspace.
- That means `Info.plist`, Associated Domains, URL schemes, Sign in with Apple capability, In-App Purchase capability, `PrivacyInfo.xcprivacy`, and other native release surfaces are not currently repo-verified here.

### Offline scope and hardening

- Offline support exists and is real, but it is practice-oriented today.
- Offline precache currently warms only the active language on login.
- Chat history is not persisted for offline restart.
- Pending challenges and related requests remain online-only.
- Offline sync has limited operational hardening today:
  - no strong backoff strategy
  - no explicit stuck-queue surface
  - no clear queue health telemetry

## Program Structure

The work is split into two tracks:

- Track A: define the launch spec
- Track B: implement against the spec in phases

Track A must be explicit enough that Track B does not drift into "fix things ad hoc."

## Track A: Launch Spec

### 1. Product Scope Spec

Define what the launch app is and is not.

#### In scope at launch

- Email signup and Sign in with Apple
- Onboarding to entitlement to first practice
- Invite/linking flows
- Apple IAP purchase flow
- Restore purchases
- Practice-first offline behavior
- Account deletion
- Password reset

#### Explicitly limited at launch

- Offline support outside practice surfaces
- Push notifications if they endanger launch quality in higher-risk areas
- iPad-specific polish
- Web parity for all mobile flows if it conflicts with native correctness

### 2. System Contract Spec

Define which layer owns what.

#### Entitlements

- The client may read entitlement state.
- The client must not be the source of truth for entitlement state.
- Subscription truth must be written by trusted backend/webhook paths only.
- Any temporary client reconcile logic must become read-only and diagnostic, not mutative.

#### Native vs web routing

- Native app must own native happy paths.
- Web routes may still exist, but launch-critical native flows must not depend on Safari detours as the standard behavior.

#### Offline

- Offline promise is practice-first, not "full app offline."
- Cached practice data and queued progress sync are part of launch.
- Non-practice surfaces may be online-only, but that must be deliberate and understandable.

### 3. App Store Submission Spec

Define all non-code release requirements as part of the product spec.

This includes:

- Sign in with Apple capability and flow behavior
- In-App Purchase capability and products
- Restore purchases behavior
- Account deletion path
- Privacy manifests and App Privacy answers
- Associated Domains and URL schemes
- Review notes and test accounts
- Screenshots, metadata, and subscription copy

### 4. Release Gate Matrix

Every launch item must be classified into one of:

- repo verified
- native/Xcode verified
- App Store Connect / RevenueCat / Supabase verified
- still unknown

Nothing launch-critical stays in "unknown" at release time.

## Track B: Implementation Program

### Phase 0: Native Audit and Gap Confirmation

Objective:

- Turn current assumptions into verified facts.

Required work:

- Audit the actual native iOS project once Xcode/full-machine access is available.
- Verify:
  - `Info.plist`
  - entitlements
  - Associated Domains
  - URL schemes
  - Sign in with Apple capability
  - In-App Purchase capability
  - `PrivacyInfo.xcprivacy`
  - background modes if any are needed
- Audit App Store Connect configuration.
- Audit RevenueCat offerings, entitlements, mappings, and webhooks.
- Audit Supabase auth redirect and native callback configuration.

Outputs:

- a decision-complete launch spec
- a gap list grouped by repo, native project, App Store Connect, RevenueCat, and Supabase
- a release matrix with no hidden ownership

### Phase 1: Trust Boundaries and Entitlement Contract

Objective:

- Remove client authority over subscription truth.

Required work:

- Stop client code from writing `subscription_status`, `subscription_plan`, or `subscription_source`.
- Move paid entitlement updates to server/webhook-owned paths only.
- Ensure mobile clients consume a server-trusted entitlement read surface.
- Ensure account management branches correctly by entitlement source.

Acceptance criteria:

- no client path can grant itself paid entitlement by updating profile state
- webhook repetition is safe and idempotent
- native purchase flows no longer rely on client mutation as truth

### Phase 2: Native Deep Links and Return Flows

Objective:

- Make launch-critical native flows open and resume correctly inside the app.

Required work:

- Implement native URL handling for:
  - invite links
  - password reset links
  - auth returns
  - purchase return states
- Define the canonical deep-link contract:
  - Universal Links if available
  - custom scheme fallback if needed
- Separate "web URL" from "native return target" in config and routing.

Acceptance criteria:

- invite flows can begin from Messages/Mail and land correctly in-app
- password reset can complete from an iPhone
- OAuth/auth return is native-safe
- purchase return does not strand the user

### Phase 3: Onboarding, Linking, and Purchase Journey Hardening

Objective:

- Make the first-user and linked-user journeys feel polished and deterministic.

Required work:

- Finish the server-backed onboarding state model rollout cleanly.
- Ensure native invite/linking flows are recoverable across app interruptions.
- Keep native purchase flow Apple IAP only.
- Support restore purchases cleanly in native.
- Treat the sequence "signup -> onboarding -> entitlement -> first practice" as the highest-polish path in the app.

Acceptance criteria:

- users do not end up in false complete or false entitled states
- linked/invited flows are resumable
- paid users are completed only from confirmed trusted billing state
- restore purchases works cleanly

### Phase 4: Offline Hardening for the Launch Promise

Objective:

- Make practice-first offline behavior reliable rather than aspirational.

Required work:

- Bound cache scope, queue size, and sync workload.
- Add retry and backoff for sync.
- Add visible queue-health/error states when sync is stuck.
- Improve lifecycle handling on app resume/foreground/network transitions.
- Decide whether gifted/unlocked secondary languages need cache behavior at launch or remain active-language only.

Acceptance criteria:

- practice works offline from a cold start after prior cache warmup
- queued progress survives reconnect cycles
- auth expiry or repeated sync failure is surfaced, not silent
- offline behavior is predictable under app kill/relaunch

### Phase 5: Mobile UX and Runtime Quality

Objective:

- Make the app feel intentionally mobile, not like a website in a shell.

Required work:

- Audit safe areas, keyboard interactions, loading/empty/error states, haptics, and interruption handling.
- Harden microphone/voice flows for denial, interruption, and recovery.
- Reduce hidden heavy work during mobile startup and resume.
- Add telemetry for mobile-only failure modes:
  - cold-start failures
  - deep-link failures
  - auth return failures
  - purchase return failures
  - stuck offline queues

Acceptance criteria:

- iPhone runtime feels smooth and understandable
- error states are explicit
- mobile telemetry is sufficient to debug launch-day issues

### Phase 6: Submission Readiness

Objective:

- Make App Store submission a verified artifact, not a final scramble.

Required work:

- Prepare App Store assets and copy.
- Finalize review notes and test accounts.
- Verify:
  - restore purchases
  - delete account
  - Sign in with Apple
  - privacy disclosures
  - subscription management copy
- Run TestFlight against a defined device matrix.

Acceptance criteria:

- submission surfaces are complete
- review-sensitive flows are verified
- launch-critical behaviors have device-tested evidence

### Phase 7: Post-Launch / Allowed Slip

These items matter, but they are the first acceptable slips if launch-critical areas need focus:

- push notifications
- broader offline coverage beyond practice
- iPad-specific polish

## Release Matrix Template

Use this exact structure during the next session and keep it current.

| Area | Requirement | Status bucket | Owner | Notes |
| --- | --- | --- | --- | --- |
| Repo | Entitlement writes are server-owned | unknown | engineering | client reconcile currently mutates profile |
| Repo | Native deep-link handlers exist | unknown | engineering | no repo-verified `appUrlOpen` handling yet |
| Native/Xcode | Associated Domains configured | unknown | engineering | requires native project audit |
| Native/Xcode | Sign in with Apple capability enabled | unknown | engineering | requires native project audit |
| Native/Xcode | In-App Purchase capability enabled | unknown | engineering | requires native project audit |
| App Store Connect | Products and metadata aligned | unknown | product/engineering | requires dashboard audit |
| RevenueCat | Entitlements/offers/webhooks verified | unknown | engineering | requires dashboard audit |
| Supabase | Native auth return URLs configured | unknown | engineering | requires config audit |
| Device QA | Invite, auth return, reset, purchase return tested | unknown | engineering | requires iPhone testing |
| Device QA | Offline practice survives reconnect | unknown | engineering | requires iPhone testing |

## First Execution Order

When implementation begins, use this order unless a newly discovered blocker changes the sequencing.

1. Audit native/Xcode/App Store Connect/RevenueCat/Supabase surfaces.
2. Lock the launch spec and release matrix.
3. Fix entitlement trust boundaries.
4. Implement native deep links and return flows.
5. Harden onboarding, linking, and purchase journeys.
6. Harden offline behavior for the practice-first promise.
7. Do mobile UX/runtime polish and telemetry.
8. Finish submission assets, TestFlight validation, and review prep.

## Explicit Non-Goals for the First Session

Do not start by scattering implementation across many files.

The next session should first:

- save/validate this document
- audit the actual native release surface
- turn unknowns into verified facts
- produce a concrete release matrix

Only then should implementation begin.

## Open Questions to Resolve During the Native Audit

These questions are not blockers to saving this plan, but they must be answered before declaring the spec final:

- Is the native app using Universal Links, a custom URL scheme, or both?
- Where is the authoritative iOS project maintained if it is not in this repo?
- Are any gifted tester accounts using capabilities that behave differently from standard single-language users?
- Which exact practice surfaces must work from a cold offline app start?
- Is chat intentionally online-only at launch, or should cached read-only history be included?
- What is the desired user experience when purchase return happens before trusted backend entitlement confirmation?
- What App Store Connect, RevenueCat, and Supabase settings are already live versus still assumed?

## Expected Deliverables for the Next Session

The next session should produce:

- an updated version of this document if the native audit changes assumptions
- a release matrix with concrete status per area
- a prioritized implementation backlog
- the first high-risk fixes, starting with entitlement trust boundaries and native deep-link handling
