# Security & Reliability Audit - Sprint Implementation Plan

> **Created:** January 2025
> **Audit Source:** External Security Review
> **Total Issues:** 10
> **Sprints:** 5

---

## Sprint Overview

| Sprint | Priority | Issues | Focus | Est. Complexity |
|--------|----------|--------|-------|-----------------|
| 1 | 🔴 CRITICAL | #1 | Conversation mode microphone bug | Low |
| 2 | 🟠 HIGH | #3, #4 | Usage tracking & billing fairness | Medium |
| 3 | 🟡 MEDIUM | #2, #8 | Session lifecycle & audio stability | Medium |
| 4 | 🟡 MEDIUM | #6, #10 | Token exposure & logging hygiene | Low |
| 5 | 🟢 LOW | #5, #7, #9 | Code quality & modernization | High |

---

# 🔴 SPRINT 1: CRITICAL — Conversation Mode Microphone Fix

## Issue #1: Conversation mode never starts microphone capture

### Problem Statement
When `mode === 'conversation'`, the code sets `state = 'speaking'` and then calls `startListening()` after a 500ms delay. However, `startListening()` has an early-return guard that requires `state === 'listening'`. Since the state is `speaking`, audio capture never starts.

**Impact:** Voice input is 100% broken for Conversation Practice mode.

### Root Cause Analysis

**File:** `services/live-session.ts`

```typescript
// Line 147-172: The problematic flow
if (this.config.mode === 'conversation' && this.config.conversationScenario) {
  log('Conversation mode: prompting AI to speak first...');
  this.setState('speaking');  // ← State set to 'speaking'

  // ... sends initial prompt ...

  setTimeout(async () => {
    if (this.state === 'speaking' || this.state === 'listening') {
      await this.startListening();  // ← Called while state is 'speaking'
      log('Audio capture started after AI prompt');
    }
  }, 500);
}

// Line 191-192: The guard that blocks it
async startListening(): Promise<void> {
  if (!this.audioRecorder || !this.session || this.state !== 'listening') return;
  // ↑ Returns early because state is 'speaking', not 'listening'
```

### Fix Implementation

#### Step 1.1: Update startListening() guard condition

**File:** `services/live-session.ts`
**Line:** 191-192

**BEFORE:**
```typescript
async startListening(): Promise<void> {
  if (!this.audioRecorder || !this.session || this.state !== 'listening') return;
```

**AFTER:**
```typescript
async startListening(): Promise<void> {
  // Allow starting audio capture in 'listening' OR 'speaking' state
  // Speaking state is valid for conversation mode where AI speaks first
  // but we still need to capture user audio for when they respond
  if (!this.audioRecorder || !this.session) return;
  if (this.state !== 'listening' && this.state !== 'speaking') return;
```

#### Step 1.2: Add state transition after audio starts in conversation mode

**File:** `services/live-session.ts`
**Line:** 167-172

**BEFORE:**
```typescript
setTimeout(async () => {
  if (this.state === 'speaking' || this.state === 'listening') {
    await this.startListening();
    log('Audio capture started after AI prompt');
  }
}, 500);
```

**AFTER:**
```typescript
setTimeout(async () => {
  if (this.state === 'speaking' || this.state === 'listening') {
    await this.startListening();
    log('Audio capture started after AI prompt');
    // Note: State remains 'speaking' until AI finishes its first response
    // AudioPlayer callback will transition to 'listening' when playback ends
  }
}, 500);
```

### Verification Checklist

- [ ] **Unit Test:** Call `startListening()` when `state === 'speaking'` — should NOT return early
- [ ] **Unit Test:** Call `startListening()` when `state === 'disconnected'` — should return early
- [ ] **Manual Test:** Start Conversation Practice mode
  - [ ] AI speaks opening line
  - [ ] User can speak and be heard (check audio chunks in console)
  - [ ] Transcript shows user input
