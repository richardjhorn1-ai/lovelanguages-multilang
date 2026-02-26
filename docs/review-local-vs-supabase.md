# Local vs Supabase Storage Review — Love Languages iOS
**Branch:** `feature/ios-apple-auth-iap`  
**Date:** 2025-02  
**Scope:** All Supabase table usage across migrations, services, API routes, and components

---

## 1. Complete Data Map — Every Supabase Table

### Core / Auth

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `profiles` | Central user record: name, role, language pair, XP/level, theme, subscription data, partner link | Written on signup/onboarding/every settings change; read on every app boot |
| `auth.users` | Supabase auth identity (email, Apple ID, Google) | Managed by Supabase Auth — not touched directly |

### Chat & AI

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `chats` | Conversation containers (title, mode, language) | Created on new session; listed on tab load; updated for title |
| `messages` | Individual chat messages (user + AI) | Written after every send; read on chat load; read by `progress-summary` API |
| `listen_sessions` | Live speech transcripts from Gladia, bookmarked phrases, detected words | Written when Listen Mode starts; updated as transcript comes in; deleted by user |

### Vocabulary & Learning

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `dictionary` | User's personal vocabulary bank (word, translation, grammar data, source) | Inserted on word-add, upserted during onboarding; read for all game modes; updated on word gift completion |
| `word_scores` | Mastery tracking per word: correct streak, total attempts, learned\_at | Upserted after every game answer (Flashcards, QuickFire, Quiz); synced from IndexedDB offline queue |
| `level_tests` | Proficiency test sessions (questions JSONB, score, pass/fail) | Written when test taken; read for level history |
| `progress_summaries` | AI-generated learning diary entries (topics, grammar, can-now-say) | Written by `progress-summary` API; read in ProfileView |
| `game_sessions` | Practice game metadata (mode, correct/incorrect counts, duration) | Written on game completion via `/api/submit-game-session`; read in GameHistory |
| `game_session_answers` | Per-answer records within a game session | Written with game\_session; read in GameHistory detail view |
| `vocabulary_bank` | Pre-computed word definitions (server-side lookup before calling Gemini) | Read-only by API (service key); populated offline via scripts |

### Partner Features (Two-User)

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `invite_tokens` | Magic link tokens for partner pairing | Created by inviter; validated by joiner (anon); marked used on accept |
| `link_requests` | Email-based partner invite flow | Created by requester; updated by recipient on accept/decline |
| `tutor_challenges` | Challenges created by tutor for student | Written by tutor; read by student; status updated through lifecycle |
| `challenge_results` | Student's completed challenge results | Written by student on submission; read by both for score display |
| `word_requests` | Word gift requests (tutor → student) | Written by tutor; updated through pending→completed lifecycle |
| `gift_words` | Records of gifted vocabulary entries | Written by service on gift completion; read for tutor history |
| `love_notes` | Short love notes between partners | Written by sender; read by recipient; marked read |
| `challenge_requests` | Student → tutor requests for a challenge | Written by student; updated by tutor on fulfill/decline |
| `activity_feed` | Joint timeline of partner events | Written on any significant event; read in ActivityFeed component |
| `notifications` | In-app notifications between users and system | Written by APIs on events (12 call sites — most common table); read+marked-read by user |

### Engagement & Gamification

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `achievement_definitions` | Static reference: achievement metadata | Read-only; seeded in migration |
| `user_achievements` | Which achievements each user has unlocked | Written by `check-achievements` API; read for trophy display |
| `tutor_stats` | Teaching streak, challenges created, gifts sent — one row per tutor | Updated by `tutor-award-xp` API; read on TutorDashboard |

### Billing & Subscriptions

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `subscription_plans` | Static reference: plan features and pricing | Read-only; seeded in migration |
| `subscription_events` | Audit log of all subscription changes (Stripe + RevenueCat webhooks) | Written by webhooks only; read for subscription history |
| `gift_passes` | Yearly-unlimited gift codes | Created by Stripe webhook; read/used on redemption |
| `usage_tracking` | Daily counters for rate-limited features (voice minutes, words added) | Atomically incremented via `rpc('increment_usage_counter')`; read for quota checks |
| `promo_codes` | Influencer/creator promo codes | Checked by API; incremented on redemption |
| `promo_redemptions` | Which users used which promo code | Written on redemption; used to prevent double-use |

### Admin & Operations

