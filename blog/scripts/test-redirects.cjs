#!/usr/bin/env node
/**
 * Test redirects against the live website
 *
 * Checks which old URLs return 404 (need redirect) and
 * verifies new URLs return 200 (destination exists)
 *
 * Usage:
 *   node scripts/test-redirects.cjs                    # Test all
 *   node scripts/test-redirects.cjs --sample 50        # Test 50 random samples
 *   node scripts/test-redirects.cjs --source es        # Test only Spanish
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.lovelanguages.io';
const CONCURRENCY = 10; // Parallel requests
const TIMEOUT = 10000; // 10 seconds

// Parse args
const args = process.argv.slice(2);
let sampleSize = null;
let filterSource = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--sample' && args[i + 1]) {
    sampleSize = parseInt(args[i + 1]);
  }
  if (args[i] === '--source' && args[i + 1]) {
    filterSource = args[i + 1];
  }
}

// Load generated redirects
const redirectsPath = path.join(__dirname, '..', 'generated-redirects.json');
if (!fs.existsSync(redirectsPath)) {
  console.error('❌ Run generate-redirects.cjs first');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));

// Get unique redirects (skip trailing slash duplicates for testing)
let redirects = data.redirects.filter(r => !r.source.endsWith('/'));

// Filter by source if specified
if (filterSource) {
  redirects = redirects.filter(r => r.source.includes(`/${filterSource}/`));
  console.log(`Filtered to ${filterSource}: ${redirects.length} redirects`);
}

// Sample if specified
if (sampleSize && sampleSize < redirects.length) {
  redirects = redirects.sort(() => Math.random() - 0.5).slice(0, sampleSize);
  console.log(`Sampled: ${sampleSize} redirects`);
}

console.log(`Testing ${redirects.length} redirects against ${SITE_URL}\n`);

// Check URL status
function checkUrl(urlPath) {
  return new Promise((resolve) => {
    const url = SITE_URL + urlPath;
    const startTime = Date.now();

    const req = https.get(url, { timeout: TIMEOUT }, (res) => {
      const elapsed = Date.now() - startTime;
      resolve({
        path: urlPath,
        status: res.statusCode,
        elapsed,
        location: res.headers.location || null
      });
    });

    req.on('error', (err) => {
      resolve({
        path: urlPath,
        status: 'ERROR',
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path: urlPath,
        status: 'TIMEOUT'
      });
    });
  });
}

// Process in batches
async function processBatch(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);

    // Progress
    const done = Math.min(i + concurrency, items.length);
    process.stdout.write(`\rProgress: ${done}/${items.length} (${Math.round(done/items.length*100)}%)`);
  }
  console.log('\n');
  return results;
}

async function main() {
  const results = {
    oldUrls404: [],      // Old URLs returning 404 (GOOD - need redirect)
    oldUrls200: [],      // Old URLs returning 200 (already redirected or still works)
    oldUrlsOther: [],    // Old URLs with other status
    newUrls200: [],      // New URLs returning 200 (GOOD - destination exists)
    newUrls404: [],      // New URLs returning 404 (BAD - destination missing!)
    newUrlsOther: [],    // New URLs with other status
  };

  // Test old URLs (sources)
  console.log('=== Testing OLD URLs (should be 404) ===');
  const oldResults = await processBatch(
    redirects.map(r => r.source),
    checkUrl,
    CONCURRENCY
  );

  for (const result of oldResults) {
    if (result.status === 404) {
      results.oldUrls404.push(result);
    } else if (result.status === 200 || result.status === 301 || result.status === 302) {
      results.oldUrls200.push(result);
    } else {
      results.oldUrlsOther.push(result);
    }
  }

  // Test new URLs (destinations)
  console.log('=== Testing NEW URLs (should be 200) ===');
  const newResults = await processBatch(
    redirects.map(r => r.destination),
    checkUrl,
    CONCURRENCY
  );

  for (const result of newResults) {
    if (result.status === 200) {
      results.newUrls200.push(result);
    } else if (result.status === 404) {
      results.newUrls404.push(result);
    } else {
      results.newUrlsOther.push(result);
    }
  }

  // Summary
  console.log('=== RESULTS ===\n');

  console.log('OLD URLs (redirect sources):');
  console.log(`  ✅ 404 (needs redirect): ${results.oldUrls404.length}`);
  console.log(`  ⚠️  200/3xx (already works): ${results.oldUrls200.length}`);
  console.log(`  ❓ Other: ${results.oldUrlsOther.length}`);

  console.log('\nNEW URLs (redirect destinations):');
  console.log(`  ✅ 200 (exists): ${results.newUrls200.length}`);
  console.log(`  ❌ 404 (MISSING!): ${results.newUrls404.length}`);
  console.log(`  ❓ Other: ${results.newUrlsOther.length}`);

  // Show problematic cases
  if (results.newUrls404.length > 0) {
    console.log('\n❌ CRITICAL: These NEW URLs are 404 (redirect destination missing):');
    results.newUrls404.slice(0, 20).forEach(r => console.log(`   ${r.path}`));
    if (results.newUrls404.length > 20) {
      console.log(`   ... and ${results.newUrls404.length - 20} more`);
    }
  }

  if (results.oldUrls200.length > 0) {
    console.log('\n⚠️  These OLD URLs already return 200/3xx (may not need redirect):');
    results.oldUrls200.slice(0, 10).forEach(r =>
      console.log(`   ${r.path} → ${r.status}${r.location ? ` → ${r.location}` : ''}`)
    );
    if (results.oldUrls200.length > 10) {
      console.log(`   ... and ${results.oldUrls200.length - 10} more`);
    }
  }

  // Sample of confirmed 404s
  if (results.oldUrls404.length > 0) {
    console.log('\n✅ Sample of OLD URLs that ARE 404 (confirming redirect needed):');
    results.oldUrls404.slice(0, 10).forEach(r => console.log(`   ${r.path}`));
  }

  // Save detailed results
  const outputPath = path.join(__dirname, '..', 'redirect-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);
}

main().catch(console.error);
