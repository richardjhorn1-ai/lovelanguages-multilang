# Love Languages - Troubleshooting Guide

Issues encountered during MVP to production migration and their solutions.

---

## Issue 1: Infinite Recursion in RLS Policies

**Error:**
```
Supabase error: infinite recursion detected in policy for relation "profiles"
```

**Cause:**
RLS policies that query the same table they're protecting create infinite loops.

**Bad pattern:**
```sql
CREATE POLICY "Users can view linked partner" ON profiles
  FOR SELECT USING (
    id = (SELECT linked_user_id FROM profiles WHERE id = auth.uid())
  );
```

**Solution:**
Create a `SECURITY DEFINER` function to break the recursion:

```sql
CREATE OR REPLACE FUNCTION get_linked_partner_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT linked_user_id FROM profiles WHERE id = user_uuid;
$$;

CREATE POLICY "Users can view linked partner profile" ON profiles
  FOR SELECT USING (id = get_linked_partner_id(auth.uid()));
```

---

## Issue 2: Chat Mode Case Mismatch (400 Bad Request)

**Error:**
```
POST https://xxx.supabase.co/rest/v1/chats?select=* 400 (Bad Request)
```

**Cause:**
Database schema had uppercase mode constraint (`'LISTEN', 'CHAT', 'TUTOR'`) but frontend code uses lowercase (`'listen', 'chat', 'tutor'`).

**Solution:**
```sql
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_mode_check;
ALTER TABLE chats ADD CONSTRAINT chats_mode_check CHECK (mode IN ('listen', 'chat', 'tutor'));
```

---

## Issue 3: "Please log in to continue chatting" (401 Unauthorized)

**Error:**
API returns 401, chat shows "Please log in to continue chatting"

**Cause:**
Serverless API functions couldn't read environment variables. Multiple factors:

1. `SUPABASE_SERVICE_KEY` marked as "sensitive" in Vercel excludes it from Development environment
2. `.env.local` not being read by `vercel dev`
3. Missing `SUPABASE_URL` (non-VITE prefixed) for server-side code

**Solution:**

1. Create both `.env.local` AND `.env` files with all variables
2. Include both VITE-prefixed (client) and non-prefixed (server) versions:

```env
# Client-side (VITE_ prefix exposes to browser)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side (for API routes)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

3. Restart `vercel dev` after any `.env` changes

---

## Issue 4: Vercel Project Name Validation

**Error:**
```
Error: Project names can be up to 100 characters long and must be lowercase.
```

**Cause:**
Used uppercase letters in project name (e.g., "LoveLanguages3")

**Solution:**
Use lowercase with hyphens: `love-languages`

---

## Issue 5: Sensitive Environment Variables in Development

**Error:**
```
Error: You cannot set a Sensitive Environment Variable's target to development.
```

**Cause:**
Vercel doesn't allow sensitive env vars for the Development environment.

**Solution:**
For sensitive keys (`SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`):
- Select only **Production** and **Preview** in Vercel
- Use `.env` / `.env.local` files for local development

---

## Issue 6: Email Confirmation Blocking Signups

**Symptom:**
"Check email for confirmation" but no email arrives

**Solution (for development):**
1. Supabase Dashboard → Authentication → Providers → Email
2. Turn OFF "Confirm email"
3. Re-enable for production with proper SMTP configured

---

## Environment Variables Checklist

Your `.env` and `.env.local` should contain:

```env
# Client-side
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Gemini
GEMINI_API_KEY=your-key

# CORS
ALLOWED_ORIGINS=https://lovelanguages.xyz,http://localhost:3000,http://localhost:5173
```

---

## Vercel Environment Variables

| Variable | Environments | Sensitive |
|----------|--------------|-----------|
| VITE_SUPABASE_URL | All | No |
| VITE_SUPABASE_ANON_KEY | All | No |
| SUPABASE_URL | Prod + Preview | No |
| SUPABASE_SERVICE_KEY | Prod + Preview | Yes |
| GEMINI_API_KEY | Prod + Preview | Yes |
| ALLOWED_ORIGINS | All | No |

---

## Quick Debug Commands

```bash
# Check env variable names in .env.local
cat .env.local | grep -E "^[A-Z]" | cut -d'=' -f1

