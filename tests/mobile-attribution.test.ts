import { describe, expect, it } from 'vitest';

import { vi } from 'vitest';

vi.mock('../services/analytics', () => ({
  analytics: {
    trackAppInstalled: vi.fn(),
    trackAppOpened: vi.fn(),
    trackAppBackgrounded: vi.fn(),
  },
}));

import { classifyAppOpenSource, extractAppOpenAttribution } from '../services/mobile-attribution';

describe('mobile attribution helpers', () => {
  it('classifies deep links separately from warm and cold opens', () => {
    expect(classifyAppOpenSource('lovelanguages://auth/callback?next=%2F', 'cold')).toBe('deeplink');
    expect(classifyAppOpenSource(null, 'warm')).toBe('warm');
    expect(classifyAppOpenSource(undefined, 'cold')).toBe('cold');
  });

  it('extracts campaign params and router path from inbound URLs', () => {
    expect(
      extractAppOpenAttribution(
        'https://www.lovelanguages.io/join/abc?utm_source=instagram&utm_medium=story&utm_campaign=launch&utm_content=ipad'
      )
    ).toEqual({
      deep_link_path: '/join/abc?utm_source=instagram&utm_medium=story&utm_campaign=launch&utm_content=ipad',
      utm_source: 'instagram',
      utm_medium: 'story',
      utm_campaign: 'launch',
      utm_content: 'ipad',
      utm_term: undefined,
    });
  });
});
