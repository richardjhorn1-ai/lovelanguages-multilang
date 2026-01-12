# Multi-Language Implementation Plan

> **THE COMPLETE ROADMAP** - Every file, every change, every line of code.
> This document must be understood and approved before any code is written.

**Created:** January 10, 2026
**Status:** PLANNING - Awaiting approval
**Estimated Files:** 70+ files to modify/create
**Estimated Phases:** 16 phases

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem: Complete Polish Hardcoding Audit](#the-problem-complete-polish-hardcoding-audit)
3. [Architecture Decisions](#architecture-decisions)
4. [Phase Overview](#phase-overview)
5. [Phase ML-1: Foundation Files](#phase-ml-1-foundation-files)
6. [Phase ML-2: Database Migration](#phase-ml-2-database-migration)
7. [Phase ML-3: Type System Overhaul](#phase-ml-3-type-system-overhaul)
8. [Phase ML-4: API Middleware & Utilities](#phase-ml-4-api-middleware--utilities)
9. [Phase ML-5: Chat API Endpoints](#phase-ml-5-chat-api-endpoints)
10. [Phase ML-6: Vocabulary API Endpoints](#phase-ml-6-vocabulary-api-endpoints)
11. [Phase ML-7: Voice & Transcription APIs](#phase-ml-7-voice--transcription-apis)
12. [Phase ML-8: Game & Challenge APIs](#phase-ml-8-game--challenge-apis)
13. [Phase ML-9: Frontend Core Components](#phase-ml-9-frontend-core-components)
14. [Phase ML-10: Frontend Game Components](#phase-ml-10-frontend-game-components)
15. [Phase ML-11: Onboarding Flow](#phase-ml-11-onboarding-flow)
16. [Phase ML-12: Blog Generator System](#phase-ml-12-blog-generator-system)
17. [Phase ML-13: Content & Scenarios](#phase-ml-13-content--scenarios)
18. [Phase ML-14: Settings & Language Switcher](#phase-ml-14-settings--language-switcher)
19. [Phase ML-15: Premium Multi-Language](#phase-ml-15-premium-multi-language)
20. [Phase ML-16: Testing & Validation](#phase-ml-16-testing--validation)
21. [Rollback Procedures](#rollback-procedures)
22. [Success Criteria](#success-criteria)

---

## Executive Summary

### What We're Building

Transform Love Languages from a **Polish-only** app into a **language-agnostic** platform supporting **18 languages** where:

- Any language can be the user's **native** language (AI explains in this)
- Any language can be the user's **target** language (what they're learning)
- This creates **306 possible language pairs** (18 × 17)

### Supported Languages

| Tier | Languages |
|------|-----------|
| **Global** | English (en) |
| **Romance** | Spanish (es), French (fr), Italian (it), Portuguese (pt), Romanian (ro) |
| **Germanic** | German (de), Dutch (nl), Swedish (sv), Norwegian (no), Danish (da) |
| **Slavic** | Polish (pl), Czech (cs), Russian (ru), Ukrainian (uk) |
| **Other** | Greek (el), Hungarian (hu), Turkish (tr) |

### Why This Is Hard

| Challenge | Affected Files | Complexity |
|-----------|---------------|------------|
| 26+ API endpoints need language params | `/api/*.ts` | High |
| AI prompts hardcode Polish examples | 8+ prompt locations | High |
| Blog generator is Polish-only | 6+ blog files | High |
| Component props use `polish`/`english` | 15+ components | Medium |
| Type definitions use Polish field names | `types.ts` + imports | Medium |
| Onboarding asks Polish-specific questions | 4+ onboarding files | Medium |
| Database has no language column | 7 tables | Medium |
| Voice services hardcode Polish | 4 service files | High |

---

## The Problem: Complete Polish Hardcoding Audit

This section documents **every single location** where Polish is hardcoded. Nothing can be missed.

### API Endpoints (26 files)

| File | Line(s) | Hardcoded Content |
|------|---------|-------------------|
| `api/chat.ts` | ~50-100 | System prompt mentions "Polish language companion" |
| `api/chat-stream.ts` | ~40-80 | Same Polish system prompt |
| `api/live-token.ts` | ~30-60 | Voice mode instructions mention Polish |
| `api/gladia-token.ts` | ~25 | `source_language: 'polish'` |
| `api/polish-transcript.ts` | filename | Entire file is Polish-specific |
| `api/validate-word.ts` | ~40-70 | Validation prompt mentions Polish |
| `api/validate-answer.ts` | ~30-50 | Polish diacritic handling |
| `api/analyze-history.ts` | ~60-100 | Vocabulary extraction prompt |
| `api/generate-level-test.ts` | ~50-90 | Test generation mentions Polish |
| `api/submit-level-test.ts` | ~40 | Polish validation |
| `api/tts.ts` | ~20 | `languageCode: 'pl-PL'` |
| `api/create-challenge.ts` | ~30 | No language param |
| `api/submit-challenge.ts` | ~40 | Polish validation |
| `api/create-word-request.ts` | ~25 | No language param |
| `api/complete-word-request.ts` | ~50-80 | Polish enrichment prompt |

### Frontend Components (20+ files)

| File | Line(s) | Hardcoded Content |
|------|---------|-------------------|
| `components/ChatArea.tsx` | ~200+ | Polish flag emoji, "Polish" in UI text |
| `components/LoveLog.tsx` | ~150 | No language filtering |
| `components/FlashcardGame.tsx` | ~100-300 | `TypeItDirection = 'polish_to_english'` |
| `components/ConversationPractice.tsx` | ~80 | Polish scenarios |
| `components/Progress.tsx` | ~50 | Polish level names |
| `components/LevelTest.tsx` | ~40 | Polish test content |
| `components/CreateQuizChallenge.tsx` | ~60 | Polish validation |
| `components/CreateQuickFireChallenge.tsx` | ~55 | Polish validation |
| `components/WordRequestCreator.tsx` | ~70 | Polish validation |
| `components/Hero.tsx` | ~30-50 | "Learn Polish" marketing copy |
| `components/RoleSelection.tsx` | ~40 | Polish-specific copy |
| `components/blog/MDXComponents.tsx` | ~175-236 | `VocabCard` uses `polish` prop, CultureTip has 🇵🇱 |
| `components/blog/ArticleCard.tsx` | ~40 | Polish category icon |

### Onboarding (5 files)

| File | Line(s) | Hardcoded Content |
|------|---------|-------------------|
| `components/onboarding/steps/tutor/PolishConnectionStep.tsx` | filename + all | "Polish connection" questions |
| `components/onboarding/steps/student/WhyStep.tsx` | ~30-50 | Polish motivation questions |
| `components/onboarding/StudentOnboarding.tsx` | ~20 | Polish onboarding flow |
| `components/onboarding/TutorOnboarding.tsx` | ~20 | Polish onboarding flow |

### Services (4 files)

| File | Line(s) | Hardcoded Content |
|------|---------|-------------------|
| `services/audio.ts` | ~20-40 | `speakPolish()` function name, Polish voice code |
| `services/live-session.ts` | ~50-100 | Polish voice instructions |
| `services/gladia-session.ts` | ~30 | Polish transcription config |
| `services/validation.ts` | ~15-30 | Polish diacritic array |

### Constants (5 files)

| File | Line(s) | Hardcoded Content |
|------|---------|-------------------|
| `constants/conversation-scenarios.ts` | all | Polish persona names, Warsaw locations |
| `constants/romantic-phrases.ts` | all | Polish phrases only |
| `constants/levels.ts` | ~50-80 | Polish example words |
| `constants/icons.tsx` | ~100 | Polish flag usage |
| `constants/colors.ts` | - | (no Polish content) |

### Types (1 file, many occurrences)

| Location in `types.ts` | Hardcoded Content |
|------------------------|-------------------|
| `RomanticPhrase` interface | `polish: string; english: string;` |
| `OnboardingData` interface | `polishConnection`, `polishOrigin`, `familyPolishFrequency` |
| `TypeItDirection` type | `'polish_to_english' \| 'english_to_polish'` |
| `WordContext` interfaces | Polish-specific grammar fields |

### Blog Generator (6 files)

| File | Line(s) | Hardcoded Content |
|------|---------|-------------------|
| `utils/article-generator.ts` | 133-235 | SYSTEM_PROMPT says "Polish language educator" |
| `utils/article-generator.ts` | 61-130 | EXAMPLE_ARTICLE is Polish |
| `scripts/generate-article.ts` | ~50 | Polish-only generation |
| `api/admin/generate-article.ts` | ~30 | Polish-only generation |
| `content/articles.ts` | all | Polish article registry |
| `blog/src/content/config.ts` | ~20 | No language field in schema |
| `components/blog/MDXComponents.tsx` | 178-200 | `VocabCard` has `polish` prop |
| 24 MDX articles | all | Polish-only content |

### Database (implicit, no explicit columns)

| Table | Missing Column |
|-------|---------------|
| `profiles` | `native_language`, `active_language`, `languages[]` |
| `dictionary` | `language_code` |
| `word_scores` | `language_code` |
| `chats` | `language_code` |
| `tutor_challenges` | `language_code` |
| `word_requests` | `language_code` |
| `listen_sessions` | `target_language`, `native_language` |

**TOTAL: 70+ files need modification**

---

## Architecture Decisions

### Decision 1: Two Language Parameters Everywhere

Every API endpoint and component receives BOTH:
- `targetLanguage` - What the user is learning (e.g., 'pl')
- `nativeLanguage` - The user's mother tongue (e.g., 'es')

```typescript
// EVERY API call must include both
POST /api/chat
{
  targetLanguage: 'pl',    // Learning Polish
  nativeLanguage: 'es',    // Spanish speaker
  mode: 'learn',
  message: '...'
}
```

### Decision 2: Single Source of Truth for Languages

All language data lives in ONE file: `constants/language-config.ts`

```typescript
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: { /* complete config */ },
  es: { /* complete config */ },
  // ... all 18 languages
};
```

### Decision 3: Prompt Templates Replace Hardcoded Prompts

All AI prompts built from templates in `utils/prompt-templates.ts`:

```typescript
function buildCupidSystemPrompt(
  targetLanguage: string,
  nativeLanguage: string,
  mode: ChatMode
): string
```

### Decision 4: Database Stores Language Per Record

```sql
dictionary.language_code = 'pl'
profiles.native_language = 'es'
profiles.active_language = 'pl'
```

### Decision 5: Backward Compatibility

Existing Polish users are NOT affected:
- Default `native_language` = 'en'
- Default `active_language` = 'pl'
- All existing data auto-tagged as Polish

### Decision 6: Blog Generator Becomes Multi-Language

```typescript
// NEW: generateArticleContent accepts language
generateArticleContent({
  topic: 'How to say I love you',
  targetLanguage: 'es',      // NEW
  nativeLanguage: 'en',      // NEW
  category: 'phrases'
})
```

---

## Phase Overview

| Phase | Name | Files | Risk | Dependencies |
|-------|------|-------|------|--------------|
| ML-1 | Foundation Files | 3 new | Low | None |
| ML-2 | Database Migration | 1 SQL | Medium | ML-1 |
| ML-3 | Type System | 2 files | Medium | ML-1 |
| ML-4 | API Middleware | 2 files | Low | ML-1 |
| ML-5 | Chat APIs | 2 files | Medium | ML-1, ML-4 |
| ML-6 | Vocabulary APIs | 5 files | Medium | ML-1, ML-4 |
| ML-7 | Voice APIs | 5 files | High | ML-1, ML-4 |
| ML-8 | Game APIs | 8 files | Medium | ML-1, ML-4 |
| ML-9 | Frontend Core | 4 files | High | ML-3 |
| ML-10 | Frontend Games | 5 files | High | ML-3, ML-9 |
| ML-11 | Onboarding | 6 files | Medium | ML-3, ML-9 |
| ML-12 | Blog Generator | 8 files | Medium | ML-1, ML-3 |
| ML-13 | Content | 3 files | Low | ML-1 |
| ML-14 | Settings UI | 2 files | Medium | ML-9 |
| ML-15 | Premium | 3 files | Medium | ML-14 |
| ML-16 | Testing | 0 files | Low | All |

### Critical Path

```
ML-1 ──→ ML-2 ──→ ML-3 ──→ ML-9 ──→ ML-10 ──→ ML-11
  │                │
  └──→ ML-4 ──→ ML-5/6/7/8
  │
  └──→ ML-12 (Blog - can run in parallel)
```

---

## Phase ML-1: Foundation Files

**Goal:** Create the core infrastructure files that everything else depends on.

**Risk:** Low - no behavior changes, just new files.

### File 1: `constants/language-config.ts` (NEW)

**Purpose:** Single source of truth for all 18 language configurations.

**Complete file content:**

```typescript
/**
 * Language Configuration - Single Source of Truth
 *
 * All 18 supported languages with their complete configurations.
 * This file is imported by API endpoints, components, and utilities.
 */

export interface LanguageConfig {
  // Identity
  code: string;                    // ISO 639-1: 'pl', 'es', 'en'
  name: string;                    // English name: 'Polish', 'Spanish'
  nativeName: string;              // Native name: 'Polski', 'Español'
  flag: string;                    // Emoji flag: '🇵🇱', '🇪🇸'

  // Grammar capabilities
  grammar: {
    hasGender: boolean;
    genderTypes?: ('masculine' | 'feminine' | 'neuter')[];
    hasConjugation: boolean;
    conjugationPersons?: string[];  // ['ja', 'ty', ...] or ['yo', 'tú', ...]
    hasCases: boolean;
    caseCount?: number;             // Polish: 7, Russian: 6
    hasArticles: boolean;           // Spanish: el/la, French: le/la
    hasTones: boolean;              // For future Asian language support
    writingSystem: 'latin' | 'cyrillic' | 'greek';
  };

  // Special characters for validation
  specialChars: string[];          // ['ą', 'ę', 'ć', ...] or ['á', 'é', 'ñ', ...]

  // Text-to-speech configuration
  tts: {
    voiceCode: string;             // Google TTS voice: 'pl-PL-Standard-A'
    langCode: string;              // BCP-47: 'pl-PL', 'es-ES'
  };

  // Gladia transcription
  transcription: {
    gladiaCode: string;            // 'polish', 'spanish'
    supported: boolean;
  };

  // Gemini Live voice mode
  voiceMode: {
    supported: boolean;
  };

  // Example words for prompts (used in AI instructions)
  examples: {
    hello: string;                 // 'Cześć', 'Hola'
    iLoveYou: string;              // 'Kocham cię', 'Te amo'
    thankYou: string;              // 'Dziękuję', 'Gracias'
    goodMorning: string;           // 'Dzień dobry', 'Buenos días'
  };
}

// =============================================================================
// ALL 18 LANGUAGE CONFIGURATIONS
// =============================================================================

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  // -------------------------------------------------------------------------
  // TIER 0: GLOBAL
  // -------------------------------------------------------------------------
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    grammar: {
      hasGender: false,
      genderTypes: [],
      hasConjugation: true,
      conjugationPersons: ['I', 'you', 'he/she/it', 'we', 'you (plural)', 'they'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: [],
    tts: { voiceCode: 'en-US-Standard-C', langCode: 'en-US' },
    transcription: { gladiaCode: 'english', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hello',
      iLoveYou: 'I love you',
      thankYou: 'Thank you',
      goodMorning: 'Good morning',
    },
  },

  // -------------------------------------------------------------------------
  // TIER 1: ROMANCE LANGUAGES
  // -------------------------------------------------------------------------
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasConjugation: true,
      conjugationPersons: ['yo', 'tú', 'él/ella/usted', 'nosotros', 'vosotros', 'ellos/ustedes'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'],
    tts: { voiceCode: 'es-ES-Standard-A', langCode: 'es-ES' },
    transcription: { gladiaCode: 'spanish', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hola',
      iLoveYou: 'Te amo',
      thankYou: 'Gracias',
      goodMorning: 'Buenos días',
    },
  },

  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasConjugation: true,
      conjugationPersons: ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'œ', 'æ'],
    tts: { voiceCode: 'fr-FR-Standard-A', langCode: 'fr-FR' },
    transcription: { gladiaCode: 'french', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Bonjour',
      iLoveYou: 'Je t\'aime',
      thankYou: 'Merci',
      goodMorning: 'Bonjour',
    },
  },

  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasConjugation: true,
      conjugationPersons: ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
    tts: { voiceCode: 'it-IT-Standard-A', langCode: 'it-IT' },
    transcription: { gladiaCode: 'italian', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Ciao',
      iLoveYou: 'Ti amo',
      thankYou: 'Grazie',
      goodMorning: 'Buongiorno',
    },
  },

  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasConjugation: true,
      conjugationPersons: ['eu', 'tu', 'ele/ela', 'nós', 'vós', 'eles/elas'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
    tts: { voiceCode: 'pt-PT-Standard-A', langCode: 'pt-PT' },
    transcription: { gladiaCode: 'portuguese', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Olá',
      iLoveYou: 'Eu te amo',
      thankYou: 'Obrigado',
      goodMorning: 'Bom dia',
    },
  },

  ro: {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    flag: '🇷🇴',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['eu', 'tu', 'el/ea', 'noi', 'voi', 'ei/ele'],
      hasCases: true,
      caseCount: 5,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['ă', 'â', 'î', 'ș', 'ț'],
    tts: { voiceCode: 'ro-RO-Standard-A', langCode: 'ro-RO' },
    transcription: { gladiaCode: 'romanian', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Bună',
      iLoveYou: 'Te iubesc',
      thankYou: 'Mulțumesc',
      goodMorning: 'Bună dimineața',
    },
  },

  // -------------------------------------------------------------------------
  // TIER 2: GERMANIC LANGUAGES
  // -------------------------------------------------------------------------
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'],
      hasCases: true,
      caseCount: 4,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['ä', 'ö', 'ü', 'ß'],
    tts: { voiceCode: 'de-DE-Standard-A', langCode: 'de-DE' },
    transcription: { gladiaCode: 'german', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hallo',
      iLoveYou: 'Ich liebe dich',
      thankYou: 'Danke',
      goodMorning: 'Guten Morgen',
    },
  },

  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['ik', 'jij', 'hij/zij', 'wij', 'jullie', 'zij'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['é', 'ë', 'ï', 'ó', 'ö', 'ü'],
    tts: { voiceCode: 'nl-NL-Standard-A', langCode: 'nl-NL' },
    transcription: { gladiaCode: 'dutch', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hallo',
      iLoveYou: 'Ik hou van je',
      thankYou: 'Dank je',
      goodMorning: 'Goedemorgen',
    },
  },

  sv: {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['jag', 'du', 'han/hon', 'vi', 'ni', 'de'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['å', 'ä', 'ö'],
    tts: { voiceCode: 'sv-SE-Standard-A', langCode: 'sv-SE' },
    transcription: { gladiaCode: 'swedish', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hej',
      iLoveYou: 'Jag älskar dig',
      thankYou: 'Tack',
      goodMorning: 'God morgon',
    },
  },

  no: {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: '🇳🇴',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['jeg', 'du', 'han/hun', 'vi', 'dere', 'de'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['æ', 'ø', 'å'],
    tts: { voiceCode: 'nb-NO-Standard-A', langCode: 'nb-NO' },
    transcription: { gladiaCode: 'norwegian', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hei',
      iLoveYou: 'Jeg elsker deg',
      thankYou: 'Takk',
      goodMorning: 'God morgen',
    },
  },

  da: {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    flag: '🇩🇰',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['jeg', 'du', 'han/hun', 'vi', 'I', 'de'],
      hasCases: false,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['æ', 'ø', 'å'],
    tts: { voiceCode: 'da-DK-Standard-A', langCode: 'da-DK' },
    transcription: { gladiaCode: 'danish', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Hej',
      iLoveYou: 'Jeg elsker dig',
      thankYou: 'Tak',
      goodMorning: 'Godmorgen',
    },
  },

  // -------------------------------------------------------------------------
  // TIER 3: SLAVIC LANGUAGES
  // -------------------------------------------------------------------------
  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['ja', 'ty', 'on/ona/ono', 'my', 'wy', 'oni/one'],
      hasCases: true,
      caseCount: 7,
      hasArticles: false,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],
    tts: { voiceCode: 'pl-PL-Standard-A', langCode: 'pl-PL' },
    transcription: { gladiaCode: 'polish', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Cześć',
      iLoveYou: 'Kocham cię',
      thankYou: 'Dziękuję',
      goodMorning: 'Dzień dobry',
    },
  },

  cs: {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    flag: '🇨🇿',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['já', 'ty', 'on/ona/ono', 'my', 'vy', 'oni/ony'],
      hasCases: true,
      caseCount: 7,
      hasArticles: false,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž'],
    tts: { voiceCode: 'cs-CZ-Standard-A', langCode: 'cs-CZ' },
    transcription: { gladiaCode: 'czech', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Ahoj',
      iLoveYou: 'Miluji tě',
      thankYou: 'Děkuji',
      goodMorning: 'Dobré ráno',
    },
  },

  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['я', 'ты', 'он/она/оно', 'мы', 'вы', 'они'],
      hasCases: true,
      caseCount: 6,
      hasArticles: false,
      hasTones: false,
      writingSystem: 'cyrillic',
    },
    specialChars: [], // Cyrillic is the base, no "special" chars
    tts: { voiceCode: 'ru-RU-Standard-A', langCode: 'ru-RU' },
    transcription: { gladiaCode: 'russian', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Привет',
      iLoveYou: 'Я тебя люблю',
      thankYou: 'Спасибо',
      goodMorning: 'Доброе утро',
    },
  },

  uk: {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['я', 'ти', 'він/вона/воно', 'ми', 'ви', 'вони'],
      hasCases: true,
      caseCount: 7,
      hasArticles: false,
      hasTones: false,
      writingSystem: 'cyrillic',
    },
    specialChars: [],
    tts: { voiceCode: 'uk-UA-Standard-A', langCode: 'uk-UA' },
    transcription: { gladiaCode: 'ukrainian', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Привіт',
      iLoveYou: 'Я тебе кохаю',
      thankYou: 'Дякую',
      goodMorning: 'Доброго ранку',
    },
  },

  // -------------------------------------------------------------------------
  // TIER 4: OTHER EUROPEAN
  // -------------------------------------------------------------------------
  el: {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    flag: '🇬🇷',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasConjugation: true,
      conjugationPersons: ['εγώ', 'εσύ', 'αυτός/αυτή/αυτό', 'εμείς', 'εσείς', 'αυτοί/αυτές/αυτά'],
      hasCases: true,
      caseCount: 4,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'greek',
    },
    specialChars: [],
    tts: { voiceCode: 'el-GR-Standard-A', langCode: 'el-GR' },
    transcription: { gladiaCode: 'greek', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Γεια σου',
      iLoveYou: 'Σ\'αγαπώ',
      thankYou: 'Ευχαριστώ',
      goodMorning: 'Καλημέρα',
    },
  },

  hu: {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    flag: '🇭🇺',
    grammar: {
      hasGender: false,
      genderTypes: [],
      hasConjugation: true,
      conjugationPersons: ['én', 'te', 'ő', 'mi', 'ti', 'ők'],
      hasCases: true,
      caseCount: 18,
      hasArticles: true,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['á', 'é', 'í', 'ó', 'ö', 'ő', 'ú', 'ü', 'ű'],
    tts: { voiceCode: 'hu-HU-Standard-A', langCode: 'hu-HU' },
    transcription: { gladiaCode: 'hungarian', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Szia',
      iLoveYou: 'Szeretlek',
      thankYou: 'Köszönöm',
      goodMorning: 'Jó reggelt',
    },
  },

  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    grammar: {
      hasGender: false,
      genderTypes: [],
      hasConjugation: true,
      conjugationPersons: ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'],
      hasCases: true,
      caseCount: 6,
      hasArticles: false,
      hasTones: false,
      writingSystem: 'latin',
    },
    specialChars: ['ç', 'ğ', 'ı', 'ö', 'ş', 'ü'],
    tts: { voiceCode: 'tr-TR-Standard-A', langCode: 'tr-TR' },
    transcription: { gladiaCode: 'turkish', supported: true },
    voiceMode: { supported: true },
    examples: {
      hello: 'Merhaba',
      iLoveYou: 'Seni seviyorum',
      thankYou: 'Teşekkür ederim',
      goodMorning: 'Günaydın',
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get configuration for a language code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[code];
}

/**
 * Get display name for a language
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_CONFIGS[code]?.name || code.toUpperCase();
}

/**
 * Get native name for a language
 */
export function getLanguageNativeName(code: string): string {
  return LANGUAGE_CONFIGS[code]?.nativeName || code.toUpperCase();
}

/**
 * Get flag emoji for a language
 */
export function getLanguageFlag(code: string): string {
  return LANGUAGE_CONFIGS[code]?.flag || '🏳️';
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code: string): boolean {
  return code in LANGUAGE_CONFIGS;
}

/**
 * Get special characters for a language (for diacritic validation)
 */
export function getSpecialChars(code: string): string[] {
  return LANGUAGE_CONFIGS[code]?.specialChars || [];
}

/**
 * Get all supported language codes
 */
export function getAllLanguageCodes(): string[] {
  return Object.keys(LANGUAGE_CONFIGS);
}

/**
 * Get all languages as array (for dropdowns)
 */
export function getAllLanguages(): LanguageConfig[] {
  return Object.values(LANGUAGE_CONFIGS);
}

/**
 * Get TTS voice code for a language
 */
export function getTTSVoice(code: string): string {
  return LANGUAGE_CONFIGS[code]?.tts.voiceCode || 'en-US-Standard-C';
}

/**
 * Get TTS language code for a language
 */
export function getTTSLangCode(code: string): string {
  return LANGUAGE_CONFIGS[code]?.tts.langCode || 'en-US';
}

/**
 * Check if transcription is supported for a language
 */
export function isTranscriptionSupported(code: string): boolean {
  return LANGUAGE_CONFIGS[code]?.transcription.supported || false;
}

/**
 * Get Gladia language code for transcription
 */
export function getGladiaCode(code: string): string {
  return LANGUAGE_CONFIGS[code]?.transcription.gladiaCode || 'english';
}

/**
 * Check if voice mode is supported for a language
 */
export function isVoiceModeSupported(code: string): boolean {
  return LANGUAGE_CONFIGS[code]?.voiceMode.supported || false;
}

/**
 * Get example translation for prompts
 */
export function getExamplePhrase(
  code: string,
  phrase: 'hello' | 'iLoveYou' | 'thankYou' | 'goodMorning'
): string {
  return LANGUAGE_CONFIGS[code]?.examples[phrase] || '';
}
```

### File 2: `utils/prompt-templates.ts` (NEW)

**Purpose:** Build AI prompts for any language pair.

**Complete file content:**

```typescript
/**
 * Prompt Templates - Language-Agnostic AI Prompts
 *
 * All AI prompts are built from these templates.
 * Templates accept targetLanguage and nativeLanguage to work with any pair.
 */

import {
  LANGUAGE_CONFIGS,
  getLanguageConfig,
  getLanguageName,
  getExamplePhrase
} from '../constants/language-config';

// =============================================================================
// MAIN CHAT PROMPTS
// =============================================================================

/**
 * Build the main "Cupid" system prompt for chat
 */
export function buildCupidSystemPrompt(
  targetLanguage: string,
  nativeLanguage: string,
  mode: 'ask' | 'learn' | 'coach'
): string {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target || !native) {
    throw new Error(`Unsupported language pair: ${targetLanguage} → ${nativeLanguage}`);
  }

  const targetName = target.name;
  const nativeName = native.name;

  // Example word with translation
  const exampleWord = target.examples.hello;
  const exampleTranslation = native.examples.hello;

  // Base prompt (shared across modes)
  const basePrompt = `You are "Cupid" - a warm, encouraging ${targetName} language companion for couples learning together.

## CRITICAL RULES

1. **RESPOND IN ${nativeName.toUpperCase()}** - All explanations, instructions, and commentary must be in ${nativeName}.
2. **EVERY ${targetName} word MUST have a ${nativeName} translation** - Format: **${exampleWord}** (${exampleTranslation})
3. Use **asterisks** for ${targetName} words in flowing text
4. Include [pronunciation guides] for new vocabulary
5. Be warm, romantic, and encouraging - this is for couples!

## ${targetName}-Specific Notes
${buildLanguageSpecificNotes(targetLanguage)}

## Grammar Guidance
${buildGrammarGuidance(targetLanguage, nativeLanguage)}
`;

  // Mode-specific additions
  if (mode === 'ask') {
    return basePrompt + `
## ASK MODE
- Give quick, helpful answers
- Focus on practical usage
- Keep responses concise but complete
- Include pronunciation for key words`;
  }

  if (mode === 'learn') {
    return basePrompt + `
## LEARN MODE
- Provide structured lessons with clear sections
- Use tables for conjugations and vocabulary
- Include practice exercises
- Build vocabulary progressively
- Use these custom blocks for rich content:

### Vocabulary Tables
\`\`\`
::: table
| ${targetName} | ${nativeName} | Notes |
|---|---|---|
| word | translation | usage note |
:::
\`\`\`

### Practice Drills
\`\`\`
::: drill
[Practice exercise here]
:::
\`\`\`

### Cultural Notes
\`\`\`
::: culture [Title]
[Cultural insight about ${targetName}-speaking countries]
:::
\`\`\``;
  }

  if (mode === 'coach') {
    return basePrompt + `
## COACH MODE (For Tutors)
- You're helping a native ${targetName} speaker teach their partner
- Provide teaching tips and strategies
- Suggest conversation topics using the partner's vocabulary
- Help with explaining grammar concepts simply
- Focus on creating bonding moments through language`;
  }

  return basePrompt;
}

// =============================================================================
// VOCABULARY EXTRACTION PROMPTS
// =============================================================================

/**
 * Build prompt for extracting vocabulary from chat history
 */
export function buildVocabularyExtractionPrompt(
  targetLanguage: string,
  nativeLanguage: string
): string {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target || !native) {
    throw new Error(`Unsupported language pair: ${targetLanguage} → ${nativeLanguage}`);
  }

  return `You are a ${target.name} vocabulary extraction assistant.

Analyze the conversation and extract all ${target.name} vocabulary that the learner should save.

For each word, provide:
- **word**: The ${target.name} word/phrase (with correct diacritics: ${target.specialChars.join(', ') || 'standard characters'})
- **translation**: ${native.name} translation
- **pronunciation**: Phonetic guide for ${native.name} speakers
- **type**: noun, verb, adjective, phrase, expression
- **examples**: 1-2 example sentences

${buildGrammarExtractionNotes(targetLanguage)}

Return as a JSON array of vocabulary entries.`;
}

/**
 * Build prompt for word validation (when user adds manually)
 */
export function buildWordValidationPrompt(
  targetLanguage: string,
  nativeLanguage: string
): string {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target || !native) {
    throw new Error(`Unsupported language pair: ${targetLanguage} → ${nativeLanguage}`);
  }

  return `You are a ${target.name} language validator.

Given a ${target.name} word or phrase:
1. Correct any spelling/diacritic errors (use: ${target.specialChars.join(', ') || 'standard characters'})
2. Provide the ${native.name} translation
3. Add pronunciation guide for ${native.name} speakers
4. Identify word type (noun, verb, adjective, phrase)
5. Provide 1-2 example sentences

Return as JSON:
{
  "word": "corrected ${target.name} word",
  "translation": "${native.name} translation",
  "pronunciation": "phonetic guide",
  "type": "word type",
  "examples": ["example 1", "example 2"]
}`;
}

// =============================================================================
// GAME & TEST PROMPTS
// =============================================================================

/**
 * Build prompt for generating level tests
 */
export function buildLevelTestPrompt(
  targetLanguage: string,
  nativeLanguage: string,
  level: number,
  tier: string
): string {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target || !native) {
    throw new Error(`Unsupported language pair: ${targetLanguage} → ${nativeLanguage}`);
  }

  return `Generate a ${target.name} language proficiency test for level ${level} (${tier} tier).

The test should:
- Be appropriate for ${tier} level learners
- Include 10 multiple-choice questions
- Test vocabulary, grammar, and comprehension
- Use ${native.name} for instructions and answer choices where appropriate
- Include ${target.name} text for translation/comprehension questions

Question types to include:
1. Vocabulary (${target.name} → ${native.name})
2. Vocabulary (${native.name} → ${target.name})
3. Grammar (choose correct form)
4. Fill in the blank
5. Reading comprehension

Return as JSON array of questions with format:
{
  "question": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct"
}`;
}

/**
 * Build prompt for answer validation in games
 */
export function buildAnswerValidationPrompt(
  targetLanguage: string,
  nativeLanguage: string
): string {
  const target = getLanguageConfig(targetLanguage);

  return `You are validating answers for a ${target.name} language learning game.

Accept as CORRECT if:
1. Exact match (case-insensitive)
2. Missing diacritics but otherwise correct (${target.specialChars.join(', ') || 'no special chars'} → base letters)
3. Valid synonym in context
4. Minor typo (1-2 characters)
5. Alternative valid translation

Return JSON:
{
  "isCorrect": boolean,
  "explanation": "Brief feedback",
  "suggestion": "Correct form if wrong"
}`;
}

// =============================================================================
// CONVERSATION SCENARIO PROMPTS
// =============================================================================

/**
 * Build prompt for voice conversation scenarios
 */
export function buildConversationScenarioPrompt(
  targetLanguage: string,
  nativeLanguage: string,
  scenario: {
    id: string;
    context: string;
    personaName: string;
    location: string;
  }
): string {
  const target = getLanguageConfig(targetLanguage);

  if (!target) {
    throw new Error(`Unsupported target language: ${targetLanguage}`);
  }

  return `You are ${scenario.personaName}, a friendly ${target.name} speaker in ${scenario.location}.

SCENARIO: ${scenario.context}

RULES:
1. Speak ONLY in ${target.name} (this is voice conversation practice)
2. Start with a greeting appropriate to the scenario
3. Be patient and encouraging with the learner
4. If they make mistakes, gently correct by repeating the correct form
5. Keep responses conversational and natural
6. Use vocabulary appropriate for the scenario

PERSONA:
- Name: ${scenario.personaName}
- Location: ${scenario.location}
- Personality: Friendly, patient, helpful

Begin the conversation with an appropriate ${target.name} greeting.`;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build language-specific grammar notes for prompts
 */
function buildLanguageSpecificNotes(targetLanguage: string): string {
  const notes: Record<string, string> = {
    pl: `- Polish has 7 grammatical cases - introduce gradually
- Highlight special characters: ą, ę, ć, ł, ń, ó, ś, ź, ż
- Verb conjugation changes by person (ja, ty, on/ona, my, wy, oni)
- No articles (a/the) - this is easier than English!`,

    es: `- Spanish has gendered nouns (el/la) - always mention gender
- Highlight special characters: á, é, í, ó, ú, ü, ñ, ¿, ¡
- Distinguish between ser/estar (both mean "to be")
- Verb conjugation: yo, tú, él/ella, nosotros, vosotros, ellos`,

    fr: `- French has gendered nouns (le/la) - always mention gender
- Liaison and elision are important for pronunciation
- Verb groups: -er, -ir, -re patterns
- Nasal vowels require special attention`,

    de: `- German has 3 genders (der/die/das) and 4 cases
- Compound nouns are written as one word
- Verb position is important (V2 rule)
- ß (Eszett) and umlauts (ä, ö, ü)`,

    it: `- Italian has gendered nouns (il/la) - always mention gender
- Verb conjugation is similar to Spanish
- Double consonants affect pronunciation
- Regional variations exist`,

    pt: `- Portuguese has gendered nouns (o/a)
- Nasal vowels (ã, õ) are distinctive
- Brazilian vs European Portuguese differences
- Verb conjugation similar to Spanish`,

    ru: `- Russian uses Cyrillic alphabet - provide romanization
- 6 grammatical cases
- No articles
- Aspect (perfective/imperfective) is crucial for verbs`,

    uk: `- Ukrainian uses Cyrillic alphabet - provide romanization
- 7 grammatical cases
- No articles
- Soft sign (ь) affects pronunciation`,

    el: `- Greek has its own alphabet - provide romanization
- 4 grammatical cases
- Gendered nouns (ο/η/το)
- Accent marks indicate stress`,

    hu: `- Hungarian has 18 cases (but many are predictable)
- Vowel harmony affects suffixes
- No grammatical gender
- Agglutinative language - many suffixes`,

    tr: `- Turkish is agglutinative - suffixes change meaning
- Vowel harmony is essential
- No grammatical gender
- SOV word order (subject-object-verb)`,
  };

  return notes[targetLanguage] || 'Follow standard language teaching practices.';
}

/**
 * Build grammar guidance based on language pair comparison
 */
function buildGrammarGuidance(targetLanguage: string, nativeLanguage: string): string {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target || !native) return '';

  const guidance: string[] = [];

  // Compare grammar features
  if (target.grammar.hasCases && !native.grammar.hasCases) {
    guidance.push(`- ${target.name} has grammatical cases (${target.grammar.caseCount}) - ${native.name} doesn't. Introduce cases gradually.`);
  }

  if (target.grammar.hasGender && !native.grammar.hasGender) {
    guidance.push(`- ${target.name} has gendered nouns - ${native.name} doesn't. Always mention gender with new nouns.`);
  }

  if (!target.grammar.hasArticles && native.grammar.hasArticles) {
    guidance.push(`- ${target.name} has no articles (a/the) - simpler than ${native.name}!`);
  }

  if (target.grammar.writingSystem !== native.grammar.writingSystem) {
    guidance.push(`- ${target.name} uses ${target.grammar.writingSystem} script - provide romanization/transliteration.`);
  }

  return guidance.join('\n') || 'Compare features between languages to highlight differences.';
}

/**
 * Build grammar extraction notes for vocabulary
 */
function buildGrammarExtractionNotes(targetLanguage: string): string {
  const target = getLanguageConfig(targetLanguage);
  if (!target) return '';

  const notes: string[] = [];

  if (target.grammar.hasGender) {
    notes.push(`For nouns, include gender (${target.grammar.genderTypes?.join('/')}).`);
  }

  if (target.grammar.hasConjugation) {
    notes.push(`For verbs, include conjugation for all persons: ${target.grammar.conjugationPersons?.join(', ')}.`);
  }

  if (target.grammar.hasCases) {
    notes.push(`For nouns/adjectives, note if case forms are irregular.`);
  }

  return notes.join('\n');
}

// =============================================================================
// BLOG GENERATOR PROMPTS
// =============================================================================

/**
 * Build system prompt for blog article generation
 */
export function buildBlogArticlePrompt(
  targetLanguage: string,
  nativeLanguage: string
): string {
  const target = getLanguageConfig(targetLanguage);
  const native = getLanguageConfig(nativeLanguage);

  if (!target || !native) {
    throw new Error(`Unsupported language pair: ${targetLanguage} → ${nativeLanguage}`);
  }

  return `You are an expert ${target.name} language educator writing SEO-optimized blog articles for "Love Languages" - an app that helps couples learn ${target.name} together.

Your articles should be:
1. ACCURATE - ${target.name} spelling, diacritics (${target.specialChars.join(', ') || 'standard characters'}), and grammar must be perfect
2. EDUCATIONAL - Clear explanations with pronunciation guides for ${native.name} speakers
3. ENGAGING - Written for couples, romantic tone, practical examples
4. SEO-OPTIMIZED - Natural keyword usage, good heading structure
5. TRANSLATED - EVERY ${target.name} word/phrase MUST have a ${native.name} translation inline

## Critical Rule: Always Translate
Every time you write a ${target.name} word or phrase, include the ${native.name} translation immediately after.
- ✅ **${target.examples.hello}** (${native.examples.hello})
- ✅ The **${target.examples.thankYou}** (${native.examples.thankYou}) is commonly used
- ❌ Using ${target.examples.hello} without translation (WRONG!)

## Available MDX Components

\`\`\`jsx
<VocabCard
  word="${target.examples.iLoveYou}"
  translation="${native.examples.iLoveYou}"
  pronunciation="phonetic guide"
  example="Example sentence"
/>

<PhraseOfDay
  word="${target.examples.hello}"
  translation="${native.examples.hello}"
  pronunciation="phonetic"
  context="When to use this phrase"
/>

<CultureTip title="Did You Know?" flag="${target.flag}">
Cultural insight here...
</CultureTip>

<CTA
  text="Ready to practice?"
  buttonText="Start Learning"
/>
\`\`\`

Return as JSON with frontmatter, content, and imagePrompt fields.`;
}
```

### File 3: `types/language-types.ts` (NEW)

**Purpose:** TypeScript interfaces for multi-language support.

```typescript
/**
 * Language-Related Type Definitions
 *
 * Types for multi-language support throughout the app.
 */

// =============================================================================
// CORE LANGUAGE TYPES
// =============================================================================

/**
 * ISO 639-1 language codes for supported languages
 */
export type LanguageCode =
  | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'ro'  // Global + Romance
  | 'de' | 'nl' | 'sv' | 'no' | 'da'          // Germanic
  | 'pl' | 'cs' | 'ru' | 'uk'                  // Slavic
  | 'el' | 'hu' | 'tr';                        // Other

/**
 * Translation direction (for games and quizzes)
 */
export type TranslationDirection = 'target_to_native' | 'native_to_target';

/**
 * Language pair for user configuration
 */
export interface LanguagePair {
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
}

// =============================================================================
// USER PROFILE LANGUAGE FIELDS
// =============================================================================

/**
 * Language-related fields in user profile
 */
export interface LanguageProfile {
  native_language: LanguageCode;   // User's mother tongue
  active_language: LanguageCode;   // Currently learning
  languages: LanguageCode[];       // All unlocked languages
}

// =============================================================================
// VOCABULARY TYPES (LANGUAGE-AGNOSTIC)
// =============================================================================

/**
 * A phrase in any language (replaces RomanticPhrase)
 */
export interface Phrase {
  word: string;                    // Word in target language
  translation: string;             // Translation in native language
  targetLanguageCode: LanguageCode;
  nativeLanguageCode: LanguageCode;
}

/**
 * Base word context (shared by all languages)
 */
export interface BaseWordContext {
  original: string;
  translation: string;
  examples: string[];
  root?: string;
  proTip?: string;
  pronunciation: string;
}

/**
 * Word context with language-specific grammar
 * Uses discriminated union based on language code
 */
export type WordContext =
  | PolishWordContext
  | SpanishWordContext
  | GermanWordContext
  | RussianWordContext
  | GenericWordContext;

export interface PolishWordContext extends BaseWordContext {
  languageCode: 'pl';
  gender?: 'masculine' | 'feminine' | 'neuter';
  plural?: string;
  conjugations?: {
    present: { ja: string; ty: string; onOna: string; my: string; wy: string; oni: string };
    past?: { ja: string; ty: string; onOna: string; my: string; wy: string; oni: string };
    future?: { ja: string; ty: string; onOna: string; my: string; wy: string; oni: string };
  };
  cases?: {
    nominative: string;
    genitive: string;
    dative: string;
    accusative: string;
    instrumental: string;
    locative: string;
    vocative: string;
  };
}

export interface SpanishWordContext extends BaseWordContext {
  languageCode: 'es';
  gender?: 'masculine' | 'feminine';
  plural?: string;
  conjugations?: {
    presente: { yo: string; tu: string; el: string; nosotros: string; vosotros: string; ellos: string };
    preterito?: { yo: string; tu: string; el: string; nosotros: string; vosotros: string; ellos: string };
    futuro?: { yo: string; tu: string; el: string; nosotros: string; vosotros: string; ellos: string };
  };
}

export interface GermanWordContext extends BaseWordContext {
  languageCode: 'de';
  gender?: 'masculine' | 'feminine' | 'neuter';
  plural?: string;
  conjugations?: {
    prasens: { ich: string; du: string; erSieEs: string; wir: string; ihr: string; sie: string };
  };
  cases?: {
    nominativ: string;
    genitiv: string;
    dativ: string;
    akkusativ: string;
  };
}

export interface RussianWordContext extends BaseWordContext {
  languageCode: 'ru';
  gender?: 'masculine' | 'feminine' | 'neuter';
  plural?: string;
  aspect?: 'perfective' | 'imperfective';
  conjugations?: {
    present: { ya: string; ti: string; onOna: string; mi: string; vi: string; oni: string };
  };
  cases?: {
    nominative: string;
    genitive: string;
    dative: string;
    accusative: string;
    instrumental: string;
    prepositional: string;
  };
}

export interface GenericWordContext extends BaseWordContext {
  languageCode: Exclude<LanguageCode, 'pl' | 'es' | 'de' | 'ru'>;
  gender?: string;
  plural?: string;
  conjugations?: Record<string, Record<string, string>>;
}

// =============================================================================
// ONBOARDING TYPES (LANGUAGE-AGNOSTIC)
// =============================================================================

/**
 * Language-agnostic onboarding data (replaces polishConnection, etc.)
 */
export interface LanguageOnboardingData {
  languageConnection?: string;       // "What's your connection to [Language]?"
  languageOrigin?: string;           // "How did you discover [Language]?"
  familyLanguageFrequency?: string;  // "How often do you speak [Language] at home?"
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Base type for API requests that need language context
 */
export interface LanguageAwareRequest {
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
}

/**
 * Chat API request with language
 */
export interface ChatRequest extends LanguageAwareRequest {
  mode: 'ask' | 'learn' | 'coach';
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * Vocabulary extraction request
 */
export interface VocabularyExtractionRequest extends LanguageAwareRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * Word validation request
 */
export interface WordValidationRequest extends LanguageAwareRequest {
  word: string;
  translation?: string;
}

/**
 * Level test generation request
 */
export interface LevelTestRequest extends LanguageAwareRequest {
  level: number;
  tier: string;
}

/**
 * TTS request
 */
export interface TTSRequest {
  text: string;
  languageCode: LanguageCode;
}
```

### Verification Checklist for Phase ML-1

- [ ] `constants/language-config.ts` compiles without errors
- [ ] All 18 languages have complete configurations
- [ ] `utils/prompt-templates.ts` compiles without errors
- [ ] All prompt functions handle both language parameters
- [ ] `types/language-types.ts` compiles without errors
- [ ] No imports fail from these new files
- [ ] App still builds and runs (no behavior change yet)
- [ ] Existing functionality unaffected

---

## Phase ML-2: Database Migration

**Goal:** Add language columns to all tables without breaking existing data.

**Risk:** Medium - database changes require careful rollback planning.

### Migration SQL File

**File:** `migrations/020_multilanguage_support.sql`

```sql
-- =============================================================================
-- MIGRATION 020: Multi-Language Support
-- =============================================================================
--
-- This migration adds language support to all relevant tables.
-- All defaults are set to 'pl' for Polish to maintain backward compatibility
-- with existing data.
--
-- IMPORTANT: Run this in a transaction. If anything fails, rollback.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- -----------------------------------------------------------------------------
-- Add columns for user's native language, active learning language, and
-- all unlocked languages.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS native_language VARCHAR(5) DEFAULT 'en';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_language VARCHAR(5) DEFAULT 'pl';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['pl'];

COMMENT ON COLUMN profiles.native_language IS 'User''s mother tongue (ISO 639-1)';
COMMENT ON COLUMN profiles.active_language IS 'Currently learning language';
COMMENT ON COLUMN profiles.languages IS 'All unlocked language codes';

-- -----------------------------------------------------------------------------
-- 2. DICTIONARY TABLE
-- -----------------------------------------------------------------------------
-- Each vocabulary word belongs to a specific language.

ALTER TABLE dictionary
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl';

CREATE INDEX IF NOT EXISTS idx_dictionary_language
ON dictionary(user_id, language_code);

COMMENT ON COLUMN dictionary.language_code IS 'Language of this vocabulary word';

-- -----------------------------------------------------------------------------
-- 3. WORD_SCORES TABLE
-- -----------------------------------------------------------------------------
-- Mastery tracking is per-language.

ALTER TABLE word_scores
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl';

CREATE INDEX IF NOT EXISTS idx_word_scores_language
ON word_scores(user_id, language_code);

-- -----------------------------------------------------------------------------
-- 4. CHATS TABLE
-- -----------------------------------------------------------------------------
-- Each chat session is in a specific language.

ALTER TABLE chats
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl';

CREATE INDEX IF NOT EXISTS idx_chats_language
ON chats(user_id, language_code);

-- -----------------------------------------------------------------------------
-- 5. TUTOR_CHALLENGES TABLE
-- -----------------------------------------------------------------------------
-- Challenges are language-specific.

ALTER TABLE tutor_challenges
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl';

-- -----------------------------------------------------------------------------
-- 6. WORD_REQUESTS TABLE
-- -----------------------------------------------------------------------------
-- Word gifts are language-specific.

ALTER TABLE word_requests
ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'pl';

-- -----------------------------------------------------------------------------
-- 7. LISTEN_SESSIONS TABLE
-- -----------------------------------------------------------------------------
-- Listen sessions track both target and native language.

ALTER TABLE listen_sessions
ADD COLUMN IF NOT EXISTS target_language VARCHAR(5) DEFAULT 'pl';

ALTER TABLE listen_sessions
ADD COLUMN IF NOT EXISTS native_language VARCHAR(5) DEFAULT 'en';

-- -----------------------------------------------------------------------------
-- 8. USER_LANGUAGES TABLE (NEW)
-- -----------------------------------------------------------------------------
-- Tracks which languages each user has unlocked (for premium multi-language).

CREATE TABLE IF NOT EXISTS user_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'subscription',  -- 'subscription', 'gift', 'promo'
  UNIQUE(user_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_user_languages_user
ON user_languages(user_id);

COMMENT ON TABLE user_languages IS 'Premium language unlocks per user';

-- -----------------------------------------------------------------------------
-- 9. ARTICLE_GENERATIONS TABLE (if exists)
-- -----------------------------------------------------------------------------
-- Blog articles are language-specific.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_generations') THEN
    ALTER TABLE article_generations
    ADD COLUMN IF NOT EXISTS target_language VARCHAR(5) DEFAULT 'pl';

    ALTER TABLE article_generations
    ADD COLUMN IF NOT EXISTS native_language VARCHAR(5) DEFAULT 'en';
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 10. BACKFILL EXISTING DATA
-- -----------------------------------------------------------------------------
-- Set default values for all existing records.
-- This ensures backward compatibility.

UPDATE profiles SET native_language = 'en' WHERE native_language IS NULL;
UPDATE profiles SET active_language = 'pl' WHERE active_language IS NULL;
UPDATE profiles SET languages = ARRAY['pl'] WHERE languages IS NULL;

UPDATE dictionary SET language_code = 'pl' WHERE language_code IS NULL;
UPDATE word_scores SET language_code = 'pl' WHERE language_code IS NULL;
UPDATE chats SET language_code = 'pl' WHERE language_code IS NULL;
UPDATE tutor_challenges SET language_code = 'pl' WHERE language_code IS NULL;
UPDATE word_requests SET language_code = 'pl' WHERE language_code IS NULL;
UPDATE listen_sessions SET target_language = 'pl' WHERE target_language IS NULL;
UPDATE listen_sessions SET native_language = 'en' WHERE native_language IS NULL;

-- -----------------------------------------------------------------------------
-- 11. ADD CONSTRAINTS (after backfill)
-- -----------------------------------------------------------------------------

-- Ensure language_code is never null going forward
ALTER TABLE dictionary ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE word_scores ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE chats ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE tutor_challenges ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE word_requests ALTER COLUMN language_code SET NOT NULL;
ALTER TABLE listen_sessions ALTER COLUMN target_language SET NOT NULL;
ALTER TABLE listen_sessions ALTER COLUMN native_language SET NOT NULL;

COMMIT;
```

### Rollback SQL (if needed)

```sql
-- ROLLBACK: Remove multi-language columns
-- Only use this if migration fails and you need to restore

BEGIN;

ALTER TABLE profiles DROP COLUMN IF EXISTS native_language;
ALTER TABLE profiles DROP COLUMN IF EXISTS active_language;
ALTER TABLE profiles DROP COLUMN IF EXISTS languages;

ALTER TABLE dictionary DROP COLUMN IF EXISTS language_code;
ALTER TABLE word_scores DROP COLUMN IF EXISTS language_code;
ALTER TABLE chats DROP COLUMN IF EXISTS language_code;
ALTER TABLE tutor_challenges DROP COLUMN IF EXISTS language_code;
ALTER TABLE word_requests DROP COLUMN IF EXISTS language_code;
ALTER TABLE listen_sessions DROP COLUMN IF EXISTS target_language;
ALTER TABLE listen_sessions DROP COLUMN IF EXISTS native_language;

DROP TABLE IF EXISTS user_languages;

COMMIT;
```

### Verification Checklist for Phase ML-2

- [ ] Migration runs without errors in development
- [ ] All new columns exist with correct defaults
- [ ] Existing data has language_code = 'pl'
- [ ] Existing profiles have native_language='en', active_language='pl'
- [ ] user_languages table created
- [ ] All indexes created
- [ ] App still works with existing Polish data
- [ ] No queries fail due to schema changes

---

## Phase ML-3: Type System Overhaul

**Goal:** Update `types.ts` to use language-agnostic field names.

**Risk:** Medium - affects many files that import types.

### Changes to `types.ts`

**Before (Polish-specific):**
```typescript
export interface RomanticPhrase {
  polish: string;
  english: string;
}

export type TypeItDirection = 'polish_to_english' | 'english_to_polish';

export interface OnboardingData {
  polishConnection?: string;
  polishOrigin?: string;
  familyPolishFrequency?: string;
  // ...
}
```

**After (Language-agnostic):**
```typescript
// Import language types
import type {
  LanguageCode,
  TranslationDirection,
  Phrase,
  LanguageOnboardingData,
  LanguageProfile
} from './types/language-types';

// Re-export for convenience
export type { LanguageCode, TranslationDirection, Phrase };

// DEPRECATED: Keep for backward compatibility during migration
// TODO: Remove in Phase ML-7
/** @deprecated Use Phrase instead */
export interface RomanticPhrase {
  polish: string;  // → word
  english: string; // → translation
}

// NEW: Language-agnostic phrase
export { Phrase } from './types/language-types';

// DEPRECATED: Use TranslationDirection
/** @deprecated Use TranslationDirection instead */
export type TypeItDirection = 'polish_to_english' | 'english_to_polish';

// NEW: Generic direction
export { TranslationDirection } from './types/language-types';

// Update Profile interface
export interface Profile {
  id: string;
  email: string;
  role: UserRole;

  // Language settings (NEW)
  native_language: LanguageCode;
  active_language: LanguageCode;
  languages: LanguageCode[];

  // ... existing fields

  // DEPRECATED: Polish-specific onboarding
  // Keep for backward compatibility
  polishConnection?: string;
  polishOrigin?: string;
  familyPolishFrequency?: string;

  // NEW: Language-agnostic onboarding
  languageConnection?: string;
  languageOrigin?: string;
  familyLanguageFrequency?: string;
}

// Update DictionaryEntry
export interface DictionaryEntry {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  language_code: LanguageCode;  // NEW
  // ... rest unchanged
}

// Update ChatSession
export interface ChatSession {
  id: string;
  user_id: string;
  language_code: LanguageCode;  // NEW
  // ... rest unchanged
}
```

### Files Affected by Type Changes

These files import from `types.ts` and use the renamed types:

| File | Changes Needed |
|------|----------------|
| `components/FlashcardGame.tsx` | `TypeItDirection` → `TranslationDirection` |
| `components/ChatArea.tsx` | `RomanticPhrase` → `Phrase` |
| `components/LoveLog.tsx` | Add `language_code` filtering |
| `api/chat.ts` | Use new types |
| `api/validate-answer.ts` | Use new direction type |
| `services/audio.ts` | Accept `LanguageCode` param |

### Verification Checklist for Phase ML-3

- [ ] `types.ts` compiles without errors
- [ ] Deprecated types still work (backward compatibility)
- [ ] New types are properly exported
- [ ] All importing files compile
- [ ] No runtime errors from type changes

---

## Phase ML-4: API Middleware & Utilities

**Goal:** Add language parameter utilities to the API middleware layer.

**Risk:** Low - these are additions, not changes to existing behavior.

### Files to Modify

| File | Changes |
|------|---------|
| `utils/api-middleware.ts` | Add `extractLanguages()` helper function |
| `utils/language-helpers.ts` | NEW - Language validation and defaults |

### 1. `utils/language-helpers.ts` (NEW FILE)

**Purpose:** Centralized language validation for API endpoints.

```typescript
/**
 * Language Helpers for API Endpoints
 *
 * Provides language extraction, validation, and defaults for all API endpoints.
 */

import { LANGUAGE_CONFIGS, isLanguageSupported } from '../constants/language-config';

export interface LanguageParams {
  targetLanguage: string;
  nativeLanguage: string;
}

/**
 * Default language pair (backward compatibility)
 */
export const DEFAULT_LANGUAGES: LanguageParams = {
  targetLanguage: 'pl',
  nativeLanguage: 'en'
};

/**
 * Extract and validate language parameters from request body
 * Falls back to defaults for backward compatibility
 */
export function extractLanguages(body: any): LanguageParams {
  const targetLanguage = body?.targetLanguage || DEFAULT_LANGUAGES.targetLanguage;
  const nativeLanguage = body?.nativeLanguage || DEFAULT_LANGUAGES.nativeLanguage;

  // Validate both languages are supported
  if (!isLanguageSupported(targetLanguage)) {
    console.warn(`[language] Unsupported target language: ${targetLanguage}, falling back to 'pl'`);
    return { targetLanguage: 'pl', nativeLanguage };
  }

  if (!isLanguageSupported(nativeLanguage)) {
    console.warn(`[language] Unsupported native language: ${nativeLanguage}, falling back to 'en'`);
    return { targetLanguage, nativeLanguage: 'en' };
  }

  // Prevent same language for both
  if (targetLanguage === nativeLanguage) {
    console.warn(`[language] Same language for target and native: ${targetLanguage}`);
    return DEFAULT_LANGUAGES;
  }

  return { targetLanguage, nativeLanguage };
}

/**
 * Extract language from user profile (for endpoints that don't receive language in body)
 */
export async function getProfileLanguages(
  supabase: any,
  userId: string
): Promise<LanguageParams> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('native_language, active_language')
    .eq('id', userId)
    .single();

  if (!profile) {
    return DEFAULT_LANGUAGES;
  }

  return {
    targetLanguage: profile.active_language || DEFAULT_LANGUAGES.targetLanguage,
    nativeLanguage: profile.native_language || DEFAULT_LANGUAGES.nativeLanguage
  };
}

/**
 * Validate language code is one of the 18 supported
 */
export function validateLanguageCode(code: string): boolean {
  return isLanguageSupported(code);
}

/**
 * Get language config or throw error
 */
export function requireLanguageConfig(code: string) {
  const config = LANGUAGE_CONFIGS[code];
  if (!config) {
    throw new Error(`Unsupported language code: ${code}`);
  }
  return config;
}
```

### 2. `utils/api-middleware.ts` Changes

**Add to exports:**

```typescript
// ADD: Re-export language helpers for convenient imports
export {
  extractLanguages,
  getProfileLanguages,
  DEFAULT_LANGUAGES
} from './language-helpers';
```

### Verification Checklist for Phase ML-4

- [ ] `utils/language-helpers.ts` created and compiles
- [ ] Export added to `utils/api-middleware.ts`
- [ ] All 18 language codes validate correctly
- [ ] Invalid language codes fall back to defaults
- [ ] Same-language pairs rejected
- [ ] Existing API endpoints still work

---

## Phase ML-5: Chat API Endpoints

**Goal:** Make chat.ts and chat-stream.ts language-agnostic.

**Risk:** Medium - core functionality, but uses prompt templates.

### Files to Modify

| File | Changes |
|------|---------|
| `api/chat.ts` | Import prompt templates, add language params |
| `api/chat-stream.ts` | Import prompt templates, add language params |

### 1. `api/chat.ts` Changes

**Before (lines 277-353) - COMMON_INSTRUCTIONS:**
```typescript
const COMMON_INSTRUCTIONS = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language.
...Polish-specific instructions...
`;
```

**After:**
```typescript
import { extractLanguages } from '../utils/api-middleware';
import { buildCupidSystemPrompt, buildVocabularyExtractionPrompt } from '../utils/prompt-templates';
import { getLanguageConfig } from '../constants/language-config';

// In handler:
const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
const targetConfig = getLanguageConfig(targetLanguage);
const nativeConfig = getLanguageConfig(nativeLanguage);

// Replace hardcoded COMMON_INSTRUCTIONS with:
const systemPrompt = buildCupidSystemPrompt(targetLanguage, nativeLanguage, mode);
```

**Before (lines 442-516) - generateCoachPrompt:**
```typescript
function generateCoachPrompt(partnerLog: string[], partnerProgress: any) {
  return `You are "Cupid" - helping a native Polish speaker teach their partner.
...Polish-specific content...
`;
}
```

**After:**
```typescript
function generateCoachPrompt(
  partnerLog: string[],
  partnerProgress: any,
  targetLanguage: string,
  nativeLanguage: string
) {
  const targetConfig = getLanguageConfig(targetLanguage);
  const nativeConfig = getLanguageConfig(nativeLanguage);

  return `You are "Cupid" - helping a native ${targetConfig.name} speaker teach their partner.

Your student is learning ${targetConfig.name} and speaks ${nativeConfig.name} natively.

## Partner's Vocabulary (use these in conversation)
${partnerLog.slice(0, 30).map(w => `- ${w}`).join('\n')}

## Partner's Progress
- Level: ${partnerProgress.level}
- Words learned: ${partnerProgress.wordsLearned}

## Your Role
- Suggest ${targetConfig.name} phrases to use in daily conversation
- Help explain ${targetConfig.name} grammar in ${nativeConfig.name}
- Provide teaching strategies
- Celebrate their partner's progress
`;
}
```

**Before (lines 598-662) - Schema with Polish conjugations:**
```typescript
conjugations: {
  type: Type.OBJECT,
  properties: {
    present: {
      type: Type.OBJECT,
      properties: {
        ja: { type: Type.STRING },
        ty: { type: Type.STRING },
        onOna: { type: Type.STRING },
        my: { type: Type.STRING },
        wy: { type: Type.STRING },
        oni: { type: Type.STRING }
      }
    }
  }
}
```

**After:**
```typescript
import { buildConjugationSchema } from '../utils/schema-builders';

// Dynamic schema based on language
const vocabularySchema = buildVocabularySchema(targetLanguage);

// Where buildVocabularySchema returns language-appropriate conjugation fields
// For Polish: ja, ty, onOna, my, wy, oni
// For Spanish: yo, tu, el, nosotros, vosotros, ellos
// For German: ich, du, erSieEs, wir, ihr, sie
```

### 2. `api/chat-stream.ts` Changes

**Before (lines 42-97) - buildSystemInstruction:**
```typescript
function buildSystemInstruction(mode: string, userLog: string[]): string {
  const COMMON = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language.
...
`;
  const MODES: Record<string, string> = {
    ask: `...Polish-specific ask mode...`,
    learn: `...Polish-specific learn mode...`
  };
}
```

**After:**
```typescript
import { extractLanguages } from '../utils/api-middleware';
import { buildCupidSystemPrompt } from '../utils/prompt-templates';

function buildSystemInstruction(
  mode: string,
  userLog: string[],
  targetLanguage: string,
  nativeLanguage: string
): string {
  // Use shared prompt templates
  const basePrompt = buildCupidSystemPrompt(targetLanguage, nativeLanguage, mode as any);

  // Add user's vocabulary context
  const vocabContext = userLog.length > 0
    ? `\n\nUser's vocabulary: [${userLog.slice(0, 30).join(', ')}]`
    : '';

  return basePrompt + vocabContext;
}

// In handler:
const { targetLanguage, nativeLanguage } = extractLanguages(body);
const systemInstruction = buildSystemInstruction(mode, userLog, targetLanguage, nativeLanguage);
```

### Verification Checklist for Phase ML-5

- [ ] `api/chat.ts` compiles without errors
- [ ] `api/chat-stream.ts` compiles without errors
- [ ] Chat works with `targetLanguage: 'pl', nativeLanguage: 'en'` (default)
- [ ] Chat works with `targetLanguage: 'es', nativeLanguage: 'en'` (new pair)
- [ ] AI responds in native language
- [ ] AI uses target language for vocabulary
- [ ] Vocabulary extraction uses correct schema for language

---

## Phase ML-6: Vocabulary API Endpoints

**Goal:** Make vocabulary-related APIs language-agnostic.

**Risk:** Medium - affects vocabulary extraction and validation.

### Files to Modify

| File | Changes |
|------|---------|
| `api/validate-word.ts` | Add language params, dynamic prompts |
| `api/validate-answer.ts` | Add language params, dynamic prompts |
| `api/analyze-history.ts` | Add language params, dynamic schema |

### 1. `api/validate-word.ts` Changes

**Before (lines 54-138) - Polish-specific prompt:**
```typescript
const { polish, english, lightweight } = req.body as ValidateWordRequest;

if (!polish) {
  return res.status(400).json({ error: 'Missing polish word' });
}

const prompt = generateMode
  ? `You are a Polish language expert. Translate this Polish word/phrase to English...`
  : `You are a Polish language expert. Validate and enrich this Polish word/phrase...`;
```

**After:**
```typescript
import { extractLanguages } from '../utils/api-middleware';
import { buildWordValidationPrompt } from '../utils/prompt-templates';
import { getLanguageConfig } from '../constants/language-config';

interface ValidateWordRequest {
  word: string;           // Was: polish
  translation?: string;   // Was: english
  targetLanguage?: string;
  nativeLanguage?: string;
  lightweight?: boolean;
}

// In handler:
const { word, translation, targetLanguage: tl, nativeLanguage: nl, lightweight } = req.body;

// Support both old and new param names
const targetWord = word || req.body.polish;
const nativeTranslation = translation || req.body.english;

const { targetLanguage, nativeLanguage } = extractLanguages({
  targetLanguage: tl,
  nativeLanguage: nl
});

if (!targetWord) {
  return res.status(400).json({ error: 'Missing word' });
}

const targetConfig = getLanguageConfig(targetLanguage);
const nativeConfig = getLanguageConfig(nativeLanguage);

const prompt = buildWordValidationPrompt(targetLanguage, nativeLanguage)
  + `\n\nInput:\n- ${targetConfig.name}: "${targetWord}"${
    nativeTranslation ? `\n- ${nativeConfig.name}: "${nativeTranslation}"` : ''
  }`;

// Update response to use generic field names
return res.status(200).json({
  success: true,
  validated: {
    word: validated.word,           // Was: polish-specific
    translation: validated.translation,
    word_type: validated.word_type,
    // ...
  }
});
```

**Before (lines 169-205) - Schema with Polish fields:**
```typescript
const fullSchema = {
  type: Type.OBJECT,
  properties: {
    // ...
    conjugations: {
      properties: {
        present: {
          properties: {
            ja: { type: Type.STRING },
            ty: { type: Type.STRING },
            on_ona_ono: { type: Type.STRING },
            my: { type: Type.STRING },
            wy: { type: Type.STRING },
            oni_one: { type: Type.STRING }
          }
        }
      }
    },
    gender: { type: Type.STRING, enum: ["masculine", "feminine", "neuter"] },
    // ...
  }
};
```

**After:**
```typescript
import { buildVocabularySchema } from '../utils/schema-builders';

// Dynamic schema based on target language
const schema = lightweight
  ? buildLightweightSchema()
  : buildVocabularySchema(targetLanguage);
```

### 2. `api/validate-answer.ts` Changes

**Before (lines 14-18):**
```typescript
interface ValidateAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  polishWord?: string;
  wordType?: string;
  direction?: 'polish_to_english' | 'english_to_polish';
}
```

**After:**
```typescript
interface ValidateAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  targetWord?: string;      // Was: polishWord
  wordType?: string;
  direction?: 'target_to_native' | 'native_to_target';
  targetLanguage?: string;
  nativeLanguage?: string;
  // Backward compatibility
  polishWord?: string;
}
```

**Before (lines 106-124) - Polish-specific prompt:**
```typescript
const prompt = `You are validating answers for a Polish language learning app.

Expected: "${correctAnswer}"
User typed: "${userAnswer}"${contextInfo}${directionInfo}

ACCEPT if ANY apply:
- Exact match (ignoring case)
- Missing Polish diacritics (dzis=dziś, zolw=żółw, cie=cię, zolty=żółty)
...`;
```

**After:**
```typescript
import { extractLanguages } from '../utils/api-middleware';
import { buildAnswerValidationPrompt } from '../utils/prompt-templates';
import { getLanguageConfig } from '../constants/language-config';

// In handler:
const { targetLanguage, nativeLanguage } = extractLanguages(req.body);
const targetConfig = getLanguageConfig(targetLanguage);

// Support both old and new param names
const targetWord = req.body.targetWord || req.body.polishWord;

const prompt = buildAnswerValidationPrompt(targetLanguage, nativeLanguage)
  + `\n\nExpected: "${correctAnswer}"
User typed: "${userAnswer}"
${targetWord ? `${targetConfig.name} word: "${targetWord}"` : ''}
${direction ? `Direction: ${direction === 'target_to_native' ? `${targetConfig.name} → ${nativeConfig.name}` : `${nativeConfig.name} → ${targetConfig.name}`}` : ''}

Accept if:
- Missing diacritics (${targetConfig.specialChars.slice(0, 5).join(', ')} → base letters)
- Valid synonym
- Minor typo (1-2 chars)`;
```

### 3. `api/analyze-history.ts` Changes

**Before (lines 84-136) - Polish-specific extraction prompt:**
```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `TASK: Polish Vocabulary Extractor - COMPLETE DATA REQUIRED

Extract Polish vocabulary from the chat history...

FOR VERBS:
- "word": Use INFINITIVE form (e.g., "jeść" not "jem")
- "conjugations": REQUIRED - present tense with ALL 6 persons:
  { present: { ja: "jem", ty: "jesz", onOna: "je", my: "jemy", wy: "jecie", oni: "jedzą" } }
...`,
```

**After:**
```typescript
import { extractLanguages } from '../utils/api-middleware';
import { buildVocabularyExtractionPrompt, buildGrammarExtractionNotes } from '../utils/prompt-templates';
import { buildVocabularySchema } from '../utils/schema-builders';
import { getLanguageConfig } from '../constants/language-config';

// In handler:
const { targetLanguage, nativeLanguage } = extractLanguages(body);
const targetConfig = getLanguageConfig(targetLanguage);

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: buildVocabularyExtractionPrompt(targetLanguage, nativeLanguage)
    + `\n\n${knownContext}\n\nCHAT HISTORY:\n${historyText}`,
  config: {
    responseMimeType: "application/json",
    responseSchema: buildVocabularySchema(targetLanguage)
  }
});
```

### New File: `utils/schema-builders.ts`

```typescript
/**
 * Dynamic JSON Schema Builders for Language-Specific Data
 *
 * Builds Gemini response schemas based on the target language's grammar.
 */

import { Type } from "@google/genai";
import { getLanguageConfig, LANGUAGE_CONFIGS } from '../constants/language-config';

/**
 * Build conjugation schema based on language
 */
export function buildConjugationSchema(languageCode: string) {
  const config = getLanguageConfig(languageCode);
  if (!config || !config.grammar.conjugationPersons) {
    return null;
  }

  // Map language-specific person labels to schema properties
  const persons = config.grammar.conjugationPersons;
  const properties: Record<string, any> = {};

  // Use consistent keys across languages
  const personKeys = ['first_singular', 'second_singular', 'third_singular',
                      'first_plural', 'second_plural', 'third_plural'];

  persons.forEach((label, i) => {
    properties[personKeys[i]] = {
      type: Type.STRING,
      description: `${label} form`
    };
  });

  return {
    type: Type.OBJECT,
    properties: {
      present: {
        type: Type.OBJECT,
        properties,
        required: personKeys
      }
    }
  };
}

/**
 * Build full vocabulary extraction schema for a language
 */
export function buildVocabularySchema(languageCode: string) {
  const config = getLanguageConfig(languageCode);

  const baseProperties = {
    word: { type: Type.STRING },
    translation: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
    importance: { type: Type.INTEGER },
    pronunciation: { type: Type.STRING },
    proTip: { type: Type.STRING },
    examples: { type: Type.ARRAY, items: { type: Type.STRING } }
  };

  // Add gender if language has grammatical gender
  if (config?.grammar.hasGender) {
    baseProperties['gender'] = {
      type: Type.STRING,
      enum: config.grammar.genderTypes
    };
  }

  // Add plural
  baseProperties['plural'] = { type: Type.STRING };

  // Add conjugations if language has verb conjugation
  if (config?.grammar.hasConjugation) {
    baseProperties['conjugations'] = buildConjugationSchema(languageCode);
  }

  return {
    type: Type.OBJECT,
    properties: {
      newWords: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: baseProperties,
          required: ["word", "translation", "type", "importance", "examples", "proTip"]
        }
      }
    },
    required: ["newWords"]
  };
}

/**
 * Build lightweight schema (no grammar details)
 */
export function buildLightweightSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      translation: { type: Type.STRING },
      word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
      pronunciation: { type: Type.STRING },
      was_corrected: { type: Type.BOOLEAN },
      correction_note: { type: Type.STRING }
    },
    required: ["word", "translation", "word_type", "was_corrected"]
  };
}
```

### Verification Checklist for Phase ML-6

- [ ] `api/validate-word.ts` compiles
- [ ] `api/validate-answer.ts` compiles
- [ ] `api/analyze-history.ts` compiles
- [ ] `utils/schema-builders.ts` created and compiles
- [ ] Word validation works for Polish (backward compatible)
- [ ] Word validation works for Spanish (new)
- [ ] Answer validation accepts missing diacritics per language
- [ ] Vocabulary extraction returns correct schema per language

---

## Phase ML-7: Voice & Transcription APIs

**Goal:** Make voice mode and transcription language-agnostic.

**Risk:** High - complex integration with external services (Gemini Live, Gladia).

### Files to Modify

| File | Changes |
|------|---------|
| `api/tts.ts` | Accept languageCode, use language config for voice |
| `api/gladia-token.ts` | Accept languages array, configure per pair |
| `api/live-token.ts` | Accept language params, use prompt templates |
| `services/audio.ts` | Rename functions, accept language param |

### 1. `api/tts.ts` Changes

**Before (lines 37-48):**
```typescript
body: JSON.stringify({
  input: { text },
  voice: {
    languageCode: 'pl-PL',
    name: 'pl-PL-Standard-A', // Female Polish voice
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 0.9,
    pitch: 0.0,
  },
}),
```

**After:**
```typescript
import { extractLanguages } from '../utils/api-middleware';
import { getTTSVoice, getTTSLangCode } from '../constants/language-config';

// In handler, parse language from body:
const { text, languageCode } = body || {};
const targetLanguage = languageCode || 'pl'; // Default to Polish for backward compat

// Use language config for voice settings
const voiceCode = getTTSVoice(targetLanguage);
const langCode = getTTSLangCode(targetLanguage);

body: JSON.stringify({
  input: { text },
  voice: {
    languageCode: langCode,    // Dynamic: 'pl-PL', 'es-ES', etc.
    name: voiceCode,           // Dynamic: 'pl-PL-Standard-A', 'es-ES-Standard-A', etc.
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 0.9,
    pitch: 0.0,
  },
}),
```

**Before (line 135) - Cache path:**
```typescript
const fileName = `pl/${cacheKey}.mp3`;
```

**After:**
```typescript
const fileName = `${targetLanguage}/${cacheKey}.mp3`;
```

### 2. `api/gladia-token.ts` Changes

**Before (lines 74-85):**
```typescript
body: JSON.stringify({
  // ...
  language_config: {
    languages: ['pl', 'en'],  // Detect both Polish and English
    code_switching: true,
  },
  realtime_processing: {
    translation: true,
    translation_config: {
      target_languages: ['en'],
    },
  },
  // ...
}),
```

**After:**
```typescript
import { extractLanguages, getProfileLanguages } from '../utils/api-middleware';
import { getGladiaCode } from '../constants/language-config';

// In handler, get language from profile or body:
const body = req.body || {};
let targetLanguage = body.targetLanguage;
let nativeLanguage = body.nativeLanguage;

// If not provided, get from profile
if (!targetLanguage || !nativeLanguage) {
  const profileLangs = await getProfileLanguages(supabase, auth.userId);
  targetLanguage = targetLanguage || profileLangs.targetLanguage;
  nativeLanguage = nativeLanguage || profileLangs.nativeLanguage;
}

const targetGladiaCode = getGladiaCode(targetLanguage);
const nativeGladiaCode = getGladiaCode(nativeLanguage);

body: JSON.stringify({
  // ...
  language_config: {
    languages: [targetLanguage, nativeLanguage],  // Dynamic language pair
    code_switching: true,
  },
  realtime_processing: {
    translation: true,
    translation_config: {
      target_languages: [nativeLanguage],  // Translate to native language
    },
  },
  // ...
}),
```

### 3. `api/live-token.ts` Changes

**Before (lines 64-119) - buildVoiceSystemInstruction:**
```typescript
function buildVoiceSystemInstruction(mode: string, userLog: string[]): string {
  const COMMON = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language.
...
`;
}
```

**After:**
```typescript
import { extractLanguages, getProfileLanguages } from '../utils/api-middleware';
import { getLanguageConfig, getLanguageName } from '../constants/language-config';

function buildVoiceSystemInstruction(
  mode: string,
  userLog: string[],
  targetLanguage: string,
  nativeLanguage: string
): string {
  const targetConfig = getLanguageConfig(targetLanguage);
  const nativeConfig = getLanguageConfig(nativeLanguage);

  const COMMON = `
You are "Cupid" - a warm, encouraging ${targetConfig.name} language companion helping someone learn their partner's native language.
Every word they learn is a gift of love.

VOICE INTERACTION RULES - ${nativeConfig.name.toUpperCase()} FIRST:
- ALWAYS speak primarily in ${nativeConfig.name} - this is a beginner-friendly conversation
- Explain concepts and context in ${nativeConfig.name} first, then introduce ${targetConfig.name} words/phrases
- Pattern: ${nativeConfig.name} explanation → ${targetConfig.name} word → pronunciation tip
- Keep responses concise for voice (2-4 sentences max)
- Be encouraging and supportive

Known vocabulary: [${userLog.slice(0, 20).join(', ')}]
`;

  return COMMON;
}
```

**Before (lines 22-62) - buildConversationSystemInstruction:**
```typescript
function buildConversationSystemInstruction(scenario: ConversationScenario, userName: string): string {
  return `
You are playing the role described below in a Polish language practice conversation.
...
1. **SPEAK ONLY IN POLISH** - This is the most important rule.
...
`;
}
```

**After:**
```typescript
function buildConversationSystemInstruction(
  scenario: ConversationScenario,
  userName: string,
  targetLanguage: string
): string {
  const targetConfig = getLanguageConfig(targetLanguage);

  return `
You are playing the role described below in a ${targetConfig.name} language practice conversation.

## Your Role
${scenario.persona}

## Scenario Context
${scenario.context}

## CRITICAL RULES - FOLLOW EXACTLY:

1. **SPEAK ONLY IN ${targetConfig.name.toUpperCase()}** - This is the most important rule. Default to ${targetConfig.name} for everything.

2. **STAY IN CHARACTER** - Do not break character unless the user is completely stuck.

3. **KEEP RESPONSES SHORT** - Use 1-3 sentences maximum. This is a conversation, not a lecture.

4. **ADJUST TO USER'S LEVEL** - This scenario is marked as ${scenario.difficulty}. Keep your ${targetConfig.name} appropriate.

5. **BE ENCOURAGING** - The user's name is ${userName}. They are learning ${targetConfig.name} to connect with someone they love. Be patient and supportive.

## START THE CONVERSATION
Begin speaking in ${targetConfig.name}, appropriate to your role. Start with a greeting and opening question/statement.
`;
}

// In handler, extract languages:
const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, auth.userId);

// Override with body params if provided
const finalTargetLanguage = body.targetLanguage || targetLanguage;
const finalNativeLanguage = body.nativeLanguage || nativeLanguage;

if (mode === 'conversation' && sanitizedScenario) {
  systemInstruction = buildConversationSystemInstruction(
    sanitizedScenario,
    sanitizedUserName,
    finalTargetLanguage
  );
} else {
  systemInstruction = buildVoiceSystemInstruction(
    mode,
    sanitizedUserLog,
    finalTargetLanguage,
    finalNativeLanguage
  );
}
```

### 4. `services/audio.ts` Changes

**Before:**
```typescript
export const speakPolish = async (text: string, rate: number = 0.85): Promise<void> => {
  // ...
};

export const getPolishVoices = (): SpeechSynthesisVoice[] => {
  return speechSynthesis.getVoices().filter(voice =>
    voice.lang.startsWith('pl')
  );
};

const fallbackSpeakPolish = (text: string, rate: number = 0.85): void => {
  utterance.lang = 'pl-PL';
  // ...
};
```

**After:**
```typescript
import { getTTSLangCode, isLanguageSupported } from '../constants/language-config';

/**
 * Speak text in any supported language
 * Falls back to browser TTS if API fails
 */
export const speakText = async (
  text: string,
  languageCode: string = 'pl',
  rate: number = 0.85
): Promise<void> => {
  if (!text || !text.trim()) {
    console.warn('[audio] Empty text provided');
    return;
  }

  try {
    const headers = await getAuthHeaders();

    if (!headers.Authorization || headers.Authorization === 'Bearer ') {
      fallbackSpeak(text, languageCode, rate);
      return;
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: text.trim(),
        languageCode  // NEW: Pass language to API
      })
    });

    if (!response.ok) {
      console.warn('[audio] TTS API error:', response.status);
      fallbackSpeak(text, languageCode, rate);
      return;
    }

    const data = await response.json();
    if (data.url) {
      await playAudio(data.url);
    } else if (data.audioData) {
      await playAudio(undefined, data.audioData);
    } else {
      fallbackSpeak(text, languageCode, rate);
    }

  } catch (error) {
    console.warn('[audio] TTS failed, using fallback:', error);
    fallbackSpeak(text, languageCode, rate);
  }
};

// Backward compatibility alias
export const speakPolish = (text: string, rate?: number) => speakText(text, 'pl', rate);

/**
 * Get voices for a specific language (browser fallback)
 */
export const getVoicesForLanguage = (languageCode: string): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  const langCode = getTTSLangCode(languageCode).split('-')[0]; // 'pl-PL' -> 'pl'
  return speechSynthesis.getVoices().filter(voice =>
    voice.lang.startsWith(langCode)
  );
};

// Backward compatibility alias
export const getPolishVoices = () => getVoicesForLanguage('pl');

/**
 * Fallback: Browser Web Speech API for any language
 */
const fallbackSpeak = (text: string, languageCode: string, rate: number = 0.85): void => {
  if (!isSpeechSupported()) {
    console.warn('[audio] Speech synthesis not supported');
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getTTSLangCode(languageCode);  // Dynamic: 'pl-PL', 'es-ES', etc.
  utterance.rate = rate;

  const voices = getVoicesForLanguage(languageCode);
  if (voices.length > 0) {
    const preferredVoice = voices.find(v => v.name.toLowerCase().includes('female'))
      || voices[0];
    utterance.voice = preferredVoice;
  }

  speechSynthesis.speak(utterance);
};

// Keep old function name as alias for backward compatibility
const fallbackSpeakPolish = (text: string, rate: number) => fallbackSpeak(text, 'pl', rate);
```

### Verification Checklist for Phase ML-7

- [ ] `api/tts.ts` accepts languageCode parameter
- [ ] `api/gladia-token.ts` configures dynamic language pair
- [ ] `api/live-token.ts` uses language-aware prompts
- [ ] `services/audio.ts` speaks any supported language
- [ ] TTS caches audio in language-specific folders
- [ ] Voice mode prompts use correct language names
- [ ] Browser fallback uses correct language code
- [ ] Backward compatibility maintained (default to Polish)

---

## Phase ML-8: Game & Challenge APIs

**Goal:** Make game generation and challenge APIs language-agnostic.

**Risk:** Medium - affects level tests and tutor challenges.

### Files to Modify

| File | Changes |
|------|---------|
| `api/generate-level-test.ts` | Language-aware test generation |
| `api/submit-level-test.ts` | Language-aware validation |
| `api/create-challenge.ts` | Add language_code to challenges |
| `api/submit-challenge.ts` | Language-aware answer validation |

### 1. `api/generate-level-test.ts` Changes

**Before (lines 33-136) - LEVEL_THEMES with Polish examples:**
```typescript
const LEVEL_THEMES: Record<string, LevelTheme> = {
  'Beginner 1->2': {
    name: 'First Words of Love',
    description: 'The most essential words to start connecting with your partner',
    concepts: ['hello/hi', 'I love you', ...],
    polishExamples: ['cześć', 'kocham cię', ...]
  },
  // ... all Polish-specific
};
```

**After:**
```typescript
import { extractLanguages, getProfileLanguages } from '../utils/api-middleware';
import { getLanguageConfig, getExamplePhrase } from '../constants/language-config';

// Language-agnostic theme structure
interface LevelTheme {
  name: string;
  description: string;
  concepts: string[];  // Universal concepts in English
  // Examples generated dynamically based on target language
}

const LEVEL_THEMES: Record<string, LevelTheme> = {
  'Beginner 1->2': {
    name: 'First Words of Love',
    description: 'The most essential words to start connecting with your partner',
    concepts: ['hello', 'I love you', 'good morning', 'good night', 'thank you', 'please', 'yes', 'no']
  },
  'Beginner 2->3': {
    name: 'Checking In',
    description: 'Simple questions to show you care about their day',
    concepts: ['how are you?', 'are you okay?', "what's wrong?", "I'm fine", "I'm good", 'and you?']
  },
  // ... rest of themes with universal concepts only
};

// Generate examples dynamically
function getExamplesForTheme(theme: LevelTheme, targetLanguage: string): string[] {
  // AI generates examples based on concepts and language
  // This happens in the Gemini prompt, not hardcoded
  return []; // Placeholder - actual examples come from AI
}

// In handler:
const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, auth.userId);
const targetConfig = getLanguageConfig(targetLanguage);

// Updated prompt to be language-agnostic:
const prompt = `You are generating a level-up test for a ${targetConfig.name} language learning app designed for couples.

## Test Context
- Transition: ${fromLevel} -> ${toLevel}
- Theme: "${theme.name}"
- Description: ${theme.description}
- Target Language: ${targetConfig.name}
- Native Language: ${nativeConfig.name}

## Core Concepts to Test (generate ${coreQuestionCount} questions):
${theme.concepts.map((c, i) => `${i + 1}. "${c}" (translate to ${targetConfig.name})`).join('\n')}

## Requirements
- Generate all questions in ${targetConfig.name}
- Use ${nativeConfig.name} for instructions and hints
- Test vocabulary, grammar, and comprehension appropriate for ${targetConfig.name}
- Include ${targetConfig.name}-specific grammar points (${
  targetConfig.grammar.hasCases ? `cases, ` : ''
}${targetConfig.grammar.hasGender ? `gender, ` : ''
}conjugation)

Generate the test questions now.`;
```

### 2. `api/create-challenge.ts` Changes

**Before:**
```typescript
const { error: insertError } = await supabase
  .from('tutor_challenges')
  .insert({
    id: challengeId,
    tutor_id: auth.userId,
    student_id: studentId,
    type: challengeType,
    title,
    words: challengeWords,
    // ...
  });
```

**After:**
```typescript
import { getProfileLanguages } from '../utils/api-middleware';

// In handler:
const { targetLanguage, nativeLanguage } = await getProfileLanguages(supabase, auth.userId);

const { error: insertError } = await supabase
  .from('tutor_challenges')
  .insert({
    id: challengeId,
    tutor_id: auth.userId,
    student_id: studentId,
    type: challengeType,
    title,
    words: challengeWords,
    language_code: targetLanguage,  // NEW: Save language with challenge
    // ...
  });
```

### 3. `api/submit-challenge.ts` Changes

**Before:**
```typescript
// Validate answers with Polish-specific handling
const prompt = `Validate these answers for a Polish language quiz...`;
```

**After:**
```typescript
import { buildAnswerValidationPrompt } from '../utils/prompt-templates';
import { getLanguageConfig } from '../constants/language-config';

// In handler, get language from challenge:
const { data: challenge } = await supabase
  .from('tutor_challenges')
  .select('*, language_code')
  .eq('id', challengeId)
  .single();

const targetLanguage = challenge.language_code || 'pl';
const { nativeLanguage } = await getProfileLanguages(supabase, auth.userId);

// Use language-aware validation
const prompt = buildAnswerValidationPrompt(targetLanguage, nativeLanguage)
  + `\n\nValidate these ${challenge.words.length} answers:
${answers.map((a, i) => `${i+1}. Expected: "${challenge.words[i].word}" | User: "${a}"`).join('\n')}`;
```

### Verification Checklist for Phase ML-8

- [ ] `api/generate-level-test.ts` generates tests for any language
- [ ] `api/submit-level-test.ts` validates answers per language
- [ ] `api/create-challenge.ts` saves language_code
- [ ] `api/submit-challenge.ts` validates with correct language
- [ ] Level themes work without Polish examples
- [ ] Test questions use target language correctly
- [ ] Backward compatibility: existing Polish challenges still work

---

## Phase ML-9: Frontend Core Components

**Goal:** Update core UI components to handle any language pair.

**Risk:** High - affects user-facing behavior across the app.

### Files to Modify

| File | Changes |
|------|---------|
| `components/ChatArea.tsx` | Use language context, dynamic flags |
| `components/LoveLog.tsx` | Filter by language_code |
| `components/Progress.tsx` | Show language in progress |
| `services/validation.ts` | Dynamic diacritic arrays |

### 1. `components/ChatArea.tsx` Changes

**Before - Polish flag hardcoded:**
```typescript
// Somewhere in the component
<span className="text-lg">🇵🇱</span>
```

**After:**
```typescript
import { useLanguage } from '../context/LanguageContext';
import { getLanguageFlag, getLanguageName } from '../constants/language-config';

const ChatArea: React.FC<Props> = ({ profile }) => {
  const { targetLanguage, nativeLanguage } = useLanguage();
  const targetFlag = getLanguageFlag(targetLanguage);
  const targetName = getLanguageName(targetLanguage);

  // Use dynamic flag
  <span className="text-lg">{targetFlag}</span>
  <span className="text-sm">{targetName}</span>
};
```

**Before - Chat API call without language:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    mode,
    message,
    history
  })
});
```

**After:**
```typescript
const { targetLanguage, nativeLanguage } = useLanguage();

const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    mode,
    message,
    history,
    targetLanguage,   // NEW
    nativeLanguage    // NEW
  })
});
```

### 2. `components/LoveLog.tsx` Changes

**Before - No language filter:**
```typescript
const { data: words } = await supabase
  .from('dictionary')
  .select('*')
  .eq('user_id', profile.id)
  .order('created_at', { ascending: false });
