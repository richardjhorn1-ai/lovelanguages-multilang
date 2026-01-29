#!/usr/bin/env node
/**
 * PHASE 2: Migrate MDX files to Supabase
 * Reads all 5,275 MDX files and inserts into blog_articles table
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');
const BATCH_SIZE = 50;

// Stats
let totalFiles = 0;
let successCount = 0;
let errorCount = 0;
let skipCount = 0;
const errors = [];

/**
 * Parse MDX file and extract frontmatter + content
 */
function parseMDXFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: mdxContent } = matter(content);

  // Convert markdown to HTML (basic - strips MDX components)
  let contentHtml = '';
  try {
    // Remove import statements
    const cleanContent = mdxContent
      .replace(/^import\s+.*$/gm, '')
      .replace(/<VocabCard[\s\S]*?\/>/g, '') // Remove VocabCard components
      .replace(/<CultureTip[\s\S]*?>[\s\S]*?<\/CultureTip>/g, '') // Remove CultureTip
      .replace(/<ConjugationTable[\s\S]*?\/>/g, '')
      .replace(/<PhraseOfDay[\s\S]*?\/>/g, '')
      .replace(/<CTA[\s\S]*?\/>/g, '')
      .trim();

    contentHtml = marked(cleanContent);
  } catch (e) {
    contentHtml = mdxContent; // Fallback to raw content
  }

  return {
    frontmatter,
    content: mdxContent,
    contentHtml
  };
}

/**
 * Get all MDX files recursively
 */
function getMDXFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Extract native_lang and target_lang from file path
 * Path format: articles/{native_lang}/{target_lang}/{slug}.mdx
 */
function extractLangsFromPath(filePath) {
  const relative = path.relative(ARTICLES_DIR, filePath);
  const parts = relative.split(path.sep);

  if (parts.length >= 3) {
    return {
      native_lang: parts[0],
      target_lang: parts[1],
      slug: path.basename(parts[parts.length - 1], '.mdx')
    };
  }

  return null;
}

/**
 * Process a batch of files
 */
async function processBatch(files, batchNum, totalBatches) {
  const records = [];

  for (const filePath of files) {
    try {
      const langs = extractLangsFromPath(filePath);
      if (!langs) {
        skipCount++;
        continue;
      }

      const { frontmatter, content, contentHtml } = parseMDXFile(filePath);

      // Skip if no title
      if (!frontmatter.title) {
        skipCount++;
        continue;
      }

      records.push({
        slug: langs.slug,
        native_lang: langs.native_lang,
        target_lang: langs.target_lang,
        title: frontmatter.title,
        description: frontmatter.description || null,
        category: frontmatter.category || null,
        difficulty: frontmatter.difficulty || null,
        read_time: frontmatter.readTime || frontmatter.read_time || null,
        image: frontmatter.image || null,
        tags: frontmatter.tags || [],
        content: content,
        content_html: contentHtml,
        date: frontmatter.date || null,
        published: true
      });

    } catch (err) {
      errorCount++;
      errors.push({ file: filePath, error: err.message });
    }
  }

  if (records.length === 0) return;

  // Upsert to Supabase
  const { data, error } = await supabase
    .from('blog_articles')
    .upsert(records, {
      onConflict: 'native_lang,target_lang,slug',
      ignoreDuplicates: false
    });

  if (error) {
    console.error(`  ❌ Batch ${batchNum}/${totalBatches} failed:`, error.message);
    errorCount += records.length;
    errors.push({ batch: batchNum, error: error.message });
  } else {
    successCount += records.length;
    console.log(`  ✅ Batch ${batchNum}/${totalBatches}: ${records.length} articles`);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 PHASE 2: Migrating MDX files to Supabase\n');
  console.log(`📁 Source: ${ARTICLES_DIR}\n`);

  // Check if directory exists
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('❌ Articles directory not found!');
    process.exit(1);
  }

  // Get all MDX files
  console.log('📂 Scanning for MDX files...');
  const files = getMDXFiles(ARTICLES_DIR);
  totalFiles = files.length;
  console.log(`   Found ${totalFiles} files\n`);

  if (totalFiles === 0) {
    console.log('No files to migrate.');
    return;
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    batches.push(files.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < batches.length; i++) {
    await processBatch(batches[i], i + 1, batches.length);

    // Small delay to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total files:    ${totalFiles}`);
  console.log(`✅ Success:     ${successCount}`);
  console.log(`⏭️  Skipped:     ${skipCount}`);
  console.log(`❌ Errors:      ${errorCount}`);

  if (errors.length > 0 && errors.length <= 10) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.file || e.batch}: ${e.error}`));
  } else if (errors.length > 10) {
    console.log(`\nFirst 10 errors:`);
    errors.slice(0, 10).forEach(e => console.log(`  - ${e.file || e.batch}: ${e.error}`));
  }

  console.log('\n');
}

// Run
migrate().then(() => {
  console.log('✅ PHASE 2 COMPLETE\n');
  process.exit(errorCount > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