- [ ] **Regression Test:** Normal voice mode still works (state is 'listening' from start)

### Manual Testing Procedure

```
1. Open the app in development mode (npm run dev)
2. Navigate to Play → Conversation Practice
3. Select any scenario (e.g., "Café")
4. Click "Start Conversation"
5. Wait for AI to speak its opening line
6. Speak something in response
7. VERIFY: Your speech appears in the transcript
8. VERIFY: Console shows "Sending audio chunk #1", #51, #101, etc.

If audio chunks are NOT being sent, the fix failed.
```

### Rollback Plan

If the fix causes issues:
1. Revert the single file: `git checkout HEAD~1 -- services/live-session.ts`
2. The change is isolated to one guard condition

---

# 🟠 SPRINT 2: HIGH — Usage Tracking & Billing Fairness

## Issue #3: Usage tracking increments before API call succeeds

### Problem Statement
Both `live-token.ts` and `gladia-token.ts` increment the user's usage counter BEFORE calling the external API (Gemini/Gladia). If the API call fails, the user is still "charged" a session, which:
- Inflates usage counts unfairly
- Can lock out paying users prematurely
- Creates billing disputes

### Root Cause Analysis

**File:** `api/live-token.ts` (Lines 242-262, then API call at 351)
**File:** `api/gladia-token.ts` (Lines 133-153, then API call at 166)

The pattern in both files:
```typescript
// CURRENT (WRONG ORDER):
// 1. Increment usage ← HAPPENS FIRST
await supabase.from('usage_tracking').upsert({ count: count + 1 });

// 2. Call external API ← CAN FAIL AFTER USER IS CHARGED
const tokenResponse = await externalApi.createToken();
```

### Fix Implementation

#### Step 2.1: Restructure live-token.ts to increment AFTER success

**File:** `api/live-token.ts`

**BEFORE (Lines 242-262):**
```typescript
// Increment usage
const today = new Date().toISOString().split('T')[0];
const { data: todayUsage } = await supabase
  .from('usage_tracking')
  .select('count')
  .eq('user_id', auth.userId)
  .eq('usage_type', 'voice_sessions')
  .eq('usage_date', today)
  .single();

await supabase
  .from('usage_tracking')
  .upsert({
    user_id: auth.userId,
    usage_type: 'voice_sessions',
    usage_date: today,
    count: (todayUsage?.count || 0) + 1
  }, {
    onConflict: 'user_id,usage_type,usage_date'
  });
```

**AFTER:** Move this block to AFTER the token is successfully created (after line 384).

**New structure:**

```typescript
// Line 220-241: Check usage limit (KEEP AS-IS)
if (currentCount >= sessionLimit) {
  return res.status(429).json({ ... });
}

// REMOVE the increment from here (was lines 242-262)

// ... API key check, input validation, token creation ...

// Line ~385: AFTER successful token creation, NOW increment
// Only reached if token creation succeeded
if (supabaseUrl && supabaseServiceKey && sessionLimit !== null) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0];

  const { data: todayUsage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', auth.userId)
    .eq('usage_type', 'voice_sessions')
    .eq('usage_date', today)
    .single();

  // Non-blocking increment - don't fail the request if tracking fails
  supabase
    .from('usage_tracking')
    .upsert({
      user_id: auth.userId,
      usage_type: 'voice_sessions',
      usage_date: today,
      count: (todayUsage?.count || 0) + 1
    }, {
      onConflict: 'user_id,usage_type,usage_date'
    })
    .then(() => console.log('[live-token] Usage incremented'))
    .catch(err => console.error('[live-token] Usage tracking failed:', err.message));
}

return res.status(200).json({
  token: tokenName,
  model: model,
  // ...
});
```

#### Step 2.2: Same restructure for gladia-token.ts

**File:** `api/gladia-token.ts`

Apply the same pattern:
1. REMOVE lines 133-153 (the increment block)
2. ADD the increment AFTER line 221 (after `gladiaSession` is successfully created)

