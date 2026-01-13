# Backend Architecture

Complete technical reference for Love Languages backend systems.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                         │
│   ChatArea │ LoveLog │ FlashcardGame │ Progress │ LevelTest │ Partner   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Authorization: Bearer {JWT}
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS API GATEWAY                        │
│                         39 endpoints in /api/                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Middleware: CORS → Auth → Subscription → Rate Limit → Handler  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   GEMINI AI   │       │   SUPABASE    │       │    STRIPE     │
│  gemini-2.0   │       │  PostgreSQL   │       │   Payments    │
│  flash-lite   │       │  + Auth + RT  │       │  Webhooks     │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│    GLADIA     │       │ GOOGLE CLOUD  │
│  Speech-to-   │       │  Text-to-     │
│    Text       │       │   Speech      │
└───────────────┘       └───────────────┘
```

---

## API Endpoints Map

### Authentication & Session

```
┌─────────────────────────────────────────────────────────┐
│                    AUTH FLOW                            │
│                                                         │
│  Supabase Auth ──► JWT Token ──► API Request            │
│                                      │                  │
│                                      ▼                  │
│                              verifyAuth()               │
│                                      │                  │
│                    ┌─────────────────┼─────────────────┐│
│                    ▼                 ▼                 ▼│
│             requireSubscription  checkRateLimit  handler│
└─────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `boot-session` | Load user context (vocab, stats, partner) | Yes |
| `switch-language` | Change active target language | Yes |
| `delete-account` | Delete account + Stripe cancel | Yes |
| `export-user-data` | GDPR data export | Yes |

### Chat & AI Learning

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHAT FLOW                                    │
│                                                                     │
│  User Message                                                       │
│       │                                                             │
│       ▼                                                             │
│  POST /api/chat ──────────────────────────────────────┐            │
│       │                                               │            │
│       ▼                                               ▼            │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │ Build       │    │ Call Gemini  │    │ Extract Vocabulary  │   │
│  │ System      │───►│ with Schema  │───►│ from Response       │   │
│  │ Prompt      │    │              │    │                     │   │
│  └─────────────┘    └──────────────┘    └─────────────────────┘   │
│       │                                               │            │
│       │              prompt-templates.ts              │            │
│       │              schema-builders.ts               ▼            │
│       │                                    ┌─────────────────────┐ │
│       │                                    │ Store in dictionary │ │
│       │                                    │ Dispatch event      │ │
│       │                                    └─────────────────────┘ │
│       ▼                                               │            │
│  Return { replyText, newWords[] }◄────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `chat` | Main AI chat (Ask/Learn/Coach modes) | 5000/mo |
| `chat-stream` | Streaming chat via SSE | 5000/mo |
| `analyze-history` | Extract vocab from message history | 2000/mo |
| `progress-summary` | Generate learning diary entries | 500/mo |

### Vocabulary & Validation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VALIDATION FLOW                                  │
│                                                                     │
│  User Answer                                                        │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    LOCAL VALIDATION                          │   │
│  │  1. Exact match                                              │   │
│  │  2. Diacritic normalization (ą→a, ż→z)                       │   │
│  │  3. Case insensitive                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       │ No match + Smart Validation enabled                         │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AI VALIDATION (Gemini)                    │   │
│  │  - Synonym detection ("happy" ≈ "joyful")                    │   │
│  │  - Typo tolerance ("kocham" ≈ "kochma")                      │   │
│  │  - Article flexibility ("der Hund" ≈ "Hund")                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  Return { isCorrect, matchType, explanation }                       │
└─────────────────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `validate-word` | Validate pronunciation/gender/conjugations | 2000/mo |
| `validate-answer` | Batch smart validation for exercises | 3000/mo |

