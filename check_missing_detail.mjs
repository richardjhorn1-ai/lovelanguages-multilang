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

const { data } = await supabase
  .from('blog_articles')
  .select('slug, target_lang')
  .eq('native_lang', 'uk');

const topicPatterns = {
  '100-words': '100-most-common-',
  'pet-names': '-pet-names-and-endearments',
  'i-love-you': 'how-to-say-i-love-you-in-',
  'greetings': '-greetings-and-farewells',
  'date-night': '-date-night-vocabulary'
};

const targetLangs = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'nl', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

// Build matrix
const existing = {};
for (const lang of targetLangs) {
  existing[lang] = {};
  for (const [name, pattern] of Object.entries(topicPatterns)) {
    existing[lang][name] = false;
  }
}

for (const article of data || []) {
  for (const [name, pattern] of Object.entries(topicPatterns)) {
    if (article.slug.includes(pattern)) {
      if (existing[article.target_lang]) {
        existing[article.target_lang][name] = true;
      }
    }
  }
}

console.log('=== Detailed status by language ===\n');
for (const lang of targetLangs) {
  const status = [];
  for (const [name, _] of Object.entries(topicPatterns)) {
    status.push(`${name}: ${existing[lang][name] ? '✓' : '✗'}`);
  }
  console.log(`${lang}: ${status.join(', ')}`);
}

// List what needs to be generated
console.log('\n=== To Generate ===');
const toGenerate = [];
for (const lang of targetLangs) {
  for (const [name, _] of Object.entries(topicPatterns)) {
    if (!existing[lang][name]) {
      toGenerate.push({ lang, topic: name });
    }
  }
}
console.log(JSON.stringify(toGenerate, null, 2));
console.log(`\nTotal: ${toGenerate.length} articles to generate`);
