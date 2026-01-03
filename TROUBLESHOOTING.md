# Love Languages - Troubleshooting Guide

Issues encountered during MVP to production migration and their solutions.

---

## Issue 1: Infinite Recursion in RLS Policies

**Error:**
```
Supabase error: infinite recursion detected in policy for relation "profiles"
```

**Cause:**
RLS policies that query the same table they're protecting create infinite loops.

**Bad pattern:**
```sql
CREATE POLICY "Users can view linked partner" ON profiles
  FOR SELECT USING (
    id = (SELECT linked_user_id FROM profiles WHERE id = auth.uid())
  );
```

**Solution:**
Create a `SECURITY DEFINER` function to break the recursion:

```sql
CREATE OR REPLACE FUNCTION get_linked_partner_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT linked_user_id FROM profiles WHERE id = user_uuid;
$$;

CREATE POLICY "Users can view linked partner profile" ON profiles
  FOR SELECT USING (id = get_linked_partner_id(auth.uid()));
```

---

## Issue 2: Chat Mode Case Mismatch (400 Bad Request)

**Error:**
```
POST https://xxx.supabase.co/rest/v1/chats?select=* 400 (Bad Request)
```

**Cause:**
Database schema had uppercase mode constraint (`'LISTEN', 'CHAT', 'TUTOR'`) but frontend code uses lowercase (`'listen', 'chat', 'tutor'`).

**Solution:**
```sql
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_mode_check;
ALTER TABLE chats ADD CONSTRAINT chats_mode_check CHECK (mode IN ('listen', 'chat', 'tutor'));
```

---

## Issue 3: "Please log in to continue chatting" (401 Unauthorized)

**Error:**
API returns 401, chat shows "Please log in to continue chatting"

**Cause:**
Serverless API functions couldn't read environment variables. Multiple factors:

1. `SUPABASE_SERVICE_KEY` marked as "sensitive" in Vercel excludes it from Development environment
2. `.env.local` not being read by `vercel dev`
3. Missing `SUPABASE_URL` (non-VITE prefixed) for server-side code

**Solution:**

1. Create both `.env.local` AND `.env` files with all variables
2. Include both VITE-prefixed (client) and non-prefixed (server) versions:

```env
# Client-side (VITE_ prefix exposes to browser)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side (for API routes)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

3. Restart `vercel dev` after any `.env` changes

---

## Issue 4: Vercel Project Name Validation

**Error:**
```
Error: Project names can be up to 100 characters long and must be lowercase.
```

**Cause:**
Used uppercase letters in project name (e.g., "LoveLanguages3")

**Solution:**
Use lowercase with hyphens: `love-languages`

---

## Issue 5: Sensitive Environment Variables in Development

**Error:**
```
Error: You cannot set a Sensitive Environment Variable's target to development.
```

**Cause:**
Vercel doesn't allow sensitive env vars for the Development environment.

**Solution:**
For sensitive keys (`SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`):
- Select only **Production** and **Preview** in Vercel
- Use `.env` / `.env.local` files for local development

---

## Issue 6: Email Confirmation Blocking Signups

**Symptom:**
"Check email for confirmation" but no email arrives

**Solution (for development):**
1. Supabase Dashboard → Authentication → Providers → Email
2. Turn OFF "Confirm email"
3. Re-enable for production with proper SMTP configured

---

## Environment Variables Checklist

Your `.env` and `.env.local` should contain:

```env
# Client-side
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Gemini
GEMINI_API_KEY=your-key

# CORS
ALLOWED_ORIGINS=https://lovelanguages.xyz,http://localhost:3000,http://localhost:5173
```

---

## Vercel Environment Variables

| Variable | Environments | Sensitive |
|----------|--------------|-----------|
| VITE_SUPABASE_URL | All | No |
| VITE_SUPABASE_ANON_KEY | All | No |
| SUPABASE_URL | Prod + Preview | No |
| SUPABASE_SERVICE_KEY | Prod + Preview | Yes |
| GEMINI_API_KEY | Prod + Preview | Yes |
| ALLOWED_ORIGINS | All | No |

---

## Quick Debug Commands

```bash
# Check env variable names in .env.local
cat .env.local | grep -E "^[A-Z]" | cut -d'=' -f1

# List Vercel environment variables
vercel env ls

# Restart dev server (required after env changes)
# Ctrl+C then:
vercel dev
```

---

## RLS Policies Quick Reference

If you get RLS errors, verify these policies exist:

```sql
-- Check existing policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

Required policies:
- `profiles`: SELECT, INSERT, UPDATE for own profile
- `chats`: SELECT, INSERT, UPDATE, DELETE for own chats
- `messages`: SELECT, INSERT for messages in own chats
- `dictionary`: ALL for own vocabulary
- `scores`: ALL for own scores
