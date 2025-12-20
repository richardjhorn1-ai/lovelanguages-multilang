
# Love Languages: Polish for Couples

A sophisticated, couple-centric language learning application built with **React**, **Supabase**, and **Google Gemini 3 Flash**. This app is designed to help couples learn Polish together through shared progress, AI-driven coaching, and contextual vocabulary "harvesting."

## 🚀 Key Features

### 1. The Love Log (Dictionary)
- **Shared Lexicon:** Partners can see each other's discovered words.
- **Harvesting Engine:** Uses Gemini to analyze chat history and extract new vocabulary automatically.
- **Dual-Column Intel:** Cards flip to reveal AI-generated examples, usage tips, and verb conjugation tracking.

### 2. Cupid: Your AI Coach
- **Modes:** 
  - `Chat`: General conversation with grammar corrections.
  - `Tutor`: Targeted mini-lessons.
  - `Listen`: Passive background interpretation.
- **Live API Integration:** Real-time audio interaction using the `gemini-2.5-flash-native-audio` model.

### 3. Couple Linking
- **Invites:** Users can link accounts via email to share their dictionary and view partner progress on a shared dashboard.
- **Role Switching:** Users can toggle between `Student` and `Tutor` roles to adjust UI perspective.

## 🛠 Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS.
- **Backend/DB:** Supabase (Auth, Postgres, Realtime).
- **AI:** Google Generative AI SDK (@google/genai).
  - `gemini-3-flash-preview` for text tasks and parsing.
  - `gemini-2.5-flash-native-audio` for real-time voice sessions.

## 📂 Project Structure

```text
/
├── components/
│   ├── ChatArea.tsx       # Main conversation UI with Cupid
│   ├── LoveLog.tsx        # Dictionary with 3D flip cards
│   ├── FlashcardGame.tsx  # Gamified SRS (Spaced Repetition)
│   ├── Navbar.tsx         # Global navigation with notifications
│   └── ProfileView.tsx    # Connection settings and role management
├── services/
│   ├── gemini.ts          # Core AI service for text and harvesting
│   ├── supabase.ts        # Database client initialization
│   └── live-session.ts    # Audio processing logic for Live API
├── types.ts               # Global TypeScript interfaces
└── constants.tsx          # UI design tokens and icons
```

## 🧠 Core Logic: Harvesting
The `LoveLog` uses a unique "Harvesting" pattern. When a user clicks "Update Log," the app:
1. Fetches the last 100 messages from the database.
2. Sends the history to Gemini with a schema-strict prompt.
3. Gemini identifies new Polish words, provides English translations, generates 5 contextual examples, and identifies the root word (Lemma).
4. The results are saved to Supabase, automatically excluding words the user already knows.

## 🔒 Security & Performance
- **RLS (Row Level Security):** Ensures users can only access their own data or their linked partner's data.
- **JSON Metadata:** Extra linguistic data (examples, root words) are stored in a single `context` JSONB column to keep the schema flexible.
