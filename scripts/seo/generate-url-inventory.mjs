#!/usr/bin/env node
/**
 * SEO URL Inventory Generator
 * Phase 2 of SEO_AUDIT_HARDENING_EXECUTION_PLAN_MAR2026
 *
 * Outputs a JSON file with every URL the site intends to expose,
 * including canonical URLs, exclusions, and redirect shells.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const SITE_URL = 'https://www.lovelanguages.io';
const VALID_LANGS = ['en','es','fr','de','it','pt','pl','nl','sv','no','da','cs','ru','uk','el','hu','tr','ro'];
const LEGACY_LOCALE_STUBS = ['pl','fr','de','es','it','pt'];

// Load Supabase credentials
function loadSupabaseCredentials() {
  const vars = {};
  // Read blog .env first (lower priority)
  try {
    const envPath = resolve(ROOT, 'blog/.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([A-Z_]+)=["']?([^"'\n]+)["']?$/);
      if (match) vars[match[1]] = match[2];
    }
  } catch {}
  // Read secrets tokens (higher priority — overrides blog .env)
  try {
    const tokensPath = resolve(process.env.HOME, 'clawd/secrets/.env.tokens');
    const content = readFileSync(tokensPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_]+)=["']?([^"'\n]+)["']?$/);
      if (match) vars[match[1]] = match[2];
    }
  } catch {}
  return vars;
}

async function supabaseQuery(url, key, table, select, filters = '', offset = 0, limit = 1000) {
  const params = new URLSearchParams({ select, offset: String(offset), limit: String(limit) });
  if (filters) params.append('', ''); // handled in URL
  const filterStr = filters ? `&${filters}` : '';
  const res = await fetch(
    `${url}/rest/v1/${table}?${params}${filterStr}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' } }
  );
  const data = await res.json();
  const contentRange = res.headers.get('content-range');
  const total = contentRange ? parseInt(contentRange.split('/')[1]) : data.length;
  return { data, total };
}

async function getSupabaseData(supabaseUrl, supabaseKey) {
  // Get ALL articles with pagination
  const allArticles = [];
  let offset = 0;
  const pageSize = 1000;
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/blog_articles?select=native_lang,target_lang,slug,is_canonical,updated_at&order=id&offset=${offset}&limit=${pageSize}`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'count=exact' } }
    );
    const contentRange = res.headers.get('content-range');
    if (contentRange) total = parseInt(contentRange.split('/')[1]);
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    allArticles.push(...batch);
    offset += pageSize;
  }

  // Derive unique pairs and native languages
  const uniquePairs = [...new Set(allArticles.filter(a => a.target_lang !== 'all').map(a => `${a.native_lang}|${a.target_lang}`))];
  const langPairs = uniquePairs.map(p => { const [n, t] = p.split('|'); return { native_lang: n, target_lang: t }; });
  const nativeLangs = [...new Set(allArticles.map(a => a.native_lang))].filter(l => VALID_LANGS.includes(l));

  const methodologyArticles = allArticles.filter(a => a.target_lang === 'all' && a.is_canonical !== false);
  const regularArticles = allArticles.filter(a => a.target_lang !== 'all' && a.is_canonical !== false);

  return { langPairs, nativeLangs, regularArticles, methodologyArticles };
}

function generateInventory(data) {
  const { langPairs, nativeLangs, regularArticles, methodologyArticles } = data;
  const inventory = [];
  const seenUrls = new Set();

  function add(url, kind, indexable, source, notes = '') {
    const canonical = `${SITE_URL}${url}`;
    if (seenUrls.has(url)) {
      console.error(`DUPLICATE URL DETECTED: ${url}`);
      process.exit(1);
    }
    seenUrls.add(url);

    // Validation
    if (!canonical.startsWith(SITE_URL)) {
      console.error(`CANONICAL HOST MISMATCH: ${canonical}`);
      process.exit(1);
    }
    if (indexable && url !== '/' && !url.endsWith('/')) {
      console.error(`CANONICAL URL MISSING TRAILING SLASH: ${url}`);
      process.exit(1);
    }

    inventory.push({
      url,
      canonical,
      kind,
      expected_indexable: indexable,
      expected_canonical: canonical,
      source,
      notes
    });
  }

  // === STATIC PAGES ===
  add('/', 'page', true, 'static', 'Homepage');
  add('/learn/', 'page', true, 'static', 'Learn hub');
  add('/learn/en/couples-language-learning/', 'page', true, 'static', 'Couples language learning (EN)');
  add('/tools/', 'page', true, 'static', 'Tools hub');
  add('/tools/name-day-finder/', 'page', true, 'static', 'Name day finder tool');
  add('/dictionary/', 'page', true, 'static', 'Dictionary hub');
  // /support/ is an SPA route served by index.html — cannot have unique canonical.
  // Excluded from indexable inventory until it's a standalone SSR page.
  add('/support/', 'spa_route', false, 'manual_exception', 'SPA route — no unique SEO surface');

  // === NATIVE LANGUAGE HUBS ===
  for (const lang of nativeLangs.filter(l => VALID_LANGS.includes(l))) {
    add(`/learn/${lang}/`, 'page', true, 'dynamic_native_hub');
    if (lang !== 'en') {
      add(`/learn/${lang}/couples-language-learning/`, 'page', true, 'dynamic_couples_hub');
    }
    // Compare pages
    add(`/compare/${lang}/`, 'page', true, 'dynamic_compare_hub');
    add(`/compare/${lang}/love-languages-vs-duolingo/`, 'page', true, 'dynamic_compare_detail');
    add(`/compare/${lang}/love-languages-vs-babbel/`, 'page', true, 'dynamic_compare_detail');
  }

  // === LANGUAGE PAIR HUBS ===
  for (const pair of langPairs) {
    if (pair.target_lang === 'all' || !VALID_LANGS.includes(pair.native_lang) || !VALID_LANGS.includes(pair.target_lang)) continue;
    const url = `/learn/${pair.native_lang}/${pair.target_lang}/`;
    if (!seenUrls.has(url)) {
      add(url, 'pair_hub', true, 'dynamic_pair');
    }
  }

  // === ARTICLES ===
  for (const article of regularArticles) {
    const url = `/learn/${article.native_lang}/${article.target_lang}/${article.slug}/`;
    if (!seenUrls.has(url)) {
      add(url, 'article', true, 'article_db');
    }
  }

  // === METHODOLOGY ARTICLES ===
  for (const article of methodologyArticles) {
    const url = `/learn/${article.native_lang}/couples-language-learning/methodology/${article.slug}/`;
    if (!seenUrls.has(url)) {
      add(url, 'methodology', true, 'article_db');
    }
  }

  // === METHODOLOGY INDEX PAGES ===
  for (const lang of nativeLangs.filter(l => VALID_LANGS.includes(l))) {
    const url = `/learn/${lang}/couples-language-learning/methodology/`;
    if (!seenUrls.has(url)) {
      add(url, 'methodology_index', true, 'dynamic_methodology');
    }
  }

  // === TOPIC PAGES ===
  const TOPICS = ['phrases', 'vocabulary', 'grammar', 'pronunciation', 'culture', 'communication', 'situations'];
  for (const lang of nativeLangs.filter(l => VALID_LANGS.includes(l))) {
    for (const topic of TOPICS) {
      const url = `/learn/${lang}/topics/${topic}/`;
      if (!seenUrls.has(url)) {
        add(url, 'topic_hub', true, 'dynamic_topic');
      }
    }
  }

  // === EXCLUSIONS — Legacy locale stubs ===
  for (const locale of LEGACY_LOCALE_STUBS) {
    add(`/${locale}/`, 'legacy_stub', false, 'manual_exception', 'Legacy locale redirect stub — noindex');
  }

  // === EXCLUSIONS — Redirect shells ===
  add('/compare/', 'redirect_shell', false, 'manual_exception', 'Redirect to /compare/en/ — not indexable');
  add('/learn/couples-language-learning/', 'redirect_shell', false, 'manual_exception', 'Redirect to /learn/en/couples-language-learning/');

  // === EXCLUSIONS — /all/ pseudo-hubs ===
  for (const lang of nativeLangs.filter(l => VALID_LANGS.includes(l))) {
    const url = `/learn/${lang}/all/`;
    if (!seenUrls.has(url)) {
      add(url, 'excluded_pseudo_hub', false, 'manual_exception', 'Placeholder pseudo-hub — must not be in sitemap');
    }
  }

  return inventory;
}

async function main() {
  const creds = loadSupabaseCredentials();
  const supabaseUrl = creds.SUPABASE_URL || creds.PUBLIC_SUPABASE_URL || 'https://iiusoobuoxurysrhqptx.supabase.co';
  const supabaseKey = creds.SUPABASE_SERVICE_KEY || creds.SUPABASE_SERVICE_ROLE_KEY || creds.SUPABASE_ANON_KEY || creds.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    console.error('ERROR: No Supabase key found');
    process.exit(1);
  }

  console.log('Fetching data from Supabase...');
  const data = await getSupabaseData(supabaseUrl, supabaseKey);
  console.log(`  Language pairs: ${data.langPairs.length}`);
  console.log(`  Native languages: ${data.nativeLangs.length}`);
  console.log(`  Regular articles: ${data.regularArticles.length}`);
  console.log(`  Methodology articles: ${data.methodologyArticles.length}`);

  console.log('Generating URL inventory...');
  const inventory = generateInventory(data);

  const indexable = inventory.filter(u => u.expected_indexable);
  const excluded = inventory.filter(u => !u.expected_indexable);

  const summary = {
    generated_at: new Date().toISOString(),
    total_urls: inventory.length,
    indexable_urls: indexable.length,
    excluded_urls: excluded.length,
    by_kind: {},
  };

  for (const item of inventory) {
    summary.by_kind[item.kind] = (summary.by_kind[item.kind] || 0) + 1;
  }

  const outputDir = resolve(ROOT, 'tmp/seo-audit/2026-03-07');
  mkdirSync(outputDir, { recursive: true });

  const output = { summary, inventory };
  const outputPath = resolve(outputDir, 'url-inventory.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('\n=== URL INVENTORY SUMMARY ===');
  console.log(`Total URLs: ${summary.total_urls}`);
  console.log(`Indexable: ${summary.indexable_urls}`);
  console.log(`Excluded: ${summary.excluded_urls}`);
  console.log(`\nBy kind:`);
  for (const [kind, count] of Object.entries(summary.by_kind).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${kind}: ${count}`);
  }
  console.log(`\nOutput: ${outputPath}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
