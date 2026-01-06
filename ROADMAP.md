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

## Phase 4: Love Log & Vocabulary System ✅ MOSTLY COMPLETE

### Completed
- **Real-time vocabulary extraction** - Words extracted from chat responses instantly
- **Voice mode vocabulary extraction** - Words harvested when voice session ends
- **Complete word data** - Verbs get all 6 conjugations, nouns get gender/plural, adjectives get all 4 forms
- **NewWordsNotification component** - Shows sparkly toast when words are added
- **Love Log cards** - Full conjugation tables, example navigation, pro-tips

### Data Quality Rules (Enforced in API)
- Verbs: ALL 6 persons required for present tense (ja, ty, onOna, my, wy, oni)
- Verbs: Past/future tenses only included if ALL 6 persons can be filled (no partial data)
- Nouns: Gender + plural form required
- Adjectives: All 4 forms required (masculine, feminine, neuter, plural)
- All words: 5 example sentences + pro-tip required

### Also Completed
- **Manual "Sync All Words" button** - Available in Love Log section for catching missed words
- **Mark messages as harvested** - `vocabulary_harvested_at` timestamp prevents re-processing

### Gamification Ideas

1. **Partner Challenges**
   - "Learn 5 words this week" challenges
   - Partner can send word challenges
   - Celebrate milestones together

2. **Accomplishment Phrases**
   - Work toward being able to say meaningful phrases
   - "I love you" → "I love you with all my heart" → Full love letter
   - Unlock "achievements" for completing phrase milestones

---

## Phase 4.5: Tense Mastery System 🆕 PLANNED

**Goal:** Track and teach verb tenses systematically so learners can express themselves in past, present, future, and imperfective/perfective aspects.

### The Problem
Polish verbs have complex tense systems:
- **Present tense** - 6 conjugations (ja, ty, on/ona, my, wy, oni)
- **Past tense** - 6 conjugations + gender variations (byłem/byłam, byłeś/byłaś, etc.)
- **Future tense** - compound future (będę + infinitive) vs simple future (perfective verbs)
- **Aspect pairs** - Imperfective (ongoing) vs Perfective (completed) actions

**Current limitations:**
1. We only extract tenses that are discussed in that specific conversation
2. No mechanism to ADD new tenses to existing words later
3. Past tense schema lacks gender support (only stores one variant per person)
4. No tracking of which tenses the user has actually practiced/mastered

### Proposed Features

1. **Tense Progress per Verb**
   - Track which tenses user has practiced for each verb
   - Visual indicator: "Present ✅ | Past ⬜ | Future ⬜"
   - Unlock tenses progressively (master present → learn past → learn future)

2. **Aspect Awareness**
   - Link verb pairs: robić (impf) ↔ zrobić (pf)
   - Teach when to use each aspect
   - "You learned 'jeść' - now learn the perfective 'zjeść' for completed eating"

3. **Tense-Specific Drills**
   - Practice only past tense conjugations
   - Practice only future tense expressions
   - Mixed tense challenges ("Say 'I ate' then 'I will eat'")

4. **Contextual Tense Teaching**
   - "Yesterday I..." → triggers past tense vocabulary
   - "Tomorrow I will..." → triggers future tense
   - Natural conversation flow introduces appropriate tenses

### Database Schema Changes Needed

**1. Fix past tense conjugation storage (dictionary table JSONB):**
```typescript
// CURRENT (incomplete - no gender)
conjugations: {
  past: { ja: "byłem", ty: "byłeś", onOna: "był", ... }
}

// PROPOSED (with gender support)
conjugations: {
  past: {
    ja: { masculine: "byłem", feminine: "byłam" },
    ty: { masculine: "byłeś", feminine: "byłaś" },
    onOna: { masculine: "był", feminine: "była", neuter: "było" },
    my: { masculine: "byliśmy", feminine: "byłyśmy" },
    wy: { masculine: "byliście", feminine: "byłyście" },
    oni: { masculine: "byli", feminine: "były" }
  }
}
```

**2. New tables for tense tracking:**
```sql
-- Track tense mastery per verb per user
CREATE TABLE verb_tense_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  word_id UUID REFERENCES dictionary(id),  -- the verb entry
  tense VARCHAR(20),  -- 'present', 'past', 'future'
  mastery_level INT DEFAULT 0,  -- 0-5 scale
  last_practiced TIMESTAMP,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0
);

-- Link aspect pairs
CREATE TABLE aspect_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imperfective_word_id UUID REFERENCES dictionary(id),
  perfective_word_id UUID REFERENCES dictionary(id),
  UNIQUE(imperfective_word_id, perfective_word_id)
);
```

