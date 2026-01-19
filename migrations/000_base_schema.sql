-- ============================================================
-- Migration: 000_base_schema.sql
-- Description: Complete base schema for fresh Supabase database
-- Date: January 10, 2026
--
-- This migration creates ALL tables needed for Love Languages app.
-- Run this FIRST on a fresh database, then run subsequent migrations.
--
-- Table creation order respects foreign key dependencies:
-- 1. profiles (depends only on auth.users - built-in)
-- 2. subscription_plans (no dependencies)
-- 3. First-level tables (depend on profiles only)
-- 4. Second-level tables (depend on first-level tables)
-- ============================================================

-- =============================================================================
-- LEVEL 0: Core tables with no dependencies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES TABLE - Core user profile data
-- Links to Supabase auth.users table via id
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic user info
  name TEXT,
  email TEXT,
  avatar_url TEXT,

  -- User role and partner linking
  role VARCHAR(20),  -- 'student' or 'tutor' (NULL until confirmed in RoleSelection)
  linked_user_id UUID REFERENCES profiles(id),
  partner_name TEXT,

  -- XP and level system
  xp INT DEFAULT 0,
  level INT DEFAULT 1,

  -- Multi-language support (18 languages)
  native_language VARCHAR(5) DEFAULT 'en' NOT NULL,  -- AI explains in this language
  active_language VARCHAR(5) DEFAULT 'pl' NOT NULL,  -- Currently learning
  languages TEXT[] DEFAULT ARRAY['pl']::TEXT[],       -- All unlocked target languages

  -- Onboarding
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_data JSONB DEFAULT '{}',

  -- Theme preferences
  accent_color TEXT DEFAULT 'rose',
  dark_mode TEXT DEFAULT 'off',
  font_size TEXT DEFAULT 'medium',

  -- Settings
  smart_validation BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,

  -- Subscription fields
  subscription_plan VARCHAR(20) DEFAULT 'none',
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  subscription_period VARCHAR(10),  -- 'monthly' or 'yearly'
  subscription_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,
  stripe_customer_id VARCHAR(100),
  subscription_granted_by UUID REFERENCES profiles(id),
  subscription_granted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_linked_user ON profiles(linked_user_id) WHERE linked_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_granted_by ON profiles(subscription_granted_by) WHERE subscription_granted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed_at);
CREATE INDEX IF NOT EXISTS idx_profiles_native_language ON profiles(native_language);
CREATE INDEX IF NOT EXISTS idx_profiles_active_language ON profiles(active_language);

-- Theme check constraints
ALTER TABLE profiles
ADD CONSTRAINT valid_accent_color CHECK (accent_color IS NULL OR accent_color IN ('rose', 'blush', 'lavender', 'wine', 'teal', 'honey'));
ALTER TABLE profiles
ADD CONSTRAINT valid_dark_mode CHECK (dark_mode IS NULL OR dark_mode IN ('off', 'midnight', 'charcoal', 'black'));
ALTER TABLE profiles
ADD CONSTRAINT valid_font_size CHECK (font_size IS NULL OR font_size IN ('small', 'medium', 'large'));

-- Comments
COMMENT ON COLUMN profiles.native_language IS 'User''s mother tongue (ISO 639-1 code). AI explains concepts in this language.';
COMMENT ON COLUMN profiles.active_language IS 'Currently learning this language (ISO 639-1 code). All new data uses this.';
COMMENT ON COLUMN profiles.languages IS 'Array of unlocked target language codes. Premium feature for learning multiple languages.';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding, NULL if not completed';
COMMENT ON COLUMN profiles.onboarding_data IS 'JSON blob storing all onboarding answers (vibe, why, fears, etc.)';
COMMENT ON COLUMN profiles.partner_name IS 'Name of the person they are learning Polish for/with';
COMMENT ON COLUMN profiles.smart_validation IS 'When true, uses AI-powered answer validation that accepts synonyms, minor typos, and article variations.';
COMMENT ON COLUMN profiles.is_admin IS 'Admin flag for accessing protected endpoints like article generation';
COMMENT ON COLUMN profiles.subscription_plan IS 'Current plan: none, standard, unlimited';
COMMENT ON COLUMN profiles.subscription_status IS 'Status: inactive, active, past_due, canceled';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for this user';
COMMENT ON COLUMN profiles.subscription_period IS 'Billing period: monthly or yearly';
COMMENT ON COLUMN profiles.subscription_ends_at IS 'When current subscription period ends';
COMMENT ON COLUMN profiles.subscription_granted_by IS 'UUID of the payer who granted this user free access. NULL if user pays directly.';
COMMENT ON COLUMN profiles.subscription_granted_at IS 'When the inherited subscription was granted.';
COMMENT ON COLUMN profiles.linked_user_id IS 'UUID of linked partner (bidirectional relationship).';

