# Blog Article Generation Rules

**Purpose:** Ensure consistent, high-quality article generation across all language pairs.

---

## ✅ Required Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | In **native language** |
| `slug` | string | ✅ | In **English**, URL-friendly |
| `description` | string | ✅ | In **native language**, 150-160 chars |
| `content` | string | ✅ | In **native language**, MDX format |
| `native_lang` | string | ✅ | ISO code (en, de, fr, etc.) |
| `target_lang` | string | ✅ | ISO code |
| `category` | string | ✅ | One of: `vocabulary`, `grammar`, `pronunciation`, `situations` |
| `difficulty` | string | ✅ | Currently all `beginner` |
| `tags` | array | ✅ | 3-5 relevant tags |
| `image` | string | ✅ | Image path or URL |
| `read_time` | string | ✅ | e.g., "5 min read" |
| `published` | boolean | ✅ | Set to `true` |
| `date` | string | ✅ | ISO date format |

---

## 🚫 Errors to Avoid

### 1. Language Consistency
- ❌ Title in wrong language (must be in **native_lang**)
- ❌ Description in wrong language (must be in **native_lang**)
- ❌ Content in wrong language (must be in **native_lang**)
- ✅ Slug should always be in **English** for URL consistency

### 2. Content Quality
- ❌ Content under 1000 characters
- ❌ Missing MDX component imports
- ❌ Control characters (U+0000 - U+001F) in content
- ❌ Unescaped special characters in JSON

### 3. Required Components in Content
Articles should include these MDX imports when relevant:
```mdx
import VocabCard from '@components/VocabCard.astro';
import ConjugationTable from '@components/ConjugationTable.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';
```

### 4. Image
- ❌ Missing image field (36 articles have this issue)
- ✅ Always include an image path

### 5. Category Values
Only use these categories:
- `vocabulary` - word lists, phrases, vocabulary topics
- `grammar` - grammar explanations
- `pronunciation` - pronunciation guides
- `situations` - situational phrases (dating, family, etc.)

### 6. Tags
- ✅ 3-5 tags per article
- ✅ Tags should be in **native language** OR English
- ✅ Include topic-relevant tags (e.g., "romance", "couples", "vocabulary")

---

## 📝 Content Structure Template

```mdx
import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# [Title in Native Language]

[Introduction paragraph - 2-3 sentences, engaging, mentioning the couple/partner angle]

## [Section 1 - Main Content]

[Content with vocabulary cards, examples, etc.]

<VocabCard 
  word="[target language word]"
  translation="[native language translation]"
  pronunciation="[IPA or phonetic]"
  example="[example sentence in target language]"
  exampleTranslation="[translation in native language]"
/>

## [Section 2]

[More content...]

<CultureTip>
[Interesting cultural note about the target language/country]
</CultureTip>

## [Section 3 - Practice/Tips]

[Practical tips for using these phrases with your partner]

<CTA />
```

---

## 🔄 Slug Pattern

Slugs should follow this pattern (always in English):
- `100-most-common-[LANG]-words`
- `[LANG]-pet-names-and-endearments`
- `how-to-say-i-love-you-in-[LANG]`
- `[LANG]-greetings-and-farewells`
- `[LANG]-date-night-vocabulary`

Where `[LANG]` is the **target language name in English** (german, french, spanish, etc.)

---

## ✅ Pre-Generation Checklist

Before generating each article:
1. [ ] Title is in native_lang
2. [ ] Slug is in English with target language name
3. [ ] Description is in native_lang (150-160 chars)
4. [ ] Content is in native_lang with MDX components
5. [ ] Category is one of the 4 valid values
6. [ ] Tags array has 3-5 items
7. [ ] Image path is included
8. [ ] No duplicate slug for same native_lang + target_lang pair
