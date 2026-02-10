#!/usr/bin/env node
/**
 * Update vercel.json with generated redirects
 *
 * Usage: node scripts/update-vercel-redirects.cjs
 */

const fs = require('fs');
const path = require('path');

const vercelPath = path.join(__dirname, '..', '..', 'vercel.json');
const redirectsPath = path.join(__dirname, '..', 'generated-redirects.json');

// Read current vercel.json
const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

// Read generated redirects
const generatedData = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));

// Get existing redirects that we want to keep (manual overrides)
const existingRedirects = vercelConfig.redirects || [];
const manualRedirects = existingRedirects.filter(r =>
  // Keep redirects that aren't auto-generated (e.g., the polish-pet-names one)
  !r.source.match(/^\/learn\/[a-z]{2}\/[a-z]{2}\//) &&
  !r.source.match(/^\/learn\/[a-z]{2}\/[a-z]+-/)
);

console.log(`Existing manual redirects to keep: ${manualRedirects.length}`);
console.log(`New generated redirects: ${generatedData.redirects.length}`);

// Combine redirects (manual first, then generated)
const allRedirects = [...manualRedirects, ...generatedData.redirects];

// Deduplicate by source
const seen = new Set();
const dedupedRedirects = allRedirects.filter(r => {
  if (seen.has(r.source)) return false;
  seen.add(r.source);
  return true;
});

console.log(`Total after dedup: ${dedupedRedirects.length}`);

// Check Vercel limits (https://vercel.com/docs/projects/project-configuration#redirects)
const VERCEL_HOBBY_LIMIT = 1024;
const VERCEL_PRO_LIMIT = 2048;

if (dedupedRedirects.length > VERCEL_PRO_LIMIT) {
  console.warn(`\n⚠️  WARNING: ${dedupedRedirects.length} redirects exceeds Vercel Pro limit (${VERCEL_PRO_LIMIT})`);
  console.warn('Consider using middleware or edge functions for redirects instead.');
} else if (dedupedRedirects.length > VERCEL_HOBBY_LIMIT) {
  console.warn(`\n⚠️  Note: ${dedupedRedirects.length} redirects exceeds Hobby limit (${VERCEL_HOBBY_LIMIT}), Pro plan required.`);
}

// Update vercel.json
vercelConfig.redirects = dedupedRedirects;

// Write back
fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2) + '\n');

console.log(`\n✅ Updated ${vercelPath}`);
console.log(`   Total redirects: ${dedupedRedirects.length}`);

// Summary by type
const byPattern = {
  'Spanish slugs (es/)': 0,
  'French slugs (fr/)': 0,
  'Legacy 2-segment': 0,
  'Other': 0
};

for (const r of dedupedRedirects) {
  if (r.source.startsWith('/learn/es/') && !r.source.match(/^\/learn\/es\/[a-z]{2}\/[a-z]+-/)) {
    byPattern['Legacy 2-segment']++;
  } else if (r.source.startsWith('/learn/es/')) {
    byPattern['Spanish slugs (es/)']++;
  } else if (r.source.startsWith('/learn/fr/')) {
    byPattern['French slugs (fr/)']++;
  } else if (r.source.match(/^\/learn\/[a-z]{2}\/[a-z]+-/)) {
    byPattern['Legacy 2-segment']++;
  } else {
    byPattern['Other']++;
  }
}

console.log('\nRedirects by pattern:');
for (const [pattern, count] of Object.entries(byPattern)) {
  if (count > 0) console.log(`   ${pattern}: ${count}`);
}
