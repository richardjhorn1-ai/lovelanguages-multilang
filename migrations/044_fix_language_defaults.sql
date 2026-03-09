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
-- STEP 1: Fix profile defaults so onboarding owns the first target language
-- ============================================================================

ALTER TABLE profiles ALTER COLUMN active_language DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN active_language DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN languages SET DEFAULT ARRAY[]::TEXT[];

-- ============================================================================
-- STEP 2: Fix the handle_new_user trigger — remove Polish default
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
-- STEP 3: Allow profiles to exist before a target language is chosen
-- ============================================================================

CREATE OR REPLACE FUNCTION check_active_in_languages()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active_language IS NULL THEN
    IF NEW.languages IS NULL THEN
      NEW.languages := ARRAY[]::TEXT[];
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.languages IS NULL OR array_length(NEW.languages, 1) IS NULL THEN
    NEW.languages := ARRAY[NEW.active_language];
  ELSIF NOT (NEW.active_language = ANY(NEW.languages)) THEN
    NEW.languages := array_append(NEW.languages, NEW.active_language);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Fix existing affected profiles
-- ============================================================================
-- Remove null entries introduced by old defaults or trigger behavior.

UPDATE profiles
SET languages = ARRAY[]::TEXT[]
WHERE languages IS NULL;

UPDATE profiles
SET languages = array_remove(languages, NULL)
WHERE array_position(languages, NULL) IS NOT NULL;

-- Remove only the bogus default 'pl' from multi-language arrays.

UPDATE profiles
SET languages = array_remove(languages, 'pl')
WHERE active_language IS NOT NULL
  AND active_language != 'pl'
  AND 'pl' = ANY(languages)
  AND array_length(languages, 1) > 1;

-- Fix single-language rows that are still stuck on the old default.

UPDATE profiles
SET languages = ARRAY[active_language]
WHERE active_language IS NOT NULL
  AND (
    array_length(languages, 1) IS NULL
    OR (array_length(languages, 1) = 1 AND languages[1] = 'pl')
  )
  AND active_language != 'pl';

-- ============================================================================
-- STEP 5: Verify
-- ============================================================================
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM profiles
  WHERE active_language != 'pl' AND 'pl' = ANY(languages);

  RAISE NOTICE 'Migration 044 complete:';
  RAISE NOTICE '  - Profiles can start without an active target language';
  RAISE NOTICE '  - Auth trigger no longer defaults to Polish';
  RAISE NOTICE '  - Remaining profiles with mismatched pl: %', affected_count;
END $$;