**New code to add after line 221:**

```typescript
const gladiaSession = await gladiaResponse.json();

// INCREMENT USAGE AFTER SUCCESS
if (supabaseUrl && supabaseServiceKey && sessionLimit !== null) {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayUsage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', auth.userId)
    .eq('usage_type', 'listen_sessions')
    .eq('usage_date', today)
    .single();

  // Non-blocking increment
  supabase
    .from('usage_tracking')
    .upsert({
      user_id: auth.userId,
      usage_type: 'listen_sessions',
      usage_date: today,
      count: (todayUsage?.count || 0) + 1
    }, {
      onConflict: 'user_id,usage_type,usage_date'
    })
    .then(() => console.log('[gladia-token] Usage incremented'))
    .catch(err => console.error('[gladia-token] Usage tracking failed:', err.message));
}

console.log(`[gladia-token] Created Gladia session ${gladiaSession.id} for user ${auth.userId}`);
```

#### Step 2.3: Scoping fix - need to pass variables to post-success block

**IMPORTANT:** The `sessionLimit` variable is scoped inside the rate-limiting `if` block. We need to track whether we should increment.

**File:** `api/live-token.ts`

Add this variable near the top of the try block (after auth check):

```typescript
// Track if we need to increment usage (only for standard plan)
let shouldIncrementUsage = false;

// Inside the rate limiting block, after the limit check passes:
if (sessionLimit !== null) {
  // ... existing limit check ...

  if (currentCount >= sessionLimit) {
    return res.status(429).json({ ... });
  }

  // Mark for increment (will happen after successful token creation)
  shouldIncrementUsage = true;
}

// Then at the end, after token creation succeeds:
if (shouldIncrementUsage) {
  // ... increment code ...
}
```

---

## Issue #4: Monthly usage query uses "-31" for all months

### Problem Statement
The date query uses `${currentMonth}-31` which isn't valid for February, April, June, September, November.

### Fix Implementation

#### Step 2.4: Fix date range in live-token.ts

**File:** `api/live-token.ts`
**Lines:** 229-230

**BEFORE:**
```typescript
.gte('usage_date', `${currentMonth}-01`)
.lte('usage_date', `${currentMonth}-31`)
```

**AFTER:**
```typescript
// Calculate actual last day of month
const year = parseInt(currentMonth.split('-')[0]);
const month = parseInt(currentMonth.split('-')[1]);
const lastDay = new Date(year, month, 0).getDate(); // Day 0 of next month = last day of this month

.gte('usage_date', `${currentMonth}-01`)
.lte('usage_date', `${currentMonth}-${String(lastDay).padStart(2, '0')}`)
```

**ALTERNATIVE (simpler):** Use first day of NEXT month with `lt` instead of `lte`:

```typescript
// Get first day of next month
const [year, month] = currentMonth.split('-').map(Number);
const nextMonth = month === 12
  ? `${year + 1}-01`
  : `${year}-${String(month + 1).padStart(2, '0')}`;

.gte('usage_date', `${currentMonth}-01`)
.lt('usage_date', `${nextMonth}-01`)  // Less than (not including) first day of next month
```

#### Step 2.5: Same fix for gladia-token.ts

**File:** `api/gladia-token.ts`
**Lines:** 120-121

Apply identical fix.

### Verification Checklist

- [ ] **Test in February:** Set system date to Feb 28, verify query doesn't fail
- [ ] **Test limit enforcement:**
  - [ ] Set usage to limit-1, make request, should succeed
  - [ ] Make another request, should be blocked (limit reached)
  - [ ] Verify usage count is accurate
- [ ] **Test API failure scenario:**
  - [ ] Temporarily break API key
  - [ ] Make request, should fail
  - [ ] Check usage_tracking table — count should NOT have incremented
- [ ] **Regression:** Normal flow still increments usage after success

### Manual Testing Procedure

