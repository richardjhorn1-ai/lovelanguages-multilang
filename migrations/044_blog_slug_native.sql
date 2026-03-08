-- Add native-language slug column for SEO
-- Articles are looked up by either slug (English) or slug_native (native language)
-- English slug URLs 301-redirect to the native slug URL

ALTER TABLE blog_articles
ADD COLUMN IF NOT EXISTS slug_native TEXT DEFAULT NULL;

-- Index for fast lookups by native slug
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug_native
ON blog_articles(slug_native)
WHERE slug_native IS NOT NULL;

-- Uniqueness: no two articles in the same language pair can share a native slug
ALTER TABLE blog_articles
ADD CONSTRAINT uq_blog_articles_native_slug
UNIQUE (native_lang, target_lang, slug_native);