```

**After:**
```typescript
import { useLanguage } from '../context/LanguageContext';

const LoveLog: React.FC<Props> = ({ profile }) => {
  const { targetLanguage } = useLanguage();

  // Filter by current target language
  const { data: words } = await supabase
    .from('dictionary')
    .select('*')
    .eq('user_id', profile.id)
    .eq('language_code', targetLanguage)  // NEW: Filter by language
    .order('created_at', { ascending: false });
};
```

### 3. New File: `context/LanguageContext.tsx`

```typescript
/**
 * Language Context - Global Language State
 *
 * Provides current language pair to all components.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { LanguageCode } from '../types';

interface LanguageContextType {
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  setTargetLanguage: (code: LanguageCode) => Promise<void>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  targetLanguage: 'pl',
  nativeLanguage: 'en',
  setTargetLanguage: async () => {},
  loading: true
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  userId?: string;
}> = ({ children, userId }) => {
  const [targetLanguage, setTargetLang] = useState<LanguageCode>('pl');
  const [nativeLanguage, setNativeLang] = useState<LanguageCode>('en');
  const [loading, setLoading] = useState(true);

  // Load languages from profile
  useEffect(() => {
    async function loadLanguages() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('native_language, active_language')
        .eq('id', userId)
        .single();

      if (profile) {
        setTargetLang(profile.active_language || 'pl');
        setNativeLang(profile.native_language || 'en');
      }
      setLoading(false);
    }

    loadLanguages();
  }, [userId]);

  // Update target language in profile
  const setTargetLanguage = async (code: LanguageCode) => {
    if (!userId) return;

    setTargetLang(code);

    await supabase
      .from('profiles')
      .update({ active_language: code })
      .eq('id', userId);
  };

  return (
    <LanguageContext.Provider value={{
      targetLanguage,
      nativeLanguage,
      setTargetLanguage,
      loading
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

### 4. `services/validation.ts` Changes

**Before:**
```typescript
// Polish diacritics hardcoded
const POLISH_DIACRITICS = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'];

export function normalizeDiacritics(text: string): string {
  // Polish-specific normalization
}
```

**After:**
```typescript
import { getSpecialChars } from '../constants/language-config';

/**
 * Normalize answer for comparison (language-agnostic)
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove all diacritics
}

/**
 * Check if answer is acceptable with diacritics tolerance
 */