```
1. Check current usage:
   SELECT * FROM usage_tracking WHERE user_id = 'YOUR_ID' AND usage_type = 'voice_sessions';

2. Note the current count

3. Start a voice session (should succeed)

4. Check usage again — count should be +1

5. Now simulate failure:
   - Temporarily rename GEMINI_API_KEY in .env
   - Try to start voice session (should fail)
   - Check usage — count should NOT have increased

6. Restore API key, verify normal operation
```

### Rollback Plan

```bash
git checkout HEAD~1 -- api/live-token.ts api/gladia-token.ts
```

---

# 🟡 SPRINT 3: MEDIUM — Session Lifecycle & Audio Stability

## Issue #2: disconnect() fires onClose twice

### Problem Statement
When `disconnect()` is called:
1. It calls `cleanup()` which closes the SDK session
2. SDK fires its `onclose` callback
3. `onclose` callback calls `cleanup()` and `onClose()`
4. `disconnect()` continues and also calls `onClose()`

Result: `onClose` fires twice, causing duplicate state transitions and potential UI bugs.

### Root Cause Analysis

**File:** `services/live-session.ts`

```typescript
// Lines 213-217: disconnect() implementation
disconnect(): void {
  this.cleanup();           // ← Triggers SDK onclose
  this.setState('disconnected');
  this.config.onClose?.();  // ← First onClose call
}

// Lines 133-137: SDK onclose callback
onclose: (event: any) => {
  log('SDK session closed:', event);
  this.cleanup();           // ← cleanup() again (harmless)
  this.config.onClose?.();  // ← Second onClose call!
}
```

### Fix Implementation

#### Step 3.1: Add flag to prevent double onClose

**File:** `services/live-session.ts`

**Add new private property (after line 46):**
```typescript
private audioChunkCount = 0;
private hasCalledOnClose = false;  // ← ADD THIS
```

**Update disconnect() method (lines 213-217):**

**BEFORE:**
```typescript
disconnect(): void {
  this.cleanup();
  this.setState('disconnected');
  this.config.onClose?.();
}
```

**AFTER:**
```typescript
disconnect(): void {
  if (this.hasCalledOnClose) return; // Already disconnecting
  this.hasCalledOnClose = true;

  this.cleanup();
  this.setState('disconnected');
  this.config.onClose?.();
}
```

**Update SDK onclose callback (lines 133-137):**

**BEFORE:**
```typescript
onclose: (event: any) => {
  log('SDK session closed:', event);
  this.cleanup();
  this.config.onClose?.();
}
```

**AFTER:**
```typescript
onclose: (event: any) => {
  log('SDK session closed:', event);
  this.cleanup();

  // Only fire onClose if disconnect() hasn't already fired it
  if (!this.hasCalledOnClose) {
    this.hasCalledOnClose = true;
    this.config.onClose?.();
  }
}
```

**Reset flag in cleanup() or when starting new connection:**

**Add to connect() method, near the beginning (after line 62):**
```typescript
this.setState('connecting');
this.hasCalledOnClose = false;  // ← Reset for new connection
log('Starting connection...');
```

---

## Issue #8: AudioContext closes and recreates on every stop

### Problem Statement
`AudioPlayer.stop()` calls `this.audioContext.close()`, destroying the context. In a voice conversation, this means creating a new AudioContext every time the AI stops speaking and starts again, causing latency.

### Fix Implementation

#### Step 3.2: Suspend instead of close AudioContext

**File:** `services/audio-utils.ts`
**Lines:** 232-242

**BEFORE:**
```typescript
stop(): void {
  if (this.audioContext) {
    this.audioContext.close();
    this.audioContext = null;
  }
  this.gainNode = null;
  this.audioQueue = [];
  this.isPlaying = false;
  this.nextStartTime = 0;
  this.onPlaybackStateChange?.(false);
}
```

