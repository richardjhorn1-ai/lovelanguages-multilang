-- Vocabulary Bank: Pre-computed vocabulary for fast lookups
-- Reduces Gemini API calls and improves UX with instant word data

CREATE TABLE IF NOT EXISTS vocabulary_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Word and translation
  word TEXT NOT NULL,
  translation TEXT NOT NULL,

  -- Language pair
  native_lang TEXT NOT NULL,      -- User's native language (en, pl, etc.)
  target_lang TEXT NOT NULL,      -- Language being learned

  -- Word metadata
  word_type TEXT NOT NULL,        -- noun, verb, adjective, adverb, phrase
  pronunciation TEXT,
  gender TEXT,                    -- masculine, feminine, neuter (where applicable)
  plural TEXT,                    -- Plural form for nouns

  -- Rich data (JSONB)
  conjugations JSONB,             -- Verb conjugations by tense
  adjective_forms JSONB,          -- Adjective declensions
  examples JSONB NOT NULL,        -- Array of 5 example sentences (romantic/couples-focused)

  -- Extra context
  pro_tip TEXT,                   -- Cultural/usage tip
  category TEXT,                  -- romance, daily_life, travel, family, emotions, communication
  frequency_rank INTEGER,         -- 1-5000 (lower = more common)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique word per language pair
  UNIQUE(word, native_lang, target_lang)
);

-- Indexes for fast lookups
CREATE INDEX idx_vocabulary_bank_lookup ON vocabulary_bank(word, native_lang, target_lang);
CREATE INDEX idx_vocabulary_bank_pair ON vocabulary_bank(native_lang, target_lang);
CREATE INDEX idx_vocabulary_bank_category ON vocabulary_bank(category, native_lang, target_lang);
CREATE INDEX idx_vocabulary_bank_frequency ON vocabulary_bank(frequency_rank, native_lang, target_lang);

-- Comment
COMMENT ON TABLE vocabulary_bank IS 'Pre-computed vocabulary for Love Languages. Check this BEFORE calling Gemini for word enrichment.';
