/**
 * Shared article generation module.
 * Used by both CLI (scripts/generate-article.ts) and API (api/admin/generate-article.ts)
 *
 * Single source of truth for:
 * - Claude prompts and examples
 * - Article schema and validation
 * - MDX content validation
 * - Slug generation
 */

import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// TYPES
// =============================================================================

export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
}

export interface GeneratedArticle {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  imagePrompt: string;
}

export interface GenerationOptions {
  topic: string;
  category?: string;
  difficulty?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VALID_CATEGORIES = ['phrases', 'vocabulary', 'grammar', 'culture', 'situations'] as const;
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const REQUIRED_IMPORTS = [
  "import VocabCard from '../../components/VocabCard.astro'",
  "import CultureTip from '../../components/CultureTip.astro'",
  "import PhraseOfDay from '../../components/PhraseOfDay.astro'",
  "import CTA from '../../components/CTA.astro'",
];

// Example article for few-shot learning (complete, not truncated)
const EXAMPLE_ARTICLE = `---
title: '25 Adorable Polish Pet Names for Your Partner'
description: 'Learn the sweetest Polish terms of endearment to call your boyfriend, girlfriend, or spouse. From classic kochanie to playful misiaczek.'
category: vocabulary
difficulty: beginner
readTime: 6
date: '2026-01-09'
tags: ['pet names', 'endearment', 'vocabulary']
---
import VocabCard from '../../components/VocabCard.astro';
import CultureTip from '../../components/CultureTip.astro';
import PhraseOfDay from '../../components/PhraseOfDay.astro';
import CTA from '../../components/CTA.astro';

Polish is a language rich with affectionate expressions. Whether you're just starting to date a Polish speaker or have been together for years, using the right pet name can make your partner's heart melt.

## The Most Popular: Kochanie

<PhraseOfDay
  polish="Kochanie"
  english="Darling / Sweetheart"
  pronunciation="ko-HA-nyeh"
  context="The most universally used and always appropriate term of endearment."
/>

**Kochanie** is derived from the verb **kochać** (to love), making it literally mean "the one I love." You'll hear this everywhere in Poland - between young couples, married partners, and even parents to children.

<CultureTip title="Pronunciation Tip">
The stress in Polish almost always falls on the second-to-last syllable. So it's ko-HA-nyeh, not KO-ha-nyeh.
</CultureTip>

## Sweet & Playful Names

| Polish | Literal Meaning | Vibe |
|---|---|---|
| Misiaczek | Little teddy bear | Cute, playful |
| Kotku | Kitty | Sweet, casual |
| Słoneczko | Little sunshine | Warm, bright |
| Skarbie | Treasure | Very affectionate |
| Złotko | Little gold | Precious, dear |

<VocabCard
  polish="Misiaczek"
  english="Little teddy bear"
  pronunciation="mee-SHA-chek"
  example="Cześć misiaczku, jak się masz?"
/>

## For Your Boyfriend

- **Kochany** - beloved/dear (masculine)
- **Przystojniaku** - handsome one
- **Mój książę** - my prince
- **Tygrysie** - tiger (playful/fierce)

## For Your Girlfriend

- **Kochana** - beloved/dear (feminine)
- **Księżniczko** - princess
- **Piękna** - beautiful one
- **Aniołku** - little angel

> Pro tip: Add the diminutive suffix -ek, -ka, or -ko to almost any noun to make it sound more affectionate. Poles love diminutives!

---

<CTA
  text="Practice These With Your Partner"
  buttonText="Try It Free"
/>`;

// System prompt for Claude
const SYSTEM_PROMPT = `You are an expert Polish language educator writing SEO-optimized blog articles for "Love Languages" - an app that helps couples learn Polish together.

Your articles should be:
1. ACCURATE - Polish spelling, diacritics, and grammar must be perfect
2. EDUCATIONAL - Clear explanations with pronunciation guides in English phonetics
3. ENGAGING - Written for couples, romantic tone, practical examples
4. SEO-OPTIMIZED - Natural keyword usage, good heading structure
5. STRUCTURED - Use MDX components properly
6. TRANSLATED - EVERY Polish word/phrase MUST have an English translation inline

## Critical Rule: Always Translate
Every time you write a Polish word or phrase in the article body, you MUST include the English translation immediately after in parentheses. No exceptions.
- ✅ **chleb i sól** (bread and salt)
- ✅ The **oczepiny** (capping ceremony) is a beloved tradition
- ❌ During the oczepiny, guests dance... (missing translation!)

## Available MDX Components

Always import these at the top after frontmatter:
\`\`\`
import VocabCard from '../../components/VocabCard.astro';
import ConjugationTable from '../../components/ConjugationTable.astro';
import CultureTip from '../../components/CultureTip.astro';
import PhraseOfDay from '../../components/PhraseOfDay.astro';
import CTA from '../../components/CTA.astro';
\`\`\`

### VocabCard - For individual words/phrases
\`\`\`jsx
<VocabCard
  polish="Kocham cię"
  english="I love you"
  pronunciation="KO-ham cheh"
  example="Kocham cię najbardziej."
/>
\`\`\`

### PhraseOfDay - Featured phrase (use 1 per article, near top)
\`\`\`jsx
<PhraseOfDay
  polish="Kochanie"
  english="Darling"
  pronunciation="ko-HA-nyeh"
  context="The most common term of endearment."
/>
\`\`\`

### ConjugationTable - For verb conjugations
\`\`\`jsx
<ConjugationTable
  verb="Kochać"
  meaning="to love"
  conjugations={[
    { person: "I", polish: "kocham", english: "I love" },
    { person: "You (informal)", polish: "kochasz", english: "you love" },
    { person: "He/She", polish: "kocha", english: "he/she loves" },
    { person: "We", polish: "kochamy", english: "we love" },
    { person: "You (plural)", polish: "kochacie", english: "you all love" },
    { person: "They", polish: "kochają", english: "they love" }
  ]}
/>
\`\`\`

### CultureTip - Cultural insights (use 1-2 per article)
\`\`\`jsx
<CultureTip title="Did You Know?">
Cultural insight here...
</CultureTip>
\`\`\`

### CTA - Call to action (always at the end)
\`\`\`jsx
<CTA
  text="Ready to practice?"
  buttonText="Try It Free"
/>
\`\`\`

## Markdown Elements
- **Bold** for Polish words in flowing text
- Tables | for vocabulary lists
- Blockquotes > for pro tips
- Bullet lists - for quick vocab
- ## Headings for sections
- --- horizontal rule before CTA

## Pronunciation Guide Format
Use CAPS-style phonetic English: "KO-ham cheh"

## CRITICAL: Output Format
Return ONLY a valid JSON object (no markdown code blocks, no explanation):
{
  "frontmatter": {
    "title": "SEO title (avoid apostrophes if possible, or use Unicode)",
    "description": "150-160 char meta description",
    "category": "phrases|vocabulary|grammar|culture|situations",
    "difficulty": "beginner|intermediate|advanced",
    "readTime": 5,
    "tags": ["tag1", "tag2"]
  },
  "content": "Full MDX content starting with imports...",
  "imagePrompt": "Detailed prompt for hero image"
}`;

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate URL-safe slug from title
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/['']/g, '')            // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
}

