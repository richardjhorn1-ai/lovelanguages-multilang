# SETUP.md - Fresh Environment Setup Guide

This guide covers setting up the Love Languages multi-language app from scratch.

## Prerequisites

- Node.js 18+
- npm or yarn
- Vercel CLI (`npm i -g vercel`)
- Stripe CLI (for payment testing)
- A Supabase account
- Google Cloud account (for Gemini API)
- Gladia account (for transcription)

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd L.L.3.0
npm install
```

---

## 2. Supabase Project Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and keys from Settings > API:
   - **Project URL** (e.g., `https://abcd1234.supabase.co`)
   - **anon public key** (safe for client)
   - **service_role key** (server-side only, keep secret!)

### Enable Auth
1. Go to Authentication > Providers
2. Enable **Email** provider
3. (Optional) Configure email templates in Authentication > Email Templates

### Run Database Migrations

Run these SQL files in order in the Supabase SQL Editor (Database > SQL Editor):

**For a fresh database, start with the base schema:**
```
migrations/000_base_schema.sql                # Creates ALL tables for fresh database
```

**For existing databases, run incremental migrations:**
```
migrations/001_add_vocabulary_tracking.sql    # Core profiles, dictionary, word_scores
migrations/002_xp_level_system.sql            # XP and level tracking
migrations/003_progress_summaries.sql         # Progress summary storage
migrations/004_invite_tokens.sql              # Partner invite system
migrations/005_tutor_challenges.sql           # Tutor challenge tables
migrations/006_onboarding.sql                 # Onboarding flow fields
migrations/007_theme_settings.sql             # Theme preferences
migrations/008_game_sessions.sql              # Game session tracking
migrations/009_progress_summary_title.sql     # Title field for summaries
migrations/010_smart_validation.sql           # Smart validation setting
migrations/011_answer_explanations.sql        # Answer explanation storage
migrations/012_listen_sessions.sql            # Listen mode transcripts
migrations/013_add_admin_flag.sql             # Admin user flag
migrations/013_tts_cache_storage.sql          # TTS audio caching
migrations/014_article_generations.sql        # Article generation tracking
migrations/014_subscriptions.sql              # Stripe subscription fields
migrations/015_couple_subscription.sql        # Couple subscription sharing
migrations/017_fix_profiles_rls_recursion.sql # RLS policy fix
migrations/018_avatar_storage.sql             # Avatar upload bucket
migrations/022_bug_reports.sql                # Bug report table
migrations/023_multilanguage_support.sql      # Multi-language columns
```

**Important:**
- For fresh databases: Run `000_base_schema.sql` ONLY (it includes everything)
- For existing databases: Run migrations in order starting from where you left off

### Storage Buckets
After running migrations, verify these storage buckets exist:
- `avatars` - User profile pictures
- `tts-cache` - Cached TTS audio files

If not created automatically, create them in Storage > New Bucket.

---

## 3. API Keys

### Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create API key
3. Enable "Generative Language API" in your Google Cloud console

