# Personalized Vocabulary Bank — Feature Plan

**Status:** PARKED (planned, not started)  
**Created:** 2026-02-04  
**Goal:** Replace expensive pre-generated generic examples with personalized, contextual examples generated at point-of-use.

---

## The Vision

**Before (expensive, generic):**
> "kocham" → "I love the way you laugh"  
> Same example for every user. Pre-generated millions of entries.

**After (cheap, personal):**
> "kocham" → "I love when **Misia** makes her famous pierogi"  
> Generated from YOUR conversation, YOUR partner, YOUR moments.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VOCABULARY BANK                         │
│  (Wiktionary base: word, translation, conjugations, gender) │
│                   Millions of entries, FREE                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WORD EXTRACTION                          │
│         User chats → AI extracts newWords[]                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ENRICHMENT FLOW                            │
│                                                             │
│  Word in bank? ──YES──► Pull base data                      │
│       │                      │                              │
│       │                      ▼                              │
│       │              Personalize examples                   │
│       │              (partner name, context)                │
│       │                      │                              │
│       NO                     │                              │
│       │                      │                              │
│       ▼                      │                              │
│  Full AI generation          │                              │
│  (fallback for rare words)   │                              │
│       │                      │                              │
│       └──────────────────────┴──────► Save to dictionary    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### 1. vocabulary_bank (NEW - Wiktionary data)

```sql
CREATE TABLE vocabulary_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core word data
  word TEXT NOT NULL,
  language TEXT NOT NULL,           -- 'pl', 'en', etc.
  word_type TEXT,                   -- noun, verb, adjective, etc.
  
  -- Translations (JSONB for multi-language)
  translations JSONB,               -- {"en": "love", "de": "Liebe", ...}
  
  -- Grammar
  gender TEXT,                      -- masculine, feminine, neuter
  plural TEXT,
  conjugations JSONB,               -- Full verb forms
  adjective_forms JSONB,
  
  -- Pronunciation
  pronunciation TEXT,               -- IPA
  audio_url TEXT,                   -- Wiktionary audio if available
  
  -- Metadata
  frequency_rank INTEGER,           -- From frequency lists
  source TEXT DEFAULT 'wiktionary',
  
  UNIQUE(word, language)
);

CREATE INDEX idx_vocab_bank_lookup ON vocabulary_bank(word, language);
CREATE INDEX idx_vocab_bank_freq ON vocabulary_bank(frequency_rank, language);
```

### 2. dictionary (EXISTING - User's personal vocab)

No schema changes needed. We still save:
- word, translation, pronunciation
- examples (now PERSONALIZED)
- pro_tip (now CONTEXTUAL)
- conjugations, gender, etc.

---

## Implementation Phases

### Phase 1: Import Wiktionary Base Data
**Effort:** 1-2 days  
**Cost:** $0

Tasks:
- [ ] Download kaikki.org extracts for all 18 languages
- [ ] Write import script to parse JSONL → vocabulary_bank
- [ ] Cross-reference with frequency lists (prioritize common words)
- [ ] Apply migration, bulk insert
- [ ] Verify coverage: check word counts per language

**Deliverable:** vocabulary_bank table with 50K+ words per language

---

### Phase 2: Lookup Integration
**Effort:** 1 day  
**Cost:** $0

Tasks:
- [ ] Create `getBaseVocab(word, language)` function
- [ ] Returns: translations, conjugations, gender, pronunciation
- [ ] Handle word variations (lowercase, diacritics normalization)
- [ ] Add caching layer for hot words

**Deliverable:** Fast lookups from vocabulary_bank

---

### Phase 3: Personalization Engine
**Effort:** 2-3 days  
**Cost:** Small AI cost per enrichment

Tasks:
- [ ] Create `personalizeWord(baseData, context)` function
- [ ] Context includes:
  - `partnerName` — From user profile
  - `conversationSnippet` — Where word was used
  - `relationshipVibe` — From onboarding (playful, romantic, etc.)
  - `sharedInterests` — Optional, from profile
- [ ] New prompt template (much smaller than full generation):

```
Base word: {word} ({translation})
Partner: {partnerName}
Context: "{conversationSnippet}"
Vibe: {relationshipVibe}

Generate 3 personalized example sentences using this word.
Make them about THIS couple, not generic.
```

- [ ] Fallback to generic if personalization fails

**Deliverable:** Personalized examples generated on-demand