| Table | Purpose | Read/Write Pattern |
|-------|---------|-------------------|
| `article_generations` | Tracks AI-generated blog articles | Written by admin `/generate-article` API; not user-facing |
| `bug_reports` | User-submitted bug reports | Written by user; updated by admin |
| `analytics_events` | Internal event tracking (user journey) | Write-only from client (anon + authenticated); read by service role |
| `security_audit_log` | Auth rate-limiting and security events | Written by `api-middleware`; not user-facing |

### Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `avatars` | User profile photos (public, 5MB limit) |
| `tts-cache` | Cached TTS audio files per word (private, signed URLs) |

---

## 2. Classification by Server Requirement

### 🔴 Must Be Server-Side (can never be local-only)

| Table / Data | Why |
|-------------|-----|
| `auth.users` + `profiles` (auth columns) | Identity, session tokens, OAuth — requires Supabase Auth |
| `invite_tokens`, `link_requests` | Requires cross-user lookup; partner must validate token without being logged in |
| `tutor_challenges`, `challenge_results` | Shared between two users in real time |
| `word_requests`, `gift_words` | Partner-to-partner word gifting — server must write to the student's vocabulary |
| `love_notes`, `challenge_requests`, `activity_feed` | All multi-user data exchange |
| `notifications` | Sent by server APIs to other users |
| `subscription_events`, `usage_tracking` | Billing integrity; must be server-authoritative to prevent spoofing |
| `subscription_plans`, `gift_passes`, `promo_codes`, `promo_redemptions` | Payment system — must be server-side |
| `vocabulary_bank` | Shared read-only reference; populated server-side, large dataset |
| `analytics_events`, `security_audit_log`, `bug_reports` | Server-aggregated, admin-consumed |
| `article_generations` | Admin-only, not user data |

**Count: ~20 tables / ~65% of all tables are server-required**

---

### 🟡 Hybrid — Local First, Sync to Server

| Table / Data | Why Hybrid |
|-------------|-----------|
| `dictionary` | User's personal vocab — **must** persist across devices; could be local-first with sync. Currently also writable by partner (word gifts) so needs server channel. |
| `word_scores` | Mastery data — already partially local via IndexedDB + offline sync in `services/offline-db.ts`. Already the most natural candidate. |
| `game_sessions` + `game_session_answers` | Already queued in IndexedDB for offline sync. XP is awarded server-side so must eventually sync. |
| `listen_sessions` | Transcripts could be local-first (recorded offline), then synced when back online |
| `chats` + `messages` | AI conversations — logically personal, but AI API is always online anyway. Could be local cache with server-of-record. |

**Count: ~5 tables / ~16% of tables**

---

### 🟢 Could Be Fully Local

| Table / Data | Why Local |
|-------------|---------|
| `level_tests` | Single-user data; results just update `profiles.xp`. History not cross-device critical. |
| `progress_summaries` | AI-generated diary entries — personal, read-only after creation. Nice to have cross-device but not critical. |
| `profiles` (preferences only) | Theme (accent\_color, dark\_mode, font\_size), haptics, smart\_validation — these are all pure UX preferences. |
| `user_achievements` | Could be computed locally from local data; currently server-derived. |
| `tutor_stats` | Single-user stats (for tutor only); aggregated data that could be computed locally. |

**Count: ~5 tables / ~16% of tables**

---

## 3. Supabase Call Breakdown

**Total `supabase.from()` call sites in non-test code:** ~68

| Category | Approximate % of calls | Tables Involved |
|----------|----------------------|-----------------|
| Partner features (challenges, word gifts, activity) | ~35% | tutor_challenges, word_requests, gift_words, challenge_results, activity_feed, notifications |
| Chat & vocabulary (personal learning) | ~25% | chats, messages, dictionary, word_scores, listen_sessions |
| Auth + profile management | ~15% | profiles (auth columns, subscription) |
| Billing & usage enforcement | ~15% | usage_tracking, subscription_events, gift_passes |
| Gamification & analytics | ~10% | user_achievements, tutor_stats, bug_reports, article_generations |

**Theoretical local-replaceable calls:** The "could be local" and "hybrid" categories represent roughly **30–35% of raw call volume** — but these are almost all personal learning features (vocabulary practice, chat history, game scores). The actual *complexity* of remaining server interactions (partner system, billing) is high.

---

## 4. What Would Break if You Went Local-First

