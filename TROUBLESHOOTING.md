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

---

## Issue 17: CSS Styling Leaking Into Chat Output (RESOLVED)

**Date:** January 2025

**Problem:**
AI responses contain raw CSS/styling artifacts instead of clean text. Polish words appear with literal CSS code visible to users.

**Example of bad output:**
```
The verb "to be" is "(#FF4761) font-semibold">być". Here's the conjugation:
I    (#FF4761) font-semibold">jestem    (YES-tem)
```

**Expected output:**
```
The verb "to be" is **być**. Here's the conjugation:
I    **jestem**    (YES-tem)
```

---

### ROOT CAUSE FOUND

The issue was NOT with the AI model outputting CSS - the AI was correctly outputting clean markdown like `**Cześć** [cheshch]`. The problem was in the `parseMarkdown()` function in `components/ChatArea.tsx`.

**The Bug:**
The regex replacements were applied in the WRONG ORDER:

```javascript
// OLD CODE (buggy)
return clean
  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#FF4761] font-semibold">$1</strong>')  // Step 1
  .replace(/\[(.*?)\]/g, '<span class="text-gray-400 italic text-sm">($1)</span>')       // Step 2
```

**What Happened:**
1. `**Cześć**` was converted to `<strong class="text-[#FF4761] font-semibold">Cześć</strong>`
2. Then the `[brackets]` regex matched `[#FF4761]` INSIDE the Tailwind class attribute!
3. Result: `<strong class="text-<span...>(#FF4761)</span> font-semibold">Cześć</strong>`
4. This broken HTML displayed the class name as visible text

---

### THE FIX

**File:** `components/ChatArea.tsx` (lines 44-51)

```javascript
// NEW CODE (fixed)
return clean
  // Pronunciation MUST run FIRST to avoid matching brackets in HTML attributes
  .replace(/\[(.*?)\]/g, '<span class="text-gray-400 italic text-sm">($1)</span>')
  // Polish words use inline style to avoid bracket conflicts entirely
  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FF4761; font-weight: 600;">$1</strong>')
```

**Two Changes:**
1. **Reversed the order** - Process `[brackets]` FIRST, before any HTML is created
2. **Switched to inline styles** - Changed from `class="text-[#FF4761]"` to `style="color: #FF4761"` to avoid bracket syntax entirely

---

### Also Updated

1. **Simplified system prompts** (`api/chat.ts`, `api/chat-stream.ts`)
   - Removed negative "FORBIDDEN" examples (which may have confused the model)
   - Kept only positive instructions: "Use **asterisks** and [brackets]"

2. **Switched to gemini-3-flash-preview model**
   - Better instruction following
   - Consistent markdown output

---

### Key Lesson

When debugging AI output issues, ALWAYS check the rendering pipeline first. The AI was correct all along - it was our own code transforming clean text into garbage.

**Status:** ✅ RESOLVED - Formatting now works correctly. See `docs/FORMATTING.md` for full documentation

---

## Issue 18: Voice Mode Not Extracting Vocabulary to Love Log

**Date:** January 2025

**Problem:**
After a voice conversation containing Polish words, no words were being added to the Love Log. Text chat extracted words correctly, but voice mode did not.

**Root Cause:**
The `stopLive()` function in `ChatArea.tsx` had a **stale closure** problem. When the voice session ended, it referenced the `messages` state from when the function was created, not the current state with all the voice transcripts.

```typescript
// OLD CODE (broken)
const stopLive = async () => {
  // ...
  const voiceMessages = messages.slice(voiceSessionStartIdx.current);
  // ^^^ This `messages` was stale - didn't include voice transcripts!
};
```

**The Fix:**
Fetch fresh messages directly from the database after the voice session ends:

```typescript
// NEW CODE (fixed)
const stopLive = async () => {
  const chatId = activeChat?.id;
  const startIdx = voiceSessionStartIdx.current;

  liveSessionRef.current?.disconnect();
  setIsLive(false);

  if (!chatId) return;

  // Wait for final messages to be saved
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Fetch FRESH messages from database
  const { data: allMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (!allMessages) return;

  // Now we have the actual voice transcripts
  const voiceMessages = allMessages.slice(startIdx);

  // Analyze and extract vocabulary
  const harvested = await geminiService.analyzeHistory(
    voiceMessages.map(m => ({ role: m.role, content: m.content })),
    knownWords
  );

  // Save and show notification
  if (harvested.length > 0) {
    await saveExtractedWords(harvested);
    setNewWordsNotification(harvested);
  }
};
```

**Key Lesson:** React state in async closures can be stale. For critical operations that need current data, fetch directly from the database.

**Status:** ✅ FIXED - Voice mode now extracts vocabulary when session ends

---

## Issue 19: Incomplete Verb Conjugation Data (Partial Past Tense)

**Date:** January 2025

**Problem:**
Verbs were being extracted with incomplete past tense conjugations - only 3 of 6 persons were filled:

```json
{
  "word": "zaprosić",
  "conjugations": {
    "present": { "ja": "zaproszę", "ty": "zaprosisz", ... },  // All 6 ✅
    "past": { "ja": "zaprosiłem", "ty": "zaprosiłeś", "onOna": "zaprosił" }  // Only 3! ❌
  }
}
```

**Root Cause:**
The API prompts said past/future tenses were "optional but recommended" - so Gemini returned partial data when unsure.

**The Fix:**
Updated prompts in both `api/chat.ts` and `api/analyze-history.ts` to enforce all-or-nothing:

```
=== FOR VERBS ===
- MUST include "conjugations" with ALL 6 persons for present tense
- Past/future tenses: ONLY include if you can fill ALL 6 persons completely.
  Do NOT include partial data - OMIT the entire tense rather than leaving blanks.
```

**Key Lesson:** Be explicit about data completeness requirements. "Optional" encourages incomplete data.

**Status:** ✅ FIXED - API now returns either complete tense data or omits the tense entirely

---

## Issue 20: Practice Level Tests - "No Theme Found" Error

**Date:** January 2025

**Problem:**
Practice level tests were failing with "No theme found for transition Beginner 2 -> Beginner 3" error. Users couldn't take practice tests from the Progress page.

**Root Cause:**
Key format mismatch between what `getThemeForTransition()` was creating vs what `LEVEL_THEMES` expected:

```typescript
// API was creating:
"Beginner 2->Beginner 3"  // WRONG - full format for intra-tier

// But LEVEL_THEMES used:
"Beginner 2->3"           // CORRECT - short format for intra-tier
"Beginner 3->Elementary 1" // Full format only for cross-tier
```

**The Fix:**

Updated `getThemeForTransition()` in `/api/generate-level-test.ts` to parse level names and create the correct key format:

