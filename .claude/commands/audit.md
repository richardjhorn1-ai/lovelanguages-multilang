# /audit — Codebase Audit

When the user invokes `/audit`, run a structured codebase audit using parallel sub-agents.

## Step 1: Ask Audit Type

Ask the user which audit to run:
- **Security** — Auth, input sanitization, secrets, CORS, headers
- **Pattern compliance** — Shared utils usage, API patterns, language helpers
- **Full** — Both security + patterns
- **Targeted** — User specifies files or area to audit

## Step 2: Run Parallel Sub-Agents

Launch Task sub-agents in parallel based on audit type. Each agent should search for specific violations.

### Security Audit Checks

| Check | What to Search For |
|-------|--------------------|
| **Auth gaps** | API files missing `verifyAuth(req)` call |
| **Input sanitization** | User input not passed through `sanitizeInput()` |
| **Hardcoded secrets** | API keys, passwords, tokens in code (not `.env`) |
| **CORS missing** | API files not calling `setCorsHeaders()` |
| **Direct Supabase imports** | `import { createClient } from '@supabase/supabase-js'` in `api/` files (should use `createServiceClient()`) |
| **Console.log with data** | `console.log` statements that might leak sensitive info |
| **Unsafe patterns** | `eval()`, `dangerouslySetInnerHTML`, `innerHTML`, `// @ts-ignore` |
| **Security headers** | API files not calling `setSecurityHeaders()` where needed |

### Pattern Compliance Checks

| Check | What to Search For |
|-------|--------------------|
| **Copied validation** | Local answer normalization instead of importing from `utils/answer-helpers.ts` |
| **Manual language fallbacks** | `\|\| 'pl'` or `\|\| 'en'` instead of `extractLanguages()` / `getProfileLanguages()` |
| **Looping API calls** | `for` loops containing `await` calls to Gemini — should use batch schemas |
| **Missing language params** | API endpoints that don't handle `targetLanguage` / `nativeLanguage` |
| **New console.log** | Any `console.log` not in the known 57+ tech debt locations |
| **Duplicate utilities** | New helper functions that duplicate existing `utils/` exports |

### Known Intentional Exceptions (Don't Flag)

These files intentionally use manual language fallbacks (stored record language, not profile):
- `api/submit-level-test.ts` — test record's language for grading consistency
- `api/submit-challenge.ts` — challenge's target language
- `api/complete-word-request.ts` — word request's stored language
- `api/unlock-tense.ts` — word entry's language
- `api/complete-invite.ts` — multi-level fallback (token → profile → default)

### Known Security Gap (Already Documented)

- `api/analytics-event.ts` — No auth, no CORS, direct Supabase import. Document but don't re-flag unless asked about it specifically.

## Step 3: Report Format

Present findings in severity order:

```
## 🔴 Critical (must fix)
- [file:line] Description of the issue

## 🟡 Warning (should fix)
- [file:line] Description of the issue

## 🔵 Info (consider fixing)
- [file:line] Description of the issue

## ✅ Passed
- List of checks that passed cleanly
```

## Self-Testing Prompts

When auditing complex features, also consider:
1. "What happens with null, undefined, empty string, or a huge array?"
2. "Can a malicious user craft input to bypass validation?"
3. "What if the Gemini API returns unexpected structure or errors?"
4. "Are there race conditions in the component state?"
