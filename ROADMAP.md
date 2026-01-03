# Love Languages - Product Roadmap

## Vision
A language learning app for couples where one partner learns their loved one's native language. Every word learned is a gift of love.

---

## Phase 1: Core Chat Experience ✅ COMPLETE

### Modes
- **ASK** - Quick conversational Q&A (2-3 sentences)
- **LEARN** - Structured lessons with tables, drills, follow-ups

### Key Behaviors
- All verb teaching shows 6 conjugations (I, You, He/She, We, You plural, They)
- Follow-up questions offered ("Want past and future tenses too?")
- Custom markdown rendering (`::: table`, `::: drill`, `::: culture`)

---

## Phase 2: Streaming Responses ✅ COMPLETE

- Text appears live as Gemini generates it
- Smooth typing animation
- Loading indicator while streaming

---

## Phase 3: Voice Mode ✅ COMPLETE

Real-time bidirectional voice conversations with Gemini Live API.

### Features Implemented
- Always-listening voice input with live transcription
- Voice output (Gemini speaks responses aloud)
- Different voice personalities per mode (Puck for ASK, Kore for LEARN)
- Transcripts saved to chat history
- Real-time status indicators (Listening/Speaking/Connecting)

### Technical Implementation
- Ephemeral tokens for secure client-side API access
- WebSocket connection to Gemini Live API
- Audio capture at 16kHz PCM, playback at 24kHz
- Input/output transcription for text display

See `docs/AI_INTEGRATION_GUIDE.md` and `TROUBLESHOOTING.md` for details.

---

## Phase 4: Love Log Redesign 🔄 NEXT UP

**Current Problem:**
AI-based word extraction is overly complicated and unpredictable.

### Review Needed
1. **Love Log Logic** - How words are currently stored/retrieved
2. **Card Info** - What data is shown on vocabulary cards
3. **Extraction Logic** - How AI extracts words from conversations

### New Approach: Button-Based Harvesting

Instead of automatic extraction, users click "Update Love Log" to harvest words from their chat history.

### Gamification Ideas

1. **Limited Updates**
   - Free tier: 3 Love Log updates per day
   - Premium: Unlimited updates

2. **Love Garden**
   - Visual garden that grows with vocabulary
   - Each word is a flower/plant
   - Garden blooms as vocabulary expands
   - Milestone achievements (10 words, 50 words, 100 words)

3. **Partner Challenges**
   - "Learn 5 words this week" challenges
   - Partner can send word challenges
   - Celebrate milestones together

4. **Accomplishment Phrases**
   - Work toward being able to say meaningful phrases
   - "I love you" → "I love you with all my heart" → Full love letter
   - Unlock "achievements" for completing phrase milestones

---

## Phase 5: Playground / Learning Environment 🆕

**Goal:** Transform passive chat into active learning with structured practice.

### Building Blocks

1. **Flash Cards**
   - Spaced repetition algorithm (SM-2 variant)
   - Audio pronunciation (Web Speech API → Google Cloud TTS upgrade path)
   - User-recorded pronunciation comparison
   - Progress tracking

2. **Word-Specific Practice** (from Love Log)
   - "Practice This Word" button on Love Log cards
   - Sends word to a focused practice queue
   - Test the word in different contexts:
     - Translation recall (Polish → English)
     - Reverse recall (English → Polish)
     - Fill-in-the-blank sentences
     - Conjugation drills (for verbs)
     - Listening comprehension (hear → identify)
   - Links back to Love Log card after practice

### Backend: Priority & Spaced Repetition (Hidden from User)

**Importance Score (1-5)** - Set by AI during harvest, not displayed:
- 5 = Core survival Polish (cześć, dziękuję, proszę)
- 4 = High-frequency verbs/phrases
- 3 = Common vocabulary
- 2 = Situational/specific
- 1 = Nice-to-know, rare

**Spaced Repetition Fields:**
- `ease_factor`: How easy this card is for user (default 2.5)
- `interval_days`: Days until next review
- `repetitions`: Consecutive correct answers
- `next_review`: Calculated optimal review date

