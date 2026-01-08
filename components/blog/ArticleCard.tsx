import React from 'react';

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number; // in minutes
  image?: string;
  date: string;
}

const CATEGORY_COLORS = {
  phrases: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Phrases' },
  vocabulary: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Vocabulary' },
  grammar: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Grammar' },
  culture: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Culture' },
  situations: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Situations' },
};

const DIFFICULTY_BADGES = {
  beginner: { bg: 'bg-green-100', text: 'text-green-700', label: '🌱 Beginner' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🌿 Intermediate' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700', label: '🌳 Advanced' },
};

const ArticleCard: React.FC<{ article: ArticleMeta }> = ({ article }) => {
  const category = CATEGORY_COLORS[article.category];
  const difficulty = DIFFICULTY_BADGES[article.difficulty];

  return (
    <a
      href={`/#/learn/${article.slug}`}
      className="group block bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--border-color)] hover:border-[var(--accent-color)]/30"
    >
      {/* Image */}
      {article.image ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className={`${category.bg} ${category.text} text-xs font-bold px-2 py-1 rounded-full`}>
              {category.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-[var(--accent-color)]/20 to-pink-200/30 flex items-center justify-center">
          <span className="text-6xl opacity-50">🇵🇱</span>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {!article.image && (
            <span className={`${category.bg} ${category.text} text-xs font-bold px-2 py-1 rounded-full`}>
              {category.label}
            </span>
          )}
          <span className={`${difficulty.bg} ${difficulty.text} text-xs font-medium px-2 py-1 rounded-full`}>
            {difficulty.label}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {article.readTime} min read
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold font-header text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-color)] transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 mb-4">
          {article.description}
        </p>

        {/* Read more */}
        <div className="flex items-center text-[var(--accent-color)] font-medium text-sm">
          <span>Read article</span>
          <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;
