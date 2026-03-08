import { describe, expect, it } from 'vitest';
import { hasActiveEntitlement } from '../services/purchases';

describe('hasActiveEntitlement', () => {
  it('recognizes the repo-standard entitlement identifiers', () => {
    const result = hasActiveEntitlement({
      activeSubscriptions: ['standard_monthly'],
      entitlements: {
        active: {
          standard_access: {
            identifier: 'standard_access',
            productIdentifier: 'standard_monthly',
            isActive: true,
            willRenew: true,
            expirationDate: '2026-04-01T00:00:00.000Z',
          },
        },
        all: {},
      },
    } as any);

    expect(result).toEqual({
      isActive: true,
      plan: 'standard',
      expirationDate: '2026-04-01T00:00:00.000Z',
    });
  });

  it('recognizes the live RevenueCat entitlement identifiers via product mapping', () => {
    const result = hasActiveEntitlement({
      activeSubscriptions: ['unlimited_yearly'],
      entitlements: {
        active: {
          Unlimited: {
            identifier: 'Unlimited',
            productIdentifier: 'unlimited_yearly',
            isActive: true,
            willRenew: true,
            expirationDate: '2027-03-08T00:00:00.000Z',
          },
        },
        all: {},
      },
    } as any);

    expect(result).toEqual({
      isActive: true,
      plan: 'unlimited',
      expirationDate: '2027-03-08T00:00:00.000Z',
    });
  });

  it('falls back to active subscriptions when entitlement identifiers do not match', () => {
    const result = hasActiveEntitlement({
      activeSubscriptions: ['standard_yearly'],
      entitlements: {
        active: {},
        all: {},
      },
    } as any);

    expect(result).toEqual({
      isActive: true,
      plan: 'standard',
      expirationDate: null,
    });
  });
});
