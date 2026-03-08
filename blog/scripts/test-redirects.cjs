#!/usr/bin/env node
/**
 * Trace redirect behavior for article aliases and legacy redirects.
 *
 * Prefers the SEO inventory's article_alias entries. Falls back to generated-redirects.json.
 *
 * Usage:
 *   node scripts/test-redirects.cjs
 *   node scripts/test-redirects.cjs --inventory ../tmp/seo-audit/latest/url-inventory.json
 *   node scripts/test-redirects.cjs --sample 50
 *   node scripts/test-redirects.cjs --source es
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.lovelanguages.io';
const CONCURRENCY = 10;
const TIMEOUT = 10000;
const MAX_HOPS = 6;

const args = process.argv.slice(2);
let sampleSize = null;
let filterSource = null;
let inventoryPath = path.join(__dirname, '..', '..', 'tmp', 'seo-audit', 'latest', 'url-inventory.json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--sample' && args[i + 1]) {
    sampleSize = parseInt(args[i + 1], 10);
  }
  if (args[i] === '--source' && args[i + 1]) {
    filterSource = args[i + 1];
  }
  if (args[i] === '--inventory' && args[i + 1]) {
    inventoryPath = path.resolve(__dirname, args[i + 1]);
  }
}

function loadCases() {
  if (fs.existsSync(inventoryPath)) {
    const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    const aliases = (inventoryData.inventory || [])
      .filter(item => item.kind === 'article_alias')
      .map(item => ({
        source: item.url,
        expectedTarget: new URL(item.expected_redirect_target).pathname,
        expectedStatus: item.expected_status || 301,
        sourceKind: item.source,
      }));

    if (aliases.length > 0) {
      return aliases;
    }
  }

  const redirectsPath = path.join(__dirname, '..', 'generated-redirects.json');
  if (!fs.existsSync(redirectsPath)) {
    console.error('No article alias inventory or generated-redirects.json found.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
  return (data.redirects || []).map(redirect => ({
    source: redirect.source,
    expectedTarget: redirect.destination,
    expectedStatus: 301,
    sourceKind: 'generated_redirect',
  }));
}

function requestOnce(urlPath) {
  const targetUrl = new URL(urlPath, SITE_URL);

  return new Promise((resolve) => {
    const req = https.get(targetUrl, { timeout: TIMEOUT }, (res) => {
      resolve({
        url: `${targetUrl.pathname}${targetUrl.search}`,
        status: res.statusCode,
        location: res.headers.location || null,
      });
    });

    req.on('error', (error) => {
      resolve({
        url: `${targetUrl.pathname}${targetUrl.search}`,
        status: 'ERROR',
        error: error.message,
        location: null,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: `${targetUrl.pathname}${targetUrl.search}`,
        status: 'TIMEOUT',
        location: null,
      });
    });
  });
}

async function traceRedirect(urlPath) {
  const hops = [];
  const seen = new Set();
  let current = urlPath;
  let loop = false;

  while (hops.length < MAX_HOPS) {
    const normalizedCurrent = new URL(current, SITE_URL).pathname;
    if (seen.has(normalizedCurrent)) {
      loop = true;
      break;
    }
    seen.add(normalizedCurrent);

    const step = await requestOnce(current);
    hops.push(step);

    if (typeof step.status !== 'number' || step.status < 300 || step.status >= 400 || !step.location) {
      break;
    }

    current = new URL(step.location, SITE_URL).pathname;
  }

  return {
    hops,
    loop,
    exhausted: hops.length >= MAX_HOPS && hops[hops.length - 1]?.location,
  };
}

async function processBatch(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);

    const done = Math.min(i + concurrency, items.length);
    process.stdout.write(`\rProgress: ${done}/${items.length} (${Math.round((done / items.length) * 100)}%)`);
  }
  console.log('\n');
  return results;
}

async function main() {
  let cases = loadCases();

  if (filterSource) {
    cases = cases.filter(item => item.source.includes(`/${filterSource}/`));
  }

  if (sampleSize && sampleSize < cases.length) {
    cases = cases.sort(() => Math.random() - 0.5).slice(0, sampleSize);
  }

  console.log(`Testing ${cases.length} redirect cases against ${SITE_URL}\n`);

  const traced = await processBatch(
    cases,
    async (item) => ({
      ...item,
      trace: await traceRedirect(item.source),
    }),
    CONCURRENCY
  );

  const summary = {
    ok: [],
    loops: [],
    wrongFirstHopStatus: [],
    wrongTarget: [],
    redirectChains: [],
    unavailableTarget: [],
    errors: [],
  };

  for (const item of traced) {
    const firstHop = item.trace.hops[0];
    const finalHop = item.trace.hops[item.trace.hops.length - 1];
    const expectedTargetPath = new URL(item.expectedTarget, SITE_URL).pathname;

    if (item.trace.loop) {
      summary.loops.push(item);
      continue;
    }

    if (!firstHop || typeof firstHop.status !== 'number') {
      summary.errors.push(item);
      continue;
    }

    if (firstHop.status !== item.expectedStatus) {
      summary.wrongFirstHopStatus.push(item);
      continue;
    }

    if (!firstHop.location) {
      summary.errors.push(item);
      continue;
    }

    const firstTargetPath = new URL(firstHop.location, SITE_URL).pathname;
    if (firstTargetPath !== expectedTargetPath) {
      summary.wrongTarget.push(item);
      continue;
    }

    if (item.trace.hops.length > 2) {
      summary.redirectChains.push(item);
      continue;
    }

    if (!finalHop || finalHop.status !== 200) {
      summary.unavailableTarget.push(item);
      continue;
    }

    summary.ok.push(item);
  }

  console.log('=== RESULTS ===\n');
  console.log(`  OK: ${summary.ok.length}`);
  console.log(`  Loops: ${summary.loops.length}`);
  console.log(`  Wrong first-hop status: ${summary.wrongFirstHopStatus.length}`);
  console.log(`  Wrong target: ${summary.wrongTarget.length}`);
  console.log(`  Redirect chains (>1 redirect): ${summary.redirectChains.length}`);
  console.log(`  Unavailable target: ${summary.unavailableTarget.length}`);
  console.log(`  Errors: ${summary.errors.length}`);

  const samples = [
    ['Loops', summary.loops],
    ['Wrong target', summary.wrongTarget],
    ['Redirect chains', summary.redirectChains],
    ['Unavailable target', summary.unavailableTarget],
  ];

  for (const [label, items] of samples) {
    if (items.length === 0) {
      continue;
    }

    console.log(`\n${label}:`);
    for (const item of items.slice(0, 10)) {
      const hopSummary = item.trace.hops
        .map(hop => `${hop.url} [${hop.status}${hop.location ? ` -> ${hop.location}` : ''}]`)
        .join(' | ');
      console.log(`  ${item.source} :: ${hopSummary}`);
    }
  }

  const outputPath = path.join(__dirname, '..', 'redirect-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);

  const failed =
    summary.loops.length +
    summary.wrongFirstHopStatus.length +
    summary.wrongTarget.length +
    summary.redirectChains.length +
    summary.unavailableTarget.length +
    summary.errors.length;

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
