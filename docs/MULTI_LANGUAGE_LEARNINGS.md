# Multi-Language Implementation: Learnings & Reference

This document captures the learnings from two attempts at adding multi-language support. Use this as a reference when re-approaching the feature on a fresh fork.

---

## Executive Summary

**What was attempted:** Transform the app from English→Polish only to support any language pair (e.g., Spanish→English, Polish→English).

**Why it failed:** Underestimated scope. This is **full internationalization**, not variable substitution.

**Key insight:** Every piece of text exists in one of 6 "layers" that need different handling.

---

## The 6 Content Layers

This was the most important realization. Every string in the app belongs to one of these categories:

### Layer 1: UI Chrome
Buttons, navigation, labels that don't reference language content.

| String | For English User | For Polish User |
|--------|------------------|-----------------|
| "Next" | Next | Dalej |
| "Back" | Wstecz | Wstecz |
| "Settings" | Settings | Ustawienia |

**Implementation:** Standard i18n translation files.

### Layer 2: Instructional Text
Text that tells the user what to do. Must be in their **native** language.

| Context | English Native | Polish Native |
|---------|---------------|---------------|
| "Type the Polish word" | Type the Polish word | Wpisz polskie słowo |

**Implementation:** i18n with interpolation for language names.

### Layer 3: Target Language Content
The actual words/phrases being taught. Always in the **target** language.

| Learning Polish | Learning English |
|----------------|------------------|
| **Cześć** | **Hello** |
| **Kocham cię** | **I love you** |

**Implementation:** Database + language config files.

### Layer 4: Translations of Target Content
Explanations shown in the user's **native** language.

| Target Word | For English Native | For Polish Native |
|-------------|-------------------|-------------------|
| Cześć | (Hello) | - |
| Hello | - | (Cześć) |

**Implementation:** Database + config files.

### Layer 5: Grammar Explanations
Language-specific grammar that only applies to certain targets.

| Polish-specific | English-specific |
|-----------------|------------------|
| "7 grammatical cases" | "Articles: a, an, the" |
| "Verb conjugations" | "Simple verb forms" |

**Implementation:** Conditional rendering + i18n.

### Layer 6: AI System Prompts
Instructions to Gemini about how to teach.

**Implementation:** Dynamic prompt generation based on language pair.

---

## Attempt 1: Variable Renaming (Stash 0)

### What Was Done
Small preparatory refactoring in 3 files:
- `FlashcardGame.tsx`
- `romantic-phrases.ts`
- `types.ts`

### Changes Made
```typescript
// Before
type TypeItDirection = 'polish_to_english' | 'english_to_polish';
interface ChallengeQuestion {
  polish: string;
  english: string;
}

// After
type TypeItDirection = 'target_to_native' | 'native_to_target';
interface ChallengeQuestion {
  targetWord: string;   // Word user is learning
  nativeWord: string;   // Word user already knows
}
```

### Functions Added
```typescript
// romantic-phrases.ts
getRomanticPhrasesForPair(languagePair: string)  // Get phrases for any pair
hasRomanticPhrases(languagePair: string)         // Check if phrases exist
```

### Why It Stopped
Realized this approach (just renaming variables) wouldn't handle the UI text translations. The real work is translating 800+ UI strings.

### Useful Parts to Keep
- The `targetWord`/`nativeWord` naming convention is cleaner
- The `getRomanticPhrasesForPair()` function pattern is good

---

## Attempt 2: Full i18n Implementation (Stash 1)

### What Was Done
Comprehensive implementation across 13 files:
- Added `useUIStrings()` hook with `t()` function
- Replaced ~200 hardcoded strings with `t('key')` calls
- Extended language config system
- Created extensive string definitions

### Files Modified
| File | Changes |
|------|---------|
| `components/ChatArea.tsx` | 107 string replacements |
| `components/Progress.tsx` | 116 string replacements |
| `components/TutorGames.tsx` | 147 string replacements |
| `components/ProfileView.tsx` | 110 string replacements |
| `components/LoveLog.tsx` | 100 string replacements |
| `components/FlashcardGame.tsx` | 19 string replacements |
| `i18n/strings.ts` | 1269 lines of string definitions |
| `config/languages/index.ts` | 291+ lines of config |

### The Hook Pattern Used
```typescript
// hooks/useLanguagePair.ts
export function useUIStrings() {
  const { nativeCode } = useLanguagePair();

  const t = (key: string, params?: Record<string, string>) => {
    let str = strings[nativeCode]?.[key] || strings['en'][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  return { t };
}
```

### Usage Pattern
```tsx
const { t } = useUIStrings();

// Simple
<button>{t('buttons.next')}</button>

// With interpolation
<h1>{t('onboarding.learnFor', { language: targetName, partner: partnerName })}</h1>

// Pluralization (manual)
{count !== 1
  ? t('chat.phrasesBookmarkedPlural', { count })
  : t('chat.phrasesBookmarked', { count })}
```

### String Structure
```typescript
// i18n/strings.ts
const strings = {
  en: {
    'buttons.next': 'Next',
    'buttons.back': 'Back',
    'chat.newSession': 'New Session',
    'chat.deleteSessionConfirm': 'Are you sure you want to delete this session?',
    'onboarding.learnFor': 'Learn {language} for {partner}',
    // ... 800+ more
  },
  pl: {
    'buttons.next': 'Dalej',
    'buttons.back': 'Wstecz',
    'chat.newSession': 'Nowa sesja',
    // ... translations
  }
};
```

