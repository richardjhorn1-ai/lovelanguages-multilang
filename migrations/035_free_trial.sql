-- Migration: 035_free_trial.sql
-- Description: Add trial expiry tracking for 7-day free trial
-- Date: 2026-02-01

-- Add trial expiry column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;

-- Note: existing users with free_tier_chosen_at but NULL trial_expires_at
-- are grandfathered with original usage-based limits (no expiry)

-- Index for efficient expiry checks
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON profiles(trial_expires_at)
WHERE trial_expires_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN profiles.trial_expires_at IS '7-day trial expiry timestamp. NULL = grandfathered user or no trial started.';
