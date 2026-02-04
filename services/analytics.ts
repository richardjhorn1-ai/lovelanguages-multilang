/**
 * Analytics Service for Love Languages
 *
 * Centralized event tracking for GA4 and internal analytics.
 * See docs/ANALYTICS_IMPLEMENTATION.md for full event taxonomy.
 *
 * Usage:
 *   import { analytics } from '../services/analytics';
 *   analytics.track('signup_completed', { method: 'google' });
 */

// Event parameter types
interface BaseEventParams {
  [key: string]: string | number | boolean | undefined;
}

// Acquisition events
interface PageViewParams extends BaseEventParams {
  page_path: string;
  page_title: string;
}

interface CtaClickParams extends BaseEventParams {
  cta_location: string;
  cta_text: string;
  destination: string;
}

// Activation events
interface SignupParams extends BaseEventParams {
  method: 'email' | 'google' | 'apple';
  referral_source?: string;
}

interface OnboardingStepParams extends BaseEventParams {
  step_number: number;
  step_name: string;
  time_spent_ms?: number;
}

interface OnboardingCompletedParams extends BaseEventParams {
  total_time_ms: number;
  steps_completed: number;
  native_lang: string;
  target_lang: string;
}

// Monetization events
interface PaywallViewParams extends BaseEventParams {
  trigger_reason: string;
  page_context: string;
  usage_count?: number;
}

interface PaywallDismissedParams extends BaseEventParams {
  trigger_reason: string;
  time_viewed_ms: number;
}

interface PlanSelectedParams extends BaseEventParams {
  plan: 'standard' | 'unlimited';
  billing_period: 'monthly' | 'yearly';
}

interface CheckoutParams extends BaseEventParams {
  plan: 'standard' | 'unlimited';
  billing_period: 'monthly' | 'yearly';
  price: number;
  currency?: string;
}

interface SubscriptionCompletedParams extends BaseEventParams {
  plan: 'standard' | 'unlimited';
  billing_period: 'monthly' | 'yearly';
  price: number;
  currency: string;
}

// Engagement events
interface ChatMessageParams extends BaseEventParams {
  mode: 'ask' | 'learn' | 'coach';
  message_length?: number;
  session_message_count?: number;
  response_time_ms?: number;
}

interface WordParams extends BaseEventParams {
  target_lang: string;
  word_count_total?: number;
  source?: 'chat' | 'manual';
  word?: string;
}

interface GameParams extends BaseEventParams {
  game_type: string;
  word_count?: number;
  score?: number;
  duration_ms?: number;
  accuracy?: number;
  correct?: boolean;
  streak?: number;
}

interface ChallengeParams extends BaseEventParams {
  challenge_type: string;
  word_count?: number;
  score?: number;
  time_to_complete_ms?: number;
}

interface LevelTestParams extends BaseEventParams {
  target_lang: string;
  level_result?: string;
  score?: number;
}

interface VoiceSessionParams extends BaseEventParams {
  mode: 'voice' | 'listen';
  duration_ms?: number;
}

// Retention events
interface StreakParams extends BaseEventParams {
  streak_days: number;
  activity_type?: string;
  previous_streak_days?: number;
}

interface PartnerParams extends BaseEventParams {
  invite_method?: string;
  inviter_user_id?: string;
}

// Churn events
interface ErrorParams extends BaseEventParams {
  error_type: string;
  error_message: string;
  page_context: string;
}

interface FeatureAbandonedParams extends BaseEventParams {
  feature: string;
  time_spent_ms: number;
  completion_percent: number;
}

// User properties
interface UserProperties {
  user_id?: string;
  signup_date?: string;
  native_language?: string;
  target_language?: string;
  subscription_plan?: 'free' | 'standard' | 'unlimited';
  subscription_status?: 'active' | 'trial' | 'expired' | 'none';
  partner_status?: 'solo' | 'paired';
  total_words?: number;
  total_xp?: number;
  current_streak?: number;
  lifetime_value?: number;
}

