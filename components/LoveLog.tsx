
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry, WordType } from '../types';
import { ICONS } from '../constants';

interface LoveLogProps {
  profile: Profile;
}

const LoveLog: React.FC<LoveLogProps> = ({ profile }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [filter, setFilter] = useState<WordType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [profile]);

  const fetchEntries = async () => {
    // Also fetch words from the partner if linked
    const query = supabase
      .from('dictionary')
      .select('*')
      .or(`user_id.eq.${profile.id}${profile.linked_user_id ? `,user_id.eq.${profile.linked_user_id}` : ''}`)
      .order('unlocked_at', { ascending: false });

    const { data } = await query;
    if (data) setEntries(data);
    setLoading(false);
  };

  const filtered = entries.filter(e => {
    const matchesFilter = filter === 'all' || e.word_type === filter;
    const matchesSearch = e.word.toLowerCase().includes(search.toLowerCase()) || 
                          e.translation.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getImportanceColor = (rank: number) => {
    if (rank >= 80) return 'text-rose-600 bg-rose-50';
    if (rank >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="h-full flex flex-col bg-[#fdfcfd]">
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold font-header flex items-center gap-2">
              Love Log <span className="text-rose-300 text-sm">({entries.length} Unlocked)</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">Your combined dictionary of Polish discoveries.</p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="noun">Nouns</option>
              <option value="verb">Verbs</option>
              <option value="adjective">Adjectives</option>
              <option value="phrase">Phrases</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-pulse">
                <div className="h-6 w-24 bg-gray-100 rounded mb-4"></div>
                <div className="h-4 w-16 bg-gray-50 rounded"></div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-40">
              <ICONS.Book className="w-16 h-16 mb-4" />
              <p>No words found in your collection yet.</p>
            </div>
          ) : (
            filtered.map((entry) => (
              <div 
                key={entry.id} 
                className="group bg-white border border-gray-100 hover:border-rose-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${getImportanceColor(entry.importance)}`}>
                    Rank {entry.importance}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">{entry.word_type}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-rose-500 transition-colors">
                  {entry.word}
                </h3>
                <p className="text-gray-500 font-medium italic">{entry.translation}</p>
                
                {entry.context && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs text-gray-400 italic">"{entry.context}"</p>
                  </div>
                )}

                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoveLog;
