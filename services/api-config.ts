import { Capacitor } from '@capacitor/core';

/**
 * API and app URL configuration for cross-platform support.
 *
 * - API_BASE_URL: Prefix for fetch('/api/...') calls.
 * - APP_URL: Canonical public web origin for shareable and App Review-visible URLs.
 * - Native auth callbacks use a dedicated custom scheme so OAuth/password reset can
 *   return directly into the installed iOS app instead of falling back to Safari.
 */

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://www.lovelanguages.io';
export const NATIVE_APP_SCHEME = import.meta.env.VITE_NATIVE_APP_SCHEME || 'lovelanguages';
export const AUTH_CALLBACK_PATH = '/auth/callback';

function appendQueryParams(url: URL, params?: Record<string, string | undefined>): URL {
  if (!params) {
    return url;
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

export function buildAppUrl(
  path: string = '/',
  params?: Record<string, string | undefined>,
  baseUrl: string = APP_URL
): string {
  const url = new URL(path, `${baseUrl.replace(/\/$/, '')}/`);
  return appendQueryParams(url, params).toString();
}

export function buildNativeUrl(
  path: string = AUTH_CALLBACK_PATH,
  params?: Record<string, string | undefined>,
  scheme: string = NATIVE_APP_SCHEME
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const segments = normalizedPath.split('/').filter(Boolean);
  const [host = 'app', ...rest] = segments;
  const pathname = rest.length > 0 ? `/${rest.join('/')}` : '';
  const url = new URL(`${scheme}://${host}${pathname}`);
  return appendQueryParams(url, params).toString();
}

export function getAuthCallbackUrl(options?: {
  flow?: 'oauth' | 'password-reset';
  next?: string;
  native?: boolean;
}): string {
  const native = options?.native ?? Capacitor.isNativePlatform();
  const params = {
    flow: options?.flow,
    next: options?.next,
  };

  return native
    ? buildNativeUrl(AUTH_CALLBACK_PATH, params)
    : buildAppUrl(AUTH_CALLBACK_PATH, params);
}

export function getOAuthRedirectUrl(native?: boolean): string {
  return getAuthCallbackUrl({
    flow: 'oauth',
    next: '/',
    native,
  });
}

export function getPasswordResetRedirectUrl(native?: boolean): string {
  return getAuthCallbackUrl({
    flow: 'password-reset',
    next: '/reset-password',
    native,
  });
}

/**
 * Drop-in replacement for fetch() that auto-prefixes API routes.
 *
 * On web: '/api/chat/' -> '/api/chat/' (no change, relative path)
 * On iOS: '/api/chat/' -> 'https://www.lovelanguages.io/api/chat/'
 *
 * Non-API URLs (external, blob, data) pass through unchanged.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return fetch(`${API_BASE_URL}${input}`, init);
  }
  return fetch(input, init);
}
