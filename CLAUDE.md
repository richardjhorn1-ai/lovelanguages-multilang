# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Love Languages: Polish for Couples - A language learning app built with React, Supabase, and Google Gemini. Helps couples learn Polish together through AI coaching, vocabulary tracking, and gamified learning.

## Build & Development Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
npx tsc --noEmit  # TypeScript check (run before committing)
vercel dev        # Full local dev with serverless functions
```

## Architecture

### Frontend (React + TypeScript + Tailwind)
- **Entry**: `App.tsx` - Route handling, auth state, PersistentTabs component
- **Main Components**: `components/`
  - `ChatArea.tsx` - Text & voice chat with custom markdown rendering
  - `LoveLog.tsx` - Vocabulary browser with mastery tracking
  - `FlashcardGame.tsx` - 5 game modes (Flashcard, Multiple Choice, Type It, AI Challenge, Conversation Practice)
  - `ConversationPractice.tsx` - Voice conversation with AI personas in Polish scenarios (BETA)
  - `Progress.tsx` - XP/level system, test history, motivation card
  - `LevelTest.tsx` - AI-generated proficiency tests

### Backend (Vercel Serverless Functions)
- **Location**: `/api/` - 26 isolated serverless functions
- **Key Endpoints**:
  - `chat.ts`, `chat-stream.ts` - Main conversation with Gemini
  - `live-token.ts` - Ephemeral tokens for Gemini Live voice mode
  - `gladia-token.ts` - Token for Listen Mode (Gladia transcription)
  - `polish-transcript.ts` - Gemini post-processing for Listen Mode transcripts
  - `analyze-history.ts` - Batch vocabulary extraction
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
- **Students**: Learn Polish, have Ask/Learn chat modes, play games, track vocabulary
- **Tutors**: Help their partner learn, have Coach mode only, can create challenges and word gifts

## Critical Patterns

### Vercel Serverless Limitation
**API files cannot import from sibling directories.** Each function bundles independently. Shared code must be duplicated inline or placed in `utils/` or `services/` (outside `/api/`).

### Custom Markdown Blocks
The AI outputs special blocks that ChatArea.tsx renders:
- `::: table` - Conjugation/grammar tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

### Vocabulary Extraction Schema
Verbs require all 6 conjugations per tense. Nouns need gender + plural. Adjectives need all 4 forms. See `types.ts` for `DictionaryEntry` interface.

### Voice Mode Architecture (Gemini Live)
Browser → `/api/live-token` (gets ephemeral token) → Gemini Live WebSocket
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Only supports `responseModalities: ['AUDIO']` (not TEXT)
- Use `outputAudioTranscription` and `inputAudioTranscription` for text

### Listen Mode Architecture (Gladia)
Browser → `/api/gladia-token` → Gladia WebSocket (Polish → English transcription)
- Passive transcription mode - AI listens but doesn't speak
- Translation arrives as separate WebSocket messages (merged in `gladia-session.ts`)
- Speaker diarization NOT supported for live streaming API

## Listen Mode Feature

Listen Mode is a passive transcription feature that records real-world Polish conversations and extracts vocabulary.

### User Flow
1. User starts Listen Mode from Chat tab (headphones icon)
2. Audio is streamed to Gladia for real-time transcription with language detection
3. Transcript entries show language flags (🇵🇱 Polish, 🇬🇧 English)
4. User can "Polish" the transcript with Gemini AI to fix errors and add translations
5. User can "Extract Words" to identify vocabulary and add to Love Log
6. Sessions are saved to `listen_sessions` table for later review

### Key Files
- `components/ChatArea.tsx` - Listen Mode UI (modal, transcript display, word extraction)
- `services/gladia-session.ts` - WebSocket management for Gladia streaming API
- `api/gladia-token.ts` - Generates Gladia session token with translation config
- `api/polish-transcript.ts` - Gemini post-processing to correct transcription errors

### Word Extraction Flow
1. Raw transcript → `/api/polish-transcript` (Gemini corrects language detection & adds translations)
2. Polished transcript → `/api/analyze-history` (extracts vocabulary with grammatical data)
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
-- listen_sessions table (migrations/012_listen_sessions.sql)
CREATE TABLE listen_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
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
```

## Key Types (types.ts)

- `UserRole` - 'student' | 'tutor' (determines UI, available modes, game access)
- `ChatMode` - 'ask' | 'learn' | 'coach' (tutors always use 'coach' with partner context)
- `DictionaryEntry` - Full vocabulary with conjugations/examples
- `WordScore` - Mastery tracking (correct_streak, learned_at)
- `LevelInfo` - 18 levels across 6 tiers
- `TutorChallenge` - Quiz/QuickFire challenges created by tutors
- `WordRequest` - Word Gift/Love Package from tutor to student

## Tab Persistence Pattern

Main tabs (Chat, Log, Play, Progress) stay mounted for session lifetime via `PersistentTabs` in `App.tsx`. This preserves state like in-progress games and scroll position. Components are shown/hidden via CSS `hidden` class, not unmount/remount. Non-persistent routes (Test, Profile) still mount/unmount normally.

## AI Persona: "Cupid"

- English-first explanations with Polish examples
- Every Polish word must have English translation: `Cześć (Hello)`
- Use **asterisks** for Polish words, [brackets] for pronunciation
- See README.md for full system prompt blueprint

## Database (Supabase)

Key tables: `profiles`, `chats`, `messages`, `dictionary`, `word_scores`, `level_tests`, `tutor_challenges`, `listen_sessions`

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

All game components must implement both paths consistently. Always normalize diacritics in fallback:
```typescript
function normalizeAnswer(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
```

## Documentation

- `README.md` - AI persona and feature overview
- `ROADMAP.md` - Product phases (up to Phase 5.7)
- `TROUBLESHOOTING.md` - 36+ solved issues with detailed solutions (check here first for common errors)
- `docs/AI_INTEGRATION_GUIDE.md` - Gemini API implementation
- `docs/FORMATTING.md` - Markdown rendering pipeline
- `docs/SYSTEM_PROMPTS.md` - AI prompt documentation and modification guide
- `DESIGN.md` - UI/UX design system, theming, mobile patterns

## Conversation Practice (BETA)

8 curated scenarios in `constants/conversation-scenarios.ts`:
- ☕ Café, 🍽️ Restaurant, 🍎 Market, 🚕 Taxi, 💊 Pharmacy, 🏨 Hotel, 👨‍👩‍👧 Family Dinner, 🚂 Train Station

System prompts are scenario-specific, defined in `api/live-token.ts` via `buildConversationSystemInstruction()`.

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
3. **Type It** - Type the translation, validated with diacritic normalization
4. **AI Challenge** - Streak-based mastery system (5 correct = learned), multiple sub-modes
5. **Conversation Practice** - Voice conversations with AI personas in curated scenarios (BETA)

## Word Mastery System

Streak-based mastery tracked in `word_scores` table:
- `correct_streak` increments on correct answer, resets to 0 on wrong
- Word is "learned" when `correct_streak >= 5` (sets `learned_at` timestamp)
- Once learned, status persists (no decay)
- Mastery badges shown in Love Log: green checkmark = learned, amber = in progress