-- -----------------------------------------------------------------------------
-- SUBSCRIPTION_PLANS TABLE - Reference table for plan features
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_monthly_cents INT NOT NULL,
  price_yearly_cents INT NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_monthly_cents, price_yearly_cents, features) VALUES
('standard', 'Standard', 1900, 6900, '{
  "word_limit": 2000,
  "voice_minutes_per_month": 60,
  "listen_minutes_per_month": 30,
  "ai_challenges_per_day": null,
  "conversation_scenarios": "all",
  "partner_invite": true,
  "gift_pass": false
}'::jsonb),
('unlimited', 'Unlimited', 3900, 13900, '{
  "word_limit": null,
  "voice_minutes_per_month": null,
  "listen_minutes_per_month": null,
  "ai_challenges_per_day": null,
  "conversation_scenarios": "all",
  "partner_invite": true,
  "gift_pass": true
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE subscription_plans IS 'Reference table for subscription tier features and pricing';

-- =============================================================================
-- LEVEL 1: Tables that depend only on profiles
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CHATS TABLE - Conversation containers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  mode VARCHAR(20) DEFAULT 'learn',  -- 'ask', 'learn', 'coach'
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_language ON chats(language_code);
CREATE INDEX IF NOT EXISTS idx_chats_user_language ON chats(user_id, language_code);

COMMENT ON COLUMN chats.language_code IS 'Target language this chat conversation is about (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- DICTIONARY TABLE - Vocabulary entries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Word data
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  pronunciation TEXT,
  word_type VARCHAR(30),  -- 'noun', 'verb', 'adjective', etc.

  -- Grammar details (language-specific)
  gender VARCHAR(20),          -- For gendered languages
  plural TEXT,                 -- Plural form
  conjugations JSONB,          -- Verb conjugation data
  adjective_forms JSONB,       -- Adjective agreement forms

  -- Learning context
  example_sentence TEXT,
  example_translation TEXT,
  pro_tip TEXT,
  notes TEXT,

  -- Source tracking
  source VARCHAR(30) DEFAULT 'chat',  -- 'chat', 'manual', 'gift', 'listen'

  -- Multi-language
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,

  -- AI enrichment tracking
  enriched_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one entry per word per user per language
  UNIQUE(user_id, word, language_code)
);

