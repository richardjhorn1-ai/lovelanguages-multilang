import { describe, expect, it } from 'vitest';
import {
  formatSubscriptionPriceSummary,
  formatUsdPrice,
  getDisplaySubscriptionPrice,
} from '../services/subscription-pricing';

describe('subscription pricing helpers', () => {
  it('returns the canonical launch prices for each paid plan', () => {
    expect(getDisplaySubscriptionPrice('standard', 'weekly')).toBe(6.99);
    expect(getDisplaySubscriptionPrice('standard', 'monthly')).toBe(17.99);
    expect(getDisplaySubscriptionPrice('standard', 'yearly')).toBe(69.99);
    expect(getDisplaySubscriptionPrice('unlimited', 'weekly')).toBe(12.99);
    expect(getDisplaySubscriptionPrice('unlimited', 'monthly')).toBe(39.99);
    expect(getDisplaySubscriptionPrice('unlimited', 'yearly')).toBe(139.99);
  });

  it('formats USD prices consistently for shared paywall surfaces', () => {
    expect(formatUsdPrice(6.99)).toBe('$6.99');
    expect(formatSubscriptionPriceSummary('unlimited')).toBe(
      '$12.99/week · $39.99/month · $139.99/year'
    );
  });
});
