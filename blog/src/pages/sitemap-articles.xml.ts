import type { APIRoute } from 'astro';
import { getAllSlugs } from '../lib/blog-api';

export const GET: APIRoute = async () => {
  const allSlugs = await getAllSlugs();

  // Regular articles: exclude target_lang='all' (methodology) and non-canonical
  const articleUrls = allSlugs
    .filter(s => s.target_lang !== 'all' && s.is_canonical !== false)
    .map(({ native_lang, target_lang, slug, updated_at }) => {
      const lastmod = updated_at ? `\n    <lastmod>${new Date(updated_at).toISOString().split('T')[0]}</lastmod>` : '';
      return `  <url>
    <loc>https://www.lovelanguages.io/learn/${native_lang}/${target_lang}/${slug}/</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

  // Methodology articles: use their real canonical URLs
  const methodologyUrls = allSlugs
    .filter(s => s.target_lang === 'all' && s.is_canonical !== false)
    .map(({ native_lang, slug, updated_at }) => {
      const lastmod = updated_at ? `\n    <lastmod>${new Date(updated_at).toISOString().split('T')[0]}</lastmod>` : '';
      return `  <url>
    <loc>https://www.lovelanguages.io/learn/${native_lang}/couples-language-learning/methodology/${slug}/</loc>${lastmod}
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...articleUrls, ...methodologyUrls].join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
};