// Event name union type for type safety
type EventName =
  // Acquisition
  | 'page_view'
  | 'cta_click'
  | 'app_store_click'
  // Activation
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_step'
  | 'onboarding_completed'
  | 'first_word_added'
  | 'first_chat_message'
  | 'first_game_played'
  // Monetization
  | 'paywall_view'
  | 'paywall_dismissed'
  | 'plan_selected'
  | 'checkout_started'
  | 'subscription_completed'
  | 'subscription_failed'
  | 'trial_started'
  | 'trial_converted'
  | 'trial_expired'
  // Engagement
  | 'chat_message_sent'
  | 'chat_response_received'
  | 'word_added'
  | 'word_practiced'
  | 'game_started'
  | 'game_completed'
  | 'challenge_created'
  | 'challenge_completed'
  | 'level_test_started'
  | 'level_test_completed'
  | 'voice_session_started'
  | 'voice_session_ended'
  | 'tts_played'
  // Retention
  | 'session_start'
  | 'streak_maintained'
  | 'streak_broken'
  | 'partner_invited'
  | 'partner_joined'
  // Churn
  | 'error_encountered'
  | 'rage_click'
  | 'feature_abandoned'
  | 'account_deleted';

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Check if gtag is available
const hasGtag = (): boolean => {
  return isBrowser && typeof window.gtag === 'function';
};

// Debug mode (enable in dev)
const isDebugMode = (): boolean => {
  return isBrowser && (
    window.location.hostname === 'localhost' ||
    localStorage.getItem('analytics_debug') === 'true'
  );
};

// Hash user ID for privacy
const hashUserId = (userId: string): string => {
  // Simple hash for privacy - in production could use SHA-256
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'u_' + Math.abs(hash).toString(36);
};

