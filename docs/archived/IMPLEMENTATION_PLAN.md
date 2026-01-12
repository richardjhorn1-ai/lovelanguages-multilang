# Implementation Plan: Multi-Language Fixes & Completion

> **Created:** January 12, 2026
> **Purpose:** Fix database issues and complete remaining multi-language work
> **Status:** Ready for implementation

---

## Quick Status

| Phase | Description | Priority | Effort |
|-------|-------------|----------|--------|
| DB-1 | Database Integrity Fixes | High | Small |
| DB-2 | Listen Mode Schema Fix | High | Medium |
| LS-1 | Language Switcher UI Responsiveness | High | Small |
| LS-2 | Navbar Language Access | Medium | Small |
| BG-1 | Blog Polish Article Migration | Low | Medium |
| ML-9 | Premium Multi-Language (Add Language) | Medium | Large |
| ML-10 | Final Testing & Validation | High | Medium |

---

## Phase DB-1: Database Integrity Fixes

**Priority:** High
**Effort:** Small (1 migration file)
**Risk:** Low

### Issues Being Fixed

1. No CHECK constraints on `language_code` columns
2. No integrity between `active_language` and `languages[]` array
3. Missing partial index on `word_scores.learned_at`

### Migration File

Create `migrations/025_language_integrity.sql`:

```sql
-- Migration 025: Language Integrity Constraints
-- Adds CHECK constraints and integrity triggers for multi-language support

-- Valid language codes (18 supported)
DO $$
BEGIN
  -- Add CHECK constraint to profiles.native_language
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_native_language'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT valid_native_language
      CHECK (native_language IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));
  END IF;

  -- Add CHECK constraint to profiles.active_language
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_active_language'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT valid_active_language
      CHECK (active_language IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));
  END IF;
END $$;

-- Add CHECK constraints to data tables (using same pattern)
-- dictionary
ALTER TABLE dictionary DROP CONSTRAINT IF EXISTS valid_dictionary_language;
ALTER TABLE dictionary ADD CONSTRAINT valid_dictionary_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- word_scores
ALTER TABLE word_scores DROP CONSTRAINT IF EXISTS valid_word_scores_language;
ALTER TABLE word_scores ADD CONSTRAINT valid_word_scores_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- chats
ALTER TABLE chats DROP CONSTRAINT IF EXISTS valid_chats_language;
ALTER TABLE chats ADD CONSTRAINT valid_chats_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- level_tests
ALTER TABLE level_tests DROP CONSTRAINT IF EXISTS valid_level_tests_language;
ALTER TABLE level_tests ADD CONSTRAINT valid_level_tests_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- tutor_challenges
ALTER TABLE tutor_challenges DROP CONSTRAINT IF EXISTS valid_tutor_challenges_language;
ALTER TABLE tutor_challenges ADD CONSTRAINT valid_tutor_challenges_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- word_requests
ALTER TABLE word_requests DROP CONSTRAINT IF EXISTS valid_word_requests_language;
ALTER TABLE word_requests ADD CONSTRAINT valid_word_requests_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- listen_sessions
ALTER TABLE listen_sessions DROP CONSTRAINT IF EXISTS valid_listen_sessions_language;
ALTER TABLE listen_sessions ADD CONSTRAINT valid_listen_sessions_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- game_sessions
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS valid_game_sessions_language;
ALTER TABLE game_sessions ADD CONSTRAINT valid_game_sessions_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- gift_words
ALTER TABLE gift_words DROP CONSTRAINT IF EXISTS valid_gift_words_language;
ALTER TABLE gift_words ADD CONSTRAINT valid_gift_words_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- challenge_results
ALTER TABLE challenge_results DROP CONSTRAINT IF EXISTS valid_challenge_results_language;
ALTER TABLE challenge_results ADD CONSTRAINT valid_challenge_results_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- progress_summaries
ALTER TABLE progress_summaries DROP CONSTRAINT IF EXISTS valid_progress_summaries_language;
ALTER TABLE progress_summaries ADD CONSTRAINT valid_progress_summaries_language
  CHECK (language_code IN ('en','es','fr','it','pt','ro','de','nl','sv','no','da','pl','cs','ru','uk','el','hu','tr'));

-- Trigger: Ensure active_language is always in languages array
CREATE OR REPLACE FUNCTION check_active_in_languages()
RETURNS TRIGGER AS $$
BEGIN
  -- If languages array is null or empty, initialize with active_language
  IF NEW.languages IS NULL OR array_length(NEW.languages, 1) IS NULL THEN
    NEW.languages := ARRAY[NEW.active_language];
  -- If active_language not in languages array, add it
  ELSIF NOT (NEW.active_language = ANY(NEW.languages)) THEN
    NEW.languages := array_append(NEW.languages, NEW.active_language);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_active_in_languages ON profiles;
CREATE TRIGGER ensure_active_in_languages
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_active_in_languages();

-- Partial index for "learned words" queries
CREATE INDEX IF NOT EXISTS idx_word_scores_learned
  ON word_scores(user_id, language_code)
  WHERE learned_at IS NOT NULL;

-- Fix any existing data issues (active_language not in languages array)
UPDATE profiles
SET languages = array_append(languages, active_language)
WHERE NOT (active_language = ANY(languages))
  AND languages IS NOT NULL;

UPDATE profiles
SET languages = ARRAY[active_language]
WHERE languages IS NULL;
```

