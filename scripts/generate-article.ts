#!/usr/bin/env npx tsx
/**
 * CLI tool for generating Polish learning blog articles.
 *
 * Usage:
 *   npm run generate-article "Polish Wedding Phrases"
 *   npm run generate-article "Polish Wedding Phrases" --category phrases
 *   npm run generate-article "Polish Wedding Phrases" --difficulty intermediate
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY environment variable
 *   - Optional: Glif MCP for image generation
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Article frontmatter schema
interface ArticleFrontmatter {
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
}

interface GeneratedArticle {
  frontmatter: ArticleFrontmatter;
  content: string;
  imagePrompt: string;
}

// Colors for console output
const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

// Example article for few-shot learning
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

Polish is a language rich with affectionate expressions...

## The Most Popular: Kochanie

<PhraseOfDay
  polish="Kochanie"
  english="Darling / Sweetheart"
  pronunciation="ko-HA-nyeh"
  context="The most universally used and always appropriate term of endearment."
/>

<CultureTip title="Pronunciation Tip">
The stress in Polish almost always falls on the second-to-last syllable.
</CultureTip>

<VocabCard
  polish="Misiaczek"
  english="Little teddy bear"
  pronunciation="mee-SHA-chek"
  example="Cześć misiaczku, jak się masz?"
/>

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
  pronunciation="KO-ham cheh"  // Optional
  example="Kocham cię najbardziej."  // Optional
/>
\`\`\`

### PhraseOfDay - Featured phrase (use 1 per article, near top)
\`\`\`jsx
<PhraseOfDay
  polish="Kochanie"
  english="Darling"
  pronunciation="ko-HA-nyeh"  // Required
  context="The most common term of endearment."  // Optional
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

## Output Format
Return a JSON object:
{
  "frontmatter": {
    "title": "SEO title",
    "description": "150-160 char meta description",
    "category": "phrases|vocabulary|grammar|culture|situations",
    "difficulty": "beginner|intermediate|advanced",
    "readTime": 5,
    "tags": ["tag1", "tag2"]
  },
  "content": "Full MDX content starting with imports...",
  "imagePrompt": "Detailed prompt for hero image"
}`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseArgs(args: string[]): { topic: string; category?: string; difficulty?: string } {
  const result: { topic: string; category?: string; difficulty?: string } = { topic: '' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--category' && args[i + 1]) {
      result.category = args[++i];
    } else if (arg === '--difficulty' && args[i + 1]) {
      result.difficulty = args[++i];
    } else if (!arg.startsWith('--') && !result.topic) {
      result.topic = arg;
    }
  }

  return result;
}

async function generateArticle(
  topic: string,
  category?: string,
  difficulty?: string
): Promise<GeneratedArticle> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const anthropic = new Anthropic({ apiKey });

  let userPrompt = `Write a comprehensive Polish learning article about: "${topic}"

Target audience: English-speaking couples learning Polish together.
Aim for 1200-1800 words of valuable content.`;

  if (category) {
    userPrompt += `\n\nCategory hint: ${category}`;
  }
  if (difficulty) {
    userPrompt += `\nDifficulty level: ${difficulty}`;
  }

  userPrompt += `

Here's an example of a well-structured article:

${EXAMPLE_ARTICLE}

Generate a NEW article about "${topic}" following the same format.
Return your response as a valid JSON object with frontmatter, content, and imagePrompt fields.`;

  console.log(colors.cyan('Generating article with Claude...'));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT
  });

  const textContent = message.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Invalid response from Claude API');
  }

  // Parse JSON response
  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  return JSON.parse(jsonStr.trim());
}

function buildMdxFile(article: GeneratedArticle): string {
  const date = new Date().toISOString().split('T')[0];

  const frontmatter = `---
title: '${article.frontmatter.title.replace(/'/g, "''")}'
description: '${article.frontmatter.description.replace(/'/g, "''")}'
category: ${article.frontmatter.category}
difficulty: ${article.frontmatter.difficulty}
readTime: ${article.frontmatter.readTime}
date: '${date}'
tags: [${article.frontmatter.tags.map(t => `'${t}'`).join(', ')}]
---`;

  return `${frontmatter}\n${article.content}`;
}

async function main() {
  console.log(colors.bold('\n Blog Article Generator\n'));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const { topic, category, difficulty } = parseArgs(args);

  if (!topic) {
    console.log(colors.yellow('Usage: npm run generate-article "Topic" [--category phrases] [--difficulty beginner]\n'));
    console.log('Categories: phrases, vocabulary, grammar, culture, situations');
    console.log('Difficulties: beginner, intermediate, advanced\n');
    process.exit(1);
  }

  try {
    // Generate article
    const article = await generateArticle(topic, category, difficulty);
    const slug = slugify(article.frontmatter.title);

    console.log(colors.green(`\n Title: ${article.frontmatter.title}`));
    console.log(colors.cyan(`   Slug: ${slug}`));
    console.log(colors.cyan(`   Category: ${article.frontmatter.category}`));
    console.log(colors.cyan(`   Difficulty: ${article.frontmatter.difficulty}`));
    console.log(colors.cyan(`   Read time: ${article.frontmatter.readTime} min`));

    // Build MDX content
    const mdxContent = buildMdxFile(article);

    // Save to blog content directory
    const blogDir = path.join(process.cwd(), 'blog', 'src', 'content', 'articles');
    const filePath = path.join(blogDir, `${slug}.mdx`);

    // Ensure directory exists
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(colors.yellow(`\n Warning: ${slug}.mdx already exists. Overwriting...`));
    }

    fs.writeFileSync(filePath, mdxContent, 'utf-8');
    console.log(colors.green(`\n Saved: blog/src/content/articles/${slug}.mdx`));

    // Log image prompt for manual image generation
    console.log(colors.cyan('\n Image prompt for Glif/DALL-E:'));
    console.log(`   "${article.imagePrompt}"\n`);

    // Success instructions
    console.log(colors.bold('Next steps:'));
    console.log('  1. Review the generated article');
    console.log('  2. Generate hero image using the prompt above');
    console.log('  3. Run: cd blog && npm run build');
    console.log('  4. Commit and deploy\n');

  } catch (error: any) {
    console.error(colors.red(`\n Error: ${error.message}\n`));
    process.exit(1);
  }
}

main();
