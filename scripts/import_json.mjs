import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const articles = JSON.parse(readFileSync('generated/el_articles.json', 'utf-8'));
console.log(`Importing ${articles.length} Greek articles...`);

let inserted = 0, skipped = 0, errors = 0;

for (const article of articles) {
  // Check if exists
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_articles?slug=eq.${article.slug}&native_lang=eq.el&target_lang=eq.${article.target_lang}`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const existing = await checkRes.json();
  if (existing.length > 0) { skipped++; continue; }

  // Insert
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_articles`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(article)
  });

  if (res.ok) inserted++;
  else { errors++; console.log(`Error: ${article.slug} - ${await res.text()}`); }
}

console.log(`Greek: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
