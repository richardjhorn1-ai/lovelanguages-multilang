# URL Slug Standard Operating Procedure

> **Purpose:** Prevent broken URLs and 404 errors when managing blog article slugs.

## The Golden Rule

**Articles have TWO slugs:**
- **`slug`** — English slug (immutable identifier, used for DB lookups)
- **`slug_native`** — Native-language slug (used in URLs for SEO)

URLs use the **native slug** when available, falling back to the English slug.

```
URL:      /learn/cs/de/nemecka-gramatika-pro-zacatecniky/   ← native slug
DB slug:  german-grammar-basics-for-beginners                ← English slug (never changes)
```

If a user visits the English slug URL, the server 301-redirects to the native slug URL.

---

## How Slug Lookup Works

1. User visits `/learn/{native}/{target}/{some-slug}/`
2. `getArticle()` queries: `slug_native = some-slug OR slug = some-slug`
3. If found via English slug but article has a native slug → **301 redirect** to native URL
4. If found via native slug → serve directly

**Uniqueness:** Both `(native_lang, target_lang, slug)` and `(native_lang, target_lang, slug_native)` have UNIQUE constraints.

---

## When Creating New Articles

### In Supabase

- **`slug`** (required): English slug — descriptive, lowercase, hyphenated
- **`slug_native`** (optional): Native-language slug — same format but in the article's native language
- **`native_lang`**: 2-letter ISO code of the article's UI language
- **`target_lang`**: 2-letter ISO code of the language being taught

### Slug Format Rules

- Lowercase, ASCII-safe (no accents — use transliteration: `ä→a`, `ś→s`, `ü→u`)
- Hyphens as separators, no trailing hyphens
- No special characters except hyphens
- Unique within its `(native_lang, target_lang)` pair

---

## Redirect Management

### Built-in Redirects (No Config Needed)

English slug → native slug redirects are handled automatically by `[...slug].astro`. No vercel.json entries needed.

### When Manual Redirects Are Needed

Only when:
1. An English slug is **renamed** (this should be rare)
2. URL structure changes (e.g., path reorganization)

### Adding Manual Redirects

Edit `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/learn/es/sv/old-slug",
      "destination": "/learn/es/sv/new-slug/",
      "permanent": true
    }
  ]
}
```

---

## Checklist for Article Changes

- [ ] `slug` is English, lowercase, hyphenated
- [ ] `slug_native` (if set) is transliterated to ASCII, lowercase, hyphenated
- [ ] `slug_native` is unique within its `(native_lang, target_lang)` pair
- [ ] Build succeeds locally
- [ ] No 404s — test both English and native slug URLs

---

## History

- **Jan 2026:** ~240 articles renamed from translated slugs to English — broke URLs, lost traffic
- **Mar 2026:** Native slug system introduced — `slug_native` column added, articles served under native URLs with automatic English→native 301 redirects. English slugs preserved as stable identifiers.

---

## Emergency: Broken URL Reported

1. Identify the old URL that's 404
2. Check if it's an English slug that should redirect → verify `slug_native` is set
3. If genuinely missing, add redirect to `vercel.json`
4. Deploy immediately

```bash
# Quick test
curl -I "https://www.lovelanguages.io/learn/cs/de/german-grammar-basics-for-beginners/"
# Should return 301 redirect to native slug URL
```
