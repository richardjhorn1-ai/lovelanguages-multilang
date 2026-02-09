# Blog Article Management Guide

How articles are stored, served, and managed in the Love Languages blog.

## Storage

Articles live in the Supabase `blog_articles` table. There are no local MDX files — all content is in the database.

### Required Fields

| Field | Type | Notes |
|-------|------|-------|
| `slug` | text | URL-safe, unique per language pair |
| `native_lang` | text | 2-letter ISO code (e.g., `en`, `fr`) |
| `target_lang` | text | 2-letter ISO code |
| `title` | text | Article title in the native language |
| `description` | text | 1-2 sentence summary |
| `category` | text | `phrases`, `vocabulary`, `grammar`, `culture`, `situations`, `pronunciation`, `communication` |
| `content` | text | Markdown with Astro component imports |
| `content_html` | text | Pre-rendered HTML (used for display) |
| `published` | boolean | Must be `true` to appear on site |

### Optional Fields

| Field | Type | Default |
|-------|------|---------|
| `difficulty` | text | `beginner` |
| `read_time` | integer | 8 |
| `image` | text | null (falls back to emoji) |
| `tags` | text[] | `[]` |
| `date` | date | creation date |

## URL Format

**Convention:** `/learn/{native_lang}/{target_lang}/{slug}/` — always with trailing slash.

Examples:
- `/learn/en/pl/50-polish-terms-of-endearment/`
- `/learn/fr/de/german-pronunciation-guide-for-beginners/`

This is enforced by:
- `vercel.json` (`trailingSlash: true`)
- `blog/src/lib/urls.ts` helper functions
- Dynamic sitemaps

## How Articles Appear on the Site

1. **Sitemap** — `sitemap-articles.xml` dynamically queries all `published = true` articles
2. **Hub pages** — `/learn/{native}/{target}/` is SSR, queries Supabase live (cached 24h)
3. **Article pages** — `/learn/[nativeLang]/[targetLang]/[...slug].astro` renders from Supabase

## Adding Articles

### To an existing language pair

1. Insert into `blog_articles` with correct `native_lang` and `target_lang`
2. Set `published = true`
3. The article appears automatically — no code changes needed

### To a new language pair

1. Ensure both language codes are in the 18 supported languages:
   `en, es, fr, de, it, pt, pl, nl, ro, ru, tr, uk, sv, no, da, cs, el, hu`
2. Insert articles as above
3. Hub page `/learn/{native}/{target}/` auto-generates via SSR
4. Sitemap picks up articles automatically

## Images

- Place in `blog/public/blog/` (e.g., `blog/public/blog/topics/pl-pet-names.jpg`)
- Reference by path: `/blog/topics/pl-pet-names.jpg`
- If no image is set, the article shows an emoji fallback based on category

## Renaming a Slug

If you need to rename a slug (e.g., fix a typo):

1. Update the `slug` field in Supabase
2. Add a redirect in `vercel.json`:
   ```json
   {
     "source": "/learn/{native}/{target}/{old-slug}/",
     "destination": "/learn/{native}/{target}/{new-slug}/",
     "permanent": true
   }
   ```
3. The old URL will 301-redirect to the new one

## Deleting Articles

1. Either set `published = false` or delete the row
2. If Google has indexed the URL, add a redirect to the best replacement article in `vercel.json`
3. Log deletions in `blog/scripts/data/deletion-log.json` for tracking

## Quality Checklist

Before publishing:
- [ ] `content_html` is populated (not just raw markdown)
- [ ] Title is in the native language, not English (unless native_lang is `en`)
- [ ] Description is 1-2 sentences
- [ ] No leftover `import` statements in `content_html`
- [ ] Minimum ~500 words of actual content
- [ ] No empty sections or placeholder text
- [ ] Category is one of the 7 valid values
- [ ] Slug is URL-safe (lowercase, hyphens, no special characters)

## Supported Languages

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| fr | French |
| de | German |
| it | Italian |
| pt | Portuguese |
| pl | Polish |
| nl | Dutch |
| sv | Swedish |
| no | Norwegian |
| da | Danish |
| cs | Czech |
| ru | Russian |
| uk | Ukrainian |
| el | Greek |
| hu | Hungarian |
| tr | Turkish |
| ro | Romanian |
