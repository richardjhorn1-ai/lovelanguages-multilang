# AI Model Integration Guide

A practical guide for integrating AI models into Love Languages, with lessons learned from Gemini integration.

---

## Philosophy

### 1. Server-Side API Keys, Client-Side Tokens

**Never expose API keys to the browser.** Use one of these patterns:

- **Proxy Pattern**: Client → Your API → AI Provider
- **Ephemeral Tokens**: Server creates short-lived token → Client uses token directly

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────▶│  Your API   │────▶│  AI Provider │
│ (Browser)│     │  (Vercel)   │     │   (Gemini)   │
└──────────┘     └─────────────┘     └──────────────┘
```

### 2. Streaming vs Request-Response

| Use Case | Pattern | Why |
|----------|---------|-----|
| Chat responses | Streaming | Better UX, see text appear live |
| Voice/Audio | WebSocket/Live | Bidirectional, real-time |
| Background tasks | Request-Response | Simpler, reliable |

### 3. Graceful Degradation

Always have fallbacks:
- Streaming fails? Fall back to regular response
- Voice fails? Fall back to text
- AI fails? Show helpful error, don't crash

---

## Gemini Integration

### Text Generation (Chat)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple request-response
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-preview-05-20',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: {
    systemInstruction: 'You are a helpful assistant...',
    temperature: 0.7,
  }
});

// Streaming
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash-preview-05-20',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
});

for await (const chunk of stream) {
  const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) onChunk(text);
}
```

### Live API (Voice/Audio)

The Live API uses WebSockets for real-time bidirectional audio.

**Key Learnings:**

1. **Model**: Only `gemini-2.5-flash-native-audio-preview-12-2025` supports Live API
2. **API Version**: Must use `v1alpha` for ephemeral tokens
3. **Modalities**: Native audio model only supports `['AUDIO']`, NOT `['AUDIO', 'TEXT']`
4. **Transcription**: Use `outputAudioTranscription` and `inputAudioTranscription`

```typescript
// Backend: Create ephemeral token
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { apiVersion: 'v1alpha' }
});

const token = await ai.authTokens.create({
  config: {
    uses: 1,
    httpOptions: { apiVersion: 'v1alpha' },
    liveConnectConstraints: {
      model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: ['AUDIO'],  // NOT ['AUDIO', 'TEXT']!
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
          }
        }
      }
    }
  }
});

// Frontend: Connect with token
const clientAi = new GoogleGenAI({
  apiKey: token.name,
  apiVersion: 'v1alpha',
  httpOptions: { apiVersion: 'v1alpha' }
});

const session = await clientAi.live.connect({
  model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
  callbacks: {
    onopen: () => console.log('Connected'),
    onmessage: (msg) => handleMessage(msg),
    onerror: (err) => console.error(err),
    onclose: () => console.log('Disconnected')
  }
});

// Send audio
session.sendRealtimeInput({
  audio: {
    data: base64Audio,
    mimeType: 'audio/pcm;rate=16000'
  }
});
```

### Audio Format Requirements

| Direction | Sample Rate | Format |
|-----------|-------------|--------|
| Input (mic) | 16kHz | PCM 16-bit mono |
| Output (speaker) | 24kHz | PCM 16-bit mono |

---

## Switching Providers

If switching from Gemini to another provider (OpenAI, Anthropic, etc.):

### 1. Abstract the Interface

Create a service layer that hides the provider:

```typescript
// services/ai-provider.ts
interface AIProvider {
  generateText(prompt: string, options: GenerateOptions): Promise<string>;
  generateStream(prompt: string, options: GenerateOptions): AsyncGenerator<string>;
  startVoiceSession(config: VoiceConfig): Promise<VoiceSession>;
}

// Implementations
class GeminiProvider implements AIProvider { ... }
class OpenAIProvider implements AIProvider { ... }
class AnthropicProvider implements AIProvider { ... }

// Factory
export function getProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {
    case 'openai': return new OpenAIProvider();
    case 'anthropic': return new AnthropicProvider();
    default: return new GeminiProvider();
  }
}
```

### 2. Environment-Based Configuration

```env
# .env
AI_PROVIDER=gemini
GEMINI_API_KEY=xxx

# Or for OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=xxx
```

### 3. Provider-Specific Quirks

Each provider has unique behaviors. Document them:

| Provider | Quirk | Workaround |
|----------|-------|------------|
| Gemini | Native audio doesn't support TEXT modality | Use separate transcription config |
| Gemini | Ephemeral tokens need v1alpha | Set apiVersion on both server and client |
| OpenAI | Whisper has 25MB file limit | Chunk audio before sending |
| Anthropic | No native audio | Use separate STT/TTS services |

---

## Debugging AI Issues

### 1. Log Everything

```typescript
function log(...args: any[]) {
  console.log(`[AIService ${new Date().toISOString().slice(11, 23)}]`, ...args);
}
```

### 2. Check These First

1. **API Key valid?** Try a simple request first
2. **Model name correct?** Check provider docs for exact names
3. **API version?** Some features need specific versions (v1alpha, etc.)
4. **Rate limits?** Check response headers
5. **Request format?** Log the exact request being sent

### 3. Common Error Patterns

