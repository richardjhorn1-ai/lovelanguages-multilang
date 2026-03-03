interface Props {
  slug: string;
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  image?: string;
  date: string;
}

const categoryConfig: Record<string, { icon: string; bg: string; text: string }> = {
  phrases: { icon: '\u{1F4AC}', bg: 'bg-rose-100', text: 'text-rose-700' },
  vocabulary: { icon: '\u{1F4DA}', bg: 'bg-purple-100', text: 'text-purple-700' },
  grammar: { icon: '\u{1F4DD}', bg: 'bg-blue-100', text: 'text-blue-700' },
  culture: { icon: '\u{1F30D}', bg: 'bg-amber-100', text: 'text-amber-700' },
  situations: { icon: '\u{1F3AD}', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  pronunciation: { icon: '\u{1F5E3}\uFE0F', bg: 'bg-teal-100', text: 'text-teal-700' },
};

const difficultyConfig: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-700' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

const defaultCat = { icon: '\u{1F4D6}', bg: 'bg-gray-100', text: 'text-gray-700' };
const defaultDiff = { bg: 'bg-gray-100', text: 'text-gray-700' };

export default function ArticleCard({ slug, title, description, category, difficulty, readTime, image, date }: Props) {
  const cat = categoryConfig[category] || defaultCat;
  const diff = difficultyConfig[difficulty] || defaultDiff;

  return (
    <a
      href={`/learn/${slug}/`}
      className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white border border-gray-100"
    >
      <div className="relative h-48 bg-gradient-to-br from-accent/10 to-pink-100 card-image-container">
        {image ? (
          <img
            src={image}
            alt={title}
            className="card-image w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : null}
        <div className="card-emoji absolute inset-0 flex items-center justify-center text-6xl opacity-50">
          {cat.icon}
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.bg} ${cat.text}`}>
            {category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors line-clamp-2 font-header mb-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className={`px-2 py-1 rounded ${diff.bg} ${diff.text}`}>
            {difficulty}
          </span>
          <span>{readTime} min read</span>
        </div>
      </div>
    </a>
  );
}