export function isAnswerAcceptable(
  userAnswer: string,
  correctAnswer: string,
  languageCode?: string
): boolean {
  // Exact match (case-insensitive)
  if (userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
    return true;
  }

  // Diacritic-normalized match
  if (normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
    return true;
  }

  return false;
}

// Backward compatibility
export const POLISH_DIACRITICS = getSpecialChars('pl');
```

### Verification Checklist for Phase ML-9

- [ ] `LanguageContext` created and working
- [ ] `ChatArea.tsx` uses language context
- [ ] `LoveLog.tsx` filters by language_code
- [ ] API calls include language parameters
- [ ] Dynamic flags display correctly
- [ ] `services/validation.ts` works for any language
- [ ] App works with Polish (backward compatible)
- [ ] App works with Spanish (new language)

---

## Phase ML-10: Frontend Game Components

**Goal:** Update game components to handle any language pair.

**Risk:** High - affects core learning experience.

### Files to Modify

| File | Changes |
|------|---------|
| `components/FlashcardGame.tsx` | Language-aware games |
| `components/ConversationPractice.tsx` | Dynamic scenarios |
| `constants/conversation-scenarios.ts` | Language-agnostic scenarios |

### 1. `components/FlashcardGame.tsx` Changes

**Before (line 22-24):**
```typescript
type TypeItDirection = 'polish_to_english' | 'english_to_polish';
type VerbPerson = 'ja' | 'ty' | 'onOna' | 'my' | 'wy' | 'oni';
```

**After:**
```typescript
import { useLanguage } from '../context/LanguageContext';
import { TranslationDirection } from '../types';
import { getLanguageConfig } from '../constants/language-config';