---

### Phase 4: Update Word Extraction Flow
**Effort:** 1-2 days  
**Cost:** $0 (same AI call, different handling)

Current flow in chat:
```typescript
// AI returns newWords[]
for (const word of newWords) {
  const enriched = await enrichWord(word); // Full AI generation
  await saveToDict(enriched);
}
```

New flow:
```typescript
for (const word of newWords) {
  // 1. Check vocabulary bank first
  const baseData = await getBaseVocab(word.word, targetLanguage);
  
  if (baseData) {
    // 2. Personalize with context
    const personalized = await personalizeWord(baseData, {
      partnerName: user.partnerName,
      conversationSnippet: extractContext(messages, word),
      relationshipVibe: user.relationshipVibe
    });
    await saveToDict({ ...baseData, ...personalized });
  } else {
    // 3. Fallback: full generation for unknown words
    const enriched = await enrichWord(word);
    await saveToDict(enriched);
    // Optionally: save base data to vocabulary_bank for future
  }
}
```

**Deliverable:** Integrated flow using bank + personalization

---

### Phase 5: Word Gifts Enhancement
**Effort:** 1 day  
**Cost:** Small AI cost

Tasks:
- [ ] When tutor sends word gift, personalize for recipient
- [ ] Include context: "Your partner thought you'd like this word"
- [ ] Generate examples relevant to couple's shared context

**Deliverable:** Personalized word gifts

---

## Cost Analysis

### Old Approach (Pre-generation)
```
5,000 words × 306 pairs × 5 examples = 7.65M example generations
Estimated: $500-2,000 in AI costs
Result: Generic, same for everyone
```

### New Approach (Personalization on-demand)
```
Base data: FREE (Wiktionary)
Per-word personalization: ~$0.001 (3 examples, small prompt)
Active user generates ~100 words/month: $0.10/user/month
Result: Personal, memorable, contextual
```

**Break-even:** ~500 active users before old approach would've been "cheaper"
**But:** New approach is BETTER, not just cheaper

---

## Prompt Templates

### Personalization Prompt (Small, Cheap)

```
Word: {word} ({wordType})
Translation: {translation}
Partner: {partnerName}
Context: User just said "{conversationSnippet}"
Vibe: {relationshipVibe}

Create 3 example sentences using "{word}" that:
1. Reference {partnerName} or "your partner"
2. Relate to the conversation context
3. Feel personal, not generic

Also write 1 pro-tip about using this word with a partner.

Return JSON:
{
  "examples": [
    {"target": "...", "native": "..."},
    ...
  ],
  "pro_tip": "..."
}
```

### Fallback Full Generation (Existing, for unknown words)
Keep current enrichWord() prompt for words not in bank.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/037_vocabulary_bank_v2.sql` | New table schema |
| `src/lib/vocabulary-bank.ts` | NEW: Lookup + personalization functions |
| `src/lib/word-enrichment.ts` | Update to use bank first |
| `src/components/ChatArea.tsx` | Pass context to enrichment |
| `src/api/extract-words.ts` | Update enrichment flow |
| `scripts/import-wiktionary.ts` | NEW: Import script |

---

## Success Metrics

1. **Coverage:** 90%+ of extracted words found in bank
2. **Cost:** <$0.002 per word enrichment (vs ~$0.01 before)
3. **Quality:** User feedback on Love Log entries
4. **Speed:** Word enrichment <500ms (bank lookup + small AI call)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Wiktionary missing words | Fallback to full generation, save to bank |
| Personalization feels forced | Keep it subtle, have "generic romantic" fallback |
| Translation quality | Wiktionary is high quality, verify samples |
| Import complexity | Start with one language (Polish), iterate |

---

## Next Steps

1. **Approve plan** — Does this match the vision?
2. **Phase 1** — Download Wiktionary, write import script
3. **Test with Polish** — Most used language pair
4. **Iterate** — Expand to all languages

---

## Open Questions

1. Should we store personalized examples permanently, or regenerate each view?
   - Recommendation: Store permanently (becomes their vocab history)

2. How much context to pass for personalization?
   - Recommendation: Last 2-3 messages where word appeared

3. Should we show "base" entries in Love Log before personalization?
   - Recommendation: Yes, show immediately, enhance async

4. Rate limit on personalization?
   - Recommendation: Batch personalize (up to 10 words per chat turn)
