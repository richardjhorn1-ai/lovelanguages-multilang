-- Progress summaries (Learning Journey diary entries)
CREATE TABLE IF NOT EXISTS progress_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  topics_explored JSONB,
  grammar_highlights JSONB,
  can_now_say JSONB,
  suggestions JSONB,
  words_learned INT NOT NULL DEFAULT 0,
  xp_at_time INT NOT NULL DEFAULT 0,
  level_at_time VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_summaries_user ON progress_summaries(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE progress_summaries ENABLE ROW LEVEL SECURITY;

-- Users can read their own summaries
CREATE POLICY "Users can read own summaries" ON progress_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert summaries
CREATE POLICY "Service can insert summaries" ON progress_summaries
  FOR INSERT WITH CHECK (true);
