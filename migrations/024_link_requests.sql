-- Migration: 024_link_requests.sql
-- Description: Create link_requests table for partner invite system
-- Date: January 12, 2026

-- =============================================================================
-- LINK_REQUESTS TABLE - Partner invitation requests
-- =============================================================================

CREATE TABLE IF NOT EXISTS link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_link_requests_target_email ON link_requests(target_email);
CREATE INDEX IF NOT EXISTS idx_link_requests_requester ON link_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_link_requests_status ON link_requests(status);

-- RLS Policies
ALTER TABLE link_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests they sent
CREATE POLICY "Users can view their sent requests"
  ON link_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Users can see requests sent to their email
CREATE POLICY "Users can view requests to their email"
  ON link_requests FOR SELECT
  USING (target_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON link_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update requests sent to them (accept/decline)
CREATE POLICY "Users can respond to requests"
  ON link_requests FOR UPDATE
  USING (target_email = (SELECT email FROM profiles WHERE id = auth.uid()));

COMMENT ON TABLE link_requests IS 'Partner invitation requests for linking accounts';
COMMENT ON COLUMN link_requests.target_email IS 'Email address of the person being invited';
COMMENT ON COLUMN link_requests.status IS 'Request status: pending, accepted, declined, expired';
