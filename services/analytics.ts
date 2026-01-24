/**
 * Google Analytics 4 Integration
 * 
 * Handles page views and custom event tracking for Love Languages.
 * Configure by setting VITE_GA4_MEASUREMENT_ID in your .env.local
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

// Track if we've initialized
let isInitialized = false;

/**
 * Initialize Google Analytics 4
 * Call this once when the app loads
 */
export const initGA = (): void => {
  if (isInitialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID) {
      console.log('[Analytics] GA4 not configured (VITE_GA4_MEASUREMENT_ID missing)');
    }
    return;
  }

  // Create script element for gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll track page views manually for SPA
  });

  isInitialized = true;
  console.log('[Analytics] GA4 initialized');
};

/**
 * Track a page view
 * Call this on route changes
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isInitialized || !GA_MEASUREMENT_ID) return;

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
  if (!isInitialized || !GA_MEASUREMENT_ID) return;

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
