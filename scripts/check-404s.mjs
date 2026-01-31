import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.argv[2] || 'https://lovelanguages-multilang-git-94b08f-richardjhorn1-6035s-projects.vercel.app';

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return { url, status: 'ERROR', ok: false, error: e.message };
  }
}

async function getAllArticles() {
  const allArticles = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('slug, native_lang, target_lang')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allArticles.push(...data);
    offset += limit;

    if (data.length < limit) break;
  }

  return allArticles;
}

async function main() {
  console.log(`Checking articles on: ${BASE_URL}\n`);

  // Get all articles
  const articles = await getAllArticles();
  console.log(`Total articles: ${articles.length}\n`);

  // Check in batches of 50 concurrent requests
  const batchSize = 50;
  const errors = [];
  let checked = 0;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(a => checkUrl(`${BASE_URL}/learn/${a.native_lang}/${a.target_lang}/${a.slug}`))
    );

    for (const r of results) {
      checked++;
      if (!r.ok) {
        errors.push(r);
        console.log(`❌ ${r.status}: ${r.url}`);
      }
    }

    // Progress update every 1000
    if (checked % 1000 === 0) {
      console.log(`Checked ${checked}/${articles.length}... (${errors.length} errors so far)`);
    }
  }

  console.log(`\n✅ Checked ${checked} articles`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nFailed URLs (first 50):');
    errors.slice(0, 50).forEach(e => console.log(`  ${e.status}: ${e.url}`));
    if (errors.length > 50) console.log(`  ... and ${errors.length - 50} more`);
  }
}

main();
