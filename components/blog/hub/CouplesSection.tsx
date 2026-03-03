interface Props {
  name: string;
  tip: string;
  lovePhrase?: {
    phrase: string;
    translation: string;
  };
  learnMoreUrl?: string;
}

export default function CouplesSection({ name, tip, lovePhrase, learnMoreUrl }: Props) {
  return (
    <section className="py-12 bg-gradient-to-r from-pink-50 to-accent/10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">{'\u{1F495}'}</span>
          <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-4">
            Learn {name} Together
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {tip}
          </p>
        </div>

        {lovePhrase && (
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-auto text-center shadow-sm border border-accent/20">
            <div className="text-2xl font-bold text-accent mb-2">{lovePhrase.phrase}</div>
            <div className="text-gray-600">{lovePhrase.translation}</div>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href={learnMoreUrl || "/"} className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 hover:scale-105 transition-all font-medium">
            <span>Start Learning Together</span>
            <span>{'\u2192'}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
