# Security Vulnerability Fixes

This document describes how to fix the 12 security vulnerabilities found in your Supabase security scan.

## Summary

| # | Vulnerability | Severity | Fix Location |
|---|--------------|----------|--------------|
| 1 | Login Rate Limiting | HIGH | Supabase Dashboard + SQL |
| 2 | OTP Timing Attack | MEDIUM | Supabase Dashboard |
| 3 | OTP Brute Force | HIGH | Supabase Dashboard + SQL |
| 4 | Content-Type Sniffing | MEDIUM | API Middleware ✅ |
| 5 | Realtime Token in URL | MEDIUM | Client Config |
| 6 | Error Message Leakage | MEDIUM | API Middleware ✅ |
| 7 | RPC Function Enumeration | HIGH | SQL Migration ✅ |
| 8 | Security Headers Missing | MEDIUM | API Middleware ✅ |
| 9 | API Version Disclosure | LOW | SQL + API Config |
| 10 | TLS Downgrade | HIGH | Supabase (managed) |
| 11 | Credentials in Errors | MEDIUM | API Middleware ✅ |
| 12 | Password Reset Abuse | HIGH | Supabase Dashboard + SQL |

✅ = Already fixed in code changes

---

## Step 1: Run SQL Migration

Run `migrations/029_security_hardening.sql` in Supabase SQL Editor:

```sql
-- Copy the entire contents of migrations/029_security_hardening.sql
-- and run in Supabase Dashboard > SQL Editor
```

This creates:
- `auth_rate_limits` table for tracking failed auth attempts (RLS: service role only)
- `security_audit_log` table for security event tracking (RLS: service role only)
- Rate limiting functions (`check_auth_rate_limit`, `clear_auth_rate_limit`)
- Secured RPC function permissions (revoked from anon, granted to authenticated)

---

## Step 2: Supabase Dashboard Configuration

**IMPORTANT**: Since you use Supabase Auth directly (including Google OAuth), auth rate limiting must be configured in the dashboard - it cannot be done in code.

### 2.1 Auth Rate Limits (#1, #3, #12) - REQUIRED

Go to **Authentication > Rate Limits** and configure:

| Setting | Recommended Value | Why |
|---------|-------------------|-----|
| Rate limit for sending emails | 5 per hour | Prevents email bombing |
| Rate limit for sign-up | 10 per hour | Prevents mass account creation |
| Rate limit for sign-in | 10 per 5 minutes | **Fixes #1 Login Rate Limiting** |
| Rate limit for token refresh | 100 per hour | Prevents token abuse |
| Rate limit for password recovery | 5 per hour | **Fixes #12 Password Reset Abuse** |
| Rate limit for OTP verification | 5 per hour | **Fixes #3 OTP Brute Force** |

### 2.2 OTP Security (#2, #3) - REQUIRED

Go to **Authentication > Email Templates**:
- OTP codes are 6 digits by default (good)
- Set OTP expiry to 10 minutes max (reduces timing attack window)

Go to **Authentication > URL Configuration**:
- Ensure redirect URLs are whitelisted to your domains only

### 2.3 Enable CAPTCHA (Strongly Recommended)

This provides the strongest protection against automated attacks.

Go to **Authentication > Providers**:
1. Scroll to "CAPTCHA Protection"
2. Choose **Cloudflare Turnstile** (free, privacy-friendly) or hCaptcha
3. Get your site key and secret from Cloudflare/hCaptcha dashboard
4. Enable for: **Sign up, Sign in, Password Reset**

This requires client-side changes - add Turnstile widget to your auth forms.

### 2.4 Session Security

Go to **Authentication > Settings**:

| Setting | Recommended Value |
|---------|-------------------|
| JWT expiry | 3600 (1 hour) |
| Refresh token rotation | Enabled |
| Refresh token reuse interval | 10 seconds |

### 2.5 Google OAuth Security

Go to **Authentication > Providers > Google**:
- Ensure "Skip nonce check" is **disabled**
- Verify your OAuth client ID is correct

