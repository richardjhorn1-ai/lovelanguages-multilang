# Offline Mode & PWA Review
**Branch:** `feature/ios-apple-auth-iap`  
**Reviewed:** 2025-02-26

---

## Executive Summary

The app has a **solid, thoughtfully-built offline foundation** — significantly more than most apps at this stage. It uses a proper IndexedDB-backed cache (not just localStorage), real network detection via Capacitor's native Network plugin, queued sync for offline actions, and clear offline UI in all major screens. The main gaps are around the **Capacitor iOS configuration** (which critically breaks native offline), missing PWA Safari splash screens, and the fact that several features are completely network-dependent with no offline fallback.

---

## 1. What Works Offline

### Flashcard/Play Tab ✅
The most complete offline feature. When offline:
- Loads vocabulary deck from IndexedDB cache (populated on login)
- Loads word scores from IndexedDB cache
- Score updates (correct/incorrect) are **queued** to IndexedDB `pendingScoreUpdates` store
- Game sessions are **queued** to `pendingGameSessions` store
- Streak tracking works entirely locally
- Shows `OfflineIndicator` banner with cached word count and last sync time
- Word mastery celebrations, haptics, XP increment all work locally

### Love Log Tab ✅ (partial)
- Vocabulary list loads from IndexedDB cache when offline
- Word scores/mastery status loads from cache
- Scan/Sync button is **disabled** offline (correct behavior)
- Add new words is disabled offline
- Word detail modals (conjugations, examples) work from cached data

### Progress Tab ✅ (partial)
- Vocabulary stats (word counts by type) load from IndexedDB cache
- Cached vocabulary chart renders offline
- "Generate Progress Summary" button is **disabled** offline (correct)
- XP/level display works from `profile` object (cached in Supabase session localStorage)

