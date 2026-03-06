import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticle, getRelatedArticles, getAlternatesByTopicId } from '@/lib/blog-api';
import { canonicalUrl, articleUrl } from '@/lib/blog-urls';
import { sanitizeArticleContent } from '@/lib/blog-sanitize';
import { splitContentAtMidpoint } from '@/lib/blog-split-content';
import { LANGUAGE_INFO, VALID_LANG_CODES } from '@/lib/language-info';
import ArticleLayout from '@/components/blog/ArticleLayout';
import LoveNote from '@/components/blog/LoveNote';

export const revalidate = 86400; // ISR: 24 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Params = Promise<{ nativeLang: string; targetLang: string; slug: string }>;

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { nativeLang, targetLang, slug } = await params;

  if (!VALID_LANG_CODES.includes(nativeLang) || !VALID_LANG_CODES.includes(targetLang)) {
    return {};
  }

  const article = await getArticle(nativeLang, targetLang, slug);
  if (!article) return {};

  const nativeInfo = LANGUAGE_INFO[nativeLang] || LANGUAGE_INFO.en;
  const targetInfo = LANGUAGE_INFO[targetLang] || LANGUAGE_INFO.en;
  const url = canonicalUrl(articleUrl(nativeLang, targetLang, slug));

  // Build hreflang alternates from topic_id
  const alternates = await getAlternatesByTopicId(
    article.topic_id,
    targetLang,
    nativeLang,
  );

  const languages: Record<string, string> = {
    [nativeLang]: url,
    'x-default': url,
  };
  for (const alt of alternates) {
    languages[alt.native_lang] = canonicalUrl(
      articleUrl(alt.native_lang, targetLang, alt.slug),
    );
  }

  const suffix = ' | Love Languages';
  const rawTitle = article.title;
  const title = rawTitle.length + suffix.length <= 60 ? `${rawTitle}${suffix}` : rawTitle;

  return {
    title,
    description: article.description || `Learn ${targetInfo.name} with your partner - ${article.title}`,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description: article.description || undefined,
      url,
      type: 'article',
      images: article.image ? [{ url: article.image }] : undefined,
      siteName: 'Love Languages',
      locale: nativeLang,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: article.description || undefined,
      images: article.image ? [article.image] : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function ArticlePage({
  params,
}: {
  params: Params;
}) {
  const { nativeLang, targetLang, slug } = await params;

  // Validate language codes
  if (!VALID_LANG_CODES.includes(nativeLang)) {
    notFound();
  }

  if (!VALID_LANG_CODES.includes(targetLang)) {
    // Methodology articles (target_lang='all') are redirected in middleware
    notFound();
  }

  // Fetch article from Supabase
  const article = await getArticle(nativeLang, targetLang, slug);
  if (!article) {
    notFound();
  }

  const nativeLanguageInfo = LANGUAGE_INFO[nativeLang] || LANGUAGE_INFO.en;
  const languageInfo = LANGUAGE_INFO[targetLang] || LANGUAGE_INFO.pl;
  const languageCode = targetLang;

  // Fetch related articles + alternates in parallel
  const [relatedArticles, alternates] = await Promise.all([
    getRelatedArticles(nativeLang, targetLang, slug, article.category, 3),
    getAlternatesByTopicId(article.topic_id, targetLang, nativeLang),
  ]);

  // Convert to format expected by layout
  const relatedForLayout = relatedArticles.map((a) => ({
    slug: `${a.native_lang}/${a.target_lang}/${a.slug}`,
    data: {
      title: a.title,
      description: a.description,
      category: a.category,
      difficulty: a.difficulty,
      readTime: a.read_time,
      image: a.image,
      tags: [],
      date: a.date,
    },
  }));
  const alternateVersions = alternates.map((a) => ({
    nativeLang: a.native_lang,
    href: `https://www.lovelanguages.io/learn/${a.native_lang}/${targetLang}/${a.slug}/`,
  }));

  // Cross-pair articles (simplified)
  const crossPairArticles: any[] = [];

  // Split content for mid-article LoveNote
  const sanitizedContent = sanitizeArticleContent(
    article.content_html || article.content || '',
  );
  const { firstHalf, secondHalf } = splitContentAtMidpoint(sanitizedContent);

  // Build JSON-LD structured data
  const jsonLdItems: object[] = [];

  // BlogPosting schema
  const blogPostingJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    url: canonicalUrl(articleUrl(nativeLang, targetLang, slug)),
    inLanguage: nativeLang,
    datePublished: article.date,
    dateModified: article.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl(articleUrl(nativeLang, targetLang, slug)),
    },
  };
  if (article.image) {
    blogPostingJsonLd.image = article.image;
  }
  jsonLdItems.push(blogPostingJsonLd);

  // BreadcrumbList schema
  jsonLdItems.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Learn',
        item: 'https://www.lovelanguages.io/learn/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: languageInfo.name,
        item: canonicalUrl(`/learn/${nativeLang}/${targetLang}`),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
      },
    ],
  });

  // FAQ schema if faq_items exist
  if (article.faq_items && article.faq_items.length > 0) {
    jsonLdItems.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faq_items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return (
    <>
      {jsonLdItems.map((jsonLd, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <ArticleLayout
        title={article.title}
        description={article.description}
        category={article.category}
        difficulty={article.difficulty}
        readTime={article.read_time}
        image={article.image}
        date={article.date}
        updatedAt={article.updated_at}
        tags={article.tags || []}
        faqItems={article.faq_items}
        relatedArticles={relatedForLayout}
        languageCode={languageCode}
        languageInfo={languageInfo}
        nativeLanguageCode={nativeLang}
        nativeLanguageInfo={nativeLanguageInfo}
        alternateVersions={alternateVersions}
        reverseArticle={undefined}
        crossPairArticles={crossPairArticles}
        articleSlug={slug}
      >
        <div dangerouslySetInnerHTML={{ __html: firstHalf }} />
        {secondHalf && (
          <LoveNote
            nativeLang={nativeLang}
            targetLang={targetLang}
            articleSlug={slug}
          />
        )}
        {secondHalf && (
          <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
        )}
      </ArticleLayout>
    </>
  );
}
