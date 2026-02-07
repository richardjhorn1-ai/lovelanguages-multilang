#!/usr/bin/env node
/**
 * fetch-batch.mjs — Query blog articles from Supabase, output JSON to stdout.
 *
 * Usage:
 *   node fetch-batch.mjs --native_lang es --pass missing-dates --limit 50
 *   node fetch-batch.mjs --pass all --fields id,slug,title
 *   node fetch-batch.mjs --native_lang fr --target_lang de --pass quality-score
 *
 * Options:
 *   --native_lang <code>   Filter by native language
 *   --target_lang <code>   Filter by target language
 *   --pass <name>          Preset filter: missing-dates, english-titles, empty-sections, duplicates, all, quality-score
 *   --limit <n>            Max articles to return
 *   --offset <n>           Skip first N articles
 *   --fields <csv>         Columns to select (default: id,slug,native_lang,target_lang,title,description,category,difficulty,read_time,date,tags,content)
 *
 * Outputs {"articles": [...], "total": N} to stdout, progress to stderr.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from ../../.env.local
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

// Parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    native_lang: null,
    target_lang: null,
    pass: 'all',
    limit: null,
    offset: 0,
    fields: 'id,slug,native_lang,target_lang,title,description,category,difficulty,read_time,date,tags,content',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--native_lang': opts.native_lang = args[++i]; break;
      case '--target_lang': opts.target_lang = args[++i]; break;
      case '--pass': opts.pass = args[++i]; break;
      case '--limit': opts.limit = parseInt(args[++i], 10); break;
      case '--offset': opts.offset = parseInt(args[++i], 10); break;
      case '--fields': opts.fields = args[++i]; break;
    }
  }

  return opts;
}

// English title detection (from audit-comprehensive.mjs)
const ENGLISH_TITLE_WORDS = new Set([
  'the', 'and', 'for', 'your', 'how', 'to', 'with', 'most', 'common',
  'essential', 'learn', 'guide', 'tips', 'words', 'phrases', 'couples', 'every',
  'best', 'ways', 'say', 'that', 'will', 'make', 'you', 'their', 'complete',
]);

function titleLooksEnglish(title, nativeLang) {
  if (!title || nativeLang === 'en') return false;
  const words = title.toLowerCase().split(/\s+/);
  let englishCount = 0;
  for (const w of words) {
    if (ENGLISH_TITLE_WORDS.has(w)) englishCount++;
  }
  return englishCount >= 3;
}

// Empty sections detection (from audit-deep.mjs)
function findEmptySections(content) {
  if (!content) return [];
  const lines = content.split('\n').filter(l => !l.startsWith('import '));
  const emptySections = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ') || line.startsWith('### ')) {
      let hasContent = false;
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (next.startsWith('## ') || next.startsWith('### ') || next.startsWith('# ')) break;
        hasContent = true;
        break;
      }
      if (!hasContent) emptySections.push(line);
    }
  }
  return emptySections;
}

const PAGE_SIZE = 1000;

async function fetchAll(opts) {
  const allArticles = [];
  let offset = opts.offset;
  const maxArticles = opts.limit || Infinity;
  const fields = opts.fields;

  // Ensure content field is included for passes that need it
  const needsContent = ['empty-sections', 'quality-score', 'duplicates'].includes(opts.pass);
  let selectFields = fields;
  if (needsContent && !fields.includes('content')) {
    selectFields += ',content';
  }

  while (allArticles.length < maxArticles) {
    const remaining = maxArticles - allArticles.length;
    const pageSize = Math.min(PAGE_SIZE, remaining);
    const from = offset;
    const to = from + pageSize - 1;

    process.stderr.write(`  Fetching ${from}–${to}...\r`);

    let query = supabase
      .from('blog_articles')
      .select(selectFields)
      .range(from, to)
      .order('id');

    if (opts.native_lang) query = query.eq('native_lang', opts.native_lang);
    if (opts.target_lang) query = query.eq('target_lang', opts.target_lang);

    // Pass-specific filters at DB level
    if (opts.pass === 'missing-dates') {
      query = query.is('date', null);
    }

    const { data, error } = await query;

    if (error) {
      process.stderr.write(`\nError: ${error.message}\n`);
      break;
    }

    if (!data || data.length === 0) break;

    // Client-side filtering for passes that need it
    let filtered = data;

    if (opts.pass === 'english-titles') {
      filtered = data.filter(a => titleLooksEnglish(a.title, a.native_lang));
    } else if (opts.pass === 'empty-sections') {
      filtered = data.filter(a => {
        const empty = findEmptySections(a.content);
        if (empty.length > 0) {
          a._emptySections = empty;
          return true;
        }
        return false;
      });
    }

    allArticles.push(...filtered);
    offset += data.length;

    if (data.length < pageSize) break;
  }

  // Apply limit after all filtering
  const result = opts.limit ? allArticles.slice(0, opts.limit) : allArticles;
  process.stderr.write(`\n  Fetched ${result.length} articles\n`);
  return result;
}

// Duplicate detection pass
async function fetchDuplicates(opts) {
  const allArticles = [];
  let offset = 0;

  while (true) {
    process.stderr.write(`  Fetching ${offset}...\r`);

    let query = supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,title,category,content')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('id');

    if (opts.native_lang) query = query.eq('native_lang', opts.native_lang);

    const { data, error } = await query;
    if (error) { process.stderr.write(`\nError: ${error.message}\n`); break; }
    if (!data || data.length === 0) break;
    allArticles.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }

  // Hash-based duplicate detection
  const contentHashes = new Map();
  const duplicateGroups = [];

  for (const a of allArticles) {
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

  process.stderr.write(`\n  Found ${duplicateGroups.length} duplicate groups\n`);
  return duplicateGroups;
}

async function main() {
  const opts = parseArgs();
  process.stderr.write(`fetch-batch: pass=${opts.pass}, native_lang=${opts.native_lang || 'all'}, target_lang=${opts.target_lang || 'all'}\n`);

  if (opts.pass === 'duplicates') {
    const groups = await fetchDuplicates(opts);
    process.stdout.write(JSON.stringify({ groups, total: groups.length }, null, 2));
  } else {
    const articles = await fetchAll(opts);
    process.stdout.write(JSON.stringify({ articles, total: articles.length }, null, 2));
  }
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