```typescript
function getThemeForTransition(fromLevel: string, toLevel: string): LevelTheme | null {
  const fromParts = fromLevel.match(/^(.+)\s+(\d)$/);
  const toParts = toLevel.match(/^(.+)\s+(\d)$/);

  if (!fromParts || !toParts) {
    // Unparseable - try direct lookup
    const key = `${fromLevel}->${toLevel}`;
    return LEVEL_THEMES[key] || null;
  }

  const fromTier = fromParts[1];
  const fromNum = fromParts[2];
  const toTier = toParts[1];
  const toNum = toParts[2];

  let key: string;
  if (fromTier === toTier) {
    // Same tier: use short format "Beginner 2->3"
    key = `${fromTier} ${fromNum}->${toNum}`;
  } else {
    // Cross tier: use full format "Beginner 3->Elementary 1"
    key = `${fromLevel}->${toLevel}`;
  }

  return LEVEL_THEMES[key] || null;
}
```

**Key Lesson:** When debugging lookup failures, always verify the exact key format being used matches the expected format in the map/object.

**Status:** ✅ FIXED - Practice level tests now load themes correctly

---

## Issue 21: Test Results Review - Initial Dropdown Implementation Failed

**Date:** January 2025

**Problem:**
After completing a level test, users wanted to review their answers and see what they got wrong. Initial implementation added a "Review Answers" dropdown to the test results screen, but it didn't display any content when clicked.

**Initial Approach (Failed):**
Added an expandable dropdown directly on the `LevelTest.tsx` results screen with question-by-question review.

**User Feedback:**
> "the code for the dropdown was created but i clicked review answers and nothing appeared afterwards. perhaps we can add a test results section to the progress section, maybe as another dropdown within the previous tests section"

**The Better Solution:**

Instead of inline dropdown on test results, implemented a comprehensive system:

1. **Previous Attempts Section** - List icon appears next to levels that have past test attempts
2. **Expandable Attempts List** - Click to see all attempts for that level with date, score, pass/fail
3. **Test Results Modal** - Click any attempt to see full results in a popup:
   - Score and correct answer count
   - List of all questions with user's answer vs correct answer
   - Color-coded: green for correct, red for incorrect
   - "Try Again" button to retake the test

**Files Modified:**
- `components/Progress.tsx` - Added attempts fetching, modal, expandable sections
- `components/LevelTest.tsx` - Simplified results, added "View detailed results on Progress" link
- `api/submit-level-test.ts` - Store user answers in questions array for later review
- `constants.tsx` - Added List icon

**Key Lesson:** Sometimes a feature belongs in a different location than initially planned. Moving test results review to the Progress page (where users already go to see their learning journey) made more sense than an inline dropdown.

**Status:** ✅ FIXED - Test results viewable via modal on Progress page

---

## Issue 22: AI Challenge Mode Implementation

**Date:** January 2025

**Feature Request:**
Add an AI Challenge mode to the Play section that:
1. Tracks word mastery based on consecutive correct answers
2. Generates personalized challenges targeting weak words
3. Shows mastery progress badges in Love Log

**Key Implementation Decisions:**

1. **AI Challenge as 4th Play Tab** (not separate route)
   - Initially implemented as standalone `/challenge` route
   - User feedback: "should be a subtab in play just like flashcards, multiple choice, and type it"
   - Refactored to integrate into `FlashcardGame.tsx` as 4th mode

2. **Streak-Based Mastery**
   - Word is "LEARNED" after 5 consecutive correct answers
   - Wrong answer resets streak to 0 (full reset, not partial)
   - No decay - once learned, always learned
   - Database columns: `correct_streak INTEGER`, `learned_at TIMESTAMP`

3. **5 Challenge Modes:**
   - **Weakest Words** - Words with lowest success rate
   - **Mixed Gauntlet** - Random mix of all types
   - **Romantic Phrases** - 40 curated Polish romantic expressions
   - **Least Practiced** - Words not seen recently
   - **Review Mastered** - Practice learned words (disabled until words are mastered)

4. **Session Length Options:** 10, 20, or All questions

**Files Created/Modified:**

| File | Changes |
|------|---------|
| `components/FlashcardGame.tsx` | Major refactor - added AI Challenge as 4th mode, streak tracking, mastery logic |
| `components/LoveLog.tsx` | Added mastery badges (green checkmark for learned, amber for in-progress) |
| `types.ts` | Added `WordScore`, `AIChallengeMode`, `RomanticPhrase` interfaces |
| `constants.tsx` | Added Target, Zap, Trophy, Award, Shuffle, Clock icons |
| `constants/romantic-phrases.ts` | New file with 40 curated Polish romantic phrases |

