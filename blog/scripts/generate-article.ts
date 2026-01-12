#!/usr/bin/env npx ts-node
/**
 * Article Generator for Love Languages Blog
 *
 * Generates SEO-friendly MDX articles using Claude AI and hero images via Glif.
 *
 * Usage:
 *   npx ts-node scripts/generate-article.ts --language es --topic "Spanish greetings"
 *   npx ts-node scripts/generate-article.ts -l fr -t "French romantic phrases" --no-image
 *
 * Options:
 *   -l, --language   Target language code (e.g., pl, es, fr, de) [required]
 *   -t, --topic      Article topic or title idea [required]
 *   -c, --category   Article category (phrases|vocabulary|grammar|culture|situations) [default: vocabulary]
 *   -d, --difficulty Difficulty level (beginner|intermediate|advanced) [default: beginner]
 *   --no-image       Skip hero image generation
 *   --dry-run        Preview generated content without saving
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Claude API key (required)
 *   GLIF_API_KEY      - Glif API key (optional, for image generation)
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language info for all 18 supported languages
const LANGUAGE_INFO: Record<string, { flag: string; name: string; nativeName: string; romantic: string }> = {
  en: { flag: '🇬🇧', name: 'English', nativeName: 'English', romantic: 'I love you' },
  es: { flag: '🇪🇸', name: 'Spanish', nativeName: 'Español', romantic: 'Te quiero' },
  fr: { flag: '🇫🇷', name: 'French', nativeName: 'Français', romantic: 'Je t\'aime' },
  it: { flag: '🇮🇹', name: 'Italian', nativeName: 'Italiano', romantic: 'Ti amo' },
  pt: { flag: '🇵🇹', name: 'Portuguese', nativeName: 'Português', romantic: 'Eu te amo' },
  ro: { flag: '🇷🇴', name: 'Romanian', nativeName: 'Română', romantic: 'Te iubesc' },
  de: { flag: '🇩🇪', name: 'German', nativeName: 'Deutsch', romantic: 'Ich liebe dich' },
  nl: { flag: '🇳🇱', name: 'Dutch', nativeName: 'Nederlands', romantic: 'Ik hou van je' },
  sv: { flag: '🇸🇪', name: 'Swedish', nativeName: 'Svenska', romantic: 'Jag älskar dig' },
  no: { flag: '🇳🇴', name: 'Norwegian', nativeName: 'Norsk', romantic: 'Jeg elsker deg' },
  da: { flag: '🇩🇰', name: 'Danish', nativeName: 'Dansk', romantic: 'Jeg elsker dig' },
  pl: { flag: '🇵🇱', name: 'Polish', nativeName: 'Polski', romantic: 'Kocham cię' },
  cs: { flag: '🇨🇿', name: 'Czech', nativeName: 'Čeština', romantic: 'Miluji tě' },
  ru: { flag: '🇷🇺', name: 'Russian', nativeName: 'Русский', romantic: 'Я тебя люблю' },
  uk: { flag: '🇺🇦', name: 'Ukrainian', nativeName: 'Українська', romantic: 'Я тебе кохаю' },
  el: { flag: '🇬🇷', name: 'Greek', nativeName: 'Ελληνικά', romantic: 'Σ\'αγαπώ' },
  hu: { flag: '🇭🇺', name: 'Hungarian', nativeName: 'Magyar', romantic: 'Szeretlek' },
  tr: { flag: '🇹🇷', name: 'Turkish', nativeName: 'Türkçe', romantic: 'Seni seviyorum' },
};

interface ArticleConfig {
  language: string;
  topic: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dryRun: boolean;
  noImage: boolean;
}

interface GeneratedArticle {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  readTime: number;
  imagePrompt: string;
}

function parseArgs(): ArticleConfig {
  const args = process.argv.slice(2);
  const config: ArticleConfig = {
    language: '',
    topic: '',
    category: 'vocabulary',
    difficulty: 'beginner',
    dryRun: false,
    noImage: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-l':
      case '--language':
        config.language = args[++i];
        break;
      case '-t':
      case '--topic':
        config.topic = args[++i];
        break;
      case '-c':
      case '--category':
        config.category = args[++i] as ArticleConfig['category'];
        break;
      case '-d':
      case '--difficulty':
        config.difficulty = args[++i] as ArticleConfig['difficulty'];
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--no-image':
        config.noImage = true;
        break;
      case '-h':
      case '--help':
        console.log(`
Article Generator for Love Languages Blog (Claude + Glif)

Usage:
  npx ts-node scripts/generate-article.ts --language es --topic "Spanish greetings"

Options:
  -l, --language   Target language code (e.g., pl, es, fr, de) [required]
  -t, --topic      Article topic or title idea [required]
  -c, --category   Article category [default: vocabulary]
                   (phrases|vocabulary|grammar|culture|situations)
  -d, --difficulty Difficulty level [default: beginner]
                   (beginner|intermediate|advanced)
  --no-image       Skip hero image generation
  --dry-run        Preview generated content without saving
  -h, --help       Show this help message

Environment Variables:
  ANTHROPIC_API_KEY - Claude API key (required)
  GLIF_API_KEY      - Glif API key (optional, for hero images)

Supported Languages:
  ${Object.entries(LANGUAGE_INFO).map(([code, info]) => `${code} - ${info.name}`).join('\n  ')}
`);
        process.exit(0);
    }
  }

  if (!config.language || !config.topic) {
    console.error('Error: --language and --topic are required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  if (!LANGUAGE_INFO[config.language]) {
    console.error(`Error: Unsupported language code: ${config.language}`);
    console.error(`Supported: ${Object.keys(LANGUAGE_INFO).join(', ')}`);
    process.exit(1);
  }

  return config;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateArticle(config: ArticleConfig): Promise<GeneratedArticle> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const client = new Anthropic({ apiKey });
  const langInfo = LANGUAGE_INFO[config.language];

  const prompt = `You are an expert ${langInfo.name} language teacher creating content for couples learning together. Generate a comprehensive, SEO-friendly MDX blog article.

TOPIC: ${config.topic}
TARGET LANGUAGE: ${langInfo.name} (${config.language})
CATEGORY: ${config.category}
DIFFICULTY: ${config.difficulty}

REQUIREMENTS:
1. Title should be SEO-friendly, include "${langInfo.name}" and be engaging for couples
2. Description should be 150-160 characters for optimal SEO
3. Content should be 1000-1500 words with excellent formatting
4. Include practical examples couples can practice together
5. Use these MDX components (with language-agnostic props):

<VocabCard
  word="${langInfo.name} word here"
  translation="English translation"
  pronunciation="phonetic guide"
  example="Example sentence in ${langInfo.name}"
/>

<PhraseOfDay
  word="${langInfo.name} phrase"
  translation="English translation"
  pronunciation="phonetic guide"
  context="When to use this phrase"
/>

<CultureTip title="Cultural Insight" flag="${langInfo.flag}">
  Cultural information relevant to the topic
</CultureTip>

<ConjugationTable
  verb="${langInfo.name} verb"
  meaning="English meaning"
  conjugations={[
    { person: "I", word: "conjugated form", translation: "English" },
    { person: "You", word: "form", translation: "English" },
  ]}
/>

6. Include markdown tables where appropriate
7. End with: <CTA text="Ready to master ${langInfo.name} together?" buttonText="Start Learning Now" />
8. Generate 4-6 relevant tags
9. Generate an image prompt for a photorealistic hero image (romantic couple, language learning theme)

IMPORTANT:
- Use "word" and "translation" props (NOT polish/english)
- Include the flag prop "${langInfo.flag}" for CultureTip components
- Make content engaging and romantic for couples
- Include pronunciation guides in brackets [like-THIS]
- Bold ${langInfo.name} words with translations in parentheses
- The romantic phrase "${langInfo.romantic}" means "I love you" in ${langInfo.name}

Return your response as JSON with this exact structure:
{
  "title": "SEO-friendly title with ${langInfo.name}",
  "description": "150-160 char meta description",
  "content": "Full MDX content (without frontmatter, start with intro paragraph)",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "readTime": 8,
  "imagePrompt": "Photorealistic image prompt for hero image"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract JSON from response
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const article = JSON.parse(jsonStr.trim());
  const slug = slugify(article.title);

  return {
    ...article,
    slug,
  };
}

async function generateImage(imagePrompt: string, slug: string, language: string): Promise<string | null> {
  const glifKey = process.env.GLIF_API_KEY;
  if (!glifKey) {
    console.log('⚠️  GLIF_API_KEY not set, skipping image generation');
    return null;
  }

  try {
    console.log('🎨 Generating hero image with Glif...');

    // Use Glif's z-image-turbo for photorealistic images
    // The glif ID for z-image-turbo (you may need to adjust this)
    const response = await fetch('https://simple-api.glif.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${glifKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'cm2mdqx6f0002l8bbv1gn4zs0', // z-image-turbo glif ID
        inputs: {
          prompt: `${imagePrompt}, photorealistic, high quality, 4k, romantic atmosphere, warm lighting, couple learning language together`,
        },
      }),
    });

    if (!response.ok) {
      console.error('Glif API error:', await response.text());
      return null;
    }

    const result = await response.json();
    const imageUrl = result.output;

    if (!imageUrl) {
      console.log('⚠️  No image URL returned from Glif');
      return null;
    }

    // Download and save the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const imagesDir = path.join(__dirname, '..', 'public', 'images', 'articles', language);
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imagePath = path.join(imagesDir, `${slug}.jpg`);
    fs.writeFileSync(imagePath, imageBuffer);

    console.log(`✅ Image saved: /images/articles/${language}/${slug}.jpg`);
    return `/images/articles/${language}/${slug}.jpg`;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

function buildMdxFile(article: GeneratedArticle, config: ArticleConfig, imagePath: string | null): string {
  const today = new Date().toISOString().split('T')[0];

  const frontmatter = `---
title: "${article.title.replace(/"/g, '\\"')}"
description: "${article.description.replace(/"/g, '\\"')}"
category: ${config.category}
difficulty: ${config.difficulty}
readTime: ${article.readTime}
date: '${today}'
tags: [${article.tags.map(t => `'${t}'`).join(', ')}]
language: ${config.language}
nativeLanguage: en${imagePath ? `\nimage: '${imagePath}'` : ''}
---
import VocabCard from '@components/VocabCard.astro';
import ConjugationTable from '@components/ConjugationTable.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

`;

  return frontmatter + article.content;
}

async function main() {
  const config = parseArgs();
  const langInfo = LANGUAGE_INFO[config.language];

  console.log(`\n🌍 Generating ${langInfo.name} article with Claude...`);
  console.log(`   Topic: ${config.topic}`);
  console.log(`   Category: ${config.category}`);
  console.log(`   Difficulty: ${config.difficulty}\n`);

  try {
    // Generate article content
    const article = await generateArticle(config);

    console.log(`✅ Generated: "${article.title}"`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   Read time: ${article.readTime} min`);
    console.log(`   Tags: ${article.tags.join(', ')}\n`);

    // Generate hero image (unless --no-image or dry run)
    let imagePath: string | null = null;
    if (!config.noImage && !config.dryRun) {
      imagePath = await generateImage(article.imagePrompt, article.slug, config.language);
    }

    // Build final MDX content
    const mdxContent = buildMdxFile(article, config, imagePath);

    if (config.dryRun) {
      console.log('--- DRY RUN: Content Preview ---\n');
      console.log(mdxContent);
      console.log('\n--- Image Prompt ---');
      console.log(article.imagePrompt);
      console.log('\n--- End Preview ---');
    } else {
      // Ensure language directory exists
      const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles', config.language);
      if (!fs.existsSync(articlesDir)) {
        fs.mkdirSync(articlesDir, { recursive: true });
        console.log(`📁 Created directory: articles/${config.language}/`);
      }

      // Write the file
      const filePath = path.join(articlesDir, `${article.slug}.mdx`);
      fs.writeFileSync(filePath, mdxContent);
      console.log(`📝 Saved: articles/${config.language}/${article.slug}.mdx`);
    }

    console.log('\n🎉 Done!\n');
  } catch (error) {
    console.error('❌ Error generating article:', error);
    process.exit(1);
  }
}

main();
