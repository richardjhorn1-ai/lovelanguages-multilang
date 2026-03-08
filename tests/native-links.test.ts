import { describe, expect, it } from 'vitest';
import {
  AUTH_CALLBACK_PATH,
  buildNativeUrl,
  getAuthCallbackUrl,
} from '../services/api-config';
import { normalizeInboundAppUrl } from '../services/native-links';

describe('native auth redirect helpers', () => {
  it('builds a native auth callback URL with flow metadata', () => {
    expect(
      getAuthCallbackUrl({
        flow: 'password-reset',
        next: '/reset-password',
        native: true,
      })
    ).toBe('lovelanguages://auth/callback?flow=password-reset&next=%2Freset-password');
  });

  it('builds a native callback URL from the shared auth callback path', () => {
    expect(buildNativeUrl(AUTH_CALLBACK_PATH, { flow: 'oauth', next: '/' })).toBe(
      'lovelanguages://auth/callback?flow=oauth&next=%2F'
    );
  });
});

describe('normalizeInboundAppUrl', () => {
  it('maps universal links into router paths', () => {
    expect(normalizeInboundAppUrl('https://www.lovelanguages.io/join/test-token')).toBe(
      '/join/test-token'
    );
  });

  it('maps custom-scheme auth callbacks into router paths', () => {
    expect(
      normalizeInboundAppUrl(
        'lovelanguages://auth/callback?flow=password-reset&next=%2Freset-password#access_token=abc'
      )
    ).toBe('/auth/callback?flow=password-reset&next=%2Freset-password#access_token=abc');
  });

  it('ignores unrelated external origins', () => {
    expect(normalizeInboundAppUrl('https://example.com/join/test-token')).toBeNull();
  });
});