**Database Schema (run in Supabase):**
```sql
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS correct_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS learned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

**Key Technical Details:**

1. **Score Update Logic:**
```typescript
const updateWordScore = async (wordId: string, isCorrect: boolean) => {
  const currentStreak = existingScore?.correct_streak || 0;
  const newStreak = isCorrect ? currentStreak + 1 : 0;  // Reset to 0 on wrong
  const wasLearned = existingScore?.learned_at != null;
  const justLearned = !wasLearned && newStreak >= 5;    // 5 = mastered

  // Upsert with onConflict to handle new/existing records
};
```

2. **Mode Count Calculation:**
```typescript
const modeCounts = useMemo(() => ({
  weakest: allScores.filter(s => s.fail_count > 0 && !s.learned_at)
    .sort((a,b) => (b.fail_count - b.success_count) - (a.fail_count - a.success_count))
    .length,
  // ... other modes
}), [allScores, romanticPhrases]);
```

**Status:** ✅ COMPLETE - AI Challenge working as Play section tab with full mastery tracking

---

## Issue 23: Phase 4 API Refactoring Failed (Vercel Limitation)

**Date:** January 5, 2026

**Goal:**
Extract shared utilities (CORS, sanitize, auth) from API files into `api/lib/` to reduce code duplication across 19 API endpoints.

**Attempted Solution:**
```
api/
├── lib/
│   ├── cors.ts      # setCorsHeaders()
│   ├── sanitize.ts  # sanitizeOutput()
│   ├── auth.ts      # verifyAuth(), getUserRole()
│   └── index.ts     # barrel export
├── chat.ts          # import { setCorsHeaders } from './lib/cors'
├── analyze-history.ts
└── ... (17 more files)
```

**Error:**
```
POST /api/chat 500 (Internal Server Error)
FUNCTION_INVOCATION_FAILED
```

TypeScript compiled fine. Build passed. But runtime failed.

**Root Cause:**
Vercel serverless functions bundle **each file independently**. When `chat.ts` imports from `./lib/cors.ts`, Vercel doesn't include `lib/cors.ts` in the `chat.ts` bundle.

**Attempted Workarounds:**

1. **Rename to `_lib/`** - Vercel excludes underscore-prefixed folders from routes, but still didn't bundle the imports
2. **Try different import paths** - `../api/lib/cors`, `@/api/lib/cors` - all failed

**Why It Doesn't Work:**
- Vercel's serverless model: Each API file = one isolated function
- Functions can import from `node_modules` (bundled) but NOT from sibling directories
- This is a fundamental architecture constraint, not a configuration issue

**Solution Options (for future):**

1. **Move utilities outside `api/`** - Put shared code in `lib/` or `utils/` at project root
2. **Use a build step** - Bundle API files before deployment (esbuild, rollup)
3. **Accept duplication** - Keep utilities inline in each API file (current state)
4. **Use middleware** - Vercel middleware can handle CORS, but not all utilities

**Decision:**
Reverted Phase 4 with `git reset --hard`. Accepted code duplication in API files. The 19 files have ~40 lines of duplicated CORS/auth code each, but they work reliably.

**Key Lesson:**
Vercel serverless functions have architectural constraints that differ from traditional Node.js apps. Always test serverless code in the actual environment, not just with `npx tsc` and local dev.

**Status:** DEFERRED - Documented for future reference. May revisit with build step approach.

---

## Codebase Refactoring Summary (January 5, 2026)

**What Was Completed:**

| Phase | Changes | Status |
|-------|---------|--------|
| Phase 1 | shuffleArray utility, dead code cleanup | ✅ Complete |
| Phase 2 | ExtractedWord/Attachment moved to types.ts | ✅ Complete |
| Phase 3 | Constants reorganized into constants/ folder | ✅ Complete |
| Phase 4 | API shared utilities | ❌ Failed (Vercel) |
| Phase 5 | GameResults component extracted | ✅ Partial |

**Files Changed:**
- `utils/array.ts` - New shuffleArray utility
- `constants/colors.ts`, `constants/icons.tsx`, `constants/index.ts` - Reorganized constants
- `types.ts` - Added ExtractedWord, Attachment interfaces
- `components/games/GameResults.tsx` - Extracted from FlashcardGame
- `services/gemini.ts` - Now imports types from types.ts

**Testing Strategy Used:**
```bash
# After every change:
npx tsc --noEmit  # TypeScript check
npm run build     # Build check
vercel dev        # Manual testing
```

**Git Safety Protocol:**
- One change at a time
- Verify before commit
- Branch for each phase (merged to main when complete)
- Reset to last known good state on failure

---

## Issue 24: Sticky Note Double Shadow Effect

**Date:** January 6, 2026

**Problem:**
The "Why I'm learning Polish" sticky note on the Progress page had a double shadow effect making it look off-brand.

**Cause:**
Conflicting shadow styles - both Tailwind's `shadow-md` class AND an inline `boxShadow` style were applied simultaneously:

```tsx
// BEFORE (double shadow)
<div className="... shadow-md ..."
  style={{ boxShadow: '4px 4px 0 rgba(251, 191, 36, 0.3)' }}>
```

**Solution:**
Redesigned the component from scratch as a "Motivation Card" using the app's accent color theme instead of the amber sticky-note style:

```tsx
// AFTER (clean gradient card)
<div className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-light)] via-[var(--bg-card)] to-[var(--accent-light)] p-6 rounded-[2rem] border border-[var(--accent-border)]">
  {/* Decorative heart watermark */}
  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07]">...</div>
  {/* Content */}
</div>
```

**Status:** ✅ FIXED - Component redesigned with proper theming

---

## Issue 25: Tutor Progress Page Hardcoded Colors

**Date:** January 6, 2026

**Problem:**
The tutor's Progress page had hardcoded teal and amber colors that didn't work well in dark mode and didn't match the app's theming.

**Affected Areas:**
- Stats Overview cards (teal-50, teal-100, amber-50, amber-100)
- Encouragement prompts (`from-white` gradient)
- Recently Learned word pills (teal-700, teal-400, teal-600)
- Icon colors (hardcoded amber-400)

**Example Before:**
```tsx
// Hardcoded colors - broken in dark mode
<div className="bg-teal-50 border-teal-100">
  <span className="text-teal-600">...</span>
</div>
```

**Solution:**
Replaced all hardcoded colors with CSS variables and dynamic accent colors:

```tsx
// Using CSS variables and accentHex
<div className="p-4 rounded-2xl border"
  style={{ backgroundColor: `${accentHex}15`, borderColor: `${accentHex}30` }}>
  <span style={{ color: accentHex }}>...</span>
