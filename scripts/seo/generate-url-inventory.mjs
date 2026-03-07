#!/usr/bin/env node
/**
 * SEO URL Inventory Generator
 *
 * Outputs a deterministic JSON inventory of the URLs the site intends to expose,
 * including canonical URLs, exclusions, and redirect shells.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const SITE_URL = 'https://www.lovelanguages.io';
const VALID_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'sv', 'no', 'da', 'cs', 'ru', 'uk', 'el', 'hu', 'tr', 'ro'];
const LEGACY_LOCALE_STUBS = ['pl', 'fr', 'de', 'es', 'it', 'pt'];
const DEFAULT_OUTPUT_DIR = resolve(ROOT, 'tmp/seo-audit', new Date().toISOString().slice(0, 10));
const DEFAULT_ENV_FILES = [
  '.env',
  'blog/.env',
  '.env.local',
  'blog/.env.local',
];

const { values: args } = parseArgs({
  options: {
    'env-file': { type: 'string' },
    'output': { type: 'string' },
    'output-dir': { type: 'string' },
    'supabase-key': { type: 'string' },
    'supabase-url': { type: 'string' },
  },
});

function parseEnvContent(content) {
  const vars = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Z0-9_]+)=([\s\S]*)$/);
    if (!match) continue;

    let [, key, value] = match;
    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseEnvContent(readFileSync(filePath, 'utf-8'));
}

function loadSupabaseCredentials() {
  const vars = {};

  for (const relativePath of DEFAULT_ENV_FILES) {
    Object.assign(vars, loadEnvFile(resolve(ROOT, relativePath)));
  }

  if (args['env-file']) {
    Object.assign(vars, loadEnvFile(resolve(ROOT, args['env-file'])));
  }

  Object.assign(vars, process.env);

  return {
    supabaseUrl:
      args['supabase-url'] ||
      vars.SUPABASE_URL ||
      vars.PUBLIC_SUPABASE_URL,
    supabaseKey:
      args['supabase-key'] ||
      vars.SUPABASE_SERVICE_KEY ||
      vars.SUPABASE_SERVICE_ROLE_KEY ||
      vars.SUPABASE_ANON_KEY ||
      vars.PUBLIC_SUPABASE_ANON_KEY,
  };
}

async function fetchAllArticles(supabaseUrl, supabaseKey) {
  const allArticles = [];
  let offset = 0;
  const pageSize = 1000;
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/blog_articles?select=native_lang,target_lang,slug,is_canonical&order=id&offset=${offset}&limit=${pageSize}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'count=exact',
        },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase request failed (${res.status}): ${body}`);
    }

    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      total = parseInt(contentRange.split('/')[1], 10);
    }

    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    allArticles.push(...batch);
    offset += pageSize;
  }

  if (allArticles.length === 0) {
    throw new Error('No articles returned from Supabase. Verify the linked project and env configuration.');
  }

  return allArticles;
}

async function getSupabaseData(supabaseUrl, supabaseKey) {
  const allArticles = await fetchAllArticles(supabaseUrl, supabaseKey);

  const uniquePairs = [...new Set(
    allArticles
      .filter(article => article.target_lang !== 'all')
      .map(article => `${article.native_lang}|${article.target_lang}`)
  )];

  const langPairs = uniquePairs.map(pair => {
    const [native_lang, target_lang] = pair.split('|');
    return { native_lang, target_lang };
  });

  const nativeLangs = [...new Set(allArticles.map(article => article.native_lang))]
    .filter(lang => VALID_LANGS.includes(lang));

  const methodologyArticles = allArticles.filter(
    article => article.target_lang === 'all' && article.is_canonical !== false
  );

  const regularArticles = allArticles.filter(
    article => article.target_lang !== 'all' && article.is_canonical !== false
  );

  return { langPairs, nativeLangs, regularArticles, methodologyArticles };
}

function generateInventory(data) {
  const { langPairs, nativeLangs, regularArticles, methodologyArticles } = data;
  const inventory = [];
  const seenUrls = new Set();

  function add(url, kind, indexable, source, notes = '') {
    const canonical = `${SITE_URL}${url}`;

    if (seenUrls.has(url)) {
      throw new Error(`Duplicate URL detected in inventory: ${url}`);
    }
    seenUrls.add(url);

    if (!canonical.startsWith(SITE_URL)) {
      throw new Error(`Canonical host mismatch: ${canonical}`);
    }

    if (indexable && url !== '/' && !url.endsWith('/')) {
      throw new Error(`Canonical HTML URL missing trailing slash: ${url}`);
    }

    inventory.push({
      url,
      canonical,
      kind,
      expected_indexable: indexable,
      expected_canonical: canonical,
      source,
      notes,
    });
  }

  add('/', 'page', true, 'static', 'Homepage');
  add('/learn/', 'page', true, 'static', 'Learn hub');
  add('/learn/en/couples-language-learning/', 'page', true, 'static', 'Couples language learning (EN)');
  add('/tools/', 'page', true, 'static', 'Tools hub');
  add('/tools/name-day-finder/', 'page', true, 'static', 'Name day finder tool');
  add('/dictionary/', 'page', true, 'static', 'Dictionary hub');
  add('/support/', 'page', true, 'static', 'Public support page');

  for (const lang of nativeLangs.filter(candidate => VALID_LANGS.includes(candidate))) {
    add(`/learn/${lang}/`, 'native_hub', true, 'dynamic_native_hub');

    if (lang !== 'en') {
      add(`/learn/${lang}/couples-language-learning/`, 'couples_hub', true, 'dynamic_couples_hub');
    }

    add(`/compare/${lang}/`, 'compare_hub', true, 'dynamic_compare_hub');
    add(`/compare/${lang}/love-languages-vs-duolingo/`, 'compare_detail', true, 'dynamic_compare_detail');
    add(`/compare/${lang}/love-languages-vs-babbel/`, 'compare_detail', true, 'dynamic_compare_detail');
  }

  for (const pair of langPairs) {
    if (
      pair.target_lang === 'all' ||
      !VALID_LANGS.includes(pair.native_lang) ||
      !VALID_LANGS.includes(pair.target_lang)
    ) {
      continue;
    }

    const url = `/learn/${pair.native_lang}/${pair.target_lang}/`;
    if (!seenUrls.has(url)) {
      add(url, 'pair_hub', true, 'dynamic_pair');
    }
  }

  for (const article of regularArticles) {
    const url = `/learn/${article.native_lang}/${article.target_lang}/${article.slug}/`;
    if (!seenUrls.has(url)) {
      add(url, 'article', true, 'article_db');
    }
  }

  for (const article of methodologyArticles) {
    const url = `/learn/${article.native_lang}/couples-language-learning/methodology/${article.slug}/`;
    if (!seenUrls.has(url)) {
      add(url, 'methodology_article', true, 'article_db');
    }
  }

  for (const lang of nativeLangs.filter(candidate => VALID_LANGS.includes(candidate))) {
    const url = `/learn/${lang}/couples-language-learning/methodology/`;
    if (!seenUrls.has(url)) {
      add(url, 'methodology_index', true, 'dynamic_methodology');
    }
  }

  const topics = ['pet-names', 'i-love-you', 'pronunciation', 'grammar-basics', 'essential-phrases', 'romantic-phrases'];
  for (const lang of nativeLangs.filter(candidate => VALID_LANGS.includes(candidate))) {
    for (const topic of topics) {
      const url = `/learn/${lang}/topics/${topic}/`;
      if (!seenUrls.has(url)) {
        add(url, 'topic_hub', true, 'dynamic_topic');
      }
    }
  }

  for (const locale of LEGACY_LOCALE_STUBS) {
    add(`/${locale}/`, 'legacy_stub', false, 'manual_exception', 'Legacy locale redirect stub — noindex');
  }

  add('/compare/', 'redirect_shell', false, 'manual_exception', 'Redirect to /compare/en/ — not indexable');
  add('/learn/couples-language-learning/', 'redirect_shell', false, 'manual_exception', 'Redirect to /learn/en/couples-language-learning/');

  for (const lang of nativeLangs.filter(candidate => VALID_LANGS.includes(candidate))) {
    const url = `/learn/${lang}/all/`;
    if (!seenUrls.has(url)) {
      add(url, 'excluded_pseudo_hub', false, 'manual_exception', 'Placeholder pseudo-hub — must not be in sitemap');
    }
  }

  return inventory;
}

function buildSummary(inventory) {
  const summary = {
    generated_at: new Date().toISOString(),
    total_urls: inventory.length,
    indexable_urls: inventory.filter(item => item.expected_indexable).length,
    excluded_urls: inventory.filter(item => !item.expected_indexable).length,
    by_kind: {},
  };

  for (const item of inventory) {
    summary.by_kind[item.kind] = (summary.by_kind[item.kind] || 0) + 1;
  }

  return summary;
}

async function main() {
  const { supabaseUrl, supabaseKey } = loadSupabaseCredentials();

  if (!supabaseUrl) {
    throw new Error('No Supabase URL found. Set SUPABASE_URL or PUBLIC_SUPABASE_URL, or pass --supabase-url.');
  }

  if (!supabaseKey) {
    throw new Error('No Supabase key found. Set SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or PUBLIC_SUPABASE_ANON_KEY.');
  }

  console.log('Fetching data from Supabase...');
  const data = await getSupabaseData(supabaseUrl, supabaseKey);
  console.log(`  Language pairs: ${data.langPairs.length}`);
  console.log(`  Native languages: ${data.nativeLangs.length}`);
  console.log(`  Regular articles: ${data.regularArticles.length}`);
  console.log(`  Methodology articles: ${data.methodologyArticles.length}`);

  console.log('Generating URL inventory...');
  const inventory = generateInventory(data);
  const summary = buildSummary(inventory);

  const outputDir = resolve(ROOT, args['output-dir'] || DEFAULT_OUTPUT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const outputPath = args.output
    ? resolve(ROOT, args.output)
    : resolve(outputDir, 'url-inventory.json');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify({ summary, inventory }, null, 2));

  console.log('\n=== URL INVENTORY SUMMARY ===');
  console.log(`Total URLs: ${summary.total_urls}`);
  console.log(`Indexable: ${summary.indexable_urls}`);
  console.log(`Excluded: ${summary.excluded_urls}`);
  console.log('\nBy kind:');
  for (const [kind, count] of Object.entries(summary.by_kind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${kind}: ${count}`);
  }
  console.log(`\nOutput: ${outputPath}`);
}

main().catch(error => {
  console.error('FATAL:', error.message || error);
  process.exit(1);
});
