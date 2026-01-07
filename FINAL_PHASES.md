# Final Phases: Deployment Readiness

**Created:** January 7, 2026
**Status:** Pre-Production
**Goal:** Production deployment with payments, security hardening, and legal compliance

---

## Table of Contents

1. [Phase 8: Codebase Integrity](#phase-8-codebase-integrity)
2. [Phase 9: Data Routing & Integration Testing](#phase-9-data-routing--integration-testing)
3. [Phase 10: Stripe Payments & Subscriptions](#phase-10-stripe-payments--subscriptions)
4. [Phase 11: Security Hardening](#phase-11-security-hardening)
5. [Phase 12: Scale Resilience](#phase-12-scale-resilience)
6. [Phase 13: Legal & Compliance](#phase-13-legal--compliance)
7. [Phase 14: Launch Checklist](#phase-14-launch-checklist)

---

## Phase 8: Codebase Integrity

### 8.1 Dead Code Removal

| File | Lines | Action | Reason |
|------|-------|--------|--------|
| `components/ListenMode.tsx` | 589 | DELETE | Functionality moved inline to ChatArea.tsx |
| `schema.sql` | 0 | DELETE | Empty file |
| `db_schema.sql` | 16 | DELETE | Empty file |
| `supabase_schema.sql` | 0 | DELETE | Empty file |

**Note:** `gladia-session.ts` and `gladia-token.ts` are now USED by the integrated Listen Mode in ChatArea.tsx.

### 8.2 TODO Cleanup

| File | Line | Current TODO | Resolution |
|------|------|--------------|------------|
| `api/chat.ts` | 493 | Legacy mode migration | Query DB for any remaining 'chat'/'tutor' modes, migrate to 'ask'/'coach', then remove code |
| `components/steps/PhotoStep.tsx` | 47 | Photo upload not implemented | Either implement Supabase Storage upload OR remove PhotoStep from onboarding |

### 8.3 Debug Flag Audit

| File | Current | Change To |
|------|---------|-----------|
| `services/live-session.ts` | `DEBUG = false` | `DEBUG = import.meta.env.DEV` |
| `services/gladia-session.ts` | `DEBUG = false` | `DEBUG = import.meta.env.DEV` |

### 8.4 Import Cleanup

```bash
# Run after removing ListenMode.tsx:
npx tsc --noEmit  # Verify no broken imports
npm run build     # Verify production build
```

### 8.5 Consistency Checks

- [ ] All components use CSS variables for theming (no hardcoded colors in dark mode)
- [ ] All API endpoints have consistent error response format
- [ ] All forms have proper validation and error display
- [ ] All buttons have loading states
- [ ] All async operations have error boundaries

---

## Phase 9: Data Routing & Integration Testing

### 9.1 API Endpoint Verification Matrix

#### Core Chat & Voice
| Endpoint | Method | Auth | RLS | Test Status |
|----------|--------|------|-----|-------------|
| `/api/chat` | POST | JWT | ✓ | [ ] Manual |
| `/api/chat-stream` | POST | JWT | ✓ | [ ] Manual |
| `/api/live-token` | POST | JWT | N/A | [ ] Manual |
| `/api/gladia-token` | POST | JWT | N/A | [ ] Manual |
| `/api/analyze-history` | POST | JWT | ✓ | [ ] Manual |

#### Level System
| Endpoint | Method | Auth | RLS | Test Status |
|----------|--------|------|-----|-------------|
| `/api/generate-level-test` | POST | JWT | ✓ | [ ] Manual |
| `/api/submit-level-test` | POST | JWT | ✓ | [ ] Manual |
| `/api/increment-xp` | POST | JWT | ✓ | [ ] Manual |
| `/api/progress-summary` | POST | JWT | ✓ | [ ] Manual |

#### Partner System
| Endpoint | Method | Auth | RLS | Test Status |
|----------|--------|------|-----|-------------|
| `/api/generate-invite` | POST | JWT | ✓ | [ ] Manual |
| `/api/validate-invite` | GET | None | N/A | [ ] Manual |
| `/api/complete-invite` | POST | JWT | ✓ | [ ] Manual |

#### Tutor Features
| Endpoint | Method | Auth | RLS | Test Status |
|----------|--------|------|-----|-------------|
| `/api/create-challenge` | POST | JWT | ✓ | [ ] Manual |
| `/api/start-challenge` | POST | JWT | ✓ | [ ] Manual |
| `/api/submit-challenge` | POST | JWT | ✓ | [ ] Manual |
| `/api/get-challenges` | GET | JWT | ✓ | [ ] Manual |
| `/api/create-word-request` | POST | JWT | ✓ | [ ] Manual |
| `/api/get-word-requests` | GET | JWT | ✓ | [ ] Manual |
| `/api/complete-word-request` | POST | JWT | ✓ | [ ] Manual |

#### Game System
| Endpoint | Method | Auth | RLS | Test Status |
|----------|--------|------|-----|-------------|
| `/api/submit-game-session` | POST | JWT | ✓ | [ ] Manual |
| `/api/get-game-history` | GET | JWT | ✓ | [ ] Manual |
| `/api/validate-answer` | POST | JWT | N/A | [ ] Manual |
| `/api/validate-word` | POST | JWT | N/A | [ ] Manual |

### 9.2 Critical User Journeys

#### Journey 1: New User Onboarding
```
1. Landing page → Sign Up
2. Email verification
3. Onboarding wizard (role selection, motivation, partner setup)
4. First chat interaction
5. First vocabulary extraction
6. Love Log verification
```

#### Journey 2: Student Daily Practice
```
1. Login
2. Chat with Cupid (Learn mode)
3. See words added to Love Log
4. Play flashcards
5. Complete AI Challenge
6. Check XP/progress
```

#### Journey 3: Tutor Sending Challenge
```
1. Login as tutor
2. Navigate to partner Progress
3. Create quiz challenge OR send Love Package
4. Verify student receives notification
5. Student completes challenge
6. Tutor sees completion
```

#### Journey 4: Voice Conversation Practice
```
1. Navigate to Play section
2. Select Conversation Practice
3. Choose scenario (e.g., Café)
4. Start voice session
5. Have conversation in Polish
6. End session, verify transcript saved
```

#### Journey 5: Listen Mode (NEW)
```
1. Click Listen button in chat header
2. Enter context label (optional)
3. Start listening
4. Speak Polish (test with audio or speech)
5. Verify transcription appears with translation
6. Bookmark phrases
7. Stop & Save
8. Verify session appears in sidebar
9. Click session to view saved transcripts
```

#### Journey 6: Level Test
```
1. Navigate to Progress
2. Click "Take Level Test"
3. Complete all questions
4. Verify score displayed
5. Check if level increased (if applicable)
6. Verify test history shows
```

### 9.3 Database Integrity Checks

```sql
-- Check for orphaned records
SELECT * FROM messages WHERE chat_id NOT IN (SELECT id FROM chats);
SELECT * FROM dictionary WHERE user_id NOT IN (SELECT id FROM profiles);
SELECT * FROM word_scores WHERE user_id NOT IN (SELECT id FROM profiles);
SELECT * FROM word_scores WHERE word_id NOT IN (SELECT id FROM dictionary);

-- Check for incomplete onboarding
SELECT id, email, role, onboarding_complete FROM profiles WHERE onboarding_complete = false;

-- Check for broken partner links
SELECT p1.id, p1.email, p1.partner_id
FROM profiles p1
WHERE p1.partner_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = p1.partner_id);
```

### 9.4 Environment Variable Checklist

| Variable | Required | Verified |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | Yes | [ ] |
| `VITE_SUPABASE_ANON_KEY` | Yes | [ ] |
| `SUPABASE_URL` | Yes | [ ] |
| `SUPABASE_SERVICE_KEY` | Yes | [ ] |
| `GEMINI_API_KEY` | Yes | [ ] |
| `GLADIA_API_KEY` | Yes | [ ] |
| `ALLOWED_ORIGINS` | Yes | [ ] |

---

## Phase 10: Stripe Payments & Subscriptions

### 10.1 Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Vercel API    │      │   Stripe        │
│   (React)       │──────│   (Serverless)  │──────│   (Payments)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Supabase      │      │   Webhook       │      │   Customer      │
│   (profiles)    │◀─────│   Handler       │◀─────│   Portal        │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 10.2 Database Schema

```sql
-- Migration: 013_subscriptions.sql

-- Subscription plans reference
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,  -- 'free', 'duo', 'family'
  name VARCHAR(100) NOT NULL,
  price_monthly_cents INT NOT NULL,
  price_yearly_cents INT NOT NULL,
  stripe_price_id_monthly VARCHAR(100),
  stripe_price_id_yearly VARCHAR(100),
  features JSONB NOT NULL,
  max_partners INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Subscription events log
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type VARCHAR(50) NOT NULL,
  stripe_event_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_monthly_cents, price_yearly_cents, features, max_partners) VALUES
('free', 'Free Trial', 0, 0, '{"word_limit": 50, "voice_minutes": 10, "ai_challenges": 3}', 0),
('duo', 'Duo', 999, 9900, '{"word_limit": null, "voice_minutes": null, "ai_challenges": null}', 1),
('family', 'Family', 1999, 19900, '{"word_limit": null, "voice_minutes": null, "ai_challenges": null}', 4);
```

### 10.3 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/create-checkout-session` | Create Stripe checkout for plan upgrade |
| `POST /api/create-customer-portal` | Generate customer portal link for subscription management |
| `POST /api/webhooks/stripe` | Handle Stripe webhook events |
| `GET /api/subscription-status` | Get current user's subscription details |

### 10.4 Feature Gating

```typescript
// services/subscription.ts

interface PlanLimits {
  wordLimit: number | null;        // null = unlimited
  voiceMinutesPerDay: number | null;
  aiChallengesPerDay: number | null;
  canInvitePartner: boolean;
  conversationScenarios: 'limited' | 'all';
  listenModeMinutes: number | null;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    wordLimit: 50,
    voiceMinutesPerDay: 10,
    aiChallengesPerDay: 3,
    canInvitePartner: false,
    conversationScenarios: 'limited',
    listenModeMinutes: 5,
  },
  duo: {
    wordLimit: null,
    voiceMinutesPerDay: null,
    aiChallengesPerDay: null,
    canInvitePartner: true,
    conversationScenarios: 'all',
    listenModeMinutes: null,
  },
  family: {
    wordLimit: null,
    voiceMinutesPerDay: null,
    aiChallengesPerDay: null,
    canInvitePartner: true, // up to 4
    conversationScenarios: 'all',
    listenModeMinutes: null,
  },
};
```

### 10.5 Pricing Strategy

#### Target Market Analysis
- **Primary:** Couples where one partner is learning the other's native language
- **Secondary:** Expats learning partner's/in-laws' language
- **Tertiary:** Language enthusiasts with romantic motivation

#### Pricing Tiers

| Plan | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| **Free** | $0 | $0 | - |
| **Duo** | $9.99 | $99/yr | 17% |
| **Family** | $19.99 | $199/yr | 17% |

#### Free Tier Limits (Try Before Buy)
- 50 words in Love Log
- 10 minutes voice/day
- 3 AI challenges/day
- 5 minutes listen mode/day
- No partner invite
- 3 conversation scenarios

#### Duo Tier (Core Product)
- Unlimited words
- Unlimited voice & listen
- Unlimited AI challenges
- Partner invite (1 partner)
- All 8+ conversation scenarios
- Priority support

#### Family Tier (Premium)
- Everything in Duo
- Up to 4 learning partners
- Family progress dashboard
- Gift subscriptions

### 10.6 Sales Page Copy

#### Hero Section
```
# Learn Polish for the One You Love 💕

The only language app built for couples. Turn every word
into a gift for your partner.

[Start Free Trial] [See Pricing]
```

#### Value Propositions
```
## Why Couples Choose Love Languages

🎯 **Purpose-Driven Learning**
   Every word you learn is a step closer to your partner's heart.
   No random vocabulary—only phrases that matter.

💬 **Real Conversations**
   Practice ordering coffee, meeting the in-laws, or whispering
   sweet nothings. 8 curated scenarios + custom situations.

👂 **Listen & Learn Together**
   Capture real conversations with live translation.
   Dinner at Babcia's? Now you'll understand every word.

🎮 **Learn Through Play**
   Flashcards, quizzes, AI challenges tailored to YOUR weak spots.
   Your partner can even send you surprise challenges.

📊 **Celebrate Together**
   Share progress, hit milestones together, and watch your
   vocabulary garden grow—together.
```

#### Testimonials (Template)
```
"I can finally understand what my mother-in-law says about me."
— Sarah, learning Polish for 3 months

"My boyfriend tears up every time I say 'kocham cię' correctly."
— Mike, Duo subscriber
```

#### FAQ Section
```
**Is this just for Polish?**
We're starting with Polish because it's one of the hardest
languages for English speakers—and because love knows no
linguistic barriers. More languages coming in 2027.

**What if my partner doesn't want to be a tutor?**
No problem! The AI is a fully capable teacher. The partner
dashboard is optional—you can learn solo too.

**Can I cancel anytime?**
Yes, cancel with one click. No questions, no guilt trips.
We'd miss you, though. 💔
```

### 10.7 Implementation Checklist

- [ ] Create Stripe account and products
- [ ] Add `stripe` npm package
- [ ] Create `/api/create-checkout-session`
- [ ] Create `/api/webhooks/stripe` with signature verification
- [ ] Create `/api/create-customer-portal`
- [ ] Create `/api/subscription-status`
- [ ] Run migration 013
- [ ] Add subscription check middleware to gated features
- [ ] Build pricing page component
- [ ] Build upgrade prompts when hitting limits
- [ ] Test webhook flow end-to-end
- [ ] Test subscription lifecycle (create → upgrade → cancel → renew)

---

## Phase 11: Security Hardening

### 11.1 Rate Limiting

**Current State:** No rate limiting implemented.

#### Implementation Strategy

```typescript
// api/lib/rateLimit.ts (copy into each API file due to Vercel bundling)

interface RateLimitConfig {
  windowMs: number;      // Time window
  maxRequests: number;   // Max requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'chat': { windowMs: 60000, maxRequests: 30 },           // 30/min
  'live-token': { windowMs: 60000, maxRequests: 5 },      // 5/min (expensive)
  'gladia-token': { windowMs: 60000, maxRequests: 5 },    // 5/min (expensive)
  'generate-level-test': { windowMs: 3600000, maxRequests: 3 }, // 3/hr
  'analyze-history': { windowMs: 3600000, maxRequests: 10 },    // 10/hr
  'default': { windowMs: 60000, maxRequests: 60 },        // 60/min
};
```

**Implementation Options:**

1. **Upstash Redis** (Recommended)
   - Serverless Redis for rate limiting
   - `@upstash/ratelimit` package
   - ~$0.20 per 100K requests

2. **Vercel KV**
   - Built-in if on Vercel Pro
   - Simple key-value store

3. **Supabase Edge Functions**
   - Move rate limiting to edge
   - Use Supabase's built-in throttling

#### Priority Endpoints for Rate Limiting

| Endpoint | Priority | Reason |
|----------|----------|--------|
| `/api/live-token` | CRITICAL | Gemini API costs |
| `/api/gladia-token` | CRITICAL | Gladia API costs |
| `/api/chat` | HIGH | Gemini API costs |
| `/api/analyze-history` | HIGH | Heavy processing |
| `/api/generate-level-test` | HIGH | AI generation |
| `/api/validate-word` | MEDIUM | AI validation |
| All others | LOW | Standard protection |

### 11.2 Row-Level Security Audit

#### Current RLS Policies (Verify in Supabase)

```sql
-- Profiles: Users can only read/write their own profile + partner's read-only
-- Dictionary: Users can only read/write their own words
-- Messages: Users can only read/write messages in their own chats
-- Chats: Users can only read/write their own chats
-- Word_scores: Users can only read/write their own scores
-- Listen_sessions: Users can only read/write their own sessions
-- Tutor_challenges: Tutors can create, students can read their own
```

#### RLS Checklist

- [ ] `profiles` - Verify partner read access is limited
- [ ] `dictionary` - No cross-user access
- [ ] `messages` - Verify chat ownership check
- [ ] `chats` - User isolation confirmed
- [ ] `word_scores` - User isolation confirmed
- [ ] `listen_sessions` - User isolation confirmed
- [ ] `level_tests` - User isolation confirmed
- [ ] `tutor_challenges` - Verify tutor→student flow only
- [ ] `game_sessions` - User isolation confirmed
- [ ] `invite_tokens` - Verify token consumption rules

#### Testing RLS

```sql
-- Test as a specific user
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "USER_UUID_HERE"}';

-- Try to access another user's data (should return empty)
SELECT * FROM dictionary WHERE user_id != 'USER_UUID_HERE';
```

### 11.3 Input Validation & Sanitization

#### Current State
- Basic validation in some endpoints
- No centralized sanitization

#### Required Improvements

```typescript
// Sanitize all user inputs
function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 10000)  // Max length
    .replace(/[<>]/g, '');  // Basic XSS prevention
}

// Validate UUIDs
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Validate email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 11.4 Linting Setup

**Current State:** No ESLint configured.

#### Implementation

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
```

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/react-in-jsx-scope': 'off',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
  },
  settings: {
    react: { version: 'detect' },
  },
};
```

### 11.5 Logging Strategy

#### Current State
- `console.log` scattered throughout
- Debug flags control verbose output
- No structured logging

#### Production Logging Plan

```typescript
// services/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

function log(level: LogLevel, message: string, meta?: Partial<LogEntry>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
    // TODO: Send to error tracking service (Sentry, LogRocket)
  } else if (import.meta.env.PROD && level === 'debug') {
    return; // Skip debug in production
  } else {
    console.log(JSON.stringify(entry));
  }
}
```

#### What to Log

| Event | Level | Include |
|-------|-------|---------|
| API request start | debug | endpoint, userId |
| API request complete | info | endpoint, duration, status |
| API error | error | endpoint, error message, stack |
| Auth failure | warn | endpoint, reason |
| Rate limit hit | warn | endpoint, userId, IP |
| Subscription change | info | userId, plan, action |
| Level up | info | userId, newLevel |

### 11.6 Secret Management

#### Current State
- Secrets in `.env` files
- `.env.example` template provided

#### Production Improvements

- [ ] Use Vercel Environment Variables (encrypted at rest)
- [ ] Rotate `SUPABASE_SERVICE_KEY` every 90 days
- [ ] Rotate `GEMINI_API_KEY` every 90 days
- [ ] Separate API keys per environment (dev/staging/prod)
- [ ] Never log secrets (audit console.log statements)

---

## Phase 12: Scale Resilience

### 12.1 What Breaks First (Priority Order)

#### 1. 🔴 CRITICAL: Gemini API Rate Limits & Costs

**Symptom:** 429 errors, escalating bills

**Current Risk:**
- No rate limiting on frontend
- Each voice session holds connection open
- Streaming uses more tokens than expected

**Mitigation:**
- [ ] Implement per-user rate limits (5 voice sessions/hour)
- [ ] Add cost tracking per user
- [ ] Set up billing alerts at $100, $500, $1000/day
- [ ] Cache common responses (greetings, corrections)

#### 2. 🔴 CRITICAL: Gladia API Rate Limits & Costs

**Symptom:** Listen mode failures, bills spike

**Mitigation:**
- [ ] Per-user listen minutes quota (tied to plan)
- [ ] Auto-stop sessions after 30 minutes
- [ ] Track usage per user

#### 3. 🟠 HIGH: Supabase Connection Limits

**Symptom:** Database connection errors, timeouts

**Current Risk:**
- Free tier: 50 connections
- Pro tier: 100 connections
- Each serverless function creates new connection

**Mitigation:**
- [ ] Use connection pooler (PgBouncer via Supabase)
- [ ] Optimize queries (add indexes)
- [ ] Add connection retry logic

#### 4. 🟠 HIGH: Vercel Serverless Cold Starts

**Symptom:** Slow first requests, timeouts on voice token

**Mitigation:**
- [ ] Use Vercel Edge Functions for critical paths
- [ ] Warm up functions with cron (Vercel cron.json)
- [ ] Reduce bundle size

#### 5. 🟡 MEDIUM: Vocabulary Extraction Bottleneck

**Symptom:** Slow chat responses, extraction failures

**Current Risk:**
- Every chat response triggers Gemini vocabulary extraction
- No caching of extraction results

**Mitigation:**
- [ ] Queue extractions instead of inline
- [ ] Batch extraction for voice sessions
- [ ] Cache common word lookups

#### 6. 🟡 MEDIUM: Frontend Bundle Size

**Symptom:** Slow initial load, poor mobile experience

**Current State:**
- 1,081 KB bundle (before gzip: 249 KB)
- Above 500KB warning threshold

**Mitigation:**
- [ ] Code split by route
- [ ] Lazy load heavy components (FlashcardGame, ConversationPractice)
- [ ] Tree-shake unused code

### 12.2 Scaling Thresholds

| Metric | Current Limit | Action Trigger | Response |
|--------|---------------|----------------|----------|
| Daily Active Users | ~100 | 500 DAU | Add caching layer |
| Concurrent Voice Sessions | 10 | 50 concurrent | Queue system |
| DB Connections | 50 | 40 sustained | Upgrade to Pro |
| Gemini Requests/min | 60 | 50/min | Rate limit users |
| Monthly Costs | $50 | $500/mo | Enforce plan limits |

### 12.3 Monitoring Setup

#### Recommended Stack
- **Vercel Analytics** - Frontend performance, Web Vitals
- **Sentry** - Error tracking, session replay
- **Supabase Dashboard** - Database metrics, RLS failures
- **Google Cloud Console** - Gemini API usage
- **Gladia Dashboard** - Speech-to-text usage

#### Key Alerts to Configure

| Alert | Threshold | Priority |
|-------|-----------|----------|
| API Error Rate | >5% | P1 |
| Gemini 429 Errors | >10/hour | P1 |
| DB Connection Errors | >5/hour | P1 |
| Supabase Auth Failures | >20/hour | P2 |
| Bundle Size Increase | >1.2MB | P3 |
| Average Response Time | >3s | P2 |

---

## Phase 13: Legal & Compliance

### 13.1 Privacy Policy

**Location:** `/privacy` route, `pages/Privacy.tsx`

#### Required Sections

1. **Data Collection**
   - Account information (email, name, avatar)
   - Learning data (vocabulary, progress, chat history)
   - Voice data (transcriptions, not raw audio)
   - Usage data (analytics, feature usage)

2. **Data Usage**
   - Personalize learning experience
   - Improve AI recommendations
   - Process payments (Stripe)
   - Communicate updates

3. **Data Sharing**
   - Supabase (database hosting)
   - Google/Gemini (AI processing)
   - Gladia (speech-to-text)
   - Stripe (payments)
   - Partner (if connected)

4. **Data Retention**
   - Account data: Until deletion requested
   - Chat history: 1 year
   - Voice transcripts: 30 days
   - Payment records: As required by law

5. **User Rights (GDPR/CCPA)**
   - Right to access
   - Right to rectification
   - Right to erasure
   - Right to portability
   - Right to object

6. **Security Measures**
   - Encryption in transit (TLS)
   - Encryption at rest (Supabase)
   - Row-level security
   - Regular security audits

### 13.2 Terms of Service

**Location:** `/terms` route, `pages/Terms.tsx`

#### Required Sections

1. **Acceptance of Terms**
2. **Account Registration**
   - Age requirement (13+, or 16+ in EU)
   - Accurate information
   - Password security
3. **Subscription & Billing**
   - Plan features
   - Payment processing
   - Cancellation policy
   - Refund policy
4. **Acceptable Use**
   - No harassment
   - No illegal content
   - No reverse engineering
5. **Intellectual Property**
   - Our content
   - Your content (vocabulary, chats)
6. **Disclaimers**
   - AI limitations
   - Learning outcomes not guaranteed
7. **Limitation of Liability**
8. **Termination**
9. **Governing Law**

### 13.3 GDPR Compliance

#### Data Subject Rights Implementation

| Right | Implementation |
|-------|----------------|
| Access | Export data button in Profile settings |
| Rectification | Edit profile, edit vocabulary |
| Erasure | Delete account button (with confirmation) |
| Portability | Export as JSON/CSV |
| Object | Unsubscribe from marketing emails |

#### Technical Requirements

- [ ] Cookie consent banner (if using analytics cookies)
- [ ] Data export endpoint (`/api/export-user-data`)
- [ ] Account deletion endpoint (`/api/delete-account`)
- [ ] Partner notification on account deletion
- [ ] Data processing agreements with subprocessors

### 13.4 Cookie Policy

**Required if using:**
- Analytics (Vercel Analytics, Google Analytics)
- Session cookies (Supabase Auth)
- Marketing pixels

#### Implementation

```typescript
// components/CookieConsent.tsx
- Show on first visit
- Allow accept all / reject non-essential
- Store preference in localStorage
- Block analytics until consent
```

### 13.5 Implementation Checklist

- [ ] Write Privacy Policy document
- [ ] Write Terms of Service document
- [ ] Create `/privacy` page
- [ ] Create `/terms` page
- [ ] Add links to footer
- [ ] Add checkbox to signup form ("I agree to Terms and Privacy Policy")
- [ ] Build data export endpoint
- [ ] Build account deletion endpoint
- [ ] Add cookie consent banner (if needed)
- [ ] Create Data Processing Agreement for B2B (if applicable)

---

## Phase 14: Launch Checklist

### 14.1 Pre-Launch (T-7 Days)

#### Code
- [ ] All Phase 8 cleanup complete
- [ ] All Phase 9 tests passing
- [ ] Production build successful
- [ ] No TypeScript errors
- [ ] ESLint passing

#### Infrastructure
- [ ] Vercel production environment configured
- [ ] All environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Supabase production project ready

#### Payments
- [ ] Stripe production account active
- [ ] Webhook endpoint verified
- [ ] Test subscription lifecycle complete
- [ ] Pricing page live

#### Security
- [ ] Rate limiting active on critical endpoints
- [ ] RLS policies verified
- [ ] Secrets rotated
- [ ] Security headers configured

#### Legal
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie consent (if needed)
- [ ] Contact email configured

### 14.2 Launch Day (T-0)

#### Morning
- [ ] Deploy production build
- [ ] Verify all API endpoints responding
- [ ] Test signup flow end-to-end
- [ ] Test payment flow end-to-end
- [ ] Monitor error rates

#### Afternoon
- [ ] Announce launch (social, email)
- [ ] Monitor Sentry for errors
- [ ] Monitor API costs
- [ ] Respond to early user feedback

### 14.3 Post-Launch (T+1 to T+7)

#### Daily
- [ ] Review error logs
- [ ] Check API costs
- [ ] Monitor user signups
- [ ] Respond to support emails

#### Weekly
- [ ] Analyze user behavior
- [ ] Identify friction points
- [ ] Prioritize bug fixes
- [ ] Plan iteration

---

## Appendix A: File Changes Since Last Checkpoint

### Modified Files (January 6-7, 2026)

| File | Changes |
|------|---------|
| `services/gladia-session.ts` | Added translation merging (pendingTranscripts Map, handleTranslation method) |
| `components/ChatArea.tsx` | Integrated Listen Mode inline (sidebar, recording UI, session viewing) |
| `api/gladia-token.ts` | Removed unsupported diarization parameters |
| `services/live-session.ts` | Set DEBUG = false |

### New Functionality

1. **Listen Mode Integration**
   - Listen sessions appear in sidebar alongside chats
   - Recording with live Polish transcription + English translation
   - Session saving and viewing
   - Phrase bookmarking

2. **Translation Fix**
   - Gladia translations now properly merged with transcripts
   - 800ms timeout for translation arrival
   - Fallback to transcript-only if no translation

---

## Appendix B: Quick Reference

### Critical API Endpoints

| Endpoint | Max Latency | Rate Limit |
|----------|-------------|------------|
| `/api/live-token` | 2s | 5/min |
| `/api/gladia-token` | 2s | 5/min |
| `/api/chat` | 5s | 30/min |
| `/api/generate-level-test` | 10s | 3/hr |

### Key Monitoring Metrics

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | 2% | 5% |
| P95 Latency | 3s | 10s |
| Daily API Cost | $50 | $200 |
| Active Connections | 40 | 48 |

### Support Contact

- Technical Issues: [support@lovelanguages.xyz]
- Security Reports: [security@lovelanguages.xyz]
- Business Inquiries: [hello@lovelanguages.xyz]
