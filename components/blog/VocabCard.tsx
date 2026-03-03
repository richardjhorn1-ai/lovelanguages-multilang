interface Props {
  // New language-agnostic props (preferred)
  word?: string;
  translation?: string;
  // Legacy props (backward compatibility with existing Polish articles)
  polish?: string;
  english?: string;
  // Common props
  pronunciation?: string;
  example?: string;
}

export default function VocabCard({ word, translation, polish, english, pronunciation, example }: Props) {
  // Use new props if provided, fall back to legacy props
  const displayWord = word || polish || '';
  const displayTranslation = translation || english || '';

  return (
    <div className="speakable-vocab bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 my-6 border border-accent/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-accent font-header">{displayWord}</span>
        <span className="text-lg text-gray-900">{displayTranslation}</span>
      </div>
      {pronunciation && (
        <p className="text-sm text-gray-600 mb-2">
          Pronunciation: <code className="bg-white/50 px-2 py-0.5 rounded">{pronunciation}</code>
        </p>
      )}
      {example && (
        <p className="text-gray-600 italic border-t border-accent/20 pt-3 mt-3">
          &ldquo;{example}&rdquo;
        </p>
      )}
    </div>
  );
}