### Gladia API (Transcription)
1. Sign up at [gladia.io](https://gladia.io)
2. Get API key from dashboard
3. Used for Listen Mode and voice transcription

### Stripe (Payments)
1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from Developers > API keys:
   - **Publishable key** (client-side)
   - **Secret key** (server-side)
3. Create webhook endpoint in Developers > Webhooks:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
4. Note the **Webhook signing secret**
5. Create Products and Prices in Product catalog:
   - Standard Monthly/Yearly
   - Unlimited Monthly/Yearly
   - Note each Price ID

---

## 4. Environment Variables

### Local Development (`.env.local`)

Create `.env.local` in project root:

```env
# Supabase - Client Side
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Supabase - Server Side
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-key

# Google Gemini
GEMINI_API_KEY=AI...your-gemini-key

# Gladia (Transcription)
GLADIA_API_KEY=...your-gladia-key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# App URL (for invite links)
APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STANDARD_MONTHLY=price_...
STRIPE_PRICE_STANDARD_YEARLY=price_...
STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
STRIPE_PRICE_UNLIMITED_YEARLY=price_...
```

### Production (Vercel)

Add the same variables in Vercel Project Settings > Environment Variables.

**Production differences:**
- `ALLOWED_ORIGINS` = your production domain(s)
- `APP_URL` = your production URL
- Use Stripe live keys instead of test keys

---

## 5. Local Development

### Frontend Only (No API)
```bash
npm run dev
# Opens http://localhost:5173
# API calls will fail - use for UI development only
```

### Full Stack (Recommended)
```bash
vercel dev
# Opens http://localhost:3000
# Frontend + serverless functions work
```

### Type Checking
```bash
npx tsc --noEmit
# Run before every commit
```

### Production Build Test
```bash
npm run build
npm run preview
```

---

## 6. Stripe Webhook Testing

For local Stripe webhook testing:

```bash
# Terminal 1: Run app
vercel dev

# Terminal 2: Forward Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

---

## 7. Verification Checklist

After setup, verify everything works:

### Database
- [ ] Can create a new user account
- [ ] Profile created in `profiles` table
- [ ] Can add words to `dictionary` table

### Authentication
- [ ] Sign up with email works
- [ ] Sign in works
- [ ] Email verification (if enabled)

### API Endpoints
```bash
# Test auth-required endpoint (should return 401)
curl http://localhost:3000/api/chat

# Test health (if implemented)
curl http://localhost:3000/api/health
```

### Frontend
- [ ] Chat tab loads
- [ ] Love Log tab loads
- [ ] Play tab loads
- [ ] Progress tab loads

### Voice Features
- [ ] Voice mode connects (requires GEMINI_API_KEY)
- [ ] Listen mode connects (requires GLADIA_API_KEY)

### Payments
- [ ] Checkout flow works (Stripe test mode)
- [ ] Webhooks received (check Stripe dashboard)

---

## 8. Multi-Language Configuration

The app supports 18 languages. Language configuration is in:

| File | Purpose |
|------|---------|
| `constants/language-config.ts` | Language metadata, grammar features, TTS codes |
| `utils/prompt-templates.ts` | AI prompt templates (language-agnostic) |
| `utils/schema-builders.ts` | Dynamic JSON schemas per language |
| `utils/language-helpers.ts` | API utilities for language extraction |

### Default Languages
- **Target Language (learning):** Polish (`pl`)
- **Native Language (explanations):** English (`en`)

These defaults are for backward compatibility with the original Polish-only version.

### Adding New Users
When onboarding, users select:
1. Their **native language** (what they speak)
2. Their **target language** (what they're learning)

The app stores these in `profiles.native_language` and `profiles.active_language`.

---

## 9. Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection errors
- Check `SUPABASE_URL` has `https://` prefix
- Verify keys are from correct project
- Check RLS policies allow access

### Gemini API errors
- Verify API key is valid
- Check quota/billing in Google Cloud console
- Ensure "Generative Language API" is enabled

### Stripe webhook errors
- Check webhook signing secret matches
- Verify webhook URL is accessible
- Check Stripe dashboard for failed events

### TypeScript errors
```bash
npx tsc --noEmit
# Fix all errors before proceeding
```

---

## 10. Deployment

### Vercel (Recommended)
1. Connect repo to Vercel
2. Add all environment variables
3. Deploy

### Manual
```bash
vercel --prod
```

### Post-Deployment
1. Update `ALLOWED_ORIGINS` with production domain
2. Update `APP_URL` with production URL
3. Switch Stripe to live keys
4. Configure production webhook endpoint in Stripe

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend dev server (5173) |
| `vercel dev` | Full stack local dev (3000) |
| `npm run build` | Production build |
| `npx tsc --noEmit` | Type check |
| `stripe listen --forward-to localhost:3000/api/webhooks/stripe` | Local webhook testing |

| Key File | Purpose |
|----------|---------|
| `CLAUDE.md` | Developer guidance |
| `SETUP.md` | This file |
| `ML_MASTER_PLAN.md` | Architecture source of truth |
| `TROUBLESHOOTING.md` | 36+ solved issues |

---

*Last updated: January 20, 2026*
