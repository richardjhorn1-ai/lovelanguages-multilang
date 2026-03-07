-- Migration: 044_relationship_sessions_and_private_account_state.sql
-- Purpose:
-- 1) Add relationship session model for link/unlink/relink lifecycle.
-- 2) Add server-private account state storage for provider identifiers/tokens.
-- 3) Add relationship session linkage to collaboration artifacts.

-- ============================================
-- RELATIONSHIP SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS relationship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  billing_owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_relationship_sessions_user_a ON relationship_sessions(user_a_id);
CREATE INDEX IF NOT EXISTS idx_relationship_sessions_user_b ON relationship_sessions(user_b_id);
CREATE INDEX IF NOT EXISTS idx_relationship_sessions_status ON relationship_sessions(status);

-- One active relationship per pair (regardless of user ordering)
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationship_sessions_unique_active_pair
ON relationship_sessions (
  LEAST(user_a_id, user_b_id),
  GREATEST(user_a_id, user_b_id)
)
WHERE status = 'active';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_active_relationship_session
ON profiles(active_relationship_session_id);

-- Backfill active sessions for already-linked reciprocal pairs.
WITH existing_pairs AS (
  SELECT
    LEAST(p1.id, p2.id) AS user_a_id,
    GREATEST(p1.id, p2.id) AS user_b_id,
    CASE
      WHEN p1.subscription_granted_by = p2.id THEN p2.id
      WHEN p2.subscription_granted_by = p1.id THEN p1.id
      ELSE NULL
    END AS billing_owner_user_id
  FROM profiles p1
  JOIN profiles p2 ON p2.id = p1.linked_user_id
  WHERE p2.linked_user_id = p1.id
    AND p1.id < p2.id
),
inserted_sessions AS (
  INSERT INTO relationship_sessions (user_a_id, user_b_id, billing_owner_user_id, status, started_at)
  SELECT
    ep.user_a_id,
    ep.user_b_id,
    ep.billing_owner_user_id,
    'active',
    NOW()
  FROM existing_pairs ep
  ON CONFLICT DO NOTHING
  RETURNING id, user_a_id, user_b_id
)
UPDATE profiles p
SET active_relationship_session_id = rs.id
FROM relationship_sessions rs
WHERE p.active_relationship_session_id IS NULL
  AND rs.status = 'active'
  AND p.id IN (rs.user_a_id, rs.user_b_id);

-- ============================================
-- PRIVATE ACCOUNT STATE (SERVER-PRIVATE)
-- ============================================

CREATE TABLE IF NOT EXISTS profile_private (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  revenuecat_customer_id TEXT,
  apple_refresh_token TEXT,
  subscription_source TEXT CHECK (subscription_source IN ('stripe', 'app_store', 'promo', 'trial', 'gift', 'none')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profile_private ENABLE ROW LEVEL SECURITY;

-- Intentionally no permissive client policies: service-role only by default.
DROP POLICY IF EXISTS "No client access to profile_private" ON profile_private;
CREATE POLICY "No client access to profile_private" ON profile_private
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE profile_private IS 'Server-private account/provider state. Never query from client-side partner-visible surfaces.';

-- Backfill provider fields into profile_private.
INSERT INTO profile_private (user_id, stripe_customer_id, revenuecat_customer_id, subscription_source)
SELECT
  p.id,
  p.stripe_customer_id,
  p.revenuecat_customer_id,
  COALESCE(p.subscription_source, 'none')
FROM profiles p
ON CONFLICT (user_id) DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  revenuecat_customer_id = EXCLUDED.revenuecat_customer_id,
  subscription_source = EXCLUDED.subscription_source,
  updated_at = NOW();

-- Backfill apple_refresh_token only if legacy column exists on profiles.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'apple_refresh_token'
  ) THEN
    EXECUTE $sql$
      UPDATE profile_private pp
      SET apple_refresh_token = p.apple_refresh_token,
          updated_at = NOW()
      FROM profiles p
      WHERE pp.user_id = p.id
    $sql$;
  END IF;
END $$;

-- ============================================
-- SESSION LINKING FOR COLLABORATION TABLES
-- ============================================

ALTER TABLE IF EXISTS tutor_challenges
  ADD COLUMN IF NOT EXISTS relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS word_requests
  ADD COLUMN IF NOT EXISTS relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS gift_words
  ADD COLUMN IF NOT EXISTS relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS challenge_results
  ADD COLUMN IF NOT EXISTS relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS love_notes
  ADD COLUMN IF NOT EXISTS relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS activity_feed
  ADD COLUMN IF NOT EXISTS relationship_session_id UUID REFERENCES relationship_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_challenges_relationship_session ON tutor_challenges(relationship_session_id);
CREATE INDEX IF NOT EXISTS idx_word_requests_relationship_session ON word_requests(relationship_session_id);
CREATE INDEX IF NOT EXISTS idx_gift_words_relationship_session ON gift_words(relationship_session_id);
CREATE INDEX IF NOT EXISTS idx_challenge_results_relationship_session ON challenge_results(relationship_session_id);
CREATE INDEX IF NOT EXISTS idx_love_notes_relationship_session ON love_notes(relationship_session_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_relationship_session ON activity_feed(relationship_session_id);

-- Backfill relationship session IDs on existing active collaboration rows.
UPDATE word_requests wr
SET relationship_session_id = p.active_relationship_session_id
FROM profiles p
WHERE wr.relationship_session_id IS NULL
  AND wr.tutor_id = p.id
  AND p.linked_user_id = wr.student_id
  AND p.active_relationship_session_id IS NOT NULL;

UPDATE tutor_challenges tc
SET relationship_session_id = p.active_relationship_session_id
FROM profiles p
WHERE tc.relationship_session_id IS NULL
  AND tc.tutor_id = p.id
  AND p.linked_user_id = tc.student_id
  AND p.active_relationship_session_id IS NOT NULL;

UPDATE love_notes ln
SET relationship_session_id = p.active_relationship_session_id
FROM profiles p
WHERE ln.relationship_session_id IS NULL
  AND ln.sender_id = p.id
  AND p.linked_user_id = ln.recipient_id
  AND p.active_relationship_session_id IS NOT NULL;

UPDATE gift_words gw
SET relationship_session_id = wr.relationship_session_id
FROM word_requests wr
WHERE gw.relationship_session_id IS NULL
  AND gw.word_request_id = wr.id
  AND wr.relationship_session_id IS NOT NULL;

UPDATE challenge_results cr
SET relationship_session_id = tc.relationship_session_id
FROM tutor_challenges tc
WHERE cr.relationship_session_id IS NULL
  AND cr.challenge_id = tc.id
  AND tc.relationship_session_id IS NOT NULL;

UPDATE activity_feed af
SET relationship_session_id = p.active_relationship_session_id
FROM profiles p
WHERE af.relationship_session_id IS NULL
  AND af.user_id = p.id
  AND af.partner_id = p.linked_user_id
  AND p.active_relationship_session_id IS NOT NULL;