// Clean params (remove undefined values)
const cleanParams = (params: BaseEventParams): Record<string, string | number | boolean> => {
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

class AnalyticsService {
  private userId: string | null = null;
  private sessionStartTime: number = Date.now();
  private eventQueue: Array<{ name: string; params: BaseEventParams }> = [];
  private initialized: boolean = false;

  /**
   * Initialize analytics with user context
   */
  identify(userId: string, properties?: Partial<UserProperties>): void {
    this.userId = hashUserId(userId);

    if (hasGtag()) {
      // Set user ID for GA4
      window.gtag('config', this.getGaMeasurementId(), {
        user_id: this.userId,
      });

      // Set user properties
      if (properties) {
        window.gtag('set', 'user_properties', cleanParams(properties as BaseEventParams));
      }
    }

    if (isDebugMode()) {
      console.log('[Analytics] Identified user:', this.userId, properties);
    }

    this.initialized = true;
    this.flushQueue();
  }

  /**
   * Track an event
   */
  track(eventName: EventName, params: BaseEventParams = {}): void {
    const enrichedParams = {
      ...params,
      timestamp: Date.now(),
      session_duration_ms: Date.now() - this.sessionStartTime,
      ...(this.userId && { user_id: this.userId }),
    };

    // If not initialized, queue the event
    if (!this.initialized && eventName !== 'page_view') {
      this.eventQueue.push({ name: eventName, params: enrichedParams });
      return;
    }

    // Send to GA4
    if (hasGtag()) {
      window.gtag('event', eventName, cleanParams(enrichedParams));
    }

    // Debug logging
    if (isDebugMode()) {
      console.log('[Analytics] Event:', eventName, cleanParams(enrichedParams));
    }
  }

  /**
   * Set a user property
   */
  setUserProperty(name: keyof UserProperties, value: string | number | boolean): void {
    if (hasGtag()) {
      window.gtag('set', 'user_properties', { [name]: value });
    }

    if (isDebugMode()) {
      console.log('[Analytics] Set user property:', name, value);
    }
  }

  /**
   * Flush queued events (called after identify)
   */
  private flushQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.track(event.name as EventName, event.params);
      }
    }
  }

  /**
   * Get GA4 measurement ID from environment or window
   */
  private getGaMeasurementId(): string {
    // This should match the ID in index.html
    return 'G-ZJWLDBC5QP';
  }

  // ===== Convenience Methods =====

  // Activation
  trackSignupStarted(method: 'email' | 'google' | 'apple'): void {
    this.track('signup_started', { method });
  }

  trackSignupCompleted(params: SignupParams): void {
    this.track('signup_completed', params);
  }

  trackOnboardingStep(params: OnboardingStepParams): void {
    this.track('onboarding_step', params);
  }

  trackOnboardingCompleted(params: OnboardingCompletedParams): void {
    this.track('onboarding_completed', params);
  }

  // Monetization
  trackPaywallView(params: PaywallViewParams): void {
    this.track('paywall_view', params);
  }

  trackPaywallDismissed(params: PaywallDismissedParams): void {
    this.track('paywall_dismissed', params);
  }

  trackPlanSelected(params: PlanSelectedParams): void {
    this.track('plan_selected', params);
  }

  trackCheckoutStarted(params: CheckoutParams): void {
    this.track('checkout_started', params);
  }

  trackSubscriptionCompleted(params: SubscriptionCompletedParams): void {
    this.track('subscription_completed', params);

    // Also track as GA4 purchase event for revenue tracking
    if (hasGtag()) {
      window.gtag('event', 'purchase', {
        transaction_id: `sub_${Date.now()}`,
        value: params.price,
        currency: params.currency,
        items: [{
          item_id: params.plan,
          item_name: `${params.plan}_${params.billing_period}`,
          price: params.price,
          quantity: 1,
        }],
      });
    }
  }

  // Engagement
  trackChatMessage(params: ChatMessageParams): void {
    this.track('chat_message_sent', params);
  }

  trackChatResponse(params: ChatMessageParams): void {
    this.track('chat_response_received', params);
  }

  trackWordAdded(params: WordParams): void {
    this.track('word_added', params);
  }

  trackGameStarted(params: GameParams): void {
    this.track('game_started', params);
  }

  trackGameCompleted(params: GameParams): void {
    this.track('game_completed', params);
  }

  // Churn signals
  trackError(params: ErrorParams): void {
    this.track('error_encountered', params);
  }

  trackFeatureAbandoned(params: FeatureAbandonedParams): void {
    this.track('feature_abandoned', params);
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Type declaration for window.gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetOrEventName: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

/**
 * Legacy trackPageView function for backward compatibility
 * Used by App.tsx for SPA navigation tracking
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isBrowser || !hasGtag()) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });

  if (isDebugMode()) {
    console.log('[Analytics] Page view:', path, title);
  }
};

export default analytics;

/**
 * Capture UTM parameters and blog referral data from URL
 * Call this on app load to attribute signups to blog articles
 */
export const captureReferralSource = (): {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  refNative: string;
  refTarget: string;
} | null => {
  if (!isBrowser) return null;

  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');

  if (!source) return null;

  const referralData = {
    source: source,
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    content: params.get('utm_content') || '',
    refNative: params.get('ref_native') || '',
    refTarget: params.get('ref_target') || '',
  };

  // Store in sessionStorage for attribution across pages
  sessionStorage.setItem('referral_data', JSON.stringify(referralData));

  // Track the landing event
  if (hasGtag()) {
    window.gtag('event', 'blog_referral_landing', {
      utm_source: referralData.source,
      utm_medium: referralData.medium,
      utm_campaign: referralData.campaign,
      article_slug: referralData.content,
      native_lang: referralData.refNative,
      target_lang: referralData.refTarget,
      event_category: 'acquisition',
    });
  }

  // Clean URL (remove UTM params)
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);

  return referralData;
};

/**
 * Get stored referral data (for signup attribution)
 */
export const getReferralData = (): Record<string, string> | null => {
  if (!isBrowser) return null;
  const stored = sessionStorage.getItem('referral_data');
  return stored ? JSON.parse(stored) : null;
};