# List Vercel environment variables
vercel env ls

# Restart dev server (required after env changes)
# Ctrl+C then:
vercel dev
```

---

## RLS Policies Quick Reference

If you get RLS errors, verify these policies exist:

```sql
-- Check existing policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

Required policies:
- `profiles`: SELECT, INSERT, UPDATE for own profile
- `chats`: SELECT, INSERT, UPDATE, DELETE for own chats
- `messages`: SELECT, INSERT for messages in own chats
- `dictionary`: ALL for own vocabulary
- `scores`: ALL for own scores

---

## Issue 7: Gemini API Key Typo in Vercel

**Error:**
```
POST https://www.lovelanguages.xyz/api/chat 500 (Internal Server Error)
```

**Cause:**
Environment variable was named `GEMINI_API_KE` instead of `GEMINI_API_KEY` (missing the 'Y')

**Solution:**
```bash
vercel env rm GEMINI_API_KE
vercel env add GEMINI_API_KEY
vercel --prod  # Redeploy
```

**Lesson:** Always double-check env var names with `vercel env ls`

---

## Issue 8: Mode Names Migration (chat/tutor → ask/learn)

**Context:**
Renamed modes from CHAT/TUTOR/LISTEN to ASK/LEARN (removed LISTEN entirely)

**Database Migration:**
```sql
-- Update constraint to accept new values
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_mode_check;
ALTER TABLE chats ADD CONSTRAINT chats_mode_check CHECK (mode IN ('ask', 'learn', 'chat', 'tutor', 'listen'));

-- Migrate existing data
UPDATE chats SET mode = 'ask' WHERE mode = 'chat';
UPDATE chats SET mode = 'learn' WHERE mode = 'tutor';
DELETE FROM chats WHERE mode = 'listen';
```

**Code Changes:**
- `types.ts`: Changed `ChatMode = 'ask' | 'learn'`
- `api/chat.ts`: Added mode mapping for backwards compatibility
- `ChatArea.tsx`: Updated mode buttons and default mode

---

## Issue 9: AI Not Following Formatting Instructions

**Problem:**
LEARN mode responses showed plain text tables instead of using `::: table` markdown syntax

**Example of bad output:**
```
Form    Polish    Pronunciation
I love  Kocham    KOH-ham
```

**Expected output:**
```
::: table
Form | Polish | Pronunciation
---|---|---
I love | Kocham | KOH-ham
:::
```

**Solution:**
Made prompts extremely explicit with:
1. Exact copy-paste patterns
2. Complete example responses
3. Validation checklist
4. Warning: "If you write a table WITHOUT ::: markers, IT WILL NOT RENDER"

**Key lesson:** LLMs need explicit, repetitive instructions for formatting. Show the exact pattern multiple times and explain consequences of not following it.

---

## Issue 10: Responses Too Verbose/Repetitive

**Problem (ASK mode):**
```
"You can say 'Good morning' by saying Dzień dobry (Good morning)..."
```
Too repetitive - says "good morning" three times.

**Solution:**
Added explicit "BANNED" section in prompt:
```
BANNED:
- Repeating the English translation multiple times
- Saying "you can say X by saying X"
```

Added good/bad examples:
```
Good: "Dzień dobry (jen DOH-bri)! Whisper it to them before they open their eyes."
Bad: "You can say good morning by saying Dzień dobry (Good morning)..." ← TOO REPETITIVE
```

---

## AI Prompt Design Lessons Learned

1. **Be explicit about format** - Show exact patterns, not just descriptions
2. **Provide complete examples** - Full response examples work better than rules
3. **Show bad examples** - "Don't do this" is as important as "Do this"
4. **Add consequences** - "IT WILL NOT RENDER" creates urgency
5. **Use checklists** - Validation checklists help model self-check
6. **Repetition helps** - State important rules multiple times
7. **Mode differentiation** - Each mode needs drastically different instructions
8. **Test iteratively** - Prompts need multiple rounds of refinement

---

## Current Architecture

### Modes (as of latest update)

| Mode | Purpose | Style |
|------|---------|-------|
| **ASK** | Quick Q&A | 2-3 sentences, conversational, no formatting |
| **LEARN** | Structured lessons | Tables, drills, formatted blocks |

