# Multi-Language Transformation Plan

> **Central Source of Truth** for transforming Love Languages from Polish-only to a multi-language learning platform.

## Vision

Transform the app into a truly language-agnostic platform supporting 18 curated languages while maintaining the romantic couples-focused brand. Any language can be your native language OR your target language. Multi-language access is a premium feature.

---

## Core Decisions

| Decision | Choice |
|----------|--------|
| Language pairs | **Any of 18 languages → Any of 18 languages** (306 possible pairs) |
| Native language | User's mother tongue - AI explains in this language |
| Target language | Language user is learning - words shown with native translations |
| Target audience | Couples only (keep Love Languages brand) |
| Grammar model | Language-specific schemas (most flexible) |
| Curriculum | None - app is partner-driven, not curriculum-driven |
| AI persona | "Cupid" globally (same persona, speaks user's native language) |
| Onboarding | Generic "connection to [Language]" questions |
| Scenarios | Universal (8 scenarios adapted culturally per language) |
| Multi-language | Premium feature - costs extra to add languages |

---

## Supported Languages (18 Total)

### Tier 0 - Global
- **English (en)** - Can be native OR target language

### Tier 1 - Romance Languages
- Spanish (es)
- French (fr)
- Italian (it)
- Portuguese (pt)
- Romanian (ro)

### Tier 2 - Germanic Languages
- German (de)
- Dutch (nl)
- Swedish (sv)
- Norwegian (no)
- Danish (da)

### Tier 3 - Slavic Languages
- Polish (pl)
- Czech (cs)
- Russian (ru)
- Ukrainian (uk)

### Tier 4 - Other European
- Greek (el)
- Hungarian (hu)
- Turkish (tr)

> **Key Principle:** Any language can be NATIVE or TARGET. A Spanish speaker learning Polish sees `Cześć (Hola)`. An English speaker learning Polish sees `Cześć (Hello)`.

---

## Database Architecture

### User Profile Changes (`profiles` table)

```sql
-- New columns
active_language VARCHAR(5) NOT NULL DEFAULT 'pl',  -- Current learning language
languages TEXT[] DEFAULT ARRAY['pl'],              -- All unlocked languages
native_language VARCHAR(5) DEFAULT 'en'            -- For AI context
```

### Data Table Changes

All user-specific data tables need `language_code`:

```sql
-- dictionary table
ALTER TABLE dictionary ADD COLUMN language_code VARCHAR(5) NOT NULL DEFAULT 'pl';
CREATE INDEX idx_dictionary_language ON dictionary(user_id, language_code);

-- word_scores table
ALTER TABLE word_scores ADD COLUMN language_code VARCHAR(5) NOT NULL DEFAULT 'pl';

-- listen_sessions table
ALTER TABLE listen_sessions ADD COLUMN source_language VARCHAR(5) DEFAULT 'pl';
ALTER TABLE listen_sessions ADD COLUMN target_language VARCHAR(5) DEFAULT 'en';

-- chats table
ALTER TABLE chats ADD COLUMN language_code VARCHAR(5) NOT NULL DEFAULT 'pl';

-- tutor_challenges table
ALTER TABLE tutor_challenges ADD COLUMN language_code VARCHAR(5) NOT NULL DEFAULT 'pl';

-- word_requests table
ALTER TABLE word_requests ADD COLUMN language_code VARCHAR(5) NOT NULL DEFAULT 'pl';
```

### Migration Strategy
1. Add columns with default 'pl' (backward compatible)
2. Existing users auto-assigned Polish
3. New users choose language during onboarding
4. Premium users can add additional languages

---

## Language Configuration System

### New File: `constants/language-config.ts`

```typescript
export interface LanguageConfig {
  code: string;                    // ISO 639-1 code (e.g., 'pl', 'es')
  name: string;                    // Display name (e.g., 'Polish', 'Spanish')
  nativeName: string;              // Name in that language (e.g., 'Polski', 'Español')
  flag: string;                    // Emoji flag

  // Grammar features (what this language HAS)
  grammar: {
    hasGender: boolean;            // Noun gender (Polish: yes, English: no)
    genderTypes?: ('masculine' | 'feminine' | 'neuter')[];
    hasConjugation: boolean;       // Verb conjugation by person
    conjugationPersons?: string[]; // e.g., ['ja', 'ty', 'on/ona', 'my', 'wy', 'oni']
    hasCases: boolean;             // Noun declension (Polish: 7 cases)
    hasArticles: boolean;          // a/the (English), el/la (Spanish)
    hasTones: boolean;             // Mandarin, Vietnamese
    writingSystem: 'latin' | 'cyrillic' | 'greek' | 'other';
  };

  // Diacritic/special characters
  specialChars: string[];          // e.g., ['ą', 'ę', 'ć', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']

  // TTS configuration
  tts: {
    voiceCode: string;             // e.g., 'pl-PL-Standard-A'
    langCode: string;              // e.g., 'pl-PL'
  };

  // Gladia language codes
  transcription: {
    gladiaCode: string;            // e.g., 'pl'
    supported: boolean;            // Is transcription available?
  };

  // Gemini Live language support
  voiceMode: {
    supported: boolean;
    modelLangCode?: string;
  };
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    grammar: {
      hasGender: false,
      genderTypes: [],
      hasConjugation: true,
      conjugationPersons: ['I', 'you', 'he/she/it', 'we', 'you', 'they'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: [],  // No special diacritics
    tts: { voiceCode: 'en-US-Standard-A', langCode: 'en-US' },
    transcription: { gladiaCode: 'en', supported: true },
    voiceMode: { supported: true },
  },
  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['ja', 'ty', 'on/ona', 'my', 'wy', 'oni'],
      hasCases: true,
      hasArticles: false,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['ą', 'ę', 'ć', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],
    tts: { voiceCode: 'pl-PL-Standard-A', langCode: 'pl-PL' },
    transcription: { gladiaCode: 'pl', supported: true },
    voiceMode: { supported: true },
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasConjugation: true,
      conjugationPersons: ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'],
    tts: { voiceCode: 'es-ES-Standard-A', langCode: 'es-ES' },
    transcription: { gladiaCode: 'es', supported: true },
    voiceMode: { supported: true },
  },
  // ... more languages
};
```

---

## Type System Changes

### `types.ts` Refactoring

```typescript
// OLD: Polish-specific
export interface RomanticPhrase {
  polish: string;
  english: string;
}

// NEW: Language-agnostic
export interface RomanticPhrase {
  word: string;                 // Word in target language
  translation: string;          // Translation in native language
  targetLanguageCode: string;   // e.g., 'pl' for Polish
  nativeLanguageCode: string;   // e.g., 'es' for Spanish speaker
}

// OLD: Polish-specific onboarding
export interface OnboardingData {
  polishConnection?: string;
  polishOrigin?: string;
  familyPolishFrequency?: string;
}

// NEW: Language-agnostic onboarding
export interface OnboardingData {
  languageConnection?: string;    // "What's your connection to [Language]?"
  languageOrigin?: string;        // "How did you learn [Language]?"
  familyLanguageFrequency?: string;
}

// OLD: Polish-specific direction
type TypeItDirection = 'polish_to_english' | 'english_to_polish';

// NEW: Generic direction
type TranslationDirection = 'target_to_native' | 'native_to_target';
// OR use explicit codes: 'pl_to_en' | 'en_to_pl' | 'es_to_en' | 'en_to_es'

// NEW: Language-aware profile
export interface Profile {
  // ... existing fields
  active_language: string;        // Current learning language code
  languages: string[];            // All unlocked language codes
  native_language: string;        // User's native language
}
```

### Grammar Schema Per Language

Instead of one global `VerbConjugations` interface, use language-specific schemas:

```typescript
// Base interface - all languages have this
export interface BaseWordContext {
  original: string;
  examples: string[];
  root: string;
  proTip: string;
  pronunciation: string;
}

// Polish-specific extensions
export interface PolishWordContext extends BaseWordContext {
  conjugations?: PolishVerbConjugations;
  gender?: 'masculine' | 'feminine' | 'neuter';
  plural?: string;
  adjectiveForms?: PolishAdjectiveForms;
}

// Spanish-specific extensions
export interface SpanishWordContext extends BaseWordContext {
  conjugations?: SpanishVerbConjugations;
  gender?: 'masculine' | 'feminine';
  plural?: string;
  subjunctive?: SpanishSubjunctive;
}

// Russian-specific extensions
export interface RussianWordContext extends BaseWordContext {
  conjugations?: RussianVerbConjugations;
  gender?: 'masculine' | 'feminine' | 'neuter';
  cases?: RussianCases;  // 6 grammatical cases
  aspect?: 'perfective' | 'imperfective';
}

// Union type for storage
export type WordContext =
  | PolishWordContext
  | SpanishWordContext
  | RussianWordContext
  // ... etc
```

---

## AI Prompt Template System

### New File: `utils/prompt-templates.ts`

```typescript
import { LANGUAGE_CONFIGS } from '../constants/language-config';

export function buildCupidSystemPrompt(
  targetLanguageCode: string,
  nativeLanguageCode: string,
  mode: 'ask' | 'learn' | 'coach'
): string {
  const target = LANGUAGE_CONFIGS[targetLanguageCode];
  const native = LANGUAGE_CONFIGS[nativeLanguageCode];

  return `You are "Cupid" - a warm, encouraging language companion for couples learning together.

## Core Rules
1. You are teaching ${target.name} (${target.nativeName}) to a ${native.name} speaker
2. RESPOND IN ${native.name.toUpperCase()} - all explanations must be in ${native.name}
3. Every ${target.name} word MUST have ${native.name} translation: "${getExampleWord(targetLanguageCode)} (${getExampleTranslation(targetLanguageCode, nativeLanguageCode)})"
4. Use **asterisks** for ${target.name} words
5. Be warm, romantic, encouraging - this is for couples!

## ${target.name}-Specific Notes
${buildLanguageSpecificNotes(targetLanguageCode)}

## Grammar Focus
${buildGrammarGuidance(targetLanguageCode, nativeLanguageCode)}
`;
}

function buildLanguageSpecificNotes(code: string): string {
  const notes: Record<string, string> = {
    pl: `- Polish has 7 grammatical cases - introduce gradually
- Highlight special characters: ${LANGUAGE_CONFIGS.pl.specialChars.join(', ')}
- Verb conjugation changes by person (ja, ty, on/ona, my, wy, oni)`,
    es: `- Spanish has gendered nouns (el/la) - always mention gender
- Highlight special characters: ${LANGUAGE_CONFIGS.es.specialChars.join(', ')}
- Distinguish between ser/estar (to be)
- Verb conjugation: yo, tú, él/ella, nosotros, vosotros, ellos`,
    fr: `- French has gendered nouns (le/la) - always mention gender
- Liaison and elision are important for pronunciation
- Verb groups: -er, -ir, -re patterns`,
    // ... more languages
  };
  return notes[code] || 'Follow standard language teaching practices.';
}

export function buildValidationPrompt(languageCode: string): string {
  const lang = LANGUAGE_CONFIGS[languageCode];

  return `You are validating answers for a ${lang.name} language learning app.

Accept as correct if:
1. Exact match (case-insensitive)
2. Missing diacritics: ${lang.specialChars.join(', ')} → base letters
3. Valid synonym in context
4. Minor typo (1-2 characters)

${lang.name}-specific rules:
${buildValidationRules(languageCode)}
`;
}
```

---

## Component Changes

### Direction/Mode Refactoring

```typescript
// FlashcardGame.tsx - OLD
type TypeItDirection = 'polish_to_english' | 'english_to_polish';

// FlashcardGame.tsx - NEW
type TranslationDirection = 'target_to_native' | 'native_to_target';

// Usage with language context
interface GameProps {
  targetLanguageCode: string;
  nativeLanguageCode: string;
  direction: TranslationDirection;
}

// Display logic
const getDirectionLabel = (
  direction: TranslationDirection,
  targetCode: string,
  nativeCode: string
) => {
  const target = LANGUAGE_CONFIGS[targetCode];
  const native = LANGUAGE_CONFIGS[nativeCode];
  return direction === 'target_to_native'
    ? `${target.name} → ${native.name}`   // e.g., "Polish → Spanish"
    : `${native.name} → ${target.name}`;  // e.g., "Spanish → Polish"
};
```

### Onboarding Refactoring

```typescript
// PolishConnectionStep.tsx → LanguageConnectionStep.tsx
interface Props {
  languageCode: string;
}

const LanguageConnectionStep = ({ languageCode }: Props) => {
  const lang = LANGUAGE_CONFIGS[languageCode];

  return (
    <div>
      <h2>What's your connection to {lang.name}?</h2>
      <select>
        <option>Native speaker</option>
        <option>Heritage speaker</option>
        <option>Fluent speaker</option>
        <option>My partner speaks {lang.name}</option>
      </select>
    </div>
  );
};
```

---

## Conversation Scenarios

### Universal Scenarios (Adapted Per Language)

The 8 scenarios remain universal but with cultural adaptation:

```typescript
// constants/conversation-scenarios.ts

export interface ScenarioConfig {
  id: string;
  icon: string;
  nameKey: string;           // Localization key
  universalContext: string;  // Base scenario description
  culturalAdaptations: Record<string, CulturalAdaptation>;
}

interface CulturalAdaptation {
  locationName: string;      // "Warsaw Cafe" → "Madrid Café"
  personaName: string;       // "Ania" → "María"
  culturalNotes: string;     // Country-specific customs
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'cafe',
    icon: '☕',
    nameKey: 'scenario.cafe',
    universalContext: 'Ordering coffee and pastries at a local café',
    culturalAdaptations: {
      pl: {
        locationName: 'Warsaw Café',
        personaName: 'Ania',
        culturalNotes: 'Polish cafés often serve szarlotka (apple pie) and sernik (cheesecake)',
      },
      es: {
        locationName: 'Madrid Café',
        personaName: 'María',
        culturalNotes: 'Spanish cafés serve café con leche and churros, especially for breakfast',
      },
      fr: {
        locationName: 'Paris Café',
        personaName: 'Marie',
        culturalNotes: 'French cafés have terrace seating, order un café (espresso) or un crème',
      },
      // ... more languages
    },
  },
  // ... 7 more scenarios
];
```

---

## API Endpoint Changes

### Pattern: Language from Request or User Profile

```typescript
// api/chat.ts - Example pattern

import { LANGUAGE_CONFIGS } from '../constants/language-config';
import { buildCupidSystemPrompt } from '../utils/prompt-templates';

export default async function handler(req, res) {
  // Get language from request body or default from profile
  const languageCode = req.body.languageCode || 'pl';
  const lang = LANGUAGE_CONFIGS[languageCode];

  if (!lang) {
    return res.status(400).json({ error: `Unsupported language: ${languageCode}` });
  }

  const systemPrompt = buildCupidSystemPrompt(languageCode, req.body.mode);

  // ... rest of handler
}
```

### Endpoints Requiring Language Parameter

| Endpoint | Change Required |
|----------|----------------|
| `/api/chat` | Add `languageCode` param, use prompt templates |
| `/api/chat-stream` | Same as above |
| `/api/live-token` | Build language-specific voice instructions |
| `/api/gladia-token` | Use language config for codes |
| `/api/validate-word` | Use language-specific validation rules |
| `/api/validate-answer` | Language-aware diacritic/synonym handling |
| `/api/analyze-history` | Extract vocab for specified language |
| `/api/polish-transcript` | Rename to `/api/process-transcript` |
| `/api/generate-level-test` | Use language-specific examples |
| `/api/tts` | Use language config for voice |
| `/api/create-challenge` | Store language_code with challenge |
| `/api/create-word-request` | Store language_code |

---

## Pricing Model

### Subscription Tiers (Updated)

| Plan | Languages | Price |
|------|-----------|-------|
| Standard | 1 language | $19/month or $69/year |
| Unlimited | 1 language + gift pass | $39/month or $139/year |
| **Multi-Language Add-on** | +$5/language/month | Additional languages |

### Database Changes for Multi-Language Pricing

```sql
-- New table for language purchases
CREATE TABLE user_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50), -- 'subscription', 'gift', 'promo'
  UNIQUE(user_id, language_code)
);
```

---

## Migration Phases

### Phase 1: Foundation (No User Impact)
- [ ] Create `constants/language-config.ts` with all 18 languages
- [ ] Create `utils/prompt-templates.ts` with template functions
- [ ] Add database columns (with 'pl' defaults)
- [ ] Create `user_languages` table

### Phase 2: Backend Refactoring
- [ ] Update all API endpoints to accept `languageCode`
- [ ] Refactor AI prompts to use templates
- [ ] Update validation logic per language
- [ ] Rename `/api/polish-transcript` → `/api/process-transcript`

### Phase 3: Type System
- [ ] Refactor `types.ts` field names (polish → word)
- [ ] Add language-specific grammar interfaces
- [ ] Update `OnboardingData` to be generic

### Phase 4: Frontend Components
- [ ] Add language selector to onboarding
- [ ] Refactor `FlashcardGame.tsx` direction enums
- [ ] Update all UI copy to use language config
- [ ] Refactor onboarding steps to be language-agnostic

### Phase 5: Scenarios & Content
- [ ] Update conversation scenarios with cultural adaptations
- [ ] Create romantic phrases for each language
- [ ] Localize level test examples per language

### Phase 6: Premium Multi-Language
- [ ] Implement language switcher in settings
- [ ] Add multi-language purchase flow
- [ ] Track per-language progress separately
- [ ] Build language selection UI

---

## File Inventory

### Files to Create
- `constants/language-config.ts` - Language definitions
- `utils/prompt-templates.ts` - AI prompt builders
- `migrations/XXX_add_language_support.sql` - Database changes

### Files to Heavily Modify
- `types.ts` - Field names, new interfaces
- `api/chat.ts` - Prompt templating
- `api/chat-stream.ts` - Prompt templating
- `api/live-token.ts` - Language-aware voice mode
- `api/validate-word.ts` - Language-specific validation
- `api/validate-answer.ts` - Diacritic rules per language
- `components/FlashcardGame.tsx` - Direction enums, UI
- `components/ChatArea.tsx` - Language flags, transcript handling
- `constants/conversation-scenarios.ts` - Cultural adaptations

### Files to Rename
- `api/polish-transcript.ts` → `api/process-transcript.ts`
- `components/onboarding/steps/tutor/PolishConnectionStep.tsx` → `LanguageConnectionStep.tsx`
- `services/audio.ts` - `speakPolish()` → `speak()` with language param

### Files with Minor Changes
- All other API endpoints (add languageCode param)
- UI components (swap "Polish" text with language name)
- Constants files (parameterize)

---

## Open Questions

1. **Gladia/Voice Support** - Not all languages may be supported by Gladia/Gemini Live. Need to verify per-language support and handle gracefully.

2. **Grammar Complexity** - Some languages (Japanese, Korean, Arabic) have very different grammar structures. Start with European languages that share similar patterns?

3. **Right-to-Left Languages** - Arabic, Hebrew would need RTL UI support. Include in initial 15 or defer?

4. **Character Sets** - Cyrillic (Russian, Ukrainian) and Greek need special keyboard input handling.

5. **Romanization** - Should we show romanized versions for non-Latin scripts? (e.g., Russian: Привет → Privet)

---

## Success Metrics

- [ ] All 18 languages configurable and selectable (including English)
- [ ] Any native → target language pair works correctly
- [ ] AI responds in the user's native language (not always English)
- [ ] Translations display in user's native language
- [ ] Existing Polish users unaffected (default: native=en, target=pl)
- [ ] New users choose both native AND target language during onboarding
- [ ] Premium users can add multiple target languages
- [ ] Validation works with language-specific diacritics
- [ ] Conversation scenarios adapt to target language culture
- [ ] Per-language progress tracking works correctly

---

*Last updated: 2025-01-10*
*Document owner: Development Team*
