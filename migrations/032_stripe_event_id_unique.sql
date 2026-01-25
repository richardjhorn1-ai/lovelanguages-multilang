-- Fix race condition in Stripe webhook idempotency
-- The check-then-insert pattern has a race condition where two concurrent
-- requests can both pass the check before either writes.
-- Adding a UNIQUE constraint allows atomic INSERT-based idempotency.

-- Drop the non-unique index first (will be replaced by unique constraint's index)
DROP INDEX IF EXISTS idx_subscription_events_stripe;

-- Add UNIQUE constraint on stripe_event_id
-- This enables atomic idempotency via INSERT ... ON CONFLICT or catching error 23505
ALTER TABLE subscription_events
  ADD CONSTRAINT subscription_events_stripe_event_id_unique
  UNIQUE (stripe_event_id);

COMMENT ON CONSTRAINT subscription_events_stripe_event_id_unique ON subscription_events
  IS 'Ensures atomic idempotency for Stripe webhook processing';