### Why It Wasn't Completed
1. **Scale**: 800+ strings across 50+ components
2. **Testing Complexity**: Every language pair needs full flow testing
3. **Grammar Issues**: Polish grammatical cases for interpolated language names
4. **Content Gap**: Need actual vocabulary/phrases for each target language
5. **AI Prompts**: All system prompts need language-aware variants

### Useful Parts to Keep
- The `t()` function pattern is clean and works
- String key naming convention (`component.action`)
- The layer categorization framework

---

## The i18n Generator Scripts

Located in `scripts/i18n-generator/`:

### What They Do
1. **extract-strings.ts**: Parses TSX files, extracts all translatable text
2. **translate.ts**: Calls Gemini API to translate batches of strings
3. **add-language.ts**: Orchestrates the full workflow

### The Vision
```bash
# Adding a new language would be:
npm run i18n:add-language -- --lang=de --name=German

# This would:
# 1. Extract all 800+ strings from codebase
# 2. Call Gemini to translate them
# 3. Generate i18n/locales/de/*.json
# 4. Create review file flagging uncertain translations
# Cost: ~$0.05-0.10 per language
```

### Useful Patterns

**String Categorization:**
```json
{
  "id": "btn_next_001",
  "original": "Next",
  "file": "components/OnboardingStep.tsx",
  "type": "button",
  "layer": 1,
  "interpolations": []
}
```

**Confidence-Based Review:**
- High confidence (95%+): Auto-approve
- Medium (70-95%): Flag for context check
- Low (<70%): Require human review

---

## Database Changes Explored

### Test Accounts Migration
Created `migrations/021_test_accounts.sql` with:
- 6 test accounts for different language pairs
- Sample vocabulary per pair
- Fixed UUIDs for easy reference

**Test Accounts Created:**
| Email | Language Pair | Role |
|-------|---------------|------|
| test-polish-student@lovelanguages.test | en→pl | Student |
| test-polish-tutor@lovelanguages.test | en→pl | Tutor |
| test-spanish-student@lovelanguages.test | en→es | Student |
| test-spanish-tutor@lovelanguages.test | en→es | Tutor |
| test-spanish-reverse@lovelanguages.test | es→en | Student |
| test-solo@lovelanguages.test | en→pl | Solo |

Password: `TestLove123!`

### Cleanup SQL
```sql
-- Delete all test accounts
DELETE FROM dictionary WHERE user_id IN (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'aaaaaaaa-0003-0003-0003-000000000003',
  'aaaaaaaa-0004-0004-0004-000000000004',
  'aaaaaaaa-0005-0005-0005-000000000005',
  'aaaaaaaa-0006-0006-0006-000000000006'
);
DELETE FROM profiles WHERE id IN (...same IDs...);
DELETE FROM auth.users WHERE id IN (...same IDs...);
DELETE FROM auth.identities WHERE user_id IN (...same IDs...);
```

---

## Recommendations for Next Attempt

### 1. Use react-i18next (Not Custom)
The custom `t()` function works but lacks:
- Pluralization rules per language
- Namespace support
- Language detection
- Dev tooling

```bash
npm install react-i18next i18next
```

### 2. Phased Rollout
Don't try to do it all at once:

**Phase 1: Infrastructure**
- Set up react-i18next
- Create English locale files (baseline)
- Test that existing app works unchanged

**Phase 2: Component Migration (One at a Time)**
- Start with smallest components
- Add `useTranslation()` hook
- Replace hardcoded strings
- Test thoroughly before moving on

**Phase 3: First New Language**
- Use the i18n-generator scripts
- Get Polish translations
- Test full flow with pl_en user

### 3. Handle Grammar Properly
Polish (and other languages) have grammatical cases that affect word forms:

```typescript
// "Learn Polish" uses genitive case
"Ucz się polskiego"  // ✓ polskiego (genitive)
"Ucz się polski"     // ✗ polski (nominative)

// This needs special handling per language
const languageInGenitive = {
  pl: { polish: 'polskiego', english: 'angielskiego' },
  // etc
};
```

### 4. Content Strategy
For each new target language, you need:
- [ ] Romantic phrases collection (currently ~50 for Polish)
- [ ] Sample vocabulary
- [ ] Conversation scenarios (currently 8 for Polish)
- [ ] Grammar tips specific to that language

### 5. AI Prompt Templates
Create a prompt template system:
```typescript
function buildChatPrompt(languagePair: LanguagePair) {
  const { native, target } = getLanguageConfig(languagePair);
  return `You are teaching ${target.name} to a ${native.name} speaker...`;
}
```

---

## Files Reference

### Keep These (Useful Reference)
- `MULTI_LANGUAGE_IMPLEMENTATION_PLAN.md` - Comprehensive planning doc
- `scripts/i18n-generator/` - Automation scripts
- `migrations/021_test_accounts.sql` - Test account setup (don't run, just reference)

### Git Stashes (Can Be Dropped After Review)
- `stash@{0}`: Small refactoring (variable renames)
- `stash@{1}`: Full i18n implementation attempt

### Current State
The `main` branch is clean with English→Polish only. No multi-language code has been merged.

---

## Cost Estimates

| Item | Cost |
|------|------|
| Translating 850 strings to one language | ~$0.05-0.10 |
| Professional translator review (if needed) | ~$200-500/language |
| Development time (proper implementation) | 40-80 hours |

---

## Summary

The multi-language feature is achievable but requires:
1. **Proper i18n library** (react-i18next)
2. **Phased approach** (not big bang)
3. **Content creation** for each target language
4. **Grammar handling** for complex languages
5. **Thorough testing** of every language pair

The groundwork laid in the stashes provides useful patterns, but the implementation needs to be more methodical on a fresh fork.
