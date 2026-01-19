-- Migration 031: Add role_confirmed_at for confirmation step
-- Purpose: Allow RoleSelection to show as confirmation even when role is pre-set
--
-- Flow:
--   1. User selects Learn/Teach in Hero → role set on signup
--   2. RoleSelection shows (role pre-selected) → user confirms or changes
--   3. role_confirmed_at set → proceed to Onboarding
--
-- Safe to run multiple times (idempotent)
-- Run in Supabase SQL Editor

-- Add role_confirmed_at column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role_confirmed_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_confirmed
ON profiles(role_confirmed_at)
WHERE role_confirmed_at IS NOT NULL;

COMMENT ON COLUMN profiles.role_confirmed_at IS 'Timestamp when user confirmed their role in RoleSelection. NULL means they need to confirm.';

DO $$
BEGIN
  RAISE NOTICE 'Migration 031 complete: role_confirmed_at column added';
  RAISE NOTICE 'RoleSelection will now show for all new users until they confirm';
END $$;
