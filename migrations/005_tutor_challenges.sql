-- Migration: 005_tutor_challenges.sql
-- Tutor Games, Word Requests, and Notifications

-- 1. TUTOR CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS tutor_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_type VARCHAR(30) NOT NULL,
  title VARCHAR(255),
  config JSONB NOT NULL,
  word_ids UUID[] DEFAULT '{}',
  words_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2. CHALLENGE RESULTS TABLE
CREATE TABLE IF NOT EXISTS challenge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES tutor_challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  time_spent_seconds INT,
  answers JSONB,
  xp_earned INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORD REQUESTS TABLE
CREATE TABLE IF NOT EXISTS word_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type VARCHAR(30) NOT NULL,
  input_text TEXT NOT NULL,
  ai_suggestions JSONB,
  selected_words JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  learning_content JSONB,
  xp_multiplier DECIMAL(3,1) DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 4. GIFT WORDS TABLE
CREATE TABLE IF NOT EXISTS gift_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES dictionary(id) ON DELETE CASCADE,
  word_request_id UUID REFERENCES word_requests(id) ON DELETE SET NULL,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  xp_earned INT DEFAULT 0,
  gifted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_challenges_student ON tutor_challenges(student_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_tutor ON tutor_challenges(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_results_challenge ON challenge_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_word_requests_student ON word_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_word_requests_tutor ON word_requests(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_words_student ON gift_words(student_id);
CREATE INDEX IF NOT EXISTS idx_gift_words_word ON gift_words(word_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, created_at DESC);

-- ROW LEVEL SECURITY
ALTER TABLE tutor_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: Challenges
CREATE POLICY "Users can view own challenges" ON tutor_challenges
  FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = student_id);
CREATE POLICY "Tutors can create challenges" ON tutor_challenges
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Users can update own challenges" ON tutor_challenges
  FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- RLS POLICIES: Challenge Results
CREATE POLICY "Users can view own results" ON challenge_results
  FOR SELECT USING (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM tutor_challenges WHERE id = challenge_id AND tutor_id = auth.uid()
  ));
CREATE POLICY "Students can create results" ON challenge_results
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RLS POLICIES: Word Requests
CREATE POLICY "Users can view own requests" ON word_requests
  FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = student_id);
CREATE POLICY "Tutors can create requests" ON word_requests
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Users can update own requests" ON word_requests
  FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- RLS POLICIES: Gift Words
CREATE POLICY "Users can view own gifts" ON gift_words
  FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = student_id);
CREATE POLICY "Service can insert gifts" ON gift_words
  FOR INSERT WITH CHECK (true);

-- RLS POLICIES: Notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);