</div>
```

**Files Changed:**
- `components/Progress.tsx` - Lines 417-492

**Status:** ✅ FIXED - All colors now use CSS variables for proper dark mode support

---

## Issue 26: ConversationPractice Icon Type Error

**Date:** January 6, 2026

**Error:**
```
Property 'icon' does not exist on type 'ConversationScenario'.
```

**Cause:**
The `ConversationScenario` interface in `services/live-session.ts` was missing the optional `icon` field that scenarios were using.

**Solution:**
Added the optional `icon` field to the interface:

```typescript
// services/live-session.ts
export interface ConversationScenario {
  id: string;
  name: string;
  icon?: string;  // Added this line
  persona: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

**Status:** ✅ FIXED

---

## Issue 27: Loading Dot Colors Not Using Accent Theme

**Date:** January 6, 2026

**Problem:**
Loading dot animations across multiple components were using hardcoded Tailwind colors (blue, teal, amber, purple) instead of the app's accent color CSS variable. This made loading states look inconsistent and broke theming.

**Affected Files:**
- `components/TutorGames.tsx` - `bg-teal-400`
- `components/PlayQuickFireChallenge.tsx` - `bg-amber-400`
- `components/WordGiftLearning.tsx` - mixed colors
- `components/ConversationPractice.tsx` - `bg-purple-400`

**Example Before:**
```tsx
<div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
```

**Fix:**
Replaced all hardcoded colors with CSS variable:
```tsx
<div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
```

**Status:** ✅ FIXED - All loading dots now use accent color

---

## Issue 28: Play Tab Losing State on Navigation

**Date:** January 6, 2026

**Problem:**
The Play tab (and other main tabs) would lose their state whenever the user navigated away and came back. Selected game mode, in-progress games, and scroll position were all reset.

**Root Cause:**
React Router's default behavior unmounts components when navigating away from their routes. When the Play tab component unmounts, all its local state is destroyed.

**Solution:**
Created a `PersistentTabs` component in `App.tsx` that renders all main tab components simultaneously and uses CSS visibility (`hidden` class) to show/hide them instead of mounting/unmounting:

```tsx
const PersistentTabs: React.FC<{ profile: Profile; onRefresh: () => void }> = ({ profile, onRefresh }) => {
  const location = useLocation();
  const path = location.pathname;

  const persistentPaths = ['/', '/log', '/play', '/progress'];
  const isPersistentPath = persistentPaths.includes(path);

  return (
    <>
      {/* Persistent tabs - always mounted, shown/hidden via CSS */}
      <div className={path === '/' ? 'h-full' : 'hidden'}>
        <ChatArea profile={profile} />
      </div>
      <div className={path === '/log' ? 'h-full' : 'hidden'}>
        <LoveLog profile={profile} />
      </div>
      <div className={path === '/play' ? 'h-full' : 'hidden'}>
        <FlashcardGame profile={profile} />
      </div>
      <div className={path === '/progress' ? 'h-full' : 'hidden'}>
        <Progress profile={profile} />
      </div>

      {/* Non-persistent routes - mounted/unmounted normally */}
      {!isPersistentPath && (
        <Routes>
          <Route path="/test" element={<LevelTest profile={profile} />} />
          <Route path="/profile" element={<ProfileView profile={profile} onRefresh={onRefresh} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </>
  );
};
```

**Key Insight:**
- Main tabs (Chat, Log, Play, Progress) stay mounted for the entire session
- Non-persistent routes (Test, Profile) still mount/unmount normally since they don't need state preservation
- CSS `hidden` is much faster than React unmount/remount cycles

**Status:** ✅ FIXED - Tab switching is now smooth and preserves state

---

## Issue 29: Love Package Auto-Suggestions Removed

**Date:** January 6, 2026

**Feature Change:**
Removed the debounced auto-suggestion feature from Love Package (WordRequestCreator) and replaced it with an explicit "Generate 10 Words" button.

**Why:**
- Auto-suggestions were firing too frequently on keystroke
- API calls were being made before user finished typing their topic
- No control over regeneration while keeping selected words

**New Behavior:**
1. User types a topic (e.g., "cooking vocabulary")
2. User clicks "Generate 10 Words" button
3. API returns 10 topic-related words, excluding words already in partner's Love Log
4. User can select words and click "Generate Again" to get more suggestions (keeps selected words)

**Implementation:**
- Added `partnerVocab` prop to WordRequestCreator to filter out existing words
- Added `excludeWords` parameter to create-word-request API
- Added `count` parameter to specify how many words to generate
- Added `dryRun` mode to generate suggestions without creating database record

**Status:** ✅ IMPLEMENTED

---

## Issue 30: Word Validation API for Manual Entries

**Date:** January 6, 2026

**Feature:**
Added AI validation for manually entered words in Love Package. When tutors type custom words, Gemini validates spelling and adds grammatical data.

**Endpoint:** `/api/validate-word.ts`

**What it does:**
1. Validates Polish spelling with Gemini
2. Returns corrections if word is misspelled (with `was_corrected: true` flag)
3. Adds grammatical data based on word type:
   - **Verbs:** All 6 conjugations for present tense (ja, ty, on/ona, my, wy, oni)
   - **Nouns:** Gender (masculine/feminine/neuter) + plural form
   - **Adjectives:** All 4 forms (masculine, feminine, neuter, plural)
4. Handles slang appropriately (recognizes valid slang vs typos)
5. Returns `correction_note` explaining what was fixed

**Example Response:**
```json
{
  "valid": true,
  "word": "gotować",
  "was_corrected": true,
  "correction_note": "Fixed spelling: 'gotowac' → 'gotować'",
  "translation": "to cook",
  "word_type": "verb",
  "pronunciation": "go-TO-vach",
  "conjugations": {
    "present": {
      "ja": "gotuję",
      "ty": "gotujesz",
      "onOna": "gotuje",
      "my": "gotujemy",
      "wy": "gotujecie",
      "oni": "gotują"
    }
  }
}
```

**UI Integration:**
- Shows loading spinner while validating
- Displays correction toast when word is auto-corrected
- Shows word type badge and "+data" indicator for grammatical context

**Status:** ✅ IMPLEMENTED

---

## Issue 31: submit-challenge.ts Server/Client Validation Mismatch

**Date:** January 6, 2026

**Problem:**
Tutor challenges (Quiz, Quick Fire) were being graded inconsistently. The client-side showed smart validation feedback ("Accepted: valid synonym"), but the server re-graded answers with basic string matching, causing mismatched scores.

**Root Cause:**
`/api/submit-challenge.ts` used a simple `fastMatch()` function that only normalized case and whitespace, while client components used smart validation via `/api/validate-answer` (Gemini-powered).

**Example Mismatch:**
- User types "lunch" for "obiad"
- Client shows: ✅ "Accepted: valid synonym" (smart validation)
- Server grades: ❌ Incorrect (basic matching)
- Final score lower than expected!

**The Fix:**
Added the same Gemini-powered `smartValidate()` function to `submit-challenge.ts`:

```typescript
// Fast local match first (no API call needed)
function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}

// Smart validation using Gemini API
async function smartValidate(
  userAnswer: string,
  correctAnswer: string,
  polishWord?: string
): Promise<{ accepted: boolean; explanation: string }> {
  if (fastMatch(userAnswer, correctAnswer)) {
    return { accepted: true, explanation: 'Exact match' };
  }

  // Call Gemini for synonym/typo validation...
}
```

**Key Lesson:** When implementing validation, ensure ALL grading paths use the same logic. Client-side feedback should never be more lenient than server-side grading.

**Status:** ✅ FIXED - Server now uses same Gemini validation as client

---

## Issue 32: TutorGames Type It Stuck on Last Question (10/10)

**Date:** January 6, 2026

**Problem:**
In TutorGames "Type It" mode, after submitting the answer to the last question (10/10), clicking "Next" did nothing. The game appeared frozen and never showed the results screen.

**Root Cause:**
The `handleTypeItSubmit()` function had an early return without state change on the last question:

```typescript
const handleTypeItSubmit = async () => {
  if (typeItSubmitted) {
    if (localGameIndex < localGameWords.length - 1) {
      setLocalGameIndex(prev => prev + 1);
      // ... reset state for next question
    }
    // BUG: No else clause! On last question, just returns with no state change
    return;
  }
  // ... grading logic
};
```

When on question 10/10:
1. User clicks "Check" → Answer is graded, `typeItSubmitted = true`
2. User clicks "Next" → `if (9 < 9)` is FALSE
3. Function returns early → No state change → No re-render
4. `isGameOver` check never re-runs → Game stuck!

**The Fix:**
Added an else clause to clear `typeItSubmitted`, triggering a re-render where `isGameOver` evaluates to true:

```typescript
if (localGameIndex < localGameWords.length - 1) {
  setLocalGameIndex(prev => prev + 1);
  // ... reset state
} else {
  // Last question - clear submitted state to trigger re-render
  // isGameOver will be true and game over screen will show
  setTypeItSubmitted(false);
}
```

**Key Lesson:** When using "Next" buttons that conditionally advance, always handle the final item case. State changes are required to trigger re-renders and game-over checks.

**Status:** ✅ FIXED

---

## Issue 33: Validation Fallback Inconsistency (Diacritics)

**Date:** January 6, 2026

**Problem:**
When smart validation was disabled (or failed), fallback validation used basic `toLowerCase().trim()` comparison. This meant Polish diacritics weren't normalized - "zolw" would NOT match "żółw".

**Affected Files:**
- `PlayQuizChallenge.tsx` (line 141)
- `PlayQuickFireChallenge.tsx` (line 133)
- `FlashcardGame.tsx` (line 808)
- `TutorGames.tsx` (lines 458, 515)

**Example of the Bug:**
```typescript
// Old code - doesn't handle diacritics
isCorrect = userInput.toLowerCase().trim() === word.translation.toLowerCase().trim();
// "zolw" !== "żółw" → marked wrong!
```

**The Fix:**
Added `normalizeAnswer()` helper to all affected components:

```typescript
function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

// Now both "zolw" and "żółw" normalize to "zolw" → matches!
isCorrect = normalizeAnswer(userInput) === normalizeAnswer(word.translation);
```

**Key Lesson:** Validation consistency matters! Users shouldn't get different results in different game modes. Always normalize diacritics when comparing Polish text.

**Status:** ✅ FIXED - All local validation now normalizes diacritics

---

## Issue 34: Migration 011 Prerequisite Failure

**Date:** January 6, 2026

**Error:**
```
Error: Failed to run sql query: relation "game_session_answers" does not exist
```

**Problem:**
Migration 011 (add explanation column) assumed `game_session_answers` table existed. If migration 008 hadn't been run, the ALTER TABLE failed.

**The Fix:**
Added prerequisite check using DO block:

```sql
-- Migration 011: Add explanation column for smart validation
-- PREREQUISITE: Run migration 008_game_sessions.sql first

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_session_answers') THEN
    ALTER TABLE game_session_answers ADD COLUMN IF NOT EXISTS explanation TEXT;
    COMMENT ON COLUMN game_session_answers.explanation IS
      'AI explanation for why the answer was accepted or rejected during smart validation';
  ELSE
    RAISE NOTICE 'Table game_session_answers does not exist. Run migration 008_game_sessions.sql first.';
  END IF;
END $$;
```

**Key Lesson:** Migrations should be defensive. Check prerequisites and fail gracefully with helpful messages.

**Status:** ✅ FIXED - Migration now checks for table existence

---

## Issue 35: Gladia API Diarization Not Supported

**Date:** January 7, 2026

**Error:**
```json
{
  "statusCode": 400,
  "message": "Invalid parameter(s)...",
  "validation_errors": [
    "property diarization should not exist",
    "property diarization_config should not exist"
  ]
}
```

**Problem:**
The Gladia Live Streaming API does NOT support speaker diarization. The API documentation shows diarization for pre-recorded audio only. Our `gladia-token.ts` was passing unsupported parameters.

**Original Code:**
```typescript
// api/gladia-token.ts
body: JSON.stringify({
  // ... other config
  diarization: true,  // ❌ NOT SUPPORTED
  diarization_config: {
    min_speakers: 1,
    max_speakers: 4,
  },
})
```

**The Fix:**
Removed diarization parameters entirely. All transcripts are attributed to "speaker_0":

```typescript
// api/gladia-token.ts
body: JSON.stringify({
  encoding: 'wav/pcm',
  sample_rate: 16000,
  bit_depth: 16,
  channels: 1,
  language_config: { languages: ['pl'], code_switching: false },
  realtime_processing: {
    translation: true,
    translation_config: { target_languages: ['en'] },
  },
  // Note: Speaker diarization is NOT supported for live streaming API
})
```

**Key Lesson:** Always verify API capabilities for streaming vs batch endpoints. Features available for file uploads may not exist for real-time streaming.

**Status:** ✅ FIXED - Diarization params removed, Listen Mode connects successfully

---

## Issue 36: Gladia Translations Arrive as Separate Messages

**Date:** January 7, 2026

**Symptom:**
Listen Mode showed Polish transcripts but no English translations, even though translation was enabled in the API.

**Investigation:**
```javascript
// WebSocket messages showed translation arriving AFTER transcript:
{ type: 'transcript', data: { text: 'Cześć' } }
{ type: 'translation', data: { translation: 'Hello' } }  // Separate message!
```

**Problem:**
Gladia sends translations as separate WebSocket messages with type `'translation'`, not embedded in the transcript. Our handler was logging but discarding them:

```typescript
// gladia-session.ts (BEFORE)
case 'translation':
  log('Translation received:', message.data?.translation);
  break;  // ← DISCARDED!
```

**The Fix:**
Implemented a pending transcript system that waits for translations:

```typescript
// Track transcripts waiting for translations
private pendingTranscripts: Map<string, { chunk: TranscriptChunk; timer: ReturnType<typeof setTimeout> }> = new Map();
private lastTranscriptId: string | null = null;

// In handleTranscript() - for final transcripts without inline translation:
if (isFinal && !chunk.translation) {
  this.lastTranscriptId = chunk.id;
  const timer = setTimeout(() => {
    // Emit without translation after 800ms timeout
    if (this.pendingTranscripts.has(chunk.id)) {
      this.pendingTranscripts.delete(chunk.id);
      this.config.onTranscript(chunk);
    }
  }, 800);
  this.pendingTranscripts.set(chunk.id, { chunk, timer });
}

// In handleTranslation() - merge with pending transcript:
case 'translation':
  if (this.lastTranscriptId && this.pendingTranscripts.has(this.lastTranscriptId)) {
    const pending = this.pendingTranscripts.get(this.lastTranscriptId)!;
    clearTimeout(pending.timer);
    this.pendingTranscripts.delete(this.lastTranscriptId);

    const mergedChunk = { ...pending.chunk, translation: translation.trim() };
    this.config.onTranscript(mergedChunk);
  }
  break;
```

**Flow:**
1. Transcript arrives → store in pending map with 800ms timer
2. Translation arrives within 800ms → merge and emit combined
3. No translation after 800ms → emit transcript without translation

**Key Lesson:** Real-time APIs often send related data as separate messages for latency reasons. Design handlers to correlate and merge related messages.

**Status:** ✅ FIXED - Polish transcripts now display with English translations

---

## Issue 37: Notification Count Not Updating on Dismiss

**Date:** January 7, 2026

**Problem:**
When dismissing a notification from the Navbar dropdown, the unread count badge did not update. The notification disappeared from the list, but the badge still showed the old count.

**Root Cause:**
The `dismissNotification()` function in `Navbar.tsx` was removing the notification from state but not checking if it was unread before decrementing the count:

```typescript
// BEFORE (buggy)
const dismissNotification = async (notificationId: string) => {
  await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  setNotifications(prev => prev.filter(n => n.id !== notificationId));
  // BUG: Never updates unreadCount!
};
```

**The Fix:**
Check if the notification was unread before dismissing, then decrement the count:

```typescript
// AFTER (fixed)
const dismissNotification = async (notificationId: string) => {
  // Check if notification was unread before dismissing
  const wasUnread = notifications.find(n => n.id === notificationId)?.read_at === null;

  await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  setNotifications(prev => prev.filter(n => n.id !== notificationId));

  // Update unread count if the dismissed notification was unread
  if (wasUnread) {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }
};
```

**Status:** ✅ FIXED - Notification badge now updates correctly on dismiss

---

## Issue 38: Love Package/Word Gift Words Not Adding to Dictionary

**Date:** January 7, 2026

**Problem:**
After completing a Word Gift from a partner, the words were marked as completed but never appeared in the Love Log. The `complete-word-request` API worked correctly, but the UI didn't refresh to show new words.

**Root Cause:**
`WordGiftLearning.tsx` was missing:
1. Error handling for failed completion
2. The `dictionary-updated` event dispatch that triggers Love Log refresh

**The Fix:**
Added error state handling and cross-component communication:

```typescript
// Added error state
const [error, setError] = useState<string | null>(null);

const handleComplete = async () => {
  setCompleting(true);
  setError(null);
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const response = await fetch('/api/complete-word-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ requestId: wordRequest.id })
    });

    const data = await response.json();
    if (data.success) {
      setResult(data);
      // Dispatch event so Love Log refreshes with new words
      window.dispatchEvent(new CustomEvent('dictionary-updated', {
        detail: { count: data.wordsAdded, source: 'word-gift' }
      }));
    } else {
      setError(data.error || 'Failed to complete. Please try again.');
    }
  } catch (err) {
    console.error('Error completing word request:', err);
    setError('Network error. Please check your connection and try again.');
  }
  setCompleting(false);
};
```

Also added error screen UI with retry capability.

**Key Lesson:** Cross-component communication via custom events is essential when multiple components need to react to data changes. Always dispatch events when modifying shared data.

**Status:** ✅ FIXED - Word Gift words now appear in Love Log immediately

---

## Issue 39: Create Quiz Ignoring New Words Added by Tutor

**Date:** January 7, 2026

**Problem:**
When tutors created a Quiz challenge and added new custom words (not from the student's existing vocabulary), those words were included in the challenge but never added to the student's dictionary.

**Root Cause:**
`/api/create-challenge.ts` extracted `wordIds` from the request but ignored the `newWords` array:

```typescript
// BEFORE (buggy)
const { challengeType, title, config, wordIds } = req.body;
// newWords was never extracted or processed!
```

**The Fix:**
Extract `newWords` from the request body and insert them into the student's dictionary:

```typescript
const { challengeType, title, config, wordIds, newWords } = req.body;

// Handle new words added by tutor
if (newWords && Array.isArray(newWords) && newWords.length > 0) {
  const newWordEntries = newWords.map((w: { polish: string; english: string }) => ({
    user_id: profile.linked_user_id,  // Student's user ID
    word: w.polish.toLowerCase().trim(),
    translation: w.english.trim(),
    word_type: 'other',
    importance: 3,
    context: `Added by ${profile.full_name} in challenge`,
    root_word: w.polish.toLowerCase().trim(),
    examples: [],
    pro_tip: ''
  }));

  const { data: insertedWords, error: insertError } = await supabase
    .from('dictionary')
    .insert(newWordEntries)
    .select('id, word, translation, word_type');

  if (insertError) {
    console.error('Error inserting new words:', insertError);
  } else if (insertedWords) {
    // Add to wordsData so they're included in the challenge
    wordsData = [...wordsData, ...insertedWords];
  }
}
```

**Key Lesson:** When features support multiple input sources (existing data + new data), ensure all sources are processed. Don't assume all data comes from the same place.

**Status:** ✅ FIXED - New words are now added to student's dictionary when challenge is created

---

## Issue 40: LevelTest Hardcoded Colors Breaking Dark Mode

**Date:** January 7, 2026

**Problem:**
The Level Test component (`LevelTest.tsx`) used hardcoded Tailwind colors like `bg-white`, `text-gray-800`, `border-gray-100` that didn't work in dark mode.

**Affected Areas:**
- Loading screen
- Ready screen (pre-test)
- Question cards
- Results screen
- Navigation buttons

**Example Before:**
```tsx
// Hardcoded colors - invisible text in dark mode!
<div className="bg-white p-12 rounded-[3rem] shadow-lg text-center border border-gray-100">
  <h2 className="text-xl font-black text-gray-800 mb-2">Preparing Your Test</h2>
  <p className="text-gray-500 text-sm">Generating questions...</p>
</div>
```

**The Fix:**
Replaced all hardcoded colors with CSS variables:

```tsx
<div className="bg-[var(--bg-card)] p-12 rounded-[3rem] shadow-lg text-center border border-[var(--border-color)]">
  <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Preparing Your Test</h2>
  <p className="text-[var(--text-secondary)] text-sm">Generating questions...</p>
</div>
```

For semantic colors (success green, warning amber), added dark mode variants:
```tsx
className={`... ${passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}
```

**Status:** ✅ FIXED - Level Test now fully supports dark mode

---

## Issue 41: Undefined CSS Variables Used in LevelTest

**Date:** January 7, 2026

**Problem:**
After the initial dark mode fix for LevelTest.tsx, three undefined CSS variables were accidentally used:
- `--bg-secondary` (doesn't exist)
- `--border-hover` (doesn't exist)
- `--text-muted` (doesn't exist)

**Discovery:**
Found during code review by checking `services/theme.ts` which defines only:
- `--accent-color`, `--accent-light`, `--accent-border`, `--accent-text`
- `--bg-primary`, `--bg-card`
- `--text-primary`, `--text-secondary`
- `--border-color`

**The Fix:**
Replaced undefined variables with existing equivalents:
- `--bg-secondary` → `--bg-primary`
- `--border-hover` → `--text-secondary` (for hover effects)
- `--text-muted` → `--text-secondary`

```bash
# Used replace_all to fix all occurrences
old: var(--bg-secondary)   → new: var(--bg-primary)
old: var(--border-hover)   → new: var(--text-secondary)
old: var(--text-muted)     → new: var(--text-secondary)
```

**Key Lesson:** When using CSS variables, always verify they're defined in the theme system. Don't assume variable names exist based on convention.

**Status:** ✅ FIXED - All CSS variables now exist in theme.ts

---

## Issue 42: N+1 API/Database Query Patterns (P0 Cost Optimization)

**Date:** January 7, 2026

**Problem:**
Multiple API endpoints had N+1 query patterns where loops made individual API calls or database queries instead of batching, causing:
- Excessive Gemini API costs (N calls instead of 1)
- Excessive database round-trips
- Slow response times for batch operations

**Affected Endpoints:**

### 1. submit-challenge.ts - N+1 Gemini Validation
**Before:** Each answer validated in a separate Gemini call
```typescript
// BAD: N API calls for N answers
for (const answer of answers) {
  const result = await smartValidate(answer.userAnswer, word.translation);
}
```

**After:** All answers validated in ONE batch call
```typescript
// GOOD: 1 API call for N answers
const validationResults = await batchSmartValidate(validationInputs);
```

### 2. submit-level-test.ts - Same N+1 Validation Pattern
Applied identical batch validation fix.

### 3. complete-word-request.ts - N+1 Word Enrichment
**Before:** Each word enriched with separate Gemini call
```typescript
// BAD: N API calls for N words
for (const word of selectedWords) {
  const context = await enrichWordContext(word);
}
```

**After:** All words enriched in ONE batch call
```typescript
// GOOD: 1 API call for N words with array response schema
const enrichedContexts = await batchEnrichWordContexts(wordsToEnrich);
```

### 4. get-game-history.ts - N+1 Database Queries
**Before:** Separate query for each session's wrong answer count
```typescript
// BAD: N queries for N sessions
for (const session of sessions) {
  const { count } = await supabase.from('answers').select('*', { count: 'exact' })
    .eq('session_id', session.id).eq('is_correct', false);
}
```

**After:** Single aggregate query for all sessions
```typescript
// GOOD: 1 query for all sessions
const { data: wrongCounts } = await supabase
  .from('game_session_answers')
  .select('session_id')
  .in('session_id', sessionIds)
  .eq('is_correct', false);

// Count client-side from single result set
wrongCounts.forEach(row => {
  wrongCountMap[row.session_id] = (wrongCountMap[row.session_id] || 0) + 1;
});
```

### 5. submit-challenge.ts - N+1 Score Updates
**Before:** Fetch + upsert for each word score
```typescript
// BAD: 2N database operations
for (const answer of answers) {
  const existing = await supabase.from('scores').select('*').eq('word_id', wordId);
  await supabase.from('scores').upsert({ ...existing, ...updates });
}
```

**After:** Batch fetch + batch upsert
```typescript
// GOOD: 2 database operations total
const { data: existingScores } = await supabase
  .from('scores')
  .select('word_id, success_count, fail_count, correct_streak, learned_at')
  .in('word_id', wordIdsToUpdate);

// Build all updates locally, then batch upsert
await supabase.from('scores').upsert(scoreUpserts, { onConflict: 'user_id,word_id' });
```

---

### The Batch Pattern

**Key Implementation Pattern:**
```typescript
async function batchSmartValidate(
  answers: Array<{ userAnswer: string; correctAnswer: string; polishWord?: string }>
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const needsAiValidation: Array<{ index: number; ... }> = [];

  // STEP 1: Try FREE local matching first
  answers.forEach((answer, index) => {
    if (fastMatch(answer.userAnswer, answer.correctAnswer)) {
      results.push({ index, accepted: true, explanation: 'Exact match' });
    } else {
      needsAiValidation.push({ index, ...answer });
    }
  });

  // STEP 2: If all matched locally, no API call needed!
  if (needsAiValidation.length === 0) return results;

  // STEP 3: Batch validate remaining in ONE Gemini call
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: buildBatchPrompt(needsAiValidation),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,  // Returns array of results
        items: { type: Type.OBJECT, properties: { accepted, explanation } }
      }
    }
  });

  // STEP 4: Map AI results back to original indices
  const validations = JSON.parse(result.text);
  needsAiValidation.forEach((item, i) => {
    results.push({ index: item.index, ...validations[i] });
  });

  return results;
}
```

---

### Key Lessons Learned

1. **Local-first validation** - Always try free local matching before calling AI
2. **Array response schemas** - Use `Type.ARRAY` in Gemini schemas to get batch results
3. **Index tracking** - Track original indices when filtering for AI validation, then map back
4. **Batch DB operations** - Use `.in('id', arrayOfIds)` for fetches, `.upsert()` for batch writes
5. **Timeout handling** - Batch operations may need longer timeouts

### Cost Impact

| Endpoint | Before | After | Savings |
|----------|--------|-------|---------|
| submit-challenge (10 answers) | 10 Gemini calls | 0-1 Gemini calls | ~90-100% |
| submit-level-test (15 questions) | 15 Gemini calls | 0-1 Gemini calls | ~90-100% |
| complete-word-request (5 words) | 5 Gemini calls | 1 Gemini call | ~80% |
| get-game-history (20 sessions) | 20 DB queries | 1 DB query | ~95% |

**Status:** ✅ FIXED - All P0 N+1 patterns resolved

---

## Issue 43: Gemini Schema Over-Requesting (Schema Optimization)

**Date:** January 7, 2026

**Problem:**
Several endpoints requested rich vocabulary data from Gemini that was never used:
- Coach mode (tutors) requested full vocabulary extraction but tutors don't add words to their dictionary
- Word request previews requested full conjugation data that gets regenerated later anyway

### 1. chat.ts - Coach Mode Schema Bloat

**Before:** Tutors got same schema as students
```typescript
// Both modes used expensive studentModeSchema with full vocabulary extraction
const responseSchema = studentModeSchema; // Always
```

**After:** Lightweight schema for tutors
```typescript
// Coach mode: tutors don't need vocabulary extraction
const coachModeSchema = {
  type: Type.OBJECT,
  properties: { replyText: { type: Type.STRING } },
  required: ["replyText"]
};