### Verification Checklist

- [ ] Run migration in Supabase SQL editor
- [ ] Test inserting invalid language code (should fail)
- [ ] Test updating active_language not in languages (should auto-add)
- [ ] Verify existing data wasn't broken
- [ ] Check partial index is used for learned words queries

---

## Phase DB-2: Listen Mode Schema Fix

**Priority:** High
**Effort:** Medium (code changes, no schema change needed)
**Risk:** Low (JSONB content is application-level)

### Issue

`listen_sessions.transcript` JSONB currently stores:
```json
{ "polish": "Cześć", "english": "Hello" }
```

Should store:
```json
{ "target": "Cześć", "native": "Hello" }
```

### Files to Modify

| File | Changes |
|------|---------|
| `services/gladia-session.ts` | Change field names in transcript building |
| `components/ChatArea.tsx` | Update transcript rendering to use new fields |
| `api/process-transcript.ts` | Update Gemini prompt for field names |

### Implementation

**1. `services/gladia-session.ts`** - Update transcript entry creation:

```typescript
// Before
const entry = {
  id: crypto.randomUUID(),
  polish: transcript,
  english: translation,
  // ...
};

// After (with backward compatibility)
const entry = {
  id: crypto.randomUUID(),
  target: transcript,      // NEW: language-agnostic
  native: translation,     // NEW: language-agnostic
  polish: transcript,      // DEPRECATED: keep for old sessions
  english: translation,    // DEPRECATED: keep for old sessions
  // ...
};
```

**2. `components/ChatArea.tsx`** - Update rendering with fallback:

```typescript
// Helper for backward compatibility
const getTargetText = (entry: TranscriptEntry) => entry.target || entry.polish || '';
const getNativeText = (entry: TranscriptEntry) => entry.native || entry.english || '';
```

**3. `api/process-transcript.ts`** - Update schema and prompt:

```typescript
// Update output schema
const schema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      target: { type: "string" },   // Was: polish
      native: { type: "string" },   // Was: english
      // ...
    }
  }
};
```

### Verification Checklist

- [ ] Old listen sessions still display correctly
- [ ] New listen sessions use `target`/`native` fields
- [ ] Process transcript returns correct field names
- [ ] Word extraction from Listen Mode works

---

## Phase LS-1: Language Switcher UI Responsiveness

**Priority:** High
**Effort:** Small
**Risk:** Low

### Issue

Switching language in Profile doesn't immediately update other components.

### Files to Modify

| File | Changes |
|------|---------|
| `components/ChatArea.tsx` | Listen for `language-switched` event |
| `components/LoveLog.tsx` | Listen for `language-switched` event |
| `components/Progress.tsx` | Listen for `language-switched` event |
| `components/FlashcardGame.tsx` | Listen for `language-switched` event |
| `context/LanguageContext.tsx` | Dispatch event and refresh context |

### Implementation Pattern

Add to each component:

```typescript
useEffect(() => {
  const handleLanguageSwitch = () => {
    // Re-fetch data for new language
    fetchData();
  };

  window.addEventListener('language-switched', handleLanguageSwitch);
  return () => window.removeEventListener('language-switched', handleLanguageSwitch);
}, []);
```

### Verification Checklist

- [ ] Switch language in Profile
- [ ] Love Log immediately shows new language's words
- [ ] Chat clears or shows new language context
- [ ] Progress shows new language stats
- [ ] Games filter to new language words

---

## Phase LS-2: Navbar Language Access

**Priority:** Medium
**Effort:** Small
**Risk:** Low

### Feature

Add quick-access language switcher to main navbar (only shows if user has multiple languages unlocked).

### Files to Modify

| File | Changes |
|------|---------|
| `components/Navbar.tsx` | Add language dropdown between profile and CTA |

### Implementation

```typescript
// In Navbar.tsx
const { targetLanguage, targetConfig } = useLanguage();
const [languages, setLanguages] = useState<string[]>([]);

// Fetch user's unlocked languages
useEffect(() => {
  // Get from profile
}, []);

// Only show if multiple languages
{languages.length > 1 && (
  <LanguageDropdown
    current={targetLanguage}
    available={languages}
    onSwitch={handleLanguageSwitch}
  />
)}
```

### Verification Checklist

