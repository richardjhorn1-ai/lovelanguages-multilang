'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface WordData {
  slug: string;
  polish: string;
  english: string;
  pronunciation: string;
  wordType: string;
  tags: string[];
}

interface Props {
  words: WordData[];
}

export default function DictionarySearch({ words }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WordData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    const q = value.toLowerCase().trim();

    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const matched = words.filter(
      (w) =>
        w.polish.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q)
    );
    setResults(matched);
  }, [words]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="max-w-xl mx-auto">
        <label htmlFor="search" className="block text-lg font-bold text-gray-900 mb-3">
          Search for a word:
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            placeholder="Type Polish or English..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-lg"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {hasSearched && (
          <div className="mt-4">
            <p className="text-gray-600 mb-3">
              Found {results.length} word{results.length !== 1 ? 's' : ''} matching &quot;{query}&quot;
            </p>
            {results.length > 0 && (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {results.slice(0, 20).map((word) => (
                  <Link
                    key={word.slug}
                    href={`/dictionary/${word.slug}/`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-accent/5 hover:border-accent/30 border border-transparent transition-colors"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{word.polish}</span>
                      <span className="text-gray-400 mx-2">-</span>
                      <span className="text-gray-600">{word.english}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                      {word.wordType}
                    </span>
                  </Link>
                ))}
                {results.length > 20 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    ...and {results.length - 20} more results
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
