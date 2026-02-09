import type { APIRoute } from 'astro';
import { getLanguagePairs, getNativeLanguages } from '../lib/blog-api';

const VALID_LANGS = ['en','es','fr','de','it','pt','pl','nl','sv','no','da','cs','ru','uk','el','hu','tr','ro'];

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().split('T')[0];

  // Static known pages
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/learn/', priority: '1.0', changefreq: 'daily' },
    { loc: '/learn/easiest-languages/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/learn/romance-languages/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/learn/slavic-languages/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/learn/couples-language-learning/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/learn/romantic-phrases/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/tools/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/tools/name-day-finder/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/dictionary/', priority: '0.6', changefreq: 'monthly' },
    { loc: '/compare/', priority: '0.75', changefreq: 'monthly' },
    { loc: '/terms/', priority: '0.3', changefreq: 'yearly' },
    { loc: '/privacy/', priority: '0.3', changefreq: 'yearly' },
  ];

  // Dynamic hub pages from Supabase data
  const nativeLangs = await getNativeLanguages();
  const langPairs = await getLanguagePairs();

  // Native language hubs
  for (const lang of nativeLangs) {
    if (VALID_LANGS.includes(lang)) {
      staticPages.push({ loc: `/learn/${lang}/`, priority: '0.9', changefreq: 'daily' });
      staticPages.push({ loc: `/learn/${lang}/couples-language-learning/`, priority: '0.7', changefreq: 'monthly' });
      // Compare pages
      staticPages.push({ loc: `/compare/${lang}/`, priority: '0.75', changefreq: 'monthly' });
      staticPages.push({ loc: `/compare/${lang}/love-languages-vs-duolingo/`, priority: '0.75', changefreq: 'monthly' });
      staticPages.push({ loc: `/compare/${lang}/love-languages-vs-babbel/`, priority: '0.75', changefreq: 'monthly' });
    }
  }

  // Language pair hubs
  for (const pair of langPairs) {
    staticPages.push({ loc: `/learn/${pair.native_lang}/${pair.target_lang}/`, priority: '0.85', changefreq: 'weekly' });
  }

  // Language info pages
  for (const lang of VALID_LANGS) {
    staticPages.push({ loc: `/learn/language/${lang}/`, priority: '0.7', changefreq: 'monthly' });
    staticPages.push({ loc: `/learn/language/${lang}/for-couples/`, priority: '0.7', changefreq: 'monthly' });
  }

  const urls = staticPages.map(p =>
    `  <url>
    <loc>https://www.lovelanguages.io${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
};
