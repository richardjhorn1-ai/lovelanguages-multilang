-- Migration 044: Fix Polish Language Defaults (LOV-102)
-- Problem: New users get 'pl' in their languages array regardless of chosen language.
-- Root cause: Auth trigger defaults target_language to 'pl', and onboarding never updated
-- the languages array (only active_language was set).
--
-- This migration:
--   1. Updates the auth trigger to not default to Polish
--   2. Fixes existing affected profiles
--
-- Safe to run multiple times (idempotent)
-- Run in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Fix the handle_new_user trigger — remove Polish default
-- ============================================================================

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
  -- Read from user metadata (set during signup in Hero.tsx)
  intended_role := NEW.raw_user_meta_data->>'intended_role';
  native_lang := COALESCE(NEW.raw_user_meta_data->>'native_language', 'en');
  target_lang := NEW.raw_user_meta_data->>'target_language';  -- NULL if not set (onboarding will set it)

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
    intended_role,
    native_lang,
    target_lang,  -- NULL if user hasn't chosen yet
    CASE WHEN target_lang IS NOT NULL THEN ARRAY[target_lang] ELSE ARRAY[]::TEXT[] END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role),
    native_language = COALESCE(EXCLUDED.native_language, profiles.native_language),
    active_language = COALESCE(EXCLUDED.active_language, profiles.active_language);

  RETURN NEW;
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- ============================================================================
-- STEP 2: Fix existing affected profiles
-- ============================================================================
-- Remove 'pl' from languages array for users who chose a different language
-- but got 'pl' injected by the old default.

UPDATE profiles
SET languages = ARRAY[active_language]
WHERE active_language IS NOT NULL
  AND active_language != 'pl'
  AND 'pl' = ANY(languages);

-- Also fix profiles where languages array doesn't match active_language at all
-- (e.g. languages is still ['pl'] from default but active_language was updated)
UPDATE profiles
SET languages = ARRAY[active_language]
WHERE active_language IS NOT NULL
  AND array_length(languages, 1) = 1
  AND languages[1] = 'pl'
  AND active_language != 'pl';

-- ============================================================================
-- STEP 3: Verify
-- ============================================================================
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM profiles
  WHERE active_language != 'pl' AND 'pl' = ANY(languages);

  RAISE NOTICE 'Migration 044 complete:';
  RAISE NOTICE '  - Auth trigger no longer defaults to Polish';
  RAISE NOTICE '  - Remaining profiles with mismatched pl: %', affected_count;
END $$;