// Use generic direction type
type TypeItDirection = TranslationDirection;

// Verb persons are now dynamic based on language
interface VerbPersonConfig {
  key: string;
  label: string;
  english: string;
}

function getVerbPersons(languageCode: string): VerbPersonConfig[] {
  const config = getLanguageConfig(languageCode);
  if (!config?.grammar.conjugationPersons) return [];

  const englishLabels = ['I', 'you (singular)', 'he/she', 'we', 'you (plural)', 'they'];

  return config.grammar.conjugationPersons.map((label, i) => ({
    key: `person_${i}`,
    label,
    english: englishLabels[i] || label
  }));
}
```

**Before (lines 35-42) - VERB_PERSONS hardcoded:**
```typescript
const VERB_PERSONS: { key: VerbPerson; label: string; english: string }[] = [
  { key: 'ja', label: 'ja', english: 'I' },
  { key: 'ty', label: 'ty', english: 'you (singular)' },
  { key: 'onOna', label: 'on/ona', english: 'he/she' },
  { key: 'my', label: 'my', english: 'we' },
  { key: 'wy', label: 'wy', english: 'you (plural)' },
  { key: 'oni', label: 'oni', english: 'they' }
];
```

**After:**
```typescript
const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
  const { targetLanguage, nativeLanguage } = useLanguage();
  const VERB_PERSONS = getVerbPersons(targetLanguage);

  // ... rest of component
};
```

**Before - TTS call:**
```typescript
import { speakPolish } from '../services/audio';