### Completely broken (no workaround):
- **Partner linking**: invite tokens + link requests need server-side anonymous lookup
- **Word gifting**: tutor can't write to student's local device
- **Challenges**: tutor can't send; student can't return results
- **Love notes / activity feed**: no delivery mechanism
- **Subscription enforcement**: usage\_tracking can't be trusted on device; easy to spoof
- **RevenueCat webhook → Supabase profile**: still needs a server to receive webhooks

### Degraded but survivable:
- **Cross-device sync**: vocabulary + scores + chat history would be device-local only
- **Progress summaries**: could only generate if messages are local (AI call still needs internet)
- **Leaderboards**: not currently implemented, but impossible local-first
- **Onboarding resume across devices**: `onboarding_progress` column added in migration 042 specifically for this

### No user impact:
- **`vocabulary_bank`** reads could be replaced with bundled word data or API calls to Gemini (already the fallback)
- **`analytics_events`** could just be GA4 events (already tracked in parallel)
- **`article_generations`** is admin-only, irrelevant to app users

---

## 5. What Already Exists for Local Storage

The app already has a meaningful offline layer:

```
services/offline-db.ts    — IndexedDB schema: vocabulary, wordScores, pendingScoreUpdates, pendingGameSessions
services/offline.ts       — Sync orchestration: pre-cache on login, batch sync on reconnect
```

**IndexedDB already stores:**
- Full vocabulary cache (`dictionary` table mirror)
- Word score cache (`word_scores` table mirror)
- Pending score updates (queued for sync)
- Pending game sessions (queued for XP award)

**This is already a local-first architecture for the learning loop.** It's just not marketed as such and doesn't cover partner features.

---

## 6. Realistic Recommendation

### Is it worth going local-only? **No — and it's not actually the right question.**

The app has a fundamental split:
1. **Solo learning loop** (chat, practice, vocab) — already works offline thanks to `offline-db.ts`
2. **Partner engagement system** (challenges, gifts, notes, activity) — inherently two-device, needs a server

Going "local-only" would mean removing every partner feature. That's not just a technical decision — it removes the entire emotional differentiator of the product (learning the language *together*).

### What IS worth pursuing now:

**Option A — Lean into the existing offline layer (Low effort, high value)**
- The IndexedDB cache already covers vocabulary + scores for offline games
- Extend it to cache `level_tests` and `progress_summaries` locally (so they don't need a Supabase call on load)
- Add local storage for user preferences (theme, haptics, smart\_validation) so they apply before profile loads
- **Effort: 1–2 days**

**Option B — Local preferences store (iOS UserDefaults / AsyncStorage) (Immediate win)**
- Move theme/accent\_color/dark\_mode/font\_size/haptics/smart\_validation to device storage
- Profile load sets them as default; user changes update both local and Supabase
- **This eliminates the brief "flash of wrong theme" on startup**
- **Effort: < 1 day**

**Option C — Treat vocabulary as local-of-record with server sync**
- Migrate `dictionary` to be local-first (CoreData/SQLite on iOS, or keep IndexedDB on web)
- Server sync happens async, like Notes.app or Obsidian Sync
- This requires conflict resolution logic (what if partner gifts a word while offline?)
- **Effort: 1–2 weeks, significant architecture change**
- **Recommendation: Not now — offline-db.ts already handles the read path well**

### What is NOT worth pursuing:
- Full Supabase replacement for solo features — the auth system alone (Apple Sign In + Google + email magic link) is deeply integrated and would need to be rebuilt
- Dropping Supabase before the partner system has a mature alternative — you'd lose the app's emotional core

### Summary verdict:

> **65% of Supabase tables are server-required and cannot be local.** The remaining ~35% are already mostly handled by the existing IndexedDB offline layer. The practical wins are: (1) local preference storage to eliminate cold-start jank, and (2) ensuring the offline-db layer is robust and tested. A full Supabase migration would break partner features and provide little user benefit beyond cold-start performance, which can be solved much more cheaply.

**Pursue: Option B (local preferences) now. Option A (extend IndexedDB cache) when there's offline reliability pressure. Option C only if partner-free solo mode becomes a product priority.**

---

*Report generated from analysis of `feature/ios-apple-auth-iap` branch: 42 migration files, services/offline.ts, services/offline-db.ts, services/purchases.ts, ~68 `supabase.from()` call sites across 50+ source files.*
