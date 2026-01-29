import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Add cache headers for SSR pages
  // s-maxage: CDN caches for 1 day
  // stale-while-revalidate: serve stale while refreshing in background
  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );
  }

  return response;
});
