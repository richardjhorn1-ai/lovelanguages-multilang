#!/usr/bin/env node
/**
 * Upload Italian language articles to Supabase
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

const articlesDir = path.join(__dirname, '../src/content/articles/it');
const targets = ['en', 'de', 'fr', 'es', 'pt', 'pl', 'ru'];

async function uploadArticle(filePath, nativeLang, targetLang) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: mdxContent } = matter(content);

  const slug = path.basename(filePath, '.mdx');

  // Convert to HTML (basic)
  const cleanContent = mdxContent
    .replace(/^import\s+.*$/gm, '')
    .replace(/<VocabCard[\s\S]*?\/>/g, '')
    .replace(/<CultureTip[\s\S]*?>[\s\S]*?<\/CultureTip>/g, '')
    .replace(/<PhraseOfDay[\s\S]*?\/>/g, '')
    .replace(/<CTA[\s\S]*?\/>/g, '')
    .trim();

  const contentHtml = marked(cleanContent);

  const record = {
    slug,
    native_lang: nativeLang,
    target_lang: targetLang,
    title: frontmatter.title,
    description: frontmatter.description || null,
    category: frontmatter.category || 'vocabulary',
    difficulty: frontmatter.difficulty || 'beginner',
    read_time: frontmatter.readTime || 10,
    image: frontmatter.image || null,
    tags: frontmatter.tags || [],
    content: mdxContent,
    content_html: contentHtml,
    date: frontmatter.date || new Date().toISOString().split('T')[0],
    published: true
  };

  const { data, error } = await supabase
    .from('blog_articles')
    .upsert(record, { onConflict: 'native_lang,target_lang,slug' })
    .select();

  if (error) {
    console.error(`Error uploading ${slug}:`, error.message);
    return null;
  }

  console.log(`✅ Uploaded: it->${targetLang}/${slug}`);
  return data;
}

async function main() {
  let success = 0;
  let failed = 0;

  for (const target of targets) {
    const targetDir = path.join(articlesDir, target);
    if (!fs.existsSync(targetDir)) continue;

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.mdx'));

    for (const file of files) {
      if (file.includes('100-most-common')) {
        const result = await uploadArticle(path.join(targetDir, file), 'it', target);
        if (result) success++;
        else failed++;
      }
    }
  }

  console.log(`\n📊 Summary: ${success} uploaded, ${failed} failed`);
}

main().catch(console.error);
