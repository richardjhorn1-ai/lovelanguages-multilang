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
- **Entry**: `src/App.tsx` - Route handling and auth state
- **Main Components**: `src/components/`
  - `ChatArea.tsx` - Text & voice chat with custom markdown rendering
  - `LoveLog.tsx` - Vocabulary browser with mastery tracking
  - `FlashcardGame.tsx` - 4 game modes (Flashcard, Multiple Choice, Type It, AI Challenge)
  - `Progress.tsx` - XP/level system, test history
  - `LevelTest.tsx` - AI-generated proficiency tests

### Backend (Vercel Serverless Functions)
- **Location**: `/api/` - Each file is an isolated serverless function
- **Key Endpoints**:
  - `chat.ts`, `chat-stream.ts` - Main conversation with Gemini
  - `live-token.ts` - Ephemeral tokens for voice mode
  - `analyze-history.ts` - Batch vocabulary extraction
  - `generate-level-test.ts`, `submit-level-test.ts` - Test system

### Services
- `services/gemini.ts` - Gemini API wrapper (streaming, structured output)
- `services/live-session.ts` - WebSocket voice mode with Gemini Live API
- `services/supabase.ts` - Database client

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

- `ChatMode` - 'ask' | 'learn' | 'coach' (coach is tutor-only, context-aware)
- `DictionaryEntry` - Full vocabulary with conjugations/examples
- `WordScore` - Mastery tracking (correct_streak, learned_at)
- `LevelInfo` - 18 levels across 6 tiers

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
- `ROADMAP.md` - Product phases
- `TROUBLESHOOTING.md` - 23+ solved issues with detailed solutions
- `docs/AI_INTEGRATION_GUIDE.md` - Gemini API implementation
- `docs/FORMATTING.md` - Markdown rendering pipeline
- `docs/SYSTEM_PROMPTS.md` - AI prompt documentation and modification guide
- `DESIGN.md` - Adjusted anthropic design guide

## Chat UI Components

- `ChatArea.tsx` - Main chat with mode tabs (Students: Ask/Learn, Tutors: Coach/Context)
- `ChatEmptySuggestions.tsx` - Empty state with role/mode-specific suggestion cards
- `HelpGuide.tsx` - Slide-out help panel with sections and FAQs
- Conversation history: Last 10 messages sent to AI for context awareness