CREATE INDEX IF NOT EXISTS idx_dictionary_user ON dictionary(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dictionary_language ON dictionary(language_code);
CREATE INDEX IF NOT EXISTS idx_dictionary_user_language ON dictionary(user_id, language_code);
CREATE INDEX IF NOT EXISTS idx_dictionary_user_lang_word ON dictionary(user_id, language_code, word);

COMMENT ON COLUMN dictionary.language_code IS 'Target language this vocabulary entry belongs to (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- LEVEL_TESTS TABLE - Proficiency tests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS level_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_level VARCHAR(30) NOT NULL,
  to_level VARCHAR(30) NOT NULL,
  passed BOOLEAN NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  questions JSONB,
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_tests_user ON level_tests(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_level_tests_language ON level_tests(language_code);
CREATE INDEX IF NOT EXISTS idx_level_tests_user_language ON level_tests(user_id, language_code);

COMMENT ON COLUMN level_tests.language_code IS 'Target language this proficiency test was for (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- PROGRESS_SUMMARIES TABLE - Learning diary entries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255),
  summary TEXT NOT NULL,
  topics_explored JSONB,
  grammar_highlights JSONB,
  can_now_say JSONB,
  suggestions JSONB,
  words_learned INT NOT NULL DEFAULT 0,
  xp_at_time INT NOT NULL DEFAULT 0,
  level_at_time VARCHAR(50),
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_summaries_user ON progress_summaries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_summaries_language ON progress_summaries(language_code);
CREATE INDEX IF NOT EXISTS idx_progress_summaries_user_language ON progress_summaries(user_id, language_code);

COMMENT ON COLUMN progress_summaries.language_code IS 'Target language this progress summary covers (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- INVITE_TOKENS TABLE - Partner invitation links
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  inviter_name VARCHAR(255),
  inviter_email VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_inviter ON invite_tokens(inviter_id);

-- -----------------------------------------------------------------------------
-- TUTOR_CHALLENGES TABLE - Partner challenges
-- -----------------------------------------------------------------------------
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
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_challenges_student ON tutor_challenges(student_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_tutor ON tutor_challenges(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_challenges_language ON tutor_challenges(language_code);
CREATE INDEX IF NOT EXISTS idx_tutor_challenges_student_language ON tutor_challenges(student_id, language_code);

COMMENT ON COLUMN tutor_challenges.language_code IS 'Target language this challenge tests (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- WORD_REQUESTS TABLE - Word gift requests
-- -----------------------------------------------------------------------------
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
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_word_requests_student ON word_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_word_requests_tutor ON word_requests(tutor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_word_requests_language ON word_requests(language_code);
CREATE INDEX IF NOT EXISTS idx_word_requests_student_language ON word_requests(student_id, language_code);

COMMENT ON COLUMN word_requests.language_code IS 'Target language for these gift words (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE - User notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  language_code VARCHAR(5) DEFAULT NULL,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_language ON notifications(language_code) WHERE language_code IS NOT NULL;

COMMENT ON COLUMN notifications.language_code IS 'Target language context for this notification (ISO 639-1 code), NULL if not language-specific.';

-- -----------------------------------------------------------------------------
-- GAME_SESSIONS TABLE - Practice game history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_mode VARCHAR(30) NOT NULL,  -- 'flashcards', 'multiple_choice', 'type_it', etc.
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  total_time_seconds INT,
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed_at ON game_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_completed ON game_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_language ON game_sessions(language_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_language ON game_sessions(user_id, language_code);

COMMENT ON COLUMN game_sessions.language_code IS 'Target language being practiced in this game session (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- LISTEN_SESSIONS TABLE - Listen mode transcripts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listen_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  context_label TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  transcript JSONB NOT NULL DEFAULT '[]',
  bookmarked_phrases JSONB DEFAULT '[]',
  detected_words TEXT[] DEFAULT '{}',
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listen_sessions_user ON listen_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listen_sessions_language ON listen_sessions(language_code);
CREATE INDEX IF NOT EXISTS idx_listen_sessions_user_language ON listen_sessions(user_id, language_code);

COMMENT ON TABLE listen_sessions IS 'Stores transcripts from Listen Mode - real-world conversations captured via Gladia speech-to-text API';
COMMENT ON COLUMN listen_sessions.transcript IS 'JSON array of {id, speaker, polish, english, timestamp, isBookmarked, isFinal}';
COMMENT ON COLUMN listen_sessions.bookmarked_phrases IS 'Subset of transcript entries that user marked as important';
COMMENT ON COLUMN listen_sessions.detected_words IS 'Array of new vocabulary words extracted from the session';
COMMENT ON COLUMN listen_sessions.language_code IS 'Target language being transcribed in this Listen Mode session (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- ARTICLE_GENERATIONS TABLE - Admin article tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT,
  difficulty TEXT,
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  word_count INTEGER,
  has_image BOOLEAN DEFAULT false,
  CONSTRAINT article_generations_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_article_generations_user ON article_generations(generated_by);
CREATE INDEX IF NOT EXISTS idx_article_generations_date ON article_generations(generated_at DESC);

COMMENT ON TABLE article_generations IS 'Tracks AI-generated blog articles. Admin-only, accessed via service key.';

-- -----------------------------------------------------------------------------
-- SUBSCRIPTION_EVENTS TABLE - Subscription audit log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  stripe_event_id VARCHAR(100),
  previous_plan VARCHAR(20),
  new_plan VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe ON subscription_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

COMMENT ON TABLE subscription_events IS 'Audit log of subscription changes triggered by Stripe webhooks';
COMMENT ON COLUMN subscription_events.event_type IS 'Type: checkout_completed, subscription_updated, subscription_deleted, payment_failed';

-- -----------------------------------------------------------------------------
-- GIFT_PASSES TABLE - Premium gift passes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gift_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'standard',
  duration_months INT NOT NULL DEFAULT 12,
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gift_passes_code ON gift_passes(code) WHERE redeemed_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_gift_passes_creator ON gift_passes(created_by);

COMMENT ON TABLE gift_passes IS 'Gift passes that Unlimited yearly subscribers can give to another couple';
COMMENT ON COLUMN gift_passes.code IS 'Unique redemption code (e.g., LOVE-XXXX-XXXX)';
COMMENT ON COLUMN gift_passes.duration_months IS 'How long the gift subscription lasts (default 12 months)';

-- -----------------------------------------------------------------------------
-- USAGE_TRACKING TABLE - Rate limiting counters
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  usage_type VARCHAR(30) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_type, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, usage_date);

COMMENT ON TABLE usage_tracking IS 'Daily usage counters for rate-limited features';
COMMENT ON COLUMN usage_tracking.usage_type IS 'Type: voice_minutes, listen_minutes, words_added';

-- -----------------------------------------------------------------------------
-- BUG_REPORTS TABLE - User bug reports
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  page_url TEXT,
  browser_info JSONB,
  app_state JSONB,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity, status);

-- =============================================================================
-- LEVEL 2: Tables that depend on Level 1 tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MESSAGES TABLE - Chat messages (depends on chats)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
  content TEXT NOT NULL,
  source VARCHAR(10) DEFAULT 'text',  -- 'text' or 'voice'
  vocabulary_harvested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unharvested ON messages(created_at) WHERE vocabulary_harvested_at IS NULL;

-- -----------------------------------------------------------------------------
-- WORD_SCORES TABLE - Mastery tracking (depends on dictionary)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE NOT NULL,
  correct_streak INT DEFAULT 0,
  total_attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,
  learned_at TIMESTAMPTZ,  -- Set when correct_streak >= 5
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_word_scores_user ON word_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_word_scores_word ON word_scores(word_id);
CREATE INDEX IF NOT EXISTS idx_word_scores_language ON word_scores(language_code);
CREATE INDEX IF NOT EXISTS idx_word_scores_user_language ON word_scores(user_id, language_code);

COMMENT ON COLUMN word_scores.language_code IS 'Target language this mastery score belongs to (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- CHALLENGE_RESULTS TABLE - Challenge results (depends on tutor_challenges)
-- -----------------------------------------------------------------------------
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
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_results_challenge ON challenge_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_results_language ON challenge_results(language_code);
CREATE INDEX IF NOT EXISTS idx_challenge_results_student_language ON challenge_results(student_id, language_code);

COMMENT ON COLUMN challenge_results.language_code IS 'Target language of the completed challenge (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- GIFT_WORDS TABLE - Gifted vocabulary (depends on dictionary, word_requests)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gift_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES dictionary(id) ON DELETE CASCADE,
  word_request_id UUID REFERENCES word_requests(id) ON DELETE SET NULL,
  tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  xp_earned INT DEFAULT 0,
  language_code VARCHAR(5) DEFAULT 'pl' NOT NULL,
  gifted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_words_student ON gift_words(student_id);
CREATE INDEX IF NOT EXISTS idx_gift_words_word ON gift_words(word_id);
CREATE INDEX IF NOT EXISTS idx_gift_words_language ON gift_words(language_code);
CREATE INDEX IF NOT EXISTS idx_gift_words_student_language ON gift_words(student_id, language_code);

COMMENT ON COLUMN gift_words.language_code IS 'Target language of the gifted word (ISO 639-1 code).';

-- -----------------------------------------------------------------------------
-- GAME_SESSION_ANSWERS TABLE - Game answers (depends on game_sessions, dictionary)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  word_id UUID REFERENCES dictionary(id) ON DELETE SET NULL,
  word_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  question_type VARCHAR(20),
  is_correct BOOLEAN NOT NULL,
  explanation TEXT,  -- AI explanation for smart validation
  order_index INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_session_answers_session_id ON game_session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_game_session_answers_word_id ON game_session_answers(word_id);
CREATE INDEX IF NOT EXISTS idx_game_session_answers_is_correct ON game_session_answers(session_id, is_correct);

COMMENT ON COLUMN game_session_answers.explanation IS 'AI explanation for why the answer was accepted or rejected during smart validation';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE listen_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper function for partner access (with RLS bypass to prevent recursion)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_linked_partner_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET row_security = off
SET search_path = public
AS $$
  SELECT linked_user_id FROM profiles WHERE id = user_uuid;
$$;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view linked partner profile" ON profiles
  FOR SELECT USING (id = get_linked_partner_id(auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- -----------------------------------------------------------------------------
-- CHATS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- MESSAGES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users can create own messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Service can update messages" ON messages
  FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- DICTIONARY POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own vocabulary" ON dictionary
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can view linked user vocabulary" ON dictionary
  FOR SELECT USING (user_id = get_linked_partner_id(auth.uid()));

CREATE POLICY "Users can create own vocabulary" ON dictionary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary" ON dictionary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary" ON dictionary
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- WORD_SCORES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own scores" ON word_scores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can view linked user scores" ON word_scores
  FOR SELECT USING (user_id = get_linked_partner_id(auth.uid()));

CREATE POLICY "Users can create own scores" ON word_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores" ON word_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- LEVEL_TESTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own tests" ON level_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests" ON level_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON level_tests
  FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- PROGRESS_SUMMARIES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can read own summaries" ON progress_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert summaries" ON progress_summaries
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- INVITE_TOKENS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own invites" ON invite_tokens
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invites" ON invite_tokens
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Service can update tokens" ON invite_tokens
  FOR UPDATE USING (true);

-- Token validation function (accessible to anon users for join page)
CREATE OR REPLACE FUNCTION validate_invite_token(token_value VARCHAR)
RETURNS TABLE (
  id UUID,
  inviter_name VARCHAR,
  inviter_email VARCHAR,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  inviter_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    it.id,
    it.inviter_name,
    it.inviter_email,
    it.expires_at,
    it.used_at,
    it.inviter_id
  FROM invite_tokens it
  WHERE it.token = token_value;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_invite_token TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_token TO authenticated;

-- -----------------------------------------------------------------------------
-- TUTOR_CHALLENGES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own challenges" ON tutor_challenges
  FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = student_id);

CREATE POLICY "Tutors can create challenges" ON tutor_challenges
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Users can update own challenges" ON tutor_challenges
  FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- -----------------------------------------------------------------------------
-- CHALLENGE_RESULTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own results" ON challenge_results
  FOR SELECT USING (
    auth.uid() = student_id OR EXISTS (
      SELECT 1 FROM tutor_challenges WHERE id = challenge_id AND tutor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create results" ON challenge_results
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- -----------------------------------------------------------------------------
-- WORD_REQUESTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own requests" ON word_requests
  FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = student_id);

CREATE POLICY "Tutors can create requests" ON word_requests
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Users can update own requests" ON word_requests
  FOR UPDATE USING (auth.uid() = tutor_id OR auth.uid() = student_id);

-- -----------------------------------------------------------------------------
-- GIFT_WORDS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own gifts" ON gift_words
  FOR SELECT USING (auth.uid() = tutor_id OR auth.uid() = student_id);

CREATE POLICY "Service can insert gifts" ON gift_words
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- GAME_SESSIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own game sessions" ON game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions" ON game_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- GAME_SESSION_ANSWERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own session answers" ON game_session_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_session_answers.session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session answers" ON game_session_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = game_session_answers.session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- LISTEN_SESSIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own listen sessions" ON listen_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own listen sessions" ON listen_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listen sessions" ON listen_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listen sessions" ON listen_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- SUBSCRIPTION_EVENTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own subscription events" ON subscription_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscription events" ON subscription_events
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- GIFT_PASSES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own gift passes" ON gift_passes
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can view redeemed gift passes" ON gift_passes
  FOR SELECT USING (auth.uid() = redeemed_by);

-- -----------------------------------------------------------------------------
-- USAGE_TRACKING POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON usage_tracking
  FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- BUG_REPORTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage all bug reports" ON bug_reports
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- TTS cache bucket (private, signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tts-cache',
  'tts-cache',
  false,
  1048576,  -- 1MB limit
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'chats', 'messages', 'dictionary', 'word_scores',
    'level_tests', 'progress_summaries', 'invite_tokens', 'tutor_challenges',
    'challenge_results', 'word_requests', 'gift_words', 'notifications',
    'game_sessions', 'game_session_answers', 'listen_sessions',
    'article_generations', 'subscription_plans', 'subscription_events',
    'gift_passes', 'usage_tracking', 'bug_reports'
  );

  IF table_count = 22 THEN
    RAISE NOTICE '=== Migration 000 Complete ===';
    RAISE NOTICE 'All 22 tables created successfully.';
    RAISE NOTICE 'You can now run subsequent migrations (001+) for incremental updates.';
  ELSE
    RAISE WARNING 'Expected 22 tables, found %. Some tables may not have been created.', table_count;
  END IF;
END $$;

-- =============================================================================
-- END OF BASE SCHEMA MIGRATION
-- =============================================================================