**AFTER:**
```typescript
/**
 * Stop playback and clear the queue
 * Note: We suspend (not close) the AudioContext to allow quick resumption
 */
stop(): void {
  // Cancel any scheduled audio by disconnecting gain node
  if (this.gainNode && this.audioContext) {
    this.gainNode.disconnect();
    // Recreate gain node for next playback
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  // Suspend context (can be resumed quickly, unlike close which destroys it)
  if (this.audioContext && this.audioContext.state === 'running') {
    this.audioContext.suspend().catch(() => {
      // Ignore suspend errors
    });
  }

  this.audioQueue = [];
  this.isPlaying = false;
  this.nextStartTime = 0;
  this.onPlaybackStateChange?.(false);
}

/**
 * Fully close the audio context (call when completely done with audio)
 */
destroy(): void {
  if (this.audioContext) {
    this.audioContext.close().catch(() => {});
    this.audioContext = null;
  }
  this.gainNode = null;
  this.audioQueue = [];
  this.isPlaying = false;
  this.nextStartTime = 0;
}
```

#### Step 3.3: Update LiveSession to use destroy() on full cleanup

**File:** `services/live-session.ts`
**Line:** 231

**BEFORE:**
```typescript
this.audioPlayer?.stop();
this.audioPlayer = null;
```

**AFTER:**
```typescript
this.audioPlayer?.destroy();  // Full cleanup, not just stop
this.audioPlayer = null;
```

### Verification Checklist

- [ ] **Test double disconnect:** Call `disconnect()` twice rapidly — no errors, `onClose` fires once
- [ ] **Test SDK-initiated close:** Close WebSocket from server side — `onClose` fires once
- [ ] **Test audio restart latency:**
  - [ ] AI speaks → stops → speaks again
  - [ ] Second speech should start immediately (no perceptible delay)
- [ ] **Memory test:** Start/stop audio 20 times, check for AudioContext leaks in DevTools

### Manual Testing Procedure

```
1. Open DevTools Console
2. Start voice mode
3. Speak to trigger AI response
4. Watch for "SDK session closed" logs
5. Click disconnect button
6. VERIFY: Only ONE "onClose" related log/callback fires
7. Check for errors in console

For audio test:
1. Start conversation mode
2. Let AI speak its greeting
3. Respond with a question
4. AI speaks again
5. VERIFY: No delay/glitch when AI starts second response
```

### Rollback Plan

```bash
git checkout HEAD~1 -- services/live-session.ts services/audio-utils.ts
```

---

# 🟡 SPRINT 4: MEDIUM — Token Exposure & Logging Hygiene

## Issue #6: WebSocket URL contains embedded auth token

### Problem Statement
The Gladia WebSocket URL contains an embedded bearer token. If this URL is logged, captured by error tracking, or stored in browser history, the token could be extracted and replayed.

### Risk Assessment
- Token is short-lived (session-scoped)
- URL is only used client-side for WebSocket connection
- Not stored in browser history (WebSocket, not HTTP)
- Main risk: Error tracking services (Sentry, LogRocket, etc.)

### Fix Implementation

#### Step 4.1: Sanitize URL in client-side logging

**File:** `services/gladia-session.ts`
**Line:** 109

**BEFORE:**
```typescript
log('Got WebSocket URL for session:', sessionId);
```

**AFTER:**
```typescript
log('Got WebSocket URL for session:', sessionId, '(URL redacted)');
```

#### Step 4.2: Add comment documenting the security consideration

**File:** `api/gladia-token.ts`
**Lines:** 225-232

**BEFORE:**
```typescript
// Return the WebSocket URL to the frontend
// The URL contains an embedded token, so the frontend can connect directly
// without needing the API key
return res.status(200).json({
  sessionId: gladiaSession.id,
  websocketUrl: gladiaSession.url,
  userId: auth.userId,
});
```

