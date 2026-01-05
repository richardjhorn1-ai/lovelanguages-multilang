-- Migration: 004_invite_tokens.sql
-- Purpose: Create invite_tokens table for magic partner invite links

-- Create invite_tokens table
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

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);

-- Index for finding user's invites
CREATE INDEX IF NOT EXISTS idx_invite_tokens_inviter ON invite_tokens(inviter_id);

-- Enable Row Level Security
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invites
CREATE POLICY "Users can view own invites" ON invite_tokens
  FOR SELECT USING (auth.uid() = inviter_id);

-- Policy: Users can create invites for themselves
CREATE POLICY "Users can create invites" ON invite_tokens
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Policy: Anyone can validate tokens (needed for join page before auth)
-- This uses service role, so we need a function instead
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

-- Policy: Allow service role to update tokens (for marking as used)
CREATE POLICY "Service can update tokens" ON invite_tokens
  FOR UPDATE USING (true);

-- Grant execute permission on the validation function
GRANT EXECUTE ON FUNCTION validate_invite_token TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_token TO authenticated;
