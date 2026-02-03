-- Migration: Add linked columns for word gift + challenge bundles
-- This enables the "Learn words first, then challenge" flow where
-- a challenge stays hidden until the student completes the word gift

-- Add linked_word_request_id to challenges (challenge knows which word gift it's linked to)
ALTER TABLE tutor_challenges
ADD COLUMN IF NOT EXISTS linked_word_request_id UUID REFERENCES word_requests(id) ON DELETE SET NULL;

-- Add linked_challenge_id to word_requests (word request knows which challenge is linked to it)
ALTER TABLE word_requests
ADD COLUMN IF NOT EXISTS linked_challenge_id UUID REFERENCES tutor_challenges(id) ON DELETE SET NULL;

-- Add 'scheduled' to challenge status enum (challenges that wait for word gift completion)
-- Note: Postgres doesn't allow ALTER TYPE ADD VALUE in transactions, so this may need
-- to be run separately if it fails. The status column already uses TEXT in some setups.
DO $$
BEGIN
    -- Check if the status is an enum type and if 'scheduled' doesn't exist
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'challenge_status'
    ) THEN
        -- Try to add the value, ignore if it exists
        BEGIN
            ALTER TYPE challenge_status ADD VALUE IF NOT EXISTS 'scheduled';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tutor_challenges_linked_request
  ON tutor_challenges(linked_word_request_id)
  WHERE linked_word_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_word_requests_linked_challenge
  ON word_requests(linked_challenge_id)
  WHERE linked_challenge_id IS NOT NULL;

-- Index for finding scheduled challenges to activate
CREATE INDEX IF NOT EXISTS idx_tutor_challenges_scheduled
  ON tutor_challenges(status)
  WHERE status = 'scheduled';

COMMENT ON COLUMN tutor_challenges.linked_word_request_id IS 'Links challenge to a word request - challenge stays scheduled until word request is completed';
COMMENT ON COLUMN word_requests.linked_challenge_id IS 'Links word request to a challenge that will activate upon completion';