**AFTER:**
```typescript
// Return the WebSocket URL to the frontend
// SECURITY NOTE: The URL contains an embedded bearer token from Gladia.
// This is Gladia's design - the token is:
// - Short-lived (session-scoped, ~30 min expiry)
// - Single-use for this WebSocket connection
// - Not logged server-side (only session ID is logged)
//
// Frontend should NOT log the full URL. Error tracking services
// should be configured to redact URL query parameters.
return res.status(200).json({
  sessionId: gladiaSession.id,
  websocketUrl: gladiaSession.url,
  userId: auth.userId,
});
```

---

## Issue #10: Debug logging captures sensitive session metadata

### Problem Statement
Logs include session IDs, partial token names, and transcript content. In production, this could expose user data to log aggregation services.

### Current State Analysis

| File | Line | What's Logged | Risk |
|------|------|---------------|------|
| `live-token.ts` | 183 | User ID (truncated) | Low |
| `live-token.ts` | 384 | Token name (20 chars) | Medium |
| `gladia-session.ts` | 286 | Full transcript JSON | High (DEV only) |
| `gladia-session.ts` | 339 | Transcript text | Medium (DEV only) |

### Fix Implementation

#### Step 4.3: Truncate token logging in live-token.ts

**File:** `api/live-token.ts`
**Line:** 384

**BEFORE:**
```typescript
console.log('[live-token] Token created successfully:', tokenName.substring(0, 20) + '...');
```

**AFTER:**
```typescript
// Only log token creation success, not the token itself
console.log('[live-token] Token created successfully for model:', model);
```

#### Step 4.4: Remove verbose transcript logging in gladia-session.ts

**File:** `services/gladia-session.ts`
**Lines:** 284-287

**BEFORE:**
```typescript
// DEBUG: Log full transcript message for final transcripts
if (isFinal) {
  log('FULL TRANSCRIPT MESSAGE:', JSON.stringify(message, null, 2));
}
```

**AFTER:**
```typescript
// Note: Full transcript logging removed for privacy
// Enable locally if debugging transcript parsing issues:
// if (isFinal) log('FULL TRANSCRIPT MESSAGE:', JSON.stringify(message, null, 2));
```

#### Step 4.5: Sanitize transcript text in logs

**File:** `services/gladia-session.ts`
**Line:** 339

**BEFORE:**
```typescript
log(isFinal ? 'Final transcript:' : 'Partial:', chunk.text, translation ? `→ ${chunk.translation}` : '');
```

**AFTER:**
```typescript
// Log transcript length, not content (privacy)
log(isFinal ? 'Final transcript:' : 'Partial:',
    `${chunk.text.length} chars`,
    chunk.language ? `[${chunk.language}]` : '',
    translation ? '(translated)' : '');
```

### Verification Checklist

- [ ] **Log audit:** Search all console.log/log() calls in production code paths
- [ ] **No PII in logs:** Verify transcripts, full tokens, emails not logged
- [ ] **DEV flag check:** Verify `import.meta.env.DEV` gates verbose logging
- [ ] **Error tracking config:** Document that error tracking should redact URLs

### Rollback Plan

```bash
git checkout HEAD~1 -- api/live-token.ts services/gladia-session.ts api/gladia-token.ts
```

---

# 🟢 SPRINT 5: LOW — Code Quality & Modernization

## Issue #5: CORS fallback sets non-matching origin with credentials

### Problem Statement
When the request origin doesn't match any allowed origin, the code sets the first allowed origin with credentials. This is confusing but not a security issue (browsers block mismatched origins).

### Fix Implementation

#### Step 5.1: Improve CORS fallback to be explicit rejection

**File:** All 32 API files with `setCorsHeaders()`

This requires updating the shared CORS function in all files. Due to Vercel's architecture, we can't share code, so we need a find-and-replace.

