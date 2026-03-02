# iOS Testing Plan

**Status:** READY TO START  
**Created:** 2026-02-04  
**Goal:** Full iOS testing before TestFlight submission

---

## Testing Setup

### Available Tools
- ✅ Xcode 26.2 installed on Mac mini
- ✅ iOS Simulator (various iPhone/iPad models)
- ✅ Claude Code (potentially Xcode integration)
- 🔲 Capacitor (for native app build)

### Testing Environments
1. **iOS Safari (Simulator)** — Test web app in mobile Safari
2. **Capacitor App (Simulator)** — Test wrapped native app
3. **Physical Device** — Final validation (Richard's iPhone?)

---

## Testing Checklist

### 🔐 Auth & Onboarding

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Student signup** | Email signup → 17-step onboarding | ☐ |
| **Tutor signup** | Email signup → 11-step onboarding | ☐ |
| **Google OAuth** | Tap Google → Auth → Redirect back | ☐ |
| **Apple OAuth** | Tap Apple → Auth → Redirect back | ☐ |
| **Partner linking** | Generate link → Share → Partner joins | ☐ |
| **Login persistence** | Close app → Reopen → Still logged in | ☐ |
| **Logout** | Logout → Confirm cleared | ☐ |
| **Password reset** | Request reset → Email → New password | ☐ |

### 💬 Chat Feature

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Ask mode** | Send question → Get short answer | ☐ |
| **Learn mode** | Send topic → Get structured lesson | ☐ |
| **Coach mode (Tutor)** | Access partner data → Suggestions | ☐ |
| **Word extraction** | Chat → Words appear in Love Log | ☐ |
| **TTS on words** | Tap highlighted word → Hear pronunciation | ☐ |
| **Keyboard handling** | Keyboard appears/dismisses properly | ☐ |
| **Safe area** | Input not hidden by home indicator | ☐ |
| **Long messages** | Scroll works, no overflow issues | ☐ |

### 📖 Love Log

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **View words** | Open Love Log → See all words | ☐ |
| **Filter by type** | Filter nouns/verbs/etc | ☐ |
| **Filter by gifts** | Show only partner gifts | ☐ |
| **Search** | Search for word → Results appear | ☐ |
| **Word detail** | Tap word → See examples, conjugations | ☐ |
| **Mastery display** | See "3/5 ⚡" progress | ☐ |
| **Sync from chats** | Tap sync → New words appear | ☐ |
| **TTS in Love Log** | Tap speaker → Hear word | ☐ |

### 🎮 Games (All 7)

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Flashcards** | Flip cards, mark correct/wrong | ☐ |
| **Multiple Choice** | Select answer, see feedback | ☐ |
| **Type It** | Type translation, submit | ☐ |
| **Quick Fire** | 60-second timed challenge | ☐ |
| **AI Challenge** | All 5 sub-modes work | ☐ |
| **Verb Dojo** | Fill Template, Match Pairs, MC | ☐ |
| **Conversation Practice** | Voice chat (beta) | ☐ |
| **TTS in games** | Speaker button plays word | ☐ |
| **XP awarded** | Complete game → XP increases | ☐ |
| **Streak tracking** | Correct answers build streak | ☐ |

### 📊 Progress & Achievements

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **View progress** | Open Progress tab → Stats shown | ☐ |
| **Level display** | Current level + XP shown | ☐ |
| **Achievements** | View unlocked achievements | ☐ |
| **Learning Journey** | AI summary loads | ☐ |
| **Game history** | Drill down into past games | ☐ |

### 💳 Subscription & Trial

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Trial active** | New user sees trial days remaining | ☐ |
| **Trial reminder** | Notification at 5/3/1/0 days | ☐ |
| **Trial expired** | Paywall appears, blocks features | ☐ |
| **Subscribe** | Tap subscribe → Stripe → Complete | ☐ |
| **Restore purchase** | Restore works if subscribed | ☐ |
| **Pricing page** | Back button works (no loop) | ☐ |
| **Partner access** | Linked partner gets access | ☐ |

### 🎁 Tutor Features

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Word gift** | Send words to partner | ☐ |
| **Quiz challenge** | Create quiz for partner | ☐ |
| **Quick Fire challenge** | Send timed challenge | ☐ |
| **Love note** | Send encouragement | ☐ |
| **View partner progress** | See partner's weak words | ☐ |

### 📱 iOS-Specific Issues

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Safe area (notch)** | Content not hidden by notch/island | ☐ |
| **Safe area (home)** | Input not hidden by home indicator | ☐ |
| **Keyboard push** | Content scrolls when keyboard opens | ☐ |
| **Orientation** | Portrait only? Or landscape too? | ☐ |
| **Pull to refresh** | If applicable, works smoothly | ☐ |
| **Tap targets** | Buttons at least 44pt | ☐ |
| **Flex/min-height** | No layout bugs (Safari quirk) | ☐ |
| **Back gesture** | Swipe from edge navigates back | ☐ |
| **Status bar** | Readable (light/dark mode) | ☐ |

### 🌙 Dark Mode

| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **System dark mode** | App respects system setting | ☐ |
| **All screens readable** | No white-on-white or black-on-black | ☐ |
| **Charts/graphs** | Visible in dark mode | ☐ |

### 🌐 Offline Mode (Full Test Suite)

**Reference:** `docs/OFFLINE_MODE_PLAN.md`

#### Cache Population
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Cache on login** | Login → Check IndexedDB has vocabulary | ☐ |
| **Cache all words** | User with 500+ words → All cached | ☐ |
| **Background refresh** | Open app online → Cache silently updates | ☐ |
| **Deleted word sync** | Delete word on web → App removes from cache | ☐ |

#### Offline Detection
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Offline banner** | Enable airplane mode → Banner appears | ☐ |
| **Banner dismisses** | Disable airplane mode → Banner gone | ☐ |
| **Chat disabled** | Offline → Chat shows "unavailable offline" | ☐ |
| **Games enabled** | Offline → Games still accessible | ☐ |

#### Offline Gameplay
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Play flashcards offline** | Airplane mode → Play full game | ☐ |
| **Play multiple choice offline** | Airplane mode → Complete game | ☐ |
| **Play type-it offline** | Airplane mode → Submit answers | ☐ |
| **Play quick fire offline** | Airplane mode → 60s challenge works | ☐ |
| **Results queued** | Complete game offline → Queued locally | ☐ |
| **Love Log viewable** | Offline → Can browse cached words | ☐ |
| **Progress viewable** | Offline → Can see cached stats | ☐ |

#### Background Sync
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Auto sync on reconnect** | Play offline → Go online → Results sync | ☐ |
| **Sync badge** | Pending actions → Badge shows count | ☐ |
| **Sync on app open** | Close app offline → Open online → Syncs | ☐ |
| **Multiple queued** | Play 5 games offline → All sync | ☐ |
| **Sync failure retry** | Sync fails → Retries automatically | ☐ |
| **Last synced indicator** | Settings shows "Last synced: X ago" | ☐ |

#### Conflict Resolution
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Timestamp wins** | Edit offline on 2 devices → Last sync wins | ☐ |
| **Score overwrites** | Play same word offline twice → Last wins | ☐ |

#### SRS Timing
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Intervals adjusted** | Offline 3 days → Sync → Intervals recalculated | ☐ |
| **Streak preserved** | Play offline daily → Sync → Streak intact | ☐ |

#### Edge Cases
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **First-time offline** | New user + no internet → Friendly block | ☐ |
| **Storage full** | Fill IndexedDB → Error message shown | ☐ |
| **Logout clears cache** | Logout → IndexedDB empty | ☐ |
| **Slow network** | Throttle to 2G → Loading states shown | ☐ |
| **Intermittent** | Toggle airplane rapidly → No crashes | ☐ |

#### i18n (Offline Messages)
| Test Case | Steps | Pass? |
|-----------|-------|-------|
| **Banner in all langs** | Switch language → Offline banner translated | ☐ |
| **Error messages** | All offline errors in user's language | ☐ |

---

## Automation Opportunities

### 1. Playwright for Web Testing
```bash
# Run against iOS Safari simulator
npx playwright test --project=webkit
```
- Can automate most UI flows
- Runs in Safari-like engine
- Good for regression testing

### 2. Xcode UI Testing (XCUITest)
- Native iOS testing after Capacitor build
- Can test actual app behavior
- Records taps, swipes, assertions

### 3. Claude Code + Xcode Integration
- Claude Code now integrates natively with Xcode
- Could potentially help:
  - Generate XCUITest test cases
  - Debug iOS-specific issues
  - Analyze crash logs
- Worth exploring once we have Capacitor app

### 4. Detox (React Native / Capacitor)
- E2E testing for mobile apps
- Might work with Capacitor
- Research needed

---

## Suggested Testing Order

1. **Quick smoke test** — Open in iOS Simulator Safari, tap around
2. **Auth flows** — Most critical, must work
3. **Core loop** — Chat → Words extracted → Love Log → Games
4. **Payments** — Trial, subscription (use Stripe test mode)
5. **Tutor features** — Partner interactions
6. **Edge cases** — Offline, errors, dark mode
7. **Polish** — Safe areas, animations, haptics

---

## How to Run iOS Simulator

```bash
# List available simulators
xcrun simctl list devices available

# Boot a simulator (e.g., iPhone 15 Pro)
xcrun simctl boot "iPhone 15 Pro"

# Open Simulator app
open -a Simulator

# Open URL in simulator Safari
xcrun simctl openurl booted "https://lovelanguages.io"
```

---

## Blockers / Questions

1. **Capacitor build** — Needed for native app testing. Is it configured?
2. **Physical device** — Do we have one for final testing?
3. **Apple Developer account** — Set up for TestFlight?
4. **App Store assets** — Screenshots, description, etc.?

---

## Next Steps

1. [ ] Boot iOS Simulator, do quick smoke test
2. [ ] Work through checklist systematically
3. [ ] Log bugs as GitHub issues
4. [ ] Fix critical bugs
5. [ ] Capacitor build
6. [ ] TestFlight internal testing
7. [ ] App Store submission
