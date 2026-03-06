import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticlesByLangPair, getArticleCountsByTargetLang, type BlogArticleSummary } from '@/lib/blog-api';
import { canonicalUrl } from '@/lib/blog-urls';
import { getUITranslations, insertLanguage } from '@blog-data/ui-translations';
import { LANGUAGES, getLanguageForDisplay, SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';

export const revalidate = 86400;

const VALID_LANGS = ['en','es','fr','de','it','pt','pl','nl','ro','ru','tr','uk','sv','no','da','cs','el','hu'];

// Pre-generate top language pair hub pages at build time
export function generateStaticParams() {
  return [
    { nativeLang: 'en', targetLang: 'pl' },
    { nativeLang: 'en', targetLang: 'es' },
    { nativeLang: 'en', targetLang: 'fr' },
    { nativeLang: 'en', targetLang: 'de' },
    { nativeLang: 'en', targetLang: 'it' },
    { nativeLang: 'en', targetLang: 'pt' },
    { nativeLang: 'en', targetLang: 'ru' },
    { nativeLang: 'en', targetLang: 'nl' },
    { nativeLang: 'en', targetLang: 'tr' },
    { nativeLang: 'en', targetLang: 'uk' },
    { nativeLang: 'pl', targetLang: 'en' },
    { nativeLang: 'es', targetLang: 'en' },
    { nativeLang: 'fr', targetLang: 'en' },
    { nativeLang: 'de', targetLang: 'en' },
  ];
}

type PageProps = {
  params: Promise<{ nativeLang: string; targetLang: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nativeLang, targetLang } = await params;

  if (!VALID_LANGS.includes(nativeLang) || !VALID_LANGS.includes(targetLang) || nativeLang === targetLang) {
    return {};
  }

  const targetInfo = getLanguageForDisplay(targetLang, nativeLang);
  const text = getUITranslations(nativeLang);
  const pageTitle = `${insertLanguage(text.learnTogether, targetInfo.name)} - Love Languages`;
  const pageDescription = insertLanguage(text.lessonsDescription, targetInfo.name);
  const pageCanonical = canonicalUrl(`/learn/${nativeLang}/${targetLang}`);

  const hreflangAlternates: Record<string, string> = {};
  for (const lang of SUPPORTED_NATIVE_LANGS) {
    if (lang !== targetLang) {
      hreflangAlternates[lang] = canonicalUrl(`/learn/${lang}/${targetLang}`);
    }
  }
  hreflangAlternates['x-default'] = nativeLang === 'en'
    ? pageCanonical
    : canonicalUrl(`/learn/en/${targetLang}`);

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: pageCanonical,
      languages: hreflangAlternates,
    },
  };
}

/* ──────────────────────────────────────────────
   Client component for category filter buttons
   ────────────────────────────────────────────── */

function ArticleCategoryFilterClient({
  categories,
  articles,
  nativeLanguageCode,
  targetLanguageCode,
  text,
  targetInfo,
}: {
  categories: { id: string; label: string; icon: string }[];
  articles: BlogArticleSummary[];
  nativeLanguageCode: string;
  targetLanguageCode: string;
  text: ReturnType<typeof getUITranslations>;
  targetInfo: { flag: string; name: string };
}) {
  // Since this is a server component, we render all articles statically
  // and use CSS + client JS for filtering
  return (
    <>
      {/* Filter Bar */}
      <div className="sticky top-14 z-40 blog-filter-bar">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" id="filter-bar">
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                type="button"
                data-category={cat.id}
                className={`filter-btn px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  i === 0
                    ? 'bg-[#FF6B6B] text-white active'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Article Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="article-grid">
            {articles.map((article) => (
              <div key={article.id} className="article-item" data-category={article.category}>
                <a
                  href={`/learn/${nativeLanguageCode}/${targetLanguageCode}/${article.slug}/`}
                  className="group block h-full"
                >
                  <div className="blog-hub-card p-5 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      {article.category && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: '#FFF0F3', color: '#FF6B6B' }}
                        >
                          {article.category}
                        </span>
                      )}
                      {article.difficulty && (
                        <span className="text-xs text-gray-400">{article.difficulty}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-[#292F36] group-hover:text-[#FF6B6B] transition-colors mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                        {article.description}
                      </p>
                    )}
                    {article.read_time && (
                      <p className="text-xs text-gray-400 mt-3">
                        {article.read_time} min read
                      </p>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{targetInfo.flag}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {insertLanguage(text.comingSoon, targetInfo.name)}
            </h2>
            <p className="text-gray-600 mb-6">
              {insertLanguage(text.comingSoonDescription, targetInfo.name)}
            </p>
            <a
              href={`/learn/${nativeLanguageCode}/`}
              className="inline-block bg-[#FF6B6B] text-white font-bold px-6 py-3 rounded-full hover:bg-[#FF6B6B]/90 transition-colors"
            >
              {text.browseAllLanguages}
            </a>
          </div>
        )}
      </main>

      {/* Client-side filtering script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var filterButtons = document.querySelectorAll('.filter-btn');
              var articles = document.querySelectorAll('.article-item');

              filterButtons.forEach(function(btn) {
                btn.addEventListener('click', function() {
                  var category = btn.getAttribute('data-category');

                  filterButtons.forEach(function(b) {
                    b.classList.remove('bg-[#FF6B6B]', 'text-white', 'active');
                    b.classList.add('bg-gray-100', 'text-gray-600');
                  });
                  btn.classList.remove('bg-gray-100', 'text-gray-600');
                  btn.classList.add('bg-[#FF6B6B]', 'text-white', 'active');

                  articles.forEach(function(article) {
                    var articleCategory = article.getAttribute('data-category');
                    if (category === 'all' || articleCategory === category) {
                      article.style.display = '';
                    } else {
                      article.style.display = 'none';
                    }
                  });
                });
              });
            });
          `,
        }}
      />
    </>
  );
}

