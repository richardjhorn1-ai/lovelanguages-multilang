# Supabase Dashboard Security Checklist

Complete these steps in your Supabase Dashboard to fix the remaining vulnerabilities.

**Project URL:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID

---

## Step 1: Run SQL Migration

- [ ] Go to **SQL Editor**
- [ ] Copy contents of `migrations/029_security_hardening.sql`
- [ ] Click **Run**
- [ ] Verify: "Migration 029 Complete" message appears

---

## Step 2: Auth Rate Limits (#1, #3, #12)

Go to **Authentication > Rate Limits**

| Setting | Value | Checkbox |
|---------|-------|----------|
| Rate limit for sending emails | `5` per hour | [ ] |
| Rate limit for sign-up | `10` per hour | [ ] |
| Rate limit for sign-in | `10` per 5 minutes | [ ] |
| Rate limit for token refresh | `100` per hour | [ ] |
| Rate limit for password recovery | `5` per hour | [ ] |
| Rate limit for OTP verification | `5` per hour | [ ] |

- [ ] Click **Save**

---

## Step 3: OTP Expiry (#2)

Go to **Authentication > Email Templates**

- [ ] Verify OTP expiry is set to **600 seconds** (10 minutes) or less
- [ ] If using Magic Link, set expiry to **3600 seconds** (1 hour) or less

---

## Step 4: API Version Disclosure (#9)

Go to **Settings > API**

- [ ] Find "Expose PostgREST version in headers"
- [ ] Set to **Disabled** (toggle off)
- [ ] Click **Save**

---

## Step 5: Enable CAPTCHA (Recommended)

Go to **Authentication > Providers**

- [ ] Scroll to "CAPTCHA Protection"
- [ ] Choose **Cloudflare Turnstile** (free) or hCaptcha
- [ ] Get site key from [Cloudflare Dashboard](https://dash.cloudflare.com/) > Turnstile
- [ ] Enter **Site Key**
- [ ] Enter **Secret Key**
- [ ] Enable for:
  - [ ] Sign up
  - [ ] Sign in
  - [ ] Password Reset
- [ ] Click **Save**

**Note:** CAPTCHA requires client-side integration. See [Supabase CAPTCHA docs](https://supabase.com/docs/guides/auth/auth-captcha).

---

## Step 6: Session Security (Optional but Recommended)

Go to **Authentication > Settings**

| Setting | Recommended Value | Checkbox |
|---------|-------------------|----------|
| JWT expiry | `3600` (1 hour) | [ ] |
| Refresh token rotation | Enabled | [ ] |
| Refresh token reuse interval | `10` seconds | [ ] |

- [ ] Click **Save**

---

## Step 7: Verify SSL (Already Done by Supabase)

Go to **Settings > Database**

- [ ] Verify "Require SSL" is **Enabled** (should be by default)

---

## Verification

After completing all steps:

1. [ ] Test login - should work normally
2. [ ] Try 6+ failed logins rapidly - should get rate limited
3. [ ] Check **Logs > Auth** for rate limit entries

---

## Summary

| # | Vulnerability | Fix Location | Status |
|---|--------------|--------------|--------|
| 1 | Login Rate Limiting | Step 2 | [ ] |
| 2 | OTP Timing Attack | Step 3 | [ ] |
| 3 | OTP Brute Force | Step 2 | [ ] |
| 9 | API Version Disclosure | Step 4 | [ ] |
| 12 | Password Reset Abuse | Step 2 | [ ] |

**All code fixes are already in place. Just complete this dashboard config!**
