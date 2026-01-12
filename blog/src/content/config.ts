import { defineCollection, z } from 'astro:content';

// Supported language codes (matches main app's SUPPORTED_LANGUAGE_CODES)
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'it', 'pt', 'ro', 'de', 'nl', 'sv', 'no', 'da', 'pl', 'cs', 'ru', 'uk', 'el', 'hu', 'tr'] as const;

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['phrases', 'vocabulary', 'grammar', 'culture', 'situations']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    readTime: z.number(),
    image: z.string().optional(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    // Multi-language support: language is derived from directory (e.g., articles/pl/)
    // but can be explicitly set in frontmatter if needed
    language: z.enum(SUPPORTED_LANGUAGES).optional().default('pl'),
    // Native language for the article (what language explanations are in)
    nativeLanguage: z.enum(SUPPORTED_LANGUAGES).optional().default('en'),
  }),
});

export const collections = { articles };
