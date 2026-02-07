#!/usr/bin/env node
/**
 * delete-duplicates.mjs — Delete recommended duplicate articles from Supabase.
 *
 * Reads duplicate-review.json, deletes the recommended article from each pair.
 * Logs all deletions to data/deletion-log.json for rollback.
 *
 * Usage:
 *   node delete-duplicates.mjs --dry-run   # preview only
 *   node delete-duplicates.mjs             # actually delete
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

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  process.stderr.write('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const reviewPath = path.join(__dirname, 'data/duplicate-review.json');
  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf-8'));

  const deleteIds = review.pairs.map(p => p.recommendation.delete_id);

  process.stderr.write(`delete-duplicates: mode=${DRY_RUN ? 'DRY RUN' : 'DELETE'}\n`);
  process.stderr.write(`  ${deleteIds.length} articles to delete\n\n`);

  // Step 1: Fetch full records of articles to delete (for rollback log)
  process.stderr.write('  Fetching full records for rollback log...\n');
  const { data: fullRecords, error: fetchErr } = await supabase
    .from('blog_articles')
    .select('*')
    .in('id', deleteIds);

  if (fetchErr) {
    process.stderr.write(`  Error fetching records: ${fetchErr.message}\n`);
    process.exit(1);
  }

  process.stderr.write(`  Fetched ${fullRecords.length} records\n\n`);

  // Step 2: Write rollback log BEFORE deleting
  const deletionLog = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry_run' : 'applied',
    total: deleteIds.length,
    deletions: review.pairs.map(p => ({
      deleted_id: p.recommendation.delete_id,
      deleted_slug: p.recommendation.delete_slug,
      kept_id: p.recommendation.keep_id,
      kept_slug: p.recommendation.keep_slug,
      type: p.type,
      reason: p.recommendation.reason,
    })),
    full_records: fullRecords, // Complete data for rollback
  };

  const logPath = path.join(__dirname, 'data/deletion-log.json');
  fs.writeFileSync(logPath, JSON.stringify(deletionLog, null, 2));
  process.stderr.write(`  Rollback log written to ${logPath}\n\n`);

  if (DRY_RUN) {
    process.stderr.write('  DRY RUN — no deletions performed.\n');
    process.stderr.write('  Articles that would be deleted:\n');
    for (const p of review.pairs) {
      const r = p.recommendation;
      process.stderr.write(`    DELETE: ${r.delete_slug} (${r.delete_id.slice(0, 8)})\n`);
      process.stderr.write(`    KEEP:   ${r.keep_slug} (${r.keep_id.slice(0, 8)})\n`);
      process.stderr.write(`    Reason: ${r.reason}\n\n`);
    }
    return;
  }

  // Step 3: Delete articles
  let deleted = 0;
  let errors = 0;

  for (const id of deleteIds) {
    const pair = review.pairs.find(p => p.recommendation.delete_id === id);
    const slug = pair.recommendation.delete_slug;

    const { error } = await supabase
      .from('blog_articles')
      .delete()
      .eq('id', id);

    if (error) {
      process.stderr.write(`  ERROR deleting ${slug} (${id}): ${error.message}\n`);
      errors++;
    } else {
      deleted++;
      process.stderr.write(`  Deleted: ${slug} (${id.slice(0, 8)})\n`);
    }

    // Small delay between deletes
    await new Promise(r => setTimeout(r, 100));
  }

  process.stderr.write(`\n--- Results ---\n`);
  process.stderr.write(`  Deleted: ${deleted}\n`);
  process.stderr.write(`  Errors: ${errors}\n`);
  process.stderr.write(`  Rollback log: ${logPath}\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
