# Future Improvements Guide

> **Status:** Deferred (LOW priority)
> **Created:** January 2026
> **Context:** Security audit Sprint 5 - code quality improvements

These improvements are non-critical optimizations identified during the January 2026 security audit. The critical fixes (Sprints 1-4) have been completed. These remain as nice-to-have modernizations.

---

## 1. CORS Fallback Improvement

### Problem
When a request origin doesn't match any allowed origin, the current code sets the first allowed origin with credentials. This is confusing (though not a security issue - browsers block mismatched origins).

### Current Behavior (30 files)
```typescript
} else if (allowedOrigins.length > 0) {
  // No match but have allowed origins - use first one
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

### Recommended Fix
```typescript
} else if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
  // No match - set origin for debugging, but browser will block without credentials
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  // Note: NOT setting credentials when origin doesn't match
}
```

### Implementation Strategy

#### Option A: Shell Script (Recommended)
```bash
#!/bin/bash
# File: scripts/update-cors.sh

cd "$(dirname "$0")/.." # Navigate to project root

# Find all files with the old pattern
FILES=$(grep -l "else if (allowedOrigins.length > 0)" api/*.ts)

for file in $FILES; do
  echo "Updating: $file"

  # Use sed to replace the pattern (macOS compatible)
  sed -i '' \
    -e "s/} else if (allowedOrigins.length > 0) {/} else if (allowedOrigins.length > 0 \&\& allowedOrigins[0] !== '*') {/" \
    -e "s/\/\/ No match but have allowed origins - use first one/\/\/ No match - set origin for debugging, but browser will block without credentials/" \
    -e "s/res.setHeader('Access-Control-Allow-Credentials', 'true');/\/\/ Note: NOT setting credentials when origin doesn't match/" \
    "$file"
done

echo ""
echo "Updated $(echo $FILES | wc -w | tr -d ' ') files"
echo ""
echo "Verify with: grep -c 'NOT setting credentials' api/*.ts"
```

#### Option B: Node.js Script
```javascript
// File: scripts/update-cors.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const OLD_PATTERN = `} else if (allowedOrigins.length > 0) {
    // No match but have allowed origins - use first one
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }`;

const NEW_PATTERN = `} else if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
    // No match - set origin for debugging, but browser will block without credentials
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    // Note: NOT setting credentials when origin doesn't match
  }`;

const files = glob.sync('api/*.ts');
let updated = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('else if (allowedOrigins.length > 0)')) {
    const newContent = content.replace(OLD_PATTERN, NEW_PATTERN);
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${file}`);
    updated++;
  }
});

console.log(`\nUpdated ${updated} files`);
```

#### Option C: VS Code Find & Replace
1. Open VS Code
2. `Cmd+Shift+H` (Find and Replace in Files)
3. Search: `else if (allowedOrigins.length > 0) {`
4. Replace: `else if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {`
5. Files to include: `api/*.ts`
6. Click "Replace All"
7. Repeat for the comment and credentials lines

### Files to Update (30 total)
```
api/analyze-history.ts
api/boot-session.ts
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
api/polish-transcript.ts
api/progress-summary.ts
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
```

### Verification
```bash
# Should return 30 (all files updated)
grep -c "NOT setting credentials" api/*.ts | grep -v ":0" | wc -l

# Should return 0 (no files with old pattern)
grep -l "No match but have allowed origins" api/*.ts | wc -l

# TypeScript check
npx tsc --noEmit

# Build test
npm run build
```

---

## 2. AudioWorklet Migration

### Problem
`ScriptProcessorNode` (used in `AudioRecorder`) is deprecated. While it still works, `AudioWorkletNode` offers better performance by running in a separate thread.

### Current Implementation
```typescript
// services/audio-utils.ts - Lines 46-73
const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
processor.onaudioprocess = (event) => {
  // Processing blocks the main thread
};
```

### Recommended Architecture

```
┌─────────────────┐     postMessage      ┌──────────────────────┐
│   Main Thread   │ ◄─────────────────── │   Audio Worklet      │
│  AudioRecorder  │                      │  (separate thread)   │
│                 │ ───────────────────► │                      │
│  - start()      │     audioWorklet     │  - process()         │
│  - stop()       │     .addModule()     │  - resample          │
│  - onData cb    │                      │  - convert to PCM    │
└─────────────────┘                      └──────────────────────┘
```

### Implementation Steps

#### Step 1: Create Worklet Processor
```javascript
// public/audio-worklet-processor.js
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
          buffer: this.buffer.slice()
        });
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
```

#### Step 2: Update AudioRecorder Class
```typescript
// services/audio-utils.ts
export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null; // Fallback
  private onDataCallback: ((base64Data: string) => void) | null = null;
  private nativeSampleRate: number = 48000;
  private useWorklet: boolean = false;

  async start(onData: (base64Data: string) => void): Promise<void> {
    this.onDataCallback = onData;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });

      this.audioContext = new AudioContext();
      this.nativeSampleRate = this.audioContext.sampleRate;

      // Try AudioWorklet first, fall back to ScriptProcessor
      if (this.audioContext.audioWorklet) {
        try {
          await this.startWithWorklet();
          this.useWorklet = true;
          console.log('[AudioRecorder] Using AudioWorklet');
        } catch (e) {
          console.warn('[AudioRecorder] AudioWorklet failed, using ScriptProcessor:', e);
          this.startWithScriptProcessor();
        }
      } else {
        console.warn('[AudioRecorder] AudioWorklet not supported, using ScriptProcessor');
        this.startWithScriptProcessor();
      }
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  private async startWithWorklet(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) return;

    await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio') {
        this.processAudioBuffer(event.data.buffer);
      }
    };

    source.connect(this.workletNode);
    // Don't connect to destination (we don't want to hear ourselves)
  }

  private startWithScriptProcessor(): void {
    if (!this.audioContext || !this.mediaStream) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const bufferSize = 4096;
    this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.scriptProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      this.processAudioBuffer(new Float32Array(inputData));
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
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

    // Convert to base64
    const base64 = this.arrayBufferToBase64(pcmData.buffer);
    this.onDataCallback?.(base64);
  }

  stop(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
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

  // ... existing resample() and arrayBufferToBase64() methods ...
}
```

### Browser Compatibility
| Browser | AudioWorklet Support | Fallback Needed |
|---------|---------------------|-----------------|
| Chrome 66+ | ✅ Yes | No |
| Firefox 76+ | ✅ Yes | No |
| Safari 14.1+ | ✅ Yes | No |
| Edge 79+ | ✅ Yes | No |
| Safari iOS 14.5+ | ✅ Yes | No |
| Older browsers | ❌ No | ScriptProcessor |

### Testing Checklist
- [ ] Chrome: Uses AudioWorklet (check console log)
- [ ] Safari: Uses AudioWorklet or falls back gracefully
- [ ] Firefox: Uses AudioWorklet
- [ ] Audio quality comparable to ScriptProcessor version
- [ ] No crackling or gaps in audio
- [ ] CPU usage lower than ScriptProcessor (check DevTools Performance tab)
- [ ] Memory stable over 5-minute recording session

### Verification
```bash
# TypeScript check
npx tsc --noEmit

# Verify worklet file is served
curl http://localhost:5173/audio-worklet-processor.js

# Manual test
# 1. Open DevTools Console
# 2. Start voice mode
# 3. Look for "[AudioRecorder] Using AudioWorklet" log
# 4. Speak and verify audio is captured
```

### Rollback Plan
The implementation includes automatic fallback to ScriptProcessor, so rollback is just removing the worklet code:
```bash
git checkout HEAD~1 -- services/audio-utils.ts
rm public/audio-worklet-processor.js
```

---

## 3. Efficient Base64 Encoding (Optional)

### Problem
The current base64 encoding uses string concatenation in a loop, which creates many intermediate strings.

### Current Implementation
```typescript
private arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

### Optimized Implementation
```typescript
private arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack issues
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  return btoa(binary);
}
```

This uses `String.fromCharCode.apply()` which processes chunks at once instead of character-by-character.

---

## Priority Recommendation

| Improvement | Effort | Impact | Recommendation |
|-------------|--------|--------|----------------|
| CORS Fallback | Low (1 hour) | Low | Do during next refactor |
| AudioWorklet | Medium (3-4 hours) | Medium | Do when audio issues reported |
| Base64 Optimization | Low (30 min) | Low | Do with AudioWorklet |

**Suggested trigger:** Implement these when:
1. A user reports audio performance issues, OR
2. You're doing a major refactoring sprint, OR
3. Browser deprecation warnings become blocking

---

## Related Files

- `services/audio-utils.ts` - AudioRecorder and AudioPlayer classes
- `api/*.ts` (30 files) - CORS handling
- `CLAUDE.md` - Documents CORS duplication as architectural decision
- `AUDIT_SPRINT_PLAN.md` - Full audit implementation details