| Error | Likely Cause |
|-------|--------------|
| 401 Unauthorized | API key invalid or missing |
| 403 Forbidden | Wrong endpoint or permissions |
| 400 Invalid Argument | Wrong config format |
| 1007 WebSocket Close | Protocol error (wrong setup message) |
| 1008 WebSocket Close | Auth error or model not found |

---

## Cost Optimization

### Basic Principles

1. **Use cheaper models for simple tasks** (titles, summaries)
2. **Cache responses** where appropriate
3. **Limit context** - don't send entire chat history every time
4. **Use streaming** - users can interrupt, saving tokens
5. **Set max tokens** - prevent runaway responses

### Advanced: Batch Operations (Critical for High-Volume Endpoints)

The biggest cost savings come from converting N API calls to 1 batch call:

```typescript
// ❌ BAD: N API calls in a loop (costs N× tokens)
for (const item of items) {
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: buildPrompt(item),
    config: { responseSchema: singleItemSchema }
  });
  results.push(JSON.parse(result.text));
}

// ✅ GOOD: 1 API call with array schema (costs 1× tokens)
const result = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: buildBatchPrompt(items),  // "Process these N items..."
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,  // Return array of results
      items: singleItemSchema
    }
  }
});
const results = JSON.parse(result.text);
```

**Savings**: 80-95% cost reduction on batch operations

### Local-First Validation Pattern

Always try free local matching before calling AI:

```typescript
async function batchValidate(answers: Answer[]): Promise<Result[]> {
  const results: Result[] = [];
  const needsAi: { index: number; answer: Answer }[] = [];

  // Step 1: FREE local matching (handles 60-80% of cases)
  answers.forEach((answer, index) => {
    if (fastMatch(answer.user, answer.correct)) {
      results.push({ index, accepted: true, explanation: 'Exact match' });
    } else {
      needsAi.push({ index, answer });
    }
  });

  // Step 2: If all matched locally, skip AI entirely!
  if (needsAi.length === 0) return results;

  // Step 3: Batch validate ONLY the non-matches
  const aiResults = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: buildValidationPrompt(needsAi.map(n => n.answer)),
    config: { responseSchema: arraySchema }
  });

  // Step 4: Merge AI results back with original indices
  const validations = JSON.parse(aiResults.text);
  needsAi.forEach((item, i) => {
    results.push({ index: item.index, ...validations[i] });
  });

  return results;
}

function fastMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  return normalize(userAnswer) === normalize(correctAnswer);
}
```

**Savings**: Eliminates 60-80% of AI calls when users type exact answers

### Schema Optimization by Use Case

Request only the data you'll actually use:

| Use Case | Schema Strategy | Token Savings |
|----------|-----------------|---------------|
| **Dictionary entry** (saved to DB) | Full schema with conjugations, examples | None (need full data) |
| **Preview/display only** | Minimal schema: word, translation, pronunciation | ~70% |
| **Tutor mode** (doesn't add vocab) | No vocabulary extraction at all | ~90% |
| **Quick validation** | Just accepted/explanation fields | ~80% |

```typescript
// Full schema for dictionary entries
const fullSchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING },
    translation: { type: Type.STRING },
    word_type: { type: Type.STRING },
    pronunciation: { type: Type.STRING },
    conjugations: { /* 6 forms × 3 tenses */ },
    examples: { type: Type.ARRAY, items: { type: Type.STRING } },
    gender: { type: Type.STRING },
    plural: { type: Type.STRING },
    proTip: { type: Type.STRING }
  }
};

// Lightweight schema for previews (same data shown differently)
const previewSchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING },
    translation: { type: Type.STRING },
    word_type: { type: Type.STRING },
    pronunciation: { type: Type.STRING }
  },
  required: ['word', 'translation', 'word_type', 'pronunciation']
};
```

### Implementation Checklist for New Endpoints

Before deploying any Gemini-calling endpoint, verify:

- [ ] **Batch operations?** - If processing multiple items, use array schema
- [ ] **Local fallback?** - Try free matching before AI validation
- [ ] **Schema minimal?** - Request only fields that will be used
- [ ] **Role-appropriate?** - Tutors don't need vocabulary extraction
- [ ] **Limits set?** - Cap array sizes and response tokens

### Key Implementation Files

| File | Pattern | Notes |
|------|---------|-------|
| `api/submit-challenge.ts` | `batchSmartValidate()` | Validates N answers in 1 call |
| `api/submit-level-test.ts` | `batchSmartValidate()` | Same pattern |
| `api/complete-word-request.ts` | `batchEnrichWordContexts()` | Enriches N words in 1 call |
| `api/chat.ts` | Role-based schema | `coachModeSchema` vs `studentModeSchema` |
| `api/create-word-request.ts` | Preview schema | Minimal data for tutor preview |

See `TROUBLESHOOTING.md` Issues #42-43 for detailed before/after examples

---

## Security Checklist

- [ ] API keys in environment variables only
- [ ] API keys never sent to client
- [ ] Rate limiting on API endpoints
- [ ] User authentication before AI calls
- [ ] Input validation (max length, content filtering)
- [ ] Error messages don't expose internals

---

## Resources

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live)
- [Ephemeral Tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)
- [js-genai SDK](https://github.com/googleapis/js-genai)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