### Partner Features

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PARTNER INVITE FLOW                              │
│                                                                     │
│  Student                              Tutor                         │
│     │                                   │                           │
│     │ POST /api/generate-invite         │                           │
│     ├──────────────────────────────────►│                           │
│     │       { token, expiresAt }        │                           │
│     │                                   │                           │
│     │         Email with link           │                           │
│     │◄──────────────────────────────────┤                           │
│     │                                   │                           │
│     │                    GET /api/validate-invite                   │
│     │                                   ├───────────────────────►   │
│     │                                   │   { inviter, language }   │
│     │                                   │                           │
│     │                    POST /api/complete-invite                  │
│     │                                   ├───────────────────────►   │
│     │                                   │                           │
│     │◄─────── profiles.linked_user_id ──┼───────────────────────►   │
│     │              (bidirectional)      │                           │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORD GIFT FLOW                                   │
│                                                                     │
│  Tutor                                Student                       │
│     │                                   │                           │
│     │ POST /api/create-word-request     │                           │
│     │ { requestType: 'ai_topic',        │                           │
│     │   inputText: 'cooking words' }    │                           │
│     ├───────────────────────────────────┤                           │
│     │      Gemini: light preview        │                           │
│     │      Return: ai_suggestions[]     │                           │
│     │                                   │                           │
│     │ Tutor selects words to gift       │                           │
│     │                                   │                           │
│     │ POST /api/complete-word-request   │                           │
│     │ { selectedWords[] }               │                           │
│     ├───────────────────────────────────┤                           │
│     │      Gemini: full enrichment      │                           │
│     │      (conjugations, examples)     │                           │
│     │                                   │                           │
│     │         Notification ─────────────┼──────────────────────►    │
│     │                                   │   WordGiftLearning.tsx    │
│     │                                   │   2x XP multiplier        │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHALLENGE FLOW                                   │
│                                                                     │
│  Tutor                                Student                       │
│     │                                   │                           │
│     │ POST /api/create-challenge        │                           │
│     │ { type: 'quiz', wordIds[] }       │                           │
│     ├───────────────────────────────────┤                           │
│     │                                   │                           │
│     │         Notification ─────────────┼──────────────────────►    │
│     │                                   │                           │
│     │                    POST /api/start-challenge                  │
│     │                                   ├───────────────────────►   │
│     │                                   │                           │
│     │                    POST /api/submit-challenge                 │
│     │                                   ├───────────────────────►   │
│     │                                   │   { answers[], time }     │
│     │                                   │                           │
│     │◄────── Notification ──────────────┤   XP awarded              │
│     │        (score, results)           │   word_scores updated     │
└─────────────────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `generate-invite` | Create partner invite link | 10-20/mo |
| `validate-invite` | Check invite token validity | - |
| `complete-invite` | Accept invite, link accounts | - |
| `delink-partner` | Unlink from partner | - |
| `create-word-request` | Tutor sends word gift | 200/mo |
| `complete-word-request` | Enrich and deliver words | 200/mo |
| `get-word-requests` | Fetch pending word gifts | - |
| `create-challenge` | Create quiz/whisper/quickfire | 200/mo |
| `start-challenge` | Begin challenge attempt | - |
| `submit-challenge` | Submit answers | 500/mo |
| `get-challenges` | Fetch challenges | - |

### Level Testing & XP

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LEVEL TEST FLOW                                  │
│                                                                     │
│  User reaches XP threshold                                          │
│       │                                                             │
│       ▼                                                             │
│  POST /api/generate-level-test                                      │
│  { fromLevel: 'Beginner 1', toLevel: 'Beginner 2' }                │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Build Test Questions                                        │   │
│  │  - 40% standardized (theme-based)                            │   │
│  │  - 60% from user's vocabulary                                │   │
│  │  - Question types: translate, fill-blank, conjugate          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  User takes test (20-40 questions)                                  │
│       │                                                             │
│       ▼                                                             │
│  POST /api/submit-level-test { answers[] }                          │
│       │                                                             │
│       ├──────────────────┬──────────────────┐                       │
│       ▼                  ▼                  ▼                       │
│  Score >= 80%       Score < 80%        Unlock Tenses               │
│  ┌─────────┐        ┌─────────┐        ┌─────────────┐             │
│  │ PASSED  │        │ FAILED  │        │ Level 4+:   │             │
│  │ Level++ │        │ Try     │        │ Past tense  │             │
│  │ XP++    │        │ again   │        │ Level 7+:   │             │
│  └─────────┘        └─────────┘        │ Future      │             │
│                                        └─────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `generate-level-test` | Create level-up test | 50/mo |
| `submit-level-test` | Submit and check pass/fail | 100/mo |
| `unlock-tense` | Unlock past/future conjugations | - |
| `increment-xp` | Award XP for activities | - |

