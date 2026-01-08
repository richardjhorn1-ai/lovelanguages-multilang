import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from './MDXComponents';
import { ArticleMeta } from './ArticleCard';
import { ICONS } from '../../constants';

interface BlogLayoutProps {
  children: React.ReactNode;
  meta: ArticleMeta;
}

const CATEGORY_LABELS = {
  phrases: { icon: '💬', label: 'Phrases' },
  vocabulary: { icon: '📚', label: 'Vocabulary' },
  grammar: { icon: '📝', label: 'Grammar' },
  culture: { icon: '🇵🇱', label: 'Culture' },
  situations: { icon: '🎭', label: 'Situations' },
};

const BlogLayout: React.FC<BlogLayoutProps> = ({ children, meta }) => {
  const category = CATEGORY_LABELS[meta.category];
  const formattedDate = new Date(meta.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-card)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href="/#/learn"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors"
          >
            <ICONS.ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to articles</span>
          </a>
          <a
            href="/#/"
            className="flex items-center gap-2 text-[var(--accent-color)] font-bold"
          >
            <span className="text-xl">💕</span>
            <span className="font-header">Love Languages</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        {meta.image ? (
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={meta.image}
              alt={meta.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-b from-[var(--accent-color)]/10 to-[var(--bg-primary)]" />
        )}
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {/* Meta */}
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg p-6 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="bg-[var(--accent-color)]/10 text-[var(--accent-color)] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              {category.icon} {category.label}
            </span>
            <span className="text-[var(--text-secondary)] text-sm">
              {formattedDate}
            </span>
            <span className="text-[var(--text-secondary)] text-sm">
              • {meta.readTime} min read
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black font-header text-[var(--text-primary)] leading-tight mb-4">
            {meta.title}
          </h1>

          <p className="text-lg text-[var(--text-secondary)]">
            {meta.description}
          </p>
        </div>

        {/* MDX Content */}
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg p-6 md:p-10">
          <MDXProvider components={mdxComponents}>
            {children}
          </MDXProvider>
        </div>

        {/* Bottom CTA */}
        <div className="my-12 bg-gradient-to-r from-[var(--accent-color)] to-pink-500 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold font-header mb-2">
            Start Learning Polish Together
          </h3>
          <p className="text-white/80 mb-6">
            Join thousands of couples learning their partner's language with AI-powered coaching.
          </p>
          <a
            href="/#/"
            className="inline-block bg-white text-[var(--accent-color)] font-bold px-8 py-3 rounded-full hover:shadow-lg transition-shadow"
          >
            Try Love Languages Free →
          </a>
        </div>

        {/* Related Articles Placeholder */}
        <div className="mb-12">
          <h3 className="text-xl font-bold font-header text-[var(--text-primary)] mb-4">
            Keep Learning
          </h3>
          <a
            href="/#/learn"
            className="block bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-colors"
          >
            <span className="text-[var(--accent-color)] font-medium">
              Browse all articles →
            </span>
          </a>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <a href="/#/" className="inline-flex items-center gap-2 text-[var(--accent-color)] font-bold mb-4">
            <span className="text-2xl">💕</span>
            <span className="font-header text-xl">Love Languages</span>
          </a>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            Learn Polish together with AI-powered coaching designed for couples.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
            <a href="/#/privacy" className="hover:text-[var(--accent-color)]">Privacy</a>
            <a href="/#/terms" className="hover:text-[var(--accent-color)]">Terms</a>
            <a href="/#/" className="hover:text-[var(--accent-color)]">App</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLayout;
