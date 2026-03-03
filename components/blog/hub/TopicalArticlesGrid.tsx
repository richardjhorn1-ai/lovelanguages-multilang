import { LANGUAGE_HUB_DATA } from '@blog-data/language-hub-data';

interface Article {
  slug: string;
  data: {
    title: string;
    description: string;
    date: string;
    category?: string;
    readTime?: number;
  };
}

interface Props {
  /** Filter by language codes (e.g., ['es', 'fr', 'it', 'pt', 'ro'] for Romance) */
  langCodes?: string[];
  /** Filter by keywords in title (e.g., ['love', 'romantic', 'pet name']) */
  keywords?: string[];
  /** Filter by category (e.g., 'phrases', 'romance', 'grammar') */
  categories?: string[];
  /** Maximum articles to show */
  maxArticles?: number;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Native language to filter (default: 'en') */
  nativeLang?: string;
  /** Pre-fetched articles array */
  articles: Article[];
}

// Get article URL
const getArticleUrl = (slug: string) => `/learn/${slug}/`;

// Truncate helper
const truncate = (str: string, len: number) => {
  if (!str || str.length <= len) return str;
  return str.substring(0, len).trim() + '...';
};

export default function TopicalArticlesGrid({
  langCodes = [],
  keywords = [],
  categories = [],
  maxArticles = 12,
  title = 'Related Articles',
  subtitle,
  nativeLang = 'en',
  articles,
}: Props) {
  // Filter articles
  let filteredArticles = articles.filter(article => {
    const parts = article.slug.split('/');
    const articleNativeLang = parts[0];
    const articleTargetLang = parts[1];

    // Must match native language
    if (articleNativeLang !== nativeLang) return false;

    // If langCodes specified, must match one
    if (langCodes.length > 0 && !langCodes.includes(articleTargetLang)) return false;

    // If keywords specified, title must contain at least one
    if (keywords.length > 0) {
      const titleLower = article.data.title.toLowerCase();
      const descLower = (article.data.description || '').toLowerCase();
      const hasKeyword = keywords.some(kw =>
        titleLower.includes(kw.toLowerCase()) || descLower.includes(kw.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // If categories specified, must match one
    if (categories.length > 0) {
      const articleCategory = article.data.category || '';
      if (!categories.includes(articleCategory)) return false;
    }

    return true;
  });

  // Sort by date (newest first) and limit
  filteredArticles = filteredArticles
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .slice(0, maxArticles);

  const totalFound = filteredArticles.length;

  if (totalFound === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            <span className="font-semibold text-accent">{totalFound}</span> articles found
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredArticles.map(article => {
            const langCode = article.slug.split('/')[1];
            const langData = LANGUAGE_HUB_DATA[langCode];

            return (
              <a
                key={article.slug}
                href={getArticleUrl(article.slug)}
                className="group p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-accent hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{langData?.flag || '\u{1F30D}'}</span>
                  <span className="text-xs font-medium text-gray-500 uppercase">{langData?.name || 'Language'}</span>
                  {article.data.category && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full capitalize ml-auto">
                      {article.data.category}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-accent transition-colors text-sm leading-tight mb-2 line-clamp-2">
                  {article.data.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {truncate(article.data.description, 100)}
                </p>
                {article.data.readTime && (
                  <p className="text-xs text-gray-400 mt-2">{article.data.readTime} min read</p>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
