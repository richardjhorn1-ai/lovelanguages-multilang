
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
    // We select specific columns to avoid 'root_word' if it doesn't exist in the DB
    const { data, error } = await supabase
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
        const wordsToSave = harvested.map(w => ({
          user_id: profile.id,
          word: w.word,
          translation: w.translation,
          word_type: w.type,
          importance: w.importance,
          // FIX: Store root word inside context JSON to avoid schema errors
          context: JSON.stringify({ 
            original: w.context, 
            examples: w.examples || [],
            root: w.rootWord || w.word 
          }),
          unlocked_at: new Date().toISOString()
        }));

        await supabase.from('dictionary').insert(wordsToSave);
        await fetchEntries();
      }
    } catch (e: any) {
      console.error("Harvesting failed:", e);
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

  // Robust parsing to fix the null reference error
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
      <div className="p-6 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3 font-header">
              <div className="bg-[#FF4761] p-2 rounded-2xl shadow-lg shadow-rose-100">
                <ICONS.Book className="text-white w-6 h-6" />
              </div>
              Love Log
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 mt-2 ml-1">The Vault of Mastery</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dictionary..." className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-rose-100" />
            </div>
            <button onClick={handleHarvest} disabled={isHarvesting} className="bg-[#FF4761] hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 disabled:opacity-50 transition-all flex items-center gap-2">
              <ICONS.Sparkles className={`w-4 h-4 ${isHarvesting ? 'animate-spin' : ''}`} />
              {isHarvesting ? 'Harvesting...' : 'Review Chats'}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'noun', 'verb', 'adjective', 'phrase'] as (WordType | 'all')[]).map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${filter === t ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-rose-100'}`}>{t}s</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-[#fcf9f9]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map(e => {
            const isFlipped = flippedId === e.id;
            const ctx = parseContext(e.context);
            const examples = [ctx.original, ...(ctx.examples || [])].filter(Boolean);
            const currentIdx = carouselIdx[e.id] || 0;
            const formsFound = e.word_type === 'verb' ? getVerbFormsFound(ctx.root || e.word) : [];

            return (
              <div key={e.id} className="relative h-80 w-full perspective-1000" onClick={() => !isFlipped && setFlippedId(e.id)}>
                <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* --- FRONT: CLEAN & MASSIVE TYPOGRAPHY --- */}
                  <div className="absolute inset-0 bg-white border border-rose-100 rounded-[2.5rem] p-8 flex flex-col justify-center items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all backface-hidden cursor-pointer">
                    <span className="absolute top-8 left-10 text-[9px] font-black uppercase tracking-[0.5em] text-rose-300">{e.word_type}</span>
                    <h3 className="text-5xl font-black text-[#FF4761] font-header text-center break-words px-4 leading-[1.1]">{e.word}</h3>
                    <p className="text-xl text-gray-400 italic mt-6 font-medium">{e.translation}</p>
                    <div className="absolute bottom-10 text-[8px] font-black uppercase tracking-[0.4em] text-gray-200">
                      Discovery Log • {new Date(e.unlocked_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* --- BACK: DUAL COLUMN HIGH-FIDELITY --- */}
                  <div className="absolute inset-0 bg-[#FF4761] text-white rounded-[2.5rem] p-8 flex flex-col shadow-2xl backface-hidden rotate-y-180 overflow-hidden" onClick={(ev) => { ev.stopPropagation(); setFlippedId(null); }}>
                    <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Intelligence Hub</span>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                           <span className="text-[10px] font-bold">Active Module</span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-6">
                      {/* Left Column: Context Explorer */}
                      <div className="col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-white/50">Context Carousel</h4>
                            <button 
                              onClick={(ev) => { 
                                ev.stopPropagation(); 
                                setCarouselIdx(prev => ({ ...prev, [e.id]: (currentIdx + 1) % examples.length })) 
                              }} 
                              className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all active:scale-90"
                            >
                                <ICONS.Play className="w-3 h-3 rotate-180" />
                            </button>
                        </div>
                        <div className="bg-black/10 rounded-2xl p-6 min-h-[140px] flex items-center shadow-inner border border-white/5">
                            <p className="text-sm leading-relaxed font-bold italic tracking-wide">
                                "{examples[currentIdx] || "Found in a recent lesson with Cupid."}"
                            </p>
                        </div>
                        <div className="flex justify-center gap-2">
                           {examples.map((_, i) => (
                             <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} />
                           ))}
                        </div>
                      </div>

                      {/* Right Column: Mastery Track */}
                      <div className="col-span-5 space-y-5 border-l border-white/10 pl-6">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-white/50">
                          {e.word_type === 'verb' ? 'Grammar Grid' : 'Usage Insight'}
                        </h4>
                        
                        {e.word_type === 'verb' ? (
                          <div className="grid grid-cols-1 gap-2.5">
                             {['Present', 'Past', 'Future', 'Cmd'].map(tense => {
                                const isUnlocked = formsFound.some(f => f.word.toLowerCase().includes(tense.toLowerCase())) || tense === 'Present';
                                return (
                                  <div key={tense} className={`flex items-center justify-between px-3 py-3 rounded-xl border transition-all ${isUnlocked ? 'bg-white/15 border-white/40 shadow-sm' : 'bg-black/20 border-transparent opacity-30'}`}>
                                    <span className="text-[9px] font-black uppercase tracking-wider">{tense}</span>
                                    {isUnlocked ? <ICONS.Check className="w-3.5 h-3.5" /> : <ICONS.Plus className="w-3.5 h-3.5 opacity-50" />}
                                  </div>
                                )
                             })}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 shadow-lg">
                                <p className="text-[8px] font-black uppercase text-white/40 mb-2">Cupid's Note</p>
                                <p className="text-[12px] font-bold leading-snug">This {e.word_type} pairs beautifully with your current progress. Use it to impress!</p>
                            </div>
                            <div className="pt-2">
                               <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] font-black uppercase text-white/60">Mastery</span>
                                  <span className="text-[9px] font-black">100%</span>
                               </div>
                               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-white w-full shadow-[0_0_12px_white]" />
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button className="mt-4 py-2 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-colors w-full">Tap to Close</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LoveLog;
