# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Love Languages: Multi-Language Learning for Couples - A language learning app built with React, Supabase, and Google Gemini. Helps couples learn each other's languages through AI coaching, vocabulary tracking, and gamified learning.

**Supported Languages:** 15+ languages including Spanish, French, Italian, Portuguese, Romanian, German, Dutch, Swedish, Norwegian, Danish, Polish, Czech, Russian, Ukrainian, Greek, Hungarian, Turkish.

**Key Architecture Document:** `MULTILANGUAGE_TRANSFORMATION.md` - The central source of truth for multi-language architecture.

## Build & Development Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
npx tsc --noEmit  # TypeScript check (run before committing)
vercel dev        # Full local dev with serverless functions
```

## Multi-Language Architecture

### Language Configuration (`constants/language-config.ts`)
Each supported language has a configuration defining:
- Grammar features (gender, conjugation, cases, articles)
- Special characters and diacritics
- TTS voice codes
- Transcription/voice mode support

### Database Model
- `profiles.active_language` - User's current learning language
- `profiles.languages` - Array of unlocked language codes
- `profiles.native_language` - User's native language (usually 'en')
- All data tables (`dictionary`, `word_scores`, `chats`, etc.) have `language_code` column

### API Pattern
All API endpoints accept `languageCode` parameter:
```typescript
// Request
POST /api/chat
{ languageCode: 'es', mode: 'learn', message: '...' }

