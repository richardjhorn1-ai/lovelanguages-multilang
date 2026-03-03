import { getLanguagePairs, getNativeLanguages } from '@/lib/blog-api';

const VALID_LANGS = ['en','es','fr','de','it','pt','pl','nl','sv','no','da','cs','ru','uk','el','hu','tr','ro'];

export async function GET() {
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/learn/', priority: '1.0', changefreq: 'daily' },
    { loc: '/tools/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/tools/name-day-finder/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/dictionary/', priority: '0.6', changefreq: 'monthly' },
    { loc: '/support/', priority: '0.5', changefreq: 'monthly' },
  ];

  const nativeLangs = await getNativeLanguages();
  const langPairs = await getLanguagePairs();

  for (const lang of nativeLangs) {
    if (VALID_LANGS.includes(lang)) {
      staticPages.push({ loc: `/learn/${lang}/`, priority: '0.9', changefreq: 'daily' });
      staticPages.push({ loc: `/learn/${lang}/couples-language-learning/`, priority: '0.7', changefreq: 'monthly' });
      staticPages.push({ loc: `/compare/${lang}/`, priority: '0.75', changefreq: 'monthly' });
      staticPages.push({ loc: `/compare/${lang}/love-languages-vs-duolingo/`, priority: '0.75', changefreq: 'monthly' });
      staticPages.push({ loc: `/compare/${lang}/love-languages-vs-babbel/`, priority: '0.75', changefreq: 'monthly' });
    }
  }

  for (const pair of langPairs) {
    staticPages.push({ loc: `/learn/${pair.native_lang}/${pair.target_lang}/`, priority: '0.85', changefreq: 'weekly' });
  }

  const urls = staticPages.map(p =>
    `  <url>
    <loc>https://www.lovelanguages.io${p.loc}</loc>
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
}
