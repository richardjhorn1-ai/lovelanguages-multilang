-- Migration 008: Game Sessions History
-- Tracks game session results and individual answers for review

-- Game sessions table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_mode VARCHAR(30) NOT NULL,  -- 'flashcards', 'multiple_choice', 'type_it', 'quick_fire', 'ai_challenge'
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  total_time_seconds INT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual answers within a session
CREATE TABLE game_session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  word_id UUID REFERENCES dictionary(id) ON DELETE SET NULL,
  word_text TEXT NOT NULL,  -- Store word text in case word is deleted
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  question_type VARCHAR(20),  -- 'flashcard', 'multiple_choice', 'type_it'
  is_correct BOOLEAN NOT NULL,
  order_index INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_completed_at ON game_sessions(completed_at DESC);
CREATE INDEX idx_game_sessions_user_completed ON game_sessions(user_id, completed_at DESC);
CREATE INDEX idx_game_session_answers_session_id ON game_session_answers(session_id);
CREATE INDEX idx_game_session_answers_word_id ON game_session_answers(word_id);
CREATE INDEX idx_game_session_answers_is_correct ON game_session_answers(session_id, is_correct);

-- RLS Policies
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_session_answers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own game sessions
CREATE POLICY "Users can view own game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can see answers for their own sessions
CREATE POLICY "Users can view own session answers"
  ON game_session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_session_answers.session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session answers"
  ON game_session_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_session_answers.session_id
      AND game_sessions.user_id = auth.uid()
    )
  );
