interface Props {
  name: string;
  highlights: string[];
}

export default function GrammarOverview({ name, highlights }: Props) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-2">
          {name} Grammar: What to Expect
        </h2>
        <p className="text-gray-600 mb-8">
          Understanding the structure helps you learn faster. Here&apos;s what makes {name} unique.
        </p>

        <div className="bg-gradient-to-br from-accent/5 to-pink-50 rounded-2xl p-6 md:p-8 border border-accent/10">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Key Grammar Features</h3>
          <ul className="space-y-3">
            {highlights.map((highlight, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-accent font-bold mt-0.5">{'\u2713'}</span>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
