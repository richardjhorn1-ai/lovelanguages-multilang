-- Migration: Add vocabulary tracking columns
-- Run this in your Supabase SQL Editor

-- 1. Add tracking column to messages table
-- This tracks when vocabulary was extracted from each message
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS vocabulary_harvested_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Add source column to distinguish text vs voice messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS source VARCHAR(10) DEFAULT 'text';

-- 3. Create index for efficient unharvested message queries
CREATE INDEX IF NOT EXISTS idx_messages_unharvested
ON messages (created_at)
WHERE vocabulary_harvested_at IS NULL;

-- 4. Add enriched_at column to dictionary for tracking enrichment status
ALTER TABLE dictionary
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Verification query (optional - run to check columns were added)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'messages' AND column_name IN ('vocabulary_harvested_at', 'source');
