/**
 * Google Analytics 4 Event Tracking
 * 
 * GA4 is initialized via script tag in index.html.
 * This module provides event tracking helpers for the SPA.
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Track a page view (for SPA navigation)
 */
export const trackPageView = (path: string, title?: string): void => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track a custom event
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
): void => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, params);
};

// ============================================
// Pre-defined events for Love Languages
// ============================================

/** User started onboarding */
export const trackOnboardingStart = (role: 'student' | 'tutor'): void => {
  trackEvent('onboarding_start', { role });
};

/** User completed a step in onboarding */
export const trackOnboardingStep = (step: number, stepName: string, role: 'student' | 'tutor'): void => {
  trackEvent('onboarding_step', { step, step_name: stepName, role });
};

/** User completed onboarding */
export const trackOnboardingComplete = (role: 'student' | 'tutor'): void => {
  trackEvent('onboarding_complete', { role });
};

/** User signed up */
export const trackSignUp = (method: 'email' | 'google' | 'apple'): void => {
  trackEvent('sign_up', { method });
};

/** User started a subscription */
export const trackSubscription = (plan: string, interval: 'monthly' | 'yearly'): void => {
  trackEvent('purchase', { 
    plan,
    interval,
    currency: 'USD',
  });
};

/** User started a lesson/chat */
export const trackLessonStart = (language: string): void => {
  trackEvent('lesson_start', { language });
};

/** User played a game */
export const trackGamePlayed = (gameType: string): void => {
  trackEvent('game_played', { game_type: gameType });
};

/** User invited their partner */
export const trackPartnerInvite = (): void => {
  trackEvent('partner_invite');
};

/** User connected with partner */
export const trackPartnerConnected = (): void => {
  trackEvent('partner_connected');
};
