-- Migration: 022_bug_reports.sql
-- Bug reporting system for user feedback

-- BUG REPORTS TABLE
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',  -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'open',       -- 'open', 'investigating', 'resolved', 'closed'
  page_url TEXT,                           -- Current page when report was made
  browser_info JSONB,                      -- User agent, screen size, etc.
  app_state JSONB,                         -- User role, level, etc.
  admin_notes TEXT,                        -- Internal notes for admin
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity, status);

-- ROW LEVEL SECURITY
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create bug reports
CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for admin dashboard later)
CREATE POLICY "Service can manage all bug reports" ON bug_reports
  FOR ALL USING (true) WITH CHECK (true);
