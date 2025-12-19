
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
    // If tutor, view linked partner's data. 
    // FALLBACK: If no partner linked, or if student, view own data.
    // This allows students to see their own tutor dashboard for testing.
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) 
      ? profile.linked_user_id 
      : profile.id;

    const { data } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId)
      .order('unlocked_at', { ascending: false });

    if (data) setEntries(data);
    setLoading(false);
  };

  const filtered = entries.filter(e => {
    const matchesFilter = filter === 'all' || e.word_type === filter;
    const matchesSearch = e.word.toLowerCase().includes(search.toLowerCase()) || 
                          e.translation.toLowerCase().includes(search.toLowerCase()) ||
                          (e.root_word && e.root_word.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Grouping logic for verbs
  const groupedData: { [key: string]: DictionaryEntry[] } = {};
  const individuals: DictionaryEntry[] = [];

  filtered.forEach(entry => {
    if (entry.root_word && entry.word_type === 'verb') {
      if (!groupedData[entry.root_word]) groupedData[entry.root_word] = [];
      groupedData[entry.root_word].push(entry);
    } else {
      individuals.push(entry);
    }
  });

  const wordTypes: (WordType | 'all')[] = ['all', 'noun', 'verb', 'adjective', 'phrase'];

  return (
    <div className="h-full flex flex-col bg-[#fdfcfd]">
      <div className="p-4 bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                <ICONS.Book className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black font-header text-gray-800 leading-tight">Love Log</h2>
                <p className="text-[9px] uppercase tracking-widest font-black text-rose-300">
                  {profile.role === 'tutor' && profile.linked_user_id ? "Partner's collection" : "Your collection"} • {entries.length} items
                </p>
              </div>
            </div>
            
            <div className="relative w-48 sm:w-64">
              <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-200 font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {wordTypes.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-tighter ${
                  filter === t ? 'bg-[#FF4761] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#fcf9f9]">
        <div className="max-w-6xl mx-auto space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array(8).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm font-bold">No results found.</div>
          ) : (
            <>
              {Object.keys(groupedData).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-rose-300 tracking-widest pl-1">Verb Families</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedData).map(([root, forms]) => (
                      <div key={root} className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-black text-rose-500">ROOT: {root}</h4>
                          <span className="text-[8px] bg-rose-50 text-rose-400 px-1.5 py-0.5 rounded font-black uppercase">{forms.length} forms</span>
                        </div>
                        <div className="space-y-1.5">
                          {forms.map(f => (
                            <div key={f.id} className="flex justify-between items-baseline border-b border-gray-50 pb-1">
                              <span className="text-xs font-bold text-gray-700">{f.word}</span>
                              <span className="text-[10px] text-gray-400 italic font-medium">{f.translation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {individuals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-rose-300 tracking-widest pl-1">Individual Discoveries</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {individuals.map((entry) => (
                      <div key={entry.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col justify-center min-h-[80px] hover:border-rose-100 transition-colors">
                        <span className="text-[7px] font-black uppercase text-gray-300 mb-1">{entry.word_type}</span>
                        <h3 className="text-sm font-black text-gray-800 leading-tight">{entry.word}</h3>
                        <p className="text-[11px] text-gray-500 font-medium italic truncate">{entry.translation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default LoveLog;
