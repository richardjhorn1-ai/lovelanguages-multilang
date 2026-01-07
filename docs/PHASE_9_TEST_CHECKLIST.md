# Phase 9: Integration Test Checklist

**Created:** January 7, 2026
**Status:** Ready for manual testing

---

## API Endpoint Verification

All 28 API endpoints verified responding correctly:

| Category | Endpoint | Status | Notes |
|----------|----------|--------|-------|
| **Chat** | /api/chat | 401 | Auth required |
| | /api/chat-stream | 200+SSE | Sends auth error via SSE data |
| | /api/live-token | 401 | Auth required |
| | /api/gladia-token | 401 | Auth required |
| | /api/analyze-history | 401 | Auth required |
| | /api/polish-transcript | 401 | Auth required |
| **Level** | /api/generate-level-test | 401 | Auth required |
| | /api/submit-level-test | 401 | **FIXED** - was 500, inline validation |
| | /api/increment-xp | 401 | Auth required |
| | /api/progress-summary | 401 | Auth required |
| | /api/boot-session | 401 | Auth required |
| **Partner** | /api/generate-invite | 401 | Auth required |
| | /api/validate-invite | 400 | Needs token param |
| | /api/complete-invite | 401 | Auth required |
| **Tutor** | /api/create-challenge | 401 | Auth required |
| | /api/start-challenge | 401 | Auth required |
| | /api/submit-challenge | 401 | **FIXED** - was 500, inline validation |
| | /api/get-challenges | 401 | Auth required (POST) |
| | /api/create-word-request | 401 | Auth required |
| | /api/get-word-requests | 401 | Auth required (POST) |
| | /api/complete-word-request | 401 | Auth required |
| | /api/get-notifications | 401 | Auth required (POST) |
| **Game** | /api/submit-game-session | 401 | Auth required |
| | /api/get-game-history | 401 | Auth required |
| | /api/validate-answer | 400 | Needs answer params |
| | /api/validate-word | 401 | Auth required |
| | /api/unlock-tense | 401 | Auth required |
| | /api/tts | 401 | Auth required |

---

## User Journey Tests

### Journey 1: New User Onboarding

**Goal:** Verify complete signup and onboarding flow

```
[ ] 1. Navigate to app (localhost:3000 or production URL)
[ ] 2. Click "Sign Up"
[ ] 3. Enter email and password
[ ] 4. Check email for verification link
[ ] 5. Click verification link
[ ] 6. Complete onboarding wizard:
    [ ] a. Select role (Student or Tutor)
    [ ] b. Enter motivation/partner name
    [ ] c. (Optional) Partner invite flow
[ ] 7. Arrive at main dashboard
[ ] 8. Verify profile created in database
```

**Pass criteria:** User lands on dashboard with correct role

---

### Journey 2: Student Daily Practice

**Goal:** Verify core learning flow

```
[ ] 1. Login as Student
[ ] 2. Go to Chat tab
[ ] 3. Send a message in ASK mode
    [ ] - Verify streaming response
    [ ] - Verify Polish words are formatted correctly
[ ] 4. Switch to LEARN mode
[ ] 5. Ask to learn a verb (e.g., "teach me kochać")
    [ ] - Verify table renders
    [ ] - Verify conjugations shown
[ ] 6. Check Love Log tab
    [ ] - Verify new words appear
    [ ] - Check conjugation tables expand
[ ] 7. Go to Play tab
[ ] 8. Play Flashcards
    [ ] - Verify cards flip
    [ ] - Verify Hard/Got It buttons work
[ ] 9. Play Multiple Choice
    [ ] - Verify 4 options shown
    [ ] - Verify correct/incorrect feedback
[ ] 10. Play Type It
    [ ] - Verify answer validation
    [ ] - Test diacritic tolerance (e.g., "cie" for "cię")
[ ] 11. Check Progress tab
    [ ] - Verify XP displayed
    [ ] - Verify level shown
```

**Pass criteria:** All interactions smooth, vocabulary tracked

---

### Journey 3: Tutor Sending Challenge

**Goal:** Verify tutor-to-student challenge flow

```
[ ] 1. Login as Tutor
[ ] 2. Navigate to partner's Progress view
    [ ] - Verify partner's stats visible
[ ] 3. Create Quiz Challenge
    [ ] - Add 5+ words
    [ ] - Set challenge title
    [ ] - Submit challenge
[ ] 4. Verify notification created
[ ] 5. Switch to Student account (or second browser)
[ ] 6. Check notifications
    [ ] - Verify challenge notification shows
[ ] 7. Start challenge
    [ ] - Complete questions
    [ ] - Submit answers
[ ] 8. Verify results shown
    [ ] - Score displayed
    [ ] - XP awarded
[ ] 9. Switch back to Tutor
[ ] 10. Verify completion notification received
```

