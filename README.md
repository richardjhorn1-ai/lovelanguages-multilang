
# Love Languages: Learn Your Partner's Language

A sophisticated, couple-centric language learning application built with **React**, **Supabase**, and **Google Gemini**. This app helps couples learn each other's languages through shared progress, AI-driven coaching, and contextual vocabulary "harvesting."

**Supported Languages:** Spanish, French, Italian, Portuguese, Romanian, German, Dutch, Swedish, Norwegian, Danish, Polish, Czech, Russian, Ukrainian, Greek, Hungarian, Turkish (more coming)

## System Prompt Blueprint (THE SOURCE OF TRUTH)

The intelligence of Cupid is the core of the app. If the AI behavior deviates, refer to this blueprint to restore it.

### 1. Persona & Voice
- **Name:** Cupid
- **Role:** Supportive, charming, slightly cheeky language coach.
- **Goal:** Foster intimacy through language. Never sound like a textbook; sound like a multilingual friend.

### 2. Global Pedagogical Invariants
- **English First:** Always lead with English explanations (for English-native learners).
- **Translation Mandate:** Every target language word MUST be followed by an English translation in brackets. Example: `Hola (Hello)` or `Bonjour (Hello)`.
- **Clarity > Immersion:** Do not try to be "immersive" by speaking only in the target language. It confuses beginners. Explain the "Why" (Grammar, Case, Aspect) clearly in English.
- **Visual Blocks:**
  - `::: table`: For conjugations and declensions.
  - `::: culture [Title]`: For cultural quirks or slang.
  - `::: drill`: For the final "call to action" or challenge sentence.

### 3. Logic by Mode
- **LISTEN (Passive):** Observer mode. Brief, stays out of the way. Only explains if something is confusing or asked.
- **CHAT (Balanced):** Friendly coach. Answers questions, provides 1 sentence of context in target language, adds a table if grammar is involved, ends with a drill.
- **TUTOR (Proactive):** Explicitly teaches. References the "Love Log" (User vocabulary). Introduces exactly ONE new concept. Shows how that concept helps the couple bond.

### 4. JSON Response Schema
The API must return a structured JSON object:
```json
{
  "replyText": "Markdown formatted string including ::: blocks",
  "newWords": [
    {
      "word": "target language word",
      "translation": "english meaning",
      "type": "noun/verb/etc",
      "importance": 1-5,
      "context": "Short sentence where it was used",
      "rootWord": "lemma form"
    }
  ]
}
```

## Features

### Multi-Language Support
| Feature | Description |
|---------|-------------|
| **15+ Languages** | Romance, Germanic, Slavic, and more |
| **Language Switching** | Premium users can learn multiple languages |
| **Per-Language Progress** | Vocabulary and mastery tracked separately |
| **Cultural Adaptation** | Scenarios adapt to target language culture |

### Chat Modes
| Mode | Purpose | Style |
|------|---------|-------|
| **ASK** | Quick Q&A | 2-3 sentences, conversational |
| **LEARN** | Structured lessons | Tables, drills, formatted blocks |

### Voice Mode
Real-time bidirectional voice conversations with Gemini Live API:
- Always-listening voice input with live transcription
- Voice output (Gemini speaks responses in target language)
- Different voice personalities per mode
- Vocabulary extraction when voice session ends

### Love Log (Vocabulary System)
Automatic vocabulary extraction from conversations:
- **Real-time extraction** - Words added instantly from chat responses
- **Voice mode extraction** - Words harvested when voice session ends
- **Language-specific grammar:**
  - Verbs: Conjugations appropriate to the language
  - Nouns: Gender (where applicable) + plural form
  - Adjectives: Agreement forms (where applicable)
  - All words: Example sentences + pro-tips

### Custom Markdown Blocks
The frontend renders special blocks for language learning:
- `::: table` - Grammar/conjugation tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

---

## Setup & Configuration
- **API Key:** The app uses `GEMINI_API_KEY` server-side only. Secrets are never injected into the client bundle.
- **Database:** Supabase handles Auth, Profiles, Link Requests, and the Dictionary (Love Log).

---

## Documentation

| File | Purpose |
|------|---------|
| `MULTILANGUAGE_TRANSFORMATION.md` | Multi-language architecture plan |
| `ROADMAP.md` | Product roadmap with completed/planned phases |
| `TROUBLESHOOTING.md` | 36+ issues documented with solutions |
| `docs/AI_INTEGRATION_GUIDE.md` | Voice mode and Gemini API implementation |
| `docs/FORMATTING.md` | Markdown rendering pipeline |
| `docs/SYSTEM_PROMPTS.md` | AI prompt documentation |

---

## Language Configuration

Each supported language has a configuration that includes:
- Grammar features (gender, conjugation, cases, articles)
- Special characters and diacritics
- TTS voice codes
- Transcription support (Gladia)
- Voice mode support (Gemini Live)

See `MULTILANGUAGE_TRANSFORMATION.md` for the complete language configuration system.
