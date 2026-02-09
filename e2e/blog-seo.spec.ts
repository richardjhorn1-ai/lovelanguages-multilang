import { test, expect } from '@playwright/test';

/**
 * Blog SEO & Sitemap Integrity Tests
 *
 * These tests run against Vercel preview deployments and verify:
 * - Sitemap endpoints return correct content (not overridden by static files)
 * - All URLs use trailing slashes
 * - Hub/article pages respond correctly
 * - Redirects and error handling work
 *
 * Run: PLAYWRIGHT_BASE_URL=https://preview.vercel.app npm run test:e2e -- e2e/blog-seo.spec.ts
 */

test.describe('Blog SEO & Sitemap Integrity', () => {

  // ─── Sitemap Index ───────────────────────────────────────────────

  test.describe('Sitemap Index', () => {

    test('returns 200 with correct content type', async ({ request }) => {
      const res = await request.get('/sitemap-index.xml');
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('xml');
    });

    test('references all three child sitemaps', async ({ request }) => {
      const res = await request.get('/sitemap-index.xml');
      const body = await res.text();

      expect(body).toContain('sitemap-pages.xml');
      expect(body).toContain('sitemap-articles.xml');
      expect(body).toContain('sitemap-images.xml');
    });

    test('does NOT reference old static sitemaps', async ({ request }) => {
      const res = await request.get('/sitemap-index.xml');
      const body = await res.text();

      // These are the old files that postbuild scripts used to generate
      expect(body).not.toContain('sitemap-0.xml');
      expect(body).not.toContain('sitemap-app.xml');
    });

    test('all sitemap <loc> URLs use trailing slashes or .xml extension', async ({ request }) => {
      const res = await request.get('/sitemap-index.xml');
      const body = await res.text();

      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      expect(locs.length).toBeGreaterThan(0);

      for (const loc of locs) {
        const endsCorrectly = loc.endsWith('/') || loc.endsWith('.xml');
        expect(endsCorrectly, `URL should end with / or .xml: ${loc}`).toBe(true);
      }
    });
  });

  // ─── Pages Sitemap ──────────────────────────────────────────────

  test.describe('Pages Sitemap', () => {

    test('returns 200 with valid XML', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('xml');

      const body = await res.text();
      expect(body).toContain('<?xml');
      expect(body).toContain('<urlset');
    });

    test('contains hub page URLs', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      const body = await res.text();

      // Should have learn hub pages
      expect(body).toContain('/learn/');
    });

    test('all URLs have trailing slashes', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      const body = await res.text();

      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      expect(locs.length).toBeGreaterThan(0);

      for (const loc of locs) {
        expect(loc, `URL missing trailing slash: ${loc}`).toMatch(/\/$/);
      }
    });

    test('has substantial number of pages (>100)', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      const body = await res.text();

      const count = (body.match(/<url>/g) || []).length;
      expect(count, `Expected >100 hub pages, got ${count}`).toBeGreaterThan(100);
    });
  });

  // ─── Articles Sitemap ───────────────────────────────────────────

  test.describe('Articles Sitemap', () => {

    test('returns 200 with valid XML', async ({ request }) => {
      const res = await request.get('/sitemap-articles.xml');
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('xml');

      const body = await res.text();
      expect(body).toContain('<?xml');
      expect(body).toContain('<urlset');
    });

    test('has >10,000 article URLs (not capped)', async ({ request }) => {
      const res = await request.get('/sitemap-articles.xml');
      const body = await res.text();

      const count = (body.match(/<url>/g) || []).length;
      expect(count, `Expected >10,000 articles, got ${count}. Sitemap may be capped or broken.`).toBeGreaterThan(10000);
    });

    test('all URLs have trailing slashes', async ({ request }) => {
      const res = await request.get('/sitemap-articles.xml');
      const body = await res.text();

      // Check a sample of URLs (checking all 13k+ would be slow)
      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      const sample = locs.slice(0, 200);

      for (const loc of sample) {
        expect(loc, `URL missing trailing slash: ${loc}`).toMatch(/\/$/);
      }
    });

    test('URLs follow /learn/{native}/{target}/{slug}/ pattern', async ({ request }) => {
      const res = await request.get('/sitemap-articles.xml');
      const body = await res.text();

      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      const sample = locs.slice(0, 50);

      for (const loc of sample) {
        const path = new URL(loc).pathname;
        expect(path, `URL doesn't match article pattern: ${loc}`).toMatch(/^\/learn\/[a-z]{2}\/[a-z]{2}\/[a-z0-9-]+\/$/);
      }
    });
  });

  // ─── Images Sitemap ─────────────────────────────────────────────

  test.describe('Images Sitemap', () => {

    test('returns 200 with valid XML', async ({ request }) => {
      const res = await request.get('/sitemap-images.xml');
      expect(res.status()).toBe(200);

      const body = await res.text();
      expect(body).toContain('<?xml');
    });
  });

  // ─── URL Behavior ──────────────────────────────────────────────

  test.describe('URL Trailing Slash Enforcement', () => {

    test('non-slash hub URL redirects to trailing slash', async ({ request }) => {
      // Don't follow redirects so we can check the 308
      const res = await request.get('/learn/en/pl', { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());

      const location = res.headers()['location'];
      expect(location).toContain('/learn/en/pl/');
    });
  });

  // ─── Hub Pages ──────────────────────────────────────────────────

  test.describe('Hub Pages', () => {

    test('valid language pair hub returns 200', async ({ request }) => {
      const res = await request.get('/learn/en/pl/');
      expect(res.status()).toBe(200);
    });

    test('invalid language pair returns 404 (not 500)', async ({ request }) => {
      const res = await request.get('/learn/xx/yy/');
      expect(res.status()).toBe(404);
    });
  });

  // ─── Canonical URLs ─────────────────────────────────────────────

  test.describe('Canonical & Structured Data', () => {

    test('hub page canonical URL has trailing slash', async ({ page }) => {
      await page.goto('/learn/en/pl/');
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toBeTruthy();
      expect(canonical!).toMatch(/\/$/);
      expect(canonical!).toContain('/learn/en/pl/');
    });

    test('hub page canonical URL matches JSON-LD url', async ({ page }) => {
      await page.goto('/learn/en/pl/');

      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      const ldJson = await page.textContent('script[type="application/ld+json"]');

      if (ldJson) {
        const data = JSON.parse(ldJson);
        const jsonLdUrl = data.url || data.mainEntityOfPage;
        if (jsonLdUrl) {
          expect(jsonLdUrl).toBe(canonical);
        }
      }
    });
  });

  // ─── Cross-Sitemap Consistency ──────────────────────────────────

  test.describe('Cross-Sitemap Consistency', () => {

    test('all sitemaps use the same base domain', async ({ request }) => {
      const expectedDomain = 'https://www.lovelanguages.io';

      const [indexRes, pagesRes, articlesRes] = await Promise.all([
        request.get('/sitemap-index.xml'),
        request.get('/sitemap-pages.xml'),
        request.get('/sitemap-articles.xml'),
      ]);

      for (const [name, res] of [['index', indexRes], ['pages', pagesRes], ['articles', articlesRes]] as const) {
        const body = await res.text();
        const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

        for (const loc of locs.slice(0, 20)) {
          if (loc.startsWith('http')) {
            expect(loc, `${name} sitemap has wrong domain: ${loc}`).toMatch(new RegExp(`^${expectedDomain}`));
          }
        }
      }
    });
  });
});
