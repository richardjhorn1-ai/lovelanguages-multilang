-- Migration: Article generation tracking table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS article_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  topic TEXT NOT NULL,
  category TEXT,
  difficulty TEXT,
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  word_count INTEGER,
  has_image BOOLEAN DEFAULT false,

  -- Constraints
  CONSTRAINT article_generations_slug_unique UNIQUE (slug)
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_article_generations_user ON article_generations(generated_by);

-- Index for recent generations
CREATE INDEX IF NOT EXISTS idx_article_generations_date ON article_generations(generated_at DESC);

-- RLS: Disabled for this table
-- This table is accessed exclusively via service key (CLI and admin API)
-- which bypasses RLS entirely. No client-side access is intended.
-- If future client access is needed, enable RLS and add appropriate policies.

-- Comment for documentation
COMMENT ON TABLE article_generations IS 'Tracks AI-generated blog articles. Admin-only, accessed via service key.';
