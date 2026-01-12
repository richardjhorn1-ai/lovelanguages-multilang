-- Migration: 026_invite_language.sql
-- Purpose: Add language_code to invite_tokens for multi-language invite flow
-- This allows the invite page to display the correct language being learned

-- Add language_code column to invite_tokens
ALTER TABLE invite_tokens
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5);

-- Add comment explaining the column
COMMENT ON COLUMN invite_tokens.language_code IS 'The active_language of the inviter at invite creation time (ISO 639-1 code)';

-- Backfill existing tokens with the inviter's current active_language
-- This ensures existing unused invites will work correctly
UPDATE invite_tokens it
SET language_code = p.active_language
FROM profiles p
WHERE it.inviter_id = p.id
AND it.language_code IS NULL
AND it.used_at IS NULL;

-- Drop the old function first (required when changing return type)
DROP FUNCTION IF EXISTS validate_invite_token(VARCHAR);

-- Recreate the validate_invite_token function with language_code
CREATE OR REPLACE FUNCTION validate_invite_token(token_value VARCHAR)
RETURNS TABLE (
  id UUID,
  inviter_name VARCHAR,
  inviter_email VARCHAR,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  inviter_id UUID,
  language_code VARCHAR
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
    it.inviter_id,
    it.language_code
  FROM invite_tokens it
  WHERE it.token = token_value;
END;
$$;

-- Re-grant permissions on the updated function
GRANT EXECUTE ON FUNCTION validate_invite_token TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_token TO authenticated;
