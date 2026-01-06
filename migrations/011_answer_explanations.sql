-- Migration 011: Add explanation column for smart validation
-- PREREQUISITE: Run migration 008_game_sessions.sql first if game_session_answers table doesn't exist
--
-- Stores the AI's explanation for why an answer was accepted or rejected
-- Examples: "Missing diacritic: dzis = dziś", "Valid synonym", "Completely different meaning"

-- Only run this if the table exists (migration 008 was run)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_session_answers') THEN
    ALTER TABLE game_session_answers ADD COLUMN IF NOT EXISTS explanation TEXT;
    COMMENT ON COLUMN game_session_answers.explanation IS 'AI explanation for why the answer was accepted or rejected during smart validation';
  ELSE
    RAISE NOTICE 'Table game_session_answers does not exist. Run migration 008_game_sessions.sql first.';
  END IF;
END $$;
