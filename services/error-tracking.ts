import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/capacitor';
import { init as sentryReactInit } from '@sentry/react';
import { analytics } from './analytics';

const SENTRY_DSN = String(import.meta.env.VITE_SENTRY_DSN || '').trim();
const SENTRY_ENVIRONMENT = import.meta.env.MODE || 'development';
const SENTRY_RELEASE = String(
  import.meta.env.VITE_SENTRY_RELEASE ||
  import.meta.env.VERCEL_GIT_COMMIT_SHA ||
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
  'dev'
).trim();

let initialized = false;

type ErrorLike = Error | string | null | undefined;

interface SharedErrorContext {
  screen?: string;
  route?: string;
  userAction?: string;
  error?: unknown;
}

interface AppErrorContext extends SharedErrorContext {
  errorType?: string;
}

interface ApiErrorContext extends SharedErrorContext {
  endpoint: string;
  method: string;
  statusCode?: number;
  errorMessage: string;
  treat4xxAsError?: boolean;
}

function coerceError(error: ErrorLike): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown error');
}

function trimMessage(message: string): string {
  return message.slice(0, 300);
}

function currentRoute(route?: string): string {
  if (route) {
    return route;
  }

  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }

  return 'unknown';
}

function isExpectedPurchaseCancellation(error: ErrorLike): boolean {
  const message = coerceError(error).message.toLowerCase();
  return message.includes('cancelled') || message.includes('canceled') || message.includes('purchase was cancelled');
}

function shouldIgnoreApiError(context: ApiErrorContext): boolean {
  const endpoint = context.endpoint.toLowerCase();

  if (endpoint.includes('/api/analytics-event/')) {
    return true;
  }

  if (isExpectedPurchaseCancellation((context.error as ErrorLike) || context.errorMessage)) {
    return true;
  }

  if (
    context.statusCode &&
    context.statusCode >= 400 &&
    context.statusCode < 500 &&
    !context.treat4xxAsError &&
    [400, 401, 403, 404, 409, 422].includes(context.statusCode)
  ) {
    return true;
  }

  return false;
}

function annotateScope(scope: ReturnType<typeof Sentry.getCurrentScope>, context: SharedErrorContext): void {
  scope.setTag('platform', Capacitor.getPlatform());
  scope.setTag('runtime', Capacitor.isNativePlatform() ? 'capacitor' : 'web');

  if (context.screen) {
    scope.setTag('screen', context.screen);
  }

  if (context.route) {
    scope.setTag('route', context.route);
  }

  if (context.userAction) {
    scope.setContext('user_action', { action: context.userAction });
  }
}

export function initErrorTracking(): void {
  if (initialized || !SENTRY_DSN) {
    return;
  }

  Sentry.init(
    {
      dsn: SENTRY_DSN,
      enabled: true,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      attachStacktrace: true,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
    },
    sentryReactInit
  );

  initialized = true;
}

export function setErrorTrackingUser(user: {
  id: string;
  email?: string | null;
  role?: string | null;
  activeLanguage?: string | null;
}): void {
  if (!initialized) {
    return;
  }

  const scope = Sentry.getCurrentScope();
  scope.setUser({
    id: user.id,
    email: user.email || undefined,
  });

  if (user.role) {
    scope.setTag('user_role', user.role);
  }

  if (user.activeLanguage) {
    scope.setTag('active_language', user.activeLanguage);
  }
}

export function clearErrorTrackingUser(): void {
  if (!initialized) {
    return;
  }

  const scope = Sentry.getCurrentScope();
  scope.setUser(null);
}

export function captureAppError(error: ErrorLike, context: AppErrorContext = {}): void {
  const normalizedError = coerceError(error);

  if (isExpectedPurchaseCancellation(normalizedError)) {
    return;
  }

  analytics.trackAppError({
    error_type: context.errorType || normalizedError.name || 'app_error',
    error_message: trimMessage(normalizedError.message),
    page_context: currentRoute(context.route),
    ...(context.screen ? { screen: context.screen } : {}),
    ...(context.userAction ? { user_action: context.userAction } : {}),
  });

  if (!initialized) {
    return;
  }

  const scope = Sentry.getCurrentScope();
  annotateScope(scope, context);
  scope.setTag('error_kind', context.errorType || normalizedError.name || 'app_error');
  Sentry.captureException(normalizedError);
}

export function captureApiError(context: ApiErrorContext): void {
  if (shouldIgnoreApiError(context)) {
    return;
  }

  analytics.trackApiError({
    endpoint: context.endpoint,
    method: context.method,
    status_code: context.statusCode,
    error_message: trimMessage(context.errorMessage),
    route: currentRoute(context.route),
    ...(context.screen ? { screen: context.screen } : {}),
    ...(context.userAction ? { user_action: context.userAction } : {}),
  });

  if (!initialized) {
    return;
  }

  const scope = Sentry.getCurrentScope();
  annotateScope(scope, context);
  scope.setTag('error_kind', 'api_error');
  scope.setTag('http_method', context.method);
  scope.setTag('endpoint', context.endpoint);

  if (typeof context.statusCode === 'number') {
    scope.setTag('status_code', String(context.statusCode));
  }

  Sentry.captureException(context.error instanceof Error ? context.error : new Error(context.errorMessage));
}
