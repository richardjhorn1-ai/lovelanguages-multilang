-- Migration: Promo Codes System
-- Adds promo code support for creator access (PostedApp, influencers, etc.)
-- Created: 2025-01-26

-- =============================================================================
-- 1. Add promo_expires_at to profiles
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promo_expires_at timestamptz;

COMMENT ON COLUMN profiles.promo_expires_at IS 'When promotional access expires. If > now(), user gets standard tier limits.';

-- =============================================================================
-- 2. Create promo_codes table
-- =============================================================================

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  grant_days int NOT NULL DEFAULT 7,
  max_uses int DEFAULT 50,
  current_uses int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_by text, -- e.g., 'postedapp-sophie', 'creator-tiktok', etc.
  created_at timestamptz DEFAULT now(),

  CONSTRAINT promo_codes_grant_days_positive CHECK (grant_days > 0),
  CONSTRAINT promo_codes_max_uses_positive CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT promo_codes_current_uses_non_negative CHECK (current_uses >= 0)
);

COMMENT ON TABLE promo_codes IS 'Promotional codes for granting temporary standard tier access to creators/influencers.';

-- =============================================================================
-- 3. Create promo_redemptions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT promo_redemptions_unique_user_code UNIQUE(user_id, code_id)
);

COMMENT ON TABLE promo_redemptions IS 'Tracks which users have redeemed which promo codes (prevents double redemption).';

-- =============================================================================
-- 4. Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON promo_codes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_profiles_promo_expires ON profiles(promo_expires_at) WHERE promo_expires_at IS NOT NULL;

-- =============================================================================
-- 5. RLS Policies
-- =============================================================================

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Promo codes: Only service role can manage (no user access needed)
-- Users interact via API, not direct table access

-- Promo redemptions: Users can only see their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON promo_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypass (implicit for service key)

-- =============================================================================
-- 6. Function to safely increment promo code usage
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_promo_code_usage(p_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = p_code_id;
END;
$$;

-- =============================================================================
-- 7. Function to check if promo is valid and available
-- =============================================================================

CREATE OR REPLACE FUNCTION check_promo_code(p_code text)
RETURNS TABLE(
  id uuid,
  code text,
  grant_days int,
  is_valid boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo
  FROM promo_codes pc
  WHERE UPPER(pc.code) = UPPER(p_code);

  -- Code not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::uuid,
      NULL::text,
      NULL::int,
      false,
      'Invalid or expired code'::text;
    RETURN;
  END IF;

  -- Check if expired
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN QUERY SELECT
      v_promo.id,
      v_promo.code,
      v_promo.grant_days,
      false,
      'Invalid or expired code'::text;
    RETURN;
  END IF;

  -- Check if max uses reached
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT
      v_promo.id,
      v_promo.code,
      v_promo.grant_days,
      false,
      'This code has reached its limit'::text;
    RETURN;
  END IF;

  -- Valid!
  RETURN QUERY SELECT
    v_promo.id,
    v_promo.code,
    v_promo.grant_days,
    true,
    NULL::text;
END;
$$;
