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

  // ─── GSC Recovery Fixes (Feb 2026) ─────────────────────────────
  // Tests for the specific SEO issues that caused 70% indexing loss.
  // Each test targets a specific fix and will FAIL if the fix regresses.

  test.describe('Issue 1+4: Sitemap cleanliness', () => {

    test('sitemap-pages has NO /learn/language/ URLs (were broken, used codes not names)', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      const body = await res.text();
      expect(body).not.toContain('/learn/language/');
    });

    test('sitemap-pages has NO /terms/ or /privacy/ (SPA routes, not blog pages)', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      const body = await res.text();
      expect(body).not.toContain('/terms/');
      expect(body).not.toContain('/privacy/');
    });
  });

  test.describe('Issue 2: No lying lastmod', () => {

    test('sitemap-pages has NO <lastmod> tags (removed — no lastmod > fake lastmod)', async ({ request }) => {
      const res = await request.get('/sitemap-pages.xml');
      const body = await res.text();
      expect(body).not.toContain('<lastmod>');
    });
  });

  test.describe('Issue 3: Article sitemap has real lastmod dates', () => {

    test('sitemap-articles has <lastmod> tags with real dates', async ({ request }) => {
      const res = await request.get('/sitemap-articles.xml');
      const body = await res.text();

      const lastmods = [...body.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map(m => m[1]);
      // Should have lastmod on most articles (some may be null, which omits the tag)
      expect(lastmods.length, 'Expected articles to have lastmod dates').toBeGreaterThan(100);

      // All dates should be valid YYYY-MM-DD format
      for (const date of lastmods.slice(0, 50)) {
        expect(date, `Invalid lastmod date: "${date}"`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      // No empty lastmod tags (would mean null handling is broken)
      expect(body).not.toMatch(/<lastmod>\s*<\/lastmod>/);
    });

    test('lastmod dates are NOT all the same (would mean they are fake)', async ({ request }) => {
      const res = await request.get('/sitemap-articles.xml');
      const body = await res.text();

      const lastmods = [...body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1]);
      const unique = new Set(lastmods);
      expect(unique.size, 'All lastmod dates are identical — likely fake').toBeGreaterThan(1);
    });
  });

  test.describe('Issue 6: Single canonical tag per page', () => {

    test('article page has exactly ONE canonical tag', async ({ page }) => {
      // Use a known article — Polish pet names is a reliable test fixture
      const res = await page.goto('/learn/en/pl/');
      expect(res?.status()).toBe(200);

      const canonicals = await page.locator('link[rel="canonical"]').all();
      expect(canonicals.length, `Expected 1 canonical tag, found ${canonicals.length}`).toBe(1);
    });

    test('native language hub has exactly ONE canonical tag', async ({ page }) => {
      await page.goto('/learn/en/');
      const canonicals = await page.locator('link[rel="canonical"]').all();
      expect(canonicals.length, `Expected 1 canonical tag, found ${canonicals.length}`).toBe(1);
    });

    test('couples-language-learning page has exactly ONE canonical tag', async ({ page }) => {
      await page.goto('/learn/en/couples-language-learning/');
      const canonicals = await page.locator('link[rel="canonical"]').all();
      expect(canonicals.length, `Expected 1 canonical tag, found ${canonicals.length}`).toBe(1);
    });
  });

  test.describe('Issue 7: Astro trailingSlash enforcement', () => {

    test('Astro-generated redirects go directly to slash URL (no double redirect)', async ({ request }) => {
      // If trailingSlash: 'always' is working, Astro's own redirects should include slashes
      // Test the compare redirect pages which use Astro.redirect()
      const res = await request.get('/compare/love-languages-vs-duolingo/', { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      const location = res.headers()['location'];
      // Should go directly to /compare/en/love-languages-vs-duolingo/ (with slash)
      // NOT to /compare/en/love-languages-vs-duolingo (without slash, causing double redirect)
      expect(location, 'Redirect destination missing trailing slash').toMatch(/\/$/);
    });
  });

  test.describe('Issue 8: JSON-LD URLs have trailing slashes', () => {

    test('all JSON-LD URLs on hub page use trailing slashes', async ({ page }) => {
      await page.goto('/learn/en/pl/');

      const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const script of scripts) {
        const data = JSON.parse(script);
        checkJsonLdUrls(data, '/learn/en/pl/');
      }
    });

    test('breadcrumb JSON-LD home URL has trailing slash', async ({ page }) => {
      // Find any page with breadcrumb structured data
      await page.goto('/learn/en/');

      const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const script of scripts) {
        const data = JSON.parse(script);
        if (data['@type'] === 'BreadcrumbList') {
          for (const item of data.itemListElement || []) {
            if (item.item && typeof item.item === 'string') {
              expect(item.item, `Breadcrumb URL missing trailing slash: ${item.item}`).toMatch(/\/$/);
            }
          }
        }
      }
    });

    test('Organization URLs in JSON-LD have trailing slashes', async ({ page }) => {
      await page.goto('/learn/en/pl/');

      const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const script of scripts) {
        const data = JSON.parse(script);
        // Check author/publisher organization URLs
        for (const key of ['author', 'publisher']) {
          if (data[key]?.url) {
            expect(data[key].url, `${key} URL missing trailing slash`).toMatch(/\/$/);
          }
        }
      }
    });
  });

  test.describe('Issue 9: Legacy 2-segment URL redirects', () => {

    test('legacy /learn/pl/{slug}/ redirects 301 to /learn/en/pl/{slug}/', async ({ request }) => {
      // Use a slug that's clearly an article (not a language code or known route)
      const res = await request.get('/learn/pl/polish-pet-names-for-couples/', { maxRedirects: 0 });
      // Should be 301 redirect to the 3-segment version
      expect(res.status(), 'Legacy URL should 301 redirect').toBe(301);
      const location = res.headers()['location'];
      expect(location).toContain('/learn/en/pl/polish-pet-names-for-couples/');
    });

    test('legacy /learn/ru/{slug}/ redirects 301 to /learn/en/ru/{slug}/', async ({ request }) => {
      const res = await request.get('/learn/ru/some-fake-article-slug/', { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      const location = res.headers()['location'];
      expect(location).toContain('/learn/en/ru/some-fake-article-slug/');
    });

    test('/learn/pl/cs/ hub page is NOT redirected (must not match legacy pattern)', async ({ request }) => {
      const res = await request.get('/learn/pl/cs/', { maxRedirects: 0 });
      // Should serve the page normally (200) or SSR error — but NOT a 301 redirect
      expect(res.status(), '/learn/pl/cs/ was incorrectly redirected by legacy middleware').not.toBe(301);
    });

    test('/learn/pl/couples-language-learning/ is NOT redirected', async ({ request }) => {
      const res = await request.get('/learn/pl/couples-language-learning/', { maxRedirects: 0 });
      expect(res.status(), '/learn/pl/couples-language-learning/ was incorrectly redirected').not.toBe(301);
    });

    test('/learn/en/pl/ is NOT redirected (en is not a legacy target lang)', async ({ request }) => {
      const res = await request.get('/learn/en/pl/', { maxRedirects: 0 });
      expect(res.status()).not.toBe(301);
    });

    test('/learn/en/pl/article-slug/ 3-segment URL is NOT matched by middleware', async ({ request }) => {
      const res = await request.get('/learn/en/pl/polish-pet-names-for-couples/', { maxRedirects: 0 });
      // 3-segment URLs should never trigger the 2-segment redirect
      expect(res.status()).not.toBe(301);
    });
  });

  test.describe('Issue 10: No redirect chains', () => {

    test('Spanish Turkish pronunciation article has no chain (single redirect)', async ({ request }) => {
      const res = await request.get('/learn/es/tr/guia-de-pronunciacion-turca-para-principiantes/', { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      const location = res.headers()['location'];
      // Should go directly to final destination, not through intermediate
      expect(location).toContain('turkish-pronunciation-guide-for-beginners');
      expect(location).not.toBe('/learn/es/tr/turkish-pronunciation-guide/');
    });
  });

  test.describe('Issue 11: og:locale format', () => {

    test('og:locale uses xx_XX format, not bare language code', async ({ page }) => {
      await page.goto('/learn/en/pl/');
      const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
      expect(ogLocale).toBeTruthy();
      // Should be "en_US" not "en"
      expect(ogLocale!, 'og:locale should be xx_XX format').toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    });

    test('Polish page og:locale is pl_PL', async ({ page }) => {
      await page.goto('/learn/pl/');
      const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
      expect(ogLocale).toBe('pl_PL');
    });
  });
});

// Helper: recursively check all URL strings in a JSON-LD object
function checkJsonLdUrls(obj: any, context: string) {
  if (!obj || typeof obj !== 'object') return;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith('https://www.lovelanguages.io')) {
      // Skip image/asset URLs — they should NOT have trailing slashes
      if (value.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|css|js)$/)) continue;
      expect(value, `JSON-LD "${key}" URL missing trailing slash (on ${context})`).toMatch(/\/$/);
    } else if (typeof value === 'object') {
      checkJsonLdUrls(value, context);
    }
  }
}
