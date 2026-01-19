-- Migration 030: Fix Tutor Signup - Role Set Correctly From Signup
-- Purpose: Ensure users who select "Teach" get role='tutor' immediately on signup
--
-- Bug: When users signed up as tutors, they were taken to the student onboarding flow.
-- Cause: The role column had DEFAULT 'student', and the auth trigger wasn't reading intended_role.
-- Fix:
--   1. Remove the default from role column
--   2. Update the handle_new_user trigger to read intended_role from user metadata
--
-- Safe to run multiple times (idempotent)
-- Run in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Remove the default value from the role column
-- ============================================================================
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- ============================================================================
-- STEP 2: Create/update the handle_new_user function to read intended_role
-- ============================================================================
-- This function is called by Supabase when a new user signs up.
-- It reads the intended_role from user metadata (set in Hero.tsx during signup)
-- and creates the profile with the correct role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intended_role TEXT;
  native_lang TEXT;
  target_lang TEXT;
BEGIN
  -- Read intended_role from user metadata (set during signup in Hero.tsx)
  intended_role := NEW.raw_user_meta_data->>'intended_role';
  native_lang := COALESCE(NEW.raw_user_meta_data->>'native_language', 'en');
  target_lang := COALESCE(NEW.raw_user_meta_data->>'target_language', 'pl');

  -- Validate role - only allow 'student' or 'tutor', otherwise NULL
  IF intended_role NOT IN ('student', 'tutor') THEN
    intended_role := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    native_language,
    active_language,
    languages
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Lover'),
    intended_role,  -- Will be 'student', 'tutor', or NULL based on signup selection
    native_lang,
    target_lang,
    ARRAY[target_lang]
  )
  ON CONFLICT (id) DO UPDATE SET
    -- If profile already exists, update role if we have a valid intended_role
    role = COALESCE(EXCLUDED.role, profiles.role),
    native_language = COALESCE(EXCLUDED.native_language, profiles.native_language),
    active_language = COALESCE(EXCLUDED.active_language, profiles.active_language);

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: Ensure the trigger exists
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration 030 complete:';
  RAISE NOTICE '  - role column no longer has a default value';
  RAISE NOTICE '  - handle_new_user trigger now reads intended_role from user metadata';
  RAISE NOTICE '  - Users selecting "Teach" in Hero will get role=tutor on signup';
END $$;
