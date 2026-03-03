import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseBlog } from '@/lib/supabase-blog';
import { canonicalUrl } from '@/lib/blog-urls';
import { SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ nativeLang: string; slug: string }>;
};

// Breadcrumb labels per language
const breadcrumbLabels: Record<string, { home: string; couples: string; methodology: string }> = {
  en: { home: 'Learn', couples: 'Couples Language Learning', methodology: 'Methodology' },
  es: { home: 'Aprender', couples: 'Aprendizaje en Pareja', methodology: 'Metodologia' },
  fr: { home: 'Apprendre', couples: 'Apprentissage en Couple', methodology: 'Methodologie' },
  de: { home: 'Lernen', couples: 'Paar-Sprachlernen', methodology: 'Methodik' },
  it: { home: 'Impara', couples: 'Apprendimento di Coppia', methodology: 'Metodologia' },
  pt: { home: 'Aprender', couples: 'Aprendizado para Casais', methodology: 'Metodologia' },
  pl: { home: 'Nauka', couples: 'Nauka dla Par', methodology: 'Metodologia' },
  ru: { home: 'Uchit', couples: 'Obuchenie dlya Par', methodology: 'Metodologiya' },
  uk: { home: 'Vchyty', couples: 'Navchannya dlya Par', methodology: 'Metodologiya' },
  nl: { home: 'Leren', couples: 'Taal Leren voor Koppels', methodology: 'Methodologie' },
  sv: { home: 'Lar dig', couples: 'Pars Sprakinlarning', methodology: 'Metodik' },
  no: { home: 'Ler', couples: 'Parspraklering', methodology: 'Metodikk' },
  da: { home: 'Ler', couples: 'Parsprogindlering', methodology: 'Metode' },
  cs: { home: 'Ucit se', couples: 'Uceni pro Pary', methodology: 'Metodika' },
  ro: { home: 'Invata', couples: 'Invatare pentru Cupluri', methodology: 'Metodologie' },
  el: { home: 'Mathe', couples: 'Ekmathisi gia Zevgaria', methodology: 'Methodologia' },
  hu: { home: 'Tanulj', couples: 'Paros Nyelvtanulas', methodology: 'Modszertan' },
  tr: { home: 'Ogren', couples: 'Ciftler Icin Dil Ogrenimi', methodology: 'Metodoloji' },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nativeLang, slug } = await params;

  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    return {};
  }

  try {
    const { data } = await supabaseBlog
      .from('blog_articles')
      .select('title, description')
      .eq('native_lang', nativeLang)
      .eq('target_lang', 'all')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (!data) return {};

    const pageCanonical = canonicalUrl(
      `/learn/${nativeLang}/couples-language-learning/methodology/${slug}`
    );

    const hreflangAlternates: Record<string, string> = {};
    for (const lang of SUPPORTED_NATIVE_LANGS) {
      hreflangAlternates[lang] = canonicalUrl(
        `/learn/${lang}/couples-language-learning/methodology/${slug}`
      );
    }
    hreflangAlternates['x-default'] = canonicalUrl(
      `/learn/en/couples-language-learning/methodology/${slug}`
    );

    return {
      title: `${data.title} | Love Languages`,
      description: data.description || data.title,
      alternates: {
        canonical: pageCanonical,
        languages: hreflangAlternates,
      },
    };
  } catch {
    return {};
  }
}

export default async function MethodologyArticlePage({ params }: PageProps) {
  const { nativeLang, slug } = await params;

  // Validate native language
  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    notFound();
  }

  // Fetch article from Supabase
  let article: {
    title: string;
    description: string | null;
    content: string;
    content_html: string | null;
    read_time: number | null;
    difficulty: string | null;
    category: string | null;
    date: string | null;
    updated_at: string;
    tags: string[] | null;
    faq_items: Array<{ question: string; answer: string }> | null;
  } | null = null;

  let relatedArticles: { slug: string; title: string }[] = [];

  try {
    const { data, error } = await supabaseBlog
      .from('blog_articles')
      .select('*')
      .eq('native_lang', nativeLang)
      .eq('target_lang', 'all')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error || !data) {
      console.error('Methodology article not found:', slug, error?.message);
      notFound();
    }

    article = data;

    // Get other methodology articles for sidebar
    const { data: related } = await supabaseBlog
      .from('blog_articles')
      .select('slug, title')
      .eq('native_lang', nativeLang)
      .eq('target_lang', 'all')
      .eq('category', 'couples-methodology')
      .eq('published', true)
      .neq('slug', slug)
      .limit(7);

    relatedArticles = related || [];
  } catch (err) {
    console.error('Methodology article error:', err);
    notFound();
  }

  if (!article) {
    notFound();
  }

  const labels = breadcrumbLabels[nativeLang] || breadcrumbLabels.en;

  const pageCanonical = canonicalUrl(
    `/learn/${nativeLang}/couples-language-learning/methodology/${slug}`
  );

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: pageCanonical,
    inLanguage: nativeLang,
    datePublished: article.date,
    dateModified: article.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
    author: {
      '@type': 'Organization',
      name: 'Love Languages',
    },
    keywords: (article.tags || []).join(', '),
    articleSection: article.category,
  };

  // FAQ JSON-LD
  const faqItems = article.faq_items || [];
  const faqJsonLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-500 mb-6">
            <ol className="flex items-center space-x-2">
              <li>
                <a href={`/learn/${nativeLang}/`} className="hover:text-pink-600">
                  {labels.home}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a
                  href={`/learn/${nativeLang}/couples-language-learning/`}
                  className="hover:text-pink-600"
                >
                  {labels.couples}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a
                  href={`/learn/${nativeLang}/couples-language-learning/methodology/`}
                  className="hover:text-pink-600"
                >
                  {labels.methodology}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-700 font-medium truncate max-w-[200px]">
                {article.title}
              </li>
            </ol>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black font-header text-gray-900 mb-4">
              {article.title}
            </h1>
            {article.description && (
              <p className="text-lg text-gray-600 mb-4">{article.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {article.read_time && (
                <span className="flex items-center gap-1">
                  <span>{'\u{1F4D6}'}</span> {article.read_time} min read
                </span>
              )}
              {article.difficulty && (
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                  {article.difficulty}
                </span>
              )}
            </div>
          </header>

          {/* Article Content */}
          <article
            className="prose prose-lg prose-pink max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.content_html || article.content }}
          />

          {/* FAQ Section */}
          {faqItems.length > 0 && (
            <section className="mt-10 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqItems.map((faq, i) => (
                  <details
                    key={i}
                    className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
                      <span className="pr-2">{faq.question}</span>
                      <svg
                        className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="p-4 pt-0 text-gray-700 border-t border-gray-200">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <aside className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                More Methodology Articles
              </h2>
              <ul className="grid gap-3">
                {relatedArticles.map(related => (
                  <li key={related.slug}>
                    <a
                      href={`/learn/${nativeLang}/couples-language-learning/methodology/${related.slug}/`}
                      className="block p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                    >
                      <span className="text-gray-900 font-medium">{related.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* CTA */}
          <div className="mt-12 p-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl text-white text-center">
            <h3 className="text-xl font-bold mb-2">
              Ready to learn your partner&apos;s language?
            </h3>
            <p className="mb-4 opacity-90">Start your journey together with Love Languages</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-white text-pink-600 font-bold rounded-full hover:bg-pink-50 transition-colors"
            >
              Get Started Free &rarr;
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
