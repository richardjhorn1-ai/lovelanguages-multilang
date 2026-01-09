import { defineCollection, z } from 'astro:content';

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
  }),
});

export const collections = { articles };
