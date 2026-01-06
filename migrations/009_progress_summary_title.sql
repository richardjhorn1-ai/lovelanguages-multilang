-- Migration 009: Add title column to progress_summaries
-- Allows each learning journey entry to have a unique, descriptive title

ALTER TABLE progress_summaries
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add a default title for existing entries based on date
UPDATE progress_summaries
SET title = 'Journey Entry ' || TO_CHAR(created_at, 'Mon DD')
WHERE title IS NULL;