**3. Mechanism to update existing words:**
- When a known verb is discussed in a new tense context
- MERGE new tense data into existing entry (don't skip or overwrite)

### Success Criteria
- User can see which tenses they've mastered for each verb
- System suggests "learn past tense of kochać" when ready
- Aspect pairs are linked and taught together
- Progress feels like unlocking abilities, not memorizing tables

---

## Phase 5: Playground / Learning Environment ✅ MOSTLY COMPLETE

**Goal:** Transform passive chat into active learning with structured practice.

### Completed Features

1. **Flash Cards** ✅
   - Flip-to-reveal card interface
   - Polish → English and English → Polish directions
   - Hard/Got it feedback buttons
   - Progress tracking via word_scores table

2. **Multiple Choice** ✅
   - 4 options per question
   - Immediate feedback with correct answer highlight
   - Tracks success/fail counts

3. **Type It** ✅
   - Free-form text input
   - Flexible answer matching (case-insensitive, article-tolerant)
   - Shows correct answer on miss

4. **Quick Fire** ✅
   - Timed rapid-fire questions
   - Mix of multiple choice and type-it
   - Score tracking with streak bonuses

5. **Role-Playing Scenarios** ✅ (ConversationPractice.tsx)
   - 8 curated scenarios (café, restaurant, market, taxi, pharmacy, hotel, family, train)
   - Custom scenario option
   - AI plays character in Polish
   - Real-time voice transcription

6. **Verb Mastery Game** ✅
   - Focus practice on verbs with conjugations
   - Select tense (present, past, future)
   - Conjugate verbs for random pronouns
   - Track mastery progress

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

## Phase 5.5: AI Challenge Mode ✅ COMPLETE

**Goal:** Capture performance data from Play tests to generate personalized, AI-driven challenges that target weak areas.

### Implemented Features
- **AI Challenge as 4th Play mode tab** - Alongside Flashcards, Multiple Choice, and Type It
- **5 Challenge Modes:**
  - Weakest Words - Focus on words with lowest success rate
  - Mixed Gauntlet - Random mix of all vocabulary types
  - Romantic Phrases - 40 curated Polish romantic expressions
  - Least Practiced - Words not seen recently
  - Review Mastered - Practice learned words (unlocks after mastering words)
- **Session Length Selection** - Choose 10, 20, or All questions
- **Streak-Based Mastery System:**
  - Track `correct_streak` per word
  - Word marked as "LEARNED" after 5 consecutive correct answers
  - Wrong answer resets streak to 0 (full reset)
  - No decay - once learned, always learned
- **Mastery Badges in Love Log:**
  - Green checkmark for fully learned words
  - Amber progress indicator showing streak (e.g., "3/5")
- **Score Tracking:**
  - Real-time correct/incorrect counters
  - Immediate feedback for answers

### Database Schema Added
```sql
ALTER TABLE scores
ADD COLUMN IF NOT EXISTS correct_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS learned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

### Original Planning (below)

### The Problem
Users practice vocabulary through Flashcards, Multiple Choice, and Type It modes, but this data isn't being captured to improve their learning experience. We're missing opportunities to:
1. Identify words they consistently struggle with
2. Track which question types they find difficult
3. Generate targeted practice that addresses specific weaknesses
4. Adapt difficulty based on performance patterns

### Data Capture Strategy

**1. Play Session Tracking**

Capture every interaction in the Play section:

```typescript
interface PlaySessionResult {
  user_id: string;
  word_id: string;
  mode: 'flashcard' | 'multiple_choice' | 'type_it';
  direction: 'polish_to_english' | 'english_to_polish';
  correct: boolean;
  response_time_ms: number;  // How long to answer
  user_answer?: string;      // For type_it mode
  timestamp: string;
}
```

**2. Aggregate Performance Metrics**

Calculate per-word and per-user statistics:

```typescript
interface WordPerformance {
  word_id: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;           // 0.0 - 1.0
  avg_response_time_ms: number;
  last_practiced: string;
  struggle_score: number;     // Higher = needs more practice
  best_mode: string;          // Mode with highest accuracy
  worst_mode: string;         // Mode with lowest accuracy
  direction_preference: 'polish_to_english' | 'english_to_polish' | 'balanced';
}
```

**3. Weakness Detection Algorithm**

```typescript
function calculateStruggleScore(performance: WordPerformance): number {
  const accuracyWeight = (1 - performance.accuracy) * 40;
  const recencyWeight = daysSince(performance.last_practiced) * 2;
  const volumeBonus = Math.min(performance.total_attempts, 10) * -1; // More practice = lower score
  const slowResponsePenalty = performance.avg_response_time_ms > 3000 ? 10 : 0;

  return accuracyWeight + recencyWeight + volumeBonus + slowResponsePenalty;
}
```

### AI Challenge Generation

**1. Challenge Types**

| Challenge | Description | Triggers When |
|-----------|-------------|---------------|
| **Word Blitz** | Rapid-fire on 5 weakest words | Struggle score > 50 on 5+ words |
| **Reverse Practice** | Flip direction (EN→PL if usually PL→EN) | Direction imbalance detected |
| **Conjugation Drill** | Focus on verb forms | Verb accuracy < 70% |
| **Context Builder** | Use words in sentences | Single-word answers too slow |
| **Listening Challenge** | Audio-based questions | Strong visual, weak audio performance |
| **Speed Round** | Timed responses | Response times improving |
| **Recovery Session** | Gentle practice on failed words | After poor session |

**2. AI Prompt Template**

```typescript
const challengePrompt = `
Generate a personalized Polish practice challenge for this learner:

**Their Weak Words:**
${weakWords.map(w => `- ${w.word} (${w.translation}): ${w.accuracy}% accuracy`).join('\n')}

**Challenge Requirements:**
- Focus on the 5 words with lowest accuracy
- Create ${questionCount} questions mixing Multiple Choice and Type-It
- Include context sentences that use the words naturally
- Add encouraging feedback for correct answers
- Explain the correct answer if they get it wrong
- Track if they're improving during the challenge

**Tone:** Warm, romantic (this is a couples' language app)
`;
```

### Database Schema

```sql
-- Track individual practice attempts
CREATE TABLE play_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL,  -- 'flashcard', 'multiple_choice', 'type_it'
  direction VARCHAR(20),       -- 'polish_to_english', 'english_to_polish'
  correct BOOLEAN NOT NULL,
  response_time_ms INT,
  user_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_play_attempts_user ON play_attempts(user_id, created_at DESC);
CREATE INDEX idx_play_attempts_word ON play_attempts(word_id);

-- Aggregated word performance (updated after each session)
CREATE TABLE word_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word_id UUID REFERENCES dictionary(id) ON DELETE CASCADE,
  total_attempts INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  accuracy FLOAT DEFAULT 0,
  avg_response_time_ms INT,
  last_practiced TIMESTAMPTZ,
  struggle_score FLOAT DEFAULT 0,
  UNIQUE(user_id, word_id)
);

