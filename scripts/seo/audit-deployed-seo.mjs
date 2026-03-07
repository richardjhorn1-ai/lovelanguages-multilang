#!/usr/bin/env node
/**
 * HTTP-Level SEO Auditor
 *
 * Audits a deployed site without browser dependencies.
 * Checks canonical tags, OG/Twitter URLs, JSON-LD, hreflang, sitemaps, and redirects.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const SITE_URL = 'https://www.lovelanguages.io';
const DEFAULT_OUTPUT_DIR = resolve(ROOT, 'tmp/seo-audit', new Date().toISOString().slice(0, 10));
const PAGE_SITEMAP_KINDS = new Set(['page', 'native_hub', 'couples_hub', 'compare_hub', 'compare_detail', 'pair_hub']);
const ARTICLE_SITEMAP_KINDS = new Set(['article', 'methodology_article']);
const FORBIDDEN_INTERNAL_LINKS = [
  '/compare/',
  `${SITE_URL}/compare/`,
  '/compare/love-languages-vs-duolingo/',
  `${SITE_URL}/compare/love-languages-vs-duolingo/`,
  '/compare/love-languages-vs-babbel/',
  `${SITE_URL}/compare/love-languages-vs-babbel/`,
  '/learn/couples-language-learning/',
  `${SITE_URL}/learn/couples-language-learning/`,
];

const { values: args } = parseArgs({
  options: {
    'base-url': { type: 'string', default: SITE_URL },
    'inventory': { type: 'string' },
    'output': { type: 'string' },
    'output-dir': { type: 'string' },
    'pages-only': { type: 'boolean', default: false },
    'sample-size': { type: 'string', default: '0' },
    'sitemap-sample-size': { type: 'string', default: '30' },
  },
});

const BASE_URL = args['base-url'].replace(/\/$/, '');
const SAMPLE_SIZE = parseInt(args['sample-size'], 10) || 0;
const SITEMAP_SAMPLE_SIZE = parseInt(args['sitemap-sample-size'], 10) || 30;
const IS_PREVIEW = BASE_URL !== SITE_URL;

function sampleItems(items, count) {
  if (items.length <= count) return [...items];

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function unique(values) {
  return [...new Set(values)];
}

class SEOAuditor {
  constructor(baseUrl, inventoryData) {
    this.baseUrl = baseUrl;
    this.inventoryData = inventoryData;
    this.allItems = inventoryData.inventory;
    this.failures = [];
    this.warnings = [];
    this.errorCounts = {};
    this.checkedCount = 0;
    this.passedCount = 0;

    const indexableItems = this.allItems.filter(item => item.expected_indexable);
    this.indexableUrlSet = new Set(indexableItems.map(item => item.expected_canonical));
    this.expectedPageSitemapUrls = new Set(
      indexableItems
        .filter(item => PAGE_SITEMAP_KINDS.has(item.kind))
        .map(item => item.expected_canonical)
    );
    this.expectedArticleSitemapUrls = new Set(
      indexableItems
        .filter(item => ARTICLE_SITEMAP_KINDS.has(item.kind))
        .map(item => item.expected_canonical)
    );
  }

  fail(url, errorType, message) {
    this.failures.push({ url, errorType, message });
    this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;
  }

  warn(url, warnType, message) {
    this.warnings.push({ url, warnType, message });
  }

  resolveAuditUrl(urlOrPath) {
    if (/^https?:\/\//.test(urlOrPath)) {
      return urlOrPath;
    }
    return `${this.baseUrl}${urlOrPath}`;
  }

  canonicalToAuditPath(canonicalUrl) {
    try {
      const parsed = new URL(canonicalUrl);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return canonicalUrl;
    }
  }

  async fetchPage(urlOrPath, followRedirects = true) {
    const auditUrl = this.resolveAuditUrl(urlOrPath);

    try {
      const res = await fetch(auditUrl, {
        redirect: followRedirects ? 'follow' : 'manual',
        headers: {
          'User-Agent': 'LoveLanguages-SEO-Auditor/1.0',
        },
      });

      return {
        status: res.status,
        headers: Object.fromEntries(res.headers),
        body: await res.text(),
        auditUrl,
        redirected: res.redirected,
      };
    } catch (error) {
      return {
        status: 0,
        headers: {},
        body: '',
        auditUrl,
        error: error.message,
      };
    }
  }

  extractCanonicals(html) {
    const matches = [
      ...html.matchAll(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi),
      ...html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*\/?>/gi),
    ];
    return unique(matches.map(match => match[1]));
  }

  extractOgUrl(html) {
    const match =
      html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:url["'][^>]*\/?>/i);
    return match ? match[1] : null;
  }

  extractTwitterUrl(html) {
    const match =
      html.match(/<meta[^>]*name=["']twitter:url["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:url["'][^>]*\/?>/i);
    return match ? match[1] : null;
  }

  extractJsonLd(html) {
    const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    return matches
      .map(match => {
        try {
          return JSON.parse(match[1]);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  extractRobotsContent(html) {
    const match =
      html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*\/?>/i);
    return match ? match[1].toLowerCase() : null;
  }

  extractHreflangs(html) {
    return [...html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi)]
      .map(match => ({ hreflang: match[1], href: match[2] }));
  }

  recordPass(url) {
    this.checkedCount += 1;
    if (!this.failures.some(failure => failure.url === url)) {
      this.passedCount += 1;
    }
  }

  checkJsonLdUrls(jsonLdObjects, expectedCanonical, url) {
    for (const entry of jsonLdObjects) {
      const objects = Array.isArray(entry) ? entry : [entry];

      for (const obj of objects) {
        if (!obj || typeof obj !== 'object') continue;

        if (obj.url && obj.url !== expectedCanonical) {
          this.fail(url, 'json_ld_url_mismatch', `JSON-LD @type=${obj['@type']} url="${obj.url}" != canonical "${expectedCanonical}"`);
        }

        if (obj.mainEntityOfPage) {
          const mainEntity = typeof obj.mainEntityOfPage === 'string'
            ? obj.mainEntityOfPage
            : obj.mainEntityOfPage?.['@id'];
          if (mainEntity && mainEntity !== expectedCanonical) {
            this.fail(url, 'json_ld_mainentity_mismatch', `JSON-LD mainEntityOfPage="${mainEntity}" != canonical "${expectedCanonical}"`);
          }
        }

        if (obj['@type'] === 'BreadcrumbList' && Array.isArray(obj.itemListElement)) {
          for (const item of obj.itemListElement) {
            const itemUrl = item?.item || item?.['@id'];
            if (!itemUrl || typeof itemUrl !== 'string') continue;

            if (!itemUrl.startsWith(SITE_URL)) {
              this.fail(url, 'breadcrumb_wrong_host', `Breadcrumb item "${itemUrl}" does not use canonical host`);
            }

            if (itemUrl.startsWith('http') && !itemUrl.match(/\.\w{2,4}($|\?)/) && !itemUrl.endsWith('/')) {
              this.fail(url, 'breadcrumb_no_trailing_slash', `Breadcrumb item "${itemUrl}" missing trailing slash`);
            }
          }
        }
      }
    }
  }

  checkHreflangs(hreflangs, url) {
    for (const alternate of hreflangs) {
      if (!alternate.href.startsWith(SITE_URL)) {
        this.fail(url, 'hreflang_wrong_host', `hreflang ${alternate.hreflang} points to non-canonical host: ${alternate.href}`);
      }

      try {
        const pathname = new URL(alternate.href).pathname;
        if (pathname !== '/' && !pathname.endsWith('/')) {
          this.fail(url, 'hreflang_no_trailing_slash', `hreflang ${alternate.hreflang} missing trailing slash: ${alternate.href}`);
        }
      } catch {
        this.fail(url, 'hreflang_invalid_url', `hreflang ${alternate.hreflang} is not a valid URL: ${alternate.href}`);
      }
    }
  }

  checkForbiddenLinks(html, url) {
    for (const forbidden of FORBIDDEN_INTERNAL_LINKS) {
      const escaped = forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`href=["']${escaped}["']`, 'i');
      if (pattern.test(html)) {
        this.fail(url, 'forbidden_internal_link', `Page links to redirect-only surface: ${forbidden}`);
      }
    }
  }

  async auditIndexablePage(item) {
    const { url, expected_canonical: expectedCanonical } = item;
    const res = await this.fetchPage(url);

    if (res.error) {
      this.fail(url, 'fetch_error', res.error);
      this.recordPass(url);
      return;
    }

    if (res.status !== 200) {
      this.fail(url, 'wrong_status', `Expected 200, got ${res.status}`);
      this.recordPass(url);
      return;
    }

    const canonicals = this.extractCanonicals(res.body);
    if (canonicals.length === 0) {
      this.fail(url, 'missing_canonical', 'No canonical tag found');
    } else if (canonicals.length > 1) {
      this.fail(url, 'duplicate_canonical', `Found ${canonicals.length} canonical tags: ${canonicals.join(', ')}`);
    } else {
      const canonical = canonicals[0];
      if (canonical !== expectedCanonical) {
        this.fail(url, 'canonical_mismatch', `Canonical "${canonical}" != expected "${expectedCanonical}"`);
      }
      if (!canonical.startsWith(SITE_URL)) {
        this.fail(url, 'canonical_wrong_host', `Canonical "${canonical}" does not use ${SITE_URL}`);
      }
      const canonicalPath = new URL(canonical).pathname;
      if (canonicalPath !== '/' && !canonicalPath.endsWith('/')) {
        this.fail(url, 'canonical_no_trailing_slash', `Canonical path "${canonicalPath}" missing trailing slash`);
      }
    }

    const robots = this.extractRobotsContent(res.body);
    if (robots && robots.includes('noindex')) {
      this.fail(url, 'indexable_page_noindex', `Indexable page has robots="${robots}"`);
    }

    const ogUrl = this.extractOgUrl(res.body);
    if (ogUrl && canonicals.length === 1 && ogUrl !== canonicals[0]) {
      this.fail(url, 'og_url_mismatch', `og:url "${ogUrl}" != canonical "${canonicals[0]}"`);
    }

    const twitterUrl = this.extractTwitterUrl(res.body);
    if (twitterUrl && canonicals.length === 1 && twitterUrl !== canonicals[0]) {
      this.fail(url, 'twitter_url_mismatch', `twitter:url "${twitterUrl}" != canonical "${canonicals[0]}"`);
    }

    if (canonicals.length === 1) {
      this.checkJsonLdUrls(this.extractJsonLd(res.body), canonicals[0], url);
    }

    this.checkHreflangs(this.extractHreflangs(res.body), url);
    this.checkForbiddenLinks(res.body, url);

    this.recordPass(url);
  }

  async auditExcludedPage(item) {
    const { url, kind } = item;
    const res = await this.fetchPage(url, false);

    if (res.error) {
      this.recordPass(url);
      return;
    }

    if (kind === 'legacy_stub' && res.status === 200) {
      const robots = this.extractRobotsContent(res.body);
      if (!robots || !robots.includes('noindex')) {
        this.fail(url, 'legacy_stub_indexable', `Legacy stub ${url} is 200 without noindex`);
      }

      const canonicals = this.extractCanonicals(res.body);
      if (canonicals.length > 0) {
        this.fail(url, 'legacy_stub_has_canonical', `Legacy stub ${url} has canonical: ${canonicals.join(', ')}`);
      }
    }

    if (kind === 'redirect_shell' && res.status === 200) {
      const robots = this.extractRobotsContent(res.body);
      if (!robots || !robots.includes('noindex')) {
        this.fail(url, 'redirect_shell_indexable', `Redirect shell ${url} is 200 without noindex`);
      }

      const canonicals = this.extractCanonicals(res.body);
      const selfCanonical = `${SITE_URL}${url}`;
      if (canonicals.includes(selfCanonical)) {
        this.fail(url, 'redirect_shell_self_canonical', `Redirect shell self-canonicalizes to ${selfCanonical}`);
      }
    }

    if (kind === 'excluded_pseudo_hub' && res.status === 200) {
      const robots = this.extractRobotsContent(res.body);
      if (!robots || !robots.includes('noindex')) {
        this.warn(url, 'pseudo_hub_exists', `Pseudo-hub ${url} returns 200 without noindex`);
      }
    }

    this.recordPass(url);
  }

  auditLocMembership(locs, expectedSet, sitemapPath, unknownType) {
    for (const loc of locs) {
      if (!expectedSet.has(loc)) {
        this.fail(sitemapPath, unknownType, `Unexpected sitemap URL: ${loc}`);
      }
    }

    for (const expected of expectedSet) {
      if (!locs.includes(expected)) {
        this.fail(sitemapPath, 'sitemap_missing_expected_url', `Missing expected sitemap URL: ${expected}`);
      }
    }
  }

  async auditSitemaps() {
    console.log('\n=== SITEMAP AUDIT ===');

    const pageRes = await this.fetchPage('/sitemap-pages.xml');
    if (pageRes.status !== 200) {
      this.fail('/sitemap-pages.xml', 'sitemap_error', `Status ${pageRes.status}`);
    } else {
      if (!pageRes.body.includes('<?xml') && !pageRes.body.includes('<urlset')) {
        this.fail('/sitemap-pages.xml', 'sitemap_invalid_xml', 'Not valid XML');
      }

      const locs = [...pageRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
      const uniqueLocs = new Set(locs);

      if (locs.length !== uniqueLocs.size) {
        this.fail('/sitemap-pages.xml', 'sitemap_duplicate_locs', `${locs.length - uniqueLocs.size} duplicate <loc> values`);
      }

      for (const loc of locs) {
        if (/\/learn\/[a-z]{2}\/all\//.test(loc)) {
          this.fail('/sitemap-pages.xml', 'sitemap_contains_all', `Contains /all/ URL: ${loc}`);
        }
        if (loc === `${SITE_URL}/compare/`) {
          this.fail('/sitemap-pages.xml', 'sitemap_contains_compare_root', 'Contains redirect-only /compare/ root');
        }
        if (loc === `${SITE_URL}/support/`) {
          this.fail('/sitemap-pages.xml', 'sitemap_contains_support_spa', 'Contains SPA-only /support/ route');
        }
        for (const locale of ['pl', 'fr', 'de', 'es', 'it', 'pt']) {
          if (loc === `${SITE_URL}/${locale}/`) {
            this.fail('/sitemap-pages.xml', 'sitemap_contains_legacy_stub', `Contains legacy stub: ${loc}`);
          }
        }
      }

      this.auditLocMembership(locs, this.expectedPageSitemapUrls, '/sitemap-pages.xml', 'sitemap_contains_unknown_page_url');
      console.log(`  Page sitemap: ${locs.length} URLs, ${uniqueLocs.size} unique`);
    }

    const articleRes = await this.fetchPage('/sitemap-articles.xml');
    if (articleRes.status !== 200) {
      this.fail('/sitemap-articles.xml', 'sitemap_error', `Status ${articleRes.status}`);
    } else {
      const locs = [...articleRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
      const uniqueLocs = new Set(locs);

      if (locs.length !== uniqueLocs.size) {
        this.fail('/sitemap-articles.xml', 'sitemap_duplicate_locs', `${locs.length - uniqueLocs.size} duplicate <loc> values`);
      }

      for (const loc of locs) {
        if (/\/all\//.test(loc)) {
          this.fail('/sitemap-articles.xml', 'sitemap_contains_all', `Contains /all/ URL: ${loc}`);
        }
      }

      this.auditLocMembership(locs, this.expectedArticleSitemapUrls, '/sitemap-articles.xml', 'sitemap_contains_unknown_article_url');
      console.log(`  Article sitemap: ${locs.length} URLs, ${uniqueLocs.size} unique`);
    }

    const indexRes = await this.fetchPage('/sitemap-index.xml');
    if (indexRes.status !== 200) {
      this.fail('/sitemap-index.xml', 'sitemap_error', `Status ${indexRes.status}`);
    } else {
      if (!indexRes.body.includes('sitemap-pages.xml') || !indexRes.body.includes('sitemap-articles.xml')) {
        this.fail('/sitemap-index.xml', 'sitemap_index_incomplete', 'Missing child sitemap references');
      }
      if (indexRes.body.includes('story.lovelanguages.io')) {
        this.fail('/sitemap-index.xml', 'sitemap_contains_story', 'Contains story subdomain');
      }
      console.log('  Sitemap index: OK');
    }
  }

  async auditSitemapUrlStatuses(sitemapPath, sampleSize) {
    const sitemapRes = await this.fetchPage(sitemapPath);
    if (sitemapRes.status !== 200) {
      return;
    }

    const canonicalLocs = [...sitemapRes.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    const sample = sampleItems(canonicalLocs, sampleSize);
    let ok = 0;
    let failed = 0;

    for (const loc of sample) {
      const auditPath = this.canonicalToAuditPath(loc);
      const res = await this.fetchPage(auditPath, false);

      if (res.error) {
        this.fail(loc, 'sitemap_url_fetch_error', res.error);
        failed += 1;
        continue;
      }

      if (res.status === 200) {
        ok += 1;
      } else if (res.status >= 300 && res.status < 400) {
        this.fail(loc, 'sitemap_url_redirects', `Sitemap URL returns ${res.status} on ${this.baseUrl}`);
        failed += 1;
      } else {
        this.fail(loc, 'sitemap_url_error', `Sitemap URL returns ${res.status} on ${this.baseUrl}`);
        failed += 1;
      }
    }

    console.log(`  ${sitemapPath}: sampled ${sample.length}, ${ok} OK, ${failed} failed`);
  }

  buildIndexableWorkset() {
    let items = this.allItems.filter(item => item.expected_indexable);

    if (args['pages-only']) {
      items = items.filter(item => !ARTICLE_SITEMAP_KINDS.has(item.kind));
    }

    if (SAMPLE_SIZE > 0 && items.length > SAMPLE_SIZE) {
      const mustInclude = items.filter(item =>
        ['page', 'pair_hub', 'compare_hub', 'compare_detail', 'methodology_index', 'topic_hub'].includes(item.kind) ||
        item.url === '/' ||
        item.url === '/learn/' ||
        item.url === '/compare/en/' ||
        item.url === '/tools/name-day-finder/'
      );
      const remaining = items.filter(item => !mustInclude.includes(item));
      items = [...mustInclude, ...sampleItems(remaining, Math.max(SAMPLE_SIZE - mustInclude.length, 0))];
    }

    return unique(items);
  }

  async run() {
    const indexableItems = this.buildIndexableWorkset();
    const excludedItems = this.allItems.filter(item => !item.expected_indexable);

    console.log(`\n=== SEO AUDIT: ${this.baseUrl} ===`);
    console.log(`Preview mode: ${IS_PREVIEW ? 'yes' : 'no'}`);
    console.log(`Indexable pages to check: ${indexableItems.length}`);
    console.log(`Excluded pages to check: ${excludedItems.length}`);

    await this.auditSitemaps();
    console.log('\n=== SITEMAP URL STATUS SAMPLING ===');
    await this.auditSitemapUrlStatuses('/sitemap-pages.xml', SITEMAP_SAMPLE_SIZE);
    await this.auditSitemapUrlStatuses('/sitemap-articles.xml', SITEMAP_SAMPLE_SIZE);

    console.log('\n=== INDEXABLE PAGE AUDIT ===');
    const batchSize = 10;
    for (let i = 0; i < indexableItems.length; i += batchSize) {
      const batch = indexableItems.slice(i, i + batchSize);
      await Promise.all(batch.map(item => this.auditIndexablePage(item)));
      if ((i + batchSize) % 100 === 0 || i + batchSize >= indexableItems.length) {
        console.log(`  Checked ${Math.min(i + batchSize, indexableItems.length)}/${indexableItems.length}...`);
      }
    }

    console.log('\n=== EXCLUDED PAGE AUDIT ===');
    for (const item of excludedItems) {
      await this.auditExcludedPage(item);
    }

    return {
      audit_timestamp: new Date().toISOString(),
      base_url: this.baseUrl,
      is_preview: IS_PREVIEW,
      inventory_summary: this.inventoryData.summary,
      checked: this.checkedCount,
      passed: this.passedCount,
      failed: this.failures.length,
      warnings: this.warnings.length,
      pass: this.failures.length === 0,
      error_counts: this.errorCounts,
      failures: this.failures,
      warnings_list: this.warnings,
    };
  }
}

async function main() {
  if (!args.inventory) {
    console.error('Usage: node scripts/seo/audit-deployed-seo.mjs --base-url URL --inventory PATH [--sample-size N] [--pages-only]');
    process.exit(1);
  }

  const inventoryPath = resolve(ROOT, args.inventory);
  const inventoryData = JSON.parse(readFileSync(inventoryPath, 'utf-8'));
  const auditor = new SEOAuditor(BASE_URL, inventoryData);
  const report = await auditor.run();

  console.log('\n==============================');
  console.log(`AUDIT RESULT: ${report.pass ? 'PASS' : 'FAIL'}`);
  console.log('==============================');
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
    for (const failure of report.failures.slice(0, 30)) {
      console.log(`  [${failure.errorType}] ${failure.url}: ${failure.message}`);
    }
    if (report.failures.length > 30) {
      console.log(`  ... and ${report.failures.length - 30} more`);
    }
  }

  const outputDir = resolve(ROOT, args['output-dir'] || DEFAULT_OUTPUT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const suffix = IS_PREVIEW ? 'preview' : 'production';
  const outputPath = args.output
    ? resolve(ROOT, args.output)
    : resolve(outputDir, `audit-report-${suffix}.json`);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to: ${outputPath}`);

  process.exit(report.pass ? 0 : 1);
}

main().catch(error => {
  console.error('FATAL:', error.message || error);
  process.exit(1);
});
