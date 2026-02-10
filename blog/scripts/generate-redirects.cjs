#!/usr/bin/env node
/**
 * Generate redirects for old article slugs
 *
 * This script extracts all file renames from git history and generates
 * Vercel redirect rules for the old URLs.
 *
 * Usage: node scripts/generate-redirects.cjs
 * Output: Prints JSON redirect rules to stdout
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Commits that had slug standardization renames
const RENAME_COMMITS = [
  'fb4d948', // Standardize all article slugs to English
  '56ffdb1', // Fix slug inconsistencies
  'bd183ed', // Update documentation / fixes
  '4b85402', // Restructure for multi-native-language
  'e1e375b', // Major SEO overhaul
];

// Also check the mapping files for additional redirects
const MAPPING_FILES = [
  'scripts/en-es-mapping.json',
  'scripts/en-fr-mapping.json',
];

function extractRenamesFromGit() {
  const renames = [];

  for (const commit of RENAME_COMMITS) {
    try {
      // Get the diff with renames detected
      const output = execSync(
        `git show ${commit} --diff-filter=R --name-status -M`,
        { encoding: 'utf8', cwd: __dirname + '/..' }
      );

      // Parse the output for rename lines (R100 or R###)
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/^R\d+\s+(?:blog\/)?src\/content\/articles\/([^\s]+)\s+(?:blog\/)?src\/content\/articles\/([^\s]+)/);
        if (match) {
          const oldPath = match[1].replace('.mdx', '');
          const newPath = match[2].replace('.mdx', '');

          // Extract native and target language from path
          const oldParts = oldPath.split('/');
          const newParts = newPath.split('/');

          if (oldParts.length >= 3 && newParts.length >= 3) {
            const nativeLang = oldParts[0];
            const targetLang = oldParts[1];
            const oldSlug = oldParts.slice(2).join('/');
            const newSlug = newParts.slice(2).join('/');

            if (oldSlug !== newSlug) {
              renames.push({
                source: `/learn/${nativeLang}/${targetLang}/${oldSlug}`,
                destination: `/learn/${nativeLang}/${targetLang}/${newSlug}/`,
                nativeLang,
                targetLang,
                oldSlug,
                newSlug,
                commit
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error processing commit ${commit}:`, e.message);
    }
  }

  return renames;
}

function extractFromMappingFiles() {
  const renames = [];

  for (const mappingFile of MAPPING_FILES) {
    const fullPath = path.join(__dirname, '..', mappingFile);
    if (fs.existsSync(fullPath)) {
      try {
        const mapping = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        // Determine native and target language from filename
        // en-es-mapping.json means es native -> pl target (based on file content)
        const fileMatch = mappingFile.match(/en-(\w+)-mapping\.json/);
        if (fileMatch) {
          const nativeLang = fileMatch[1]; // es or fr
          const targetLang = 'pl'; // These mappings are for Polish articles

          for (const item of mapping) {
            if (item.en_slug && item.es_slug) {
              renames.push({
                source: `/learn/${nativeLang}/${targetLang}/${item.es_slug}`,
                destination: `/learn/${nativeLang}/${targetLang}/${item.en_slug}/`,
                nativeLang,
                targetLang,
                oldSlug: nativeLang === 'es' ? item.es_slug : item.fr_slug,
                newSlug: item.en_slug,
                fromMapping: mappingFile
              });
            }
            if (item.en_slug && item.fr_slug) {
              renames.push({
                source: `/learn/fr/${targetLang}/${item.fr_slug}`,
                destination: `/learn/fr/${targetLang}/${item.en_slug}/`,
                nativeLang: 'fr',
                targetLang,
                oldSlug: item.fr_slug,
                newSlug: item.en_slug,
                fromMapping: mappingFile
              });
            }
          }
        }
      } catch (e) {
        console.error(`Error processing mapping file ${mappingFile}:`, e.message);
      }
    }
  }

  return renames;
}

function generateLegacyTwoSegmentRedirects() {
  // These are redirects from old /learn/xx/slug to new /learn/en/xx/slug
  // For languages that were originally target-only before multi-native support
  const legacyLanguages = ['ru', 'uk', 'tr', 'pl', 'cs', 'da', 'el', 'hu', 'nl', 'no', 'ro', 'sv'];
  const renames = [];

  // Get current articles to generate legacy redirects
  const articlesDir = path.join(__dirname, '..', 'src/content/articles/en');

  for (const targetLang of legacyLanguages) {
    const targetDir = path.join(articlesDir, targetLang);
    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.mdx'));
      for (const file of files) {
        const slug = file.replace('.mdx', '');
        renames.push({
          source: `/learn/${targetLang}/${slug}`,
          destination: `/learn/en/${targetLang}/${slug}/`,
          type: 'legacy-2-segment',
          targetLang
        });
      }
    }
  }

  return renames;
}

function deduplicateRedirects(redirects) {
  const seen = new Set();
  return redirects.filter(r => {
    const key = r.source;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateVercelRedirects(redirects) {
  // Only emit trailing-slash variants — trailingSlash: true in vercel.json
  // normalizes /path → /path/ automatically before redirects fire.
  return redirects.map(r => ({
    source: r.source.endsWith('/') ? r.source : r.source + '/',
    destination: r.destination,
    permanent: true
  }));
}

// Main execution
console.error('Extracting renames from git history...');
const gitRenames = extractRenamesFromGit();
console.error(`Found ${gitRenames.length} renames from git`);

console.error('Extracting from mapping files...');
const mappingRenames = extractFromMappingFiles();
console.error(`Found ${mappingRenames.length} renames from mapping files`);

// Legacy 2-segment redirects are now handled by middleware (blog/src/middleware.ts)
// So we skip them here to reduce vercel.json size
console.error('Skipping legacy 2-segment redirects (handled by middleware)...');
const legacyRedirects = []; // generateLegacyTwoSegmentRedirects();
console.error(`Legacy redirects: 0 (handled by middleware)`);

const allRedirects = deduplicateRedirects([...gitRenames, ...mappingRenames, ...legacyRedirects]);
console.error(`Total unique redirects: ${allRedirects.length}`);

const vercelRedirects = generateVercelRedirects(allRedirects);
console.error(`Vercel redirect rules: ${vercelRedirects.length}`);

// Output the redirects as JSON
console.log(JSON.stringify(vercelRedirects, null, 2));

// Also save to a file
const outputPath = path.join(__dirname, '..', 'generated-redirects.json');
fs.writeFileSync(outputPath, JSON.stringify({
  generated: new Date().toISOString(),
  totalRedirects: allRedirects.length,
  vercelRules: vercelRedirects.length,
  redirects: vercelRedirects
}, null, 2));
console.error(`\nSaved to ${outputPath}`);

// Summary by type
const byType = {};
for (const r of allRedirects) {
  const type = r.type || r.fromMapping || r.commit || 'unknown';
  byType[type] = (byType[type] || 0) + 1;
}
console.error('\nRedirects by source:');
for (const [type, count] of Object.entries(byType)) {
  console.error(`  ${type}: ${count}`);
}
