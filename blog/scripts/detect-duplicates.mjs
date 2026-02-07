#!/usr/bin/env node
/**
 * detect-duplicates.mjs — Hash-based duplicate group detection.
 *
 * Hashes first 500 chars of all articles, groups duplicates.
 *
 * Usage:
 *   node detect-duplicates.mjs
 *   node detect-duplicates.mjs --native_lang es
 *
 * Output: JSON array of groups:
 *   [{originalId, originalSlug, duplicates: [{id, slug, native_lang, target_lang, title, category}]}]
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

const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

const args = process.argv.slice(2);
let nativeLang = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--native_lang') nativeLang = args[++i];
}

const PAGE_SIZE = 1000;

async function main() {
  process.stderr.write(`detect-duplicates: native=${nativeLang || 'all'}\n`);

  const allArticles = [];
  let offset = 0;

  while (true) {
    process.stderr.write(`  Fetching ${offset}...\r`);

    let query = supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,title,category,content,created_at')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('created_at');

    if (nativeLang) query = query.eq('native_lang', nativeLang);

    const { data, error } = await query;
    if (error) { process.stderr.write(`\nError: ${error.message}\n`); break; }
    if (!data || data.length === 0) break;
    allArticles.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }

  process.stderr.write(`\n  Total articles: ${allArticles.length}\n`);

  // Hash first 500 chars of content
  const contentHashes = new Map();
  const duplicateGroups = [];

  for (const a of allArticles) {
    if (a.target_lang === 'all') continue; // skip methodology

    const contentKey = (a.content || '').trim().slice(0, 500);
    if (contentKey.length < 100) continue;

    if (contentHashes.has(contentKey)) {
      const original = contentHashes.get(contentKey);

      // Find existing group or create new one
      let group = duplicateGroups.find(g => g.originalId === original.id);
      if (!group) {
        group = {
          originalId: original.id,
          originalSlug: `${original.native_lang}/${original.target_lang}/${original.slug}`,
          nativeLang: original.native_lang,
          targetLang: original.target_lang,
          category: original.category,
          duplicates: [],
        };
        duplicateGroups.push(group);
      }

      group.duplicates.push({
        id: a.id,
        slug: `${a.native_lang}/${a.target_lang}/${a.slug}`,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        title: a.title,
        category: a.category,
      });
    } else {
      contentHashes.set(contentKey, a);
    }
  }

  // Summary
  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0);
  process.stderr.write(`\n--- Duplicate Detection ---\n`);
  process.stderr.write(`  Duplicate groups: ${duplicateGroups.length}\n`);
  process.stderr.write(`  Total duplicate articles: ${totalDuplicates}\n`);

  if (duplicateGroups.length > 0) {
    process.stderr.write(`\n  Sample groups:\n`);
    duplicateGroups.slice(0, 10).forEach(g => {
      process.stderr.write(`    Original: ${g.originalSlug}\n`);
      g.duplicates.forEach(d => {
        process.stderr.write(`      Dup: ${d.slug} (${d.title})\n`);
      });
    });
  }

  // Output full results to stdout
  process.stdout.write(JSON.stringify(duplicateGroups, null, 2));
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
