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
| `api/` | 40 Vercel serverless functions |
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

### Custom Markdown Blocks

AI outputs special blocks rendered by `ChatArea.tsx`:
- `::: table` - Conjugation tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

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

---

## Agent Guidelines

**CRITICAL: Read this section before making any changes.**

### Shared Utilities - USE, DON'T COPY

These utilities exist in `utils/`. **Import them, never copy the code:**

| File | Exports | Use For |
|------|---------|---------|
| `api-middleware.ts` | `setCorsHeaders`, `verifyAuth`, `createServiceClient`, `getSubscriptionPlan`, `checkRateLimit`, `incrementUsage`, `RATE_LIMITS` | All API endpoints |
| `language-helpers.ts` | `extractLanguages`, `getProfileLanguages`, `validateLanguageCode` | Getting target/native languages from requests or profiles |
| `prompt-templates.ts` | `buildSystemPrompt`, `buildUserPrompt`, mode-specific builders | All Gemini AI prompts |
| `schema-builders.ts` | `buildResponseSchema`, mode-specific schema builders | Gemini structured output schemas |
| `sanitize.ts` | `sanitizeInput`, `sanitizeHtml` | User input sanitization |
| `array.ts` | `shuffleArray`, `chunkArray` | Array manipulation |
| `article-generator.ts` | Blog article generation utilities | Blog content only |
| `answer-helpers.ts` | `normalizeAnswer`, `isCorrectAnswer`, `validateAnswerSmart` | Answer validation in games/challenges |

### Language Parameters - Use the Helpers

**The infrastructure exists - use it consistently.**

`utils/language-helpers.ts` provides centralized language handling with proper fallbacks for backward compatibility.

**Frontend (React components):**
```typescript
import { useLanguage } from '../context/LanguageContext';

const { targetLanguage, nativeLanguage, languageParams } = useLanguage();
// Languages come from: Override (onboarding) → Profile → Default
```

**APIs - from request body:**
```typescript
import { extractLanguages } from '../utils/language-helpers';

const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
// Handles missing params, validation, backward compatibility
```

**APIs - from user profile (preferred for authenticated endpoints):**
```typescript
import { getProfileLanguages } from '../utils/language-helpers';

const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, auth.userId);
// Fetches from profiles table with proper fallback
```

**APIs - strict validation (fail if invalid):**
```typescript
import { requireLanguagePair } from '../utils/language-helpers';

try {
  const { targetLanguage, nativeLanguage } = requireLanguagePair(body.targetLanguage, body.nativeLanguage);
} catch (err) {
  return res.status(400).json({ error: err.message });
}
```

### Technical Debt: Scattered Manual Fallbacks (FIXED)

~~These files bypassed `language-helpers.ts` with manual fallbacks.~~ **Fixed** - now use `getProfileLanguages()`:
- ~~`api/progress-summary.ts`~~ ✅
- ~~`api/complete-word-request.ts`~~ ✅
- ~~`api/submit-challenge.ts`~~ ✅
- ~~`api/boot-session.ts`~~ ✅
- ~~`api/create-word-request.ts`~~ ✅
- ~~`api/create-challenge.ts`~~ ✅

**Exception:** `api/submit-level-test.ts` intentionally uses test record's language settings (not profile) for grading consistency.

### Event System Matrix

Custom events for cross-component communication:

| Event | Dispatched By | Listened By | Payload |
|-------|---------------|-------------|---------|
| `dictionary-updated` | `ChatArea.tsx`, `WordGiftLearning.tsx` | `LoveLog.tsx`, `ChatArea.tsx` | `{ count: number }` |
| `language-switched` | `LanguagesSection.tsx` | `LoveLog.tsx`, `FlashcardGame.tsx`, `Progress.tsx` | none |
| `level-changed` | **NOWHERE (dead code)** | `ChatArea.tsx` | - |

**Note:** `level-changed` listener exists but is never dispatched. This is dead code, not a bug.

### Common Mistakes - DO NOT DO

1. **Copying validation functions** - Use `import { normalizeAnswer, isCorrectAnswer, validateAnswerSmart } from '../utils/answer-helpers'`. **Never copy these functions** - they exist in 4 files as technical debt to be consolidated.

2. **Adding manual language fallbacks** - Never use `|| 'pl'` or `|| 'en'`. Use `getProfileLanguages()` or `extractLanguages()` from `utils/language-helpers.ts` which handle fallbacks centrally.

3. **Looping API calls** - Never `for (item of items) { await callGemini(item) }`. Use batch operations with array schemas.

4. **Direct Supabase imports in API files** - Always use `createServiceClient()` from api-middleware.

5. **Skipping auth checks** - Every API must call `verifyAuth(req)` before processing.

6. **Adding console.log for debugging** - 60+ debug logs exist as technical debt. Don't add more. Use proper error handling.

7. **Creating new files for one-time code** - Check if shared utilities already exist before creating new files.

### Monster Components - Handle With Care

These components have high state complexity. Changes require thorough testing:

| Component | useState calls | Lines | Risk Level |
|-----------|---------------|-------|------------|
| `FlashcardGame.tsx` | 56 | 2,373 | High |
| `ChatArea.tsx` | 36 | 1,892 | High |
| `Hero.tsx` | 20 | 3,038 | Medium |
| `TutorGames.tsx` | 32 | 1,398 | High |

### localStorage Keys

| Key | Purpose | Set By |
|-----|---------|--------|
| `preferredTargetLanguage` | User's target language | `Hero.tsx`, `LanguagesSection.tsx` |
| `preferredLanguage` | User's native language (tech debt: should be `preferredNativeLanguage`) | `Hero.tsx` |
| `couple_link_token` | Partner linking token | `LinkPartner.tsx` |
| `selectedRole` | student or tutor | `RoleSelection.tsx` |

**Note:** `LanguageContext` reads from the user's Supabase profile, not localStorage. localStorage is only used for pre-login preferences on the Hero page.

### PersistentTabs Pattern

Main app tabs stay mounted and hidden via CSS (`display: none`) rather than unmounting. This preserves state but means:
- All tabs initialize on first load
- Event listeners in hidden tabs still fire
- State persists across tab switches

## Mistakes (don't repeat these)

Pushed directly to main without using a branch. Always use feature branches and Vercel previews.

Fixed one CSP issue but missed the related one (fonts). When fixing CSP or similar config issues, check for ALL related services at once.

Said "fixed" without actually testing. Always verify changes work - use browser, check console, check network tab.

Made assumptions about business logic. Ask Richard for design decisions when there are multiple valid solutions.

Changed code without checking if similar code exists elsewhere. Search the codebase first - don't duplicate.

Claimed something was done without reading the actual file to verify. Always verify state before making claims.