---

## Step 3: Storage Security (#4)

Go to **Storage > Settings** (or each bucket's settings):

Add response headers:
```
X-Content-Type-Options: nosniff
```

For the `avatars` bucket, also verify:
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

---

## Step 4: API Configuration (#9, #10)

### 4.1 API Settings

Go to **Settings > API**:
- Ensure "Expose PostgREST version" is **disabled**
- Keep "Max rows" limited (e.g., 1000)

### 4.2 TLS Configuration (#10)

Supabase manages TLS automatically with TLS 1.2+ enforced. Verify:
- Go to **Settings > Database > Connection pooling**
- Ensure "Require SSL" is enabled

---

## Step 5: Client-Side Configuration (#5)

### 5.1 Realtime Token Security

In your Supabase client initialization, avoid passing tokens in URLs:

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        // Token is sent in headers, not URL
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
```

The default Supabase JS client sends auth tokens in headers, not URLs. Ensure you're using v2+ of the client.

---

## Step 6: Environment Variables

Ensure these are set in production (Vercel):

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key  # Never expose to client!
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Never use these in production
# ALLOWED_ORIGINS=*  # Dangerous!
```

---

## Verification Checklist

After applying all fixes, verify:

- [ ] SQL migration ran successfully
- [ ] Rate limits configured in Supabase dashboard
- [ ] CAPTCHA enabled (recommended)
- [ ] Storage headers configured
- [ ] API version exposure disabled
- [ ] SSL/TLS required for database connections
- [ ] `ALLOWED_ORIGINS` set to specific domains (not `*`)
- [ ] Service key not exposed to client

---

## Using the New Rate Limiting in API Handlers

The middleware now provides auth rate limiting. Example usage:

```typescript
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  checkAuthRateLimit,
  clearAuthRateLimit,
  logSecurityEvent,
  getClientIp,
  createErrorResponse,
} from '../utils/api-middleware';

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return res.status(200).end();

  const supabase = createServiceClient();
  const clientIp = getClientIp(req);

  // Check rate limit before processing
  const rateLimit = await checkAuthRateLimit(supabase, clientIp, 'login');
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', rateLimit.waitSeconds.toString());

    // Log the rate limit hit
    await logSecurityEvent(supabase, 'rate_limit_hit', {
      ipAddress: clientIp,
      action: 'login',
      userAgent: req.headers['user-agent'],
    });

    return createErrorResponse(res, 429, 'rate_limited');
  }

  // ... rest of handler

  // On successful auth, clear the rate limit
  await clearAuthRateLimit(supabase, clientIp, 'login');
}
```

---

## Monitoring

Set up alerts for security events:

1. **Supabase Dashboard > Logs**: Monitor for unusual patterns
2. **Query the audit log**:
   ```sql
   SELECT event_type, COUNT(*), DATE(created_at)
   FROM security_audit_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY event_type, DATE(created_at)
   ORDER BY COUNT(*) DESC;
   ```

3. **Check rate limit blocks**:
   ```sql
   SELECT identifier, action_type, attempt_count, blocked_until
   FROM auth_rate_limits
   WHERE blocked_until > NOW()
   ORDER BY blocked_until DESC;
   ```

---

## Scheduled Cleanup

Add a cron job to clean up old rate limit records. In Supabase:

Go to **Database > Extensions** and enable `pg_cron`, then:

```sql
-- Clean up rate limits daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 3 * * *',
  $$SELECT cleanup_auth_rate_limits()$$
);

-- Clean up audit logs weekly (keeps 90 days)
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 4 * 0',
  $$SELECT cleanup_security_audit_log()$$
);
```

---

## Additional Recommendations

1. **Enable MFA**: Go to Authentication > Multi-factor Auth
2. **Review RLS Policies**: Regularly audit your Row Level Security policies
3. **API Key Rotation**: Rotate your service key periodically
4. **Backup Strategy**: Enable point-in-time recovery for your database
5. **Monitor Usage**: Set up alerts for unusual API usage patterns