**Pass criteria:** Full challenge lifecycle works

---

### Journey 4: Voice Conversation Practice

**Goal:** Verify voice mode and conversation scenarios

```
[ ] 1. Login as Student
[ ] 2. Go to Play tab
[ ] 3. Select "Conversation Practice" (BETA)
[ ] 4. Choose a scenario (e.g., "At the Café")
[ ] 5. Grant microphone permission when prompted
[ ] 6. Verify AI speaks first (greeting)
[ ] 7. Respond in Polish
    [ ] - Verify transcription appears
[ ] 8. Continue conversation (3-4 exchanges)
[ ] 9. End session
[ ] 10. Verify transcript saved
```

**Pass criteria:** Voice conversation flows naturally, transcripts captured

---

### Journey 5: Listen Mode

**Goal:** Verify passive transcription feature

```
[ ] 1. Login as Student
[ ] 2. Go to Chat tab
[ ] 3. Click Listen (headphones) icon
[ ] 4. Enter optional context label
[ ] 5. Grant microphone permission
[ ] 6. Start listening
[ ] 7. Speak in Polish (or play Polish audio)
    [ ] - Verify transcription appears
    [ ] - Verify language flag (🇵🇱/🇬🇧) shows
    [ ] - Verify translation appears (if Polish)
[ ] 8. Bookmark a phrase
[ ] 9. Stop & Save session
[ ] 10. Verify session appears in sidebar
[ ] 11. Click session to view transcript
[ ] 12. (Optional) Click "Polish" to run AI correction
[ ] 13. (Optional) Click "Extract Words" to add vocabulary
```

**Pass criteria:** Transcription works, sessions saved

---

### Journey 6: Level Test

**Goal:** Verify proficiency testing system

```
[ ] 1. Login as Student
[ ] 2. Go to Progress tab
[ ] 3. Click "Take Level Test"
[ ] 4. Verify test generates (may take 5-10s)
[ ] 5. Answer all questions
    [ ] - Mix of correct and incorrect
[ ] 6. Submit test
[ ] 7. Verify results page shows:
    [ ] - Score percentage
    [ ] - Pass/Fail status
    [ ] - Individual question feedback
[ ] 8. Check if level updated (if passed)
[ ] 9. Verify test appears in history
[ ] 10. (Optional) Take another test to verify cooldown
```

**Pass criteria:** Test grading works, level updates correctly

---

## Database Integrity Checks

Run these queries in Supabase SQL Editor:

```sql
-- Check for orphaned messages (should return 0)
SELECT COUNT(*) FROM messages WHERE chat_id NOT IN (SELECT id FROM chats);

-- Check for orphaned dictionary entries (should return 0)
SELECT COUNT(*) FROM dictionary WHERE user_id NOT IN (SELECT id FROM profiles);

-- Check for orphaned word scores (should return 0)
SELECT COUNT(*) FROM word_scores WHERE user_id NOT IN (SELECT id FROM profiles);
SELECT COUNT(*) FROM word_scores WHERE word_id NOT IN (SELECT id FROM dictionary);

-- Check for broken partner links (should return 0)
SELECT COUNT(*) FROM profiles p1
WHERE p1.partner_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = p1.partner_id);

-- Check incomplete onboarding (informational)
SELECT id, email, role, onboarding_complete
FROM profiles
WHERE onboarding_complete = false;
```

---

## Environment Variables Checklist

Verify these are set in Vercel (Production) and `.env.local` (Development):

```
[ ] VITE_SUPABASE_URL
[ ] VITE_SUPABASE_ANON_KEY
[ ] SUPABASE_URL
[ ] SUPABASE_SERVICE_KEY
[ ] GEMINI_API_KEY
[ ] GLADIA_API_KEY
[ ] ALLOWED_ORIGINS (comma-separated list of allowed domains)
```

---

## Known Issues / Edge Cases

1. **chat-stream returns 200 for auth errors** - Expected behavior for SSE
2. **Some GET endpoints use POST** - By design (get-challenges, get-word-requests, get-notifications)
3. **validate-invite expects POST with body** - Not GET with query param

---

## Test Results Summary

| Journey | Tester | Date | Pass/Fail | Notes |
|---------|--------|------|-----------|-------|
| 1. Onboarding | | | | |
| 2. Student Practice | | | | |
| 3. Tutor Challenge | | | | |
| 4. Voice Conversation | | | | |
| 5. Listen Mode | | | | |
| 6. Level Test | | | | |
| DB Integrity | | | | |
| Env Variables | | | | |
