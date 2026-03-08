# URL Slug Standard Operating Procedure

> **Purpose:** Keep article URLs canonical, localized, and migration-safe.

## Canonical Contract

Public article URLs live under:

```text
/learn/{native_lang}/{target_lang}/{slug}/
```

- `slug` must be lowercase ASCII only: `[a-z0-9-]+`
- `native_lang = en` keeps English slugs
- `native_lang != en` uses localized/transliterated ASCII slugs in the reader's native language
- Legacy article slugs are aliases, not canonicals

## Source Of Truth

- Canonical slug: `blog_articles.slug`
- Legacy aliases: `blog_article_slug_aliases`
- Public lists, hubs, search, sitemap, hreflang, and internal links must use canonical rows only
- Article-level slug redirects do **not** belong in `vercel.json`

## Redirect Policy

- Canonical article URL returns `200`
- Legacy article alias returns one `301` to canonical article URL
- Unknown article slug returns `404`
- Retired non-article pages may still redirect to a hub/category page, but that is a separate system from article aliases

## Creating Or Updating Slugs

1. Generate slugs with the shared helper in [native-slugs.mjs](/Users/richardhorn/Trying Claude Code/L.L.3.0/lovelanguages-multilang/blog/src/lib/native-slugs.mjs)
2. Use `slugifyLocalizedTitle()` for new slugs
3. If a slug changes, add the previous slug as an alias row
4. Never make up ad hoc transliterations in scripts or prompts

## Migration Workflow

1. Update canonical slugs in `blog_articles`
2. Backfill alias rows:

```bash
cd blog
node scripts/backfill-slug-aliases.mjs --dry-run
node scripts/backfill-slug-aliases.mjs
```

3. Rewrite stored internal article links:

```bash
cd blog
node scripts/fix-broken-internal-links.mjs --dry-run
node scripts/fix-broken-internal-links.mjs
```

4. Rebuild the URL inventory and redirect audit inputs:

```bash
cd ..
node scripts/seo/generate-url-inventory.mjs
cd blog
node scripts/test-redirects.cjs --sample 50
```

## Do Not Do This

- Do not add article-to-article slug redirects in `vercel.json`
- Do not assume non-English pages should keep English slugs
- Do not ship content HTML with `/learn/...` links that point at aliases
- Do not rely on hreflang deduplication to hide topic collisions

## Release Checklist

- [ ] Canonical article URLs return direct `200`
- [ ] Alias article URLs return one `301` to canonical
- [ ] No article alias appears in sitemap XML
- [ ] Canonical, hreflang, `og:url`, `twitter:url`, and JSON-LD URL agree
- [ ] Stored `content_html` contains canonical article links only
- [ ] `llms.txt` and `llms-full.txt` describe the live slug policy accurately

## Emergency Fix

If a live article URL is wrong:

1. Fix the canonical slug in `blog_articles`
2. Add or repair the alias row in `blog_article_slug_aliases`
3. Run the internal-link rewrite script if stored content links are affected
4. Re-run the redirect audit against preview or production

Do not patch the issue by adding a one-off article redirect to `vercel.json`.
