# Love Languages - Product Roadmap

## Vision
A language learning app for couples where one partner learns their loved one's native language. Every word learned is a gift of love.

---

## Phase 1: Core Chat Experience (Current)

### Modes
- **ASK** - Quick conversational Q&A (2-3 sentences)
- **LEARN** - Structured lessons with tables, drills, follow-ups

### Key Behaviors
- All verb teaching shows 6 conjugations (I, You, He/She, We, You plural, They)
- Follow-up questions offered ("Want past and future tenses too?")
- Custom markdown rendering (`::: table`, `::: drill`, `::: culture`)

---

## Phase 2: Streaming Responses

**Goal:** See text appear live as Gemini generates it

**Technical Requirements:**
- Switch from `generateContent` to `generateContentStream`
- Frontend uses ReadableStream or EventSource
- Update UI to append text chunks as they arrive

**User Experience:**
- Text appears word-by-word or sentence-by-sentence
- Loading indicator while streaming
- Smooth animation as content appears

---

## Phase 3: Voice Mode

**Goal:** Always-listening voice conversations with live transcription

**Features:**
- Voice input with live transcription (see words as you speak)
- Voice output (Gemini reads responses aloud)
- Different voice personalities per mode:
  - ASK: Casual, friendly voice
  - LEARN: Clearer, teacher-like voice
- Transcripts saved to chat history

**Technical Requirements:**
- Web Audio API for microphone capture
- Gemini Audio API or Whisper for speech-to-text
- Text-to-speech for responses
- Real-time WebSocket or streaming connection

---

## Phase 4: Love Log Redesign

**Current Problem:**
AI-based word extraction is overly complicated and unpredictable.

**New Approach: Button-Based Harvesting**

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

### Technical Changes
- Remove automatic AI extraction on each message
- Add "Harvest Words" button with daily limit
- Track harvest count per user per day
- Build garden visualization component
- Add achievement/milestone system

---

## Phase 5: Partner Dashboard

**Goal:** Help the proficient partner support the learner

**Features:**
- See partner's vocabulary progress
- View struggling words (high fail rate in flashcards)
- Suggested conversation starters based on learned words
- "Surprise them with..." suggestions
- Send vocabulary challenges
- Milestone celebrations ("They learned 100 words!")

---

## Phase 6: Mobile PWA

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
```

---

## Priority Order

1. ✅ Prompt refinement (ASK + LEARN modes)
2. ⬜ Streaming responses
3. ⬜ Voice mode (always-listening)
4. ⬜ Love Log redesign (button + gamification)
5. ⬜ Partner dashboard
6. ⬜ Mobile PWA

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Speech-to-text | Gemini Audio or Whisper | Native integration with existing stack |
| Text-to-speech | Browser API or ElevenLabs | Browser is free, ElevenLabs for quality |
| Streaming | Gemini Stream API | Already using Gemini |
| State management | React useState + Supabase | Keep it simple |
| Gamification | Supabase + custom components | Flexible, no extra dependencies |
