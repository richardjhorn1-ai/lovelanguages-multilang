/**
 * Admin-only endpoint for generating SEO-optimized Polish learning blog articles.
 *
 * POST /api/admin/generate-article
 * Body: { topic: string, category?: string, difficulty?: string }
 * Returns: { slug, frontmatter, content, imagePrompt, validation }
 *
 * Requires: Admin authentication (is_admin flag in profiles)
 */

import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAdminAuth,
  createServiceClient
} from '@/utils/api-middleware';
import {
  generateArticleContent,
  validateArticle,
  buildMdxContent,
  type GeneratedArticle,
  type ValidationResult
} from '@/utils/article-generator';

interface ApiResponse extends GeneratedArticle {
  validation: ValidationResult;
  mdxContent: string;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Admin authentication
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
    }
    if (!admin.isAdmin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403, headers: corsHeaders });
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400, headers: corsHeaders });
    }

    const { topic, category, difficulty } = body || {};
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return NextResponse.json({ error: 'Topic is required (minimum 3 characters)' }, { status: 400, headers: corsHeaders });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500, headers: corsHeaders });
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

    return NextResponse.json(response, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[generate-article] Error:', error);

    // Handle specific errors
    if (error.status === 429) {
      return NextResponse.json({ error: 'Rate limited. Please try again later.' }, { status: 429, headers: getCorsHeaders(request) });
    }
    if (error.message?.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500, headers: getCorsHeaders(request) });
    }
    if (error.message?.includes('JSON')) {
      return NextResponse.json({
        error: 'Failed to parse AI response. Try again.',
        details: error.message
      }, { status: 502, headers: getCorsHeaders(request) });
    }

    return NextResponse.json({
      error: 'Failed to generate article. Please try again.',
      details: error.message
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}