// Usage
speakPolish(word.word);
```

**After:**
```typescript
import { speakText } from '../services/audio';

// Usage
speakText(word.word, targetLanguage);
```

**Before - API validate call:**
```typescript
const response = await fetch('/api/validate-answer', {
  body: JSON.stringify({
    userAnswer,
    correctAnswer,
    polishWord,
    direction: 'polish_to_english'
  })
});
```

**After:**
```typescript
const response = await fetch('/api/validate-answer', {
  body: JSON.stringify({
    userAnswer,
    correctAnswer,
    targetWord: word.word,
    direction: direction === 'target_to_native' ? 'target_to_native' : 'native_to_target',
    targetLanguage,
    nativeLanguage
  })
});
```

### 2. `constants/conversation-scenarios.ts` Changes

**Before - All scenarios are Warsaw/Polish-specific:**
```typescript
export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: 'cafe',
    name: 'At the Cafe',
    icon: '☕',
    description: 'Order coffee and a snack',
    persona: 'You are a friendly Polish barista at a cozy cafe in Warsaw...',
    context: 'The customer wants to order coffee...',
    difficulty: 'beginner',
    starterPhrases: ['Dzien dobry!', 'Co podac?', 'Mamy swietna kawe.']
  },
  // ... all Polish
];
```

**After - Language-agnostic scenarios:**
```typescript
import { getLanguageConfig, getExamplePhrase, getLanguageName } from './language-config';