**BEFORE (in all API files):**
```typescript
} else if (allowedOrigins.length > 0) {
  // No match but have allowed origins - use first one
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

**AFTER:**
```typescript
} else {
  // No match - for browsers, the request will fail due to CORS
  // For non-browser clients, they can still access (CORS is browser-only)
  // We set a valid origin to make debugging clearer, but browser will block
  if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    // Note: NOT setting credentials when origin doesn't match
  }
}
```

**Files to update (32 total):**
```
api/analyze-history.ts
api/boot-session.ts
api/chat-stream.ts
api/chat.ts
api/complete-invite.ts
api/complete-word-request.ts
api/create-challenge.ts
api/create-checkout-session.ts
api/create-customer-portal.ts
api/create-word-request.ts
api/generate-invite.ts
api/generate-level-test.ts
api/get-challenges.ts
api/get-game-history.ts
api/get-notifications.ts
api/get-word-requests.ts
api/gladia-token.ts
api/increment-xp.ts
api/live-token.ts
api/onboarding-complete.ts
api/polish-transcript.ts
api/start-challenge.ts
api/submit-challenge.ts
api/submit-game-session.ts
api/submit-level-test.ts
api/subscription-status.ts
api/tts.ts
api/unlock-tense.ts
api/validate-answer.ts
api/validate-invite.ts
api/validate-word.ts
api/webhooks/stripe.ts
```

---

## Issue #7: ScriptProcessorNode deprecated + inefficient base64 encoding

### Problem Statement
1. `createScriptProcessor()` is deprecated — should use `AudioWorkletNode`
2. Base64 encoding uses string concatenation in a loop, which is slow for continuous audio

### Fix Implementation

#### Step 5.2: Migrate from ScriptProcessorNode to AudioWorklet

This is a significant refactor. AudioWorklet requires:
1. A separate JS file for the worklet processor
2. Loading the worklet module
3. Message passing between main thread and worklet

**File:** Create new file `public/audio-worklet-processor.js`

```javascript
/**
 * Audio Worklet Processor for capturing microphone input
 * Runs in a separate thread for better performance
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      if (this.bufferIndex >= this.bufferSize) {
        // Send buffer to main thread
        this.port.postMessage({
          type: 'audio',
          buffer: this.buffer.slice() // Copy the buffer
        });
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
```

**File:** `services/audio-utils.ts` — Full rewrite of AudioRecorder

```typescript
export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onDataCallback: ((base64Data: string) => void) | null = null;
  private nativeSampleRate: number = 48000;

  async start(onData: (base64Data: string) => void): Promise<void> {
    this.onDataCallback = onData;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Create audio context
      this.audioContext = new AudioContext();
      this.nativeSampleRate = this.audioContext.sampleRate;
      console.log(`[AudioRecorder] Native sample rate: ${this.nativeSampleRate}Hz`);

      // Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');

      // Create source from microphone
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

      // Handle audio data from worklet
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio') {
          this.processAudioBuffer(event.data.buffer);
        }
      };

      // Connect: source → worklet
      source.connect(this.workletNode);
      // Don't connect to destination (we don't want to hear ourselves)

    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  private processAudioBuffer(inputData: Float32Array): void {
    // Resample if needed
    let outputData: Float32Array;
    if (this.nativeSampleRate !== INPUT_SAMPLE_RATE) {
      outputData = this.resample(inputData, this.nativeSampleRate, INPUT_SAMPLE_RATE);
    } else {
      outputData = inputData;
    }

    // Convert Float32 [-1, 1] to Int16 PCM
    const pcmData = new Int16Array(outputData.length);
    for (let i = 0; i < outputData.length; i++) {
      const s = Math.max(-1, Math.min(1, outputData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Efficient base64 encoding using btoa with Uint8Array
    const base64 = this.arrayBufferToBase64Fast(pcmData.buffer);
    this.onDataCallback?.(base64);
  }

  private resample(inputData: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
    }

    return output;
  }

  stop(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onDataCallback = null;
  }

  /**
   * Efficient base64 encoding using native btoa
   * Much faster than string concatenation for large buffers
   */
  private arrayBufferToBase64Fast(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack issues
    let binary = '';

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, chunk as any);
    }

    return btoa(binary);
  }
}
```

### Fallback Strategy

AudioWorklet is not supported in all browsers. Add a fallback:

```typescript
async start(onData: (base64Data: string) => void): Promise<void> {
  // Check for AudioWorklet support
  if (this.audioContext?.audioWorklet) {
    await this.startWithWorklet(onData);
  } else {
    console.warn('[AudioRecorder] AudioWorklet not supported, using ScriptProcessor fallback');
    await this.startWithScriptProcessor(onData);
  }
}
```

---

## Issue #9: CORS logic duplicated across 32 files

### Problem Statement
The same CORS implementation is copy-pasted in 32 API files. This is a known Vercel architectural constraint, not a bug.

### Decision: ACCEPTED — No code change needed

**Rationale:**
- Vercel serverless functions bundle independently
- Cannot import from sibling directories
- This is documented in CLAUDE.md
- Risk is already mitigated by the CORS changes in Sprint 5.1

**Documentation update only:**

Add to `CLAUDE.md`:

```markdown
### CORS Code Duplication (Architectural Decision)

