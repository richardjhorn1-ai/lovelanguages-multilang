# /debug — Structured Debugging Workflow

When the user invokes `/debug`, follow this structured workflow. Do NOT skip steps.

## Step 1: Gather Evidence

**Ask for the actual error before doing anything.**

- What is the exact error message or unexpected behavior?
- Where does it occur? (component, API endpoint, console, network tab)
- Is it reproducible? What steps trigger it?

Do NOT speculate about causes. Do NOT start reading code yet.

## Step 2: Reproduce & Contextualize

Clarify the environment:
- **User role**: Student or Tutor?
- **Language pair**: Which target and native language?
- **Platform**: Browser, simulator, or physical device?
- **Authenticated?**: Logged in, logged out, or mid-auth flow?

## Step 3: Trace the Code Path

Follow the data flow end-to-end. Use parallel sub-agents for speed when tracing multiple files.

**Frontend issues:**
1. Component state & props → event handler → API call → response handling → re-render

**API issues:**
1. Request → `api-middleware.ts` (CORS, auth) → handler logic → Supabase/Gemini call → response

**Key files to check by symptom:**

| Symptom | Start Here |
|---------|------------|
| API 401/403 | `utils/api-middleware.ts` → `verifyAuth` |
| Wrong language in response | `utils/language-helpers.ts` → check which extraction method is used |
| Gemini error/bad output | `services/gemini.ts` → prompt in `utils/prompt-templates.ts` → schema in `utils/schema-builders.ts` |
| Words not appearing in LoveLog | `dictionary-updated` event dispatch → `LoveLog.tsx` listener |
| Game crash/freeze | `FlashcardGame.tsx` (24 useState) or `TutorGames.tsx` (24 useState) — check state race conditions |
| Chat not rendering | `ChatArea.tsx` (39 useState, ~2000 lines) — check custom markdown blocks |
| Stripe/payment issue | `api/webhooks/stripe.ts` (14 console.logs — check those) |

## Step 4: Diagnose

- Form a hypothesis based on evidence, not guessing
- Check `TROUBLESHOOTING.md` (61 solved issues) — the problem may already be documented
- For language-related bugs, verify the endpoint uses `extractLanguages()` or `getProfileLanguages()`, not manual fallbacks

## Step 5: Fix

**Rules for the fix:**
1. **Minimal change** — fix the bug, don't refactor surrounding code
2. **Use shared utils** — import from `utils/`, never copy validation/language/middleware code
3. **No new console.log** — use `logger` from `utils/logger.ts`
4. **Run checks**: `npx tsc --noEmit && npm run build`
5. **Monster components** (ChatArea, FlashcardGame, TutorGames, Hero) — test thoroughly, watch for state interaction bugs

## Common Quick Fixes

**API returns 401:** Check that the endpoint calls `verifyAuth(req)` and the frontend sends the auth header.

**Language defaults to Polish/English:** The endpoint is probably using `|| 'pl'` instead of `extractLanguages()` or `getProfileLanguages()`.

**Gemini returns malformed data:** Check the schema in `schema-builders.ts` matches what the prompt asks for. Mismatches between prompt instructions and schema structure cause silent failures.

**Words not syncing to LoveLog:** Verify the saving code dispatches `dictionary-updated` event after the Supabase insert succeeds.

**Game shows wrong answers:** Check `utils/answer-helpers.ts` — `normalizeAnswer()` handles diacritics, case, articles. Make sure the component imports from there, not a local copy.
