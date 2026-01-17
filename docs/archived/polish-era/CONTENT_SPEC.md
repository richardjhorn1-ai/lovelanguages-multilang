# Content Generator Specification

> **For:** Love Languages Blog Content Generator
> **Version:** 1.0
> **Last Updated:** January 2026

This document defines the exact JSON schema your content generator should output for the Love Languages blog.

---

## Quick Start

1. Generate articles as JSON files following the schema below
2. Generate images with Nano Banana (save as `.jpg` or `.png`)
3. Drop everything into `content/incoming/`
4. Run `npm run import-content`
5. Commit and push

---

## Folder Structure

```
content/
├── incoming/              ← DROP YOUR FILES HERE
│   ├── articles/          ← JSON article files
│   │   ├── polish-pet-names.json
│   │   ├── how-to-order-coffee.json
│   │   └── ...
│   └── images/            ← Article images
│       ├── polish-pet-names.jpg
│       ├── how-to-order-coffee.jpg
│       └── ...
├── articles.ts            ← Auto-updated by import script
└── *.mdx                  ← Generated MDX files
```

---

## JSON Article Schema

Each article is a single `.json` file. The filename becomes the URL slug.

**Example:** `polish-pet-names.json` → `lovelanguages.io/#/learn/polish-pet-names`

```json
{
  "meta": {
    "title": "25 Adorable Polish Pet Names for Your Partner",
    "description": "Learn the sweetest Polish terms of endearment to call your boyfriend, girlfriend, or spouse.",
    "category": "vocabulary",
    "difficulty": "beginner",
    "readTime": 5,
    "image": "polish-pet-names.jpg",
    "tags": ["pet names", "terms of endearment", "romantic", "couples"]
  },

  "content": [
    // Array of content blocks - see Content Block Types below
  ]
}
```

### Meta Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Article headline (50-70 chars ideal for SEO) |
| `description` | string | ✅ | Meta description (150-160 chars ideal for SEO) |
| `category` | enum | ✅ | One of: `phrases`, `vocabulary`, `grammar`, `culture`, `situations` |
| `difficulty` | enum | ✅ | One of: `beginner`, `intermediate`, `advanced` |
| `readTime` | number | ✅ | Estimated minutes to read |
| `image` | string | ❌ | Filename of hero image (must exist in incoming/images/) |
| `tags` | string[] | ❌ | Keywords for search/filtering |

### Category Definitions

| Category | Use For |
|----------|---------|
| `phrases` | "How to say X in Polish" articles |
| `vocabulary` | Word lists, themed vocabulary |
| `grammar` | Conjugations, cases, grammar rules |
| `culture` | Polish customs, traditions, etiquette |
| `situations` | "Polish for [situation]" survival guides |

---

## Content Block Types

The `content` array contains blocks. Each block has a `type` and type-specific fields.

### 1. Paragraph

```json
{
  "type": "paragraph",
  "text": "When you're learning Polish for someone you love, there's one phrase that matters more than any other."
}
```

**Markdown in text:** Use `**bold**` for Polish words, `*italic*` for emphasis.

---

### 2. Heading

```json
{
  "type": "heading",
  "level": 2,
  "text": "The Essential: Kocham Cię"
}
```

| Field | Values |
|-------|--------|
| `level` | `2` or `3` (H1 is reserved for article title) |

---

### 3. Vocabulary Card

Single word/phrase with full details.

