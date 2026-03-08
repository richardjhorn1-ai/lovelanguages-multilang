import { describe, expect, it, vi } from 'vitest';

import { setCorsHeaders } from '../utils/api-middleware';

const buildResponse = () => {
  const headers = new Map<string, string>();

  const res: any = {
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name, value);
    }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    end: vi.fn(),
  };

  return { res, headers };
};

describe('setCorsHeaders', () => {
  it('allows the native Capacitor origin even when ALLOWED_ORIGINS is stale', () => {
    process.env.ALLOWED_ORIGINS = 'https://lovelanguages.io';

    const { res, headers } = buildResponse();
    const handled = setCorsHeaders(
      {
        method: 'OPTIONS',
        headers: {
          origin: 'capacitor://localhost',
        },
      },
      res
    );

    expect(handled).toBe(true);
    expect(headers.get('Access-Control-Allow-Origin')).toBe('capacitor://localhost');
    expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('allows the canonical www origin even when APP_URL is not set', () => {
    process.env.ALLOWED_ORIGINS = 'https://lovelanguages.io';
    delete process.env.APP_URL;
    delete process.env.VITE_APP_URL;

    const { res, headers } = buildResponse();
    setCorsHeaders(
      {
        method: 'GET',
        headers: {
          origin: 'https://www.lovelanguages.io',
        },
      },
      res
    );

    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://www.lovelanguages.io');
    expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('falls back to the canonical www origin for unknown origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://lovelanguages.io';

    const { res, headers } = buildResponse();
    setCorsHeaders(
      {
        method: 'GET',
        headers: {
          origin: 'https://unknown.example.com',
        },
      },
      res
    );

    expect(headers.get('Access-Control-Allow-Origin')).toBe('https://www.lovelanguages.io');
    expect(headers.get('Access-Control-Allow-Credentials')).toBeUndefined();
  });
});
