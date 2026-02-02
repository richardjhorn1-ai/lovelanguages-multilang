# Troubleshooting Guide - Bug Fixes & Lessons Learned

This document captures bug fixes from git history and patterns to avoid in future development.

---

## 🌍 Internationalization (i18n) Issues

### Missing Translation Keys
**Commits:** `12a671e2`, `d9870c79`

**Bug:** Polish pronouns (ja, ty, on, etc.) showed raw translation key `loveLog.filters.other` instead of translated text.

**Cause:** The 'other' word type wasn't added to locale files. New UI strings were only added to English, not all 18 locales.

**Fix:** Added missing translation keys to ALL locale files, not just English.

**Lesson Learned:**
- ⚠️ **Always update ALL 18 locale files** when adding new translation keys
- Create a checklist for i18n: en, pl, de, fr, es, it, pt, nl, ru, uk, cs, tr, hu, sv, no, da, ro, el
- Consider a linting rule to detect missing translations

---

## 📱 iOS/Mobile Issues

### iOS Safari Scroll Breaking
**Commit:** `106a4436`

**Bug:** Step 16 of onboarding was not scrollable on iOS Safari.

**Cause:** The combination of `min-h-full` + `flex` + `my-auto` caused iOS Safari to miscalculate the scrollable area.

**Fix:** Simplified layout to just `mx-auto` for horizontal centering, letting content flow naturally.

**Lesson Learned:**
- ⚠️ **Test CSS layout on iOS Safari** - it handles flex/min-height differently
- Avoid `min-h-full` + `flex` + centering combos on scrollable containers
- When in doubt, simplify - remove unnecessary CSS constraints

---

## 🎨 Dark Mode Issues

### Missing Dark Mode Variants
**Commit:** `ba536cf2`

**Bug:** VerbDojo feedback colors (green/red for correct/incorrect) were unreadable in dark mode.

**Cause:** Only light mode colors were specified (`text-green-600`, `text-red-600`).

**Fix:** Added dark mode variants: `dark:text-green-400`, `dark:text-red-400`.

**Lesson Learned:**
- ⚠️ **Always add dark mode variants** when using colored text/backgrounds
- Use lighter shades (400) for dark mode vs darker shades (600) for light mode
- Test both themes when adding new UI components

---

## 🔊 TTS (Text-to-Speech) Issues

### TTS Ignoring Language Code
**Commit:** `7ccae486`

**Bug:** TTS was always defaulting to Polish regardless of user's target language.

**Cause:** Frontend sent `languageCode` but API expected `targetLanguage` - parameter name mismatch.

**Fix:** 
1. Frontend now sends `targetLanguage`
2. API accepts both `languageCode` and `targetLanguage` for backward compatibility

**Lesson Learned:**
- ⚠️ **Document API parameter names** clearly
- When fixing, add backward compatibility (`languageCode` as fallback)
- Test TTS with multiple languages, not just the default

### Sanitizer Blocking TTS Click
**Commit:** `b38b692a`

**Bug:** Click-to-hear-pronunciation feature wasn't working - words weren't clickable.

**Cause:** HTML sanitizer was stripping the `data-word` attribute needed for TTS click handlers.

**Fix:** Added `data-word` to allowed attributes in sanitizer.

**Lesson Learned:**
- ⚠️ **Check sanitizer allowlists** when adding new HTML attributes
- Custom data attributes need explicit allowlisting

---

## 💾 Data Persistence Issues

### Onboarding Progress Lost on Close
**Commit:** `732f8731`

**Bug:** Users lost all onboarding progress when clicking X button.

**Cause:** Progress was being cleared immediately on any exit.

**Fix:** Progress only clears after successful completion; X button now preserves progress.

**Lesson Learned:**
- ⚠️ **Only clear user progress on explicit success**, not on exit
- Let users resume where they left off

### Onboarding Progress Lost on Error
**Commit:** `be4f040a`

**Bug:** If save failed during onboarding, progress was deleted and user had to repeat all 17 steps.

**Cause:** Error handling deleted localStorage, then reloaded - creating a frustrating loop.

**Fix:** On error: show alert, keep progress, let user retry.

**Lesson Learned:**
- ⚠️ **Never delete user data as part of error handling**
- Preserve state and let user retry
- Error → keep progress → show message → allow retry

### Storing Data in Non-Existent Field
**Commits:** `d89b6b99`, `e7e99be2`

**Bug:** Unlocked tenses weren't being saved/loaded correctly.

**Cause:** Code was trying to store data in a `context` field that didn't exist in the schema. Should have been `conjugations` field.

**Fix:** Changed to use the correct `conjugations` field.

**Lesson Learned:**
- ⚠️ **Verify database schema** before writing code that stores data
- Check field names exist in your Supabase/DB schema
- If data isn't persisting, check you're writing to the right field

---

## 💳 Subscription/Payment Issues

### Active Subscribers Hitting Plan Selection
**Commit:** `4a6150d1`

**Bug:** Users with active subscriptions were being shown plan selection, then getting blocked when API said they already have a subscription.

**Cause:** Code only skipped plan selection for "inherited" subscriptions, not ALL active subscriptions.

**Fix:** Skip plan selection for ANY `subscription_status='active'`.

**Lesson Learned:**
- ⚠️ **Handle all subscription states**, not just specific types
- Test payment flows with different subscription origins
- Check: `status === 'active'` not `source === 'inherited'`

---

## 🌐 Language-Specific Issues

### Hardcoded Language Assumptions
**Commit:** `89490599`

**Bug:** Imperative verb generation assumed all languages have 3 persons, but Greek/Turkish only have 2.

**Cause:** Hardcoded schema with 3 imperative persons.

**Fix:** Made schema dynamic using `getImperativePersons()` which reads from language config.

**Lesson Learned:**
- ⚠️ **Languages have different grammatical structures** - don't hardcode
- Use language configuration files for grammar rules
- Test with non-Romance languages (Turkish, Greek, etc.)

---

## 🛠️ Quick Reference Checklist

Before shipping any feature:

- [ ] All 18 locale files updated with new strings?
- [ ] Tested on iOS Safari?
- [ ] Dark mode variants added?
- [ ] API parameter names match frontend?
- [ ] Sanitizer allows needed attributes?
- [ ] User progress preserved on error/exit?
- [ ] Writing to correct database field?
- [ ] Works for all subscription types?
- [ ] Language-specific grammar handled?

---

## 📅 Timeline of Fixes

| Date | Commit | Area | Summary |
|------|--------|------|---------|
| Recent | `d9870c79` | i18n | VerbDojo translations, neuter gender |
| Recent | `12a671e2` | i18n | Missing 'other' word type |
| Recent | `dde45793` | UI | VerbDojo UX improvements |
| Recent | `ba536cf2` | UI | Dark mode colors |
| Recent | `732f8731` | UX | Onboarding progress on X click |
| Recent | `4a6150d1` | Payment | Subscription status check |
| Recent | `be4f040a` | UX | Onboarding error handling |
| Recent | `7ccae486` | TTS | Language code parameter |
| Recent | `106a4436` | Mobile | iOS scroll issue |
| Recent | `89490599` | API | Dynamic imperative schema |
| Recent | `d89b6b99` | Data | Correct storage field |
| Recent | `b38b692a` | Security | Sanitizer allowlist |
