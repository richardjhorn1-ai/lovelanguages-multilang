#!/usr/bin/env node
/**
 * HTTP-Level SEO Auditor
 * Phase 3 of SEO_AUDIT_HARDENING_EXECUTION_PLAN_MAR2026
 *
 * Audits a deployed site without browser dependencies.
 * Checks canonical tags, OG/Twitter URLs, JSON-LD, sitemaps, redirects.
 *
 * Usage:
 *   node scripts/seo/audit-deployed-seo.mjs --base-url https://www.lovelanguages.io --inventory tmp/seo-audit/2026-03-07/url-inventory.json
 *   node scripts/seo/audit-deployed-seo.mjs --base-url https://preview-url.vercel.app --inventory tmp/seo-audit/2026-03-07/url-inventory.json --sample-size 50
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const SITE_URL = 'https://www.lovelanguages.io';

// Parse args
const { values: args } = parseArgs({
  options: {
    'base-url': { type: 'string', default: SITE_URL },
    'inventory': { type: 'string' },
    'sample-size': { type: 'string', default: '0' },
    'output': { type: 'string' },
    'full': { type: 'boolean', default: false },
    'pages-only': { type: 'boolean', default: false },
  }
});

const BASE_URL = args['base-url'];
const SAMPLE_SIZE = parseInt(args['sample-size']) || 0;
const IS_PREVIEW = BASE_URL !== SITE_URL;

class SEOAuditor {
  constructor(baseUrl, inventory) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.inventory = inventory;
    this.results = [];
    this.failures = [];
    this.warnings = [];
    this.errorCounts = {};
    this.checkedCount = 0;
    this.passedCount = 0;
  }

  fail(url, errorType, message) {
    this.failures.push({ url, errorType, message });
    this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;
  }

  warn(url, warnType, message) {
    this.warnings.push({ url, warnType, message });
  }

  async fetchPage(url, followRedirects = true) {
    const fullUrl = `${this.baseUrl}${url}`;
    try {
      const res = await fetch(fullUrl, {
        redirect: followRedirects ? 'follow' : 'manual',
        headers: { 'User-Agent': 'LoveLanguages-SEO-Auditor/1.0' }
      });
      const text = await res.text();
      return { status: res.status, headers: Object.fromEntries(res.headers), body: text, url: fullUrl, redirected: res.redirected };
    } catch (err) {
      return { status: 0, headers: {}, body: '', url: fullUrl, error: err.message };
    }
  }

  extractCanonicals(html) {
    const matches = [...html.matchAll(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi)];
    // Also match reverse attribute order
    const matches2 = [...html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*\/?>/gi)];
    const all = [...matches.map(m => m[1]), ...matches2.map(m => m[1])];
    return [...new Set(all)];
  }

  extractOgUrl(html) {
    const match = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:url["'][^>]*\/?>/i);
    return match ? match[1] : null;
  }

  extractTwitterUrl(html) {
    const match = html.match(/<meta[^>]*name=["']twitter:url["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:url["'][^>]*\/?>/i);
    return match ? match[1] : null;
  }

  extractJsonLd(html) {
    const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    return scripts.map(s => {
      try { return JSON.parse(s[1]); } catch { return null; }
    }).filter(Boolean);
  }

  extractRobotsContent(html) {
    const match = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*\/?>/i);
    return match ? match[1].toLowerCase() : null;
  }

  checkJsonLdUrls(jsonLdObjects, expectedCanonical, url) {
    for (const obj of jsonLdObjects) {
      if (obj.url && obj.url !== expectedCanonical) {
        this.fail(url, 'json_ld_url_mismatch', `JSON-LD @type=${obj['@type']} url="${obj.url}" != canonical "${expectedCanonical}"`);
      }
      if (obj.mainEntityOfPage) {
        const mep = typeof obj.mainEntityOfPage === 'string' ? obj.mainEntityOfPage : obj.mainEntityOfPage?.['@id'];
        if (mep && mep !== expectedCanonical) {
          this.fail(url, 'json_ld_mainentity_mismatch', `JSON-LD mainEntityOfPage="${mep}" != canonical "${expectedCanonical}"`);
        }
      }
      // Check breadcrumb URLs
      if (obj['@type'] === 'BreadcrumbList' && obj.itemListElement) {
        for (const item of obj.itemListElement) {
          const itemUrl = item.item || item['@id'];
          if (itemUrl && typeof itemUrl === 'string') {
            if (!itemUrl.startsWith(SITE_URL)) {
              this.fail(url, 'breadcrumb_wrong_host', `Breadcrumb item "${itemUrl}" does not use canonical host`);
            }
            // Check trailing slash (except for non-HTML like images)
            if (itemUrl.startsWith('http') && !itemUrl.match(/\.\w{2,4}$/) && !itemUrl.endsWith('/')) {
              this.fail(url, 'breadcrumb_no_trailing_slash', `Breadcrumb item "${itemUrl}" missing trailing slash`);
            }
          }
        }
      }
    }
  }

  async auditIndexablePage(item) {
    const { url, expected_canonical, kind } = item;
    const res = await this.fetchPage(url);

    if (res.error) {
      this.fail(url, 'fetch_error', res.error);
      return;
    }

    // Must be 200
    if (res.status !== 200) {
      this.fail(url, 'wrong_status', `Expected 200, got ${res.status}`);
      return;
    }

    // Canonical tag — exactly one
    const canonicals = this.extractCanonicals(res.body);
    if (canonicals.length === 0) {
      this.fail(url, 'missing_canonical', 'No canonical tag found');
    } else if (canonicals.length > 1) {
      this.fail(url, 'duplicate_canonical', `Found ${canonicals.length} canonical tags: ${canonicals.join(', ')}`);
    } else {
      const canonical = canonicals[0];
      // Canonical must match expected (on production)
      if (!IS_PREVIEW && canonical !== expected_canonical) {
        this.fail(url, 'canonical_mismatch', `Canonical "${canonical}" != expected "${expected_canonical}"`);
      }
      // Canonical must use correct host
      if (!canonical.startsWith(SITE_URL)) {
        this.fail(url, 'canonical_wrong_host', `Canonical "${canonical}" does not use ${SITE_URL}`);
      }
      // Canonical must have trailing slash
      const canonicalPath = new URL(canonical).pathname;
      if (canonicalPath !== '/' && !canonicalPath.endsWith('/')) {
        this.fail(url, 'canonical_no_trailing_slash', `Canonical path "${canonicalPath}" missing trailing slash`);
      }
    }

    // OG URL
    const ogUrl = this.extractOgUrl(res.body);
    if (ogUrl && canonicals.length === 1 && ogUrl !== canonicals[0] && !IS_PREVIEW) {
      this.fail(url, 'og_url_mismatch', `og:url "${ogUrl}" != canonical "${canonicals[0]}"`);
    }

    // Twitter URL
    const twitterUrl = this.extractTwitterUrl(res.body);
    if (twitterUrl && canonicals.length === 1 && twitterUrl !== canonicals[0] && !IS_PREVIEW) {
      this.fail(url, 'twitter_url_mismatch', `twitter:url "${twitterUrl}" != canonical "${canonicals[0]}"`);
    }

    // JSON-LD URLs
    const jsonLd = this.extractJsonLd(res.body);
    if (canonicals.length === 1 && !IS_PREVIEW) {
      this.checkJsonLdUrls(jsonLd, canonicals[0], url);
    }

    this.checkedCount++;
    if (this.failures.filter(f => f.url === url).length === 0) {
      this.passedCount++;
    }
  }

  async auditExcludedPage(item) {
    const { url, kind } = item;
    const res = await this.fetchPage(url, false);

    if (res.error) {
      // Some excluded URLs may not exist — that's OK
      return;
    }

    if (kind === 'legacy_stub') {
      // Should be noindex or redirect
      if (res.status === 200) {
        const robots = this.extractRobotsContent(res.body);
        if (!robots || !robots.includes('noindex')) {
          this.fail(url, 'legacy_stub_indexable', `Legacy stub ${url} is 200 without noindex`);
        }
        // Should NOT have canonical
        const canonicals = this.extractCanonicals(res.body);
        if (canonicals.length > 0) {
          this.fail(url, 'legacy_stub_has_canonical', `Legacy stub ${url} has canonical: ${canonicals.join(', ')}`);
        }
      }
    }

    if (kind === 'redirect_shell') {
      if (res.status === 200) {
        const robots = this.extractRobotsContent(res.body);
        if (!robots || !robots.includes('noindex')) {
          this.fail(url, 'redirect_shell_indexable', `Redirect shell ${url} is 200 without noindex`);
        }
      }
    }

    if (kind === 'excluded_pseudo_hub') {
      // Should not be 200 with indexable content
      if (res.status === 200) {
        const robots = this.extractRobotsContent(res.body);
        if (!robots || !robots.includes('noindex')) {
          this.warn(url, 'pseudo_hub_exists', `Pseudo-hub ${url} returns 200`);
        }
      }
    }

    this.checkedCount++;
  }

  async auditSitemaps() {
    console.log('\n=== SITEMAP AUDIT ===');

    // Page sitemap
    const pageRes = await this.fetchPage('/sitemap-pages.xml');
    if (pageRes.status !== 200) {
      this.fail('/sitemap-pages.xml', 'sitemap_error', `Status ${pageRes.status}`);
    } else {
      if (!pageRes.body.includes('<?xml') && !pageRes.body.includes('<urlset')) {
        this.fail('/sitemap-pages.xml', 'sitemap_invalid_xml', 'Not valid XML');
      }

      const locs = [...pageRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      const uniqueLocs = new Set(locs);

      if (locs.length !== uniqueLocs.size) {
        this.fail('/sitemap-pages.xml', 'sitemap_duplicate_locs', `${locs.length - uniqueLocs.size} duplicate <loc> values`);
      }

      // Check for excluded routes
      for (const loc of locs) {
        if (loc.match(/\/learn\/[a-z]{2}\/all\//)) {
          this.fail('/sitemap-pages.xml', 'sitemap_contains_all', `Contains /all/ URL: ${loc}`);
        }
        if (loc.includes('/learn/couples-language-learning/') && !loc.includes('/learn/en/couples-language-learning/') && !loc.match(/\/learn\/[a-z]{2}\/couples-language-learning\//)) {
          this.fail('/sitemap-pages.xml', 'sitemap_contains_generic_couples', `Contains generic couples hub: ${loc}`);
        }
        if (loc === `${SITE_URL}/compare/` || loc === `${this.baseUrl}/compare/`) {
          this.fail('/sitemap-pages.xml', 'sitemap_contains_compare_root', 'Contains redirect-only /compare/ root');
        }
        // Check for legacy locale stubs
        for (const locale of ['pl','fr','de','es','it','pt']) {
          if (loc === `${SITE_URL}/${locale}/` || loc === `${this.baseUrl}/${locale}/`) {
            this.fail('/sitemap-pages.xml', 'sitemap_contains_legacy_stub', `Contains legacy stub: ${loc}`);
          }
        }
      }

      console.log(`  Page sitemap: ${locs.length} URLs, ${uniqueLocs.size} unique`);
    }

    // Article sitemap
    const articleRes = await this.fetchPage('/sitemap-articles.xml');
    if (articleRes.status !== 200) {
      this.fail('/sitemap-articles.xml', 'sitemap_error', `Status ${articleRes.status}`);
    } else {
      const locs = [...articleRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      const uniqueLocs = new Set(locs);

      if (locs.length !== uniqueLocs.size) {
        this.fail('/sitemap-articles.xml', 'sitemap_duplicate_locs', `${locs.length - uniqueLocs.size} duplicate <loc> values`);
      }

      if (locs.length < 1000) {
        this.fail('/sitemap-articles.xml', 'sitemap_too_few_articles', `Only ${locs.length} articles — expected 10,000+`);
      }

      console.log(`  Article sitemap: ${locs.length} URLs, ${uniqueLocs.size} unique`);
    }

    // Sitemap index
    const indexRes = await this.fetchPage('/sitemap-index.xml');
    if (indexRes.status !== 200) {
      this.fail('/sitemap-index.xml', 'sitemap_error', `Status ${indexRes.status}`);
    } else {
      if (!indexRes.body.includes('sitemap-pages.xml') && !indexRes.body.includes('sitemap-articles.xml')) {
        this.fail('/sitemap-index.xml', 'sitemap_index_incomplete', 'Missing child sitemap references');
      }
      // Check for story host
      if (indexRes.body.includes('story.lovelanguages.io')) {
        this.fail('/sitemap-index.xml', 'sitemap_contains_story', 'Contains story subdomain');
      }
      console.log(`  Sitemap index: OK`);
    }
  }

  async auditSitemapUrlStatuses() {
    console.log('\n=== SITEMAP URL STATUS SAMPLING ===');
    const pageRes = await this.fetchPage('/sitemap-pages.xml');
    const locs = [...pageRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

    // Sample 30 URLs from page sitemap
    const sample = locs.length <= 30 ? locs : locs.sort(() => Math.random() - 0.5).slice(0, 30);
    let ok = 0, fail = 0;

    for (const loc of sample) {
      try {
        const res = await fetch(loc, {
          redirect: 'manual',
          headers: { 'User-Agent': 'LoveLanguages-SEO-Auditor/1.0' }
        });
        if (res.status === 200) {
          ok++;
        } else if (res.status >= 300 && res.status < 400) {
          this.fail(loc, 'sitemap_url_redirects', `Sitemap URL returns ${res.status}`);
          fail++;
        } else {
          this.fail(loc, 'sitemap_url_error', `Sitemap URL returns ${res.status}`);
          fail++;
        }
      } catch (err) {
        this.fail(loc, 'sitemap_url_fetch_error', err.message);
        fail++;
      }
    }
    console.log(`  Sampled ${sample.length}: ${ok} OK, ${fail} failed`);
  }

  async run() {
    const inventoryData = JSON.parse(readFileSync(args['inventory'], 'utf-8'));
    const allItems = inventoryData.inventory;

    let indexableItems = allItems.filter(i => i.expected_indexable);
    let excludedItems = allItems.filter(i => !i.expected_indexable);

    // Apply pages-only filter
    if (args['pages-only']) {
      indexableItems = indexableItems.filter(i => i.kind !== 'article' && i.kind !== 'methodology');
    }

    // Apply sampling
    if (SAMPLE_SIZE > 0 && indexableItems.length > SAMPLE_SIZE) {
      // Always include representative pages
      const mustInclude = indexableItems.filter(i =>
        ['page', 'pair_hub', 'methodology_index', 'topic_hub'].includes(i.kind) ||
        i.url === '/' || i.url === '/learn/' || i.url === '/compare/en/' || i.url === '/tools/name-day-finder/'
      );
      const remaining = indexableItems.filter(i => !mustInclude.includes(i));
      const sampled = remaining.sort(() => Math.random() - 0.5).slice(0, SAMPLE_SIZE - mustInclude.length);
      indexableItems = [...mustInclude, ...sampled];
    }

    console.log(`\n=== SEO AUDIT: ${this.baseUrl} ===`);
    console.log(`Indexable pages to check: ${indexableItems.length}`);
    console.log(`Excluded pages to check: ${excludedItems.length}`);

    // Audit sitemaps first
    await this.auditSitemaps();
    await this.auditSitemapUrlStatuses();

    // Audit indexable pages
    console.log('\n=== INDEXABLE PAGE AUDIT ===');
    const batchSize = 10;
    for (let i = 0; i < indexableItems.length; i += batchSize) {
      const batch = indexableItems.slice(i, i + batchSize);
      await Promise.all(batch.map(item => this.auditIndexablePage(item)));
      if ((i + batchSize) % 100 === 0 || i + batchSize >= indexableItems.length) {
        console.log(`  Checked ${Math.min(i + batchSize, indexableItems.length)}/${indexableItems.length}...`);
      }
    }

    // Audit excluded pages
    console.log('\n=== EXCLUDED PAGE AUDIT ===');
    for (const item of excludedItems) {
      await this.auditExcludedPage(item);
    }

    // Generate report
    return this.generateReport(inventoryData.summary);
  }

  generateReport(inventorySummary) {
    const report = {
      audit_timestamp: new Date().toISOString(),
      base_url: this.baseUrl,
      is_preview: IS_PREVIEW,
      inventory_summary: inventorySummary,
      checked: this.checkedCount,
      passed: this.passedCount,
      failed: this.failures.length,
      warnings: this.warnings.length,
      pass: this.failures.length === 0,
      error_counts: this.errorCounts,
      failures: this.failures,
      warnings_list: this.warnings,
    };

    console.log('\n==============================');
    console.log(`AUDIT RESULT: ${report.pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`==============================`);
    console.log(`Checked: ${report.checked}`);
    console.log(`Passed: ${report.passed}`);
    console.log(`Failures: ${report.failed}`);
    console.log(`Warnings: ${report.warnings}`);

    if (Object.keys(report.error_counts).length > 0) {
      console.log('\nError breakdown:');
      for (const [type, count] of Object.entries(report.error_counts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count}`);
      }
    }

    if (report.failures.length > 0) {
      console.log('\nFailing URLs (first 30):');
      for (const f of report.failures.slice(0, 30)) {
        console.log(`  [${f.errorType}] ${f.url}: ${f.message}`);
      }
      if (report.failures.length > 30) {
        console.log(`  ... and ${report.failures.length - 30} more`);
      }
    }

    return report;
  }
}

async function main() {
  if (!args['inventory']) {
    console.error('Usage: node audit-deployed-seo.mjs --base-url URL --inventory PATH [--sample-size N] [--pages-only]');
    process.exit(1);
  }

  const auditor = new SEOAuditor(BASE_URL, null);
  const report = await auditor.run();

  // Write output
  const outputDir = resolve(ROOT, 'tmp/seo-audit/2026-03-07');
  mkdirSync(outputDir, { recursive: true });

  const suffix = IS_PREVIEW ? 'preview' : 'production';
  const outputPath = args['output'] || resolve(outputDir, `audit-report-${suffix}.json`);
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to: ${outputPath}`);

  process.exit(report.pass ? 0 : 1);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