### Voice & Listening

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LISTEN MODE FLOW                                 │
│                                                                     │
│  User enables Listen Mode                                           │
│       │                                                             │
│       ▼                                                             │
│  POST /api/gladia-token ──► Get Gladia WebSocket token              │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  WebSocket Connection (gladia-session.ts)                    │   │
│  │  - Real-time speech-to-text                                  │   │
│  │  - Transcript with timestamps                                │   │
│  │  - Speaker detection                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  POST /api/process-transcript                                       │
│  { transcript[] }                                                   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Gemini AI Processing                                        │   │
│  │  - Fix transcription errors                                  │   │
│  │  - Translate to native language                              │   │
│  │  - Extract vocabulary                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `live-token` | WebRTC token for voice chat | 20/mo |
| `gladia-token` | Speech-to-text token | 40/mo |
| `process-transcript` | AI processing of transcripts | 200/mo |
| `tts` | Text-to-speech (Google Cloud) | - |

### Payments & Subscriptions

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION FLOW                                │
│                                                                     │
│  User clicks Subscribe                                              │
│       │                                                             │
│       ▼                                                             │
│  POST /api/create-checkout-session                                  │
│  { plan: 'standard' | 'unlimited', period: 'monthly' | 'yearly' }  │
│       │                                                             │
│       ▼                                                             │
│  Redirect to Stripe Checkout ──► Payment ──► Webhook                │
│                                                    │                │
│                                                    ▼                │
│                                    POST /api/webhooks/stripe        │
│                                    ┌─────────────────────────┐      │
│                                    │ Update profiles:        │      │
│                                    │ - subscription_plan     │      │
│                                    │ - subscription_status   │      │
│                                    │ - subscription_period   │      │
│                                    │ - stripe_customer_id    │      │
│                                    └─────────────────────────┘      │
│                                                    │                │
│                                                    ▼                │
│                                    If has partner:                  │
│                                    Grant partner free access        │
│                                    (subscription_granted_by)        │
└─────────────────────────────────────────────────────────────────────┘
```

| Endpoint | Purpose |
|----------|---------|
| `create-checkout-session` | Start Stripe checkout |
| `create-customer-portal` | Stripe billing portal |
| `subscription-status` | Check subscription |
| `webhooks/stripe` | Handle Stripe events |

---

## Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROFILES                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID)              │ FK to auth.users                           │
│ name, email            │ Basic info                                 │
│ role                   │ 'student' | 'tutor'                        │
│ linked_user_id         │ Bidirectional partner link                 │
│ xp, level              │ Progress (level 1-18)                      │
│ native_language        │ e.g., 'en'                                 │
│ active_language        │ Current target, e.g., 'pl'                 │
│ languages[]            │ All unlocked languages                     │
│ subscription_plan      │ 'standard' | 'unlimited' | null            │
│ subscription_status    │ 'active' | 'cancelled' | null              │
│ subscription_granted_by│ Partner's subscription ID                  │
│ onboarding_data        │ JSONB: vibe, why, fears, preferences       │
│ smart_validation       │ AI-powered answer checking                 │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 1:many
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DICTIONARY                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID)              │ Primary key                                │
│ user_id                │ FK to profiles                             │
│ language_code          │ Target language ('pl', 'es', etc.)         │
│ word                   │ e.g., 'kochać'                             │
│ translation            │ e.g., 'to love'                            │
│ pronunciation          │ IPA or phonetic                            │
│ word_type              │ noun | verb | adjective | phrase | other   │
│ gender                 │ masculine | feminine | neuter              │
│ plural                 │ Plural form                                │
│ conjugations           │ JSONB: { present: {...}, past: {...} }     │
│ adjective_forms        │ JSONB: { masculine: {...}, ... }           │
│ example_sentence       │ In target language                         │
│ example_translation    │ In native language                         │
│ source                 │ 'chat' | 'manual' | 'gift' | 'listen'      │
│ enriched_at            │ When AI processed grammar                  │
├─────────────────────────────────────────────────────────────────────┤
│ UNIQUE (user_id, word, language_code)                               │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        WORD_SCORES                                  │
├─────────────────────────────────────────────────────────────────────┤
│ user_id, word_id       │ Composite key                              │
│ success_count          │ Correct answers                            │
│ fail_count             │ Incorrect answers                          │
│ correct_streak         │ Current streak (5 = mastered)              │
│ learned_at             │ When mastered (null if not)                │
│ last_practiced         │ Most recent practice                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Chat & Progress

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CHATS                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id, user_id            │ Ownership                                  │
│ title                  │ Chat title                                 │
│ mode                   │ 'ask' | 'learn' | 'coach'                  │
│ language_code          │ Target language for this chat              │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 1:many
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MESSAGES                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id, chat_id            │                                            │
│ role                   │ 'user' | 'assistant'                       │
│ content                │ Message text                               │
│ created_at             │                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PROGRESS_SUMMARIES                               │
├─────────────────────────────────────────────────────────────────────┤
│ id, user_id            │                                            │
│ language_code          │ Target language                            │
│ native_language        │ Native language                            │
│ title, summary         │ AI-generated narrative                     │
│ topics_explored[]      │ Topics covered                             │
│ grammar_highlights[]   │ Grammar points learned                     │
│ can_now_say[]          │ Practical phrases                          │
│ suggestions[]          │ What to learn next                         │
│ words_learned          │ Count at time of summary                   │
│ validation_patterns    │ JSONB: match type stats                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       LEVEL_TESTS                                   │
├─────────────────────────────────────────────────────────────────────┤
│ id, user_id            │                                            │
│ language_code          │                                            │
│ from_level, to_level   │ e.g., 'Beginner 1' → 'Beginner 2'         │
│ passed                 │ Boolean                                    │
│ score                  │ 0-100%                                     │
│ questions              │ JSONB: array of test questions             │
│ started_at, completed  │                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Partner Features

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INVITE_TOKENS                                  │
├─────────────────────────────────────────────────────────────────────┤
│ token (64-char)        │ Unique invite link token                   │
│ inviter_id, email      │ Who sent the invite                        │
│ expires_at             │ 6-hour expiry                              │
│ used_at, used_by       │ When/who accepted                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    TUTOR_CHALLENGES                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id                     │                                            │
│ tutor_id, student_id   │ Partner pair                               │
│ language_code          │                                            │
│ challenge_type         │ 'quiz' | 'whisper' | 'quickfire'           │
│ title                  │                                            │
│ config                 │ JSONB: type-specific settings              │
│ word_ids[], words_data │ Challenge vocabulary                       │
│ status                 │ pending | in_progress | completed          │
│ expires_at             │ Challenge deadline                         │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CHALLENGE_RESULTS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ challenge_id           │                                            │
│ student_id             │                                            │
│ score, correct_answers │ Results                                    │
│ answers                │ JSONB: user responses                      │
│ xp_earned              │                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     WORD_REQUESTS                                   │
├─────────────────────────────────────────────────────────────────────┤
│ id                     │                                            │
│ tutor_id, student_id   │                                            │
│ language_code          │                                            │
│ request_type           │ 'free_text' | 'ai_topic'                   │
│ input_text             │ Tutor's request                            │
│ ai_suggestions         │ JSONB: preview words                       │
│ selected_words         │ JSONB: chosen words                        │
│ learning_content       │ JSONB: enriched data                       │
│ status                 │ pending | learning | completed             │
│ xp_multiplier          │ 2.0x for gifts                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Games & Sessions

```
┌─────────────────────────────────────────────────────────────────────┐
│                      GAME_SESSIONS                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id, user_id            │                                            │
│ language_code          │                                            │
│ game_mode              │ flashcards | multiple_choice | type_it ... │
│ correct_count          │                                            │
│ incorrect_count        │                                            │
│ total_time_seconds     │                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     LISTEN_SESSIONS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id, user_id            │                                            │
│ language_code          │                                            │
│ transcript             │ JSONB: timestamped entries                 │
│ bookmarked_phrases[]   │ User-saved phrases                         │
│ detected_words[]       │ Vocabulary found                           │
│ duration_seconds       │                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting

