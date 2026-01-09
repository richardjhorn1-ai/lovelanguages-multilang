import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import handler from '../api/generate-invite';

const mockProfile = {
  id: 'user-123',
  full_name: 'Test User',
  email: 'test@example.com',
  linked_user_id: null,
  subscription_status: 'active',
  subscription_granted_by: null,
};

const mockExistingToken = {
  token: 'existing-token',
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const buildSupabaseMock = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockProfile.id } }, error: null }),
  },
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      };
    }

    if (table === 'invite_tokens') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              gt: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockExistingToken, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    }

    return {};
  }),
});

const buildRequest = (origin: string) => ({
  method: 'POST',
  headers: {
    origin,
    authorization: 'Bearer test-token',
  },
});

const buildResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((payload: any) => {
    res.payload = payload;
    return res;
  });
  res.end = vi.fn();
  res.setHeader = vi.fn();
  return res;
};

const setRequiredEnv = () => {
  process.env.VITE_SUPABASE_URL = 'https://supabase.example.com';
  process.env.SUPABASE_SERVICE_KEY = 'service-key';
};

describe('generate-invite base URL selection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    setRequiredEnv();
    // Clear URL-related env vars to test fallback behavior
    delete process.env.APP_URL;
    delete process.env.ALLOWED_ORIGINS;
  });

  it('uses APP_URL when set, ignoring req.headers.origin', async () => {
    process.env.APP_URL = 'https://app.example.com';
    process.env.ALLOWED_ORIGINS = '*';

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.inviteLink).toBe(`https://app.example.com/#/join/${mockExistingToken.token}`);
  });

  it('uses server-configured base URL even with invalid origin headers', async () => {
    process.env.APP_URL = 'https://app.example.com';
    process.env.ALLOWED_ORIGINS = 'https://allowed.example.com';

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com/path?query=1');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.inviteLink).toBe(`https://app.example.com/#/join/${mockExistingToken.token}`);
  });

  it('falls back to production URL when APP_URL and ALLOWED_ORIGINS are not set', async () => {
    // No APP_URL or ALLOWED_ORIGINS set (cleared in beforeEach)

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.inviteLink).toBe(`https://lovelanguages.xyz/#/join/${mockExistingToken.token}`);
  });

  it('falls back to production URL when ALLOWED_ORIGINS is only wildcard', async () => {
    process.env.ALLOWED_ORIGINS = '*';

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.inviteLink).toBe(`https://lovelanguages.xyz/#/join/${mockExistingToken.token}`);
  });

  it('uses first valid origin from ALLOWED_ORIGINS when APP_URL is not set', async () => {
    process.env.ALLOWED_ORIGINS = 'https://first.example.com,https://second.example.com';

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.inviteLink).toBe(`https://first.example.com/#/join/${mockExistingToken.token}`);
  });

  it('filters out wildcard and uses valid origin from mixed ALLOWED_ORIGINS', async () => {
    process.env.ALLOWED_ORIGINS = '*,https://valid.example.com';

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.inviteLink).toBe(`https://valid.example.com/#/join/${mockExistingToken.token}`);
  });

  it('handles APP_URL with trailing slash correctly', async () => {
    process.env.APP_URL = 'https://app.example.com/';

    const supabaseMock = buildSupabaseMock();
    const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;
    mockCreateClient.mockReturnValue(supabaseMock);

    const req = buildRequest('https://evil.example.com');
    const res = buildResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Should normalize to origin without trailing slash
    expect(res.payload.inviteLink).toBe(`https://app.example.com/#/join/${mockExistingToken.token}`);
  });
});