// Student mode: full vocabulary extraction
const studentModeSchema = { /* full schema with newWords array */ };

// Use appropriate schema based on role
responseSchema: isTutorMode ? coachModeSchema : studentModeSchema
```

### 2. create-word-request.ts - Preview Data Bloat

**Before:** Full grammatical data for previews
```typescript
// Generated full conjugations, examples, gender, etc. for PREVIEW
responseSchema: {
  items: {
    properties: {
      word, translation, word_type, pronunciation,
      conjugations, gender, plural, examples, proTip  // All this for preview!
    }
  }
}
```

**After:** Lightweight preview-only data
```typescript
// Just enough for tutor to preview and select words
// Full enrichment happens in complete-word-request.ts when student accepts
responseSchema: {
  items: {
    properties: {
      word: { type: Type.STRING },
      translation: { type: Type.STRING },
      word_type: { type: Type.STRING },
      pronunciation: { type: Type.STRING }
    },
    required: ["word", "translation", "word_type", "pronunciation"]
  }
}
```

### Key Principle

**Request data proportional to usage:**
- If data goes to Love Log (dictionary) → request full schema
- If data is for preview/display only → request minimal schema
- If user role doesn't add vocabulary → don't request vocabulary extraction

**Status:** ✅ FIXED - Schema complexity now matches data usage

---

## Issue 44: Stripe Webhook 307 Redirect

**Date:** January 8, 2026

**Problem:**
Stripe webhooks were failing with a 307 redirect response. The webhook showed successful delivery but returned:
```json
{"redirect": "https://www.lovelanguages.xyz/api/webhooks/stripe", "status": "307"}
```

**Root Cause:**
Domain `lovelanguages.xyz` was configured to redirect to `www.lovelanguages.xyz`. Stripe was sending webhooks to the non-www domain and receiving a redirect instead of reaching the endpoint.

**The Fix:**
Updated the webhook URL in Stripe Dashboard to include `www`:
- **Before:** `https://lovelanguages.xyz/api/webhooks/stripe`
- **After:** `https://www.lovelanguages.xyz/api/webhooks/stripe`

