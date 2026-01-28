-- Migration: Security Fixes
-- Date: 2026-01-28
-- Fixes Supabase linter errors for RLS

-- =============================================================================
-- 1. subscription_plans - Enable RLS with public read access
-- =============================================================================
-- Issue: Table is public but has no RLS, anyone can read/write
-- Fix: Enable RLS, allow public reads, restrict writes to service role only

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read subscription plans (they're public pricing info)
CREATE POLICY "Public can read subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (handled via service key in API)
-- No explicit policy needed - RLS blocks by default, service role bypasses RLS


-- =============================================================================
-- 2. article_generations - Enable RLS (admin-only table for blog generation)
-- =============================================================================
-- Issue: Table is public but has no RLS
-- Note: This is admin-only, accessed via service key for blog generation
-- Fix: Enable RLS, allow public reads (blog metadata), writes via service role only

ALTER TABLE public.article_generations ENABLE ROW LEVEL SECURITY;

-- Allow public to read article generation metadata (it's blog content tracking)
CREATE POLICY "Public can read article generations"
  ON public.article_generations
  FOR SELECT
  USING (true);

-- Writes are done via service role (which bypasses RLS), no explicit policy needed


-- =============================================================================
-- 3. Fix function search_path (optional but good practice)
-- =============================================================================
-- Issue: Function has mutable search_path, potential for injection
-- Fix: Set explicit search_path

ALTER FUNCTION public.check_active_in_languages SET search_path = public;


-- =============================================================================
-- Notes on "Service role" warnings (NO ACTION NEEDED)
-- =============================================================================
-- The linter warns about policies like "Service can manage all bug reports"
-- with USING (true). These are INTENTIONAL - the service role (used by our
-- backend API) needs full access to these tables. The service role bypasses
-- RLS anyway, so these policies are effectively documentation.
--
-- Tables with intentional service-role policies (no changes needed):
-- - bug_reports
-- - gift_words
-- - invite_tokens
-- - messages
-- - notifications
-- - progress_summaries
-- - subscription_events
-- - usage_tracking


-- =============================================================================
-- Reminder: Enable Leaked Password Protection in Dashboard
-- =============================================================================
-- Go to: Supabase Dashboard → Authentication → Settings
-- Enable: "Leaked password protection"
-- This checks passwords against HaveIBeenPwned database