/**
 * Escape title for YAML frontmatter (use double quotes to avoid escaping issues)
 */
export function escapeForYaml(str: string): string {
  // Use double quotes and escape internal double quotes
  return str.replace(/"/g, '\\"');
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate generated article content
 */
export function validateArticle(article: GeneratedArticle): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate frontmatter
  if (!article.frontmatter.title || article.frontmatter.title.length < 10) {
    errors.push('Title is missing or too short (min 10 chars)');
  }
  if (!article.frontmatter.description || article.frontmatter.description.length < 50) {
    errors.push('Description is missing or too short (min 50 chars)');
  }
  if (article.frontmatter.description && article.frontmatter.description.length > 160) {
    warnings.push('Description exceeds 160 chars (may be truncated in search results)');
  }
  if (!VALID_CATEGORIES.includes(article.frontmatter.category)) {
    errors.push(`Invalid category: ${article.frontmatter.category}`);
  }
  if (!VALID_DIFFICULTIES.includes(article.frontmatter.difficulty)) {
    errors.push(`Invalid difficulty: ${article.frontmatter.difficulty}`);
  }
  if (!article.frontmatter.readTime || article.frontmatter.readTime < 1) {
    errors.push('Invalid readTime');
  }
  if (!article.frontmatter.tags || article.frontmatter.tags.length === 0) {
    warnings.push('No tags provided');
  }

  // Validate content
  if (!article.content || article.content.length < 500) {
    errors.push('Content is missing or too short (min 500 chars)');
  }

  // Check for required imports
  const hasImports = REQUIRED_IMPORTS.some(imp =>
    article.content.includes(imp.split(' from')[0])
  );
  if (!hasImports) {
    warnings.push('Content may be missing component imports');
  }

  // Check for CTA at end
  if (!article.content.includes('<CTA')) {
    warnings.push('Content is missing CTA component');
  }

  // Check for unclosed JSX tags (basic check)
  // Count opening tags and both self-closing (/>) and closing tags (</Component>)
  const openTags = (article.content.match(/<(VocabCard|ConjugationTable|CultureTip|PhraseOfDay|CTA)[\s>]/g) || []).length;
  const selfCloseTags = (article.content.match(/\/>/g) || []).length;
  const closingTags = (article.content.match(/<\/(VocabCard|ConjugationTable|CultureTip|PhraseOfDay|CTA)>/g) || []).length;
  if (openTags > selfCloseTags + closingTags) {
    errors.push('Possible unclosed JSX component tags');
  }

  // Validate image prompt
  if (!article.imagePrompt || article.imagePrompt.length < 20) {
    warnings.push('Image prompt is missing or too short');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// GENERATION
// =============================================================================

/**
 * Generate article content using Claude API
 */
export async function generateArticleContent(
  options: GenerationOptions,
  apiKey?: string
): Promise<GeneratedArticle> {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  const anthropic = new Anthropic({ apiKey: key });

  // Build user prompt
  let userPrompt = `Write a comprehensive Polish learning article about: "${options.topic}"

Target audience: English-speaking couples learning Polish together.
Aim for 1200-1800 words of valuable educational content.`;

  if (options.category) {
    userPrompt += `\n\nCategory: ${options.category}`;
  }
  if (options.difficulty) {
    userPrompt += `\nDifficulty level: ${options.difficulty}`;
  }

  userPrompt += `

Here's an example of a well-structured article for reference:

${EXAMPLE_ARTICLE}

Now generate a NEW, ORIGINAL article about "${options.topic}".
Return ONLY a valid JSON object with frontmatter, content, and imagePrompt fields.
Do NOT wrap in markdown code blocks.`;

  // Call Claude API
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT
  });

  // Extract text content
  const textContent = message.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Invalid response from Claude API: no text content');
  }

  // Parse JSON response
  let jsonStr = textContent.text.trim();

  // Handle markdown code blocks if Claude wrapped it anyway
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to extract JSON if there's extra text
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  let parsed: { frontmatter: ArticleFrontmatter; content: string; imagePrompt: string };
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    throw new Error(`Failed to parse Claude response as JSON: ${parseError}`);
  }

  // Validate required fields exist
  if (!parsed.frontmatter || !parsed.content) {
    throw new Error('Response missing required fields (frontmatter or content)');
  }

  // Generate slug
  const slug = slugify(parsed.frontmatter.title);

  return {
    slug,
    frontmatter: parsed.frontmatter,
    content: parsed.content,
    imagePrompt: parsed.imagePrompt || 'Romantic Polish-themed illustration'
  };
}

// =============================================================================
// MDX FILE BUILDING
// =============================================================================

/**
 * Build complete MDX file content from generated article
 */
export function buildMdxContent(article: GeneratedArticle, date?: string): string {
  const articleDate = date || new Date().toISOString().split('T')[0];

  // Use double quotes for strings to avoid YAML escaping issues
  const frontmatter = `---
title: "${escapeForYaml(article.frontmatter.title)}"
description: "${escapeForYaml(article.frontmatter.description)}"
category: ${article.frontmatter.category}
difficulty: ${article.frontmatter.difficulty}
readTime: ${article.frontmatter.readTime}
date: '${articleDate}'
tags: [${article.frontmatter.tags.map(t => `'${t.replace(/'/g, '')}'`).join(', ')}]
---`;

  return `${frontmatter}\n${article.content}`;
}
