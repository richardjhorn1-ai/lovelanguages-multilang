import { defineMiddleware } from 'astro:middleware';

/**
 * Middleware to add llms.txt discovery headers to all responses.
 * This helps AI agents discover the documentation index.
 * See: https://llmstxt.org
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Add llms.txt headers for AI agent discovery
  response.headers.set(
    'Link',
    '</llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"'
  );
  response.headers.set('X-Llms-Txt', '/llms.txt');

  return response;
});
