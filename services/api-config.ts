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

export interface ApiFetchErrorContext {
  screen?: string;
  route?: string;
  userAction?: string;
  suppressErrorTracking?: boolean;
  treat4xxAsError?: boolean;
}

export interface ApiFetchInit extends RequestInit {
  __llErrorContext?: ApiFetchErrorContext;
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input.startsWith('/api/') ? `${API_BASE_URL}${input}` : input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url.startsWith('/api/') ? `${API_BASE_URL}${input.url}` : input.url;
}

function getRequestPath(url: string): string {
  try {
    const parsed = new URL(url, APP_URL);
    return parsed.pathname;
  } catch {
    return url;
  }
}

/**
 * Drop-in replacement for fetch() that auto-prefixes API routes.
 *
 * On web: '/api/chat/' -> '/api/chat/' (no change, relative path)
 * On iOS: '/api/chat/' -> 'https://www.lovelanguages.io/api/chat/'
 *
 * Non-API URLs (external, blob, data) pass through unchanged.
 */
export async function apiFetch(input: RequestInfo | URL, init?: ApiFetchInit): Promise<Response> {
  const resolvedUrl = resolveRequestUrl(input);
  const { __llErrorContext, ...requestInit } = init || {};

  try {
    const response = await fetch(resolvedUrl, requestInit);

    if (!response.ok && !__llErrorContext?.suppressErrorTracking) {
      const endpoint = getRequestPath(resolvedUrl);

      void import('./error-tracking').then(({ captureApiError }) => {
        captureApiError({
          endpoint,
          method: (requestInit.method || 'GET').toUpperCase(),
          statusCode: response.status,
          errorMessage: response.statusText || 'Request failed',
          route: __llErrorContext?.route,
          screen: __llErrorContext?.screen,
          userAction: __llErrorContext?.userAction,
          treat4xxAsError: __llErrorContext?.treat4xxAsError,
        });
      }).catch(() => {});
    }

    return response;
  } catch (error) {
    if (!__llErrorContext?.suppressErrorTracking) {
      const endpoint = getRequestPath(resolvedUrl);

      void import('./error-tracking').then(({ captureApiError }) => {
        captureApiError({
          endpoint,
          method: (requestInit.method || 'GET').toUpperCase(),
          errorMessage: error instanceof Error ? error.message : 'Network request failed',
          route: __llErrorContext?.route,
          screen: __llErrorContext?.screen,
          userAction: __llErrorContext?.userAction,
          treat4xxAsError: __llErrorContext?.treat4xxAsError,
          error,
        });
      }).catch(() => {});
    }

    throw error;
  }
}
