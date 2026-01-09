/**
 * Admin-only endpoint for generating SEO-optimized Polish learning blog articles.
 *
 * POST /api/admin/generate-article
 * Body: { topic: string, category?: string, difficulty?: string }
 * Returns: { slug, frontmatter, content, imagePrompt, validation }
 *
 * Requires: Admin authentication (is_admin flag in profiles)
 */

import {
  setCorsHeaders,
  verifyAdminAuth,
  createServiceClient
} from '../../utils/api-middleware.js';
import {
  generateArticleContent,
  validateArticle,
  buildMdxContent,
  type GeneratedArticle,
  type ValidationResult
} from '../../utils/article-generator.js';

interface ApiResponse extends GeneratedArticle {
  validation: ValidationResult;
  mdxContent: string;
}

export default async function handler(req: any, res: any) {
  // CORS handling
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    if (!admin.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    // Validate request body
    const { topic, category, difficulty } = req.body || {};
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({ error: 'Topic is required (minimum 3 characters)' });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    // Generate article using shared module
    const article = await generateArticleContent({
      topic: topic.trim(),
      category,
      difficulty
    }, apiKey);

    // Validate the generated content
    const validation = validateArticle(article);

    // Build MDX content
    const mdxContent = buildMdxContent(article);

    // Track generation in database (non-blocking)
    const supabase = createServiceClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('article_generations').insert({
            slug: article.slug,
            topic: topic.trim(),
            category: article.frontmatter.category,
            difficulty: article.frontmatter.difficulty,
            generated_by: admin.userId,
            word_count: article.content.split(/\s+/).length,
            has_image: false
          });
        } catch (dbError: any) {
          console.error('[generate-article] Failed to track generation:', dbError.message);
        }
      })();
    }

    // Return response
    const response: ApiResponse = {
      ...article,
      validation,
      mdxContent
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('[generate-article] Error:', error);

    // Handle specific errors
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limited. Please try again later.' });
    }
    if (error.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    if (error.message?.includes('JSON')) {
      return res.status(502).json({
        error: 'Failed to parse AI response. Try again.',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to generate article. Please try again.',
      details: error.message
    });
  }
}