// The endpoint uses language config for prompts, validation rules, etc.
const lang = LANGUAGE_CONFIGS[languageCode];
const systemPrompt = buildCupidSystemPrompt(languageCode, mode);
```

### Prompt Templates (`utils/prompt-templates.ts`)
AI prompts are language-agnostic templates:
```typescript
buildCupidSystemPrompt(languageCode: string, mode: ChatMode): string
buildValidationPrompt(languageCode: string): string
buildVocabularyExtractionPrompt(languageCode: string): string
```

## Architecture

### Frontend (React + TypeScript + Tailwind)
- **Entry**: `App.tsx` - Route handling, auth state, PersistentTabs component
- **Main Components**: `components/`
  - `ChatArea.tsx` - Text & voice chat with custom markdown rendering
  - `LoveLog.tsx` - Vocabulary browser with mastery tracking
  - `FlashcardGame.tsx` - 5 game modes (Flashcard, Multiple Choice, Type It, AI Challenge, Conversation Practice)
  - `ConversationPractice.tsx` - Voice conversation with AI personas in language-specific scenarios (BETA)
  - `Progress.tsx` - XP/level system, test history, motivation card
  - `LevelTest.tsx` - AI-generated proficiency tests

### Backend (Vercel Serverless Functions)
- **Location**: `/api/` - 26 isolated serverless functions
- **Key Endpoints**:
  - `chat.ts`, `chat-stream.ts` - Main conversation with Gemini (language-aware)
  - `live-token.ts` - Ephemeral tokens for Gemini Live voice mode (language-aware)
  - `gladia-token.ts` - Token for Listen Mode (Gladia transcription)
  - `process-transcript.ts` - Gemini post-processing for Listen Mode transcripts
  - `analyze-history.ts` - Batch vocabulary extraction (language-aware)
  - `generate-level-test.ts`, `submit-level-test.ts` - Test system
  - `validate-word.ts` - AI spelling/grammar validation for manual entries
  - `validate-answer.ts` - Smart validation (synonyms, typos) for game answers
  - `create-challenge.ts`, `submit-challenge.ts` - Tutor challenge system
  - `create-word-request.ts`, `complete-word-request.ts` - Word Gift/Love Package system

### Services
- `services/gemini.ts` - Gemini API wrapper (streaming, structured output)
- `services/live-session.ts` - WebSocket voice mode with Gemini Live API
- `services/gladia-session.ts` - WebSocket Listen Mode with Gladia transcription API
- `services/supabase.ts` - Database client

### User Roles
The app distinguishes between two roles (`UserRole` in `types.ts`):
- **Students**: Learn their target language, have Ask/Learn chat modes, play games, track vocabulary
- **Tutors**: Help their partner learn, have Coach mode only, can create challenges and word gifts

## Critical Patterns

### Vercel Serverless Limitation
**API files cannot import from sibling directories.** Each function bundles independently. Shared code must be duplicated inline or placed in `utils/` or `services/` (outside `/api/`).

### Centralized API Middleware (`utils/api-middleware.ts`)
CORS and auth logic is centralized in `utils/api-middleware.ts`. All API files import from this module:

```typescript
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ...
}
```

Available exports:
- `setCorsHeaders(req, res)` - Standard CORS headers, returns true for OPTIONS
- `setStreamingCorsHeaders(req, res)` - SSE streaming variant (used by `chat-stream.ts`)
- `verifyAuth(req)` - JWT verification via Supabase, returns `{ userId }` or null
- `createServiceClient()` - Creates Supabase client with service key
- `getSupabaseConfig()` - Returns `{ url, serviceKey }` for manual client creation

Security features:
- CORS: Never combines wildcard origin (`*`) with credentials (OWASP vulnerability)
- Auth: Validates JWT server-side using Supabase service key

**When adding new API endpoints**, import from this module instead of duplicating code

### Custom Markdown Blocks
The AI outputs special blocks that ChatArea.tsx renders:
- `::: table` - Conjugation/grammar tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

### Vocabulary Extraction Schema
Grammar requirements vary by language:
- Languages with conjugation: Verb forms appropriate to the language
- Languages with gender: Noun gender + plural form
- Languages with adjective agreement: All agreement forms
- All words: Example sentences + pro-tips

See `types.ts` for `DictionaryEntry` interface and language-specific grammar schemas.

### Voice Mode Architecture (Gemini Live)
Browser → `/api/live-token` (gets ephemeral token) → Gemini Live WebSocket
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Only supports `responseModalities: ['AUDIO']` (not TEXT)
- Use `outputAudioTranscription` and `inputAudioTranscription` for text
- System instructions are built from language-specific templates

### Listen Mode Architecture (Gladia)
Browser → `/api/gladia-token` → Gladia WebSocket (Source Language → English transcription)
- Passive transcription mode - AI listens but doesn't speak
- Language codes from user's `active_language` profile setting
- Translation arrives as separate WebSocket messages (merged in `gladia-session.ts`)
- Speaker diarization NOT supported for live streaming API

## Listen Mode Feature

Listen Mode is a passive transcription feature that records real-world conversations and extracts vocabulary.

### User Flow
1. User starts Listen Mode from Chat tab (headphones icon)
2. Audio is streamed to Gladia for real-time transcription with language detection
3. Transcript entries show language flags (based on detected language)
4. User can "Process" the transcript with Gemini AI to fix errors and add translations
5. User can "Extract Words" to identify vocabulary and add to Love Log
6. Sessions are saved to `listen_sessions` table for later review

### Key Files
- `components/ChatArea.tsx` - Listen Mode UI (modal, transcript display, word extraction)
- `services/gladia-session.ts` - WebSocket management for Gladia streaming API
- `api/gladia-token.ts` - Generates Gladia session token with translation config
- `api/process-transcript.ts` - Gemini post-processing to correct transcription errors

### Word Extraction Flow
1. Raw transcript → `/api/process-transcript` (Gemini corrects language detection & adds translations)
2. Processed transcript → `/api/analyze-history` (extracts vocabulary with grammatical data)
3. Extracted words displayed in modal with selection UI
4. Selected words → upserted to `dictionary` table via Supabase
5. `dictionary-updated` custom event dispatched → Love Log auto-refreshes

### Cross-Component Communication
```typescript
// In ChatArea.tsx after adding words:
window.dispatchEvent(new CustomEvent('dictionary-updated', { detail: { count } }));

