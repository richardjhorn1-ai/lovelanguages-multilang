-- Add explanation column to game_session_answers
-- Stores the AI's explanation for why an answer was accepted or rejected
-- Examples: "Missing diacritic: dzis = dziś", "Valid synonym", "Completely different meaning"

ALTER TABLE game_session_answers ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add comment for documentation
COMMENT ON COLUMN game_session_answers.explanation IS 'AI explanation for why the answer was accepted or rejected during smart validation';
