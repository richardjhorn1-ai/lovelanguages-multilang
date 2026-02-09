import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.lovelanguages.io/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.lovelanguages.io/sitemap-articles.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.lovelanguages.io/sitemap-images.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
};
