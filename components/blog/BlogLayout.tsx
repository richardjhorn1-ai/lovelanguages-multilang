import React, { useState } from 'react';
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
  const [imageError, setImageError] = useState(false);
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
            <ICONS.Heart className="w-5 h-5 text-[var(--accent-color)] fill-[var(--accent-color)]" />
            <span className="font-header">Love Languages</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        {meta.image && !imageError ? (
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={meta.image}
              alt={meta.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-br from-[var(--accent-color)]/20 via-pink-500/10 to-[var(--bg-primary)] flex items-center justify-center">
            <span className="text-6xl md:text-8xl opacity-30">{category.icon}</span>
          </div>
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
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg p-6 md:p-10 mb-12">
          <MDXProvider components={mdxComponents}>
            {children}
          </MDXProvider>

          {/* Browse more - inside content card */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <a
              href="/#/learn"
              className="flex items-center justify-center gap-2 text-[var(--accent-color)] font-medium hover:underline"
            >
              <span>Browse all articles</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <a href="/#/" className="inline-flex items-center gap-2 text-[var(--accent-color)] font-bold mb-4">
            <ICONS.Heart className="w-6 h-6 text-[var(--accent-color)] fill-[var(--accent-color)]" />
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
