#!/usr/bin/env node
/**
 * update-batch.mjs — Accept JSON from stdin, write updates to Supabase.
 *
 * Usage:
 *   echo '[{"id":"uuid","title":"New Title"}]' | node update-batch.mjs
 *   echo '[{"id":"uuid","content":"..."}]' | node update-batch.mjs --regenerate-html
 *   echo '[{"id":"uuid","title":"X"}]' | node update-batch.mjs --dry-run
 *
 * Options:
 *   --regenerate-html   Regenerate content_html from content using convertMdxToHtml()
 *   --dry-run           Log changes without writing to DB
 *
 * Input: JSON array from stdin, each object has "id" + fields to update.
 * Valid fields: title, description, content, content_html, date, read_time, category, tags, difficulty
 * Reports stats to stderr: {updated: N, errors: N, skipped: N}
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMdxToHtml } from './component-converters.mjs';

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
const REGENERATE_HTML = process.argv.includes('--regenerate-html');
const BATCH_DELAY = 100; // ms between updates

// Allowed update fields
const ALLOWED_FIELDS = new Set([
  'title', 'description', 'content', 'content_html',
  'date', 'read_time', 'category', 'tags', 'difficulty',
  'faq_items',
]);

// Validation: reject content with frontmatter, imports, or broken components
function validateContent(content) {
  if (!content || typeof content !== 'string') return { valid: true };

  const errors = [];

  // Reject frontmatter
  if (content.trim().startsWith('---')) {
    errors.push('Contains frontmatter (---)');
  }

  // Reject import statements
  if (/^import\s+\w/m.test(content)) {
    errors.push('Contains import statements');
  }

  // Reject <CTA> tags (layout adds its own)
  if (/<CTA[\s\S]*?\/?>/i.test(content)) {
    errors.push('Contains <CTA> component');
  }

  return { valid: errors.length === 0, errors };
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error(`Invalid JSON input: ${e.message}`));
      }
    });
    process.stdin.on('error', reject);
  });
}

async function main() {
  process.stderr.write(`update-batch: mode=${DRY_RUN ? 'DRY RUN' : 'APPLY'}, regenerate-html=${REGENERATE_HTML}\n`);

  const updates = await readStdin();

  if (!Array.isArray(updates)) {
    process.stderr.write('Input must be a JSON array\n');
    process.exit(1);
  }

  process.stderr.write(`  Received ${updates.length} update records\n`);

  const stats = { updated: 0, errors: 0, skipped: 0, htmlRegenerated: 0 };
  const failedIds = [];

  for (let i = 0; i < updates.length; i++) {
    const record = updates[i];

    if (!record.id) {
      process.stderr.write(`  [${i}] Skipped: missing id\n`);
      stats.skipped++;
      continue;
    }

    // Extract only allowed fields
    const fields = {};
    for (const [key, value] of Object.entries(record)) {
      if (key === 'id') continue;
      if (ALLOWED_FIELDS.has(key)) {
        fields[key] = value;
      }
    }

    if (Object.keys(fields).length === 0) {
      stats.skipped++;
      continue;
    }

    // Validate content if present
    if (fields.content) {
      const validation = validateContent(fields.content);
      if (!validation.valid) {
        process.stderr.write(`  [${i}] Rejected ${record.id}: ${validation.errors.join(', ')}\n`);
        stats.errors++;
        failedIds.push({ id: record.id, errors: validation.errors });
        continue;
      }

      // Regenerate content_html from content (pass language params for translated labels/flags)
      if (REGENERATE_HTML) {
        try {
          const { html } = convertMdxToHtml(fields.content, record.native_lang || 'en', record.target_lang || null);
          fields.content_html = html;
          stats.htmlRegenerated++;
        } catch (e) {
          process.stderr.write(`  [${i}] HTML regen failed for ${record.id}: ${e.message}\n`);
          stats.errors++;
          failedIds.push({ id: record.id, errors: [`HTML regen: ${e.message}`] });
          continue;
        }
      }
    }

    if (DRY_RUN) {
      const fieldNames = Object.keys(fields).join(', ');
      if ((i + 1) % 100 === 0 || i === 0) {
        process.stderr.write(`  [${i + 1}/${updates.length}] Would update ${record.id}: ${fieldNames}\n`);
      }
      stats.updated++;
    } else {
      const { error } = await supabase
        .from('blog_articles')
        .update(fields)
        .eq('id', record.id);

      if (error) {
        process.stderr.write(`  [${i}] Error updating ${record.id}: ${error.message}\n`);
        stats.errors++;
        failedIds.push({ id: record.id, errors: [error.message] });
      } else {
        stats.updated++;
      }

      // Progress log every 100 records
      if ((i + 1) % 100 === 0) {
        process.stderr.write(`  Progress: ${i + 1}/${updates.length} (${stats.updated} ok, ${stats.errors} err)\n`);
      }

      // Delay between writes
      if (i < updates.length - 1) {
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }
  }

  // Report
  process.stderr.write(`\n--- update-batch results ---\n`);
  process.stderr.write(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLIED'}\n`);
  process.stderr.write(`  Updated: ${stats.updated}\n`);
  process.stderr.write(`  Errors: ${stats.errors}\n`);
  process.stderr.write(`  Skipped: ${stats.skipped}\n`);
  if (REGENERATE_HTML) {
    process.stderr.write(`  HTML regenerated: ${stats.htmlRegenerated}\n`);
  }

  // Output failed IDs to stdout for retry
  if (failedIds.length > 0) {
    process.stderr.write(`\n  Failed IDs:\n`);
    failedIds.forEach(f => process.stderr.write(`    ${f.id}: ${f.errors.join(', ')}\n`));
    // Also write to stdout for piping to retry
    process.stdout.write(JSON.stringify({ failedIds, stats }, null, 2));
  } else {
    process.stdout.write(JSON.stringify({ stats }, null, 2));
  }
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
