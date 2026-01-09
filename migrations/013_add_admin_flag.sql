-- Migration: Add admin flag to profiles
-- Run this in Supabase SQL editor

-- Add is_admin column (defaults to false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create partial index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Comment for documentation
COMMENT ON COLUMN profiles.is_admin IS 'Admin flag for accessing protected endpoints like article generation';