**Key Lesson:** Always use the canonical domain (with or without www) for webhooks. Check for redirects by testing the webhook URL directly in a browser.

**Status:** ✅ FIXED

---

## Issue 45: Stripe Webhook "Not Configured" Error

**Date:** January 8, 2026

**Problem:**
After fixing the redirect, webhooks returned:
```json
{"error": "Stripe not configured"}
```

**Root Cause:**
The `STRIPE_WEBHOOK_SECRET` environment variable was not set in Vercel production environment. The variable was added to `.env.local` but never deployed to Vercel.

**Investigation:**
Created a temporary debug endpoint to check env vars:
```typescript
// api/debug-env.ts (TEMPORARY - DELETE AFTER USE)
export default function handler(req, res) {
  res.json({
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}
```

This revealed `STRIPE_WEBHOOK_SECRET: false`.

**The Fix:**
1. Added `STRIPE_WEBHOOK_SECRET` to Vercel project settings
2. Triggered a redeploy with `vercel --prod`
3. Deleted the debug endpoint

**Key Lesson:** Sensitive environment variables need to be added to Vercel separately - they don't sync from `.env.local`. Use `vercel env ls` to verify.

**Status:** ✅ FIXED

---

## Issue 46: Stripe Price ID Typos

**Date:** January 8, 2026

