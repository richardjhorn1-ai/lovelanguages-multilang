-- PHASE 1: Create blog_articles table
-- Run this in Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  native_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,

  -- Frontmatter fields
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  read_time INTEGER,
  image TEXT,
  tags TEXT[],

  -- Content
  content TEXT NOT NULL,
  content_html TEXT,

  -- Metadata
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published BOOLEAN DEFAULT true,

  UNIQUE(native_lang, target_lang, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_native_lang ON blog_articles(native_lang);
CREATE INDEX IF NOT EXISTS idx_blog_target_lang ON blog_articles(target_lang);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_lang_pair ON blog_articles(native_lang, target_lang);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_articles(published);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_blog_articles_updated_at ON blog_articles;
CREATE TRIGGER update_blog_articles_updated_at
    BEFORE UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to published articles
CREATE POLICY "Public can read published articles" ON blog_articles
  FOR SELECT USING (published = true);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON blog_articles
  FOR ALL USING (auth.role() = 'service_role');
