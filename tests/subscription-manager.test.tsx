import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionManager from '../components/SubscriptionManager';

const { navigateMock, apiFetchMock, getSessionMock, assignMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  apiFetchMock: vi.fn(),
  getSessionMock: vi.fn(),
  assignMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOptions?: unknown) => (
      typeof fallbackOrOptions === 'string' ? fallbackOrOptions : key
    ),
  }),
}));

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('../services/api-config', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

const baseProfile = {
  id: 'user-1',
  subscription_plan: 'standard',
  subscription_status: 'active',
  subscription_ends_at: null,
  subscription_source: 'stripe' as const,
  subscription_granted_by: null,
  linked_user_id: null,
  promo_expires_at: null,
  free_tier_chosen_at: null,
};

describe('SubscriptionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
        },
      },
    });
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://billing.stripe.com/test-portal' }),
    });
  });

  it('routes Stripe payers to customer portal', async () => {
    render(<SubscriptionManager profile={baseProfile} onNavigateExternal={assignMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'subscription.manager.manageSubscription' }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith('/api/create-customer-portal/', expect.any(Object));
    });
    expect(assignMock).toHaveBeenCalledWith('https://billing.stripe.com/test-portal');
  });

  it('routes App Store payers to Apple subscription management', () => {
    render(
      <SubscriptionManager
        profile={{
          ...baseProfile,
          subscription_source: 'app_store',
        }}
        onNavigateExternal={assignMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage in App Store' }));

    expect(assignMock).toHaveBeenCalledWith('https://apps.apple.com/account/subscriptions');
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('requires partner-impact confirmation before portal launch', async () => {
    render(
      <SubscriptionManager
        profile={{
          ...baseProfile,
          linked_user_id: 'partner-1',
        }}
        onNavigateExternal={assignMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'subscription.manager.manageSubscription' }));
    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('subscription.manager.cancelWarning')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'subscription.manager.continueToManage' }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
