
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { speak } from '../services/audio';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordType, WordScore, GiftWord } from '../types';
import { ICONS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getConjugationPersons } from '../constants/language-config';
import { sounds } from '../services/sounds';

interface LoveLogProps {
  profile: Profile;
}

const STREAK_TO_LEARN = 5;

const LoveLog: React.FC<LoveLogProps> = ({ profile }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [giftedWordsMap, setGiftedWordsMap] = useState<Map<string, GiftWord>>(new Map());
  const [activeFilters, setActiveFilters] = useState<Set<WordType>>(new Set());
  const [showGiftsOnly, setShowGiftsOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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

  // Theme
  const { accentHex } = useTheme();

  // Language
  const { targetLanguage, languageParams } = useLanguage();
  const { t } = useTranslation();

  // Get dynamic pronouns for the target language
  const pronouns = getConjugationPersons(targetLanguage);

  useEffect(() => { fetchEntries(); }, [profile, targetLanguage]);

  // Listen for dictionary updates from other components (e.g., Listen Mode word extraction)
  useEffect(() => {
    const handleDictionaryUpdate = (event: CustomEvent) => {
      console.log('Dictionary updated, refreshing Love Log...', event.detail);
      fetchEntries();
    };
    window.addEventListener('dictionary-updated', handleDictionaryUpdate as EventListener);
    return () => window.removeEventListener('dictionary-updated', handleDictionaryUpdate as EventListener);
  }, []);

  // Listen for language switch events from Profile settings
  useEffect(() => {
    const handleLanguageSwitch = () => {
      console.log('Language switched, refreshing Love Log...');
      fetchEntries();
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, []);

  const fetchEntries = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;

    // Fetch dictionary entries filtered by target language
    const { data } = await supabase
      .from('dictionary')
      .select('id, user_id, word, translation, word_type, pronunciation, gender, plural, conjugations, adjective_forms, example_sentence, pro_tip, notes, source, language_code, created_at')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage)
      .order('created_at', { ascending: false });

    if (data) setEntries(data as DictionaryEntry[]);

    // Fetch scores for mastery badges (filtered by language)
    const { data: scoreData } = await supabase
      .from('word_scores')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage);

    if (scoreData) {
      const map = new Map<string, WordScore>();
      scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
      setScoresMap(map);
    }

    // Fetch gift words to show "Gift from Partner" badge (filtered by language)
    const { data: giftData } = await supabase
      .from('gift_words')
      .select('*')
      .eq('student_id', targetUserId)
      .eq('language_code', targetLanguage);

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
        setSyncMessage(t('loveLog.sync.errorFetching'));
        setIsSyncing(false);
        return;
      }

      const unharvested = messages?.filter(m => !m.vocabulary_harvested_at) || [];

      if (unharvested.length === 0) {
        setSyncMessage(t('loveLog.sync.allSynced'));
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
          // Check which words already exist to handle tense merging
          const harvestedWords = harvested.map(w => w.word.toLowerCase().trim());
          const { data: existingEntries } = await supabase
            .from('dictionary')
            .select('word, conjugations, gender, plural, adjective_forms')
            .eq('user_id', profile.id)
            .in('word', harvestedWords);

          // Create a map of existing words with their data
          const existingMap = new Map<string, any>();
          (existingEntries || []).forEach(e => {
            existingMap.set(e.word.toLowerCase(), {
              conjugations: e.conjugations,
              gender: e.gender,
              plural: e.plural,
              adjective_forms: e.adjective_forms
            });
          });

          const newWordCount = harvestedWords.filter(w => !existingMap.has(w)).length;

          const wordsToSave = harvested.map(w => {
            const wordKey = String(w.word).toLowerCase().trim();
            const existing = existingMap.get(wordKey);
            const newConjugations = (w as any).conjugations || null;

            // Merge conjugations if word exists and both have conjugation data
            let mergedConjugations = newConjugations;
            if (existing?.conjugations && newConjugations) {
              mergedConjugations = {
                present: newConjugations.present || existing.conjugations.present,
                past: existing.conjugations.past || newConjugations.past || null,
                future: existing.conjugations.future || newConjugations.future || null,
              };
            }

            return {
              user_id: profile.id,
              word: wordKey,
              translation: String(w.translation),
              word_type: w.type as WordType,
              pronunciation: (w as any).pronunciation || null,
              gender: (w as any).gender || existing?.gender || null,
              plural: (w as any).plural || existing?.plural || null,
              conjugations: mergedConjugations,
              adjective_forms: (w as any).adjectiveForms || existing?.adjective_forms || null,
              example_sentence: (w as any).examples?.[0] || null,
              pro_tip: w.proTip || null,
              notes: w.context || null,
              language_code: targetLanguage,
              source: 'listen'
            };
          });

          await supabase
            .from('dictionary')
            .upsert(wordsToSave, {
              onConflict: 'user_id,word,language_code',
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

      // Play new words sound if words were found
      if (totalNewWords > 0) {
        sounds.play('new-words');
      }
      setSyncMessage(totalNewWords > 0
        ? t('loveLog.sync.newWords', { count: totalNewWords })
        : t('loveLog.sync.noNewWords')
      );
      setTimeout(() => setSyncMessage(null), 3000);
      await fetchEntries();

    } catch (e: any) {
      console.error('Sync failed:', e);
      setSyncMessage(t('loveLog.sync.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleFilter = (wordType: WordType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(wordType)) {
        next.delete(wordType);
      } else {
        next.add(wordType);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setShowGiftsOnly(false);
  };

  const hasActiveFilters = activeFilters.size > 0 || showGiftsOnly;

  const filtered = entries.filter(e => {
    // Word type filter (if any active, entry must match one of them)
    const matchesWordType = activeFilters.size === 0 || activeFilters.has(e.word_type);

    // Gifts filter
    const matchesGifts = !showGiftsOnly || giftedWordsMap.has(e.id);

    // Text search
    const matchesSearch = e.word.toLowerCase().includes(search.toLowerCase()) ||
                          e.translation.toLowerCase().includes(search.toLowerCase());

    return matchesWordType && matchesGifts && matchesSearch;
  });

  // Extract context data directly from entry columns (new schema)
  const getEntryContext = (entry: DictionaryEntry) => {
    return {
      original: entry.example_sentence || '',
      examples: entry.example_sentence ? [entry.example_sentence] : [],
      root: entry.word,
      proTip: entry.pro_tip || '',
      conjugations: entry.conjugations || null,
      gender: entry.gender || null,
      plural: entry.plural || null,
      adjectiveForms: entry.adjective_forms || null
    };
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
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <div className="px-3 md:px-6 py-3 md:py-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Compact single row with title and icons */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[var(--accent-color)] p-1.5 rounded-lg shadow-md">
                <ICONS.Book className="text-white w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-[var(--text-primary)] font-header">{t('loveLog.title')}</h2>
              <span className="text-[9px] font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-full">{entries.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Mobile search toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`p-2 rounded-lg transition-all ${showMobileSearch ? 'bg-[var(--accent-light)]' : 'hover:bg-[var(--bg-primary)]'}`}
              >
                <ICONS.Search className={`w-4 h-4 ${showMobileSearch ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'}`} />
              </button>
              {/* Mobile sync button - scans chat history for new words */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-2 bg-[var(--accent-light)] rounded-lg transition-all disabled:opacity-50"
                title={t('loveLog.sync.scanTooltip')}
              >
                <ICONS.RefreshCw className={`w-4 h-4 text-[var(--accent-color)] ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile: Expandable search */}
          {showMobileSearch && (
            <div className="md:hidden mt-2">
              <div className="relative">
                <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] w-3.5 h-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('loveLog.searchWords')}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary)] rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-[var(--accent-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Desktop: Original layout */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--accent-color)] p-2 rounded-xl shadow-lg shadow-[var(--accent-shadow)]">
                <ICONS.Book className="text-white w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)] font-header">{t('loveLog.titleFull')}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] w-3.5 h-3.5" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('loveLog.search')} className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary)] rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-[var(--accent-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-light)] hover:bg-[var(--accent-light-hover)] rounded-xl transition-all disabled:opacity-50"
                title={t('loveLog.sync.scanTooltip')}
              >
                <ICONS.RefreshCw className={`w-4 h-4 text-[var(--accent-color)] ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-bold text-[var(--accent-color)]">
                  {syncMessage || t('loveLog.sync.scanChats')}
                </span>
              </button>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">{t('loveLog.wordsCount', { count: entries.length })}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-2 md:mt-3 flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['noun', 'verb', 'adjective', 'adverb', 'phrase'] as WordType[]).map(f => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.08em] md:tracking-[0.1em] border md:border-2 transition-all whitespace-nowrap ${
                activeFilters.has(f)
                  ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-md'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-border)]'
              }`}
            >
              {t(`loveLog.filters.${f}`)}s
            </button>
          ))}
          {giftedWordsMap.size > 0 && (
            <button
              onClick={() => setShowGiftsOnly(!showGiftsOnly)}
              className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.08em] md:tracking-[0.1em] border md:border-2 transition-all whitespace-nowrap flex items-center gap-1 ${
                showGiftsOnly
                  ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-md'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-border)]'
              }`}
            >
              <ICONS.Heart className="w-2.5 h-2.5 md:w-3 md:h-3" /> {t('loveLog.filters.gifts')}
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.08em] md:tracking-[0.1em] border md:border-2 transition-all whitespace-nowrap flex items-center gap-1 bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
            >
              <ICONS.X className="w-2.5 h-2.5 md:w-3 md:h-3" /> {t('loveLog.filters.clear')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-5">
          {filtered.map(e => {
            const isFlipped = flippedId === e.id;
            const ctx = getEntryContext(e);
            const examples = ctx.examples?.length ? ctx.examples : (ctx.original ? [ctx.original] : []);
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
              <div key={e.id} className="relative h-[200px] md:h-[280px] w-full perspective-2000" onClick={() => !isFlipped && setFlippedId(e.id)}>
                <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>

                  {/* === FRONT === */}
                  <div className={`absolute inset-0 bg-[var(--bg-card)] border rounded-xl md:rounded-[1.5rem] p-3 md:p-5 flex flex-col shadow-sm hover:shadow-md transition-all backface-hidden overflow-hidden ${
                    isGifted ? 'border-[var(--accent-border)] ring-1 md:ring-2 ring-[var(--accent-border)]' : 'border-[var(--border-color)]'
                  }`}>
                    {/* Gift Badge - top left corner */}
                    {isGifted && (
                      <div
                        className="absolute top-2 md:top-3 left-2 md:left-3 flex items-center gap-0.5 md:gap-1 bg-[var(--accent-light)] px-1.5 md:px-2 py-0.5 md:py-1 rounded-full"
                        title={t('loveLog.card.giftFrom', { name: partnerName || t('loveLog.card.yourPartner') })}
                      >
                        <ICONS.Heart className="w-2.5 h-2.5 md:w-3 md:h-3 text-[var(--accent-color)] fill-[var(--accent-color)]" />
                        <span className="text-[7px] md:text-[9px] font-bold text-[var(--accent-color)]">{t('loveLog.card.gift')}</span>
                      </div>
                    )}

                    {/* Mastery Badge - top right corner */}
                    {isLearned && (
                      <div className="absolute top-2 md:top-3 right-2 md:right-3 w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" title={t('loveLog.card.mastered')}>
                        <ICONS.Check className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    {!isLearned && currentStreak > 0 && (
                      <div className="absolute top-2 md:top-3 right-2 md:right-3 flex items-center gap-0.5 md:gap-1 bg-[var(--accent-light)] px-1.5 md:px-2 py-0.5 md:py-1 rounded-full" title={t('loveLog.card.streakProgress', { current: currentStreak, target: STREAK_TO_LEARN })}>
                        <span className="text-[8px] md:text-[10px] font-black text-[var(--accent-color)]">{currentStreak}/{STREAK_TO_LEARN}</span>
                        <ICONS.Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-[var(--accent-color)]" />
                      </div>
                    )}

                    {/* Word type pill */}
                    <div className="flex justify-center">
                      <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-wider text-[var(--accent-color)] bg-[var(--accent-light)] px-2 md:px-3 py-0.5 md:py-1 rounded-full">{e.word_type}</span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full text-center gap-1 md:gap-2">
                      <h3 className="text-lg md:text-2xl font-black text-[var(--accent-color)] font-header leading-tight break-words">{e.word}</h3>

                      {/* Audio button */}
                      <button
                        onClick={(ev) => { ev.stopPropagation(); speak(e.word, targetLanguage); }}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--accent-light)] hover:bg-[var(--accent-light-hover)] flex items-center justify-center transition-all group"
                      >
                        <ICONS.Play className="w-3 h-3 md:w-4 md:h-4 text-[var(--accent-color)] translate-x-0.5" />
                      </button>

                      <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium line-clamp-2">{e.translation}</p>
                    </div>

                    {/* Flip hint */}
                    <p className="text-[8px] md:text-[10px] text-[var(--text-secondary)] opacity-50 text-center">{t('loveLog.card.tapForDetails')}</p>
                  </div>

                  {/* === BACK === */}
                  <div className="absolute inset-0 bg-[var(--accent-color)] text-white rounded-xl md:rounded-[1.5rem] p-2.5 md:p-4 flex flex-col shadow-xl backface-hidden rotate-y-180 overflow-hidden" onClick={(ev) => { ev.stopPropagation(); setFlippedId(null); }}>
                    {/* Header with word and audio */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{e.word}</span>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); speak(e.word, targetLanguage); }}
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
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{t('loveLog.card.example')}</span>
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
                          "{examples[currentIdx] || t('loveLog.card.noExample')}"
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
                        {e.word_type === 'verb' ? t('loveLog.card.conjugations') : t('loveLog.card.forms')}
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
        const ctx = getEntryContext(entry);

        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setFormsModalId(null)}
          >
            <div
              className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(ev) => ev.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[var(--accent-color)] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{entry.word}</span>
                  <button
                    onClick={() => speak(entry.word, targetLanguage)}
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
                    <div className="flex gap-1 bg-[var(--bg-primary)] rounded-xl p-1">
                      {(['present', 'past', 'future'] as const).map(tense => {
                        const isPresent = tense === 'present';
                        const tenseData = ctx.conjugations?.[tense] as any;
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
                                ? 'bg-[var(--bg-card)] text-[var(--accent-color)] shadow-sm'
                                : isUnlocked
                                  ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50'
                                  : 'text-[var(--text-secondary)] opacity-60 hover:bg-[var(--bg-card)]/30'
                            }`}
                          >
                            {!isUnlocked && <ICONS.Lock className="w-3 h-3" />}
                            {t(`loveLog.modal.${tense}`)}
                            {isUnlocked && !isPresent && <span className="text-green-500 text-[8px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Tense Content */}
                    {(() => {
                      const tenseData = ctx.conjugations?.[activeTenseTab] as any;
                      const isPresent = activeTenseTab === 'present';
                      const isUnlocked = isPresent || (tenseData && tenseData.unlockedAt);

                      if (!isUnlocked) {
                        return (
                          <div className="text-center py-8">
                            <ICONS.Lock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3" />
                            <p className="text-[var(--text-secondary)] text-sm mb-4">
                              {t('loveLog.modal.tenseLocked', { tense: t(`loveLog.modal.${activeTenseTab}`) })}
                            </p>
                            <button
                              onClick={() => setUnlockDialogTense(activeTenseTab as 'past' | 'future')}
                              className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all"
                            >
                              {t('loveLog.modal.unlockTense', { tense: t(`loveLog.modal.${activeTenseTab}`) })}
                            </button>
                          </div>
                        );
                      }

                      // Present tense - simple format
                      if (isPresent && tenseData) {
                        const pronounLabels = [
                          { pronoun: pronouns[0], english: t('loveLog.pronouns.singular1'), key: 'ja' as const },
                          { pronoun: pronouns[1], english: t('loveLog.pronouns.singular2'), key: 'ty' as const },
                          { pronoun: pronouns[2], english: t('loveLog.pronouns.singular3'), key: 'onOna' as const },
                          { pronoun: pronouns[3], english: t('loveLog.pronouns.plural1'), key: 'my' as const },
                          { pronoun: pronouns[4], english: t('loveLog.pronouns.plural2'), key: 'wy' as const },
                          { pronoun: pronouns[5], english: t('loveLog.pronouns.plural3'), key: 'oni' as const }
                        ];
                        return (
                          <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {pronounLabels.map(row => (
                                  <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                                    <td className="px-4 py-2 text-[var(--text-secondary)] text-xs">{row.pronoun} {row.english}</td>
                                    <td className="px-4 py-2 font-bold text-[var(--accent-color)]">{tenseData[row.key] || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      // Past tense - with gender
                      if (activeTenseTab === 'past' && tenseData) {
                        const pronounLabels = [
                          { pronoun: pronouns[0], english: t('loveLog.pronouns.singular1'), key: 'ja' as const },
                          { pronoun: pronouns[1], english: t('loveLog.pronouns.singular2'), key: 'ty' as const },
                          { pronoun: pronouns[2], english: t('loveLog.pronouns.singular3'), key: 'onOna' as const },
                          { pronoun: pronouns[3], english: t('loveLog.pronouns.plural1'), key: 'my' as const },
                          { pronoun: pronouns[4], english: t('loveLog.pronouns.plural2'), key: 'wy' as const },
                          { pronoun: pronouns[5], english: t('loveLog.pronouns.plural3'), key: 'oni' as const }
                        ];
                        return (
                          <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-[var(--border-color)]/30">
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.person')}</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.masculine')}</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.feminine')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {pronounLabels.map(row => {
                                  const data = tenseData[row.key];
                                  return (
                                    <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                                      <td className="px-3 py-2 text-[var(--text-secondary)] text-xs">{row.pronoun} {row.english}</td>
                                      <td className="px-3 py-2 font-bold text-[var(--accent-color)] text-sm">
                                        {typeof data === 'object' ? data?.masculine : data || '—'}
                                      </td>
                                      <td className="px-3 py-2 font-bold text-[var(--accent-color)] text-sm">
                                        {typeof data === 'object' ? data?.feminine : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {tenseData.unlockedAt && (
                              <p className="text-[9px] text-[var(--text-secondary)] text-center py-2">
                                {t('loveLog.modal.unlocked', { date: new Date(tenseData.unlockedAt).toLocaleDateString() })}
                              </p>
                            )}
                          </div>
                        );
                      }

                      // Future tense - simple format
                      if (activeTenseTab === 'future' && tenseData) {
                        const pronounLabels = [
                          { pronoun: pronouns[0], english: t('loveLog.pronouns.singular1'), key: 'ja' as const },
                          { pronoun: pronouns[1], english: t('loveLog.pronouns.singular2'), key: 'ty' as const },
                          { pronoun: pronouns[2], english: t('loveLog.pronouns.singular3'), key: 'onOna' as const },
                          { pronoun: pronouns[3], english: t('loveLog.pronouns.plural1'), key: 'my' as const },
                          { pronoun: pronouns[4], english: t('loveLog.pronouns.plural2'), key: 'wy' as const },
                          { pronoun: pronouns[5], english: t('loveLog.pronouns.plural3'), key: 'oni' as const }
                        ];
                        return (
                          <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {pronounLabels.map(row => (
                                  <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                                    <td className="px-4 py-2 text-[var(--text-secondary)] text-xs">{row.pronoun} {row.english}</td>
                                    <td className="px-4 py-2 font-bold text-[var(--accent-color)]">{tenseData[row.key] || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {tenseData.unlockedAt && (
                              <p className="text-[9px] text-[var(--text-secondary)] text-center py-2">
                                {t('loveLog.modal.unlocked', { date: new Date(tenseData.unlockedAt).toLocaleDateString() })}
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
                        <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                              <ICONS.Lock className="w-8 h-8 text-[var(--accent-color)]" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                              {t('loveLog.unlock.title', { tense: t(`loveLog.modal.${unlockDialogTense}`) })}
                            </h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-6">
                              {t('loveLog.unlock.descriptionBefore')}{' '}
                              <strong className="text-[var(--accent-color)]">{entry.word}</strong>{' '}
                              {t('loveLog.unlock.descriptionAfter', { tense: unlockDialogTense })}
                              {unlockDialogTense === 'past' && ` ${t('loveLog.unlock.pastNote')}`}
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setUnlockDialogTense(null)}
                                disabled={unlocking}
                                className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold hover:bg-[var(--bg-primary)] transition-all disabled:opacity-50"
                              >
                                {t('loveLog.unlock.notYet')}
                              </button>
                              <button
                                onClick={() => handleUnlockTense(entry, unlockDialogTense)}
                                disabled={unlocking}
                                className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {unlocking ? (
                                  <>
                                    <span className="animate-spin">⏳</span>
                                    {t('loveLog.unlock.unlocking')}
                                  </>
                                ) : (
                                  t('loveLog.unlock.unlockNow')
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
                    <div className="bg-[var(--bg-primary)] rounded-xl p-4">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {ctx.gender && (
                            <tr>
                              <td className="py-2 text-[var(--text-secondary)] text-xs">{t('loveLog.nounForms.gender')}</td>
                              <td className="py-2 font-bold text-[var(--accent-color)] capitalize">{ctx.gender}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-2 text-[var(--text-secondary)] text-xs">{t('loveLog.nounForms.singular')}</td>
                            <td className="py-2 font-bold text-[var(--accent-color)]">{entry.word}</td>
                          </tr>
                          {ctx.plural && (
                            <tr>
                              <td className="py-2 text-[var(--text-secondary)] text-xs">{t('loveLog.nounForms.plural')}</td>
                              <td className="py-2 font-bold text-[var(--accent-color)]">{ctx.plural}</td>
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] mb-2">
                      {t('loveLog.adjectiveForms.title')}
                    </h4>
                    <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {[
                            { label: t('loveLog.adjectiveForms.masculine'), value: ctx.adjectiveForms.masculine, key: 'masculine' },
                            { label: t('loveLog.adjectiveForms.feminine'), value: ctx.adjectiveForms.feminine, key: 'feminine' },
                            { label: t('loveLog.adjectiveForms.neuter'), value: ctx.adjectiveForms.neuter, key: 'neuter' },
                            { label: t('loveLog.adjectiveForms.plural'), value: ctx.adjectiveForms.plural, key: 'plural' }
                          ].map(row => (
                            <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                              <td className="px-4 py-2 text-[var(--text-secondary)] text-xs">{row.label}</td>
                              <td className="px-4 py-2 font-bold text-[var(--accent-color)]">{row.value || '—'}</td>
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
