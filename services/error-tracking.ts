import { analytics } from './analytics';

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

export function initErrorTracking(): void {
  // Intentional no-op: we currently keep structured analytics for errors
  // without shipping a third-party crash SDK.
}

export function setErrorTrackingUser(user: {
  id: string;
  email?: string | null;
  role?: string | null;
  activeLanguage?: string | null;
}): void {
  void user;
}

export function clearErrorTrackingUser(): void {
  // Intentional no-op while runtime crash reporting is disabled.
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
}
