import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
  if (m) vars[m[1]] = m[2];
}

const supabase = createClient(vars.SUPABASE_URL, vars.SUPABASE_SERVICE_KEY);

// Get all UK articles and check which of our 5 topics exist for which languages
const { data } = await supabase
  .from('blog_articles')
  .select('slug, target_lang')
  .eq('native_lang', 'uk');

const topics = [
  '100-most-common-',
  '-pet-names-and-endearments',
  'how-to-say-i-love-you-in-',
  '-greetings-and-farewells',
  '-date-night-vocabulary'
];

const targetLangs = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'nl', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

// Build a matrix
const existing = {};
for (const lang of targetLangs) {
  existing[lang] = {};
  for (const topic of topics) {
    existing[lang][topic] = false;
  }
}

for (const article of data || []) {
  for (const topic of topics) {
    if (article.slug.includes(topic)) {
      if (existing[article.target_lang]) {
        existing[article.target_lang][topic] = true;
      }
    }
  }
}

// Report missing
console.log('=== Missing articles for UK native speakers ===\n');
let missingCount = 0;
for (const lang of targetLangs) {
  const missing = topics.filter(t => !existing[lang][t]);
  if (missing.length > 0) {
    console.log(`${lang}: ${missing.length} missing`);
    missingCount += missing.length;
  }
}
console.log(`\nTotal missing: ${missingCount}`);

// Show what exists
console.log('\n=== Existing articles ===');
for (const lang of targetLangs) {
  const existingTopics = topics.filter(t => existing[lang][t]);
  if (existingTopics.length > 0) {
    console.log(`${lang}: ${existingTopics.length} exist`);
  }
}
