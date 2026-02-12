import { defineMiddleware } from 'astro:middleware';

// Languages that had legacy 2-segment URLs: /learn/{lang}/{slug}/
// Before multi-native-language support, these were the only target languages
const LEGACY_TARGET_LANGS = new Set(['ru','uk','tr','pl','cs','da','el','hu','nl','no','ro','sv']);

// All valid language codes — used to distinguish hub pages (/learn/pl/cs/) from article URLs
const ALL_LANG_CODES = new Set(['en','es','fr','de','it','pt','pl','nl','sv','no','da','cs','ru','uk','el','hu','tr','ro']);

// Known sub-routes under /learn/[nativeLang]/ that are NOT article slugs
const KNOWN_SUBROUTES = new Set(['couples-language-learning', 'topics']);

/**
 * Middleware:
 * 1. Redirect legacy 2-segment article URLs to 3-segment format
 * 2. Add llms.txt discovery headers to all responses
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Legacy 2-segment redirect: /learn/{lang}/{slug}/ → /learn/en/{lang}/{slug}/
  // Must NOT match: hub pages (/learn/pl/cs/), known sub-routes (/learn/pl/couples-language-learning/)
  const pathname = context.url.pathname;
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
