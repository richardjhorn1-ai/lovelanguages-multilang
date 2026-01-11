-- Migration: 023_multilanguage_support.sql
-- Description: Add multi-language support columns to enable 18-language learning
-- Date: January 10, 2026
--
-- This migration adds language tracking to all user data tables, enabling:
-- - Users to have any of 18 languages as their native language
-- - Users to learn any of 18 languages as their target language
-- - Premium users to unlock multiple target languages
-- - All vocabulary, progress, and history tracked per-language
--
-- Default values maintain backward compatibility:
-- - native_language defaults to 'en' (English)
-- - active_language/language_code defaults to 'pl' (Polish)
-- - This matches the original Polish-only app behavior
--
-- Supported language codes (ISO 639-1):
-- Romance: en, es, fr, it, pt, ro
-- Germanic: de, nl, sv, no, da
-- Slavic: pl, cs, ru, uk
-- Other: el, hu, tr

-- =============================================================================
-- PROFILES TABLE - User language preferences
-- =============================================================================

-- User's native/mother tongue - AI explains in this language
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS native_language VARCHAR(5) DEFAULT 'en' NOT NULL;

-- User's currently active target language (what they're learning now)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_language VARCHAR(5) DEFAULT 'pl' NOT NULL;

-- Array of unlocked target language codes (for premium multi-language users)
-- Default includes Polish to maintain backward compatibility
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['pl']::TEXT[];

-- Documentation
COMMENT ON COLUMN profiles.native_language IS 'User''s mother tongue (ISO 639-1 code). AI explains concepts in this language.';
COMMENT ON COLUMN profiles.active_language IS 'Currently learning this language (ISO 639-1 code). All new data uses this.';
COMMENT ON COLUMN profiles.languages IS 'Array of unlocked target language codes. Premium feature for learning multiple languages.';

-- Index for language-based queries (e.g., finding all Spanish learners)
CREATE INDEX IF NOT EXISTS idx_profiles_native_language ON profiles(native_language);
CREATE INDEX IF NOT EXISTS idx_profiles_active_language ON profiles(active_language);

-- =============================================================================
-- DICTIONARY TABLE - Vocabulary entries per language
-- =============================================================================

-- Which target language this word belongs to
ALTER TABLE dictionary
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN dictionary.language_code IS 'Target language this vocabulary entry belongs to (ISO 639-1 code).';

-- Indexes for efficient vocabulary queries by language
CREATE INDEX IF NOT EXISTS idx_dictionary_language ON dictionary(language_code);
CREATE INDEX IF NOT EXISTS idx_dictionary_user_language ON dictionary(user_id, language_code);

-- Composite index for common query: get user's vocabulary for active language
CREATE INDEX IF NOT EXISTS idx_dictionary_user_lang_word ON dictionary(user_id, language_code, word);

-- =============================================================================
-- WORD_SCORES TABLE - Mastery tracking per language
-- =============================================================================

-- Which target language this score belongs to
ALTER TABLE word_scores
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN word_scores.language_code IS 'Target language this mastery score belongs to (ISO 639-1 code).';

-- Indexes for word score queries
CREATE INDEX IF NOT EXISTS idx_word_scores_language ON word_scores(language_code);
CREATE INDEX IF NOT EXISTS idx_word_scores_user_language ON word_scores(user_id, language_code);

-- =============================================================================
-- CHATS TABLE - Conversation history per language
-- =============================================================================

-- Which target language this chat is about
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN chats.language_code IS 'Target language this chat conversation is about (ISO 639-1 code).';

-- Indexes for chat queries by language
CREATE INDEX IF NOT EXISTS idx_chats_language ON chats(language_code);
CREATE INDEX IF NOT EXISTS idx_chats_user_language ON chats(user_id, language_code);

-- =============================================================================
-- LEVEL_TESTS TABLE - Proficiency tests per language
-- =============================================================================

-- Which target language was tested
ALTER TABLE level_tests
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN level_tests.language_code IS 'Target language this proficiency test was for (ISO 639-1 code).';

-- Indexes for test history queries
CREATE INDEX IF NOT EXISTS idx_level_tests_language ON level_tests(language_code);
CREATE INDEX IF NOT EXISTS idx_level_tests_user_language ON level_tests(user_id, language_code);

-- =============================================================================
-- TUTOR_CHALLENGES TABLE - Partner challenges per language
-- =============================================================================

