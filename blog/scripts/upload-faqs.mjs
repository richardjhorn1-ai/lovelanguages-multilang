#!/usr/bin/env node
/**
 * upload-faqs.mjs — Merge all generated FAQ JSON files and output
 * in update-batch.mjs compatible format.
 *
 * Usage:
 *   node blog/scripts/upload-faqs.mjs | node blog/scripts/update-batch.mjs --dry-run
 *   node blog/scripts/upload-faqs.mjs | node blog/scripts/update-batch.mjs
 *
 * Reads all faqs-*.json files from blog/scripts/faq-data/
 * Outputs JSON array to stdout: [{id, faq_items}, ...]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAQ_DIR = path.join(__dirname, 'faq-data');

function main() {
  if (!fs.existsSync(FAQ_DIR)) {
    process.stderr.write(`FAQ data directory not found: ${FAQ_DIR}\n`);
    process.exit(1);
  }

  const files = fs.readdirSync(FAQ_DIR)
    .filter(f => f.startsWith('faqs-') && f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    process.stderr.write('No faqs-*.json files found in faq-data/\n');
    process.exit(1);
  }

  process.stderr.write(`Found ${files.length} FAQ files to merge\n`);

  const allRecords = [];
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(FAQ_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const records = JSON.parse(content);

      if (!Array.isArray(records)) {
        process.stderr.write(`  ${file}: not an array, skipping\n`);
        errors++;
        continue;
      }

      // Validate each record has id and faq_items
      let valid = 0;
      for (const record of records) {
        if (!record.id) {
          process.stderr.write(`  ${file}: record missing id, skipping\n`);
          errors++;
          continue;
        }
        if (!Array.isArray(record.faq_items) || record.faq_items.length === 0) {
          process.stderr.write(`  ${file}: record ${record.id} has no faq_items, skipping\n`);
          errors++;
          continue;
        }
        // Validate FAQ item structure
        const validFaqs = record.faq_items.filter(f => f.question && f.answer);
        if (validFaqs.length === 0) {
          process.stderr.write(`  ${file}: record ${record.id} has invalid faq_items, skipping\n`);
          errors++;
          continue;
        }
        allRecords.push({ id: record.id, faq_items: validFaqs });
        valid++;
      }

      process.stderr.write(`  ${file}: ${valid} valid records\n`);
    } catch (err) {
      process.stderr.write(`  ${file}: parse error - ${err.message}\n`);
      errors++;
    }
  }

  // Deduplicate by id — first occurrence wins (Wave 1 files sort before gemini files)
  const seen = new Map();
  let dupes = 0;
  for (const record of allRecords) {
    if (seen.has(record.id)) {
      dupes++;
    } else {
      seen.set(record.id, record);
    }
  }

  const uniqueRecords = [...seen.values()];

  process.stderr.write(`\n--- Merge complete ---\n`);
  process.stderr.write(`  Total records (raw): ${allRecords.length}\n`);
  process.stderr.write(`  Duplicates removed: ${dupes}\n`);
  process.stderr.write(`  Unique records: ${uniqueRecords.length}\n`);
  process.stderr.write(`  Errors: ${errors}\n`);

  // Output to stdout for piping to update-batch.mjs
  process.stdout.write(JSON.stringify(uniqueRecords));
}

main();
