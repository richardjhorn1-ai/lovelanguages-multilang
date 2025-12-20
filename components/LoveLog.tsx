
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
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
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState<{ [key: string]: number }>({});

  useEffect(() => { fetchEntries(); }, [profile]);

  const fetchEntries = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;
    const { data } = await supabase
      .from('dictionary')
      .select('id, user_id, word, translation, word_type, importance, context, unlocked_at')
      .eq('user_id', targetUserId)
      .order('unlocked_at', { ascending: false });
    
    if (data) setEntries(data as DictionaryEntry[]);
    setLoading(false);
  };

  const handleHarvest = async () => {
    setIsHarvesting(true);
    try {
      const { data: messages } = await supabase.from('messages').select('role, content').order('created_at', { ascending: false }).limit(100);
      if (!messages || messages.length === 0) return;

      const knownWords = entries.map(e => e.word.toLowerCase());
      const harvested = await geminiService.analyzeHistory(messages.reverse(), knownWords);

      if (harvested.length > 0) {
        // Map to DB schema
        const wordsToSave = harvested.map(w => ({
          user_id: profile.id,
          word: String(w.word).toLowerCase().trim(),
          translation: String(w.translation),
          word_type: w.type as WordType,
          importance: Number(w.importance) || 1,
          context: JSON.stringify({ 
            original: w.context, 
            examples: w.examples || [],
            root: w.rootWord || w.word 
          }),
          unlocked_at: new Date().toISOString()
        }));

        // USE UPSERT TO FIX 409 CONFLICT (Duplicate Key Error)
        // This ensures if a word exists, we just update it (or ignore) instead of crashing
        const { error } = await supabase
          .from('dictionary')
          .upsert(wordsToSave, { 
            onConflict: 'user_id,word',
            ignoreDuplicates: false 
          });

        if (error) throw error;
        await fetchEntries();
      }
    } catch (e: any) {
      console.error("Harvesting failed:", e);
      // We don't alert for duplicates anymore as upsert handles it, but keep for other errors
      if (e.code !== '23505') alert(`Harvest error: ${e.message}`);
    } finally {
      setIsHarvesting(false);
    }
  };

  const filtered = entries.filter(e => {
    const matchesFilter = filter === 'all' || e.word_type === filter;
    const matchesSearch = e.word.toLowerCase().includes(search.toLowerCase()) || 
                          e.translation.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const parseContext = (ctxStr: any) => {
    const fallback = { original: '', examples: [] as string[], root: '' };
    if (!ctxStr) return fallback;
    try {
      const parsed = typeof ctxStr === 'string' ? JSON.parse(ctxStr) : ctxStr;
      return {
        original: parsed?.original || '',
        examples: Array.isArray(parsed?.examples) ? parsed.examples : [],
        root: parsed?.root || ''
      };
    } catch {
      return { ...fallback, original: String(ctxStr) };
    }
  };

  const getVerbFormsFound = (root: string) => {
    if (!root) return [];
    return entries.filter(e => {
      const ctx = parseContext(e.context);
      return (ctx.root?.toLowerCase() === root.toLowerCase() || e.word.toLowerCase() === root.toLowerCase()) && e.word_type === 'verb';
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#fdfcfd]">
      {/* ULTRA COMPACT HEADER */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF4761] p-2 rounded-xl shadow-lg shadow-rose-100">
              <ICONS.Book className="text-white w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-800 font-header">The Love Log</h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-rose-100" />
            </div>
            <button onClick={handleHarvest} disabled={isHarvesting} className="bg-[#FF4761] hover:bg-rose-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 disabled:opacity-50 transition-all flex items-center gap-2">
              <ICONS.Sparkles className={`w-3.5 h-3.5 ${isHarvesting ? 'animate-spin' : ''}`} />
              {isHarvesting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'noun', 'verb', 'adjective', 'phrase'] as (WordType | 'all')[]).map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border-2 transition-all whitespace-nowrap ${filter === t ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-rose-100'}`}>{t}s</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#fcf9f9]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map(e => {
            const isFlipped = flippedId === e.id;
            const ctx = parseContext(e.context);
            const examples = [ctx.original, ...(ctx.examples || [])].filter(Boolean);
            const currentIdx = carouselIdx[e.id] || 0;
            const formsFound = e.word_type === 'verb' ? getVerbFormsFound(ctx.root || e.word) : [];

            return (
              <div key={e.id} className="relative h-[280px] w-full perspective-2000" onClick={() => !isFlipped && setFlippedId(e.id)}>
                <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* --- FRONT: COMPACT & BRANDED --- */}
                  <div className="absolute inset-0 bg-white border border-rose-50 rounded-[2rem] p-5 flex flex-col items-center justify-between shadow-sm hover:shadow-lg transition-all backface-hidden">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-200 mt-1">{e.word_type}</span>
                    
                    <div className="flex flex-col items-center justify-center -translate-y-2 w-full px-2">
                      <h3 className="text-2xl font-black text-[#FF4761] font-header text-center leading-tight break-words w-full">{e.word}</h3>
                      <p className="text-sm text-gray-300 italic mt-2 font-medium text-center truncate w-full">{e.translation}</p>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                       <ICONS.Heart className="w-2 h-2 fill-rose-100" />
                       <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-200">Love Languages</div>
                       <ICONS.Heart className="w-2 h-2 fill-rose-100" />
                    </div>
                  </div>

                  {/* --- BACK: HIGH DENSITY INTEL --- */}
                  <div className="absolute inset-0 bg-[#FF4761] text-white rounded-[2rem] p-5 flex flex-col shadow-xl backface-hidden rotate-y-180 overflow-hidden" onClick={(ev) => { ev.stopPropagation(); setFlippedId(null); }}>
                    <div className="flex justify-between items-center mb-3 border-b border-white/20 pb-1.5">
                        <span className="text-[7px] font-black uppercase tracking-[0.1em] text-white/60">Module Intel</span>
                        <span className="text-[7px] font-bold opacity-80">{new Date(e.unlocked_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                        {/* Usage Section */}
                        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
                          <div className="flex items-center justify-between">
                              <h4 className="text-[7px] font-black uppercase tracking-widest text-white/50">Context</h4>
                              <button 
                                onClick={(ev) => { 
                                  ev.stopPropagation(); 
                                  setCarouselIdx(prev => ({ ...prev, [e.id]: (currentIdx + 1) % examples.length })) 
                                }} 
                                className="bg-white/10 p-1 rounded-lg hover:bg-white/20 transition-all"
                              >
                                  <ICONS.Play className="w-2.5 h-2.5 rotate-180" />
                              </button>
                          </div>
                          <div className="flex-1 bg-black/10 rounded-xl p-3 flex items-center justify-center border border-white/5 overflow-y-auto no-scrollbar">
                              <p className="text-[10px] leading-relaxed font-bold italic text-center">
                                  "{examples[currentIdx] || "Captured in dialogue."}"
                              </p>
                          </div>
                        </div>

                        {/* Mastery Section */}
                        <div className="pt-2 border-t border-white/10">
                          {e.word_type === 'verb' ? (
                            <div className="grid grid-cols-2 gap-1">
                               {['Present', 'Past', 'Future', 'Cmd'].map(tense => {
                                  const isUnlocked = formsFound.some(f => f.word.toLowerCase().includes(tense.toLowerCase())) || tense === 'Present';
                                  return (
                                    <div key={tense} className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all ${isUnlocked ? 'bg-white/15 border-white/40 shadow-sm' : 'bg-black/20 border-transparent opacity-30'}`}>
                                      <span className="text-[6px] font-black uppercase">{tense}</span>
                                      {isUnlocked ? <ICONS.Check className="w-2 h-2" /> : <ICONS.Plus className="w-2 h-2 opacity-50" />}
                                    </div>
                                  )
                               })}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                                  <p className="text-[6px] font-black uppercase text-white/40 mb-0.5">Cupid's Pro-Tip</p>
                                  <p className="text-[9px] font-bold leading-tight">Pair with a wink for 2x effect.</p>
                              </div>
                              <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-white w-2/3" />
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                    
                    <button className="mt-3 py-1 text-[7px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors w-full">Collapse</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .perspective-2000 { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LoveLog;
