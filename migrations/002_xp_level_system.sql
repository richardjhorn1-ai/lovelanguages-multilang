-- Migration: XP and Level System
-- Run this in Supabase SQL editor

-- Ensure XP and level have defaults on profiles table
ALTER TABLE profiles
ALTER COLUMN xp SET DEFAULT 0,
ALTER COLUMN level SET DEFAULT 1;

-- Update existing records without XP/level
UPDATE profiles SET xp = 0 WHERE xp IS NULL;
UPDATE profiles SET level = 1 WHERE level IS NULL;

-- Create level_tests table to track test attempts
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient user test history queries
CREATE INDEX IF NOT EXISTS idx_level_tests_user ON level_tests(user_id, completed_at DESC);

-- Enable RLS on level_tests
ALTER TABLE level_tests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own test results
CREATE POLICY "Users can view own tests" ON level_tests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own test results
CREATE POLICY "Users can insert own tests" ON level_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tests (for completing)
CREATE POLICY "Users can update own tests" ON level_tests
  FOR UPDATE USING (auth.uid() = user_id);
