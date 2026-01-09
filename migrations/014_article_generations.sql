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

-- RLS policies
ALTER TABLE article_generations ENABLE ROW LEVEL SECURITY;

-- Admins can read all generations
CREATE POLICY "Admins can view all article generations"
  ON article_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert new generations
CREATE POLICY "Admins can create article generations"
  ON article_generations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update generations (e.g., mark as published)
CREATE POLICY "Admins can update article generations"
  ON article_generations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Comment for documentation
COMMENT ON TABLE article_generations IS 'Tracks AI-generated blog articles for SEO metrics and audit';
