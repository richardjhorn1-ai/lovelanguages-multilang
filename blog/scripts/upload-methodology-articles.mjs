#!/usr/bin/env node
/**
 * Upload Couples Methodology articles to Supabase
 *
 * These are general methodology articles translated to 17 languages.
 * Stored with target_lang = 'all' (not target-specific)
 * URL: /learn/[native_lang]/couples-language-learning/methodology/[slug]/
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const methodologyDir = path.join(__dirname, '../content-drafts/couples-methodology');

// All 17 native languages
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'ro', 'nl', 'sv', 'no', 'da', 'cs', 'ru', 'uk', 'el', 'hu', 'tr'];

// Article metadata (since HTML files don't have frontmatter)
const ARTICLE_META = {
  'ai-coaching-for-couples-learning-together': {
    title_en: 'How AI Coaching Keeps You Both on Track',
    description_en: 'Learn how AI coaching eliminates the teacher-student dynamic that ruins romance when couples learn languages together.',
    read_time: 8,
    difficulty: 'beginner'
  },
  'benefits-learning-partners-language': {
    title_en: "Why Learning Your Partner's Language Changes Everything",
    description_en: 'Discover the psychology behind why learning your partner\'s language is the ultimate relationship investment.',
    read_time: 10,
    difficulty: 'beginner'
  },
  'couples-language-learning-mistakes': {
    title_en: 'Common Mistakes Couples Make When Learning a Language Together',
    description_en: 'Avoid the 5 most common mistakes that cause couples to abandon language learning - backed by science.',
    read_time: 9,
    difficulty: 'beginner'
  },
  'couples-language-learning-roadmap': {
    title_en: 'From Zero to Conversations — Your Couples Roadmap',
    description_en: 'A 12-week roadmap to go from complete beginner to real conversations with your partner.',
    read_time: 12,
    difficulty: 'beginner'
  },
  'language-learning-date-night-ideas': {
    title_en: 'Language Learning Date Night Ideas',
    description_en: 'Turn language practice into quality time with these creative date night activities.',
    read_time: 7,
    difficulty: 'beginner'
  },
  'long-distance-couples-language-learning': {
    title_en: 'Language Learning for Long-Distance Couples',
    description_en: 'How to learn your partner\'s language when you\'re miles apart - strategies that actually work.',
    read_time: 8,
    difficulty: 'beginner'
  },
  'rall-strategies-for-couples-learning-together': {
    title_en: 'RALL Strategies for Couples Learning Together',
    description_en: 'Reciprocal Assisted Language Learning (RALL) techniques designed specifically for couples.',
    read_time: 10,
    difficulty: 'intermediate'
  },
  'science-of-couples-language-learning': {
    title_en: 'The Science of Couples Language Learning',
    description_en: 'The research-backed science behind why couples who learn together, stay together.',
    read_time: 12,
    difficulty: 'beginner'
  }
};

// Extract title from HTML <h1> tag
function extractTitle(html) {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return match ? match[1].replace(/<[^>]+>/g, '').trim() : null;
}

// Extract first paragraph as description
function extractDescription(html) {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (match) {
    let desc = match[1].replace(/<[^>]+>/g, '').trim();
    // Truncate to 160 chars for SEO
    if (desc.length > 160) {
      desc = desc.substring(0, 157) + '...';
    }
    return desc;
  }
  return null;
}

async function uploadArticle(filePath, nativeLang) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, '.html');

  const meta = ARTICLE_META[slug] || {};

  // Extract or use default title
  const extractedTitle = extractTitle(html);
  const title = extractedTitle || meta.title_en || slug.replace(/-/g, ' ');

  // Extract or use default description
  const extractedDesc = extractDescription(html);
  const description = extractedDesc || meta.description_en || null;

  const record = {
    slug,
    native_lang: nativeLang,
    target_lang: 'all',  // Not target-specific
    title,
    description,
    category: 'couples-methodology',
    difficulty: meta.difficulty || 'beginner',
    read_time: meta.read_time || 10,
    image: null,  // Can add later
    tags: ['couples', 'methodology', 'language-learning'],
    content: html,  // Store original HTML
    content_html: html,  // Already HTML
    date: new Date().toISOString().split('T')[0],
    published: true
  };

  const { data, error } = await supabase
    .from('blog_articles')
    .upsert(record, { onConflict: 'native_lang,target_lang,slug' })
    .select();

  if (error) {
    console.error(`❌ Error uploading ${nativeLang}/${slug}:`, error.message);
    return null;
  }

  return data;
}

async function main() {
  console.log('📤 Uploading Couples Methodology articles to Supabase...\n');

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const lang of LANGUAGES) {
    const langDir = path.join(methodologyDir, lang);

    if (!fs.existsSync(langDir)) {
      console.log(`⏭️  Skipping ${lang} - directory not found`);
      skipped++;
      continue;
    }

    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.html'));

    if (files.length === 0) {
      console.log(`⏭️  Skipping ${lang} - no HTML files`);
      skipped++;
      continue;
    }

    console.log(`\n📁 Processing ${lang.toUpperCase()} (${files.length} files)...`);

    for (const file of files) {
      const result = await uploadArticle(path.join(langDir, file), lang);
      if (result) {
        console.log(`  ✅ ${slug(file)}`);
        success++;
      } else {
        failed++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Uploaded: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped languages: ${skipped}`);
  console.log('='.repeat(50));
}

function slug(filename) {
  return filename.replace('.html', '');
}

main().catch(console.error);
