'use client';

import { useState, useCallback, useRef } from 'react';

interface NameDateEntry {
  date: string;
  originalName: string;
}

interface Props {
  nameDays: Record<string, string[]>;
  additionalNames: Record<string, string[]>;
}

interface MatchResult {
  name: string;
  date: string;
  formatted: string;
  daysUntil: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(dateKey: string): string {
  const [month, day] = dateKey.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

function getDaysUntil(dateKey: string): number {
  const [month, day] = dateKey.split('-').map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  let targetDate = new Date(currentYear, month - 1, day);
  if (targetDate < today) {
    targetDate = new Date(currentYear + 1, month - 1, day);
  }

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function buildReverseIndex(
  nameDays: Record<string, string[]>,
  additionalNames: Record<string, string[]>
): Map<string, NameDateEntry[]> {
  const nameToDate = new Map<string, NameDateEntry[]>();

  // Add main calendar names
  for (const [date, names] of Object.entries(nameDays)) {
    for (const name of names) {
      const normalizedName = name.toLowerCase();
      if (!nameToDate.has(normalizedName)) {
        nameToDate.set(normalizedName, []);
      }
      nameToDate.get(normalizedName)!.push({ date, originalName: name });
    }
  }

  // Add supplementary names (diminutives, modern variants)
  for (const [date, names] of Object.entries(additionalNames)) {
    for (const name of names) {
      const normalizedName = name.toLowerCase();
      if (!nameToDate.has(normalizedName)) {
        nameToDate.set(normalizedName, []);
      }
      const existing = nameToDate.get(normalizedName)!;
      if (!existing.some((e) => e.date === date)) {
        existing.push({ date, originalName: name });
      }
    }
  }

  return nameToDate;
}

export default function NameDaySearch({ nameDays, additionalNames }: Props) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Build reverse index once (lazy)
  const indexRef = useRef<Map<string, NameDateEntry[]> | null>(null);
  function getIndex() {
    if (!indexRef.current) {
      indexRef.current = buildReverseIndex(nameDays, additionalNames);
    }
    return indexRef.current;
  }

  const findNameDay = useCallback((searchName: string) => {
    const normalizedSearch = searchName.trim().toLowerCase();

    if (!normalizedSearch || normalizedSearch.length < 2) {
      setMatches([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const nameToDate = getIndex();

    let found: MatchResult[] = [];

    // Exact match first
    if (nameToDate.has(normalizedSearch)) {
      const dateInfos = nameToDate.get(normalizedSearch)!;
      found = dateInfos.map((info) => ({
        name: info.originalName,
        date: info.date,
        formatted: formatDate(info.date),
        daysUntil: getDaysUntil(info.date),
      }));
    }

    // If no exact match, try partial matching
    if (found.length === 0) {
      for (const [name, dateInfos] of nameToDate.entries()) {
        if (name.includes(normalizedSearch) || normalizedSearch.includes(name)) {
          for (const info of dateInfos) {
            found.push({
              name: info.originalName,
              date: info.date,
              formatted: formatDate(info.date),
              daysUntil: getDaysUntil(info.date),
            });
          }
        }
      }
    }

    // Sort by days until, remove duplicates
    found.sort((a, b) => a.daysUntil - b.daysUntil);
    const seen = new Set<string>();
    found = found.filter((m) => {
      const key = `${m.name}-${m.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setMatches(found);
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim().length >= 2) {
          findNameDay(value);
        } else {
          setMatches([]);
          setHasSearched(false);
        }
      }, 300);
    },
    [findNameDay]
  );

  const handleSuggestionClick = useCallback(
    (name: string) => {
      setQuery(name);
      findNameDay(name);
    },
    [findNameDay]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        findNameDay(query);
      }
    },
    [findNameDay, query]
  );

  const popularNames = ['Anna', 'Jan', 'Maria', 'Piotr', 'Katarzyna', 'Tomasz', 'Ewa', 'Andrzej'];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
      <div className="max-w-xl mx-auto">
        <label htmlFor="name-input" className="block text-lg font-bold text-gray-900 mb-3">
          Enter a Polish name:
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            id="name-input"
            placeholder="e.g., Anna, Jan, Katarzyna..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-lg"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => findNameDay(query)}
            className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            Find Date
          </button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="mt-6">
            {matches.length > 0 ? (
              <div className="bg-gradient-to-r from-accent/10 to-pink-50 rounded-xl p-6 text-center">
                <div className="text-5xl mb-3">{matches[0].daysUntil === 0 ? '\uD83C\uDF89' : '\uD83D\uDCC5'}</div>
                <h3 className="text-2xl font-bold font-header text-gray-900 mb-2">
                  {matches[0].name}&apos;s Name Day
                </h3>
                <p className="text-xl text-accent font-bold mb-2">{matches[0].formatted}</p>
                <p className="text-gray-600">
                  {matches[0].daysUntil === 0
                    ? "That's today! Wszystkiego najlepszego! \uD83C\uDF82"
                    : matches[0].daysUntil === 1
                      ? "That's tomorrow!"
                      : `${matches[0].daysUntil} days from now`}
                </p>

                {/* Additional dates */}
                {matches.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-accent/20">
                    <p className="text-sm text-gray-500 mb-2">Other dates for similar names:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {matches.slice(1, 5).map((m, i) => (
                        <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                          {m.name}: {m.formatted}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-accent/20">
                  <p className="text-sm text-gray-500">
                    Wish them: <strong className="text-accent">&quot;Wszystkiego najlepszego z okazji imienin!&quot;</strong>
                    <br />
                    <span className="text-xs">(All the best on your name day!)</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">{"\uD83E\uDD14"}</div>
                <p className="text-gray-600 mb-3">
                  No Polish name day found for &quot;<strong>{query}</strong>&quot;.
                </p>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>Our database includes 1,000+ traditional Polish names, but not every name is listed.</p>
                  <p><strong>Tips:</strong></p>
                  <ul className="text-left max-w-xs mx-auto space-y-1">
                    <li>Try the formal version (e.g., &quot;Katarzyna&quot; instead of &quot;Kasia&quot;)</li>
                    <li>Check spelling with Polish letters (a with ogonek, e with ogonek, l with stroke, etc.)</li>
                    <li>Some modern or foreign names don&apos;t have traditional name days</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Popular names to try:</p>
          <div className="flex flex-wrap gap-2">
            {popularNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSuggestionClick(name)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-accent/10 hover:text-accent transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
