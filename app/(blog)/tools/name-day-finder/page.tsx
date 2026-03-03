import { Metadata } from 'next';
import Link from 'next/link';
import { polishNameDays, additionalNames, nameDayFacts, formatNameDayDate } from '@blog-data/polish-name-days';
import NameDaySearch from './NameDaySearch';

export const metadata: Metadata = {
  title: 'Polish Name Day Finder - When Is Your Imieniny?',
  description:
    'Find when your Polish name day (imieniny) is celebrated. Enter any Polish name to discover its traditional celebration date and learn about this beautiful Polish tradition.',
  alternates: {
    canonical: 'https://www.lovelanguages.io/tools/name-day-finder/',
  },
};

export default function NameDayFinderPage() {
  // Get today's names (server-side)
  const today = new Date();
  const todayKey = `${today.getMonth() + 1}-${today.getDate()}`;
  const todaysNames = polishNameDays[todayKey] || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Polish Name Day Finder",
    description:
      "Find when your Polish name day (imieniny) is celebrated. Enter any Polish name to discover its traditional celebration date.",
    url: "https://www.lovelanguages.io/tools/name-day-finder/",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
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

      {/* Hero Section */}
      <header className="bg-gradient-to-b from-accent/10 to-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-4">
              Polish Name Day Finder
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover when your Polish name day (imieniny) is celebrated. A beloved tradition where each day honors specific names!
            </p>
          </div>
        </div>
      </header>

      {/* Main Tool Section */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Card - Client Component */}
        <NameDaySearch nameDays={polishNameDays} additionalNames={additionalNames} />

        {/* Today's Names */}
        <div className="bg-gradient-to-r from-accent/5 to-pink-50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{"\uD83D\uDCC5"}</span>
            <h2 className="text-2xl font-bold font-header text-gray-900">Today&apos;s Name Days</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Today ({formatNameDayDate(todayKey)}), we celebrate:
          </p>
          <div className="flex flex-wrap gap-2">
            {todaysNames.map((name) => (
              <span key={name} className="px-4 py-2 bg-white rounded-full font-bold text-accent shadow-sm">
                {name}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Know someone with these names? Wish them &quot;Wszystkiego najlepszego!&quot; (All the best!)
          </p>
        </div>

        {/* Cultural Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold font-header text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">{"\uD83C\uDDF5\uD83C\uDDF1"}</span> What is Imieniny?
            </h3>
            <p className="text-gray-600">
              In Poland, <strong className="text-accent">imieniny</strong> (name days) are a beloved tradition where each day of the year is associated with specific names. Many Poles celebrate their name day as much as - or even more than - their birthday!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold font-header text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">{"\uD83C\uDF81"}</span> How to Celebrate
            </h3>
            <p className="text-gray-600">
              Bring flowers, sweets, or a small gift. Say <strong className="text-accent">&quot;Wszystkiego najlepszego z okazji imienin!&quot;</strong> (All the best on your name day!) It&apos;s common to celebrate with cake at work or a small family gathering.
            </p>
          </div>
        </div>

        {/* Did You Know Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="text-xl font-bold font-header text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">{"\uD83D\uDCA1"}</span> Did You Know?
          </h3>
          <ul className="space-y-3">
            {nameDayFacts.slice(0, 5).map((fact, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-600">
                <span className="text-accent mt-1">{"\u2665"}</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-accent to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-3">
            Learn Polish Together With Your Partner
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            Discover more Polish traditions, practice pronunciation, and master the language of love.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-accent font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg"
          >
            Start Learning Polish &rarr;
          </Link>
          <p className="mt-4 text-white/80 text-sm">
            Join couples learning Polish across 30+ countries
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12 mt-12">
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
