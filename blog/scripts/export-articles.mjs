#!/usr/bin/env node
/**
 * export-articles.mjs — Full local export of all blog articles.
 *
 * Exports every article from Supabase to a local JSON file for fast,
 * offline auditing and backup. Uses cursor-based pagination to avoid
 * timeout issues with large datasets.
 *
 * Usage:
 *   node blog/scripts/export-articles.mjs                          # full export
 *   node blog/scripts/export-articles.mjs --limit 500              # test with subset
 *   node blog/scripts/export-articles.mjs --output my-export.json  # custom output path
 *   node blog/scripts/export-articles.mjs --fields minimal         # id,slug,native_lang,target_lang,category only
 *
 * Output: blog/scripts/data/articles-local.json (~100-150 MB for full export)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Environment ─────────────────────────────────────────────────────────────

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
  process.stderr.write('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let limit = null;
let outputPath = null;
let fieldsMode = 'full'; // 'full' or 'minimal'

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--limit': limit = parseInt(args[++i], 10); break;
    case '--output': outputPath = args[++i]; break;
    case '--fields': fieldsMode = args[++i]; break;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;

// Fields to select per mode
const FULL_FIELDS = 'id,slug,native_lang,target_lang,category,title,description,content,content_html,date,read_time,tags,difficulty,created_at,updated_at';
const MINIMAL_FIELDS = 'id,slug,native_lang,target_lang,category,title,description,date,read_time,tags,difficulty';

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const fields = fieldsMode === 'minimal' ? MINIMAL_FIELDS : FULL_FIELDS;

  process.stderr.write(`export-articles: mode=${fieldsMode}, limit=${limit || 'all'}\n`);
  process.stderr.write(`  Fields: ${fields}\n\n`);

  const allArticles = [];
  let lastId = null;
  let pageCount = 0;
  const maxArticles = limit || Infinity;

  while (allArticles.length < maxArticles) {
    pageCount++;
    const remaining = maxArticles - allArticles.length;
    const pageSize = Math.min(PAGE_SIZE, remaining);

    // Cursor-based pagination: filter by id > lastId
    let query = supabase
      .from('blog_articles')
      .select(fields)
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const fetchStart = Date.now();
    const { data, error } = await query;
    const fetchMs = Date.now() - fetchStart;

    if (error) {
      process.stderr.write(`\n  Error on page ${pageCount}: ${error.message}\n`);
      if (error.message.includes('timeout') || error.message.includes('fetch failed')) {
        process.stderr.write('  Retrying in 3s...\n');
        await new Promise(r => setTimeout(r, 3000));
        continue; // retry same page
      }
      break;
    }

    if (!data || data.length === 0) break;

    allArticles.push(...data);
    lastId = data[data.length - 1].id;

    // Progress
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stderr.write(
      `  Page ${pageCount}: +${data.length} articles (${allArticles.length} total, ${fetchMs}ms, ${elapsed}s elapsed)\r`
    );

    if (data.length < pageSize) break; // last page
  }

  const durationMs = Date.now() - startTime;

  process.stderr.write(`\n\n  Export complete!\n`);
  process.stderr.write(`  Total articles: ${allArticles.length.toLocaleString()}\n`);
  process.stderr.write(`  Pages fetched: ${pageCount}\n`);
  process.stderr.write(`  Duration: ${(durationMs / 1000).toFixed(1)}s\n`);

  // Compute stats
  const langCounts = {};
  const categoryCounts = {};
  for (const a of allArticles) {
    const nl = a.native_lang || 'unknown';
    const cat = a.category || 'unknown';
    langCounts[nl] = (langCounts[nl] || 0) + 1;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      totalArticles: allArticles.length,
      fieldsMode,
      durationMs,
      pagesFetched: pageCount,
      byNativeLang: langCounts,
      byCategory: categoryCounts,
    },
    articles: allArticles,
  };

  // Write output
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const outFile = outputPath
    ? path.resolve(outputPath)
    : path.join(dataDir, 'articles-local.json');

  process.stderr.write(`\n  Writing to: ${outFile}\n`);

  // Stream-write to avoid holding two copies in memory
  const writeStream = fs.createWriteStream(outFile);

  writeStream.write('{\n');
  writeStream.write(`  "meta": ${JSON.stringify(exportData.meta, null, 2).split('\n').join('\n  ')},\n`);
  writeStream.write('  "articles": [\n');

  for (let i = 0; i < allArticles.length; i++) {
    const json = JSON.stringify(allArticles[i]);
    const comma = i < allArticles.length - 1 ? ',' : '';
    writeStream.write(`    ${json}${comma}\n`);

    // Progress for large writes
    if ((i + 1) % 5000 === 0) {
      process.stderr.write(`  Writing: ${i + 1}/${allArticles.length}\r`);
    }
  }

  writeStream.write('  ]\n}\n');

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    writeStream.end();
  });

  const fileSizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1);
  process.stderr.write(`\n  File size: ${fileSizeMB} MB\n`);

  // Summary by language
  process.stderr.write(`\n  --- By Native Language ---\n`);
  const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
  for (const [lang, count] of sortedLangs) {
    process.stderr.write(`  ${lang.padEnd(4)} ${count.toLocaleString()}\n`);
  }

  // Summary by category
  process.stderr.write(`\n  --- By Category ---\n`);
  const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    process.stderr.write(`  ${cat.padEnd(20)} ${count.toLocaleString()}\n`);
  }

  process.stderr.write(`\n  Done! Use with: node blog/scripts/audit-content.mjs --local\n\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
