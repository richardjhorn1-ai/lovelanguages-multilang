
# Love Languages: Polish for Couples

A sophisticated, couple-centric language learning application built with **React**, **Supabase**, and **Google Gemini 3 Flash**. This app is designed to help couples learn Polish together through shared progress, AI-driven coaching, and contextual vocabulary "harvesting."

## 📂 System Prompt Blueprint (THE SOURCE OF TRUTH)

The intelligence of Cupid is the core of the app. If the AI behavior deviates, refer to this blueprint to restore it.

### 1. Persona & Voice
- **Name:** Cupid
- **Role:** Supportive, charming, slightly cheeky Polish coach.
- **Goal:** Foster intimacy through language. Never sound like a textbook; sound like a multilingual friend.

### 2. Global Pedagogical Invariants
- **English First:** Always lead with English explanations.
- **Translation Mandate:** Every Polish word MUST be followed by an English translation in brackets. Example: `Cześć (Hello)`.
- **Clarity > Immersion:** Do not try to be "immersive" by speaking only Polish. It confuses beginners. Explain the "Why" (Grammar, Case, Aspect) clearly in English.
- **Visual Blocks:**
  - `::: table`: For conjugations and declensions.
  - `::: culture [Title]`: For cultural quirks or slang.
  - `::: drill`: For the final "call to action" or challenge sentence.

### 3. Logic by Mode
- **LISTEN (Passive):** Observer mode. Brief, stays out of the way. Only explains if something is confusing or asked.
- **CHAT (Balanced):** Friendly coach. Answers questions, provides 1 sentence of Polish context, adds a table if grammar is involved, ends with a drill.
- **TUTOR (Proactive):** Explicitly teaches. References the "Love Log" (User vocabulary). Introduces exactly ONE new concept. Shows how that concept helps the couple bond.

### 4. JSON Response Schema
The API must return a structured JSON object:
```json
{
  "replyText": "Markdown formatted string including ::: blocks",
  "newWords": [
    {
      "word": "polish word",
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

### Chat Modes
| Mode | Purpose | Style |
|------|---------|-------|
| **ASK** | Quick Q&A | 2-3 sentences, conversational |
| **LEARN** | Structured lessons | Tables, drills, formatted blocks |

### Voice Mode
Real-time bidirectional voice conversations with Gemini Live API:
- Always-listening voice input with live transcription
- Voice output (Gemini speaks responses)
- Different voice personalities per mode (Puck for ASK, Kore for LEARN)
- Vocabulary extraction when voice session ends

### Love Log (Vocabulary System)
Automatic vocabulary extraction from conversations:
- **Real-time extraction** - Words added instantly from chat responses
- **Voice mode extraction** - Words harvested when voice session ends
- **Complete word data:**
  - Verbs: All 6 conjugations (ja, ty, onOna, my, wy, oni)
  - Nouns: Gender + plural form
  - Adjectives: All 4 forms (masculine, feminine, neuter, plural)
  - All words: 5 example sentences + pro-tip

### Custom Markdown Blocks
The frontend renders special blocks for language learning:
- `::: table` - Grammar/conjugation tables
- `::: drill` - Practice challenges
- `::: culture [Title]` - Cultural notes

---

## 🛠 Setup & Configuration
- **API Key:** The app uses `GEMINI_API_KEY` (or `API_KEY`) server-side only. Secrets are never injected into the client bundle.
- **Database:** Supabase handles Auth, Profiles, Link Requests, and the Dictionary (Love Log).

---

## Documentation

- `ROADMAP.md` - Product roadmap and future plans
- `TROUBLESHOOTING.md` - All issues encountered and solutions
- `NEXT_STEPS.md` - Current session notes and priorities
- `docs/AI_INTEGRATION_GUIDE.md` - Voice mode implementation details
- `docs/FORMATTING.md` - Markdown rendering pipeline
