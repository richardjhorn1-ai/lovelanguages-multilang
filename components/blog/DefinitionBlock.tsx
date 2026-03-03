interface Props {
  term: string;
  definition: string;
  pronunciation?: string;
  partOfSpeech?: string;
  language?: string;
}

export default function DefinitionBlock({ term, definition, pronunciation, partOfSpeech, language }: Props) {
  return (
    <div className="speakable-vocab my-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200" itemScope itemType="https://schema.org/DefinedTerm">
      <dl>
        <dt className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-bold text-purple-800 font-header" itemProp="name">{term}</span>
          {partOfSpeech && (
            <span className="text-xs font-medium text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">{partOfSpeech}</span>
          )}
        </dt>
        {pronunciation && (
          <p className="text-sm text-purple-600 mb-2">
            <code className="bg-white/50 px-2 py-0.5 rounded">{pronunciation}</code>
          </p>
        )}
        <dd className="text-gray-700 leading-relaxed" itemProp="description">
          {definition}
        </dd>
      </dl>
      {language && <meta itemProp="inDefinedTermSet" content={language} />}
    </div>
  );
}
