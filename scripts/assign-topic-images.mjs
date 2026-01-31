#!/usr/bin/env node
/**
 * Assign topic-based images to all articles in Supabase
 * Matches articles to topics by slug patterns and assigns the correct image
 *
 * Usage: node scripts/assign-topic-images.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

// Topic matching patterns (order matters - more specific first)
const TOPIC_PATTERNS = [
  { topic: 'wedding', patterns: ['wedding', 'marry', 'proposal'] },
  { topic: 'anniversary', patterns: ['anniversary'] },
  { topic: 'first-date', patterns: ['first-date', 'first date'] },
  { topic: 'love-letter', patterns: ['love-letter', 'love letter'] },
  { topic: 'miss-you', patterns: ['miss-you', 'miss you', 'missing'] },
  { topic: 'pet-names', patterns: ['pet-name', 'term-of-endearment', 'nickname', 'koseslowka', 'mazlive', 'kosenavn', 'koseord'] },
  { topic: 'i-love-you', patterns: ['i-love-you', 'how-to-say-i-love', 'te-quiero', 'ti-amo', 'ich-liebe', 'je-taime', 'kocham'] },
  { topic: 'romantic-phrases', patterns: ['romantic-phrase', 'love-phrase', 'romantick'] },
  { topic: 'meeting-family', patterns: ['meeting-', 'family', 'in-law', 'parents', 'rodzina', 'famille', 'familia'] },
  { topic: 'greetings', patterns: ['greeting', 'farewell', 'hello', 'goodbye', 'pozdrav'] },
  { topic: 'date-night', patterns: ['date-night', 'date night', 'randka'] },
  { topic: 'compliments', patterns: ['compliment', 'kompl'] },
  { topic: 'flirting', patterns: ['flirt'] },
  { topic: 'grammar', patterns: ['grammar', 'verb', 'conjugat', 'gramatyka', 'grammaire'] },
  { topic: 'pronunciation', patterns: ['pronunciation', 'pronounce', 'wymowa', 'prononciation'] },
  { topic: 'common-words', patterns: ['100-common', '50-common', 'common-word', 'basic-word'] },
  { topic: 'hard-to-learn', patterns: ['hard-to-learn', 'is-this-language-hard', 'difficult', 'trudny'] },
  { topic: 'support', patterns: ['support', 'comfort', 'encourag'] },
  { topic: 'argue', patterns: ['argu', 'fight', 'disagree', 'conflict'] },
  { topic: 'makeup', patterns: ['makeup', 'make-up', 'reconcil'] },
  { topic: 'apology', patterns: ['apolog', 'sorry', 'przepraszam'] },
  { topic: 'jealousy', patterns: ['jealous', 'zazdros'] },
  { topic: 'forgiveness', patterns: ['forgiv', 'przebacz'] },
  { topic: 'texting', patterns: ['texting', 'messag', 'sms'] },
  { topic: 'essential-phrases', patterns: ['essential-phrase', '50-phrase', '25-phrase', '100-phrase', 'podstawowe'] },
];

function detectTopic(slug) {
  const slugLower = slug.toLowerCase();

  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (patterns.some(p => slugLower.includes(p))) {
      return topic;
    }
  }

  // Default fallback based on category/slug patterns
  if (slugLower.includes('vocab')) return 'common-words';
  if (slugLower.includes('phrase')) return 'essential-phrases';

  return 'essential-phrases'; // Default fallback
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🖼️  Topic Image Assignment for Love Languages Blog');
  console.log('================================================\n');

  // Check which topic images exist
  const topicsDir = path.join(__dirname, '../blog/public/blog/topics');
  const existingImages = new Set(
    fs.existsSync(topicsDir) ? fs.readdirSync(topicsDir) : []
  );

  console.log(`📁 Found ${existingImages.size} topic images in /topics/\n`);

  // Fetch all articles
  console.log('📊 Fetching articles from Supabase...');
  let allArticles = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, native_lang, target_lang, slug, image')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching articles:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allArticles.push(...data);
    offset += batchSize;
    if (data.length < batchSize) break;
  }

  console.log(`   Found ${allArticles.length} articles\n`);

  // Analyze and assign images
  const updates = [];
  const topicCounts = {};
  const missingImages = new Set();

  for (const article of allArticles) {
    const topic = detectTopic(article.slug);
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;

    const expectedImage = `${article.target_lang}-${topic}.jpg`;
    const imagePath = `/blog/topics/${expectedImage}`;

    // Check if image exists
    if (!existingImages.has(expectedImage)) {
      missingImages.add(expectedImage);
    }

    // Only update if image changed or was null
    if (article.image !== imagePath) {
      updates.push({
        id: article.id,
        image: imagePath,
        topic,
        oldImage: article.image,
      });
    }
  }

  console.log('📈 Topic Distribution:');
  Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
      console.log(`   ${topic}: ${count}`);
    });

  console.log(`\n📝 Updates needed: ${updates.length}`);
  console.log(`⚠️  Missing image files: ${missingImages.size}`);

  if (missingImages.size > 0 && missingImages.size <= 20) {
    console.log('   Missing files:');
    [...missingImages].slice(0, 20).forEach(f => console.log(`     - ${f}`));
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made\n');
    console.log('Sample updates:');
    updates.slice(0, 5).forEach(u => {
      console.log(`   ${u.id}: ${u.oldImage || 'null'} → ${u.image}`);
    });
    return;
  }

  if (updates.length === 0) {
    console.log('\n✅ All articles already have correct images!');
    return;
  }

  // Batch update
  console.log('\n🚀 Updating articles in batches...');
  const updateBatchSize = 100;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < updates.length; i += updateBatchSize) {
    const batch = updates.slice(i, i + updateBatchSize);

    for (const { id, image } of batch) {
      const { error } = await supabase
        .from('blog_articles')
        .update({ image })
        .eq('id', id);

      if (error) {
        failed++;
      } else {
        updated++;
      }
    }

    process.stdout.write(`\r   Progress: ${Math.min(i + updateBatchSize, updates.length)}/${updates.length}`);
  }

  console.log('\n\n================================================');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
}

main().catch(console.error);
