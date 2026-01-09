import { ArticleMeta } from '../components/blog/ArticleCard';

// Article registry - add your articles here
// The slug must match the MDX filename (without .mdx extension)

export const articles: ArticleMeta[] = [// Example article - replace with your generated content
  {
    slug: 'how-to-say-i-love-you-in-polish',
    title: 'How to Say "I Love You" in Polish: A Complete Guide',
    description: 'Learn all the ways to express love in Polish, from casual "kocham cię" to deeply romantic phrases that will melt your partner\'s heart.',
    category: 'phrases',
    difficulty: 'beginner',
    readTime: 5,
    image: '/blog/i-love-you-polish.jpg',
    date: '2026-01-09',
  },
  // Add more articles as you generate them:
  // {
  //   slug: 'polish-pet-names-for-couples',
  //   title: '25 Adorable Polish Pet Names for Your Partner',
  //   description: 'Sweet Polish terms of endearment to call your boyfriend or girlfriend.',
  //   category: 'vocabulary',
  //   difficulty: 'beginner',
  //   readTime: 4,
  //   date: '2026-01-09',
  // },
  {
    slug: 'polish-pet-names',
    title: '25 Adorable Polish Pet Names for Your Partner',
    description: 'Learn the sweetest Polish terms of endearment to call your boyfriend, girlfriend, or spouse. From classic kochanie to playful misiaczek.',
    category: 'vocabulary',
    difficulty: 'beginner',
    readTime: 6,
    date: '2026-01-09',
  }
];

// Helper to get article by slug
export function getArticleBySlug(slug: string): ArticleMeta | undefined {
  return articles.find((a) => a.slug === slug);
}

// Helper to get articles by category
export function getArticlesByCategory(category: ArticleMeta['category']): ArticleMeta[] {
  return articles.filter((a) => a.category === category);
}

// Helper to get related articles (same category, different slug)
export function getRelatedArticles(slug: string, limit = 3): ArticleMeta[] {
  const article = getArticleBySlug(slug);
  if (!article) return [];

  return articles
    .filter((a) => a.category === article.category && a.slug !== slug)
    .slice(0, limit);
}
