-- Atomic usage counter increment
-- Avoids race condition in read-then-write pattern (C3)
-- Pattern: migrations/029_security_hardening.sql, migrations/033_promo_codes.sql

-- Relies on UNIQUE(user_id, usage_type, usage_date) constraint
-- from migrations/014_subscriptions.sql line 140

CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_usage_type VARCHAR(30),
  p_amount INT DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: only accept positive amounts
  IF p_amount <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO usage_tracking (user_id, usage_type, usage_date, count)
  VALUES (p_user_id, p_usage_type, CURRENT_DATE, p_amount)
  ON CONFLICT (user_id, usage_type, usage_date)
  DO UPDATE SET count = usage_tracking.count + p_amount;
END;
$$;
