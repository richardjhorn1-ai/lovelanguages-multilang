# URL Slug Standard Operating Procedure

> **Purpose:** Prevent broken URLs and 404 errors when managing blog article slugs.

## The Golden Rule

**All article filenames MUST use English slugs, regardless of native language.**

```
✅ CORRECT: blog/src/content/articles/es/pl/polish-pet-names-terms-of-endearment.mdx
❌ WRONG:   blog/src/content/articles/es/pl/apodos-cariñosos-polacos.mdx
```

The filename becomes the URL slug. Changing a filename = breaking all existing links.

---

## Before Renaming Any File

### 1. NEVER rename article files without creating redirects

If you must rename a file:

```bash
# 1. First, add redirect to vercel.json
# 2. Then rename the file
# 3. Deploy and verify
```

### 2. Use the redirect scripts

```bash
cd blog

# Generate all needed redirects from git history
node scripts/generate-redirects.cjs

# Update vercel.json with redirects
node scripts/update-vercel-redirects.cjs

# Test redirects against live site
node scripts/test-redirects.cjs --sample 50
```

---

## When Creating New Articles

### Filename Pattern

```
{target-language}-{topic-in-english}.mdx
```

Examples:
- `polish-pet-names-terms-of-endearment.mdx`
- `how-to-say-i-love-you-in-polish.mdx`
- `polish-essential-phrases-for-couples.mdx`
- `is-polish-hard-to-learn.mdx`
- `100-common-polish-words.mdx`

### Directory Structure

```
blog/src/content/articles/
├── {nativeLanguage}/           # 2-letter code (en, es, fr, de, etc.)
│   └── {targetLanguage}/       # 2-letter code (pl, it, sv, etc.)
│       └── {english-slug}.mdx  # ALWAYS English slug
```

### Title & Content Language

- **Filename:** Always English
- **Title:** In native language (es articles have Spanish titles)
- **Content:** In native language
- **Frontmatter:** language codes are 2-letter ISO codes

---

## Redirect Management

### When Redirects Are Needed

1. **File renamed** - Old slug → New slug
2. **File moved** - Old path → New path
3. **URL structure changed** - e.g., `/learn/pl/article` → `/learn/en/pl/article`

### Adding Manual Redirects

Edit `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/learn/es/sv/frases-esenciales-sueco-para-parejas",
      "destination": "/learn/es/sv/swedish-essential-phrases-for-couples/",
      "permanent": true
    }
  ]
}
```

**Always include both with and without trailing slash:**

```json
{
  "source": "/old-path",
  "destination": "/new-path/",
  "permanent": true
},
{
  "source": "/old-path/",
  "destination": "/new-path/",
  "permanent": true
}
```

### Vercel Limits

| Plan | Max Redirects |
|------|---------------|
| Hobby | 1,024 |
| Pro | 4,096 |

If you exceed limits, consider middleware-based redirects.

---

## Registry Maintenance

After any file changes, regenerate the registry:

```bash
cd blog
node scripts/update-registry.cjs
```

This updates `src/data/article-registry.json` which is used for sitemaps and internal linking.

---

## Checklist for Article Changes

- [ ] Filename uses English slug
- [ ] No existing file is being renamed without redirect
- [ ] Registry regenerated after changes
- [ ] Build succeeds locally: `npm run build`
- [ ] No 404s in browser console

---

## History: Why This Matters

On January 21, 2026, ~240 articles were renamed from translated slugs (Spanish/French) to English slugs. This broke hundreds of URLs that Google had indexed, causing 404 errors and lost traffic.

**Lesson learned:** URLs are permanent. Once published, they should never change without redirects.

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/generate-redirects.cjs` | Extract all renames from git history |
| `scripts/update-vercel-redirects.cjs` | Merge redirects into vercel.json |
| `scripts/test-redirects.cjs` | Test redirects against live site |
| `scripts/update-registry.cjs` | Regenerate article registry |

---

## Emergency: Broken URL Reported

1. Identify the old URL that's 404
2. Find the correct new URL
3. Add redirect to `vercel.json`
4. Deploy immediately
5. Verify the redirect works

```bash
# Quick test
curl -I "https://www.lovelanguages.io/old-url"
# Should return 301/308 redirect, not 404
```
