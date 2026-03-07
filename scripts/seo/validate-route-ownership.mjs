import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateVercelSupportOwnership() {
  const vercel = read('vercel.json');
  assert(
    vercel.includes('/((?!learn|compare|tools|dictionary|support|api|_vercel|assets|sitemap|story).*)'),
    'vercel.json rewrite fallback does not exclude /support/ from SPA catch-all'
  );
}

function validateViteDenylist() {
  const viteConfig = read('vite.config.ts');
  assert(
    viteConfig.includes('/^\\/support/'),
    'vite PWA navigateFallbackDenylist is missing /^\\/support/'
  );
}

function validateSitemapSupportEntry() {
  const sitemapPages = read('blog/src/pages/sitemap-pages.xml.ts');
  assert(
    sitemapPages.includes("{ loc: '/support/'"),
    'sitemap-pages.xml.ts does not include /support/ as a canonical public page'
  );
}

function validateInventorySupportClassification() {
  const inventory = read('scripts/seo/generate-url-inventory.mjs');
  assert(
    inventory.includes("add('/support/', 'page', true"),
    'SEO inventory classifies /support/ incorrectly'
  );
}

function main() {
  validateVercelSupportOwnership();
  validateViteDenylist();
  validateSitemapSupportEntry();
  validateInventorySupportClassification();
  console.log('Route ownership contract validation passed.');
}

main();
