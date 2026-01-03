
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { speakPolish } from '../services/audio';
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
  const [formsModalId, setFormsModalId] = useState<string | null>(null);

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
        const wordsToSave = harvested.map(w => ({
          user_id: profile.id,
          word: String(w.word).toLowerCase().trim(),
          translation: String(w.translation),
          word_type: w.type as WordType,
          importance: Number(w.importance) || 1,
          context: JSON.stringify({
            original: w.context,
            examples: w.examples || [],
            root: w.rootWord || w.word,
            proTip: w.proTip || "",
            // Verb conjugations
            conjugations: w.conjugations || null,
            // Noun properties
            gender: w.gender || null,
            plural: w.plural || null,
            // Adjective forms
            adjectiveForms: w.adjectiveForms || null
          }),
          unlocked_at: new Date().toISOString()
        }));

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
    const fallback = {
      original: '',
      examples: [] as string[],
      root: '',
      proTip: '',
      conjugations: null as any,
      gender: null as string | null,
      plural: null as string | null,
      adjectiveForms: null as any
    };
    if (!ctxStr) return fallback;
    try {
      const parsed = typeof ctxStr === 'string' ? JSON.parse(ctxStr) : ctxStr;
      return {
        original: parsed?.original || '',
        examples: Array.isArray(parsed?.examples) ? parsed.examples : [],
        root: parsed?.root || '',
        proTip: parsed?.proTip || '',
        conjugations: parsed?.conjugations || null,
        gender: parsed?.gender || null,
        plural: parsed?.plural || null,
        adjectiveForms: parsed?.adjectiveForms || null
      };
    } catch {
      return { ...fallback, original: String(ctxStr) };
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#fdfcfd]">
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
            const hasFormsData = e.word_type === 'verb' ? ctx.conjugations :
                                 e.word_type === 'noun' ? (ctx.gender || ctx.plural) :
                                 e.word_type === 'adjective' ? ctx.adjectiveForms : false;

            return (
              <div key={e.id} className="relative h-[280px] w-full perspective-2000" onClick={() => !isFlipped && setFlippedId(e.id)}>
                <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>

                  {/* === FRONT === */}
                  <div className="absolute inset-0 bg-white border border-rose-100 rounded-[1.5rem] p-5 flex flex-col shadow-sm hover:shadow-md transition-all backface-hidden overflow-hidden">
                    {/* Word type pill */}
                    <div className="flex justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-50 px-3 py-1 rounded-full">{e.word_type}</span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full text-center gap-2">
                      <h3 className="text-2xl font-black text-[#FF4761] font-header leading-tight break-words">{e.word}</h3>

                      {/* Audio button */}
                      <button
                        onClick={(ev) => { ev.stopPropagation(); speakPolish(e.word); }}
                        className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-all group"
                      >
                        <ICONS.Play className="w-4 h-4 text-rose-400 group-hover:text-rose-500 translate-x-0.5" />
                      </button>

                      <p className="text-sm text-gray-500 font-medium">{e.translation}</p>
                    </div>

                    {/* Flip hint */}
                    <p className="text-[10px] text-gray-300 text-center">tap for details</p>
                  </div>

                  {/* === BACK === */}
                  <div className="absolute inset-0 bg-[#FF4761] text-white rounded-[1.5rem] p-4 flex flex-col shadow-xl backface-hidden rotate-y-180 overflow-hidden" onClick={(ev) => { ev.stopPropagation(); setFlippedId(null); }}>
                    {/* Header with word and audio */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{e.word}</span>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); speakPolish(e.word); }}
                          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                        >
                          <ICONS.Play className="w-3 h-3 translate-x-0.5" />
                        </button>
                      </div>
                      <span className="text-[10px] opacity-70">{e.translation}</span>
                    </div>

                    {/* Example sentence */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Example</span>
                        {examples.length > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setCarouselIdx(prev => ({ ...prev, [e.id]: (currentIdx - 1 + examples.length) % examples.length }))
                              }}
                              className="opacity-60 hover:opacity-100 transition-all p-0.5"
                            >
                              <ICONS.ChevronLeft className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] opacity-60 min-w-[24px] text-center">
                              {currentIdx + 1}/{examples.length}
                            </span>
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setCarouselIdx(prev => ({ ...prev, [e.id]: (currentIdx + 1) % examples.length }))
                              }}
                              className="opacity-60 hover:opacity-100 transition-all p-0.5"
                            >
                              <ICONS.ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                        <p className="text-[11px] leading-relaxed italic">
                          "{examples[currentIdx] || "No example available."}"
                        </p>
                      </div>
                    </div>

                    {/* Pro-tip - subtle, above forms button */}
                    {ctx.proTip && (
                      <p className="text-[9px] opacity-60 italic text-center px-2 leading-tight">
                        💡 {ctx.proTip}
                      </p>
                    )}

                    {/* Show Forms button */}
                    {hasFormsData && (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setFormsModalId(e.id); }}
                        className="mt-2 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <ICONS.Book className="w-3 h-3" />
                        {e.word_type === 'verb' ? 'Conjugations' : e.word_type === 'noun' ? 'Forms' : 'Forms'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* === FORMS OVERLAY MODAL === */}
      {formsModalId && (() => {
        const entry = entries.find(e => e.id === formsModalId);
        if (!entry) return null;
        const ctx = parseContext(entry.context);

        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setFormsModalId(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(ev) => ev.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#FF4761] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{entry.word}</span>
                  <button
                    onClick={() => speakPolish(entry.word)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    <ICONS.Play className="w-4 h-4 translate-x-0.5" />
                  </button>
                </div>
                <button
                  onClick={() => setFormsModalId(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <ICONS.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {/* VERB: Conjugation Tables */}
                {entry.word_type === 'verb' && ctx.conjugations && (
                  <div className="space-y-4">
                    {(['present', 'past', 'future'] as const).map(tense => {
                      const tenseData = ctx.conjugations?.[tense];
                      if (!tenseData) return null;
                      return (
                        <div key={tense}>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                            {tense === 'present' ? 'Present Tense' : tense === 'past' ? 'Past Tense' : 'Future Tense'}
                          </h4>
                          <div className="bg-gray-50 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-gray-100">
                                {[
                                  { label: 'ja (I)', value: tenseData.ja },
                                  { label: 'ty (you)', value: tenseData.ty },
                                  { label: 'on/ona (he/she)', value: tenseData.onOna },
                                  { label: 'my (we)', value: tenseData.my },
                                  { label: 'wy (you pl.)', value: tenseData.wy },
                                  { label: 'oni/one (they)', value: tenseData.oni }
                                ].map(row => (
                                  <tr key={row.label} className="hover:bg-gray-100/50">
                                    <td className="px-4 py-2 text-gray-500 text-xs">{row.label}</td>
                                    <td className="px-4 py-2 font-bold text-[#FF4761]">{row.value || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* NOUN: Gender + Plural */}
                {entry.word_type === 'noun' && (ctx.gender || ctx.plural) && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100">
                          {ctx.gender && (
                            <tr>
                              <td className="py-2 text-gray-500 text-xs">Gender</td>
                              <td className="py-2 font-bold text-[#FF4761] capitalize">{ctx.gender}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-2 text-gray-500 text-xs">Singular</td>
                            <td className="py-2 font-bold text-[#FF4761]">{entry.word}</td>
                          </tr>
                          {ctx.plural && (
                            <tr>
                              <td className="py-2 text-gray-500 text-xs">Plural</td>
                              <td className="py-2 font-bold text-[#FF4761]">{ctx.plural}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADJECTIVE: Gender Forms */}
                {entry.word_type === 'adjective' && ctx.adjectiveForms && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                      Gender Forms
                    </h4>
                    <div className="bg-gray-50 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { label: 'Masculine', value: ctx.adjectiveForms.masculine },
                            { label: 'Feminine', value: ctx.adjectiveForms.feminine },
                            { label: 'Neuter', value: ctx.adjectiveForms.neuter },
                            { label: 'Plural', value: ctx.adjectiveForms.plural }
                          ].map(row => (
                            <tr key={row.label} className="hover:bg-gray-100/50">
                              <td className="px-4 py-2 text-gray-500 text-xs">{row.label}</td>
                              <td className="px-4 py-2 font-bold text-[#FF4761]">{row.value || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