```json
{
  "type": "vocab",
  "polish": "Kocham cię",
  "english": "I love you",
  "pronunciation": "KO-ham cheh",
  "example": "Kocham cię najbardziej na świecie.",
  "exampleTranslation": "I love you most in the world.",
  "gender": null,
  "wordType": "phrase"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `polish` | ✅ | The Polish word/phrase |
| `english` | ✅ | English translation |
| `pronunciation` | ✅ | Phonetic pronunciation (use caps for stress) |
| `example` | ❌ | Example sentence in Polish |
| `exampleTranslation` | ❌ | English translation of example |
| `gender` | ❌ | For nouns: `masculine`, `feminine`, `neuter` |
| `wordType` | ❌ | `noun`, `verb`, `adjective`, `phrase`, `adverb` |

---

### 4. Phrase Highlight

Featured phrase with prominent styling (use sparingly, 1-2 per article).

```json
{
  "type": "phrase",
  "polish": "Kocham cię",
  "english": "I love you",
  "pronunciation": "KO-ham cheh",
  "context": "The most direct and powerful way to express love in Polish."
}
```

---

### 5. Conjugation Table

Full verb conjugation.

```json
{
  "type": "conjugation",
  "verb": "kochać",
  "meaning": "to love",
  "tense": "present",
  "forms": [
    { "person": "ja (I)", "polish": "kocham", "english": "I love" },
    { "person": "ty (you)", "polish": "kochasz", "english": "you love" },
    { "person": "on/ona (he/she)", "polish": "kocha", "english": "he/she loves" },
    { "person": "my (we)", "polish": "kochamy", "english": "we love" },
    { "person": "wy (you pl.)", "polish": "kochacie", "english": "you all love" },
    { "person": "oni/one (they)", "polish": "kochają", "english": "they love" }
  ]
}
```

---

### 6. Vocabulary Table

Quick reference table for multiple words.

```json
{
  "type": "vocabTable",
  "title": "Common Pet Names",
  "columns": ["Polish", "English", "When to Use"],
  "rows": [
    ["Kochanie", "Darling", "Most common, always appropriate"],
    ["Skarbie", "Treasure", "Very affectionate"],
    ["Misiaczku", "Little teddy bear", "Cute, playful"],
    ["Słoneczko", "Little sunshine", "Sweet, warm"]
  ]
}
```

---

### 7. Culture Tip

Cultural context box.

```json
{
  "type": "culture",
  "title": "When to Say It",
  "text": "In Poland, saying \"kocham cię\" carries significant weight. Unlike American culture where \"I love you\" might be said frequently, Poles tend to reserve this phrase for truly meaningful moments."
}
```

---

### 8. Blockquote

Highlighted quote or pro tip.

```json
{
  "type": "quote",
  "text": "In Polish, the emotion behind your words matters more than perfect grammar. When you say \"I love you\" in their language, you're saying \"I love you enough to learn how to say this.\""
}
```

---

### 9. List

Bullet or numbered list.

```json
{
  "type": "list",
  "style": "bullet",
  "items": [
    "Start with **kocham cię** - the foundation",
    "Add a pet name for extra warmth",
    "Use diminutives to show affection"
  ]
}
```

| Field | Values |
|-------|--------|
| `style` | `bullet` or `numbered` |

---

### 10. Divider

Horizontal rule to separate sections.

```json
{
  "type": "divider"
}
```

---

### 11. Call to Action

Links back to the app. Use at end of article.

```json
{
  "type": "cta",
  "heading": "Ready to Learn More?",
  "text": "Practice these phrases with your partner using AI-powered coaching.",
  "buttonText": "Start Learning Free"
}
```

All fields optional - defaults will be used if omitted.

---

### 12. Image

Inline image within article (not hero image).

```json
{
  "type": "image",
  "src": "conjugation-chart.jpg",
  "alt": "Polish verb conjugation chart showing present tense endings",
  "caption": "Reference chart for common verb conjugations"
}
```

---

## Complete Example

**File:** `content/incoming/articles/polish-pet-names.json`

```json
{
  "meta": {
    "title": "25 Adorable Polish Pet Names for Your Partner",
    "description": "Learn the sweetest Polish terms of endearment to call your boyfriend, girlfriend, or spouse. From classic 'kochanie' to playful 'misiaczek'.",
    "category": "vocabulary",
    "difficulty": "beginner",
    "readTime": 6,
    "image": "polish-pet-names.jpg",
    "tags": ["pet names", "romantic", "couples", "terms of endearment"]
  },

  "content": [
    {
      "type": "paragraph",
      "text": "Polish is a language rich with affectionate expressions. Whether you're just starting to date a Polish speaker or have been together for years, using the right pet name can make your partner's heart melt."
    },

    {
      "type": "heading",
      "level": 2,
      "text": "The Most Popular: Kochanie"
    },

    {
      "type": "phrase",
      "polish": "Kochanie",
      "english": "Darling / Sweetheart",
      "pronunciation": "ko-HA-nyeh",
      "context": "The most universally used and always appropriate term of endearment."
    },

    {
      "type": "paragraph",
      "text": "**Kochanie** is derived from the verb **kochać** (to love), making it literally mean \"the one I love.\" You'll hear this everywhere in Poland - between young couples, married partners, and even parents to children."
    },

    {
      "type": "culture",
      "title": "Pronunciation Tip",
      "text": "The stress in Polish almost always falls on the second-to-last syllable. So it's ko-HA-nyeh, not KO-ha-nyeh."
    },

    {
      "type": "heading",
      "level": 2,
      "text": "Sweet & Playful Names"
    },

    {
      "type": "vocabTable",
      "title": "Cute Polish Pet Names",
      "columns": ["Polish", "Literal Meaning", "Vibe"],
      "rows": [
        ["Misiaczek", "Little teddy bear", "Cute, playful"],
        ["Kotku", "Kitty", "Sweet, casual"],
        ["Słoneczko", "Little sunshine", "Warm, bright"],
        ["Skarbie", "Treasure", "Very affectionate"],
        ["Złotko", "Little gold", "Precious, dear"]
      ]
    },

    {
      "type": "vocab",
      "polish": "Misiaczek",
      "english": "Little teddy bear",
      "pronunciation": "mee-SHA-chek",
      "example": "Cześć misiaczku, jak się masz?",
      "exampleTranslation": "Hi teddy bear, how are you?",
      "wordType": "noun"
    },

    {
      "type": "heading",
      "level": 2,
      "text": "For Your Boyfriend"
    },

    {
      "type": "list",
      "style": "bullet",
      "items": [
        "**Kochany** - beloved/dear (masculine)",
        "**Przystojniaku** - handsome one",
        "**Mój książę** - my prince",
        "**Tygrysie** - tiger (playful/fierce)"
      ]
    },

    {
      "type": "heading",
      "level": 2,
      "text": "For Your Girlfriend"
    },

    {
      "type": "list",
      "style": "bullet",
      "items": [
        "**Kochana** - beloved/dear (feminine)",
        "**Księżniczko** - princess",
        "**Piękna** - beautiful one",
        "**Aniołku** - little angel"
      ]
    },

    {
      "type": "quote",
      "text": "Pro tip: Add the diminutive suffix -ek, -ka, or -ko to almost any noun to make it sound more affectionate. Poles love diminutives!"
    },

    {
      "type": "divider"
    },

    {
      "type": "heading",
      "level": 2,
      "text": "Quick Reference"
    },

    {
      "type": "vocabTable",
      "title": null,
      "columns": ["Situation", "Best Pet Name", "Why"],
      "rows": [
        ["First time", "Kochanie", "Safe, classic, always appropriate"],
        ["Being playful", "Misiaczku", "Cute without being too intense"],
        ["Being romantic", "Skarbie", "Shows deep affection"],
        ["Waking them up", "Słoneczko", "Sweet way to start the day"]
      ]
    },

    {
      "type": "cta",
      "heading": "Practice These With Your Partner",
      "text": "Learn pronunciation and hear these phrases spoken aloud with Love Languages.",
      "buttonText": "Try It Free"
    }
  ]
}
```

---

## Image Requirements

| Aspect | Requirement |
|--------|-------------|
| Format | `.jpg` or `.png` |
| Size | 1200x630px (ideal for social sharing) |
| Filename | Must match `meta.image` field |
| Style | Consistent with Love Languages brand (romantic, warm, Polish themes) |

---

## Import Command

After dropping files in `content/incoming/`:

```bash
npm run import-content
```

This will:
1. Convert JSON → MDX files
2. Move images to `public/blog/`
3. Update `content/articles.ts`
4. Update `public/sitemap.xml`
5. Clear the incoming folder

---

## Validation

The import script validates:
- Required fields present
- Category is valid enum
- Difficulty is valid enum
- Image file exists if referenced
- No duplicate slugs

Errors will be shown with the specific file and issue.