export interface ConversationScenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  personaTemplate: string;  // Template with {language} placeholder
  contextTemplate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Universal scenarios that work for any language
export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: 'cafe',
    name: 'At the Cafe',
    icon: '☕',
    description: 'Order coffee and a snack',
    personaTemplate: 'You are a friendly {language} barista at a cozy cafe. You are warm, patient, and enjoy chatting with customers.',
    contextTemplate: 'The customer wants to order coffee and perhaps a pastry. Help them navigate the menu and make recommendations.',
    difficulty: 'beginner'
  },
  {
    id: 'restaurant',
    name: 'Restaurant Dinner',
    icon: '🍽️',
    description: 'Order a meal and ask for recommendations',
    personaTemplate: 'You are a professional {language} waiter at a nice restaurant. You are helpful, knowledgeable about the menu, and provide excellent service.',
    contextTemplate: 'Take the order, recommend dishes, describe ingredients, and handle the bill. Be helpful but authentic.',
    difficulty: 'intermediate'
  },
  {
    id: 'market',
    name: 'At the Market',
    icon: '🍎',
    description: 'Buy fruits and vegetables',
    personaTemplate: 'You are a friendly {language} vendor at a farmers market. You are proud of your produce and love helping customers find the best items.',
    contextTemplate: 'Help the customer buy fruits and vegetables. Discuss freshness, prices, and make suggestions.',
    difficulty: 'beginner'
  },
  {
    id: 'taxi',
    name: 'Taxi Ride',
    icon: '🚕',
    description: 'Give directions and chat with the driver',
    personaTemplate: 'You are a chatty {language} taxi driver who knows the city well. You enjoy making small talk and sharing stories about the area.',
    contextTemplate: 'Pick up the passenger and ask where they want to go. Chat about the destination, traffic, and local life.',
    difficulty: 'intermediate'
  },
  {
    id: 'pharmacy',
    name: 'At the Pharmacy',
    icon: '💊',
    description: 'Ask for medicine and describe symptoms',
    personaTemplate: 'You are a helpful {language} pharmacist. You are professional, caring, and want to help the customer find the right medicine.',
    contextTemplate: 'Ask about symptoms, recommend appropriate over-the-counter medicine, and give instructions for use.',
    difficulty: 'intermediate'
  },
  {
    id: 'hotel',
    name: 'Hotel Check-in',
    icon: '🏨',
    description: 'Check in and ask about amenities',
    personaTemplate: 'You are a professional {language} hotel receptionist. You are courteous, efficient, and helpful with information.',
    contextTemplate: 'Help the guest check in, explain hotel amenities, and answer questions about the area.',
    difficulty: 'beginner'
  },
  {
    id: 'family_dinner',
    name: 'Family Dinner',
    icon: '👨‍👩‍👧',
    description: "Meet your partner's parents",
    personaTemplate: "You are a {language} parent meeting your child's foreign partner for the first time. You are curious, welcoming, but want to learn about this person.",
    contextTemplate: 'Make small talk, ask about their life, where they are from, what they do for work, and how they met your child.',
    difficulty: 'advanced'
  },
  {
    id: 'train_station',
    name: 'Train Station',
    icon: '🚂',
    description: 'Buy tickets and ask about schedules',
    personaTemplate: 'You are a {language} train station ticket clerk. You are efficient and helpful, but busy with many customers.',
    contextTemplate: 'Help the customer buy tickets, explain schedules, platforms, and connections.',
    difficulty: 'intermediate'
  }
];

