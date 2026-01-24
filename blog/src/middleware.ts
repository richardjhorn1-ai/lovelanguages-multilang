/**
 * Astro Middleware for handling legacy 2-segment URL redirects
 *
 * Handles: /learn/pl/article-slug → /learn/en/pl/article-slug
 *
 * This pattern-based redirect saves ~236 entries from vercel.json
 * Spanish/French slug mappings still need exact redirects in vercel.json
 */

import { defineMiddleware } from 'astro:middleware';

// Languages that had legacy 2-segment URLs before multi-native support
// These used to be at /learn/{lang}/slug, now at /learn/en/{lang}/slug
// Note: de, it, pt are also native languages but had early articles at /learn/{lang}/slug
const LEGACY_TARGET_LANGUAGES = new Set([
  'pl', 'ru', 'uk', 'tr', 'cs', 'da', 'el', 'hu', 'nl', 'no', 'ro', 'sv',
  'de', 'it', 'pt'  // Also had legacy 2-segment URLs
]);

// Native languages (these are valid as first segment in 3-part URLs)
const NATIVE_LANGUAGES = new Set([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'tr', 'uk'
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Only handle /learn/ paths
  if (!path.startsWith('/learn/')) {
    return next();
  }

  // Remove trailing slash for matching
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const parts = cleanPath.split('/').filter(Boolean); // ['learn', 'pl', 'slug']

  // Pattern: Legacy 2-segment URLs → 3-segment
  // /learn/pl/article-slug → /learn/en/pl/article-slug
  if (parts.length === 3 && parts[0] === 'learn') {
    const segment1 = parts[1]; // potential target language
    const slug = parts[2];     // article slug

    // Check if this is a legacy URL pattern:
    // - First segment is a target language (not a native language hub)
    // - Has a slug that looks like an article (contains hyphens, not just a lang code)
    if (
      LEGACY_TARGET_LANGUAGES.has(segment1) &&
      slug.includes('-') &&
      !NATIVE_LANGUAGES.has(slug) // Not a nested language path
    ) {
      // Redirect to new 3-segment structure with 'en' as native language
      const newPath = `/learn/en/${segment1}/${slug}/`;
      return context.redirect(newPath, 301);
    }
  }

  return next();
});