**Problem:**
Webhook was working but returning "No such subscription" or incorrect plan mappings.

**Root Cause:**
Price IDs in environment variables had typos with double `price_` prefix:
```
STRIPE_PRICE_STANDARD_MONTHLY=price_price_1Sn7sM...  ❌ WRONG
STRIPE_PRICE_STANDARD_MONTHLY=price_1Sn7sM...       ✅ CORRECT
```

**The Fix:**
Corrected all four price ID environment variables in Vercel:
- `STRIPE_PRICE_STANDARD_MONTHLY`
- `STRIPE_PRICE_STANDARD_YEARLY`
- `STRIPE_PRICE_UNLIMITED_MONTHLY`
- `STRIPE_PRICE_UNLIMITED_YEARLY`

**Key Lesson:** Double-check env var VALUES, not just names. Copy-paste from Stripe Dashboard to avoid typos.

**Status:** ✅ FIXED

---

## Issue 47: Stripe Webhook Handler Logic Bugs (5 Critical Fixes)

**Date:** January 8, 2026

**Problem:**
After deployment, webhook was processing events but database wasn't updating correctly.

**Bugs Found During Code Review:**

### 1. Missing `stripe_customer_id` in checkout handler
The `checkout.session.completed` handler wasn't saving the Stripe customer ID to the profile, making it impossible to look up users for subsequent webhook events.

