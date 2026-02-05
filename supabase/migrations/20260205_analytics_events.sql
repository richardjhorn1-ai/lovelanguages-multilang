-- Analytics Events Table
-- Stores per-user event tracking for journey analysis

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id text,
  event_name text NOT NULL,
  event_params jsonb DEFAULT '{}',
  page_path text,
  referrer text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (including anonymous users via API)
DROP POLICY IF EXISTS "Allow insert for all" ON public.analytics_events;
CREATE POLICY "Allow insert for all" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Policy: Only service role can select (for admin queries)
DROP POLICY IF EXISTS "Service role can read" ON public.analytics_events;
CREATE POLICY "Service role can read" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

-- Grant permissions
GRANT INSERT ON public.analytics_events TO anon;
GRANT INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

COMMENT ON TABLE public.analytics_events IS 'User journey tracking events for analytics';
