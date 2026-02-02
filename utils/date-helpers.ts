/**
 * Date formatting utilities
 * Consolidates common date formatting patterns used across components.
 */

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * Falls back to short date for older dates.
 */
export function formatRelativeTime(
  date: Date | string,
  t?: (key: string, fallback: string, options?: Record<string, any>) => string
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Use translation function if provided, otherwise use defaults
  if (t) {
    if (diffMins < 1) return t('time.justNow', 'Just now');
    if (diffMins < 60) return t('time.minutesAgo', '{{count}}m ago', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', '{{count}}h ago', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', '{{count}}d ago', { count: diffDays });
  } else {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }

  return formatShortDate(d);
}

/**
 * Format a date as short date (e.g., "Jan 15")
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date as long date (e.g., "January 15, 2024")
 */
export function formatLongDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date as medium date (e.g., "Jan 15, 2024")
 */
export function formatMediumDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get days until a future date (for expiration countdowns)
 */
export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get days since a past date
 */
export function getDaysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