### Special Markdown Blocks

The frontend renders these custom blocks:
- `::: table` - Grammar/conjugation tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

---

## Completed Features

1. ✅ **Streaming responses** - Text appears word-by-word as Gemini generates
2. 🚧 **Voice mode** - In progress (see Issue 11 below)

---

## Issue 11: Voice Mode - Gemini Live API Integration (FIXED)

**Goal:** Add voice input/output using Gemini Live API with ephemeral tokens

### Attempt 1: Direct API Key in WebSocket

**Error:**
```
WebSocket closed: 1008 Method doesn't allow unregistered callers
```

**Cause:** Gemini Live WebSocket doesn't accept raw API keys - requires ephemeral tokens

**Lesson:** Never expose API keys to the client. Use ephemeral tokens.

---

### Attempt 2: Wrong REST Endpoint for Ephemeral Tokens

**Error:**
```
POST /api/live-token 500 (Internal Server Error)
```

**Attempted endpoint:**
```
POST https://generativelanguage.googleapis.com/v1alpha/models/{model}:generateEphemeralToken
```

**Cause:** This endpoint doesn't exist. The SDK has `authTokens.create()` method.

---

### Attempt 3: Wrong WebSocket Endpoint

**Error:**
```
WebSocket closed: 1008 Method doesn't allow unregistered callers
```

**Wrong endpoint:**
```
wss://...GenerativeService.BidiGenerateContent?key=TOKEN
```

**Solution:** For ephemeral tokens, use:
```
wss://...GenerativeService.BidiGenerateContentConstrained?access_token=TOKEN
```

Key differences:
- Use `BidiGenerateContentConstrained` (not `BidiGenerateContent`)
- Use `access_token` parameter (not `key`)

---

### Attempt 4: Wrong SDK Parameters

**Error:**
```
TypeScript errors: 'lockedConfig' does not exist
```

**Cause:** SDK uses `liveConnectConstraints` not `lockedConfig`

**Fix:**
```typescript
// Wrong:
await ai.authTokens.create({ lockedConfig: {...} })

// Correct:
await ai.authTokens.create({
  config: {
    uses: 1,
    liveConnectConstraints: {
      model: 'models/gemini-2.0-flash-live-001',
      config: { responseModalities: ['AUDIO', 'TEXT'] }
    }
  }
})
```

---

### Attempt 5: Wrong Model Name

**Error:**
```
WebSocket closed: 1008 models/gemini-2.0-flash-live-001 is not found for API version v1main
```

**Fix:** Changed model to `gemini-2.5-flash-native-audio-preview-12-2025` (from official docs)

---

### Attempt 6: Sending Setup Message with Constrained Endpoint

**Error:**
```
WebSocket closed: 1007 Request contains an invalid argument.
```

**Cause:** With `BidiGenerateContentConstrained` + ephemeral tokens, the config is LOCKED in the token. Sending a setup message conflicts with the locked config.

**Fix:** Removed the setup message entirely. With constrained endpoint, connection is ready immediately after WebSocket opens.

---

### Attempt 7: Setup Message Causes Loop

**Error:**
```
WebSocket closed: 1007 setup must be the first message and only the first
```

**Cause:** Sending setup message with Constrained endpoint + locked token caused infinite reconnect loop.

**Fix:** The error message is misleading. We were sending setup, but it conflicts with locked config. Disabled auto-reconnect on 1007/1008 codes.

---

### Attempt 8: No Setup + Immediate Audio (FAILED)

**Error:**
```
WebSocket closed: 1007 setup must be the first message and only the first
```