// In LoveLog.tsx:
window.addEventListener('dictionary-updated', () => fetchEntries());
```

### Database Schema
```sql
-- listen_sessions table
CREATE TABLE listen_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  language_code VARCHAR(5) NOT NULL,
  transcript JSONB,        -- Array of transcript entries
  context_label TEXT,      -- Optional session label
  created_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);
```

## Environment Variables

```env
# Client-side (VITE_ prefix)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-side only
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
GLADIA_API_KEY=
ALLOWED_ORIGINS=
APP_URL=                      # Base URL for invite links (e.g., https://lovelanguages.xyz)

# Stripe (server-side only)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STANDARD_MONTHLY=
STRIPE_PRICE_STANDARD_YEARLY=
STRIPE_PRICE_UNLIMITED_MONTHLY=
STRIPE_PRICE_UNLIMITED_YEARLY=
```

## Stripe Payments Integration

### Subscription Plans
- **Standard**: $19/month or $69/year (1 language)
- **Unlimited**: $39/month or $139/year (1 language + gift pass)
- **Multi-Language Add-on**: +$5/language/month

### Webhook Handler (`api/webhooks/stripe.ts`)
Handles all subscription lifecycle events:
- `checkout.session.completed` - Activates subscription, saves `stripe_customer_id`
- `customer.subscription.updated` - Updates plan/status on changes
- `customer.subscription.deleted` - Marks subscription as canceled
- `invoice.payment_failed` - Sets status to `past_due`

### Critical Patterns

**Non-blocking operations**: Event logging and gift pass creation use async IIFEs to avoid crashing the webhook:
```typescript
// Good - non-blocking
(async () => {
  try {
    await supabase.from('subscription_events').insert(data);
  } catch (err) {
    console.error('Failed to log event:', err.message);
  }
})();

// Bad - blocking, can crash webhook
await supabase.from('subscription_events').insert(data);
```

**User lookup fallback**: When `supabase_user_id` is missing from metadata, look up by `stripe_customer_id`:
```typescript
let userId = subscription.metadata?.supabase_user_id;
if (!userId && customerId) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  userId = data?.id;
}
```

### Testing Webhooks Locally
```bash
# Terminal 1: Start local server
vercel dev

# Terminal 2: Forward Stripe events
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

### Database Fields (profiles table)
```sql
subscription_plan VARCHAR(50)      -- 'none', 'standard', 'unlimited'
subscription_status VARCHAR(20)    -- 'active', 'past_due', 'canceled', 'inactive'
subscription_period VARCHAR(20)    -- 'monthly', 'yearly'
subscription_started_at TIMESTAMPTZ
subscription_ends_at TIMESTAMPTZ
stripe_customer_id VARCHAR(100)    -- Critical for webhook lookups
active_language VARCHAR(5)         -- Current learning language code
languages TEXT[]                   -- All unlocked language codes
native_language VARCHAR(5)         -- User's native language
```

## Key Types (types.ts)

- `UserRole` - 'student' | 'tutor' (determines UI, available modes, game access)
- `ChatMode` - 'ask' | 'learn' | 'coach' (tutors always use 'coach' with partner context)
- `TranslationDirection` - 'target_to_native' | 'native_to_target' (language-agnostic)
- `DictionaryEntry` - Full vocabulary with language-specific grammar
- `WordScore` - Mastery tracking (correct_streak, learned_at)
- `LevelInfo` - 18 levels across 6 tiers
- `TutorChallenge` - Quiz/QuickFire challenges created by tutors
- `WordRequest` - Word Gift/Love Package from tutor to student
- `LanguageConfig` - Language-specific grammar, TTS, diacritics configuration

## Tab Persistence Pattern

Main tabs (Chat, Log, Play, Progress) stay mounted for session lifetime via `PersistentTabs` in `App.tsx`. This preserves state like in-progress games and scroll position. Components are shown/hidden via CSS `hidden` class, not unmount/remount. Non-persistent routes (Test, Profile) still mount/unmount normally.

## AI Persona: "Cupid"