### Chat Tab ⚠️ (display only)
- Shows offline indicator banner (compact mode)
- Text input and send button are **disabled** when offline
- Previously loaded messages are visible (they're in React state, not persisted)
- **Chat history is NOT persisted offline** — page refresh loses all messages

### Vocabulary pre-cache on login ✅
`offline.preCacheOnLogin()` fires immediately after login, fetching:
- Full `dictionary` table for user + active language
- Full `word_scores` table for user + active language
Both stored in IndexedDB with proper indexing.

### Network Detection ✅
- **Native (Capacitor):** Uses `@capacitor/network` plugin — real OS-level network events, more reliable than browser events
- **Web (PWA):** Uses `window.addEventListener('online' | 'offline')` + `navigator.onLine`
- **Visibility change:** Triggers sync when app comes back to foreground
- Sync is triggered on the `online` event — handles reconnection automatically

---

## 2. What Breaks Offline

### Chat (AI conversation) ❌
Complete network dependency. All chat modes (Ask, Learn, Coach, Voice) hit:
- `/api/chat-stream` or `/api/chat`
- `/api/boot-session`
- `/api/analyze-history` (word extraction)
No local AI, no cached conversation history, no read-only replay mode.

### Tutor "Send" Mode ❌
All tutor-to-student game creation is disabled offline:
- Create Quiz (`disabled={!isOnline}`)
- Create Quick Fire (`disabled={!isOnline}`)
- Gift Words (`disabled={!isOnline}`)
This is correct behavior but means tutors have zero engagement tools when offline.

### Pending Challenges (Student) ❌
`fetchPendingItems()` is called online-only, so pending challenges and word requests from the tutor are not cached. If a student goes offline, they can't see or play challenges.

### Progress Summary Generation ❌
Button disabled offline. No cached summaries shown.

### Level Tests ❌
Entire LevelTest component has no offline handling — will fail gracefully only via the ErrorBoundary.

### Profile Management ❌
Account settings, avatar upload, partner linking — all network-dependent.

### TTS (Text-to-Speech) ❌
`/api/tts` and `/api/tts-elevenlabs` are network calls. No audio caching.

### Love Notes / Activity Feed ❌
`/api/get-love-notes`, `/api/activity-feed` — no offline cache.

### Subscription Status ❌
Trial/subscription state is checked from Supabase and RevenueCat at runtime. If session expires offline, paywall might show incorrectly.

---

## 3. Local Data Persistence

### IndexedDB (Primary offline store) ✅
File: `services/offline-db.ts`, database name: `love-languages-offline` (v1)

**Stores:**
| Store | Key | What's stored |
|-------|-----|---------------|
| `vocabulary` | `userId:languageCode:id` | Full `DictionaryEntry` objects |
| `wordScores` | `userId:wordId` | Word score + streak + learned_at |
| `pendingScoreUpdates` | autoincrement | Score updates queued for sync |
| `pendingGameSessions` | autoincrement | Game sessions queued for sync |
| `syncMeta` | string key | Last sync timestamp, migration flag |

**Migration:** There's a `migrateFromLocalStorage()` function that runs on app boot, moving old localStorage-based offline data into IndexedDB. This ran once (marked in `syncMeta`).

### localStorage (Secondary) ⚠️
Still used for:
- `preferredTargetLanguage`, `preferredNativeLanguage` — language prefs (synced with DB)
- `intended_role` — role selection before signup
- `apple_display_name` — Apple Sign In name capture (one-time)
- `cookie-consent-accepted`
- `tutor_save_to_student_progress` — preference setting
- Supabase auth session (handled by Supabase JS client automatically)

localStorage is fine for all these use cases. The heavy data was correctly migrated to IndexedDB.

### Session/Auth Cache ✅
Supabase client configured with `persistSession: true` and `autoRefreshToken: true`, so the auth token and profile data survive app restarts. The user doesn't need to log in again offline.

---

## 4. Sync Mechanism

### Sync on reconnect ✅ (solid implementation)
`offline.processPendingSync()` is triggered by:
1. `online` event (web) / `networkStatusChange` Capacitor event (native)
2. `visibilitychange` to 'visible' (app foregrounded)

**What syncs:**
1. **Word scores** — deduplicated by `wordId` (keeps latest), batch upserted to `word_scores` table
2. **Game sessions** — submitted individually to `/api/submit-game-session`, failed ones are re-queued

**Sync state** is exposed via `isSyncing` on the `OfflineService` singleton, shown in UI as "Syncing..." in the offline indicator.

### What does NOT sync:
- Chat messages (not persisted offline, can't sync what doesn't exist)
- Profile changes (not queueable)
- No background sync (no Service Worker background sync API used)

### Sync reliability ⚠️
- Session refresh is attempted if token is expired — good
- Failed game sessions are re-queued — good
- Score sync uses upsert with conflict resolution — good
- **No retry backoff** — if the server is down, sync just fails silently
- **No pending count limit** — could theoretically accumulate thousands of queued items

---

## 5. PWA Install Experience

### Web Manifest ✅
`manifest.webmanifest` is well-formed:
```json
{
  "name": "Love Languages - Learn for the One You Love",
  "short_name": "Love Languages",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "orientation": "portrait",
  "theme_color": "#FF4761",
  "background_color": "#1a1a2e"
}
```

### Icons ⚠️ (minimal)
Only 2 icon sizes: 192×192 and 512×512 (both PNGs). The 512 doubles as `maskable`.
- Missing: 384px, 256px, 128px sizes
- Missing: dedicated `maskable` icon (separate file is best practice)
- `apple-touch-icon.png` exists ✅ (used by Safari PWA)

### Splash Screens ❌ (missing for PWA)
- **No `apple-touch-startup-image` link tags** in `index.html`
- Without these, Safari PWA shows a white/black blank screen for ~1-2 seconds on launch
- The native iOS Capacitor build has splash screen assets (`splash-2732x2732.png` × 3 scales) ✅
- PWA install on iPhone will have a noticeably worse launch experience than the native app

### Service Worker ✅
- Using `vite-plugin-pwa` with Workbox
- `registerType: 'autoUpdate'` — auto-updates without user prompt
- `skipWaiting()` + `clientsClaim()` — immediate activation
- `navigateFallback: '/index.html'` — SPA fallback for offline navigation

**Precache includes:**
- `index.html`, `assets/*.js`, `assets/*.css`
- `pwa-192x192.png`, `pwa-512x512.png`, `og-image.png`, `logo.svg`
- Blog static pages (`/de`, `/es`, `/fr`, `/it`, `/pl`, `/pt`)
- Max file size: 5MB (handles large bundles)

**Runtime cache:**
- Google Fonts → CacheFirst, 1 year TTL ✅

**Not cached at runtime:**
- Supabase API calls
- `/api/*` endpoints (correctly excluded via `navigateFallbackDenylist`)
- ElevenLabs/Gladia API calls
- Images uploaded by users (avatars)

### Install Prompt ⚠️
No custom PWA install prompt/banner is implemented. The browser's native prompt will show (Chrome/Edge on Android, nothing on iOS Safari — Apple doesn't support install prompts). This is a missed engagement opportunity, especially for Android.

---

## 6. iOS-Specific Considerations

### Capacitor Config — Critical Issue ❌
```typescript
server: {
  url: 'https://www.lovelanguages.io',  // ← loads from production URL
  cleartext: false
}
```
The Capacitor iOS app **loads the web app from the production server**, not from the local `dist/` bundle. This means:
- **If the phone has no internet connection, the app shows a blank WebView or a network error**
- The `dist/` folder (with its service worker, cached assets) is unused
- This is the single most critical offline gap in the entire codebase