/**
 * Get scenario with language-specific persona
 */
export function getLocalizedScenario(
  scenarioId: string,
  targetLanguage: string
): ConversationScenario & { persona: string; context: string } | null {
  const scenario = CONVERSATION_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return null;

  const languageName = getLanguageName(targetLanguage);

  return {
    ...scenario,
    persona: scenario.personaTemplate.replace('{language}', languageName),
    context: scenario.contextTemplate.replace('{language}', languageName)
  };
}
```

### 3. `components/ConversationPractice.tsx` Changes

**Before:**
```typescript
import { CONVERSATION_SCENARIOS } from '../constants/conversation-scenarios';

// Direct use of scenarios with Polish personas
```

**After:**
```typescript
import { CONVERSATION_SCENARIOS, getLocalizedScenario } from '../constants/conversation-scenarios';
import { useLanguage } from '../context/LanguageContext';

const ConversationPractice: React.FC<Props> = ({ profile, onExit }) => {
  const { targetLanguage, nativeLanguage } = useLanguage();

  // Get localized scenario when starting
  const handleStartScenario = (scenarioId: string) => {
    const localizedScenario = getLocalizedScenario(scenarioId, targetLanguage);
    if (!localizedScenario) return;

    // Start with language-specific scenario
    startConversation(localizedScenario);
  };

  // Pass language to API
  const startConversation = async (scenario: any) => {
    const response = await fetch('/api/live-token', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'conversation',
        conversationScenario: scenario,
        userName: profile.display_name,
        targetLanguage,
        nativeLanguage
      })
    });
    // ...
  };
};
```

### Verification Checklist for Phase ML-10

- [ ] `FlashcardGame.tsx` uses language context
- [ ] VERB_PERSONS generated dynamically per language
- [ ] TTS uses correct language code
- [ ] Answer validation includes language params
- [ ] `conversation-scenarios.ts` is language-agnostic
- [ ] Scenarios display correctly for Polish
- [ ] Scenarios display correctly for Spanish
- [ ] Voice conversation works in any language

---

## Phase ML-11: Onboarding Flow

**Goal:** Update onboarding to select language pair.

**Risk:** Medium - affects new user experience.

### Files to Modify

| File | Changes |
|------|---------|
| `components/onboarding/LanguageSelectionStep.tsx` | NEW - Language picker |
| `components/onboarding/StudentOnboarding.tsx` | Add language selection step |
| `components/onboarding/TutorOnboarding.tsx` | Add language selection step |
| `components/onboarding/steps/tutor/PolishConnectionStep.tsx` | Rename and generalize |

### 1. New File: `components/onboarding/LanguageSelectionStep.tsx`

```typescript
/**
 * Language Selection Step - Onboarding
 *
 * Allows users to select their native language and target language.
 */

