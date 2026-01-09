import React, { useState } from 'react';
import ArticleCard, { ArticleMeta } from './ArticleCard';
import { ICONS } from '../../constants';

// Import all articles - this will be populated as you add MDX files
// For now, we'll use a static array that you can update
import { articles } from '../../content/articles';

type CategoryFilter = 'all' | ArticleMeta['category'];
type DifficultyFilter = 'all' | ArticleMeta['difficulty'];

const CATEGORIES: { value: CategoryFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '✨' },
  { value: 'phrases', label: 'Phrases', icon: '💬' },
  { value: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { value: 'grammar', label: 'Grammar', icon: '📝' },
  { value: 'culture', label: 'Culture', icon: '🇵🇱' },
  { value: 'situations', label: 'Situations', icon: '🎭' },
];

const DIFFICULTIES: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: '🌱 Beginner' },
  { value: 'intermediate', label: '🌿 Intermediate' },
  { value: 'advanced', label: '🌳 Advanced' },
];

const BlogIndex: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    if (categoryFilter !== 'all' && article.category !== categoryFilter) return false;
    if (difficultyFilter !== 'all' && article.difficulty !== difficultyFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[var(--accent-color)]/10 to-[var(--bg-primary)] pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-12">
            <a
              href="/#/"
              className="flex items-center gap-2 text-[var(--accent-color)] font-bold"
            >
              <ICONS.Heart className="w-6 h-6 text-[var(--accent-color)] fill-[var(--accent-color)]" />
              <span className="font-header text-xl">Love Languages</span>
            </a>
            <a
              href="/#/"
              className="bg-[var(--accent-color)] text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-shadow text-sm"
            >
              Start Learning →
            </a>
          </nav>

          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black font-header text-[var(--text-primary)] mb-4">
              Learn Polish for Love
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-8">
              Free guides, vocabulary lists, and cultural tips to help you learn Polish for your relationship.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-lg border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    categoryFilter === cat.value
                      ? 'bg-[var(--accent-color)] text-white shadow-md'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-color)]/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Difficulty dropdown */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-color)]"
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {filteredArticles.length > 0 ? (
          <>
            <p className="text-[var(--text-secondary)] mb-6">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              No articles found
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Try adjusting your filters or search query.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setDifficultyFilter('all');
                setSearchQuery('');
              }}
              className="text-[var(--accent-color)] font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-[var(--accent-color)] to-pink-500 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold font-header mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-white/80 mb-8">
            Join Love Languages and learn Polish together with your partner using AI-powered coaching.
          </p>
          <a
            href="/#/"
            className="inline-block bg-white text-[var(--accent-color)] font-bold px-8 py-3 rounded-full hover:shadow-lg transition-shadow"
          >
            Get Started Free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
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

export default BlogIndex;
