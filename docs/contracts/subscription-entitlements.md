# Subscription and Entitlement Contract

## Intent

The product supports shared subscriptions with one billing owner and one linked beneficiary while preserving each user's own entitlement state.

## Billing Ownership

- billing owner can be tutor or student
- non-owner cannot manage owner billing
- billing-owner transfer is not supported in v1

## Entitlement Model

- entitlements are evaluated as:
  1. self paid
  2. shared paid
  3. self promo
  4. self trial
  5. free
- shared entitlement is an overlay, not a replacement for self entitlement

## Duplicate Paid Linking

- if inviter and invitee both have active self-paid subscriptions, linking is blocked
- API returns `DUPLICATE_PAID_SUBSCRIPTION` with guidance to resolve one paid source first

## Promo/Trial Linking

- invitee promo/trial does not block linking
- promo/trial entitlement remains until natural expiry

## Cancellation and Unlink

- owner cancellation affects shared access at period end
- unlink removes shared overlay immediately
- self-owned entitlements remain intact

## Status Visibility

Non-owner can see:

- plan
- status
- period end
- source summary

Non-owner cannot see:

- invoices
- payment methods
- provider IDs
- billing management actions

## Acceptance Scenarios

1. Paid+paid linking attempt returns duplicate-paid conflict.
2. Paid+promo linking succeeds and both sources coexist.
3. Unlink immediately removes shared access only.
4. Owner cancel keeps shared access until period end.
