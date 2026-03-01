/**
 * API and App URL configuration for cross-platform support.
 *
 * This module provides two constants and one helper:
 *
 * - API_BASE_URL: Prefix for fetch('/api/...') calls.
 *     Web:  '' (empty — relative paths work as-is)
 *     iOS:  'https://www.lovelanguages.io' (absolute, since app loads from local bundle)
 *
 * - APP_URL: The canonical production URL. Used for any URL that "leaves the app":
 *     OAuth redirect URLs, Stripe success/cancel URLs, invite links, email links.
 *     Always 'https://www.lovelanguages.io' on all platforms.
 *
 * - apiFetch(): Drop-in replacement for fetch() that auto-prepends API_BASE_URL
 *     to paths starting with '/api/'. All other URLs pass through unchanged.
 *
 * To build for iOS, set the env var before vite build:
 *   VITE_API_BASE_URL=https://www.lovelanguages.io npm run build:app
 *
 * The cap:sync and cap:build:ios npm scripts do this automatically.
 */

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

// Always the production URL — never capacitor://localhost or localhost:5173.
// Used for URLs that leave the app and must be real, shareable web URLs.
export const APP_URL = 'https://www.lovelanguages.io';

/**
 * Drop-in replacement for fetch() that auto-prefixes API routes.
 *
 * On web: '/api/chat/' → '/api/chat/' (no change, relative path)
 * On iOS: '/api/chat/' → 'https://www.lovelanguages.io/api/chat/'
 *
 * Non-API URLs (external, blob, data) pass through unchanged.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return fetch(`${API_BASE_URL}${input}`, init);
  }
  return fetch(input, init);
}
