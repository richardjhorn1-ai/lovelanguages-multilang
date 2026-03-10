import { beforeEach, describe, expect, it, vi } from 'vitest';

const purchasesMock = {
  configure: vi.fn(),
  getOfferings: vi.fn(),
  checkTrialOrIntroductoryPriceEligibility: vi.fn(),
};

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'ios',
  },
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: purchasesMock,
}));

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

describe('RevenueCat offerings integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_REVENUECAT_API_KEY', 'test_rc_key');
    purchasesMock.configure.mockResolvedValue(undefined);
    purchasesMock.getOfferings.mockReset();
    purchasesMock.checkTrialOrIntroductoryPriceEligibility.mockReset();
  });

  it('reads PurchasesOfferings directly when loading catalog packages', async () => {
    purchasesMock.getOfferings.mockResolvedValue({
      current: {
        identifier: 'default',
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'standard_monthly',
              title: 'Standard Monthly',
              description: 'Monthly plan',
              priceString: '$9.99',
              price: 9.99,
              currencyCode: 'USD',
            },
          },
        ],
      },
      all: {},
    });

    const purchases = await import('../services/purchases');
    await purchases.configurePurchases('user-123');

    const offerings = await purchases.getOfferings();

    expect(offerings?.current?.availablePackages).toHaveLength(1);
    expect(offerings?.current?.availablePackages[0].product.identifier).toBe('standard_monthly');
  });

  it('uses the same direct offerings shape in the intro fallback path', async () => {
    purchasesMock.checkTrialOrIntroductoryPriceEligibility.mockRejectedValue(new Error('eligibility unavailable'));
    purchasesMock.getOfferings.mockResolvedValue({
      current: {
        identifier: 'default',
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'standard_monthly',
              title: 'Standard Monthly',
              description: 'Monthly plan',
              priceString: '$9.99',
              price: 9.99,
              currencyCode: 'USD',
              introPrice: {
                priceString: 'Free',
              },
            },
          },
        ],
      },
      all: {},
    });

    const purchases = await import('../services/purchases');
    await purchases.configurePurchases('user-123');

    await expect(purchases.checkIntroEligibility()).resolves.toBe(true);
  });
});
