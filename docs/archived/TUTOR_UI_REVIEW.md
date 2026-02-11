# Tutor UI Review & Roadmap

## Executive Summary

This document reviews the current Love Languages app from a **tutor's perspective** - a language partner helping their loved one learn their mother tongue. The tutor role should focus on:
- Creating bonding moments and memories
- Helping the student overcome learning hurdles
- Encouraging and celebrating progress
- Providing real-world practice opportunities

---

## Quick Wins (Low-Hanging Fruit)

These are immediate fixes that signal the tutor experience is intentional:

### 1. Chat Placeholder Text
**Current:** "Ready for your next lesson?"
**Problem:** This is student-focused language
**Fix:** Change to tutor-appropriate prompts like:
- "What would you like to help them practice?"
- "Ask me how to support their learning today"
- "Get coaching tips for tonight's conversation"

### 2. Restructure Play vs Progress for Tutors

**Current Problem:**
- **Play** contains the Learning Dashboard (partner stats, phrases to use, words to practice)
- **Progress** shows the tutor's OWN level/XP (irrelevant)

**The Fix:**
- **Progress** → Move Learning Dashboard here (partner's stats, milestones, journey)
- **Play** → Interactive games from the partner's perspective

### 3. Tutor-Specific Games in Play

Instead of a dashboard, Play should offer relationship-based quiz games:

| Game | Description |
|------|-------------|
| **"Do You Remember?"** | Tutor asks partner to translate words they've learned |
| **"Whisper Game"** | Tutor says phrase in target language, partner repeats (pronunciation practice) |
| **"Scene Builder"** | Both roleplay scenarios using vocabulary (ordering coffee, meeting family) |
| **"Quick Fire"** | Timed vocabulary recall - fun competitive element |
| **"Love Notes"** | Write short messages to each other in target language |

These turn "studying" into "playing together" - the whole point of having a partner.

---

## Current State Analysis

### 1. Chat Section

**What Exists:**
- "Coach" mode with prompt "How can you help your partner today?"
- Session sidebar with session history
- Voice input capability
- Session types: "learn" and "ask"

**Tutor Relevance Assessment:** PARTIAL

**Issues:**
- The Chat interface is functionally identical to the student view
- No visibility into the student's recent conversations or struggles
- "Coach" mode is vague - what coaching tools are available?
- No suggested conversation starters based on student's learning
- No way to see what the student asked the AI about

**Suggestions for Bonding & Helping:**
- [ ] **Conversation Peek**: Let tutors see summaries of student's recent AI conversations (not full text, but topics/struggles)
- [ ] **Coaching Prompts**: Generate specific coaching suggestions like "Your partner struggled with past tense today - try using it naturally at dinner"
- [ ] **Phrase of the Day**: Tutor receives a phrase their partner just learned to use naturally
- [ ] **Struggle Alerts**: Notification when partner is stuck on something repeatedly

---

### 2. Love Log (Vocabulary)

**What Exists:**
- Same vocabulary list view as student
- 40 words with categories (nouns, verbs, adjectives, phrases)
- Search and filter functionality
- Audio pronunciation
- Example sentences and tips
- Word forms/conjugations

**Tutor Relevance Assessment:** PARTIAL

**Issues:**
- This is the student's personal vocabulary journal - viewing it as a tutor feels like snooping
- No tutor-specific features to help practice these words together
- Missing: progress indicators, mastery status, struggle markers
- No way for tutor to add encouraging notes to specific words

**Suggestions for Bonding & Helping:**
- [ ] **Memory Tags**: Tutor can add memory tags like "we learned this at grandma's" or "from our trip together"
- [ ] **Practice Mode Toggle**: View words student needs help with vs mastered
- [ ] **Together Words**: Flag words to practice together during daily life
- [ ] **Add Personal Context**: Tutor adds real-life context to abstract words
- [ ] **Story Builder**: Tutor creates mini-stories using student's vocabulary

---

### 3. Play Section (Currently: Learning Dashboard)

**What Exists:**
- Learning Dashboard with partner's stats, celebration prompts, phrases to use, words to practice

**Tutor Relevance Assessment:** MISPLACED

**Issues:**
- This content is great but belongs in **Progress**, not Play
- "Play" implies interactive games, but this is a read-only dashboard
- "Quiz them on this!" button exists but doesn't actually do anything
- No actual games or interactive activities for couples

**Proposed Restructure:**
Move the Learning Dashboard to Progress section. Replace Play with interactive couple games:

- [ ] **"Do You Remember?" Quiz**: Tutor selects words, app generates quiz for partner
- [ ] **"Whisper Game"**: Pronunciation practice with audio recording
- [ ] **"Scene Builder"**: Roleplay scenarios together (cafe, family dinner, etc.)
- [ ] **"Quick Fire"**: Timed vocabulary challenge - competitive and fun
- [ ] **"Love Notes"**: Write short messages to each other in target language
- [ ] **"Complete My Sentence"**: Tutor starts, partner finishes in target language

---

### 4. Progress Section

**What Exists:**
- Current level display (Beginner 2) - **TUTOR'S OWN LEVEL**
- XP tracking (40 XP) - **TUTOR'S OWN XP**
- Progress bar to next level
- Love Log stats breakdown
- Learning Journey journal (empty)
- Quick action buttons (Practice, Love Log)
- Practice Level Test button

**Tutor Relevance Assessment:** WRONG CONTENT

**Issues:**
- Shows the TUTOR's own progress - completely irrelevant!
- Tutors don't need XP or levels - they're native speakers
- The "Learning Journey" journal is student-focused
- None of this helps the tutor support their partner

**Proposed Restructure:**
Move the Learning Dashboard here from Play. This section should show:

- [ ] **Partner's Current Level & XP**: What matters to the tutor
- [ ] **Partner's Vocabulary Stats**: 40 words, 0 mastered, 11 needs review
- [ ] **Celebration Prompts**: "40 words - celebrate this milestone!"
- [ ] **Recent Activity**: What they've been learning lately
- [ ] **Struggle Areas**: Words/concepts they're having trouble with
- [ ] **Quick Phrases to Use**: Contextual suggestions for daily use
- [ ] **Milestone Timeline**: Visual journey of your partner's progress
- [ ] **Support Log**: Tutor's notes on how they've helped (optional)

---

### 5. Profile Section

**What Exists:**
- Tutor profile with "Language Coach" label
- Linked partner display
- Sign out button

**Tutor Relevance Assessment:** MINIMAL

**Issues:**
- Very sparse - just basic info
- No relationship stats or shared memories
- No customization options
- Missing: notification preferences, coaching style settings

**Suggestions for Bonding & Helping:**
- [ ] **Our Journey Stats**: Time spent learning together, words practiced, etc.
- [ ] **Shared Photo Album**: Upload photos from language learning moments
- [ ] **Love Language Profile**: Customize how encouragement is given
- [ ] **Notification Preferences**: When to get alerts about partner's progress
- [ ] **Anniversary Features**: Celebrate learning milestones on dates

---

## Priority Roadmap

### Phase 0: Quick Wins (Do These First)

| Change | Effort | Impact |
|--------|--------|--------|
| Change Chat placeholder from "Ready for your next lesson?" | 5 min | Signals intentional tutor experience |
| Move Learning Dashboard from Play → Progress | Medium | Semantic correctness |
| Show partner's level/XP in Progress (not tutor's) | Medium | Tutors see what matters |

