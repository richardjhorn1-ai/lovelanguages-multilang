-- Migration 025: Language Integrity Constraints
-- Purpose: Add CHECK constraints and integrity triggers for multi-language support
--
-- This migration:
-- 1. Adds CHECK constraints to all language_code columns (18 valid codes)
-- 2. Creates trigger to ensure active_language is always in languages[] array
-- 3. Adds partial index for "learned words" queries
-- 4. Fixes any existing data inconsistencies
--
-- Safe to run multiple times (idempotent)
-- Run in Supabase SQL Editor

-- ============================================================================
-- SECTION 1: Define valid language codes
-- ============================================================================
-- Supported languages (18 total):
-- Romance: en, es, fr, it, pt, ro
-- Germanic: de, nl, sv, no, da
-- Slavic: pl, cs, ru, uk
-- Other: el, hu, tr

-- ============================================================================
-- SECTION 2: CHECK constraints on profiles table
-- ============================================================================

-- profiles.native_language
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_native_language'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT valid_native_language
      CHECK (native_language IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));
  END IF;
END $$;

-- profiles.active_language
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_active_language'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT valid_active_language
      CHECK (active_language IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: CHECK constraints on data tables
-- ============================================================================

-- dictionary
ALTER TABLE dictionary DROP CONSTRAINT IF EXISTS valid_dictionary_language;
ALTER TABLE dictionary ADD CONSTRAINT valid_dictionary_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- word_scores
ALTER TABLE word_scores DROP CONSTRAINT IF EXISTS valid_word_scores_language;
ALTER TABLE word_scores ADD CONSTRAINT valid_word_scores_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- chats
ALTER TABLE chats DROP CONSTRAINT IF EXISTS valid_chats_language;
ALTER TABLE chats ADD CONSTRAINT valid_chats_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- level_tests
ALTER TABLE level_tests DROP CONSTRAINT IF EXISTS valid_level_tests_language;
ALTER TABLE level_tests ADD CONSTRAINT valid_level_tests_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- tutor_challenges
ALTER TABLE tutor_challenges DROP CONSTRAINT IF EXISTS valid_tutor_challenges_language;
ALTER TABLE tutor_challenges ADD CONSTRAINT valid_tutor_challenges_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- word_requests
ALTER TABLE word_requests DROP CONSTRAINT IF EXISTS valid_word_requests_language;
ALTER TABLE word_requests ADD CONSTRAINT valid_word_requests_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- listen_sessions
ALTER TABLE listen_sessions DROP CONSTRAINT IF EXISTS valid_listen_sessions_language;
ALTER TABLE listen_sessions ADD CONSTRAINT valid_listen_sessions_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- game_sessions
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS valid_game_sessions_language;
ALTER TABLE game_sessions ADD CONSTRAINT valid_game_sessions_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- gift_words
ALTER TABLE gift_words DROP CONSTRAINT IF EXISTS valid_gift_words_language;
ALTER TABLE gift_words ADD CONSTRAINT valid_gift_words_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- challenge_results
ALTER TABLE challenge_results DROP CONSTRAINT IF EXISTS valid_challenge_results_language;
ALTER TABLE challenge_results ADD CONSTRAINT valid_challenge_results_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- progress_summaries
ALTER TABLE progress_summaries DROP CONSTRAINT IF EXISTS valid_progress_summaries_language;
ALTER TABLE progress_summaries ADD CONSTRAINT valid_progress_summaries_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- notifications (nullable, so allow NULL or valid code)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notifications_language;
ALTER TABLE notifications ADD CONSTRAINT valid_notifications_language
  CHECK (language_code IS NULL OR language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- ============================================================================
-- SECTION 4: Trigger to ensure active_language is in languages array
-- ============================================================================

-- Create or replace the function
CREATE OR REPLACE FUNCTION check_active_in_languages()
RETURNS TRIGGER AS $$
BEGIN
  -- If languages array is null or empty, initialize with active_language
  IF NEW.languages IS NULL OR array_length(NEW.languages, 1) IS NULL THEN
    NEW.languages := ARRAY[NEW.active_language];
  -- If active_language not in languages array, add it
  ELSIF NOT (NEW.active_language = ANY(NEW.languages)) THEN
    NEW.languages := array_append(NEW.languages, NEW.active_language);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS ensure_active_in_languages ON profiles;

-- Create trigger
CREATE TRIGGER ensure_active_in_languages
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_active_in_languages();

-- ============================================================================
-- SECTION 5: Performance indexes
-- ============================================================================

-- Partial index for "learned words" queries (words with learned_at set)
-- Speeds up: SELECT * FROM word_scores WHERE user_id = ? AND language_code = ? AND learned_at IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_word_scores_learned
  ON word_scores(user_id, language_code)
  WHERE learned_at IS NOT NULL;

-- ============================================================================
-- SECTION 6: Fix existing data inconsistencies
-- ============================================================================

-- Fix profiles where active_language is not in languages array
UPDATE profiles
SET languages = array_append(languages, active_language)
WHERE languages IS NOT NULL
  AND array_length(languages, 1) > 0
  AND NOT (active_language = ANY(languages));

-- Fix profiles where languages array is null
UPDATE profiles
SET languages = ARRAY[COALESCE(active_language, 'pl')]
WHERE languages IS NULL;

-- Fix profiles where languages array is empty
UPDATE profiles
SET languages = ARRAY[COALESCE(active_language, 'pl')]
WHERE languages = '{}';

-- ============================================================================
-- SECTION 7: Verification queries (run manually to verify)
-- ============================================================================

-- Uncomment and run these to verify the migration worked:

-- Check constraints exist:
-- SELECT conname FROM pg_constraint WHERE conname LIKE 'valid_%_language';

-- Check trigger exists:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'ensure_active_in_languages';

-- Check no data violations:
-- SELECT id, active_language, languages FROM profiles WHERE NOT (active_language = ANY(languages));

-- Test constraint (should fail):
-- INSERT INTO dictionary (user_id, word, translation, language_code) VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test', 'invalid');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
