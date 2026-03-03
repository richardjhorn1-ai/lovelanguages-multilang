interface Article {
  slug: string;
  data: {
    title: string;
    description: string;
    date: string;
    category?: string;
    difficulty?: string;
    readTime?: number;
  };
}

interface Props {
  langCode: string;
  langName: string;
  nativeLang?: string;
  maxPerCategory?: number;
  articles: Article[];
}

// Category display names and order
const categoryInfo: Record<string, { label: string; emoji: string; priority: number }> = {
  'phrases': { label: 'Essential Phrases', emoji: '\u{1F4AC}', priority: 1 },
  'romance': { label: 'Romantic Expressions', emoji: '\u{1F495}', priority: 2 },
  'vocabulary': { label: 'Vocabulary', emoji: '\u{1F4DA}', priority: 3 },
  'grammar': { label: 'Grammar Guides', emoji: '\u{1F4D6}', priority: 4 },
  'culture': { label: 'Culture & Traditions', emoji: '\u{1F3AD}', priority: 5 },
  'pronunciation': { label: 'Pronunciation', emoji: '\u{1F5E3}\u{FE0F}', priority: 6 },
  'learning': { label: 'Learning Tips', emoji: '\u{1F3AF}', priority: 7 },
};

// Helper to build article URL
const getArticleUrl = (article: Article) => {
  const parts = article.slug.split('/');
  // Output: /learn/nativeLang/targetLang/article-slug/
  return `/learn/${parts[0]}/${parts[1]}/${parts[2]}/`;
};

// Helper to truncate description
const truncate = (str: string, len: number) => {
  if (str.length <= len) return str;
  return str.substring(0, len).trim() + '...';
};

export default function ArticlesGrid({ langCode, langName, nativeLang = 'en', maxPerCategory = 4, articles }: Props) {
  // Filter articles for this target language
  const languageArticles = articles.filter(article => {
    const parts = article.slug.split('/');
    // slug format: nativeLang/targetLang/article-slug
    return parts[1] === langCode && parts[0] === nativeLang;
  });

  // Group articles by category
  const articlesByCategory = languageArticles.reduce((acc, article) => {
    const category = article.data.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // Sort articles within each category by date (newest first)
  Object.keys(articlesByCategory).forEach(category => {
    articlesByCategory[category].sort((a, b) =>
      new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
    );
  });

  // Get sorted categories
  const sortedCategories = Object.keys(articlesByCategory)
    .sort((a, b) => {
      const priorityA = categoryInfo[a]?.priority || 99;
      const priorityB = categoryInfo[b]?.priority || 99;
      return priorityA - priorityB;
    });

  const totalArticles = languageArticles.length;

  if (totalArticles === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-2">
            {langName} Learning Guides
          </h2>
          <p className="text-gray-600">
            Browse <span className="font-semibold text-accent">{totalArticles}</span> in-depth articles to master {langName}
          </p>
        </div>

        <div className="space-y-12">
          {sortedCategories.map(category => {
            const catArticles = articlesByCategory[category];
            const info = categoryInfo[category] || { label: category.charAt(0).toUpperCase() + category.slice(1), emoji: '\u{1F4C4}', priority: 99 };
            const displayArticles = catArticles.slice(0, maxPerCategory);
            const hasMore = catArticles.length > maxPerCategory;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>{info.emoji}</span>
                    {info.label}
                    <span className="text-sm font-normal text-gray-500">({catArticles.length})</span>
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayArticles.map(article => (
                    <a
                      key={article.slug}
                      href={getArticleUrl(article)}
                      className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-accent hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 group-hover:text-accent transition-colors text-sm leading-tight mb-2 line-clamp-2">
                            {article.data.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {truncate(article.data.description, 80)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {article.data.difficulty && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                                {article.data.difficulty}
                              </span>
                            )}
                            {article.data.readTime && (
                              <span>{article.data.readTime} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-4 text-center">
                    <a
                      href={`/learn/${nativeLang}/${langCode}/`}
                      className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium"
                    >
                      View all {catArticles.length} {info.label.toLowerCase()} articles
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* See All Articles CTA */}
        <div className="mt-12 text-center">
          <a
            href={`/learn/${nativeLang}/${langCode}/`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all"
          >
            Browse All {totalArticles} {langName} Articles
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
