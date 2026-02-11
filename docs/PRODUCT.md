# PRODUCT.md — How Love Languages Works

A couples language learning app where partners learn each other's language together.

---

## Core Concept

**Two roles:**
- **Student** — Learning their partner's language
- **Tutor** — Native/fluent speaker helping their partner learn

They're linked as a couple. The tutor can see the student's progress, send word gifts, and create challenges.

---

## User Journey

### 1. Landing & Signup (Hero.tsx)
- Select native language (UI language changes)
- Select target language (what to learn/teach)
- Choose role: Student or Tutor
- Sign up via email/Google/Apple

### 2. Onboarding
**Students (17 steps):** Name → Partner name → Relationship vibe → Why learning → Time commitment → Fear → Prior experience → Learn "hello" → Learn "I love you" → Practice → Plan selection

**Tutors (11 steps):** Name → Partner name → Relationship → Language connection → Teaching style → Plan selection

### 3. Partner Linking
- Paying user generates invite link
- Partner clicks link → signs up → accounts linked
- Both can now see each other's progress
- Partner gets subscription access

### 4. Main App (4 tabs)
- **Chat** — AI conversation practice
- **Love Log** — Personal vocabulary dictionary
- **Play** — Flashcard games
- **Progress** — Stats and achievements

---

## Chat Feature

**3 modes:**
| Mode | For | Purpose |
|------|-----|---------|
| Ask | Students | Quick Q&A, 2-3 sentence answers |
| Learn | Students | Structured teaching with tables/drills |
| Coach | Tutors | Context-aware assistant with partner's data |

**How words flow to Love Log:**
1. User chats with AI tutor
2. AI responds with `newWords[]` extracted from conversation
3. Each word is enriched: translation, pronunciation, examples (5), pro-tip, conjugations
4. Words saved to `dictionary` table
5. Love Log refreshes automatically

**Foreign word highlighting:**
- AI uses `**double asterisks**` around target language words
- Words render in accent color, clickable
- Tapping plays TTS pronunciation

---

## Love Log Feature

**The vocabulary dictionary.** Shows all words the user has learned.

**Words added via:**
1. Chat extraction (automatic)
2. "Sync from Chats" button (batch harvest)
3. Partner word gifts
4. Listen mode (voice transcription)

**Each word entry contains:**
- Word + translation
- Word type (noun/verb/adjective/adverb/phrase)
- Pronunciation
- 5 example sentences
- Pro-tip
- Grammar forms (conjugations for verbs, gender/plural for nouns)

**Mastery system:**
- Track correct answers in games
- 5 consecutive correct = mastered
- Progress shown as "3/5 ⚡" on cards

**Filtering:**
- By word type (nouns, verbs, etc.)
- By gifts (from partner)
- Text search

---

## Games Feature

**7 game modes:**
| Mode | Description |
|------|-------------|
| Flashcards | Classic flip cards |
| Multiple Choice | Pick from 4 options |
| Type It | Type the translation |
| Quick Fire | 60-second timed challenge |
| AI Challenge | 5 smart sub-modes (weakest, gauntlet, romantic, etc.) |
| Verb Dojo | Conjugation practice |
| Conversation Practice | AI voice chat (beta) |

**Games pull words from Love Log** (`dictionary` table).

**Tutors can:**
- Play using partner's vocabulary
- Send Quiz/Quick Fire challenges
- Gift new words with AI topic generation

**Progress tracking:**
- `word_scores` table tracks attempts, correct streak
- 5 correct streak = word mastered
- XP awarded for mastery

---

## Vocabulary Data Model

**`dictionary` table:**
```
user_id, word, translation, word_type,
pronunciation, gender, plural,
conjugations (JSONB), adjective_forms (JSONB),
example_sentence, pro_tip, notes,
source (chat/gift/listen), language_code
```

**`word_scores` table:**
```
word_id, user_id, language_code,
correct_streak, total_attempts, learned_at
```

**`gift_words` table:**
```
word_id, tutor_id, student_id, xp_earned
```

**Enrichment happens at extraction time** — Gemini AI generates translations, examples, conjugations using language-specific schemas.

---

## Progress & Achievements

**6 tiers, 18 levels:**
- Beginner → Elementary → Conversational → Proficient → Fluent → Master
- Each tier has 3 sub-levels
- Level tests at thresholds (80% pass required)

**XP sources:**
- Adding words to dictionary
- Completing games
- Achievements
- Challenge completions

**20 achievements:**
- 8 for tutors (first challenge, gift giver, teaching streaks)
- 8 for students (first word, mastery milestones, practice streaks)
- 4 for couples (first dance, perfect pair, gift exchange)

**Progress screen shows:**
- Level card with XP progress
- Word stats breakdown
- Game history with drill-down
- AI-generated "Learning Journey" summary

---

## Agentic Features (Coach Mode)

Tutors get **Coach mode** instead of Ask/Learn. The AI has context about the partner's:
- Weak/struggling words
- Learning velocity
- Recent progress
- Actionable suggestions

**4 agentic actions:**
| Action | Description |
|--------|-------------|
| 🎁 Word Gift | Send vocabulary to partner's Love Log |
| 📝 Quiz | Create quiz challenge on weak/recent words |
| ⚡ Quick Fire | Timed speed challenge |
| 💌 Love Note | Send encouragement message |

**How it works:**
1. Tutor asks AI to "create a quiz" or "send some words about travel"
2. AI proposes action with preview
3. Confirmation modal shows details
4. On confirm → creates in Supabase → notification to partner

**Linked challenges:** Word gift + quiz combo. Quiz activates after partner learns the gifted words.

---

## Subscription Model

- 7-day free trial on signup
- Trial reminders at 5, 3, 1, 0 days
- Paid subscription unlocks unlimited
- Partner gets access via linking (subscription_granted_by)
- Promo codes for creators

---

## Key Technical Notes

- **18 languages supported** (LANGUAGE_CONFIGS)
- **Persistent tabs** — Chat/Log/Play stay mounted, use CSS hidden
- **Real-time updates** — `dictionary-updated` event refreshes Love Log
- **Offline mode** — Caches vocabulary for games
- **Language-aware grammar** — Conjugations differ by language family (Romance/Slavic/Germanic)

---

## Vocabulary Bank (Planned)

**Purpose:** Pre-computed common words to:
1. Skip Gemini API calls for known vocabulary (cost savings)
2. Instant lookups instead of generation delays (better UX)
3. pSEO dictionary pages

**Integration:** Check vocabulary bank BEFORE calling Gemini. If word exists, use cached data.

---

## UX Philosophy

**Learning a new word should feel amazing.** The examples, pronunciation, pro-tips — all contribute to that moment of discovery. The Love Log isn't just storage, it's where users revisit and deepen their connection to words.

**Games adapt to vocabulary size.** New users only see games they can play. Library fills quickly through natural chat usage.