- English-first explanations with target language examples
- Every target language word must have English translation: `Hola (Hello)`, `Bonjour (Hello)`
- Use **asterisks** for target language words, [brackets] for pronunciation
- Persona is consistent across all languages - only the language taught changes
- See README.md for full system prompt blueprint

## Database (Supabase)

Key tables: `profiles`, `chats`, `messages`, `dictionary`, `word_scores`, `level_tests`, `tutor_challenges`, `listen_sessions`, `user_languages`

All user data tables include `language_code` column for multi-language support.

Migrations in `/migrations/` - run manually in Supabase SQL editor.

## Testing Strategy

```bash
npx tsc --noEmit && npm run build  # Always run before commit
```

Manual testing via `vercel dev`. Single test file exists: `tests/vocabulary-extraction.test.ts`.

## Answer Validation Pattern

Two validation modes controlled by `profile.smart_validation`:
- **Smart validation (true)**: Uses `/api/validate-answer` with Gemini to accept synonyms, typos, diacritic variations
- **Strict validation (false)**: Local comparison with diacritic normalization only

Language-specific diacritic handling:
```typescript
import { LANGUAGE_CONFIGS } from '../constants/language-config';

function normalizeAnswer(s: string, languageCode: string): string {
  // Base normalization
  let normalized = s.toLowerCase().trim();

  // Remove diacritics for comparison
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return normalized;
}
```

All game components must implement both paths consistently using the user's `active_language`.

## Documentation

- `MULTILANGUAGE_TRANSFORMATION.md` - Multi-language architecture (source of truth)
- `README.md` - AI persona and feature overview
- `ROADMAP.md` - Product phases and progress tracking
- `TROUBLESHOOTING.md` - 36+ solved issues with detailed solutions (check here first for common errors)
- `docs/AI_INTEGRATION_GUIDE.md` - Gemini API implementation
- `docs/FORMATTING.md` - Markdown rendering pipeline
- `docs/SYSTEM_PROMPTS.md` - AI prompt documentation and modification guide
- `DESIGN.md` - UI/UX design system, theming, mobile patterns

## Conversation Practice (BETA)

8 curated scenarios in `constants/conversation-scenarios.ts`:
- Cafe, Restaurant, Market, Taxi, Pharmacy, Hotel, Family Dinner, Train Station

Scenarios are universal with cultural adaptations per language. System prompts are scenario-specific, defined in `api/live-token.ts` via `buildConversationSystemInstruction()`.

## Theming Pattern

Use CSS variables for colors that need to work in both light/dark modes:
- `var(--bg-primary)`, `var(--bg-card)` - Backgrounds
- `var(--text-primary)`, `var(--text-secondary)` - Text colors
- `var(--accent-color)`, `var(--accent-light)`, `var(--accent-border)` - Accent theming
- `accentHex` from `useTheme()` hook - Dynamic accent color for inline styles

## Chat Modes by Role

