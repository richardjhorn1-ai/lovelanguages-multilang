-- Migration 040: Add topic_id and is_canonical to blog_articles
-- Enables cross-language hreflang linking and cannibalization cleanup.
--
-- topic_id format: "{target_lang}:{normalized-topic}" (e.g., "cs:pet-names")
-- is_canonical: false for duplicate articles that should redirect to the canonical version.
--
-- Rollback: UPDATE blog_articles SET topic_id = NULL, is_canonical = true;

ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS topic_id TEXT;
ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN DEFAULT true;

-- Index for hreflang lookups: find all native-lang versions of the same topic+target
CREATE INDEX IF NOT EXISTS idx_blog_topic_id ON blog_articles(topic_id);

-- Composite index for canonical article lookups (used by getAlternatesByTopicId and getCanonicalForTopic)
CREATE INDEX IF NOT EXISTS idx_blog_topic_canonical
  ON blog_articles(topic_id, target_lang, published, is_canonical)
  WHERE published = true AND is_canonical = true;
