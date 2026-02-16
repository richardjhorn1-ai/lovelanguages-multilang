-- Migration 041: Add unique constraint on topic_id per language pair
-- Prevents duplicate hreflang entries by ensuring only one canonical article
-- per (topic_id, native_lang, target_lang) combination.
--
-- NOTE: 443 existing topic_id duplicates must be resolved before this can be applied.
-- Check current state: SELECT topic_id, native_lang, target_lang, COUNT(*)
--   FROM blog_articles WHERE published AND is_canonical AND topic_id IS NOT NULL
--   GROUP BY topic_id, native_lang, target_lang HAVING COUNT(*) > 1;
-- Once duplicates are resolved, apply this migration.
--
-- Rollback: DROP INDEX IF EXISTS idx_blog_topic_unique_canonical;

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_topic_unique_canonical
  ON blog_articles(topic_id, native_lang, target_lang)
  WHERE published = true AND is_canonical = true AND topic_id IS NOT NULL;