- **Students**: Ask mode (quick Q&A) and Learn mode (structured lessons with tables/drills)
- **Tutors**: Coach mode only (teaching tips + partner's vocabulary context)
- Conversation history: Last 10 messages sent to AI for context awareness

## Play Section Game Modes

5 game modes in `FlashcardGame.tsx`:
1. **Flashcard** - Simple flip cards, tap to reveal translation
2. **Multiple Choice** - 4 options, pick the correct translation
3. **Type It** - Type the translation, validated with language-aware diacritic normalization
4. **AI Challenge** - Streak-based mastery system (5 correct = learned), multiple sub-modes
5. **Conversation Practice** - Voice conversations with AI personas in curated scenarios (BETA)

## Word Mastery System

Streak-based mastery tracked in `word_scores` table:
- `correct_streak` increments on correct answer, resets to 0 on wrong
- Word is "learned" when `correct_streak >= 5` (sets `learned_at` timestamp)
- Once learned, status persists (no decay)
- Mastery badges shown in Love Log: green checkmark = learned, amber = in progress
- Progress is tracked per language

## API Cost Optimization Patterns

Gemini AI is the largest cost driver. Follow these patterns to minimize API spend:

### 1. Batch Operations (N→1)

**NEVER** make N API calls in a loop. Use batch patterns:

```typescript
// BAD: N Gemini calls
for (const answer of answers) {
  const result = await gemini.validate(answer);  // N calls!
}

// GOOD: 1 Gemini call with array schema
const results = await gemini.generateContent({
  contents: buildBatchPrompt(answers),
  config: {
    responseSchema: { type: Type.ARRAY, items: { ... } }  // Returns all results
  }
});
```

### 2. Local-First Validation

Always try free local matching before calling AI:

```typescript
function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}

// Only call Gemini for non-exact matches
const needsAi = answers.filter(a => !fastMatch(a.user, a.correct));
if (needsAi.length > 0) {
  // Batch validate only the ones that need AI
}
```

### 3. Schema Proportional to Usage

Request only the data you'll actually use:

| Data Destination | Schema Complexity |
|------------------|-------------------|
| Love Log (dictionary) | Full schema (conjugations, examples, etc.) |
| Preview/Display only | Minimal schema (word, translation, pronunciation) |
| Tutor (doesn't learn) | No vocabulary extraction needed |

### 4. Database Batch Operations

```typescript
// BAD: N+1 queries
for (const id of ids) {
  const data = await supabase.from('table').select('*').eq('id', id);
}

// GOOD: 1 query with .in()
const { data } = await supabase.from('table').select('*').in('id', ids);

// BAD: N inserts
for (const item of items) {
  await supabase.from('table').insert(item);
}

// GOOD: 1 batch upsert
await supabase.from('table').upsert(items, { onConflict: 'id' });
```

### 5. Limit Data Fetching

```typescript
// BAD: Fetch all vocabulary, use 30
const { data: vocab } = await supabase.from('dictionary').select('*');
const prompt = vocab.slice(0, 30).join(', ');

// GOOD: Fetch only what you need
const { data: vocab } = await supabase.from('dictionary')
  .select('word, translation')
  .eq('language_code', activeLanguage)
  .limit(30);
```

### Key Files with Batch Patterns
- `api/submit-challenge.ts` - `batchSmartValidate()` for answer validation
- `api/submit-level-test.ts` - Same batch validation pattern
- `api/complete-word-request.ts` - `batchEnrichWordContexts()` for word enrichment
- `api/get-game-history.ts` - Aggregate query for session stats

See `TROUBLESHOOTING.md` Issues #42-43 for detailed examples.

## Tutor Challenge System

Tutors can create three types of challenges for their partner:

### Challenge Types
1. **Do You Remember (Quiz)** - `CreateQuizChallenge.tsx` - Quiz on existing or new vocabulary
2. **Quick Fire** - `CreateQuickFireChallenge.tsx` - Timed vocabulary challenge
3. **Gift Words (Love Package)** - `WordRequestCreator.tsx` - Send new words for partner to learn

### Unified Word Entry UX
All three challenge creators share the same target-language-first word entry flow:
1. Enter word/phrase in target language in text input
2. Click "Generate" button to get AI translation
3. AI returns: corrected word, English translation, pronunciation, word type
4. User can edit the translation if needed
5. Click "Add" to add word to challenge/package
6. Words appear in list below with remove option

**Key files:**
- `api/validate-word.ts` - AI validation endpoint (target language only or with English)
- `components/CreateQuizChallenge.tsx`
- `components/CreateQuickFireChallenge.tsx`
- `components/WordRequestCreator.tsx`

### API Pattern for Word Validation
```typescript
// Target language only (generate mode)
POST /api/validate-word
{ word: "hola", languageCode: "es" }
// Returns: { word: "hola", translation: "hello", pronunciation: "oh-lah", ... }

// With English (validate mode)
POST /api/validate-word
{ word: "hola", english: "hello", languageCode: "es" }
// Returns: validated/corrected versions
```
