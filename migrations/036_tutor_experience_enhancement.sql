-- Migration: Tutor Experience Enhancement
-- Adds tables and columns for tutor gamification, achievements, partner engagement, and activity feed

-- ===========================================
-- Achievement System
-- ===========================================

-- Achievement definitions (reference table)
CREATE TABLE IF NOT EXISTS achievement_definitions (
  code VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('tutor', 'student', 'couple')),
  xp_reward INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (which achievements users have unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_code VARCHAR(50) NOT NULL REFERENCES achievement_definitions(code),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_code)
);

-- Index for fetching user's achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ===========================================
-- Tutor Statistics
-- ===========================================

-- Tutor stats table (one row per tutor)
CREATE TABLE IF NOT EXISTS tutor_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  challenges_created INT DEFAULT 0,
  gifts_sent INT DEFAULT 0,
  perfect_scores INT DEFAULT 0,
  words_mastered INT DEFAULT 0,
  teaching_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_teaching_at TIMESTAMPTZ,
  streak_frozen_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Challenge Requests (Student → Tutor)
-- ===========================================

CREATE TABLE IF NOT EXISTS challenge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('general', 'topic', 'specific_words')),
  topic VARCHAR(100),
  word_ids UUID[],
  message VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'fulfilled', 'declined')),
  fulfilled_challenge_id UUID REFERENCES tutor_challenges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Index for fetching pending requests
CREATE INDEX IF NOT EXISTS idx_challenge_requests_tutor_pending
  ON challenge_requests(tutor_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_challenge_requests_student
  ON challenge_requests(student_id);

-- ===========================================
-- Activity Feed
-- ===========================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  data JSONB,
  language_code VARCHAR(5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching user's feed and partner's feed
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_partner ON activity_feed(partner_id, created_at DESC);

-- ===========================================
-- Love Notes
-- ===========================================

CREATE TABLE IF NOT EXISTS love_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_category VARCHAR(30),
  template_text TEXT,
  custom_message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching unread notes
CREATE INDEX IF NOT EXISTS idx_love_notes_recipient_unread
  ON love_notes(recipient_id, created_at DESC) WHERE read_at IS NULL;

-- ===========================================
-- Profile Extensions
-- ===========================================

-- Add tutor-specific columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutor_xp INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutor_tier INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_practice_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nudges_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_nudge_at TIMESTAMPTZ;

-- ===========================================
-- Row Level Security
-- ===========================================

-- Achievement definitions: readable by all authenticated users
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievement_definitions_select" ON achievement_definitions
  FOR SELECT TO authenticated USING (true);

-- User achievements: users can see their own and their partner's
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_select" ON user_achievements
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    user_id IN (SELECT linked_user_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "user_achievements_insert" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Tutor stats: users can see their own
ALTER TABLE tutor_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_stats_select" ON tutor_stats
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tutor_stats_update" ON tutor_stats
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Challenge requests: both student and tutor can see
ALTER TABLE challenge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenge_requests_select" ON challenge_requests
  FOR SELECT TO authenticated USING (
    student_id = auth.uid() OR tutor_id = auth.uid()
  );
CREATE POLICY "challenge_requests_insert" ON challenge_requests
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "challenge_requests_update" ON challenge_requests
  FOR UPDATE TO authenticated USING (tutor_id = auth.uid());

-- Activity feed: users can see their own and partner's events
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_feed_select" ON activity_feed
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    partner_id = auth.uid() OR
    user_id IN (SELECT linked_user_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "activity_feed_insert" ON activity_feed
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Love notes: sender and recipient can see
ALTER TABLE love_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "love_notes_select" ON love_notes
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );
CREATE POLICY "love_notes_insert" ON love_notes
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "love_notes_update" ON love_notes
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- ===========================================
-- Seed Achievement Definitions
-- ===========================================

INSERT INTO achievement_definitions (code, name, description, icon, category, xp_reward) VALUES
  -- Tutor achievements
  ('first_challenge', 'First Challenge', 'Create your first challenge for your partner', '🎯', 'tutor', 5),
  ('first_gift', 'First Gift', 'Send your first word gift', '🎁', 'tutor', 5),
  ('challenge_champion', 'Challenge Champion', 'Create 10 challenges', '🏆', 'tutor', 15),
  ('gift_giver', 'Gift Giver', 'Send 10 word gifts', '💝', 'tutor', 15),
  ('perfect_score', 'Perfect Score', 'Your partner gets 100% on a challenge', '💯', 'tutor', 10),
  ('teaching_pro', 'Teaching Pro', 'Your partner gets 5 perfect scores', '⭐', 'tutor', 25),
  ('week_warrior_tutor', 'Week Warrior', '7-day teaching streak', '🔥', 'tutor', 20),
  ('month_of_love', 'Month of Love', '30-day teaching streak', '💕', 'tutor', 50),
  -- Student achievements
  ('first_word', 'First Word', 'Add your first word to the Love Log', '📝', 'student', 5),
  ('word_collector', 'Word Collector', 'Learn 50 words', '📚', 'student', 20),
  ('first_mastery', 'First Mastery', 'Master your first word (5-streak)', '✨', 'student', 10),
  ('memory_master', 'Memory Master', 'Master 10 words', '🧠', 'student', 25),
  ('challenge_accepted', 'Challenge Accepted', 'Complete your first partner challenge', '💪', 'student', 10),
  ('challenge_crusher', 'Challenge Crusher', 'Complete 10 partner challenges', '🎖️', 'student', 30),
  ('week_of_practice', 'Week of Practice', '7-day practice streak', '🔥', 'student', 20),
  ('conversation_ready', 'Conversation Ready', 'Reach the Conversational tier', '💬', 'student', 50),
  -- Couple achievements
  ('first_dance', 'First Dance', 'Complete your first challenge together', '💃', 'couple', 15),
  ('perfect_pair', 'Perfect Pair', 'Exchange 10 challenges', '👫', 'couple', 30),
  ('gift_exchange', 'Gift Exchange', 'Both send and receive word gifts', '🎀', 'couple', 15),
  ('one_month_strong', 'One Month Strong', '1 month active together', '🌙', 'couple', 40)
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- Update timestamp trigger for tutor_stats
-- ===========================================

CREATE OR REPLACE FUNCTION update_tutor_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tutor_stats_timestamp ON tutor_stats;
CREATE TRIGGER trigger_update_tutor_stats_timestamp
  BEFORE UPDATE ON tutor_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_stats_timestamp();