To fix: Remove `server.url` for production, or use it only for development. The default Capacitor behavior loads from the local `dist/` bundle, which IS cached on device.

**Note:** The `webDir: 'dist'` is correctly set and the `dist/` folder has a valid service worker — it's just never used because the server URL override takes precedence.

### `limitsNavigationsToAppBoundDomains: true` ⚠️
This setting is in both `capacitor.config.ts` and `ios/App/App/capacitor.config.json`, but there is **no `WKAppBoundDomains` key in `Info.plist`**. This is required for the setting to take effect on iOS 14+. Without it, the setting may be silently ignored.

### iOS PWA Limitations (Safari) — known issues
- **No background sync API** — iOS Safari doesn't support Background Sync, so sync can only happen when the app is open
- **Service worker storage quota** — Safari limits SW cache to ~50MB, clears it when storage pressure is high
- **ITP (Intelligent Tracking Prevention)** — can limit cross-origin caching
- **No IndexedDB persistence guarantee** — iOS can evict IDB data when storage is low (unlike Android Chrome with persistent storage grant)
- **No push notifications** — added in iOS 16.4 for installed PWAs only; not implemented here
- **SafariViewController vs WKWebView** — Capacitor uses WKWebView, which shares cookies/storage with Safari, enabling seamless login

### App Icon ✅
Native iOS app icon: single `AppIcon-512@2x.png` (1024×1024), configured as `universal` platform icon in Xcode. This is the correct modern approach (Xcode single-size icon).

### Splash Screen ✅ (native only)
Three resolution splash screen PNGs at `splash-2732x2732.png` are configured via `LaunchScreen` storyboard. Works correctly for the native Capacitor app. Does NOT apply to PWA.

---

## 7. Recommendations

### 🔴 Critical — Fix Before App Store Submission

**1. Fix the Capacitor server.url for production**
Remove `server.url` from the production build config, or use a build flag:
```typescript
// Only use server.url in development
server: process.env.NODE_ENV === 'development' ? {
  url: 'http://localhost:5173',
} : undefined
```
Without this fix, the native iOS app is completely offline-broken.

**2. Add `WKAppBoundDomains` to `Info.plist`**
Since `limitsNavigationsToAppBoundDomains: true` is set:
```xml
<key>WKAppBoundDomains</key>
<array>
  <string>lovelanguages.io</string>
  <string>www.lovelanguages.io</string>
</array>
```

### 🟡 Important — PWA Polish

**3. Add iOS PWA splash screens**
Generate startup images for all iPhone/iPad sizes and add to `index.html`:
```html
<link rel="apple-touch-startup-image" href="/splash-1179x2556.png" 
      media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)">
<!-- etc. for each device size -->
```
Tools: `pwa-asset-generator` can auto-generate these.

**4. Cache pending challenges offline**
After `fetchPendingItems()`, store results in IndexedDB so students can play challenges offline.

**5. Add a custom PWA install prompt**
Implement an `beforeinstallprompt` handler for Android/Chrome users. iOS can't do this, but Android can.

### 🟢 Nice to Have — True Offline-First

**6. Persist chat history**
Store the last N messages per chat in IndexedDB. Users could read their conversation history offline even if they can't send new messages.

**7. Cache subscription/trial status**
Store subscription state locally so the paywall doesn't incorrectly trigger offline.

**8. Sync retry with exponential backoff**
Add a retry queue with backoff for when the server is temporarily unavailable.

**9. More PWA icon sizes**
Add 384px and other sizes. Generate a proper dedicated maskable icon with safe-zone padding.

**10. Background sync consideration**
For Android PWA users (not iOS, not Capacitor), the Background Sync API could ensure queued scores sync even when the app is closed. Currently sync only happens when the app is open.

---

## Summary Table

| Feature | Offline Status | Notes |
|---------|---------------|-------|
| App loads | ❌ (native) / ✅ (PWA) | Capacitor server.url breaks native |
| Login | ✅ | Auth session persisted in localStorage |
| Flashcard games | ✅ | Full offline with queue |
| Love Log (view) | ✅ | IndexedDB cache |
| Progress stats | ✅ | From cached vocabulary |
| AI Chat | ❌ | Fully network-dependent |
| Tutor game creation | ❌ | Correctly disabled |
| Student challenges | ❌ | Not cached |
| Level tests | ❌ | No offline handling |
| Score sync on reconnect | ✅ | Deduped batch upsert |
| Game session sync | ✅ | Individual with re-queue |
| PWA manifest | ✅ | Complete |
| PWA service worker | ✅ | Workbox, autoUpdate |
| PWA splash (iOS) | ❌ | No apple-touch-startup-image |
| PWA icons | ⚠️ | Only 2 sizes |
| Native splash | ✅ | Capacitor assets in place |
| Native offline | ❌ | server.url breaks it |
