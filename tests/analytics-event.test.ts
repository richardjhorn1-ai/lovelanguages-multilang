import { describe, expect, it } from 'vitest';

import { ALLOWED_EVENTS } from '../api/analytics-event';

describe('analytics event allowlist', () => {
  it('accepts the payment funnel events required by LOV-94', () => {
    expect(ALLOWED_EVENTS.has('paywall_view')).toBe(true);
    expect(ALLOWED_EVENTS.has('checkout_started')).toBe(true);
    expect(ALLOWED_EVENTS.has('purchase_completed')).toBe(true);
    expect(ALLOWED_EVENTS.has('purchase_failed')).toBe(true);
  });
});