```typescript
// BEFORE (missing stripe_customer_id)
.update({
  subscription_plan: plan,
  subscription_status: 'active',
  // ... no stripe_customer_id!
})

// AFTER (includes stripe_customer_id)
.update({
  subscription_plan: plan,
  subscription_status: 'active',
  stripe_customer_id: customerId,  // Critical fix
  // ...
})
```

### 2. Inverted logic in `subscription.updated` handler
The handler only processed events when userId was NOT in metadata, which is backwards:

```typescript
// BEFORE (inverted)
if (!userId && customerId) {
  // Only runs when metadata is missing
}

// AFTER (correct)
if (!userId && customerId) {
  // Look up by customer ID
  userId = await lookupByCustomerId(customerId);
}
if (userId) {
  // Process update
}
```

### 3. Wrong field access for `current_period_end`
Was accessing `subscription.items.data[0].current_period_end` which doesn't exist:

```typescript
// BEFORE (wrong path)
const periodEnd = subscription.items.data[0]?.current_period_end;

// AFTER (correct path)
const periodEnd = subscription.current_period_end;
```

### 4. Event logging could crash webhook
Database insert errors in the event logger would crash the entire webhook handler:

```typescript
// BEFORE (blocking, can crash)
await supabase.from('subscription_events').insert(data);

// AFTER (non-blocking with IIFE)
(async () => {
  try {
    await supabase.from('subscription_events').insert(data);
  } catch (err) {
    console.error('[stripe-webhook] Failed to log event:', err.message);
    // Don't throw - logging failure shouldn't break the webhook
  }
})();
```

### 5. Gift pass creation could crash webhook
Same issue - gift pass creation errors would crash the webhook:

```typescript
// AFTER (non-blocking)
(async () => {
  try {
    const code = generateGiftCode();
    await supabase.from('gift_passes').insert({ ... });
  } catch (err) {
    console.error('[stripe-webhook] Failed to create gift pass:', err.message);
  }
})();
```

**The Fix:**
Complete rewrite of `/api/webhooks/stripe.ts` with all fixes applied.

**Testing:**
- Created unit tests in `tests/stripe-webhook.test.ts` (15 tests passing)
- Local testing with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Triggered all 4 event types successfully

**Key Lesson:** Webhook handlers must be resilient. Non-critical operations (logging, gift passes) should never crash the main flow. Use async IIFEs for fire-and-forget operations.

**Status:** ✅ FIXED - All 5 bugs resolved, webhook tested end-to-end

---

## Stripe Webhook Architecture (Current)

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Stripe     │──────▶│  /api/webhooks/  │──────▶│   Supabase      │
│   Events     │       │  stripe.ts       │       │   profiles      │
└──────────────┘       └──────────────────┘       └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ subscription_    │
                       │ events (logging) │
                       └──────────────────┘
```

**Events Handled:**
1. `checkout.session.completed` → Activate subscription, save customer ID
2. `customer.subscription.updated` → Update status, plan changes
3. `customer.subscription.deleted` → Cancel subscription
4. `invoice.payment_failed` → Mark as past_due

**Security:**
- Signature verification via `stripe.webhooks.constructEvent()`
- `STRIPE_WEBHOOK_SECRET` env var required
- Returns 400 for invalid signatures

**Testing Commands:**
```bash
# Start local forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```
