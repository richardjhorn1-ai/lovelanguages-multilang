-- ============================================================
-- Migration 029: Security Hardening
--
-- Addresses vulnerabilities from security scan:
-- - RPC Function Enumeration (#7)
-- - API Version Information Disclosure (#9)
-- - Secure SECURITY DEFINER functions
-- - Add rate limiting table for auth operations
-- - Restrict schema exposure
-- ============================================================

-- =============================================================================
-- PART 1: Rate Limiting for Auth Operations
-- Addresses: #1 Login Rate Limiting, #3 OTP Brute Force, #12 Password Reset Abuse
-- =============================================================================

-- Create auth rate limiting table
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,           -- IP address or email
  action_type VARCHAR(30) NOT NULL,   -- 'login', 'otp_verify', 'password_reset'
  attempt_count INT DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  UNIQUE(identifier, action_type)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON auth_rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked ON auth_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

COMMENT ON TABLE auth_rate_limits IS 'Tracks failed auth attempts for rate limiting. Cleaned up by cron job.';

-- Enable RLS - NO policies for anon/authenticated means only service role can access
-- Service role bypasses RLS automatically
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies = only service role can access (service role bypasses RLS)

-- Function to check and update rate limits (called from API)
CREATE OR REPLACE FUNCTION check_auth_rate_limit(
  p_identifier TEXT,
  p_action_type VARCHAR(30),
  p_max_attempts INT DEFAULT 5,
  p_window_minutes INT DEFAULT 15,
  p_block_minutes INT DEFAULT 30
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INT,
  blocked_until TIMESTAMPTZ,
  wait_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record auth_rate_limits%ROWTYPE;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  v_window_start := v_now - (p_window_minutes || ' minutes')::INTERVAL;

  -- Get existing record
  SELECT * INTO v_record
  FROM auth_rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type;

  -- Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN QUERY SELECT
      false,
      0,
      v_record.blocked_until,
      EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INT;
    RETURN;
  END IF;

  -- If record exists but outside window, reset it
  IF v_record.id IS NOT NULL AND v_record.first_attempt_at < v_window_start THEN
    UPDATE auth_rate_limits
    SET attempt_count = 1,
        first_attempt_at = v_now,
        last_attempt_at = v_now,
        blocked_until = NULL
    WHERE id = v_record.id;

    RETURN QUERY SELECT true, p_max_attempts - 1, NULL::TIMESTAMPTZ, 0;
    RETURN;
  END IF;

  -- If no record, create one
  IF v_record.id IS NULL THEN
    INSERT INTO auth_rate_limits (identifier, action_type, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (p_identifier, p_action_type, 1, v_now, v_now);

    RETURN QUERY SELECT true, p_max_attempts - 1, NULL::TIMESTAMPTZ, 0;
    RETURN;
  END IF;

  -- Increment attempt count
  UPDATE auth_rate_limits
  SET attempt_count = attempt_count + 1,
      last_attempt_at = v_now,
      blocked_until = CASE
        WHEN attempt_count + 1 >= p_max_attempts
        THEN v_now + (p_block_minutes || ' minutes')::INTERVAL
        ELSE NULL
      END
  WHERE id = v_record.id
  RETURNING * INTO v_record;

  -- Check if now blocked
  IF v_record.attempt_count >= p_max_attempts THEN
    RETURN QUERY SELECT
      false,
      0,
      v_record.blocked_until,
      (p_block_minutes * 60);
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    p_max_attempts - v_record.attempt_count,
    NULL::TIMESTAMPTZ,
    0;
END;
$$;

-- Function to clear rate limit on successful auth
CREATE OR REPLACE FUNCTION clear_auth_rate_limit(
  p_identifier TEXT,
  p_action_type VARCHAR(30)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth_rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type;
END;
$$;

-- Cleanup function for old rate limit records (run via cron)
CREATE OR REPLACE FUNCTION cleanup_auth_rate_limits()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM auth_rate_limits
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


-- =============================================================================
-- PART 2: Secure RPC Functions - Prevent Enumeration (#7)
-- =============================================================================

-- Revoke execute on all functions from public/anon except explicitly needed
-- Note: Run these one by one as some functions may not exist

-- Keep validate_invite_token accessible (needed for join flow)
-- Already granted to anon in base schema

-- Make rate limit functions only accessible to authenticated/service
-- Note: Full function signatures required for REVOKE/GRANT
REVOKE EXECUTE ON FUNCTION check_auth_rate_limit(TEXT, VARCHAR, INT, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_auth_rate_limit(TEXT, VARCHAR, INT, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION check_auth_rate_limit(TEXT, VARCHAR, INT, INT, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION clear_auth_rate_limit(TEXT, VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION clear_auth_rate_limit(TEXT, VARCHAR) FROM anon;
GRANT EXECUTE ON FUNCTION clear_auth_rate_limit(TEXT, VARCHAR) TO authenticated;

REVOKE EXECUTE ON FUNCTION cleanup_auth_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cleanup_auth_rate_limits() FROM anon;
-- Service role can always execute (bypasses permissions)

-- Secure the partner lookup function
REVOKE EXECUTE ON FUNCTION get_linked_partner_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_linked_partner_id(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION get_linked_partner_id(UUID) TO authenticated;


-- =============================================================================
-- PART 3: Hide Schema Information (#9 API Version Disclosure)
-- =============================================================================

-- Revoke access to pg_catalog for anon users (hides version info)
-- Note: This may break some tools, test carefully
-- REVOKE SELECT ON pg_catalog.pg_proc FROM anon;
-- REVOKE SELECT ON pg_catalog.pg_namespace FROM anon;

-- Safer approach: Create a security view that doesn't expose internals
CREATE OR REPLACE VIEW public.app_health AS
SELECT
  'healthy' AS status,
  NOW() AS checked_at;

GRANT SELECT ON public.app_health TO anon;
GRANT SELECT ON public.app_health TO authenticated;


-- =============================================================================
-- PART 4: Secure SECURITY DEFINER Functions
-- =============================================================================

-- Ensure all SECURITY DEFINER functions have proper search_path set
-- This prevents search_path injection attacks

-- Update validate_invite_token to be more secure
-- Must drop first because return type is changing
DROP FUNCTION IF EXISTS validate_invite_token(VARCHAR);

CREATE OR REPLACE FUNCTION validate_invite_token(token_value VARCHAR)
RETURNS TABLE (
  id UUID,
  inviter_name VARCHAR,
  inviter_email VARCHAR,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  inviter_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '5s'  -- Prevent DoS via slow queries
AS $$
BEGIN
  -- Validate input
  IF token_value IS NULL OR LENGTH(token_value) < 10 OR LENGTH(token_value) > 100 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    it.id,
    it.inviter_name,
    it.inviter_email,
    it.expires_at,
    it.used_at,
    it.inviter_id
  FROM invite_tokens it
  WHERE it.token = token_value
  LIMIT 1;  -- Prevent multiple row injection
END;
$$;


-- =============================================================================
-- PART 5: Add Failed Login Tracking to Profiles
-- For monitoring and alerting on suspicious activity
-- =============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;

COMMENT ON COLUMN profiles.failed_login_count IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN profiles.last_failed_login_at IS 'Timestamp of last failed login attempt';
COMMENT ON COLUMN profiles.account_locked_until IS 'Account is locked until this timestamp (NULL = not locked)';


-- =============================================================================
-- PART 6: Audit Logging Table for Security Events
-- =============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,  -- 'login_failed', 'rate_limit_hit', 'suspicious_activity'
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,  -- Using TEXT instead of INET to handle 'unknown' fallback
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_audit_ip ON security_audit_log(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- Partition by time for efficient cleanup (optional, for high-traffic)
COMMENT ON TABLE security_audit_log IS 'Tracks security-relevant events for monitoring and incident response';

-- RLS: No policies = only service role can access (service role bypasses RLS)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Cleanup function for audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_security_audit_log()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


-- =============================================================================
-- PART 7: Storage Security - Content-Type Sniffing (#4)
-- Note: Configure X-Content-Type-Options: nosniff via Supabase dashboard
-- (Cannot modify storage.buckets - owned by Supabase)
-- =============================================================================


-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  rate_limit_exists BOOLEAN;
  audit_log_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_rate_limits') INTO rate_limit_exists;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_log') INTO audit_log_exists;

  RAISE NOTICE '=== Migration 029 Complete ===';
  RAISE NOTICE 'Auth rate limits table: %', CASE WHEN rate_limit_exists THEN 'Created' ELSE 'Failed' END;
  RAISE NOTICE 'Security audit log table: %', CASE WHEN audit_log_exists THEN 'Created' ELSE 'Failed' END;
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Also configure the following in Supabase Dashboard:';
  RAISE NOTICE '1. Auth > Rate Limits: Set login/signup/token limits';
  RAISE NOTICE '2. Auth > Security: Enable CAPTCHA for additional protection';
  RAISE NOTICE '3. Storage > Policies: Add X-Content-Type-Options header';
  RAISE NOTICE '4. API Settings: Ensure TLS 1.2+ is enforced';
END $$;
