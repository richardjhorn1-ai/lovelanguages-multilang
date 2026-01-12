# CLAUDE.md

Developer guidance for Claude Code when working with this repository.

## Project Overview

**Love Languages** - Multi-language learning app for couples. Built with React, Supabase, Google Gemini. 18 supported languages where any can be native or target.

**Key Document:** `ML_MASTER_PLAN.md` - Source of truth for project status and architecture.

## Quick Commands

```bash
npm run dev              # Vite dev server (localhost:5173)
vercel dev               # Full stack with APIs (localhost:3000)
npx tsc --noEmit         # TypeScript check
npm run build            # Production build
npm run test:e2e         # Playwright E2E tests
```

## Architecture

### API Pattern

All endpoints accept both `targetLanguage` and `nativeLanguage`:

```typescript
POST /api/chat
{
  targetLanguage: 'pl',    // Learning Polish
  nativeLanguage: 'es',    // Spanish speaker
  mode: 'learn',
  message: '...'
}
```

### Key Directories

| Path | Purpose |
|------|---------|
| `api/` | 26 Vercel serverless functions |
| `components/` | React components |
| `constants/language-config.ts` | All 18 language configurations |
| `utils/prompt-templates.ts` | Language-agnostic AI prompts |
| `utils/schema-builders.ts` | Dynamic Gemini response schemas |
| `utils/api-middleware.ts` | CORS, auth, rate limiting |
| `services/` | Gemini, Supabase, WebSocket clients |
| `blog/` | Astro static site for SEO content |
| `e2e/` | Playwright E2E tests |
| `migrations/` | SQL migrations (run manually in Supabase) |

### User Roles

- **Students**: Ask/Learn modes, games, vocabulary tracking
- **Tutors**: Coach mode only, create challenges, send word gifts

## Critical Patterns

### Vercel Serverless Limitation

API files cannot import from sibling directories. Shared code goes in `utils/` or `services/`.

### API Middleware

```typescript
import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware';

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) return res.status(200).end();
  const auth = await verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  // ...
}
```

### Language Helpers

```typescript
import { extractLanguages, getProfileLanguages } from '../utils/language-helpers';

const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
// Or from user profile:
const langs = await getProfileLanguages(supabase, userId);
```

### Custom Markdown Blocks

AI outputs special blocks rendered by `ChatArea.tsx`:
- `::: table` - Conjugation tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

### Cross-Component Events

```typescript
// Dispatch after vocabulary changes
window.dispatchEvent(new CustomEvent('dictionary-updated', { detail: { count } }));
window.dispatchEvent(new CustomEvent('language-switched'));

// Listen in components
window.addEventListener('dictionary-updated', () => fetchEntries());
```

## Testing

### E2E Tests (Playwright)

```bash
# Run against Vercel preview
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:e2e

# Interactive mode
npm run test:e2e:ui
```

Test accounts: `testaccount[1-6]@gmail.com` / `tester[1-6]`

### Type Check Before Commit

```bash
npx tsc --noEmit && npm run build
```

## Cost Optimization

Gemini API is the main cost driver. Key patterns:

1. **Batch operations** - Never loop N API calls; use array schemas
2. **Local-first validation** - Try exact match before calling AI
3. **Limit fetching** - Use `.limit()` and `.select()` specific columns

See `TROUBLESHOOTING.md` Issues #42-43 for examples.

## Environment Variables

```env
# Client-side
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-side
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
GLADIA_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Routes, auth, PersistentTabs |
| `ChatArea.tsx` | Text/voice chat, Listen Mode |
| `LoveLog.tsx` | Vocabulary browser |
| `FlashcardGame.tsx` | 5 game modes |
| `Progress.tsx` | XP, levels, test history |
| `types.ts` | All TypeScript interfaces |
| `constants/language-config.ts` | 18 language configs |

## Documentation

| Document | Purpose |
|----------|---------|
| `ML_MASTER_PLAN.md` | **Source of truth** - status, architecture |
| `TROUBLESHOOTING.md` | 36+ solved issues |
| `DESIGN.md` | UI/UX patterns |
| `docs/SYSTEM_PROMPTS.md` | AI prompt documentation |
