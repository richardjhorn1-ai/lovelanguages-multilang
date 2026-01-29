import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) { console.error('Missing VITE_SUPABASE_URL'); process.exit(1); }

async function importArticle(filePath, nativeLang, targetLang) {
  const content = readFileSync(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) return { status: 'no-frontmatter' };

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  const title = frontmatter.match(/title:\s*"(.+?)"/)?.[1] || '';
  const description = frontmatter.match(/description:\s*"(.+?)"/)?.[1] || '';
  const category = frontmatter.match(/category:\s*(\w+)/)?.[1] || 'vocabulary';
  const slug = filePath.split('/').pop().replace('.mdx', '');

  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_articles?slug=eq.${slug}&native_lang=eq.${nativeLang}&target_lang=eq.${targetLang}`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const existing = await checkRes.json();
  if (existing.length > 0) return { status: 'skipped', slug };

  const article = {
    title, slug, description,
    content: body.trim(),
    native_lang: nativeLang,
    target_lang: targetLang,
    category,
    difficulty: 'beginner',
    tags: ['vocabulary', 'couples', 'romance'],
    image: `/blog/${slug}.jpg`,
    read_time: '10 min read',
    published: true,
    date: new Date().toISOString().split('T')[0]
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_articles`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(article)
  });

  return res.ok ? { status: 'inserted', slug } : { status: 'error', slug, error: await res.text() };
}

async function importDir(nativeLang) {
  const baseDir = `blog/src/content/articles/${nativeLang}`;
  if (!existsSync(baseDir)) { console.log(`No directory: ${baseDir}`); return; }

  let inserted = 0, skipped = 0, errors = 0;
  for (const targetLang of readdirSync(baseDir)) {
    const targetPath = join(baseDir, targetLang);
    try {
      for (const file of readdirSync(targetPath).filter(f => f.endsWith('.mdx'))) {
        const r = await importArticle(join(targetPath, file), nativeLang, targetLang);
        if (r.status === 'inserted') inserted++;
        else if (r.status === 'skipped') skipped++;
        else errors++;
      }
    } catch (e) {}
  }
  console.log(`${nativeLang}: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
}

console.log('Importing orphaned MDX files...\n');
await importDir('nl');
await importDir('it');
console.log('\nDone!');
