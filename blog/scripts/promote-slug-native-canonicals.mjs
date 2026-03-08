#!/usr/bin/env node
/**
 * Promote existing blog_articles.slug_native values into canonical blog_articles.slug.
 *
 * Intended rollout:
 *   1. Dry-run to validate the migration set and write a rollback snapshot.
 *   2. Apply to upsert old canonical slugs into blog_article_slug_aliases and
 *      then copy slug_native into slug for non-English native articles.
 *   3. Optionally rollback from a previously written snapshot.
 *
 * Usage:
 *   node promote-slug-native-canonicals.mjs --dry-run
 *   node promote-slug-native-canonicals.mjs --apply
 *   node promote-slug-native-canonicals.mjs --rollback --snapshot-file tmp/slug-native-promotions/slug-native-promotion-....json
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import {
  ARTICLE_SLUG_REGEX,
  normalizeArticleSlugInput,
} from '../src/lib/native-slugs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const PAGE_SIZE = 1000;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_OUTPUT_DIR = path.join(projectRoot, 'tmp', 'slug-native-promotions');

const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean' },
    apply: { type: 'boolean' },
    rollback: { type: 'boolean' },
    'snapshot-file': { type: 'string' },
    'output-dir': { type: 'string' },
    'batch-size': { type: 'string' },
  },
});

const outputDir = path.resolve(projectRoot, args['output-dir'] || DEFAULT_OUTPUT_DIR);
const batchSize = Number.parseInt(args['batch-size'] || `${DEFAULT_BATCH_SIZE}`, 10);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

if (!Number.isFinite(batchSize) || batchSize < 1) {
  console.error('Invalid --batch-size value.');
  process.exit(1);
}

const mode = args.rollback ? 'rollback' : args.apply ? 'apply' : 'dry-run';
const snapshotFile = args['snapshot-file']
  ? path.resolve(projectRoot, args['snapshot-file'])
  : path.join(outputDir, `slug-native-promotion-${timestamp}.json`);

if (args.apply && args.rollback) {
  console.error('Choose either --apply or --rollback, not both.');
  process.exit(1);
}

if (mode === 'rollback' && !args['snapshot-file']) {
  console.error('--rollback requires --snapshot-file.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local. Expected SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function makeKey(nativeLang, targetLang, slug) {
  return `${nativeLang}|${targetLang}|${slug}`;
}

function isMethodologyArticle(row) {
  return row.target_lang === 'all';
}

function isEnglishNativeArticle(row) {
  return row.native_lang === 'en';
}

function isStrictSlug(slug) {
  return (
    typeof slug === 'string' &&
    slug.length > 0 &&
    ARTICLE_SLUG_REGEX.test(slug) &&
    normalizeArticleSlugInput(slug) === slug
  );
}

async function fetchPublishedCanonicalArticles() {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, native_lang, target_lang, title, slug, slug_native, topic_id, published, is_canonical, updated_at')
      .eq('published', true)
      .eq('is_canonical', true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

async function fetchSlugAliases() {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_article_slug_aliases')
      .select('article_id, native_lang, target_lang, alias_slug, source')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      if (
        error.code === '42P01' ||
        String(error.message || '').includes('blog_article_slug_aliases')
      ) {
        return rows;
      }
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

function buildPromotionPlan(articles, aliases) {
  const plan = [];
  const issues = {
    duplicateCurrentCanonicals: [],
    missingSlugNative: [],
    invalidSlugNative: [],
    duplicateFinalCanonicals: [],
    aliasCanonicalConflicts: [],
    existingAliasConflicts: [],
    existingAliasFinalCanonicalConflicts: [],
  };
  const summary = {
    totalCanonicalRows: articles.length,
    skippedEnglishNative: 0,
    skippedMethodology: 0,
    unchangedAlreadyLocalized: 0,
    promotableRows: 0,
  };

  const currentCanonicalByKey = new Map();
  const existingAliasByKey = new Map();

  for (const article of articles) {
    const key = makeKey(article.native_lang, article.target_lang, article.slug);
    const existing = currentCanonicalByKey.get(key);
    if (existing && existing.id !== article.id) {
      issues.duplicateCurrentCanonicals.push({
        key,
        articleIds: [existing.id, article.id],
      });
      continue;
    }
    currentCanonicalByKey.set(key, article);
  }

  for (const alias of aliases) {
    const key = makeKey(alias.native_lang, alias.target_lang, alias.alias_slug);
    if (!existingAliasByKey.has(key)) {
      existingAliasByKey.set(key, alias);
    }
  }

  for (const article of articles) {
    const base = {
      id: article.id,
      native_lang: article.native_lang,
      target_lang: article.target_lang,
      title: article.title,
      topic_id: article.topic_id,
      old_slug: article.slug,
      slug_native: article.slug_native,
      current_updated_at: article.updated_at,
    };

    if (isMethodologyArticle(article)) {
      summary.skippedMethodology += 1;
      plan.push({ ...base, action: 'skip_methodology', new_slug: article.slug });
      continue;
    }

    if (isEnglishNativeArticle(article)) {
      summary.skippedEnglishNative += 1;
      plan.push({ ...base, action: 'skip_english_native', new_slug: article.slug });
      continue;
    }

    if (!article.slug_native) {
      issues.missingSlugNative.push(base);
      plan.push({ ...base, action: 'missing_slug_native', new_slug: article.slug });
      continue;
    }

    if (!isStrictSlug(article.slug_native)) {
      issues.invalidSlugNative.push({
        ...base,
        normalized_slug_native: normalizeArticleSlugInput(article.slug_native),
      });
      plan.push({ ...base, action: 'invalid_slug_native', new_slug: article.slug });
      continue;
    }

    if (article.slug_native === article.slug) {
      summary.unchangedAlreadyLocalized += 1;
      plan.push({ ...base, action: 'unchanged', new_slug: article.slug });
      continue;
    }

    summary.promotableRows += 1;
    plan.push({ ...base, action: 'promote_slug_native', new_slug: article.slug_native });
  }

  const finalCanonicalByKey = new Map();
  for (const entry of plan) {
    if (entry.action === 'missing_slug_native' || entry.action === 'invalid_slug_native') {
      continue;
    }

    const finalKey = makeKey(entry.native_lang, entry.target_lang, entry.new_slug);
    const existing = finalCanonicalByKey.get(finalKey);
    if (existing && existing.id !== entry.id) {
      issues.duplicateFinalCanonicals.push({
        key: finalKey,
        articleIds: [existing.id, entry.id],
        slugs: [existing.new_slug, entry.new_slug],
      });
      continue;
    }
    finalCanonicalByKey.set(finalKey, entry);
  }

  for (const entry of plan.filter(candidate => candidate.action === 'promote_slug_native')) {
    const aliasKey = makeKey(entry.native_lang, entry.target_lang, entry.old_slug);
    const finalCanonical = finalCanonicalByKey.get(aliasKey);
    if (finalCanonical && finalCanonical.id !== entry.id) {
      issues.aliasCanonicalConflicts.push({
        key: aliasKey,
        canonical_article_id: finalCanonical.id,
        alias_article_id: entry.id,
      });
    }

    const existingAlias = existingAliasByKey.get(aliasKey);
    if (existingAlias && existingAlias.article_id !== entry.id) {
      issues.existingAliasConflicts.push({
        key: aliasKey,
        existing_article_id: existingAlias.article_id,
        promoted_article_id: entry.id,
      });
    }
  }

  for (const [aliasKey, alias] of existingAliasByKey.entries()) {
    const finalCanonical = finalCanonicalByKey.get(aliasKey);
    if (finalCanonical && finalCanonical.id !== alias.article_id) {
      issues.existingAliasFinalCanonicalConflicts.push({
        key: aliasKey,
        existing_alias_article_id: alias.article_id,
        canonical_article_id: finalCanonical.id,
      });
    }
  }

  return {
    generated_at: new Date().toISOString(),
    mode,
    summary,
    issues,
    snapshot: plan.filter(candidate => candidate.action === 'promote_slug_native'),
    plan,
  };
}

function countBlockingIssues(issues) {
  return (
    issues.duplicateCurrentCanonicals.length +
    issues.missingSlugNative.length +
    issues.invalidSlugNative.length +
    issues.duplicateFinalCanonicals.length +
    issues.aliasCanonicalConflicts.length +
    issues.existingAliasConflicts.length +
    issues.existingAliasFinalCanonicalConflicts.length
  );
}

function writeSnapshot(filePath, payload) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function logPlan(payload) {
  console.log('=== SLUG_NATIVE PROMOTION SUMMARY ===');
  console.log(`Mode: ${payload.mode}`);
  console.log(`Canonical rows scanned: ${payload.summary.totalCanonicalRows}`);
  console.log(`Promotable rows: ${payload.summary.promotableRows}`);
  console.log(`Skipped English-native rows: ${payload.summary.skippedEnglishNative}`);
  console.log(`Skipped methodology rows: ${payload.summary.skippedMethodology}`);
  console.log(`Already localized canonicals: ${payload.summary.unchangedAlreadyLocalized}`);

  const issueLines = Object.entries(payload.issues)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => `  ${key}: ${value.length}`);

  if (issueLines.length > 0) {
    console.log('\nBlocking issues:');
    for (const line of issueLines) {
      console.log(line);
    }
  }

  if (payload.snapshot.length > 0) {
    console.log('\nSample promotions:');
    for (const entry of payload.snapshot.slice(0, 10)) {
      console.log(`  ${entry.native_lang}/${entry.target_lang}: ${entry.old_slug} -> ${entry.new_slug}`);
    }
  }
}

async function upsertAliasRows(rows, source) {
  if (rows.length === 0) {
    return;
  }

  const aliasRows = rows.map(row => ({
    article_id: row.id,
    native_lang: row.native_lang,
    target_lang: row.target_lang,
    alias_slug: row.alias_slug,
    source,
  }));

  for (const batch of chunk(aliasRows, batchSize)) {
    const { error } = await supabase
      .from('blog_article_slug_aliases')
      .upsert(batch, {
        onConflict: 'native_lang,target_lang,alias_slug',
        ignoreDuplicates: false,
      });

    if (error) {
      throw error;
    }
  }
}

async function updateCanonicalSlugs(rows, targetField, expectedCurrentField) {
  let updated = 0;

  for (const batch of chunk(rows, batchSize)) {
    await Promise.all(batch.map(async (row) => {
      const nextSlug = row[targetField];
      let query = supabase
        .from('blog_articles')
        .update({
          slug: nextSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (expectedCurrentField) {
        query = query.eq('slug', row[expectedCurrentField]);
      }

      const { data, error } = await query
        .select('id, slug');

      if (error) {
        throw new Error(`Failed to update ${row.id} (${row.native_lang}/${row.target_lang}): ${error.message}`);
      }

      if (!data || data.length !== 1) {
        const expected = expectedCurrentField ? ` from ${row[expectedCurrentField]}` : '';
        throw new Error(`Unexpected update match count for ${row.id} (${row.native_lang}/${row.target_lang}) while changing${expected} to ${nextSlug}.`);
      }

      updated += 1;
    }));

    process.stderr.write(`  Updated ${updated}/${rows.length} canonical rows\r`);
  }

  process.stderr.write('\n');
}

async function verifyCanonicalState(rows, fieldName) {
  const ids = rows.map(row => row.id);
  const expectedById = new Map(rows.map(row => [row.id, row[fieldName]]));
  let offset = 0;
  const seen = new Map();

  while (offset < ids.length) {
    const batchIds = ids.slice(offset, offset + PAGE_SIZE);
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, slug')
      .in('id', batchIds);

    if (error) {
      throw error;
    }

    for (const row of data || []) {
      seen.set(row.id, row.slug);
    }

    offset += PAGE_SIZE;
  }

  const mismatches = [];
  for (const [id, expectedSlug] of expectedById.entries()) {
    if (seen.get(id) !== expectedSlug) {
      mismatches.push({ id, expectedSlug, actualSlug: seen.get(id) || null });
    }
  }

  return mismatches;
}

function loadRollbackSnapshot(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Snapshot file not found: ${filePath}`);
  }

  const payload = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!payload || !Array.isArray(payload.snapshot)) {
    throw new Error(`Invalid snapshot payload: ${filePath}`);
  }

  return payload;
}

async function runDryOrApply() {
  console.log('Loading canonical articles and existing aliases...');
  const [articles, aliases] = await Promise.all([
    fetchPublishedCanonicalArticles(),
    fetchSlugAliases(),
  ]);

  const payload = buildPromotionPlan(articles, aliases);
  logPlan(payload);
  writeSnapshot(snapshotFile, payload);
  console.log(`\nSnapshot written to ${snapshotFile}`);

  const blockingIssueCount = countBlockingIssues(payload.issues);
  if (blockingIssueCount > 0) {
    console.error('\nRefusing to continue until blocking issues are resolved.');
    process.exit(1);
  }

  if (mode === 'dry-run') {
    return;
  }

  if (payload.snapshot.length === 0) {
    console.log('\nNo canonical slug updates required.');
    return;
  }

  console.log('\nUpserting English canonical slugs as aliases...');
  await upsertAliasRows(
    payload.snapshot.map(row => ({ ...row, alias_slug: row.old_slug })),
    'slug_native_promotion'
  );

  console.log('Promoting slug_native into canonical slug...');
  await updateCanonicalSlugs(payload.snapshot, 'new_slug', 'old_slug');

  const mismatches = await verifyCanonicalState(payload.snapshot, 'new_slug');
  if (mismatches.length > 0) {
    console.error('\nVerification failed after promotion:');
    console.error(JSON.stringify(mismatches.slice(0, 20), null, 2));
    process.exit(1);
  }

  console.log('\nPromotion complete.');
  console.log(`  Canonical rows updated: ${payload.snapshot.length}`);
  console.log(`  Rollback snapshot: ${snapshotFile}`);
}

async function runRollback() {
  const payload = loadRollbackSnapshot(snapshotFile);
  const rows = payload.snapshot;

  console.log(`Loaded rollback snapshot with ${rows.length} rows from ${snapshotFile}`);
  if (rows.length === 0) {
    console.log('Nothing to roll back.');
    return;
  }

  console.log('Preserving current localized canonicals as aliases before rollback...');
  await upsertAliasRows(
    rows.map(row => ({ ...row, alias_slug: row.new_slug })),
    'slug_native_promotion_rollback'
  );

  console.log('Restoring previous canonical slugs...');
  await updateCanonicalSlugs(rows, 'old_slug', 'new_slug');

  const mismatches = await verifyCanonicalState(rows, 'old_slug');
  if (mismatches.length > 0) {
    console.error('\nVerification failed after rollback:');
    console.error(JSON.stringify(mismatches.slice(0, 20), null, 2));
    process.exit(1);
  }

  console.log('\nRollback complete.');
  console.log(`  Canonical rows restored: ${rows.length}`);
}

try {
  ensureDir(outputDir);

  if (mode === 'rollback') {
    await runRollback();
  } else {
    await runDryOrApply();
  }
} catch (error) {
  console.error('\nSlug promotion failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
