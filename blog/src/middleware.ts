import { defineMiddleware } from 'astro:middleware';
import legacyRedirects from './data/legacy-redirects.json';

// Languages that had legacy 2-segment URLs: /learn/{lang}/{slug}/
// Before multi-native-language support, these were the only target languages
const LEGACY_TARGET_LANGS = new Set(['ru','uk','tr','pl','cs','da','el','hu','nl','no','ro','sv']);

// All valid language codes — used to distinguish hub pages (/learn/pl/cs/) from article URLs
const ALL_LANG_CODES = new Set(['en','es','fr','de','it','pt','pl','nl','sv','no','da','cs','ru','uk','el','hu','tr','ro']);

// Known sub-routes under /learn/[nativeLang]/ that are NOT article slugs
const KNOWN_SUBROUTES = new Set(['couples-language-learning', 'topics']);

// Legacy slug redirect map: old MDX-era slugs → current Supabase slugs
// 366 URLs that changed when content migrated from MDX to Supabase
const LEGACY_SLUG_MAP = new Map<string, string>(
  Object.entries(legacyRedirects as Record<string, string>)
);

/**
 * Middleware:
 * 1. Redirect legacy slug URLs (MDX-era → Supabase) via 301
 * 2. Redirect legacy 2-segment article URLs to 3-segment format
 * 3. Add llms.txt discovery headers to all responses
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Strip trailing slash for lookup (map keys have no trailing slash)
  const lookupPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // 1. Legacy slug redirects: old MDX slugs → new Supabase slugs
  const newPath = LEGACY_SLUG_MAP.get(lookupPath);
  if (newPath) {
    return context.redirect(`${newPath}/`, 301);
  }

  // 2. Legacy 2-segment redirect: /learn/{lang}/{slug}/ → /learn/en/{lang}/{slug}/
  // Must NOT match: hub pages (/learn/pl/cs/), known sub-routes (/learn/pl/couples-language-learning/)
  const match = pathname.match(/^\/learn\/([a-z]{2})\/([^/]+)\/?$/);
  if (match) {
    const [, lang, slug] = match;
    if (LEGACY_TARGET_LANGS.has(lang) && !ALL_LANG_CODES.has(slug) && !KNOWN_SUBROUTES.has(slug)) {
      return context.redirect(`/learn/en/${lang}/${slug}/`, 301);
    }
  }

  const response = await next();

  // Add llms.txt headers for AI agent discovery
  response.headers.set(
    'Link',
    '</llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"'
  );
  response.headers.set('X-Llms-Txt', '/llms.txt');

  return response;
});
