interface Props {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speakers: string;
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  href: string;
  articleCount?: number;
}

export default function LanguageCard({ code, name, nativeName, flag, speakers, difficultyRating, href, articleCount }: Props) {
  return (
    <a
      href={href}
      className="group flex flex-col bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-accent hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl group-hover:scale-110 transition-transform">{flag}</span>
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors">
            {nativeName}
          </h3>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 mt-auto">
        <span>{speakers} speakers</span>
        {/* Star ratings removed */}
        {/*<span className="text-accent">
          {'★'.repeat(difficultyRating)}{'☆'.repeat(5 - difficultyRating)}
        </span>*/}
      </div>

      {articleCount !== undefined && articleCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">
            {articleCount} articles
          </span>
        </div>
      )}
    </a>
  );
}