-- AI Challenge sessions
CREATE TABLE ai_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_type VARCHAR(50) NOT NULL,
  target_words UUID[] NOT NULL,  -- Array of word_ids being targeted
  questions JSONB NOT NULL,       -- AI-generated questions
  results JSONB,                  -- User's answers and scores
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  improvement_score FLOAT        -- Did accuracy improve?
);
```

### UI Components

**1. Challenge Launcher (in Progress page)**
- "AI Challenge" button that appears when weak words detected
- Shows brief preview: "Work on 5 struggling words"
- Themed design matching tier color

**2. Challenge Interface**
- Full-screen focused mode (no distractions)
- Progress bar showing questions remaining
- Immediate feedback with explanations
- Encouraging messages throughout
- Summary at end showing improvement

**3. Performance Dashboard (optional future enhancement)**
- Visual graph of accuracy over time
- Heatmap of strong/weak words
- Streak tracking for consistent practice

### Implementation Steps

1. **Add Data Capture to FlashcardGame.tsx**
   - Log each flashcard flip result
   - Log Multiple Choice selections
   - Log Type It submissions with timing

2. **Create Performance Aggregation API**
   - `/api/update-word-performance.ts`
   - Recalculate metrics after each session

3. **Build Weakness Detection Service**
   - Calculate struggle scores
   - Identify challenge opportunities
   - Trigger challenge suggestions

4. **Create AI Challenge Generator**
   - `/api/generate-challenge.ts`
   - Use Gemini to create personalized questions
   - Store challenge in database

5. **Build Challenge UI Component**
   - `components/AIChallenge.tsx`
   - Interactive challenge flow
   - Results tracking and display

### Success Metrics

- Users complete 70%+ of suggested challenges
- Accuracy on weak words improves by 15%+ after challenge
- Response time decreases on previously slow words
- Users return for practice more frequently

### XP Integration

- Complete AI Challenge: +15 XP
- Perfect score on challenge: +25 XP
- 3-day challenge streak: +10 XP bonus
- Improve weak word accuracy by 20%+: +5 XP per word

---

## Phase 5.6: Codebase Refactoring ✅ COMPLETE

**Date:** January 5, 2026

**Goal:** Clean up codebase, reduce complexity, improve maintainability.

### Completed Changes

| Phase | Changes | Status |
|-------|---------|--------|
| Phase 1 | shuffleArray utility, dead code cleanup | ✅ |
| Phase 2 | Type consolidation (ExtractedWord to types.ts) | ✅ |
| Phase 3 | Constants reorganized into constants/ folder | ✅ |
| Phase 4 | API shared utilities | ❌ Failed |
| Phase 5 | GameResults component extracted | ✅ |

### Files Created

- `utils/array.ts` - Shared Fisher-Yates shuffle algorithm
- `constants/colors.ts` - Color constants
- `constants/icons.tsx` - SVG icon components
- `constants/index.ts` - Barrel export
- `components/games/GameResults.tsx` - Reusable results screen

### Phase 4 Failure (Documented)

Attempted to extract shared utilities (CORS, auth, sanitize) into `api/lib/`. Failed due to Vercel serverless architecture - functions bundle independently and can't import from sibling directories.

See `TROUBLESHOOTING.md` Issue 23 for details.

---

## Phase 5.7: UI Polish & Voice Conversation Practice ✅ COMPLETE

**Date:** January 6, 2026

**Goal:** Improve UI consistency, add conversation practice feature, and fix theming issues.

### Completed Features

#### 1. Voice Conversation Practice (BETA)
Real-time voice conversations with AI personas in Polish scenarios.

**Location:** Student Play area (alongside other games)

**Features:**
- 8 curated conversation scenarios:
  - ☕ At the Café (beginner)
  - 🍽️ Restaurant Dinner (intermediate)
  - 🍎 At the Market (beginner)
  - 🚕 In a Taxi (intermediate)
  - 💊 At the Pharmacy (intermediate)
  - 🏨 Hotel Check-in (intermediate)
  - 👨‍👩‍👧 Family Dinner (advanced)
  - 🚂 Train Station (intermediate)
- Custom scenario option
- Real-time voice transcription
- Polish-first conversation with English hints when needed
- BETA badge to indicate experimental status

**Files Created:**
- `components/ConversationPractice.tsx` - Main practice component
- `components/ScenarioSelector.tsx` - Scenario picker modal
- `constants/conversation-scenarios.ts` - Curated scenarios

**Files Modified:**
- `components/FlashcardGame.tsx` - Added ConversationPractice card to game grid
- `services/live-session.ts` - Added `icon` field to ConversationScenario interface
- `api/live-token.ts` - Added conversation mode with scenario-specific system prompts

#### 2. Motivation Card Redesign
Replaced the amber "sticky note" with a modern gradient card.

**Before:**
- Amber background with physical sticky-note styling
- Double shadow effect (conflicting styles)
- Off-brand color scheme

**After:**
- Gradient card using accent colors (CSS variables)
- Decorative heart watermark
- Clean typography with "My Motivation" header
- Partner name section with subtle divider
- Proper dark mode support

**File Modified:** `components/Progress.tsx` (lines 691-722)

#### 3. Tutor Progress Page Theme Fix
Fixed hardcoded colors that didn't work in dark mode.

**Replaced:**
- `bg-teal-50`, `border-teal-100`, `text-teal-600` → CSS variables + `accentHex`
- `bg-amber-50`, `border-amber-100`, `text-amber-600` → CSS variables
- `from-white` → `from-[var(--bg-card)]`

**File Modified:** `components/Progress.tsx` (lines 417-492)

#### 4. Persistent Tab State
Fixed main tabs losing state on navigation.

**Problem:** React Router unmounted components when switching tabs, destroying all local state.

**Solution:** Created `PersistentTabs` component in `App.tsx` that keeps all main tabs mounted and uses CSS `hidden` class to show/hide instead of mount/unmount.

**File Modified:** `App.tsx`

#### 5. Loading Dot Theming
Fixed loading dot animations using hardcoded colors instead of accent theme.

**Files Fixed:**
- `components/TutorGames.tsx`
- `components/PlayQuickFireChallenge.tsx`
- `components/WordGiftLearning.tsx`
- `components/ConversationPractice.tsx`

**Change:** `bg-teal-400` / `bg-amber-400` / `bg-purple-400` → `bg-[var(--accent-color)]`

#### 6. Love Package Redesign
Replaced auto-suggestions with explicit "Generate 10 Words" button.

**Changes:**
- Removed debounced auto-search on keystroke
- Added "Generate 10 Words" / "Generate Again" button
- Added `partnerVocab` prop to exclude existing Love Log words
- Added `excludeWords` and `count` parameters to API
- Added `dryRun` mode for generating suggestions only

**Files Modified:** `components/WordRequestCreator.tsx`, `api/create-word-request.ts`

#### 7. Word Validation API
Added AI validation for manually entered words in Love Package.

**Endpoint:** `/api/validate-word.ts`

**Features:**
- Validates Polish spelling with Gemini
- Returns corrections with `was_corrected` flag
- Adds grammatical data (conjugations for verbs, gender/plural for nouns, 4 forms for adjectives)
- Handles slang appropriately
- Shows correction toast in UI when word is auto-corrected

**Files Created:** `api/validate-word.ts`
**Files Modified:** `components/WordRequestCreator.tsx`

### Technical Details

**Conversation Practice Flow:**
1. User clicks "Conversation Practice" in Play area
2. ScenarioSelector modal shows scenario options
3. User selects scenario → LiveSession connects with scenario-specific prompt
4. Gemini Live API speaks Polish based on persona
5. User responds in Polish (or English when stuck)
6. Transcript displayed in real-time

**System Prompt Pattern:**
```typescript
`You are playing the role of: ${scenario.persona}
CONTEXT: ${scenario.context}
RULES:
1. Speak ONLY in Polish by default
2. Stay in character as ${scenario.name}
3. Keep responses short (1-3 sentences)
4. If user struggles, offer gentle hint in English, then return to Polish
...`
```

---

## Phase 6: Partner Dashboard ✅ MOSTLY COMPLETE

**Goal:** Help the proficient partner support the learner

### Completed Features
- ✅ See partner's vocabulary progress (Tutor Progress page shows partner's level, XP, word counts)
- ✅ View struggling words (Words to Practice Together section - shows words with high fail_count)
- ✅ Suggested conversation starters ("Phrases for Tonight" section)
- ✅ Recently learned words display
- ✅ Send vocabulary challenges (WordRequestCreator.tsx - tutors can gift words to students)
- ✅ Quiz challenges (CreateQuizChallenge.tsx, CreateQuickFireChallenge.tsx)
- ✅ Encouragement prompts based on partner's recent activity

### Remaining Work
- ⬜ "Surprise them with..." suggestions (contextual romantic phrase recommendations)
- ⬜ Milestone celebrations ("They learned 100 words!" notifications)
- ⬜ Achievement badges for partner milestones

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
4. ✅ Love Log vocabulary extraction (real-time + voice mode)
5. ✅ XP/Level system with level tests
6. ✅ Play section (Flashcards, Multiple Choice, Type It, Quick Fire modes)
7. ✅ Progress page with Learning Journey diary
8. 🔄 Tense Mastery System (track tense learning per verb)
9. ✅ AI Challenge Mode (personalized practice from play data)
10. ✅ Role-play scenarios (ConversationPractice - 8 curated + custom scenarios)
11. ✅ Partner dashboard (mostly complete - Progress page, word gifting, quiz challenges)
12. ⬜ Mobile PWA
13. ✅ Game session history tracking (GameHistory.tsx)
14. ✅ Word gifting system (WordRequestCreator.tsx, WordGiftLearning.tsx)
15. ✅ UI theming consistency (CSS variables, dark mode support)

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

- `CLAUDE.md` - Claude Code guidance for this repository
- `README.md` - Project overview and AI persona documentation
- `ROADMAP.md` - This file - product phases and progress
- `TROUBLESHOOTING.md` - 30+ solved issues with detailed solutions
- `DESIGN.md` - UI/UX design guidelines
- `NEXT_STEPS.md` - Immediate next actions
- `docs/AI_INTEGRATION_GUIDE.md` - How to work with AI models
- `docs/FORMATTING.md` - Text formatting system (markdown to HTML pipeline)
- `docs/SYSTEM_PROMPTS.md` - AI prompt documentation
