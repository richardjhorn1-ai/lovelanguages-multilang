#!/usr/bin/env npx tsx
/**
 * CLI tool for generating Polish learning blog articles.
 *
 * Usage:
 *   npm run generate-article "Polish Wedding Phrases"
 *   npm run generate-article "Polish Wedding Phrases" --category phrases
 *   npm run generate-article "Polish Wedding Phrases" --difficulty intermediate
 *   npm run generate-article "Polish Wedding Phrases" --dry-run
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY environment variable
 *
 * Optional (for tracking):
 *   - SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  generateArticleContent,
  validateArticle,
  buildMdxContent,
  type GeneratedArticle
} from '../utils/article-generator.js';

// =============================================================================
// CLI UTILITIES
// =============================================================================

const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

interface CliArgs {
  topic: string;
  category?: string;
  difficulty?: string;
  dryRun: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = { topic: '', dryRun: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--category' && args[i + 1]) {
      result.category = args[++i];
    } else if (arg === '--difficulty' && args[i + 1]) {
      result.difficulty = args[++i];
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (!arg.startsWith('--') && !result.topic) {
      result.topic = arg;
    }
  }

  return result;
}

function printUsage(): void {
  console.log(colors.bold('\n📝 Blog Article Generator\n'));
  console.log(colors.yellow('Usage:'));
  console.log('  npm run generate-article "Topic" [options]\n');
  console.log(colors.yellow('Options:'));
  console.log('  --category <type>     phrases, vocabulary, grammar, culture, situations');
  console.log('  --difficulty <level>  beginner, intermediate, advanced');
  console.log('  --dry-run             Generate but don\'t save to disk\n');
  console.log(colors.yellow('Examples:'));
  console.log('  npm run generate-article "Polish Wedding Phrases"');
  console.log('  npm run generate-article "How to Say Beautiful" --category phrases');
  console.log('  npm run generate-article "Polish Grammar" --difficulty intermediate --dry-run\n');
}

// =============================================================================
// DATABASE TRACKING (OPTIONAL)
// =============================================================================

async function trackGeneration(
  article: GeneratedArticle,
  topic: string
): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(colors.dim('  (Database tracking skipped - no Supabase config)'));
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('article_generations').insert({
      slug: article.slug,
      topic: topic,
      category: article.frontmatter.category,
      difficulty: article.frontmatter.difficulty,
      word_count: article.content.split(/\s+/).length,
      has_image: false
    });

    console.log(colors.dim('  (Tracked in database)'));
    return true;
  } catch (error: any) {
    console.log(colors.dim(`  (Database tracking failed: ${error.message})`));
    return false;
  }
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

interface ExistingArticle {
  slug: string;
  title: string;
}

function getExistingArticles(): ExistingArticle[] {
  const blogDir = path.join(process.cwd(), 'blog', 'src', 'content', 'articles');
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
  const articles: ExistingArticle[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const titleMatch = content.match(/title:\s*["'](.+?)["']/);
    if (titleMatch) {
      articles.push({
        slug: file.replace('.mdx', ''),
        title: titleMatch[1]
      });
    }
  }
  return articles;
}

function normalizeForComparison(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSimilarArticles(topic: string, existing: ExistingArticle[]): ExistingArticle[] {
  const normalizedTopic = normalizeForComparison(topic);
  const topicWords = new Set(normalizedTopic.split(' ').filter(w => w.length > 3));

  return existing.filter(article => {
    const normalizedTitle = normalizeForComparison(article.title);
    const titleWords = new Set(normalizedTitle.split(' ').filter(w => w.length > 3));

    // Check for significant word overlap
    let matches = 0;
    for (const word of topicWords) {
      if (titleWords.has(word)) matches++;
    }

    // If more than 50% of topic words match, it's probably similar
    return topicWords.size > 0 && matches / topicWords.size > 0.5;
  });
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.topic) {
    printUsage();
    process.exit(1);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(colors.red('\n❌ Error: ANTHROPIC_API_KEY environment variable is required\n'));
    console.log('Set it with: export ANTHROPIC_API_KEY=your-key-here\n');
    process.exit(1);
  }

  // Check for existing similar articles
  const existing = getExistingArticles();
  const similar = findSimilarArticles(args.topic, existing);

  if (similar.length > 0) {
    console.log(colors.yellow('\n⚠️  Similar articles already exist:\n'));
    similar.forEach(a => console.log(colors.yellow(`  • ${a.title}`)));
    console.log(colors.yellow(`\n  Slug(s): ${similar.map(a => a.slug).join(', ')}`));
    console.log(colors.dim('\n  Use a different topic or add --force to override.\n'));
    if (!process.argv.includes('--force')) {
      process.exit(1);
    }
    console.log(colors.yellow('  --force flag detected, continuing anyway...\n'));
  }

  console.log(colors.bold('\n📝 Generating Article\n'));
  console.log(`  Topic: ${colors.cyan(args.topic)}`);
  if (args.category) console.log(`  Category: ${args.category}`);
  if (args.difficulty) console.log(`  Difficulty: ${args.difficulty}`);
  if (args.dryRun) console.log(colors.yellow('  Mode: DRY RUN (won\'t save)'));
  console.log('');

  try {
    // Generate article
    console.log(colors.dim('  Calling Claude API...'));
    const article = await generateArticleContent({
      topic: args.topic,
      category: args.category,
      difficulty: args.difficulty
    });

    // Validate
    console.log(colors.dim('  Validating content...'));
    const validation = validateArticle(article);

    if (!validation.valid) {
      console.log(colors.red('\n❌ Validation Failed:\n'));
      validation.errors.forEach(e => console.log(colors.red(`  • ${e}`)));
      if (validation.warnings.length > 0) {
        console.log(colors.yellow('\n⚠️  Warnings:'));
        validation.warnings.forEach(w => console.log(colors.yellow(`  • ${w}`)));
      }
      process.exit(1);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.log(colors.yellow('\n⚠️  Warnings:'));
      validation.warnings.forEach(w => console.log(colors.yellow(`  • ${w}`)));
    }

    // Success output
    console.log(colors.green('\n✅ Article Generated\n'));
    console.log(`  ${colors.bold('Title:')} ${article.frontmatter.title}`);
    console.log(`  ${colors.bold('Slug:')} ${article.slug}`);
    console.log(`  ${colors.bold('Category:')} ${article.frontmatter.category}`);
    console.log(`  ${colors.bold('Difficulty:')} ${article.frontmatter.difficulty}`);
    console.log(`  ${colors.bold('Read time:')} ${article.frontmatter.readTime} min`);
    console.log(`  ${colors.bold('Words:')} ~${article.content.split(/\s+/).length}`);

    if (args.dryRun) {
      console.log(colors.yellow('\n🔍 Dry run - not saving file\n'));
      console.log(colors.dim('Preview of frontmatter:'));
      console.log(colors.dim('---'));
      console.log(colors.dim(`title: "${article.frontmatter.title}"`));
      console.log(colors.dim(`category: ${article.frontmatter.category}`));
      console.log(colors.dim('---\n'));
      return;
    }

    // Build MDX content
    const mdxContent = buildMdxContent(article);

    // Save to disk
    const blogDir = path.join(process.cwd(), 'blog', 'src', 'content', 'articles');
    const filePath = path.join(blogDir, `${article.slug}.mdx`);

    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      console.log(colors.yellow(`\n⚠️  File exists: ${article.slug}.mdx - Overwriting`));
    }

    fs.writeFileSync(filePath, mdxContent, 'utf-8');
    console.log(colors.green(`\n📁 Saved: blog/src/content/articles/${article.slug}.mdx`));

    // Track in database
    await trackGeneration(article, args.topic);

    // Image prompt
    console.log(colors.cyan('\n🎨 Image prompt for Glif/DALL-E:'));
    console.log(colors.dim(`  "${article.imagePrompt}"\n`));

    // Next steps
    console.log(colors.bold('📋 Next steps:'));
    console.log('  1. Review the generated article');
    console.log('  2. Generate hero image (optional)');
    console.log('  3. Build: cd blog && npm run build');
    console.log('  4. Commit and deploy\n');

  } catch (error: any) {
    console.error(colors.red(`\n❌ Error: ${error.message}\n`));

    if (error.message.includes('API')) {
      console.log(colors.dim('Check your ANTHROPIC_API_KEY is valid\n'));
    }

    process.exit(1);
  }
}

main();
