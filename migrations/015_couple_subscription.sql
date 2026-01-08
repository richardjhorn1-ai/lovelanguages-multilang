-- ============================================================
-- Migration 015: Couple Subscription System
-- Enables "one pays, partner gets free" model
--
-- Run this in Supabase SQL Editor
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

-- 5. Helper function to get linked partner ID (breaks RLS recursion)
CREATE OR REPLACE FUNCTION get_linked_partner_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT linked_user_id FROM profiles WHERE id = user_uuid;
$$;

-- 6. RLS policy for partner lookup (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view linked partner profile" ON profiles;

CREATE POLICY "Users can view linked partner profile" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    id = get_linked_partner_id(auth.uid())
  );

-- 7. Verify the changes
DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name IN ('subscription_granted_by', 'subscription_granted_at', 'linked_user_id');

  IF col_count = 3 THEN
    RAISE NOTICE 'Migration 015 completed successfully. All columns present.';
  ELSE
    RAISE EXCEPTION 'Migration 015 failed. Expected 3 columns, found %', col_count;
  END IF;
END $$;
