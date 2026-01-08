-- ============================================================
-- Migration 017: Fix Profiles RLS Infinite Recursion
--
-- PROBLEM: The policy "Users can view linked partner profile" calls
-- get_linked_partner_id() which queries profiles, triggering the same
-- policy check again → infinite recursion.
--
-- The function is also used by policies on dictionary and word_scores tables.
--
-- SOLUTION: Replace the function with one that has SET row_security = off,
-- which truly bypasses RLS when the function executes.
--
-- Run this in Supabase SQL Editor IMMEDIATELY to fix production.
-- ============================================================

-- ============================================================
-- STEP 1: Drop ALL policies that depend on get_linked_partner_id
-- ============================================================

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view linked partner profile" ON profiles;

-- Dictionary table policies (partner access)
DROP POLICY IF EXISTS "Partners can view linked user vocabulary" ON dictionary;

-- Word scores table policies (partner access) - might be called "scores" or "word_scores"
DROP POLICY IF EXISTS "Partners can view linked user scores" ON word_scores;
DROP POLICY IF EXISTS "Partners can view linked user scores" ON scores;

-- ============================================================
-- STEP 2: Drop the old function (now safe since policies are gone)
-- ============================================================
DROP FUNCTION IF EXISTS get_linked_partner_id(UUID);

-- ============================================================
-- STEP 3: Create the FIXED function with row_security = off
-- This is the critical fix - SET row_security = off prevents
-- the function from triggering RLS checks on the profiles table
-- ============================================================
CREATE OR REPLACE FUNCTION get_linked_partner_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET row_security = off  -- THIS IS THE FIX
SET search_path = public
AS $$
  SELECT linked_user_id FROM profiles WHERE id = user_uuid;
$$;

-- ============================================================
-- STEP 4: Recreate profiles table policies
-- ============================================================

-- Drop any other existing policies to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Users can view their linked partner's profile
CREATE POLICY "Users can view linked partner profile"
ON profiles FOR SELECT
USING (id = get_linked_partner_id(auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- ============================================================
-- STEP 5: Recreate dictionary table partner policy
-- ============================================================

-- Recreate partner access policy for dictionary
CREATE POLICY "Partners can view linked user vocabulary"
ON dictionary FOR SELECT
USING (
  user_id = auth.uid() OR
  user_id = get_linked_partner_id(auth.uid())
);

-- ============================================================
-- STEP 6: Recreate word_scores table partner policy
-- ============================================================

-- Check if word_scores table exists and create policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'word_scores') THEN
    -- Drop existing policy if any
    DROP POLICY IF EXISTS "Partners can view linked user scores" ON word_scores;

    -- Recreate policy
    EXECUTE 'CREATE POLICY "Partners can view linked user scores"
      ON word_scores FOR SELECT
      USING (
        user_id = auth.uid() OR
        user_id = get_linked_partner_id(auth.uid())
      )';
    RAISE NOTICE 'Created partner policy on word_scores table';
  END IF;
END $$;

-- ============================================================
-- STEP 7: Ensure RLS is enabled on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'word_scores') THEN
    EXECUTE 'ALTER TABLE word_scores ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ============================================================
-- STEP 8: Verification
-- ============================================================
DO $$
DECLARE
  profile_policies INT;
  dict_policies INT;
BEGIN
  SELECT COUNT(*) INTO profile_policies
  FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public';

  SELECT COUNT(*) INTO dict_policies
  FROM pg_policies WHERE tablename = 'dictionary' AND schemaname = 'public';

  RAISE NOTICE '=== Migration 017 Complete ===';
  RAISE NOTICE 'Profiles table: % policies', profile_policies;
  RAISE NOTICE 'Dictionary table: % policies', dict_policies;
  RAISE NOTICE 'The infinite recursion should now be fixed.';
  RAISE NOTICE 'Test by loading the app - it should work now.';
END $$;
