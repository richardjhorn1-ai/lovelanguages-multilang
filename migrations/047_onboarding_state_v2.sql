-- Migration 047: Onboarding V2 state model, support view, and legacy backfill

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_completion_reason TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_flow_key TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step_key TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_last_step_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_plan_intent TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_checkout_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_error_code TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_error_context JSONB,
  ADD COLUMN IF NOT EXISTS onboarding_version INTEGER NOT NULL DEFAULT 2;

COMMENT ON COLUMN profiles.onboarding_status IS 'Operational onboarding state: not_started, in_progress, awaiting_plan, pending_checkout, completed, abandoned, errored.';
COMMENT ON COLUMN profiles.onboarding_completion_reason IS 'Why onboarding completed: free, paid, inherited, promo, beta, legacy.';
COMMENT ON COLUMN profiles.onboarding_flow_key IS 'Logical onboarding flow: student_full, tutor_full, student_invited, tutor_invited.';
COMMENT ON COLUMN profiles.onboarding_step_key IS 'Current logical step key within the active onboarding flow.';
COMMENT ON COLUMN profiles.onboarding_started_at IS 'Timestamp when the user first entered onboarding V2.';
COMMENT ON COLUMN profiles.onboarding_last_step_at IS 'Timestamp of the most recent onboarding step transition or save.';
COMMENT ON COLUMN profiles.onboarding_plan_intent IS 'Current plan intent: free or paid.';
COMMENT ON COLUMN profiles.onboarding_checkout_session_id IS 'Stripe checkout session id for pending paid onboarding.';
COMMENT ON COLUMN profiles.onboarding_checkout_started_at IS 'Timestamp when paid checkout was started from onboarding.';
COMMENT ON COLUMN profiles.onboarding_error_code IS 'Latest recoverable onboarding error code.';
COMMENT ON COLUMN profiles.onboarding_error_context IS 'Structured context for the latest onboarding error.';
COMMENT ON COLUMN profiles.onboarding_version IS 'Onboarding contract version for forward-compatible rollouts.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_onboarding_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_onboarding_status_check
      CHECK (onboarding_status IN ('not_started', 'in_progress', 'awaiting_plan', 'pending_checkout', 'completed', 'abandoned', 'errored'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_onboarding_completion_reason_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_onboarding_completion_reason_check
      CHECK (
        onboarding_completion_reason IS NULL OR
        onboarding_completion_reason IN ('free', 'paid', 'inherited', 'promo', 'beta', 'legacy')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_onboarding_plan_intent_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_onboarding_plan_intent_check
      CHECK (
        onboarding_plan_intent IS NULL OR
        onboarding_plan_intent IN ('free', 'paid')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status
  ON profiles(onboarding_status);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step_key
  ON profiles(onboarding_step_key)
  WHERE onboarding_step_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_last_step
  ON profiles(onboarding_status, onboarding_last_step_at DESC);

-- Merge draft onboarding answers into canonical onboarding_data for incomplete users.
UPDATE profiles
SET onboarding_data = COALESCE(onboarding_progress->'data', '{}'::jsonb) || COALESCE(onboarding_data, '{}'::jsonb)
WHERE onboarding_completed_at IS NULL
  AND onboarding_progress IS NOT NULL
  AND jsonb_typeof(onboarding_progress->'data') = 'object';

-- Repair mirrored profile fields from canonical onboarding answers.
-- This fixes historical cases where onboarding captured the user's choices
-- in onboarding_progress/onboarding_data but never synced them back to profiles.
UPDATE profiles
SET
  role = COALESCE(NULLIF(onboarding_data->>'role', ''), role),
  native_language = COALESCE(NULLIF(onboarding_data->>'nativeLanguage', ''), native_language),
  active_language = COALESCE(NULLIF(onboarding_data->>'targetLanguage', ''), active_language),
  full_name = COALESCE(NULLIF(onboarding_data->>'userName', ''), full_name),
  partner_name = COALESCE(
    NULLIF(
      CASE
        WHEN COALESCE(NULLIF(onboarding_data->>'role', ''), role) = 'tutor'
          THEN onboarding_data->>'learnerName'
        ELSE onboarding_data->>'partnerName'
      END,
      ''
    ),
    partner_name
  ),
  languages = CASE
    WHEN NULLIF(onboarding_data->>'targetLanguage', '') IS NULL THEN languages
    WHEN languages IS NULL THEN ARRAY[onboarding_data->>'targetLanguage']
    WHEN array_position(languages, onboarding_data->>'targetLanguage') IS NULL
      THEN array_append(languages, onboarding_data->>'targetLanguage')
    ELSE languages
  END
WHERE onboarding_data IS NOT NULL
  AND jsonb_typeof(onboarding_data) = 'object';

WITH flow_backfill AS (
  SELECT
    p.id,
    COALESCE(NULLIF(p.role, ''), NULLIF(p.onboarding_progress->>'role', ''), 'student') AS role_value,
    (p.linked_user_id IS NOT NULL AND p.onboarding_completed_at IS NULL) AS is_invited,
    COALESCE((p.onboarding_progress->>'step')::INT, 1) AS step_number
  FROM profiles p
),
resolved_steps AS (
  SELECT
    fb.id,
    CASE
      WHEN fb.is_invited AND fb.role_value = 'tutor' THEN 'tutor_invited'
      WHEN fb.is_invited THEN 'student_invited'
      WHEN fb.role_value = 'tutor' THEN 'tutor_full'
      ELSE 'student_full'
    END AS flow_key,
    CASE
      WHEN fb.is_invited AND fb.role_value = 'tutor' THEN
        CASE fb.step_number
          WHEN 1 THEN 'names'
          WHEN 2 THEN 'teaching_style'
          WHEN 3 THEN 'preview'
          WHEN 4 THEN 'plan'
          WHEN 5 THEN 'start'
          ELSE 'names'
        END
      WHEN fb.is_invited THEN
        CASE fb.step_number
          WHEN 1 THEN 'names'
          WHEN 2 THEN 'learn_hello'
          WHEN 3 THEN 'learn_love'
          WHEN 4 THEN 'celebration'
          WHEN 5 THEN 'plan'
          WHEN 6 THEN 'start'
          ELSE 'names'
        END
      WHEN fb.role_value = 'tutor' THEN
        CASE fb.step_number
          WHEN 1 THEN 'role'
          WHEN 2 THEN 'native_language'
          WHEN 3 THEN 'target_language'
          WHEN 4 THEN 'names'
          WHEN 5 THEN 'teaching_style'
          WHEN 6 THEN 'preview'
          WHEN 7 THEN 'invite_partner'
          WHEN 8 THEN 'personalization'
          WHEN 9 THEN 'plan'
          WHEN 10 THEN 'start'
          ELSE 'role'
        END
      ELSE
        CASE fb.step_number
          WHEN 1 THEN 'role'
          WHEN 2 THEN 'native_language'
          WHEN 3 THEN 'target_language'
          WHEN 4 THEN 'names'
          WHEN 5 THEN 'learn_hello'
          WHEN 6 THEN 'learn_love'
          WHEN 7 THEN 'celebration'
          WHEN 8 THEN 'invite_partner'
          WHEN 9 THEN 'theme_customization'
          WHEN 10 THEN 'personalization'
          WHEN 11 THEN 'plan'
          WHEN 12 THEN 'start'
          ELSE 'role'
        END
    END AS step_key
  FROM flow_backfill fb
)
UPDATE profiles p
SET
  onboarding_flow_key = rs.flow_key,
  onboarding_step_key = CASE
    WHEN p.onboarding_completed_at IS NOT NULL THEN 'start'
    ELSE rs.step_key
  END,
  onboarding_plan_intent = CASE
    WHEN COALESCE(p.onboarding_data->>'selectedPlan', '') = 'free' THEN 'free'
    WHEN COALESCE(p.onboarding_data->>'selectedPlan', '') IN ('standard', 'unlimited') THEN 'paid'
    WHEN COALESCE(p.onboarding_data->>'selectedPriceId', '') <> '' THEN 'paid'
    ELSE NULL
  END,
  onboarding_status = CASE
    WHEN p.onboarding_completed_at IS NOT NULL THEN 'completed'
    WHEN p.onboarding_progress IS NULL THEN 'not_started'
    WHEN rs.step_key IN ('plan', 'start') THEN 'awaiting_plan'
    ELSE 'in_progress'
  END,
  onboarding_completion_reason = CASE
    WHEN p.onboarding_completed_at IS NULL THEN NULL
    WHEN p.subscription_granted_by IS NOT NULL THEN 'inherited'
    WHEN p.subscription_status = 'active' AND COALESCE(p.subscription_source, 'stripe') IN ('stripe', 'app_store') THEN 'paid'
    WHEN p.free_tier_chosen_at IS NOT NULL THEN 'free'
    WHEN p.promo_expires_at IS NOT NULL AND p.promo_expires_at > NOW() THEN 'promo'
    ELSE 'legacy'
  END,
  onboarding_started_at = COALESCE(p.onboarding_started_at, p.created_at),
  onboarding_last_step_at = COALESCE(p.onboarding_last_step_at, p.onboarding_completed_at, p.created_at),
  onboarding_version = 2
FROM resolved_steps rs
WHERE p.id = rs.id;

CREATE OR REPLACE VIEW onboarding_support_view AS
WITH invite_stats AS (
  SELECT
    inviter_id,
    COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at > NOW()) AS invite_token_count,
    MAX(created_at) FILTER (WHERE used_at IS NULL AND expires_at > NOW()) AS latest_invite_created_at
  FROM invite_tokens
  GROUP BY inviter_id
)
SELECT
  p.id AS user_id,
  p.email,
  p.role,
  p.linked_user_id,
  p.onboarding_status,
  p.onboarding_completion_reason,
  p.onboarding_flow_key,
  p.onboarding_step_key,
  p.onboarding_started_at,
  p.onboarding_last_step_at,
  p.onboarding_completed_at,
  p.onboarding_plan_intent,
  p.subscription_plan,
  p.subscription_status,
  p.subscription_period,
  p.subscription_source,
  p.free_tier_chosen_at,
  p.trial_expires_at,
  p.promo_expires_at,
  p.subscription_granted_by,
  p.native_language,
  p.active_language,
  COALESCE(i.invite_token_count, 0) AS invite_token_count,
  i.latest_invite_created_at,
  p.onboarding_error_code,
  p.onboarding_error_context,
  (
    p.subscription_status = 'active'
    OR p.subscription_granted_by IS NOT NULL
    OR (p.promo_expires_at IS NOT NULL AND p.promo_expires_at > NOW())
    OR (
      p.free_tier_chosen_at IS NOT NULL
      AND (p.trial_expires_at IS NULL OR p.trial_expires_at > NOW())
    )
  ) AS has_app_access
FROM profiles p
LEFT JOIN invite_stats i
  ON i.inviter_id = p.id;
