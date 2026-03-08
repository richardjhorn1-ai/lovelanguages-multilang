export type BillingPeriod = 'weekly' | 'monthly' | 'yearly';
export type PaidPlanId = 'standard' | 'unlimited';

export const DISPLAY_SUBSCRIPTION_PRICES_USD: Record<PaidPlanId, Record<BillingPeriod, number>> = {
  standard: {
    weekly: 6.99,
    monthly: 17.99,
    yearly: 69.99,
  },
  unlimited: {
    weekly: 12.99,
    monthly: 39.99,
    yearly: 139.99,
  },
};

export function getDisplaySubscriptionPrice(plan: PaidPlanId, billingPeriod: BillingPeriod): number {
  return DISPLAY_SUBSCRIPTION_PRICES_USD[plan][billingPeriod];
}

export function formatUsdPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatSubscriptionPriceSummary(plan: PaidPlanId): string {
  const weekly = formatUsdPrice(getDisplaySubscriptionPrice(plan, 'weekly'));
  const monthly = formatUsdPrice(getDisplaySubscriptionPrice(plan, 'monthly'));
  const yearly = formatUsdPrice(getDisplaySubscriptionPrice(plan, 'yearly'));

  return `${weekly}/week · ${monthly}/month · ${yearly}/year`;
}