### Monthly Limits by Tier

| Endpoint Type | Free | Standard | Unlimited |
|---------------|------|----------|-----------|
| Text AI (chat, validate) | 0 | 5000 | Unlimited |
| Voice Sessions (live, gladia) | 0 | 20-40 | Unlimited |
| Level Tests | 0 | 50 | Unlimited |
| Challenges | 0 | 200 create, 500 submit | Unlimited |
| Word Requests | 0 | 200 | Unlimited |
| Transcript Processing | 0 | 200 | Unlimited |

### Implementation

```typescript
// api-middleware.ts
const RATE_LIMITS = {
  chat: { standard: 5000, unlimited: Infinity },
  liveToken: { standard: 20, unlimited: Infinity },
  generateLevelTest: { standard: 50, unlimited: Infinity },
  // ...
};

async function checkRateLimit(userId, usageType, tier) {
  const { count } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .eq('usage_date', today);

  return count < RATE_LIMITS[usageType][tier];
}
```

---

## Multi-Language Architecture

### 18 Supported Languages

Polish, Spanish, German, French, Italian, Portuguese, Russian, Ukrainian, Czech, Romanian, Greek, Dutch, Swedish, Danish, Norwegian, Finnish, Hungarian, Turkish

### Language-Aware Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LANGUAGE FLOW                                    │
│                                                                     │
│  Request: { targetLanguage: 'pl', nativeLanguage: 'es' }           │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  language-config.ts                                          │   │
│  │  - Conjugation persons (6 for most, 4 for Finnish)           │   │
│  │  - Gender types (masc/fem/neut varies by language)           │   │
│  │  - Case names (7 for Polish, 0 for English)                  │   │
│  │  - Special characters (ą, ż, ñ, ü, etc.)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  prompt-templates.ts                                         │   │
│  │  - Language-specific grammar instructions                    │   │
│  │  - Teaching style adapted per language                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  schema-builders.ts                                          │   │
│  │  - Dynamic JSON schemas for Gemini                           │   │
│  │  - Conjugation fields per language                           │   │
│  │  - Gender/case fields per language                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  Database: All records tagged with language_code                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Shared Utilities

