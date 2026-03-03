import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Polish Learning Tools',
  description:
    'Free interactive tools to help you learn Polish language and culture. Name day finder, pronunciation helpers, and more.',
  alternates: {
    canonical: 'https://www.lovelanguages.io/tools/',
  },
};

const tools = [
  {
    title: 'Polish Name Day Finder',
    description:
      'Find when your Polish name day (imieniny) is celebrated. Discover this beautiful Polish tradition!',
    href: '/tools/name-day-finder/',
    icon: '\uD83D\uDCC5',
    badge: 'Free',
  },
];

export default function ToolsIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Polish Learning Tools",
    description:
      "Free interactive tools to help you learn Polish language and culture.",
    url: "https://www.lovelanguages.io/tools/",
    publisher: {
      "@type": "Organization",
      name: "Love Languages",
      url: "https://www.lovelanguages.io/",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="bg-gradient-to-b from-accent/10 to-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-4">
              Free Polish Learning Tools
            </h1>
            <p className="text-xl text-gray-600">
              Interactive tools to help you and your partner learn Polish together
            </p>
          </div>
        </div>
      </header>

      {/* Tools Grid */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-accent/30"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{tool.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold font-header text-gray-900 group-hover:text-accent transition-colors">
                      {tool.title}
                    </h2>
                    {tool.badge && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{tool.description}</p>
                  <span className="inline-block mt-3 text-accent font-medium group-hover:translate-x-1 transition-transform">
                    Try it now &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Coming Soon Placeholder */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-300">
            <div className="flex items-start gap-4 opacity-60">
              <div className="text-4xl">{"\uD83D\uDD2E"}</div>
              <div>
                <h2 className="text-xl font-bold font-header text-gray-700 mb-2">
                  More Tools Coming Soon
                </h2>
                <p className="text-gray-500">
                  Pronunciation checker, vocabulary quiz builder, and more!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-accent to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-3">
            Ready for the Full Experience?
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            Get AI coaching, voice practice, games, and personalized lessons.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-accent font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg"
          >
            Start Learning Polish &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold font-header text-accent mb-4">
            <img src="/favicon.svg" alt="Love Languages" className="w-8 h-8" />
            Love Languages
          </Link>
          <p className="text-gray-600 mb-6">Learn Polish together with your partner</p>
          <nav className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href="/learn/" className="hover:text-accent">Blog</Link>
            <Link href="/tools/" className="hover:text-accent">Tools</Link>
            <Link href="/terms/" className="hover:text-accent">Terms</Link>
            <Link href="/privacy/" className="hover:text-accent">Privacy</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
