-- Listen Mode sessions table
-- Stores transcripts from real-world Polish conversations captured via Gladia API

CREATE TABLE listen_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  context_label TEXT,                    -- Optional label like "Dinner at Babcia's"
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  transcript JSONB NOT NULL DEFAULT '[]', -- Array of transcript entries
  bookmarked_phrases JSONB DEFAULT '[]',  -- Phrases user saved
  detected_words TEXT[] DEFAULT '{}',     -- New vocabulary found
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient user lookups
CREATE INDEX idx_listen_sessions_user ON listen_sessions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE listen_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own listen sessions
CREATE POLICY "Users can view own listen sessions"
  ON listen_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own listen sessions
CREATE POLICY "Users can create own listen sessions"
  ON listen_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listen sessions
CREATE POLICY "Users can update own listen sessions"
  ON listen_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own listen sessions
CREATE POLICY "Users can delete own listen sessions"
  ON listen_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment describing the table
COMMENT ON TABLE listen_sessions IS 'Stores transcripts from Listen Mode - real-world Polish conversations captured via Gladia speech-to-text API';
COMMENT ON COLUMN listen_sessions.transcript IS 'JSON array of {id, speaker, polish, english, timestamp, isBookmarked, isFinal}';
COMMENT ON COLUMN listen_sessions.bookmarked_phrases IS 'Subset of transcript entries that user marked as important';
COMMENT ON COLUMN listen_sessions.detected_words IS 'Array of new vocabulary words extracted from the session';