-- Which target language the challenge is for
ALTER TABLE tutor_challenges
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN tutor_challenges.language_code IS 'Target language this challenge tests (ISO 639-1 code).';

-- Indexes for challenge queries
CREATE INDEX IF NOT EXISTS idx_tutor_challenges_language ON tutor_challenges(language_code);
CREATE INDEX IF NOT EXISTS idx_tutor_challenges_student_language ON tutor_challenges(student_id, language_code);

-- =============================================================================
-- WORD_REQUESTS TABLE - Word gifts per language
-- =============================================================================

-- Which target language the word request is for
ALTER TABLE word_requests
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN word_requests.language_code IS 'Target language for these gift words (ISO 639-1 code).';

-- Indexes for word request queries
CREATE INDEX IF NOT EXISTS idx_word_requests_language ON word_requests(language_code);
CREATE INDEX IF NOT EXISTS idx_word_requests_student_language ON word_requests(student_id, language_code);

-- =============================================================================
-- LISTEN_SESSIONS TABLE - Transcription sessions per language
-- =============================================================================

-- Which target language was being transcribed
ALTER TABLE listen_sessions
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN listen_sessions.language_code IS 'Target language being transcribed in this Listen Mode session (ISO 639-1 code).';

-- Indexes for listen session queries
CREATE INDEX IF NOT EXISTS idx_listen_sessions_language ON listen_sessions(language_code);
CREATE INDEX IF NOT EXISTS idx_listen_sessions_user_language ON listen_sessions(user_id, language_code);

-- =============================================================================
-- GAME_SESSIONS TABLE - Practice game history per language
-- =============================================================================

-- Which target language was being practiced
ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN game_sessions.language_code IS 'Target language being practiced in this game session (ISO 639-1 code).';

-- Indexes for game session queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_language ON game_sessions(language_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_language ON game_sessions(user_id, language_code);

-- =============================================================================
-- GIFT_WORDS TABLE - Gifted vocabulary per language
-- =============================================================================

-- Which target language the gift word is for
ALTER TABLE gift_words
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN gift_words.language_code IS 'Target language of the gifted word (ISO 639-1 code).';

-- Indexes for gift word queries
CREATE INDEX IF NOT EXISTS idx_gift_words_language ON gift_words(language_code);
CREATE INDEX IF NOT EXISTS idx_gift_words_student_language ON gift_words(student_id, language_code);

-- =============================================================================
-- CHALLENGE_RESULTS TABLE - Challenge results per language
-- =============================================================================

-- Which target language the challenge result is for
ALTER TABLE challenge_results
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN challenge_results.language_code IS 'Target language of the completed challenge (ISO 639-1 code).';

-- Indexes for challenge result queries
CREATE INDEX IF NOT EXISTS idx_challenge_results_language ON challenge_results(language_code);
CREATE INDEX IF NOT EXISTS idx_challenge_results_student_language ON challenge_results(student_id, language_code);

-- =============================================================================
-- NOTIFICATIONS TABLE - Notifications with language context
-- =============================================================================

-- Which target language this notification relates to (if applicable)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT NULL;

COMMENT ON COLUMN notifications.language_code IS 'Target language context for this notification (ISO 639-1 code), NULL if not language-specific.';

-- Index for filtering notifications by language
CREATE INDEX IF NOT EXISTS idx_notifications_language ON notifications(language_code) WHERE language_code IS NOT NULL;

-- =============================================================================
-- PROGRESS_SUMMARIES TABLE - Weekly progress per language
-- =============================================================================

-- Which target language this progress summary is for
ALTER TABLE progress_summaries
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl' NOT NULL;

COMMENT ON COLUMN progress_summaries.language_code IS 'Target language this progress summary covers (ISO 639-1 code).';

-- Indexes for progress summary queries
CREATE INDEX IF NOT EXISTS idx_progress_summaries_language ON progress_summaries(language_code);
CREATE INDEX IF NOT EXISTS idx_progress_summaries_user_language ON progress_summaries(user_id, language_code);

-- =============================================================================
-- VERIFICATION QUERIES (run manually to verify migration)
-- =============================================================================

-- Check profiles columns:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- AND column_name IN ('native_language', 'active_language', 'languages');

-- Check language_code on data tables:
-- SELECT table_name, column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE column_name = 'language_code'
-- ORDER BY table_name;

-- Verify indexes created:
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE indexname LIKE '%language%'
-- ORDER BY tablename;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
