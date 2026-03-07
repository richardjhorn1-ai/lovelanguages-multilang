-- Migration: 045_partner_profile_view_and_private_field_cleanup.sql
-- Purpose:
-- 1) Remove direct partner row reads from `profiles`.
-- 2) Provide an explicit partner-safe read surface.
-- 3) Clear legacy provider identifiers from partner-readable storage.

-- ============================================
-- PARTNER-SAFE READ SURFACE
-- ============================================

-- Partner reads must go through an allowlisted surface, not raw profiles rows.
DROP POLICY IF EXISTS "Users can view linked partner profile" ON profiles;

DROP VIEW IF EXISTS partner_profile_view;
CREATE VIEW partner_profile_view AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.role,
  p.active_language,
  p.native_language,
  p.level,
  p.xp,
  p.tutor_xp,
  p.tutor_tier,
  p.last_practice_at,
  p.partner_name,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_ends_at
FROM profiles p
WHERE p.id = get_linked_partner_id(auth.uid());

GRANT SELECT ON partner_profile_view TO authenticated;

COMMENT ON VIEW partner_profile_view IS
  'Allowlisted partner-visible profile fields for linked users. Do not store provider/private state here.';

-- ============================================
-- LEGACY PRIVATE-FIELD CLEANUP ON PROFILES
-- ============================================

-- Provider/customer identifiers have moved to profile_private and must no longer
-- remain in partner-readable table rows.
UPDATE profiles
SET stripe_customer_id = NULL
WHERE stripe_customer_id IS NOT NULL;

UPDATE profiles
SET revenuecat_customer_id = NULL
WHERE revenuecat_customer_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'apple_refresh_token'
  ) THEN
    EXECUTE 'UPDATE profiles SET apple_refresh_token = NULL WHERE apple_refresh_token IS NOT NULL';
  END IF;
END $$;
