
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { speakPolish } from '../services/audio';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordType, WordScore, GiftWord } from '../types';
import { ICONS } from '../constants';

interface LoveLogProps {
  profile: Profile;
}

const STREAK_TO_LEARN = 5;

const LoveLog: React.FC<LoveLogProps> = ({ profile }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [giftedWordsMap, setGiftedWordsMap] = useState<Map<string, GiftWord>>(new Map());
  const [filter, setFilter] = useState<WordType | 'all' | 'gifts'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState<{ [key: string]: number }>({});
  const [formsModalId, setFormsModalId] = useState<string | null>(null);
  const [activeTenseTab, setActiveTenseTab] = useState<'present' | 'past' | 'future'>('present');
  const [unlockDialogTense, setUnlockDialogTense] = useState<'past' | 'future' | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');

  useEffect(() => { fetchEntries(); }, [profile]);

  const fetchEntries = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;

    // Fetch dictionary entries
    const { data } = await supabase
      .from('dictionary')
      .select('id, user_id, word, translation, word_type, importance, context, unlocked_at')
      .eq('user_id', targetUserId)
      .order('unlocked_at', { ascending: false });

    if (data) setEntries(data as DictionaryEntry[]);

    // Fetch scores for mastery badges
    const { data: scoreData } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', targetUserId);

    if (scoreData) {
      const map = new Map<string, WordScore>();
      scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
      setScoresMap(map);
    }

    // Fetch gift words to show "Gift from Partner" badge
    const { data: giftData } = await supabase
      .from('gift_words')
      .select('*')
      .eq('student_id', targetUserId);

    if (giftData) {
      const giftMap = new Map<string, GiftWord>();
      giftData.forEach((g: any) => giftMap.set(g.word_id, g as GiftWord));
      setGiftedWordsMap(giftMap);
    }

    // Get partner name for gift badges
    if (profile.linked_user_id) {
      const { data: partner } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profile.linked_user_id)
        .single();
      if (partner) setPartnerName(partner.full_name);
    }

    setLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      // Fetch unharvested messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, role, content, vocabulary_harvested_at')
        .order('created_at', { ascending: true });

      if (msgError) {
        setSyncMessage('Error fetching messages');
        setIsSyncing(false);
        return;
      }

      const unharvested = messages?.filter(m => !m.vocabulary_harvested_at) || [];

      if (unharvested.length === 0) {
        setSyncMessage('All synced!');
        setTimeout(() => setSyncMessage(null), 3000);
        setIsSyncing(false);
        return;
      }

      const knownWords = entries.map(e => e.word.toLowerCase());
      let totalNewWords = 0;

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < unharvested.length; i += batchSize) {
        const batch = unharvested.slice(i, i + batchSize);
        const messageIds = batch.map(m => m.id);

        const harvested = await geminiService.analyzeHistory(
          batch.map(m => ({ role: m.role, content: m.content })),
          knownWords
        );

        if (harvested.length > 0) {
          // Check which words are truly new
          const harvestedWords = harvested.map(w => w.word.toLowerCase().trim());
          const { data: existingWords } = await supabase
            .from('dictionary')
            .select('word')
            .eq('user_id', profile.id)
            .in('word', harvestedWords);

          const existingSet = new Set((existingWords || []).map(w => w.word.toLowerCase()));
          const newWordCount = harvestedWords.filter(w => !existingSet.has(w)).length;

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
              proTip: w.proTip || '',
              conjugations: (w as any).conjugations || null,
              gender: (w as any).gender || null,
              plural: (w as any).plural || null,
              adjectiveForms: (w as any).adjectiveForms || null
            }),
            unlocked_at: new Date().toISOString()
          }));

          await supabase
            .from('dictionary')
            .upsert(wordsToSave, {
              onConflict: 'user_id,word',
              ignoreDuplicates: false
            });

          // Increment XP for new words
          if (newWordCount > 0) {
            await geminiService.incrementXP(newWordCount);
            totalNewWords += newWordCount;
          }

          harvested.forEach(w => knownWords.push(w.word.toLowerCase()));
        }

        // Mark messages as harvested
        await supabase
          .from('messages')
          .update({ vocabulary_harvested_at: new Date().toISOString() })
          .in('id', messageIds);
      }

      setSyncMessage(totalNewWords > 0
        ? `+${totalNewWords} new word${totalNewWords > 1 ? 's' : ''}!`
        : 'No new words found'
      );
      setTimeout(() => setSyncMessage(null), 3000);
      await fetchEntries();

    } catch (e: any) {
      console.error('Sync failed:', e);
      setSyncMessage('Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  const filtered = entries.filter(e => {
    let matchesFilter = false;
    if (filter === 'all') {
      matchesFilter = true;
    } else if (filter === 'gifts') {
      matchesFilter = giftedWordsMap.has(e.id);
    } else {
      matchesFilter = e.word_type === filter;
    }
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

  const handleUnlockTense = async (entry: DictionaryEntry, tense: 'past' | 'future') => {
    setUnlocking(true);
    try {
      const result = await geminiService.unlockTense(entry.id, entry.word, tense);
      if (result.success) {
        // Refresh entries to get updated data
        await fetchEntries();
        setUnlockDialogTense(null);
        setActiveTenseTab(tense);
      } else {
        alert(result.error || 'Failed to unlock tense');
      }
    } catch (e) {
      console.error('Unlock error:', e);
      alert('Failed to unlock tense. Please try again.');
    } finally {
      setUnlocking(false);
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
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all disabled:opacity-50"
              title="Sync vocabulary from conversations"
            >
              <ICONS.RefreshCw className={`w-4 h-4 text-rose-500 ${isSyncing ? 'animate-spin' : ''}`} />
              {syncMessage && (
                <span className={`text-[10px] font-bold ${syncMessage.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
                  {syncMessage}
                </span>
              )}
            </button>
            <span className="text-[10px] font-bold text-gray-400">{entries.length} words</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'noun', 'verb', 'adjective', 'phrase'] as (WordType | 'all')[]).map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border-2 transition-all whitespace-nowrap ${filter === t ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-rose-100'}`}>{t}s</button>
          ))}
          {giftedWordsMap.size > 0 && (
            <button
              onClick={() => setFilter('gifts')}
              className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border-2 transition-all whitespace-nowrap flex items-center gap-1 ${
                filter === 'gifts'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 border-rose-500 text-white shadow-md'
                  : 'bg-white border-gray-100 text-gray-400 hover:border-rose-100'
              }`}
            >
              <ICONS.Heart className="w-3 h-3" /> Gifts
            </button>
          )}
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

            // Get mastery status for this word
            const score = scoresMap.get(e.id);
            const isLearned = score?.learned_at != null;
            const currentStreak = score?.correct_streak || 0;

            // Check if this is a gifted word
            const giftData = giftedWordsMap.get(e.id);
            const isGifted = !!giftData;

            return (
              <div key={e.id} className="relative h-[280px] w-full perspective-2000" onClick={() => !isFlipped && setFlippedId(e.id)}>
                <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>

                  {/* === FRONT === */}
                  <div className={`absolute inset-0 bg-white border rounded-[1.5rem] p-5 flex flex-col shadow-sm hover:shadow-md transition-all backface-hidden overflow-hidden ${
                    isGifted ? 'border-rose-200 ring-2 ring-rose-100' : 'border-rose-100'
                  }`}>
                    {/* Gift Badge - top left corner */}
                    {isGifted && (
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-rose-100 to-amber-100 px-2 py-1 rounded-full"
                        title={`Gift from ${partnerName || 'your partner'}`}
                      >
                        <ICONS.Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        <span className="text-[9px] font-bold text-rose-600">Gift</span>
                      </div>
                    )}

                    {/* Mastery Badge - top right corner */}
                    {isLearned && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center" title="Mastered!">
                        <ICONS.Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {!isLearned && currentStreak > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full" title={`${currentStreak}/${STREAK_TO_LEARN} correct in a row`}>
                        <span className="text-[10px] font-black text-amber-600">{currentStreak}/{STREAK_TO_LEARN}</span>
                        <ICONS.Zap className="w-3 h-3 text-amber-500" />
                      </div>
                    )}

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
                {/* VERB: Tabbed Conjugation Tables */}
                {entry.word_type === 'verb' && ctx.conjugations && (
                  <div className="space-y-4">
                    {/* Tense Tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                      {(['present', 'past', 'future'] as const).map(tense => {
                        const isPresent = tense === 'present';
                        const tenseData = ctx.conjugations?.[tense];
                        const isUnlocked = isPresent || (tenseData && tenseData.unlockedAt);
                        const isActive = activeTenseTab === tense;

                        return (
                          <button
                            key={tense}
                            onClick={() => {
                              if (isUnlocked) {
                                setActiveTenseTab(tense);
                              } else {
                                setUnlockDialogTense(tense as 'past' | 'future');
                              }
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                              isActive
                                ? 'bg-white text-[#FF4761] shadow-sm'
                                : isUnlocked
                                  ? 'text-gray-500 hover:bg-white/50'
                                  : 'text-gray-400 hover:bg-white/30'
                            }`}
                          >
                            {!isUnlocked && <ICONS.Lock className="w-3 h-3" />}
                            {tense}
                            {isUnlocked && !isPresent && <span className="text-green-500 text-[8px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Tense Content */}
                    {(() => {
                      const tenseData = ctx.conjugations?.[activeTenseTab];
                      const isPresent = activeTenseTab === 'present';
                      const isUnlocked = isPresent || (tenseData && tenseData.unlockedAt);

                      if (!isUnlocked) {
                        return (
                          <div className="text-center py-8">
                            <ICONS.Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm mb-4">
                              {activeTenseTab === 'past' ? 'Past' : 'Future'} tense is locked
                            </p>
                            <button
                              onClick={() => setUnlockDialogTense(activeTenseTab as 'past' | 'future')}
                              className="px-4 py-2 bg-[#FF4761] text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all"
                            >
                              Unlock {activeTenseTab === 'past' ? 'Past' : 'Future'} Tense
                            </button>
                          </div>
                        );
                      }

                      // Present tense - simple format
                      if (isPresent && tenseData) {
                        return (
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
                        );
                      }

                      // Past tense - with gender
                      if (activeTenseTab === 'past' && tenseData) {
                        return (
                          <div className="bg-gray-50 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Person</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Masc.</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Fem.</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {[
                                  { label: 'ja (I)', data: tenseData.ja },
                                  { label: 'ty (you)', data: tenseData.ty },
                                  { label: 'on/ona', data: tenseData.onOna },
                                  { label: 'my (we)', data: tenseData.my },
                                  { label: 'wy (you pl.)', data: tenseData.wy },
                                  { label: 'oni/one', data: tenseData.oni }
                                ].map(row => (
                                  <tr key={row.label} className="hover:bg-gray-100/50">
                                    <td className="px-3 py-2 text-gray-500 text-xs">{row.label}</td>
                                    <td className="px-3 py-2 font-bold text-[#FF4761] text-sm">
                                      {typeof row.data === 'object' ? row.data?.masculine : row.data || '—'}
                                    </td>
                                    <td className="px-3 py-2 font-bold text-rose-400 text-sm">
                                      {typeof row.data === 'object' ? row.data?.feminine : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {tenseData.unlockedAt && (
                              <p className="text-[9px] text-gray-400 text-center py-2">
                                Unlocked {new Date(tenseData.unlockedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        );
                      }

                      // Future tense - simple format
                      if (activeTenseTab === 'future' && tenseData) {
                        return (
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
                            {tenseData.unlockedAt && (
                              <p className="text-[9px] text-gray-400 text-center py-2">
                                Unlocked {new Date(tenseData.unlockedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Unlock Dialog */}
                    {unlockDialogTense && (
                      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => !unlocking && setUnlockDialogTense(null)}>
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <ICONS.Lock className="w-8 h-8 text-[#FF4761]" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                              Unlock {unlockDialogTense === 'past' ? 'Past' : 'Future'} Tense?
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                              Ready to learn how to say <strong className="text-[#FF4761]">{entry.word}</strong> in the {unlockDialogTense} tense?
                              {unlockDialogTense === 'past' && " You'll see both masculine and feminine forms."}
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setUnlockDialogTense(null)}
                                disabled={unlocking}
                                className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                              >
                                Not Yet
                              </button>
                              <button
                                onClick={() => handleUnlockTense(entry, unlockDialogTense)}
                                disabled={unlocking}
                                className="flex-1 py-3 px-4 bg-[#FF4761] text-white rounded-xl font-bold hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {unlocking ? (
                                  <>
                                    <span className="animate-spin">⏳</span>
                                    Unlocking...
                                  </>
                                ) : (
                                  'Unlock Now'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
