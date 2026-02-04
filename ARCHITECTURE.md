# ARCHITECTURE.md

Code architecture notes and gotchas for Claude Code working on this codebase.

---

## Stack Overview

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Backend:** Vercel Serverless Functions, Supabase (Postgres + Auth)
- **AI:** Google Gemini
- **Mobile:** Capacitor (iOS)
- **Blog:** Astro + Supabase (articles in `blog_articles` table, NOT MDX files)

---

## High-Risk Components (Handle With Care)

These files have complex state. Test thoroughly after changes.

| Component | useState | Lines | Notes |
|-----------|----------|-------|-------|
| `FlashcardGame.tsx` | 56 | 2,373 | 5 game modes, mastery tracking |
| `ChatArea.tsx` | 36 | 1,892 | Text + voice chat, Listen Mode |
| `Hero.tsx` | 20 | 3,038 | Landing page, onboarding |
| `TutorGames.tsx` | 32 | 1,398 | Quiz + Quick Fire creation |

---

## Critical Gotchas

### 1. Vercel Serverless Import Limitation

**API files CANNOT import from sibling directories within `/api/`.**

```
api/
├── lib/              # ❌ DOES NOT WORK - Vercel won't bundle
│   └── cors.ts
├── chat.ts           # Each file = isolated function
└── analyze-history.ts
```

**Solution:** Shared code goes in `utils/` or `services/` at project root:
```typescript
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware';
```

### 2. PersistentTabs Pattern

Main tabs (Chat, Log, Play, Progress) stay **mounted** using CSS `hidden` instead of unmounting:

```tsx
<div className={path === '/play' ? 'h-full' : 'hidden'}>
  <FlashcardGame profile={profile} />
</div>
```

**Implications:**
- All tabs initialize on first load
- Event listeners in hidden tabs still fire
- Don't assume component unmounts on tab switch

### 3. Language Handling

**NEVER use manual fallbacks like `|| 'pl'` or `|| 'en'`.**

Use centralized helpers from `utils/language-helpers.ts`:
```typescript
const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
```

### 4. Blog Articles Location

Articles are in **Supabase `blog_articles` table**, not MDX files. The blog uses:
```typescript
// Correct - Supabase API
const articles = await getArticlesFromSupabase();

// Wrong - old pattern
const articles = await getCollection('articles');
```

---

## Standard API Pattern

```typescript
import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware';
import { extractLanguages } from '../utils/language-helpers';

export default async function handler(req: any, res: any) {
  // 1. CORS
  if (setCorsHeaders(req, res)) return res.status(200).end();
  
  // 2. Auth
  const auth = await verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  // 3. Languages
  const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
  
  // 4. Business logic
  const supabase = createServiceClient();
}
```

---

## Directory Structure

```
/
├── api/           # Vercel serverless functions (40+)
├── components/    # React components (46)
├── services/      # API clients (gemini, supabase, audio)
├── utils/         # Shared utilities
├── constants/     # Language configs, icons, colors
├── context/       # React contexts
├── hooks/         # Custom hooks
├── migrations/    # SQL migrations (run manually)
├── blog/          # Astro blog (separate build)
└── types.ts       # TypeScript interfaces
```
