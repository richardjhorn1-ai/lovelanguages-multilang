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
- **Location**: `/api/` - 23 isolated serverless functions
- **Key Endpoints**:
  - `chat.ts`, `chat-stream.ts` - Main conversation with Gemini
  - `live-token.ts` - Ephemeral tokens for voice mode
  - `analyze-history.ts` - Batch vocabulary extraction
  - `generate-level-test.ts`, `submit-level-test.ts` - Test system
  - `validate-word.ts` - AI spelling/grammar validation for manual entries

### Services
- `services/gemini.ts` - Gemini API wrapper (streaming, structured output)
- `services/live-session.ts` - WebSocket voice mode with Gemini Live API
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

### Voice Mode Architecture
Browser → `/api/live-token` (gets ephemeral token) → Gemini Live WebSocket
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Only supports `responseModalities: ['AUDIO']` (not TEXT)
- Use `outputAudioTranscription` and `inputAudioTranscription` for text

## Environment Variables

```env
# Client-side (VITE_ prefix)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-side only
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
ALLOWED_ORIGINS=
```

## Key Types (types.ts)

- `UserRole` - 'student' | 'tutor' (determines UI, available modes, game access)
- `ChatMode` - 'ask' | 'learn' | 'coach' (tutors always use 'coach' with partner context)
- `DictionaryEntry` - Full vocabulary with conjugations/examples
- `WordScore` - Mastery tracking (correct_streak, learned_at)
- `LevelInfo` - 18 levels across 6 tiers

## Tab Persistence Pattern

Main tabs (Chat, Log, Play, Progress) stay mounted for session lifetime via `PersistentTabs` in `App.tsx`. This preserves state like in-progress games and scroll position. Components are shown/hidden via CSS `hidden` class, not unmount/remount. Non-persistent routes (Test, Profile) still mount/unmount normally.

## AI Persona: "Cupid"

- English-first explanations with Polish examples
- Every Polish word must have English translation: `Cześć (Hello)`
- Use **asterisks** for Polish words, [brackets] for pronunciation
- See README.md for full system prompt blueprint

## Database (Supabase)

Key tables: `profiles`, `chats`, `messages`, `dictionary`, `word_scores`, `level_tests`, `tutor_challenges`

Migrations in `/migrations/` - run manually in Supabase SQL editor.

## Testing Strategy

```bash
npx tsc --noEmit && npm run build  # Always run before commit
```

Manual testing via `vercel dev`. Single test file exists: `tests/vocabulary-extraction.test.ts`.

## Documentation

- `README.md` - AI persona and feature overview
- `ROADMAP.md` - Product phases (up to Phase 5.7)
- `TROUBLESHOOTING.md` - 30+ solved issues with detailed solutions
- `docs/AI_INTEGRATION_GUIDE.md` - Gemini API implementation
- `docs/FORMATTING.md` - Markdown rendering pipeline
- `docs/SYSTEM_PROMPTS.md` - AI prompt documentation and modification guide
- `DESIGN.md` - Adjusted anthropic design guide

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
