/**
 * Haptic feedback service for native app experience
 * Uses Capacitor Haptics plugin with fallback for web
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Haptic feedback types that map to game events
export type HapticFeedback =
  | 'correct'      // Light tap - correct answer
  | 'incorrect'    // Error vibration - wrong answer
  | 'perfect'      // Strong success - perfect score
  | 'tier-up'      // Medium celebration - level up
  | 'xp-gain'      // Subtle tap - XP gained
  | 'notification' // Alert vibration - new notification
  | 'selection'    // Tiny tap - UI selection
  | 'button';      // Light tap - button press

// Storage key for haptics preference
const HAPTICS_STORAGE_KEY = 'love-languages-haptics-enabled';

class HapticsService {
  private enabled: boolean = true;
  private isNative: boolean = false;

  constructor() {
    // Check if running in native app
    this.isNative = Capacitor.isNativePlatform();

    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HAPTICS_STORAGE_KEY);
      // Default to enabled if not set
      this.enabled = stored !== 'false';
    }
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticFeedback): Promise<void> {
    if (!this.enabled || !this.isNative) return;

    try {
      switch (type) {
        case 'correct':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        case 'incorrect':
          await Haptics.notification({ type: NotificationType.Error });
          break;

        case 'perfect':
          // Double tap for emphasis
          await Haptics.notification({ type: NotificationType.Success });
          await this.delay(100);
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;

        case 'tier-up':
          await Haptics.notification({ type: NotificationType.Success });
          break;

        case 'xp-gain':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;

        case 'notification':
          await Haptics.notification({ type: NotificationType.Warning });
          break;

        case 'selection':
          await Haptics.selectionChanged();
          break;

        case 'button':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } catch (error) {
      // Silently fail if haptics not available
      console.debug('Haptics not available:', error);
    }
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if running on native platform (haptics available)
   */
  isAvailable(): boolean {
    return this.isNative;
  }

  /**
   * Toggle haptics state
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    this.savePreference();
    return this.enabled;
  }

  /**
   * Set haptics state directly
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.savePreference();
  }

  /**
   * Save preference to localStorage
   */
  private savePreference(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HAPTICS_STORAGE_KEY, String(this.enabled));
    }
  }

  /**
   * Helper for delayed haptics
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const haptics = new HapticsService();