- [ ] Dropdown hidden for single-language users
- [ ] Dropdown shows all unlocked languages with flags
- [ ] Switching updates immediately
- [ ] Current language highlighted

---

## Phase BG-1: Blog Polish Article Migration

**Priority:** Low (backward compatible)
**Effort:** Medium (76 articles)
**Risk:** Very Low

### Issue

76 Polish articles use legacy `polish="..."` and `english="..."` props.

### Approach

Create a migration script to batch-update MDX files:

```bash
# blog/scripts/migrate-article-props.ts
# Converts: polish="X" english="Y" → word="X" translation="Y"
```

### Can Be Deferred

Components already support both old and new props. This is a cleanup task that can be done incrementally or automated later.

---

## Phase ML-9: Premium Multi-Language (Add Language)

**Priority:** Medium
**Effort:** Large
**Depends On:** DB-1

### Features

1. Language picker modal
2. Stripe payment integration (+$5/language/month)
3. API to add language to `profile.languages[]`
4. UI to show locked/unlocked states

### Files to Create/Modify

| File | Type | Purpose |
|------|------|---------|
| `components/AddLanguageModal.tsx` | NEW | Language selection + payment UI |
| `api/add-language.ts` | NEW | Validate and add language |
| `api/webhooks/stripe.ts` | MODIFY | Handle language add-on purchase |
| `components/LanguagesSection.tsx` | MODIFY | Wire up Add Language button |

### Stripe Setup Required

1. Create new product: "Additional Language"
2. Create price: $5/month
3. Add price ID to environment variables:
   - `STRIPE_PRICE_LANGUAGE_ADDON`

### Implementation Notes

```typescript
// api/add-language.ts
export default async function handler(req, res) {
  // 1. Verify user has active subscription
  // 2. Validate language code
  // 3. Check language not already unlocked
  // 4. Create Stripe checkout for add-on
  // 5. On webhook success: UPDATE profiles SET languages = array_append(languages, $1)
}
```

---

## Phase ML-10: Final Testing & Validation

**Priority:** High (final phase)
**Effort:** Medium
**Depends On:** All previous phases

### Test Matrix

| Pair | Native | Target | Script | Why |
|------|--------|--------|--------|-----|
| 1 | English | Polish | Latin | Original, must work perfectly |
| 2 | Spanish | Polish | Latin | Different native language |
| 3 | English | Spanish | Latin | Different target language |
| 4 | Spanish | French | Latin | No English involved |
| 5 | English | Russian | Cyrillic | Different script |
| 6 | English | Greek | Greek | Different script |

### Test Checklist (Per Pair)

- [ ] Onboarding completes
- [ ] Chat responds in native language
- [ ] Vocabulary extracts correctly
- [ ] Love Log filters by language
- [ ] Games filter by language
- [ ] Voice mode works (if supported)
- [ ] Listen mode transcribes correctly
- [ ] Level tests generate in target language
- [ ] Progress tracks per-language
- [ ] Partner features work

### Automated Test Script

Create `scripts/test-language-pair.ts`:

```typescript
// Run through key flows for a language pair
// Report any issues found
```

---

## Implementation Order

```
Week 1:
├── DB-1: Database Integrity (migration)
├── DB-2: Listen Mode Schema Fix
└── LS-1: Language Switcher Responsiveness

Week 2:
├── LS-2: Navbar Language Access
└── ML-10: Testing (pairs 1-3)

Week 3:
├── ML-9: Premium Multi-Language
└── ML-10: Testing (pairs 4-6)

Ongoing (low priority):
└── BG-1: Blog Article Migration
```

---

## Dependencies

```
DB-1 ─────────────────────────────────────────────────────┐
                                                          │
DB-2 ─────────────────────────────────────────────────────┤
                                                          │
LS-1 ─────────────────────────────────────────────────────┼──→ ML-10
                                                          │
LS-2 ─────────────────────────────────────────────────────┤
                                                          │
ML-9 ─────────────────────────────────────────────────────┘

BG-1 (independent, can be done anytime)
```

---

## Success Criteria

| Criterion | Verification |
|-----------|--------------|
| No invalid language codes in DB | Query with non-CHECK values fails |
| active_language always in languages[] | Trigger prevents inconsistency |
| Listen Mode works for any pair | Test Spanish→French session |
| UI updates immediately on switch | No page refresh needed |
| 6 test pairs pass all checks | Full test matrix complete |

---

## Rollback Procedures

### DB-1 Rollback

```sql
-- Remove constraints if issues
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_native_language;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_active_language;
-- etc. for each table
DROP TRIGGER IF EXISTS ensure_active_in_languages ON profiles;
DROP FUNCTION IF EXISTS check_active_in_languages();
```

### Code Rollback

```bash
git revert HEAD~[number]
```

---

*Created: January 12, 2026*
