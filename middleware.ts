import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase-middleware';
import legacyRedirects from './data/legacy-redirects.json';

// Languages that had legacy 2-segment URLs: /learn/{lang}/{slug}/
const LEGACY_TARGET_LANGS = new Set(['ru','uk','tr','pl','cs','da','el','hu','nl','no','ro','sv']);

// All valid language codes — used to distinguish hub pages from article URLs
const ALL_LANG_CODES = new Set(['en','es','fr','de','it','pt','pl','nl','sv','no','da','cs','ru','uk','el','hu','tr','ro']);

// Known sub-routes under /learn/[nativeLang]/ that are NOT article slugs
const KNOWN_SUBROUTES = new Set(['couples-language-learning', 'topics']);

// Legacy slug redirect map: old MDX-era slugs → current Supabase slugs (366 entries)
const LEGACY_SLUG_MAP = new Map<string, string>(
  Object.entries(legacyRedirects as Record<string, string>)
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Host-based redirect: story.lovelanguages.io → /story/
  if (request.headers.get('host')?.startsWith('story.')) {
    return NextResponse.redirect(new URL('/story/', request.url), 301);
  }

  // --- Blog redirects ---

  // 1. Legacy slug redirects: old MDX slugs → new Supabase slugs
  const lookupPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const newPath = LEGACY_SLUG_MAP.get(lookupPath);
  if (newPath) {
    return NextResponse.redirect(new URL(`${newPath}/`, request.url), 301);
  }

  // 2. Legacy 2-segment redirect: /learn/{lang}/{slug}/ → /learn/en/{lang}/{slug}/
  const match = pathname.match(/^\/learn\/([a-z]{2})\/([^/]+)\/?$/);
  if (match) {
    const [, lang, slug] = match;
    if (LEGACY_TARGET_LANGS.has(lang) && !ALL_LANG_CODES.has(slug) && !KNOWN_SUBROUTES.has(slug)) {
      return NextResponse.redirect(new URL(`/learn/en/${lang}/${slug}/`, request.url), 301);
    }
  }

  // Skip auth session refresh for public blog/content routes (saves 100-300ms per request)
  const publicPrefixes = ['/learn', '/compare', '/dictionary', '/sitemap', '/llms'];
  const isPublicRoute = publicPrefixes.some(p => pathname.startsWith(p));

  const response = isPublicRoute
    ? NextResponse.next({ request })
    : await updateSession(request);

  // 3. Add llms.txt discovery headers to all responses
  response.headers.set(
    'Link',
    '</llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"'
  );
  response.headers.set('X-Llms-Txt', '/llms.txt');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder assets (images, sw.js, manifest, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|js|css|woff|woff2|ttf|eot)$).*)',
  ],
};
