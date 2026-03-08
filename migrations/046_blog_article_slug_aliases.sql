-- Migration 046: Add canonical article slug aliases
--
-- Purpose:
-- - preserve historical article URLs after native-slug renames
-- - move article-level alias resolution out of Vercel static redirects
-- - allow runtime canonical redirects without hub/article ambiguity

CREATE TABLE IF NOT EXISTS blog_article_slug_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
  native_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  alias_slug TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blog_article_slug_aliases_lowercase CHECK (alias_slug = lower(alias_slug))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_article_slug_alias_unique
  ON blog_article_slug_aliases(native_lang, target_lang, alias_slug);

CREATE INDEX IF NOT EXISTS idx_blog_article_slug_alias_article
  ON blog_article_slug_aliases(article_id);

CREATE INDEX IF NOT EXISTS idx_blog_article_slug_alias_lookup
  ON blog_article_slug_aliases(native_lang, target_lang, alias_slug, article_id);

ALTER TABLE blog_article_slug_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read article slug aliases" ON blog_article_slug_aliases
  FOR SELECT USING (true);

CREATE POLICY "Service role full access to article slug aliases" ON blog_article_slug_aliases
  FOR ALL USING (auth.role() = 'service_role');
