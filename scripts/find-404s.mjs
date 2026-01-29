import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
const envFile = readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1].trim()] = match[2];
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const BASE_URL = 'https://www.lovelanguages.io';

async function check404s() {
  const { data: articles, error } = await supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title')
    .order('id', { ascending: false })
    .limit(50);

  if (error) { console.error('DB error:', error); return; }

  console.log(`Testing ${articles.length} most recent articles...\n`);

  const broken = [];
  let working = 0;

  for (const article of articles) {
    const url = `${BASE_URL}/learn/${article.native_lang}/${article.target_lang}/${article.slug}`;

    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (res.status === 404) {
        broken.push({ ...article, url, status: 404 });
        console.log(`❌ 404: ${article.native_lang}/${article.target_lang}/${article.slug}`);
      } else if (res.status >= 400) {
        broken.push({ ...article, url, status: res.status });
        console.log(`⚠️  ${res.status}: ${article.slug}`);
      } else {
        working++;
        process.stdout.write('.');
      }
    } catch (e) {
      broken.push({ ...article, url, status: 'error' });
      console.log(`💥 ${article.slug}`);
    }
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`✅ Working: ${working}`);
  console.log(`❌ Broken: ${broken.length}`);

  if (broken.length > 0) {
    console.log(`\n=== BROKEN (first 10) ===`);
    broken.slice(0,10).forEach(b => console.log(`${b.native_lang}/${b.target_lang}/${b.slug}`));
  }
}

check404s();