### /utils/

| File | Purpose |
|------|---------|
| `api-middleware.ts` | CORS, auth, subscriptions, rate limits |
| `language-helpers.ts` | Extract languages from requests, validate pairs |
| `prompt-templates.ts` | Build AI system prompts per language |
| `schema-builders.ts` | Build Gemini JSON schemas per language |
| `sanitize.ts` | Clean AI output, remove artifacts |

### /services/

| File | Purpose |
|------|---------|
| `gemini.ts` | Gemini API client, structured responses |
| `supabase.ts` | Supabase client initialization |
| `gladia-session.ts` | WebSocket speech-to-text |
| `live-session.ts` | Real-time voice chat |
| `sounds.ts` | Audio feedback |

---

## Cost Optimization Patterns

1. **Local validation first** - Diacritic normalization before AI
2. **Batch operations** - Multiple words enriched in ONE Gemini call
3. **Selective loading** - `.limit()` and `.select()` specific columns
4. **Boot session caching** - Load context once per session
5. **Two-tier enrichment** - Light preview → full enrichment only on accept

---

## Subscription Model

### Plans

| Feature | Standard ($19/mo) | Unlimited ($39/mo) |
|---------|-------------------|---------------------|
| AI Chat | 5000 msgs/mo | Unlimited |
| Voice Sessions | 20/mo | Unlimited |
| Level Tests | 50/mo | Unlimited |
| Partner Features | Yes | Yes |
| Partner Gift Pass | No | Yes (partner gets free access) |

### Couple Access

```
Payer subscribes to Unlimited
       │
       ▼
Partner linked via invite_tokens
       │
       ▼
Partner's profile updated:
  - subscription_granted_by = payer.id
  - subscription_granted_at = now()
       │
       ▼
Partner gets full access (no payment required)
       │
       ▼
If payer cancels → partner reverts to free tier
```