**What happened:**
- Audio was being sent immediately upon WebSocket connection
- Server expects setup message FIRST, even with Constrained endpoint
- Reconnect loop continued (code wasn't deployed or cached version running)
- Loop only stopped when microphone permission was denied

**Console output showed:**
```
Connected to Gemini Live
[Deprecation] ScriptProcessorNode... (audio started!)
WebSocket closed: 1007 setup must be the first message
```

**Root cause identified:**
The audio recorder starts and sends PCM data BEFORE anything else. The server rejects this because it expects a setup message first.

---

### Key Insight: The Contradiction

We have conflicting requirements:

1. **Attempt 6**: Sending setup message with Constrained endpoint → "Request contains an invalid argument"
2. **Attempt 7-8**: NOT sending setup → "setup must be the first message"

**Possible solutions to try:**

A. **Use non-Constrained endpoint** (`BidiGenerateContent` instead of `BidiGenerateContentConstrained`)
   - May require different auth method (API key vs access_token)
   - Check Google docs for correct endpoint with ephemeral tokens

B. **Send setup with EMPTY config** (since config is locked in token):
   ```typescript
   this.sendMessage({ setup: {} });
   ```

C. **Send setup with MATCHING config** (same as what's in the token):
   ```typescript
   this.sendMessage({
     setup: {
       model: 'models/gemini-2.5-flash-native-audio-preview-12-2025'
       // No other config - it's locked in token
     }
   });
   ```

D. **Wait for setupComplete BEFORE starting audio**:
   The critical fix is to NOT start audio recording until setupComplete is received:
   ```typescript
   ws.onopen = () => {
     // Send setup, but DON'T start audio yet
     this.sendMessage({ setup: { model: `models/${model}` } });
   };

   // In handleMessage:
   if (message.setupComplete) {
     this.setState('listening');
     this.startListening(); // Only NOW start audio
   }
   ```

E. **Check if endpoint URL is wrong** - maybe should be:
   - `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`
   - With `?key=EPHEMERAL_TOKEN` or `?access_token=EPHEMERAL_TOKEN`

---

### Attempt 9: Send Minimal Setup + Wait for setupComplete (FAILED)

**Tried:** Send setup message with model name or empty setup before audio.

**Result:** `Request contains an invalid argument` - ANY setup message conflicts with the locked config in the ephemeral token.

---

### Attempt 10: Use SDK Instead of Raw WebSockets (TESTING)

**Approach:** Instead of manually handling WebSocket protocol, use the official `@google/genai` SDK which handles the protocol internally.

**Implementation:**
```typescript
import { GoogleGenAI, Modality } from '@google/genai';

// Create client with ephemeral token
const ai = new GoogleGenAI({
  apiKey: token,  // ephemeral token from backend
  httpOptions: { apiVersion: 'v1alpha' }
});

// SDK handles WebSocket connection and setup internally
const session = await ai.live.connect({
  model: `models/${model}`,
  config: { responseModalities: [Modality.AUDIO, Modality.TEXT] },
  callbacks: { onmessage, onerror, onclose }
});

// Send audio via SDK method
session.sendRealtimeInput({
  audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' }
});
```

**Status:** Session connects but closes immediately with "invalid argument".

---

### Attempt 11: FINAL FIX - Native Audio Model Doesn't Support TEXT Modality

**Root Cause Discovered:** The `gemini-2.5-flash-native-audio-preview-12-2025` model does NOT support `TEXT` in `responseModalities`. This causes an immediate 1007 "invalid argument" error.

**Key GitHub Issue:** https://github.com/googleapis/js-genai/issues/1212

**The Complete Fix:**

1. **Model:** Use `gemini-2.5-flash-native-audio-preview-12-2025` (the ONLY model that supports Live API)

2. **responseModalities:** Use `['AUDIO']` only - NOT `['AUDIO', 'TEXT']`

3. **Transcription:** Use `outputAudioTranscription: {}` and `inputAudioTranscription: {}` instead

4. **API Version:** Use `apiVersion: 'v1alpha'` on BOTH backend and frontend

**Working Implementation:**

```typescript
// Backend: Create token with correct config
const tokenResponse = await ai.authTokens.create({
  config: {
    uses: 1,
    httpOptions: { apiVersion: 'v1alpha' },
    liveConnectConstraints: {
      model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: ['AUDIO'],  // NOT ['AUDIO', 'TEXT']!
        outputAudioTranscription: {},   // For model's speech-to-text
        inputAudioTranscription: {},    // For user's speech-to-text
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
          }
        },
        systemInstruction: { parts: [{ text: '...' }] }
      }
    }
  }
});

// Frontend: Use token with v1alpha
const ai = new GoogleGenAI({
  apiKey: token,
  apiVersion: 'v1alpha',
  httpOptions: { apiVersion: 'v1alpha' }
});

// Connect WITHOUT config (it's locked in token)
const session = await ai.live.connect({
  model: `models/${model}`,
  callbacks: { onopen, onmessage, onerror, onclose }
});
```

**Handling Transcriptions (Frontend):**

```typescript
// Transcriptions come via inputTranscription/outputTranscription, NOT userTurn.parts
if (content.inputTranscription?.text) {
  // What user said
}
if (content.outputTranscription?.text) {
  // What model said
}
```

**Key Lessons:**
1. Native audio model ONLY supports `responseModalities: ['AUDIO']`
2. Use `outputAudioTranscription` and `inputAudioTranscription` for text transcripts
3. Ephemeral tokens require `v1alpha` on both backend AND frontend
4. The SDK handles WebSocket protocol - no manual setup messages needed

---

### Key References

- [Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)
- [Ephemeral Tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)
- [js-genai SDK](https://github.com/googleapis/js-genai)
- [GitHub Issue #821](https://github.com/google-gemini/cookbook/issues/821) - Ephemeral token working example

---

### Useful Documentation Links

- Gemini Live API: https://ai.google.dev/gemini-api/docs/live
- Ephemeral Tokens: https://ai.google.dev/gemini-api/docs/ephemeral-tokens
- WebSocket reference: Check for `BidiGenerateContent` vs `BidiGenerateContentConstrained`

---

## Voice Mode Architecture (Current)

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Browser    │──1──▶│  /api/live-token  │──2──▶│ Google authTokens│
│              │       │  (Vercel)         │       │   .create()     │
│              │◀──3───│                   │◀──────│                 │
│              │       └──────────────────┘       └─────────────────┘
│              │           token: auth_tokens/xxx
│              │
│              │──4──▶ wss://...BidiGenerateContentConstrained
│              │       ?access_token=auth_tokens/xxx
│              │
│  WebSocket   │◀─────▶ Bidirectional Audio
└──────────────┘
```

**Security:**
- API key stays on server only
- Ephemeral token: single-use, expires in 30 min
- Config locked to specific voice settings

---

## Voice Mode Files

| File | Purpose |
|------|---------|
| `/api/live-token.ts` | Generates ephemeral tokens server-side |
| `/services/audio-utils.ts` | AudioRecorder (16kHz) + AudioPlayer (24kHz) |
| `/services/live-session.ts` | WebSocket connection & state management |
| `/components/ChatArea.tsx` | Voice UI (mic button, glow, indicators) |

---

## Voice Personalities

| Mode | Voice | Personality |
|------|-------|-------------|
| ASK | Puck | Casual, friendly |
| LEARN | Kore | Clear, teacher-like |

---

## Issue 12: Voice Mode Speaks Polish First (Should be English-First)

**Date:** January 2025

**Problem:**
Voice mode defaults to speaking Polish first and then translating to English. For beginners, this is confusing - conversations should be primarily in English with Polish words introduced gradually.

**Transcript Example:**
```
User: "I want to say I'm going to fall asleep with you tonight to my girlfriend"
Cupid: "That is so romantic! In Polish, you can say, 'Zasnę z tobą dziś w nocy.'"
```

**Expected Behavior:**
- Primarily English conversation
- Polish words introduced one at a time
- English translation/explanation first, then Polish

**Root Cause:**
The system instruction in `/api/live-token.ts` may not be explicit enough about English-first approach for beginners.

**Fix Applied (Jan 2025):**
- Updated `COMMON` prompt to emphasize "ENGLISH FIRST" approach
- Pattern: English explanation → Polish word → pronunciation tip
- Both `ask` and `learn` modes now instruct to speak primarily in English with Polish sprinkled in

**Status:** FIXED - Prompt updated in `/api/live-token.ts`. Test to verify behavior.

---

## Issue 13: Transcription Shows Wrong Script (Arabic/Russian Characters)

**Date:** January 2025

**Problem:**
User's English speech is being transcribed as Arabic (ز توبه زی ناچی) or Cyrillic (дівняція) characters instead of English.

**Transcript Example:**
```
User said: "Zasnę z tobą dziś w nocy" (attempting Polish)
Transcribed as: "ز توبه زی ناچی" (Arabic script)

User said: "dziś w nocy"
Transcribed as: "дівняція" (Cyrillic)

User said: "Jesus"
Transcribed as: "Jesus" (correct)
```

**Observations:**
- When user speaks Polish words, transcription picks wrong language
- When user speaks clear English, transcription is correct
- Gemini Live's `inputTranscription` may be auto-detecting language incorrectly

**Possible Causes:**
1. User's Polish pronunciation is being interpreted as similar-sounding Arabic/Russian
2. No language hint in audio transcription config
3. Gemini's speech recognition defaults to multi-language detection

**Potential Fixes:**
1. ~~Add `languageCode: 'en-US'` or `'pl-PL'` to inputAudioTranscription config~~ - NOT SUPPORTED
2. Accept that phonetic Polish attempts may transcribe oddly
3. Only save user messages in English (model should respond to audio, transcription is for display only)

**Investigation (Jan 2025):**
- Tried `languageCodes: ['en-US', 'pl-PL']` - API error: "Unknown name 'languageCodes'"
- Tried `languageCode: 'en-US'` - API error: "Unknown name 'languageCode'"
- Gemini Live API's `inputAudioTranscription` does NOT support language hints as of Jan 2025
- The API auto-detects language with no way to constrain it

**Status:** BLOCKED - Gemini Live API does not support language configuration for input transcription. Must accept that Polish pronunciation attempts may transcribe as wrong scripts.

---

## Issue 14: Harvest API Transient 500 Error

**Date:** January 2025

**Error:**
```
POST /api/analyze-history 500 (Internal Server Error)
Batch Extraction Error: SyntaxError: Unexpected token 'H', "HeadersTim"... is not valid JSON
```

**Behavior:**
- Failed on first attempt
- Succeeded on second attempt
- Intermittent issue

**Possible Causes:**
1. Race condition in API response parsing
2. Gemini API returned non-JSON response (error message starting with "Headers...")
3. Response timeout causing partial response
4. Gemini API rate limiting returning HTML error page

**Fix Applied (Jan 2025):**
- Added validation to check if response is valid JSON before parsing
- Added separate try-catch for JSON.parse with descriptive error messages
- Returns `retryable: true` flag so client knows to retry
- Returns 502 status for upstream errors vs 500 for internal errors

**Status:** FIXED - Better error handling in `/api/analyze-history.ts`

---

## Issue 15: Voice Mode - Agent Messages Not Saved on Interrupt

**Date:** January 2025

**Problem:**
When user interrupts the AI during voice mode, the agent's partial message is lost and not saved to chat history. Only user messages are being saved.

**Root Cause:**
In `/services/live-session.ts`, the `handleServerContent()` function was clearing `currentTranscript` on interruption without first saving it:
```javascript
if (content.interrupted) {
  this.currentTranscript = '';  // Lost without saving!
  return;
}
```

**Fix Applied (Jan 2025):**
- Before clearing, check if there's a partial transcript and save it as final
- Added: `this.config.onTranscript?.('model', this.currentTranscript, true)` before clearing

**Status:** FIXED - `/services/live-session.ts` now saves partial model transcripts on interrupt

---

## Issue 16: Harvest Not Extracting All Words

**Date:** January 2025

**Problem:**
The "Update" button in Love Log (word harvest) does not extract all Polish words from the chat history. Many words that were discussed/learned are missing from the Love Log.

**Current Behavior:**
- Harvest analyzes last 100 messages
- Only extracts a subset of the Polish words discussed
- Some obvious vocabulary is being missed

**Possible Causes:**
1. **100 message limit** - older conversations not being analyzed (`/api/analyze-history.ts` line 40: `.limit(100)`)
2. **Prompt limitations** - Gemini may not be extracting all vocabulary due to prompt constraints
3. **Duplicate filtering** - words that look similar to known words may be skipped
4. **Context window** - large chat histories may exceed model's effective extraction ability

**Files to Investigate:**
- `/api/analyze-history.ts` - extraction prompt and logic
- `/components/LoveLog.tsx` - `handleHarvest()` function, line 40: `knownWords` filtering

**Potential Fixes:**
1. Increase message limit or paginate through all messages
2. Improve extraction prompt to be more thorough
3. Run multiple extraction passes
4. Add "force re-extract" option that ignores known words list
5. Batch messages into smaller chunks for better extraction

**Status:** OPEN - Needs investigation into extraction completeness
