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

function isArticleToArticleRedirect(redirect) {
  return (
    /^\/learn\/[a-z]{2}\/[a-z]{2}\/[a-z0-9-]+\/?$/.test(redirect.source) &&
    /^\/learn\/[a-z]{2}\/[a-z]{2}\/[a-z0-9-]+\/?$/.test(redirect.destination)
  );
}

// Keep only non-article redirects in vercel.json.
// Article slug aliases now belong in the data layer (blog_article_slug_aliases),
// not in static Vercel config.
const existingRedirects = vercelConfig.redirects || [];
const manualRedirects = existingRedirects.filter(r => !isArticleToArticleRedirect(r));
const removedArticleRedirects = existingRedirects.length - manualRedirects.length;

console.log(`Existing manual redirects to keep: ${manualRedirects.length}`);
console.log(`Article redirects removed from vercel.json: ${removedArticleRedirects}`);
console.log(`Generated article redirects ignored: ${(generatedData.redirects || []).length}`);

// Deduplicate the remaining non-article redirects by source.
const seen = new Set();
const dedupedRedirects = manualRedirects.filter(r => {
  if (seen.has(r.source)) return false;
  seen.add(r.source);
  return true;
});

console.log(`Total non-article redirects after dedup: ${dedupedRedirects.length}`);

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
  'Legacy 2-segment': 0,
  'Other': 0
};

for (const r of dedupedRedirects) {
  if (r.source.match(/^\/learn\/[a-z]{2}\/[a-z]+-/)) {
    byPattern['Legacy 2-segment']++;
  } else {
    byPattern['Other']++;
  }
}

console.log('\nRedirects by pattern:');
for (const [pattern, count] of Object.entries(byPattern)) {
  if (count > 0) console.log(`   ${pattern}: ${count}`);
}
