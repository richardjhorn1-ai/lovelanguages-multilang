# Partner Access Contract

## Intent

Partner visibility is a core product feature. The contract is to share meaningful learning context while preventing exposure of private account, billing, and secret-bearing fields.

## Allowed Partner Reads

Partners may read:

- display profile basics used in paired UX
- learning progress summary (xp, streak, level, goals, vocabulary totals)
- collaborative history summaries (challenges, gifts, notes, activity feed summaries)
- shared subscription status summary (plan, status, period end, source summary)

## Forbidden Partner Reads

Partners must never read:

- refresh tokens and provider tokens
- provider customer identifiers (Stripe/RevenueCat IDs)
- payment method and invoice data
- internal analytics/security identifiers
- unrestricted raw account/profile payloads

## Data Surfaces

- `PartnerProfileView`: allowlisted partner-visible shape only
- `PrivateAccountState`: server-private operational billing/provider/security state
- raw profile storage is not a partner API surface

## Access Rules

- partner-facing reads must use explicit allowlists
- wildcard profile selects are disallowed for partner reads
- collaborative writes are allowed only through explicit collaboration APIs

## Acceptance Scenarios

1. A linked partner can view progress and collaboration summaries.
2. A linked partner cannot retrieve provider IDs, refresh tokens, or billing internals.
3. Collaborative flows still work through dedicated APIs.