### Phase 1: Couple Games in Play

| Game | Description | Bonding Value |
|------|-------------|---------------|
| "Do You Remember?" | Tutor quizzes partner on learned words | Active practice together |
| "Whisper Game" | Pronunciation practice with recording | Intimate, playful |
| "Quick Fire" | Timed vocabulary challenge | Competitive fun |
| "Love Notes" | Write messages in target language to each other | Romantic, practical |

### Phase 2: Deeper Connection Features

| Feature | Section | Impact |
|---------|---------|--------|
| Memory Tags for Words | Love Log | "We learned this at grandma's" |
| Shared Photo Album | Profile | Visual journey memories |
| Scene Builder Game | Play | Roleplay real scenarios together |
| Milestone Timeline | Progress | See the journey visually |

### Phase 3: Engagement & Delight

| Feature | Section | Impact |
|---------|---------|--------|
| Struggle Alerts | Chat/Notifications | Know when to offer help |
| Date Night Ideas | Play | Use learning for quality time |
| Support Log | Progress | Tutor tracks their contributions |
| Weekly Celebration Ritual | Progress | Regular bonding touchpoint |

---

## Key Philosophy

The tutor role should feel like being a **supportive partner on an adventure**, not a teacher or supervisor. Features should:

1. **Create excuses for togetherness** - Date nights, practice games, celebration rituals
2. **Make mundane moments special** - Using new words at breakfast, in texts, at family gatherings
3. **Capture memories** - Photos, milestone markers, inside jokes around certain words
4. **Provide insight without surveillance** - Know how to help without tracking every move
5. **Celebrate loudly, correct gently** - Emphasis on encouragement over correction

---

## Technical Notes

- Tutor data comes from `role: 'tutor'` in user profile
- Partner relationship tracked via `partnership_id`
- Learning Dashboard already has good data structure for suggestions
- Consider adding `tutor_notes` table for Memory Tags feature
- May need `shared_moments` table for photo/memory features

---

*Document created: January 5, 2026*
*Based on UI exploration of bmichalina02 (tutor) account*