The `setCorsHeaders()` function is duplicated in 32 API files. This is intentional:
- Vercel serverless functions cannot share code via imports
- Each function bundles independently
- Updates must be applied to all files (use find-and-replace)

When modifying CORS logic, update ALL files listed in AUDIT_SPRINT_PLAN.md Sprint 5.1.
```

---

## Sprint 5 Verification Checklist

- [ ] **CORS test:** Send request from unlisted origin — should fail in browser
- [ ] **AudioWorklet test:**
  - [ ] Chrome: Uses AudioWorklet
  - [ ] Safari: Falls back to ScriptProcessor if needed
  - [ ] Audio quality comparable to before
- [ ] **Performance test:** Record 60 seconds, compare CPU usage before/after

### Rollback Plan

```bash
# CORS changes
git checkout HEAD~1 -- api/*.ts

# AudioWorklet changes
git checkout HEAD~1 -- services/audio-utils.ts
rm public/audio-worklet-processor.js
```

---

# Implementation Order Summary

```
Week 1:
├── Sprint 1: Fix conversation mode (1-2 hours)
│   └── CRITICAL: Unblocks voice conversation feature
│
└── Sprint 2: Fix usage tracking (2-3 hours)
    └── HIGH: Prevents billing disputes

Week 2:
├── Sprint 3: Session lifecycle fixes (2-3 hours)
│   └── MEDIUM: Improves reliability
│
└── Sprint 4: Logging hygiene (1-2 hours)
    └── MEDIUM: Reduces security surface

Week 3:
└── Sprint 5: Code quality (4-6 hours)
    └── LOW: Modernization, not blocking launch
```

---

# Post-Implementation Verification

After all sprints are complete, run the full verification suite:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Manual test checklist
□ Normal voice mode works
□ Conversation practice mode works (AI speaks first, user can respond)
□ Listen mode works
□ Usage tracking increments only on success
□ No double onClose callbacks
□ No sensitive data in production logs
□ Audio playback is smooth (no restart delays)
```

---

# Appendix: File Change Summary

| File | Sprint | Changes |
|------|--------|---------|
| `services/live-session.ts` | 1, 3 | Guard fix, onClose flag |
| `services/audio-utils.ts` | 3, 5 | AudioContext suspend, AudioWorklet |
| `services/gladia-session.ts` | 4 | Log sanitization |
| `api/live-token.ts` | 2, 4 | Usage tracking move, log cleanup |
| `api/gladia-token.ts` | 2, 4 | Usage tracking move, security comment |
| `api/*.ts` (32 files) | 5 | CORS fallback improvement |
| `public/audio-worklet-processor.js` | 5 | New file |
| `CLAUDE.md` | 5 | Documentation update |
