-- Add unlocked_at column to dictionary table
-- Tracks when a word was unlocked via word gift (complete-word-request)
-- Column was added manually in production; this migration ensures fresh deploys match.

ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;
