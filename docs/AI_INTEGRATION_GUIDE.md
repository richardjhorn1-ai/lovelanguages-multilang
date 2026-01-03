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

1. **Use cheaper models for simple tasks** (titles, summaries)
2. **Cache responses** where appropriate
3. **Limit context** - don't send entire chat history every time
4. **Use streaming** - users can interrupt, saving tokens
5. **Set max tokens** - prevent runaway responses

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
