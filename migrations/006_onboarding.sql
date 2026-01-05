-- Migration 006: Onboarding System
-- Run this in Supabase SQL Editor

-- Add onboarding columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Index for checking onboarding status efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed_at);

-- Comment explaining the schema
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding, NULL if not completed';
COMMENT ON COLUMN profiles.onboarding_data IS 'JSON blob storing all onboarding answers (vibe, why, fears, etc.)';
COMMENT ON COLUMN profiles.partner_name IS 'Name of the person they are learning Polish for/with';
