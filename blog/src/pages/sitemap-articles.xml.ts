import type { APIRoute } from 'astro';
import { getAllSlugs } from '../lib/blog-api';

export const GET: APIRoute = async () => {
  const slugs = await getAllSlugs();

  const urls = slugs.map(({ native_lang, target_lang, slug, updated_at }) => {
    const lastmod = updated_at ? `\n    <lastmod>${new Date(updated_at).toISOString().split('T')[0]}</lastmod>` : '';
    return `  <url>
    <loc>https://www.lovelanguages.io/learn/${native_lang}/${target_lang}/${slug}/</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }
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