**Practice Priority Formula:**
```
priority = (importance × 2) + (days_overdue × 1.5) - (success_rate × 0.5)
```
- High priority = Important + Overdue + Struggling
- Low priority = Less important + Recently practiced + Mastered
- Goal: Optimal challenge - cards appear at the edge of forgetting

2. **Role-Playing Scenarios**
   - User-prompted or curated situations
   - AI plays the other character
   - Extract learning phrases from each scenario
   - Test competency after completion

### Scenario Ideas
| Scenario | Key Phrases | Difficulty |
|----------|-------------|------------|
| Going to the movies | "Two tickets please", "What time?" | Beginner |
| Shopping for groceries | "How much?", "Do you have...?" | Beginner |
| Booking a holiday | "I'd like to reserve", dates, prices | Intermediate |
| Meeting a new friend | Introductions, hobbies, questions | Beginner |
| Meeting partner's parents | Formal greetings, compliments, polite phrases | Intermediate |
| Restaurant ordering | Menu items, dietary needs, paying | Beginner |
| Doctor's appointment | Symptoms, body parts, instructions | Intermediate |
| Job interview | Professional intro, experience, questions | Advanced |

### User-Prompted Scenarios
- User describes a situation they want to practice
- AI generates appropriate dialogue and vocabulary
- Extract key phrases to Love Log
- Quiz user on learned content

### Competency Testing
- After each scenario, quick quiz on key phrases
- Track mastery level per scenario
- Suggest when to revisit based on forgetting curve

---

## Phase 6: Partner Dashboard

**Goal:** Help the proficient partner support the learner

**Features:**
- See partner's vocabulary progress
- View struggling words (high fail rate in flashcards)
- Suggested conversation starters based on learned words
- "Surprise them with..." suggestions
- Send vocabulary challenges
- Milestone celebrations ("They learned 100 words!")

---

## Phase 7: Mobile PWA

**Goal:** Installable app experience on mobile

**Features:**
- Add to home screen prompt
- Offline flashcard practice
- Push notifications for daily practice
- Responsive design optimized for mobile

---

## Database Schema Updates Needed

```sql
-- Track daily harvest limits
CREATE TABLE harvest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  harvested_at TIMESTAMP DEFAULT NOW(),
  words_harvested INT DEFAULT 0
);

-- Garden/achievement tracking
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  achievement_type VARCHAR(50),
  achieved_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Partner challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id),
  to_user_id UUID REFERENCES profiles(id),
  challenge_type VARCHAR(20),
  content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  success BOOLEAN
);

-- Role-play scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title VARCHAR(100),
  description TEXT,
  difficulty VARCHAR(20),
  phrases_learned JSONB,
  completed_at TIMESTAMP,
  competency_score INT
);

-- Flash card progress
CREATE TABLE flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  word_id UUID REFERENCES love_log(id),
  next_review TIMESTAMP,
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INT DEFAULT 1,
  repetitions INT DEFAULT 0,
  last_reviewed TIMESTAMP
);
```

---

## Priority Order

1. ✅ Prompt refinement (ASK + LEARN modes)
2. ✅ Streaming responses
3. ✅ Voice mode (Gemini Live API)
4. 🔄 Love Log redesign (review + gamification)
5. ⬜ Playground (flashcards + role-play)
6. ⬜ Partner dashboard
7. ⬜ Mobile PWA

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Voice API | Gemini Live API | Native integration, ephemeral tokens |
| Audio format | 16kHz input, 24kHz output | Gemini requirements |
| Speech-to-text | Gemini native transcription | Built into Live API |
| Streaming | Gemini Stream API | Already using Gemini |
| State management | React useState + Supabase | Keep it simple |
| Gamification | Supabase + custom components | Flexible, no extra dependencies |

---

## Documentation

- `docs/AI_INTEGRATION_GUIDE.md` - How to work with AI models
- `TROUBLESHOOTING.md` - All issues encountered and solutions
- `NEXT_STEPS.md` - Immediate next actions
