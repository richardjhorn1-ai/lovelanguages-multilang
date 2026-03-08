#!/usr/bin/env node
/**
 * Backfill blog_article_slug_aliases from published article data and legacy Vercel redirects.
 *
 * Usage:
 *   node backfill-slug-aliases.mjs --dry-run
 *   node backfill-slug-aliases.mjs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseLearnArticlePath } from '../src/lib/native-slugs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const dryRun = process.argv.includes('--dry-run');
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PAGE_SIZE = 1000;

function makeArticleKey(nativeLang, targetLang, slug) {
  return `${nativeLang}|${targetLang}|${slug}`;
}

function makeTopicKey(nativeLang, targetLang, topicId) {
  return `${nativeLang}|${targetLang}|${topicId}`;
}

async function fetchPublishedArticles() {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, native_lang, target_lang, slug, topic_id, is_canonical')
      .eq('published', true)
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

function loadLegacyRedirectCandidates(canonicalByKey) {
  const vercelPath = path.join(projectRoot, 'vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const redirects = vercelConfig.redirects || [];
  const candidates = [];

  for (const redirect of redirects) {
    const source = parseLearnArticlePath(redirect.source);
    const destination = parseLearnArticlePath(redirect.destination);

    if (!source || !destination) {
      continue;
    }

    if (source.nativeLang !== destination.nativeLang || source.targetLang !== destination.targetLang) {
      continue;
    }

    if (source.slug === destination.slug) {
      continue;
    }

    const destinationKey = makeArticleKey(destination.nativeLang, destination.targetLang, destination.slug);
    const canonicalArticle = canonicalByKey.get(destinationKey);
    if (!canonicalArticle) {
      continue;
    }

    candidates.push({
      article_id: canonicalArticle.id,
      native_lang: source.nativeLang,
      target_lang: source.targetLang,
      alias_slug: source.slug,
      source: 'vercel_redirect',
    });
  }

  return candidates;
}

const articles = await fetchPublishedArticles();
const canonicalByKey = new Map();
const canonicalByTopic = new Map();
const candidates = [];
const conflicts = {
  duplicateCanonicalKeys: [],
  duplicateCanonicalTopics: [],
  unresolvedNonCanonical: [],
  aliasTargetsAlreadyCanonical: [],
  conflictingAliasTargets: [],
};

for (const article of articles.filter(candidate => candidate.is_canonical !== false)) {
  const articleKey = makeArticleKey(article.native_lang, article.target_lang, article.slug);

  if (canonicalByKey.has(articleKey)) {
    conflicts.duplicateCanonicalKeys.push(articleKey);
    continue;
  }

  canonicalByKey.set(articleKey, article);

  if (article.topic_id) {
    const topicKey = makeTopicKey(article.native_lang, article.target_lang, article.topic_id);
    if (canonicalByTopic.has(topicKey)) {
      conflicts.duplicateCanonicalTopics.push(topicKey);
      continue;
    }
    canonicalByTopic.set(topicKey, article);
  }
}

for (const article of articles.filter(candidate => candidate.is_canonical === false)) {
  if (!article.topic_id) {
    conflicts.unresolvedNonCanonical.push(makeArticleKey(article.native_lang, article.target_lang, article.slug));
    continue;
  }

  const canonicalArticle = canonicalByTopic.get(
    makeTopicKey(article.native_lang, article.target_lang, article.topic_id)
  );

  if (!canonicalArticle) {
    conflicts.unresolvedNonCanonical.push(makeArticleKey(article.native_lang, article.target_lang, article.slug));
    continue;
  }

  candidates.push({
    article_id: canonicalArticle.id,
    native_lang: article.native_lang,
    target_lang: article.target_lang,
    alias_slug: article.slug,
    source: 'non_canonical_article',
  });
}

candidates.push(...loadLegacyRedirectCandidates(canonicalByKey));

const dedupedCandidates = [];
const seenAliasTargets = new Map();

for (const candidate of candidates) {
  const aliasKey = makeArticleKey(candidate.native_lang, candidate.target_lang, candidate.alias_slug);
  const canonicalArticle = canonicalByKey.get(aliasKey);

  if (canonicalArticle) {
    if (canonicalArticle.id !== candidate.article_id) {
      conflicts.aliasTargetsAlreadyCanonical.push(aliasKey);
    }
    continue;
  }

  if (seenAliasTargets.has(aliasKey) && seenAliasTargets.get(aliasKey) !== candidate.article_id) {
    conflicts.conflictingAliasTargets.push(aliasKey);
    continue;
  }

  seenAliasTargets.set(aliasKey, candidate.article_id);
  dedupedCandidates.push(candidate);
}

console.log('=== ALIAS BACKFILL SUMMARY ===');
console.log(`Published article rows: ${articles.length}`);
console.log(`Canonical rows: ${canonicalByKey.size}`);
console.log(`Candidate aliases: ${candidates.length}`);
console.log(`Deduped aliases: ${dedupedCandidates.length}`);

for (const [key, value] of Object.entries(conflicts)) {
  if (value.length > 0) {
    console.log(`  ${key}: ${value.length}`);
  }
}

if (dedupedCandidates.length > 0) {
  console.log('\nSample aliases:');
  for (const candidate of dedupedCandidates.slice(0, 15)) {
    console.log(`  ${candidate.native_lang}/${candidate.target_lang}/${candidate.alias_slug} -> ${candidate.article_id} (${candidate.source})`);
  }
}

if (dryRun) {
  process.exit(0);
}

if (dedupedCandidates.length === 0) {
  console.log('\nNo aliases to insert.');
  process.exit(0);
}

const { error } = await supabase
  .from('blog_article_slug_aliases')
  .upsert(dedupedCandidates, {
    onConflict: 'native_lang,target_lang,alias_slug',
    ignoreDuplicates: false,
  });

if (error) {
  console.error('\nFailed to upsert alias rows:', error.message);
  process.exit(1);
}

console.log(`\nInserted or updated ${dedupedCandidates.length} alias rows.`);