export default async function TargetLangHubPage({ params }: PageProps) {
  const { nativeLang, targetLang } = await params;
  const nativeLanguageCode = nativeLang || 'en';
  const targetLanguageCode = targetLang || 'pl';

  // Validate languages
  if (
    !VALID_LANGS.includes(nativeLanguageCode) ||
    !VALID_LANGS.includes(targetLanguageCode) ||
    nativeLanguageCode === targetLanguageCode
  ) {
    notFound();
  }

  if (!LANGUAGES[nativeLanguageCode] || !LANGUAGES[targetLanguageCode]) {
    notFound();
  }

  // Get language info with names translated to user's native language
  const targetInfo = getLanguageForDisplay(targetLanguageCode, nativeLanguageCode);

  // Build LANGUAGE_INFO for language selector
  const LANGUAGE_INFO = Object.fromEntries(
    Object.keys(LANGUAGES).map(code => [code, getLanguageForDisplay(code, nativeLanguageCode)])
  );

  // Get translations for native language
  const text = getUITranslations(nativeLanguageCode);

  // Fetch articles + language counts in parallel (was sequential)
  const [articles, languageCounts] = await Promise.all([
    getArticlesByLangPair(nativeLanguageCode, targetLanguageCode, { limit: 100 }),
    getArticleCountsByTargetLang(nativeLanguageCode),
  ]);

  // Category filters with translated labels
  const categories = [
    { id: 'all', label: text.categoryAll, icon: '\u{1F4D6}' },
    { id: 'phrases', label: text.categoryPhrases, icon: '\u{1F4AC}' },
    { id: 'vocabulary', label: text.categoryVocabulary, icon: '\u{1F4DA}' },
    { id: 'grammar', label: text.categoryGrammar, icon: '\u{1F4DD}' },
    { id: 'culture', label: text.categoryCulture, icon: targetInfo.flag },
    { id: 'situations', label: text.categorySituations, icon: '\u{1F3AD}' },
  ];

  const pageCanonical = canonicalUrl(`/learn/${nativeLanguageCode}/${targetLanguageCode}`);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Love Languages - ${insertLanguage(text.learnTogether, targetInfo.name)}`,
    description: insertLanguage(text.lessonsDescription, targetInfo.name),
    url: pageCanonical,
    inLanguage: nativeLanguageCode,
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Language Selector */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.keys(LANGUAGES)
                .filter(code => code !== nativeLanguageCode)
                .sort((a, b) => (languageCounts[b] || 0) - (languageCounts[a] || 0))
                .slice(0, 12)
                .map(code => {
                  const langInfo = LANGUAGE_INFO[code];
                  const isActive = code === targetLanguageCode;
                  return (
                    <a
                      key={code}
                      href={`/learn/${nativeLanguageCode}/${code}/`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#FF6B6B] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{langInfo.flag}</span>
                      <span>{langInfo.name}</span>
                      {(languageCounts[code] || 0) > 0 && (
                        <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                          ({languageCounts[code]})
                        </span>
                      )}
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <header className="bg-gradient-to-b from-[#FF6B6B]/10 to-white">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black font-header text-gray-900 mb-2">
              <span className="text-4xl md:text-5xl">{targetInfo.flag}</span>{' '}
              {insertLanguage(text.learnTogether, targetInfo.name)}
            </h1>
            <p className="text-lg text-gray-600">
              {insertLanguage(text.lessonsDescription, targetInfo.name)}
            </p>
          </div>
        </div>
      </header>

      <ArticleCategoryFilterClient
        categories={categories}
        articles={articles}
        nativeLanguageCode={nativeLanguageCode}
        targetLanguageCode={targetLanguageCode}
        text={text}
        targetInfo={targetInfo}
      />

      {/* Main CTA */}
      <section className="bg-gradient-to-r from-[#FF6B6B] to-pink-500 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold font-header mb-4">
            {insertLanguage(text.readyToStart, targetInfo.name)}
          </h2>
          <p className="text-white/90 mb-8">
            {insertLanguage(text.joinCouples, targetInfo.name)}
          </p>
          <a
            href="/"
            className="inline-block bg-white text-[#FF6B6B] font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg"
          >
            {text.startJourney}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="blog-footer py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold font-header text-[#FF6B6B] mb-4"
          >
            <img src="/favicon.svg" alt="Love Languages" className="w-8 h-8" />
            Love Languages
          </a>
          <p className="text-gray-600 mb-6">{text.footerTagline}</p>
          <nav className="flex justify-center gap-6 text-sm text-gray-500">
            <a href={`/learn/${nativeLanguageCode}/`} className="hover:text-[#FF6B6B]">
              {text.blog}
            </a>
            <a href="/tools/" className="hover:text-[#FF6B6B]">
              {text.tools}
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