import React, { useState } from 'react';
import {
  getAllLanguages,
  getLanguageFlag,
  getLanguageName,
  getLanguageNativeName
} from '../../constants/language-config';
import { LanguageCode } from '../../types';

interface Props {
  onComplete: (nativeLanguage: LanguageCode, targetLanguage: LanguageCode) => void;
  role: 'student' | 'tutor';
}

export const LanguageSelectionStep: React.FC<Props> = ({ onComplete, role }) => {
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode | null>(null);
  const [step, setStep] = useState<'native' | 'target'>('native');

  const allLanguages = getAllLanguages();

  const handleNativeSelect = (code: LanguageCode) => {
    setNativeLanguage(code);
    setStep('target');
  };

  const handleTargetSelect = (code: LanguageCode) => {
    setTargetLanguage(code);
    if (nativeLanguage) {
      onComplete(nativeLanguage, code);
    }
  };

  // Filter out selected native language from target options
  const targetOptions = allLanguages.filter(l => l.code !== nativeLanguage);

  return (
    <div className="space-y-6">
      {step === 'native' && (
        <>
          <h2 className="text-2xl font-bold font-header text-center">
            {role === 'student'
              ? "What's your native language?"
              : "What language do you speak natively?"}
          </h2>
          <p className="text-center text-gray-600">
            We'll explain things in this language
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {allLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleNativeSelect(lang.code as LanguageCode)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-sm text-gray-500">{lang.nativeName}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'target' && (
        <>
          <h2 className="text-2xl font-bold font-header text-center">
            {role === 'student'
              ? "What language are you learning?"
              : "What language does your partner speak?"}
          </h2>
          <p className="text-center text-gray-600">
            {role === 'student'
              ? "Your partner's native language"
              : "The language you'll help them learn"}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {targetOptions.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleTargetSelect(lang.code as LanguageCode)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-sm text-gray-500">{lang.nativeName}</div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep('native')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to native language
          </button>
        </>
      )}
    </div>
  );
};

export default LanguageSelectionStep;
```

### 2. `components/onboarding/StudentOnboarding.tsx` Changes

**Before:**
```typescript
const ONBOARDING_STEPS = [
  { id: 'why', component: WhyStep },
  { id: 'partner', component: PartnerStep },
  // ... Polish-specific steps
];
```

**After:**
```typescript
import LanguageSelectionStep from './LanguageSelectionStep';

const ONBOARDING_STEPS = [
  { id: 'language', component: LanguageSelectionStep },  // NEW: First step
  { id: 'why', component: WhyStep },
  { id: 'partner', component: PartnerStep },
  // ...
];

// In the component:
const handleLanguageSelect = async (nativeLanguage: LanguageCode, targetLanguage: LanguageCode) => {
  // Save to profile
  await supabase
    .from('profiles')
    .update({
      native_language: nativeLanguage,
      active_language: targetLanguage,
      languages: [targetLanguage]  // Initial language access
    })
    .eq('id', profile.id);

  // Proceed to next step
  setCurrentStep(currentStep + 1);
};
```

### 3. Rename: `PolishConnectionStep.tsx` → `LanguageConnectionStep.tsx`

**Before:**
```typescript
// Polish-specific connection questions
const POLISH_CONNECTION_OPTIONS = [
  "My partner is Polish",
  "My family is Polish",
  // ... all Polish
];
```

**After:**
```typescript
import { useLanguage } from '../../context/LanguageContext';
import { getLanguageName } from '../../constants/language-config';

const LanguageConnectionStep: React.FC<Props> = ({ onComplete }) => {
  const { targetLanguage } = useLanguage();
  const languageName = getLanguageName(targetLanguage);

  // Dynamic connection options
  const CONNECTION_OPTIONS = [
    `My partner speaks ${languageName}`,
    `My family speaks ${languageName}`,
    `I'm moving to a ${languageName}-speaking country`,
    `I want to connect with ${languageName} culture`,
    `Other reason`
  ];

  return (
    <div>
      <h2>What's your connection to {languageName}?</h2>
      {/* ... render options */}
    </div>
  );
};
```

### Verification Checklist for Phase ML-11

- [ ] `LanguageSelectionStep.tsx` created
- [ ] All 18 languages displayed in grid
- [ ] Native language selection works
- [ ] Target language filtered correctly
- [ ] `StudentOnboarding.tsx` includes language step
- [ ] `TutorOnboarding.tsx` includes language step
- [ ] `LanguageConnectionStep.tsx` uses dynamic language name
- [ ] Profile saves native_language and active_language
- [ ] Onboarding completes successfully for new users

---

## Phase ML-12: Blog Generator System

**Goal:** Make the blog generator support any target/native language pair.

**Risk:** Medium - isolated system, but significant changes.

### Files to Modify

| File | Changes |
|------|---------|
| `utils/article-generator.ts` | Add language params, use prompt templates |
| `scripts/generate-article.ts` | Add `--language` CLI flag |
| `api/admin/generate-article.ts` | Accept language in request |
| `components/blog/MDXComponents.tsx` | `VocabCard`: `polish` → `word`, add `flag` to CultureTip |
| `content/articles.ts` | Add `language` field to ArticleMeta |
| `blog/src/content/config.ts` | Add `language` to schema |

### 1. `utils/article-generator.ts` Changes

**Before (lines 133-235):**
```typescript
const SYSTEM_PROMPT = `You are an expert Polish language educator writing SEO-optimized blog articles for "Love Languages" - an app that helps couples learn Polish together.
// ... Polish-specific content
`;
```

**After:**
```typescript
import { buildBlogArticlePrompt } from './prompt-templates';

// Add language to GenerationOptions
export interface GenerationOptions {
  topic: string;
  category?: string;
  difficulty?: string;
  targetLanguage?: string;  // NEW: defaults to 'pl'
  nativeLanguage?: string;  // NEW: defaults to 'en'
}

// Add language to ArticleFrontmatter
export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
  targetLanguage: string;  // NEW
  nativeLanguage: string;  // NEW
}

// Update generateArticleContent
export async function generateArticleContent(
  options: GenerationOptions,
  apiKey?: string
): Promise<GeneratedArticle> {
  const targetLanguage = options.targetLanguage || 'pl';
  const nativeLanguage = options.nativeLanguage || 'en';

  // Use prompt template instead of hardcoded SYSTEM_PROMPT
  const systemPrompt = buildBlogArticlePrompt(targetLanguage, nativeLanguage);

  // ... rest of function
}
```

### 2. `components/blog/MDXComponents.tsx` Changes

**Before (lines 178-200):**
```typescript
export const VocabCard: React.FC<{
  polish: string;
  english: string;
  pronunciation?: string;
  example?: string;
}> = ({ polish, english, pronunciation, example }) => (
```

**After:**
```typescript
export const VocabCard: React.FC<{
  word: string;        // Was: polish
  translation: string; // Was: english
  pronunciation?: string;
  example?: string;
  // Backward compatibility
  polish?: string;
  english?: string;
}> = ({ word, translation, pronunciation, example, polish, english }) => {
  // Support both old and new prop names
  const displayWord = word || polish || '';
  const displayTranslation = translation || english || '';

  return (
    <div className="bg-gradient-to-br from-[var(--accent-color)]/5 to-[var(--accent-color)]/10 rounded-2xl p-6 my-6 border border-[var(--accent-color)]/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-[var(--accent-color)] font-header">{displayWord}</span>
        <span className="text-lg text-[var(--text-primary)]">{displayTranslation}</span>
      </div>
      {/* ... rest unchanged */}
    </div>
  );
};

// Update CultureTip to accept flag
export const CultureTip: React.FC<Props & { flag?: string }> = ({
  children,
  title = "Cultural Tip",
  flag = "🌍"  // Default to globe, not 🇵🇱
}) => (
  <div className="my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{flag}</span>
      <h4 className="font-bold text-amber-800 font-header">{title}</h4>
    </div>
    <div className="text-amber-900">{children}</div>
  </div>
);
```

### 3. `content/articles.ts` Changes

```typescript
// Add language to ArticleMeta
export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  image?: string;
  date: string;
  targetLanguage: string;  // NEW
  nativeLanguage: string;  // NEW
}

// Update existing articles with language
export const articles: ArticleMeta[] = [
  {
    slug: 'how-to-say-i-love-you-in-polish',
    title: 'How to Say "I Love You" in Polish: A Complete Guide',
    // ... existing fields
    targetLanguage: 'pl',  // NEW
    nativeLanguage: 'en',  // NEW
  },
  // ... more articles
];

// Add helper to filter by language
export function getArticlesByLanguage(
  targetLanguage: string,
  nativeLanguage?: string
): ArticleMeta[] {
  return articles.filter(a =>
    a.targetLanguage === targetLanguage &&
    (!nativeLanguage || a.nativeLanguage === nativeLanguage)
  );
}
```

### Verification Checklist for Phase ML-12

- [ ] Article generator accepts language parameters
- [ ] CLI tool has `--language` flag
- [ ] Generated articles include language in frontmatter
- [ ] VocabCard works with both old (`polish/english`) and new (`word/translation`) props
- [ ] CultureTip accepts custom flag emoji
- [ ] Existing Polish articles still display correctly
- [ ] New language articles can be generated and displayed

---

## Rollback Procedures

### Database Rollback

If database migration fails:

```sql
-- Run rollback script from Phase ML-2
```

### Code Rollback

If code changes break the app:

```bash
# Revert to last working commit
git revert HEAD~[number of commits]

# Or reset to specific commit
git reset --hard [commit-hash]
```

### Staged Rollback

If only certain phases fail:

1. Identify which phase broke
2. Revert only files changed in that phase
3. Re-test previous phases

---

## Success Criteria

### Phase Completion Criteria

Each phase is complete when:

1. ✅ All files in phase are modified/created
2. ✅ TypeScript compiles without errors
3. ✅ App runs without runtime errors
4. ✅ Phase verification checklist passes
5. ✅ No regressions in existing functionality

### Final Success Criteria

The transformation is complete when:

| Criterion | Verification Method |
|-----------|---------------------|
| All 18 languages selectable | Test onboarding flow |
| Any native → target pair works | Test 6 representative pairs |
| AI explains in native language | Verify chat responses |
| Translations in native language | Check vocabulary cards |
| All features work for any pair | Full feature test matrix |
| Existing Polish users unaffected | Test existing accounts |
| Blog generator multi-language | Generate article in Spanish |
| Premium multi-language works | Test language purchase |
| Per-language progress tracked | Check Progress page |

### Representative Test Pairs

| Pair | Why Important |
|------|---------------|
| en → pl | Original, must work perfectly |
| es → pl | Different native language |
| en → es | Different target language |
| es → fr | No English involved |
| en → ru | Cyrillic script |
| en → el | Greek script |

---

## Approval Checklist

Before proceeding, confirm understanding of:

- [ ] **Total Scope**: 70+ files, 16 phases
- [ ] **Architecture**: Two language parameters everywhere
- [ ] **Database**: Schema changes with backward compatibility
- [ ] **API**: All 26 endpoints get language parameters
- [ ] **Blog**: Generator becomes multi-language
- [ ] **Types**: Field renames with deprecation path
- [ ] **Testing**: Manual testing of 6 language pairs
- [ ] **Rollback**: Procedures for each phase
- [ ] **Success**: Clear criteria for completion

---

*Document version: 2.0*
*Created: January 10, 2026*
*Status: AWAITING APPROVAL*
