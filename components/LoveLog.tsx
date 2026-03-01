
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { speak } from '../services/audio';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordType, WordScore, GiftWord } from '../types';
import { ICONS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getConjugationPersons, getAvailableTenses, isTenseGendered, isTenseLimited, getImperativePersons, type VerbTense } from '../constants/language-config';
import { sounds } from '../services/sounds';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';

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
  const [detailModalId, setDetailModalId] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState<{ [key: string]: number }>({});
  const [formsModalId, setFormsModalId] = useState<string | null>(null);
  const [activeTenseTab, setActiveTenseTab] = useState<VerbTense>('present');
  const [unlockDialogTense, setUnlockDialogTense] = useState<VerbTense | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [completingEntryId, setCompletingEntryId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');

  // Theme
  const { accentHex } = useTheme();

  // Language
  const { targetLanguage, languageParams } = useLanguage();
  const { t } = useTranslation();

  // Offline
  const { isOnline, cachedWordCount, lastSyncTime, pendingCount, isSyncing: offlineSyncing, cacheVocabulary, getCachedVocabulary, cacheWordScores, getCachedWordScores } = useOffline(profile.id, targetLanguage);

  // Get dynamic pronouns for the target language
  const pronouns = getConjugationPersons(targetLanguage);

  // Helper to get conjugation value with fallback to legacy Polish keys
  const getConjValue = (tenseData: Record<string, any>, normalizedKey: string): string | { masculine?: string; feminine?: string; neuter?: string } | undefined => {
    // Try normalized key first
    if (tenseData[normalizedKey]) return tenseData[normalizedKey];

    // Fallback to legacy Polish keys for backward compatibility
    const legacyKeyMap: Record<string, string> = {
      'first_singular': 'ja',
      'second_singular': 'ty',
      'third_singular': 'onOna',
      'first_plural': 'my',
      'second_plural': 'wy',
      'third_plural': 'oni'
    };
    const legacyKey = legacyKeyMap[normalizedKey];
    return legacyKey ? tenseData[legacyKey] : undefined;
  };

  const fetchEntries = useCallback(async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;

    // Offline: load from IndexedDB cache
    if (!isOnline) {
      const cachedVocab = await getCachedVocabulary();
      if (cachedVocab && cachedVocab.length > 0) {
        setEntries(cachedVocab.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
      const cachedScores = await getCachedWordScores();
      if (cachedScores.length > 0) {
        const map = new Map<string, WordScore>();
        cachedScores.forEach(s => map.set(s.word_id, s as WordScore));
        setScoresMap(map);
      }
      setLoading(false);
      return;
    }

    // Parallel fetch: dictionary, word_scores, gift_words
    const [{ data }, { data: scoreData }, { data: giftData }] = await Promise.all([
      supabase
        .from('dictionary')
        .select('id, user_id, word, translation, word_type, pronunciation, gender, plural, conjugations, adjective_forms, example_sentence, pro_tip, notes, source, language_code, created_at, enriched_at')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage)
        .order('created_at', { ascending: false }),
      supabase
        .from('word_scores')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage),
      supabase
        .from('gift_words')
        .select('*')
        .eq('student_id', targetUserId)
        .eq('language_code', targetLanguage)
    ]);

    if (data) {
      setEntries(data as DictionaryEntry[]);
      await cacheVocabulary(data as DictionaryEntry[]);
    }

    if (scoreData) {
      const map = new Map<string, WordScore>();
      scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
      setScoresMap(map);
      await cacheWordScores(scoreData as WordScore[]);
    }

    if (giftData) {
      const giftMap = new Map<string, GiftWord>();
      giftData.forEach((g: any) => giftMap.set(g.word_id, g as GiftWord));
      setGiftedWordsMap(giftMap);
    }

    // Get partner name for gift badges (separate query — depends on profile)
    if (profile.linked_user_id) {
      const { data: partner } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profile.linked_user_id)
        .single();
      if (partner) setPartnerName(partner.full_name);
    }

    setLoading(false);
  }, [profile, targetLanguage, isOnline, getCachedVocabulary, getCachedWordScores, cacheVocabulary, cacheWordScores]);

  // Fetch entries on mount and when profile/language changes
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Listen for dictionary updates from other components (debounced to avoid rapid refetches)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchEntries(), 500);
    };
    window.addEventListener('dictionary-updated', handler as EventListener);
    return () => {
      window.removeEventListener('dictionary-updated', handler as EventListener);
      if (timer) clearTimeout(timer);
    };
  }, [fetchEntries]);

  // Auto-poll when gift words are still being enriched (enriched_at is null)
  useEffect(() => {
    const hasEnrichingWords = entries.some(e =>
      giftedWordsMap.has(e.id) && !e.enriched_at
    );
    if (!hasEnrichingWords) return;

    const interval = setInterval(() => fetchEntries(), 12_000);
    return () => clearInterval(interval);
  }, [entries, giftedWordsMap, fetchEntries]);

  // Note: language-switched listener removed — fetchEntries reference changes when
  // targetLanguage changes (via useCallback deps), so useEffect([fetchEntries]) above
  // already triggers a refetch on language switch.

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
          knownWords,
          languageParams
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

      // Play sounds if words were found (xp-gain for earning XP, new-words for adding to dictionary)
      if (totalNewWords > 0) {
        sounds.play('new-words');
        sounds.play('xp-gain');
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

  const handleUnlockTense = async (entry: DictionaryEntry, tense: VerbTense) => {
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

  const handleCompleteEntry = async (entryId: string) => {
    setCompletingEntryId(entryId);
    try {
      const result = await geminiService.completeEntry(entryId);
      if (result?.success) {
        // Refresh entries to get updated data
        await fetchEntries();
      } else if (!result?.complete) {
        // complete: true means nothing was missing, otherwise it failed
        console.error('Complete entry failed:', result);
      }
    } catch (e) {
      console.error('Complete entry error:', e);
    } finally {
      setCompletingEntryId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 md:px-6 py-3 md:py-4 glass-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Compact single row with title and icons */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[var(--accent-color)] p-1.5 rounded-lg shadow-md">
                <ICONS.Book className="text-white w-4 h-4" />
              </div>
              <h2 className="text-scale-body font-black text-[var(--text-primary)] font-header">{t('loveLog.title')}</h2>
              <span className="text-[9px] font-bold text-[var(--text-secondary)] bg-white/40 dark:bg-white/15 px-1.5 py-0.5 rounded-full">{entries.length}</span>
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
                disabled={isSyncing || !isOnline}
                className="p-2 bg-[var(--accent-light)] rounded-lg transition-all disabled:opacity-50"
                title={!isOnline ? t('offline.featureUnavailable', 'Unavailable offline') : t('loveLog.sync.scanTooltip')}
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
                  className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary)] rounded-xl text-scale-caption font-bold border-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
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
              <h2 className="text-scale-heading font-black text-[var(--text-primary)] font-header">{t('loveLog.titleFull')}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] w-3.5 h-3.5" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('loveLog.search')} className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary)] rounded-xl text-scale-caption font-bold border-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-light)] hover:bg-[var(--accent-light-hover)] rounded-xl transition-all disabled:opacity-50"
                title={!isOnline ? t('offline.featureUnavailable', 'Unavailable offline') : t('loveLog.sync.scanTooltip')}
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
              className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.08em] md:tracking-[0.1em] transition-all whitespace-nowrap ${
                activeFilters.has(f)
                  ? 'bg-[var(--secondary-color)] text-white shadow-md'
                  : 'glass-card text-[var(--text-secondary)]'
              }`}
            >
              {t(`loveLog.filters.${f}`)}s
            </button>
          ))}
          {giftedWordsMap.size > 0 && (
            <button
              onClick={() => setShowGiftsOnly(!showGiftsOnly)}
              className={`px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-[0.08em] md:tracking-[0.1em] transition-all whitespace-nowrap flex items-center gap-1 ${
                showGiftsOnly
                  ? 'bg-[var(--secondary-color)] text-white shadow-md'
                  : 'glass-card text-[var(--text-secondary)]'
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

      <div className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6">
        {!isOnline && (
          <div className="max-w-7xl mx-auto mb-3">
            <OfflineIndicator
              isOnline={isOnline}
              cachedWordCount={cachedWordCount}
              lastSyncTime={lastSyncTime}
              pendingCount={pendingCount}
              isSyncing={offlineSyncing}
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-5">
          {filtered.map(e => {
            // Get mastery status for this word
            const score = scoresMap.get(e.id);
            const isLearned = score?.learned_at != null;
            const currentStreak = score?.correct_streak || 0;

            // Check if this is a gifted word
            const giftData = giftedWordsMap.get(e.id);
            const isGifted = !!giftData;

            return (
              <div
                key={e.id}
                className="relative h-[200px] md:h-[280px] w-full cursor-pointer"
                onClick={() => setDetailModalId(e.id)}
              >
                <div className={`h-full glass-card rounded-xl md:rounded-[1.5rem] p-3 md:p-5 flex flex-col hover:shadow-lg hover:scale-[1.02] transition-all overflow-hidden ${
                  isGifted ? 'border-[var(--accent-border)] ring-1 md:ring-2 ring-[var(--accent-border)]' : ''
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

                  {/* Enriching Badge - bottom left (gift words being enriched) */}
                  {isGifted && !e.enriched_at && (
                    <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 md:px-2 py-0.5 rounded-full animate-pulse">
                      <span className="text-[7px] md:text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        {t('loveLog.card.enriching')}
                      </span>
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
                    <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-wider text-[var(--secondary-text)] bg-[var(--secondary-light)] px-2 md:px-3 py-0.5 md:py-1 rounded-full">{t(`loveLog.filters.${e.word_type}`)}</span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full text-center gap-1 md:gap-2">
                    <h3 className="text-scale-heading md:text-2xl font-black text-[var(--accent-color)] font-header leading-tight break-words">{e.word}</h3>

                    {/* Audio button */}
                    <button
                      onClick={(ev) => { ev.stopPropagation(); speak(e.word, targetLanguage); }}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--accent-light)] hover:bg-[var(--accent-light-hover)] flex items-center justify-center transition-all group"
                    >
                      <ICONS.Play className="w-4 h-4 md:w-5 md:h-5 text-[var(--accent-color)] translate-x-[1px]" />
                    </button>

                    <p className="text-scale-caption md:text-scale-label text-[var(--text-secondary)] font-medium line-clamp-2">{e.translation}</p>
                  </div>

                  {/* Tap hint */}
                  <p className="text-[8px] md:text-[10px] text-[var(--text-secondary)] opacity-50 text-center">{t('loveLog.card.tapForDetails')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === DETAIL MODAL === */}
      {detailModalId && (() => {
        const entry = entries.find(e => e.id === detailModalId);
        if (!entry) return null;
        const ctx = getEntryContext(entry);
        const isGifted = giftedWordsMap.has(entry.id);
        const examples = ctx.examples?.length ? ctx.examples : (ctx.original ? [ctx.original] : []);
        const currentIdx = carouselIdx[entry.id] || 0;
        const hasFormsData = entry.word_type === 'verb' ? ctx.conjugations :
                             entry.word_type === 'noun' ? (ctx.gender || ctx.plural) :
                             entry.word_type === 'adjective' ? ctx.adjectiveForms : false;

        return (
          <div
            className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
            onClick={() => setDetailModalId(null)}
          >
            <div
              className="glass-card-solid rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(ev) => ev.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[var(--accent-color)] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-scale-heading">{entry.word}</span>
                  <button
                    onClick={() => speak(entry.word, targetLanguage)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    <ICONS.Play className="w-4 h-4 translate-x-[1px]" />
                  </button>
                </div>
                <button
                  onClick={() => setDetailModalId(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <ICONS.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
                {/* Translation + Type */}
                <div className="text-center">
                  <p className="text-scale-heading text-[var(--text-primary)] font-medium">{entry.translation}</p>
                  <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--secondary-text)] bg-[var(--secondary-light)] px-3 py-1 rounded-full">
                    {t(`loveLog.filters.${entry.word_type}`)}
                  </span>
                </div>

                {/* Example Sentence */}
                {examples.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-scale-caption font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {t('loveLog.card.example')}
                      </span>
                      {examples.length > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCarouselIdx(prev => ({ ...prev, [entry.id]: (currentIdx - 1 + examples.length) % examples.length }))}
                            className="text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-all p-1"
                          >
                            <ICONS.ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-scale-caption text-[var(--text-secondary)] min-w-[32px] text-center">
                            {currentIdx + 1}/{examples.length}
                          </span>
                          <button
                            onClick={() => setCarouselIdx(prev => ({ ...prev, [entry.id]: (currentIdx + 1) % examples.length }))}
                            className="text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-all p-1"
                          >
                            <ICONS.ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-color)]">
                      <p className="text-scale-label leading-relaxed italic text-[var(--text-primary)]">
                        "{examples[currentIdx] || t('loveLog.card.noExample')}"
                      </p>
                    </div>
                  </div>
                ) : isGifted && !entry.enriched_at ? (
                  <div className="space-y-2">
                    <span className="text-scale-caption font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t('loveLog.card.example')}
                    </span>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                        <p className="text-scale-label text-[var(--text-secondary)] italic">
                          {t('loveLog.card.enrichingDetail')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Pro-tip */}
                {ctx.proTip ? (
                  <div className="bg-[var(--accent-light)] rounded-xl p-4 border border-[var(--accent-border)]">
                    <p className="text-scale-label text-[var(--text-primary)] flex items-start gap-2">
                      <ICONS.Lightbulb className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0 mt-0.5" /> {ctx.proTip}
                    </p>
                  </div>
                ) : isGifted && !entry.enriched_at ? (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-scale-label text-amber-600 dark:text-amber-400 italic flex items-center gap-2">
                      <ICONS.Sparkles className="w-4 h-4 animate-pulse flex-shrink-0" />
                      {t('loveLog.card.enrichingTip')}
                    </p>
                  </div>
                ) : null}

                {/* Show Forms / Fill in forms button */}
                {hasFormsData ? (
                  <button
                    onClick={() => { setDetailModalId(null); setFormsModalId(entry.id); }}
                    className="w-full py-3 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-scale-label font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <ICONS.Book className="w-4 h-4" />
                    {entry.word_type === 'verb' ? t('loveLog.card.conjugations') : t('loveLog.card.forms')}
                  </button>
                ) : isGifted && !entry.enriched_at && ['verb', 'noun', 'adjective'].includes(entry.word_type) ? (
                  <div className="w-full py-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-xl text-scale-label font-bold text-center animate-pulse">
                    {t('loveLog.card.enrichingForms')}
                  </div>
                ) : ['verb', 'noun', 'adjective'].includes(entry.word_type) ? (
                  <button
                    onClick={() => handleCompleteEntry(entry.id)}
                    disabled={completingEntryId === entry.id}
                    className="w-full py-3 bg-[var(--accent-light)] hover:bg-[var(--accent-light-hover)] text-[var(--accent-color)] rounded-xl text-scale-label font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {completingEntryId === entry.id ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        {t('loveLog.card.fillingForms', 'Generating...')}
                      </>
                    ) : (
                      <>
                        <ICONS.Sparkles className="w-4 h-4" />
                        {t('loveLog.card.fillForms', 'Fill in forms')}
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })()}

      {/* === FORMS OVERLAY MODAL === */}
      {formsModalId && (() => {
        const entry = entries.find(e => e.id === formsModalId);
        if (!entry) return null;
        const ctx = getEntryContext(entry);

        return (
          <div
            className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
            onClick={() => setFormsModalId(null)}
          >
            <div
              className="glass-card-solid rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(ev) => ev.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[var(--accent-color)] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-scale-heading">{entry.word}</span>
                  <button
                    onClick={() => speak(entry.word, targetLanguage)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    <ICONS.Play className="w-4 h-4 translate-x-[1px]" />
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
                    {/* Tense Tabs - Dynamic based on target language */}
                    <div className="flex gap-1 glass-card rounded-xl p-1 overflow-x-auto">
                      {getAvailableTenses(targetLanguage).map(tense => {
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
                                setUnlockDialogTense(tense);
                              }
                            }}
                            className={`flex-1 min-w-fit py-2 px-3 rounded-lg text-scale-caption font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                              isActive
                                ? 'bg-[var(--bg-card)] text-[var(--accent-color)] shadow-sm'
                                : isUnlocked
                                  ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50'
                                  : 'text-[var(--text-secondary)] opacity-60 hover:bg-[var(--bg-card)]/30'
                            }`}
                          >
                            {!isUnlocked && <ICONS.Lock className="w-3 h-3" />}
                            {t(`loveLog.modal.${tense}`, tense)}
                            {isUnlocked && !isPresent && <span className="text-green-500 text-[8px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Tense Content - Dynamic based on tense structure */}
                    {(() => {
                      const tenseData = ctx.conjugations?.[activeTenseTab] as any;
                      const isPresent = activeTenseTab === 'present';
                      const isUnlocked = isPresent || (tenseData && tenseData.unlockedAt);
                      const isGendered = isTenseGendered(targetLanguage, activeTenseTab);
                      const isLimited = isTenseLimited(targetLanguage, activeTenseTab);

                      if (!isUnlocked) {
                        return (
                          <div className="text-center py-8">
                            <ICONS.Lock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3" />
                            <p className="text-[var(--text-secondary)] text-scale-label mb-4">
                              {t('loveLog.modal.tenseLocked', { tense: t(`loveLog.modal.${activeTenseTab}`, activeTenseTab) })}
                            </p>
                            <button
                              onClick={() => setUnlockDialogTense(activeTenseTab)}
                              className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl text-scale-label font-bold hover:bg-[var(--accent-hover)] transition-all"
                            >
                              {t('loveLog.modal.unlockTense', { tense: t(`loveLog.modal.${activeTenseTab}`, activeTenseTab) })}
                            </button>
                          </div>
                        );
                      }

                      if (!tenseData) return null;

                      // Get person labels based on tense type
                      const personKeys = isLimited
                        ? getImperativePersons(targetLanguage)
                        : ['first_singular', 'second_singular', 'third_singular', 'first_plural', 'second_plural', 'third_plural'];

                      const pronounLabels = personKeys.map((key, idx) => {
                        const pronounIdx = key === 'first_singular' ? 0 :
                                          key === 'second_singular' ? 1 :
                                          key === 'third_singular' ? 2 :
                                          key === 'first_plural' ? 3 :
                                          key === 'second_plural' ? 4 :
                                          key === 'third_plural' ? 5 : idx;
                        const englishKey = key.includes('singular')
                          ? `loveLog.pronouns.singular${key.charAt(0) === 'f' ? '1' : key.charAt(0) === 's' ? '2' : '3'}`
                          : `loveLog.pronouns.plural${key.charAt(0) === 'f' ? '1' : key.charAt(0) === 's' ? '2' : '3'}`;
                        return {
                          pronoun: pronouns[pronounIdx] || key,
                          english: t(englishKey, ''),
                          key
                        };
                      });

                      // Gendered tense (Slavic past/conditional)
                      if (isGendered) {
                        return (
                          <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                            <table className="w-full text-scale-label">
                              <thead>
                                <tr className="bg-[var(--border-color)]/30">
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.person')}</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.masculine')}</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.feminine')}</th>
                                  <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase">{t('loveLog.tableHeaders.neuter')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-color)]">
                                {pronounLabels.map(row => {
                                  const data = getConjValue(tenseData, row.key);
                                  const isThirdSingular = row.key === 'third_singular';
                                  return (
                                    <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                                      <td className="px-3 py-2 text-[var(--text-secondary)] text-scale-caption">{row.pronoun} {row.english}</td>
                                      <td className="px-3 py-2 font-bold text-[var(--accent-color)] text-scale-label">
                                        {typeof data === 'object' ? data?.masculine : data || '—'}
                                      </td>
                                      <td className="px-3 py-2 font-bold text-[var(--accent-color)] text-scale-label">
                                        {typeof data === 'object' ? data?.feminine : '—'}
                                      </td>
                                      <td className="px-3 py-2 font-bold text-[var(--accent-color)] text-scale-label">
                                        {isThirdSingular && typeof data === 'object' ? data?.neuter || '—' : '—'}
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

                      // Standard or limited tense (simple 2-column)
                      return (
                        <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                          <table className="w-full text-scale-label">
                            <tbody className="divide-y divide-[var(--border-color)]">
                              {pronounLabels.map(row => (
                                <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                                  <td className="px-4 py-2 text-[var(--text-secondary)] text-scale-caption">{row.pronoun} {row.english}</td>
                                  <td className="px-4 py-2 font-bold text-[var(--accent-color)]">{(() => { const v = getConjValue(tenseData, row.key); return typeof v === 'object' ? [v?.masculine, v?.feminine, v?.neuter].filter(Boolean).join(' / ') || '—' : v || '—'; })()}</td>
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
                    })()}

                    {/* Unlock Dialog */}
                    {unlockDialogTense && (
                      <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => !unlocking && setUnlockDialogTense(null)}>
                        <div className="glass-card rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                              <ICONS.Lock className="w-8 h-8 text-[var(--accent-color)]" />
                            </div>
                            <h3 className="text-scale-heading font-bold font-header text-[var(--text-primary)] mb-2">
                              {t('loveLog.unlock.title', { tense: t(`loveLog.modal.${unlockDialogTense}`, unlockDialogTense) })}
                            </h3>
                            <p className="text-[var(--text-secondary)] text-scale-label mb-6">
                              {t('loveLog.unlock.descriptionBefore')}{' '}
                              <strong className="text-[var(--accent-color)]">{entry.word}</strong>{' '}
                              {t('loveLog.unlock.descriptionAfter', { tense: unlockDialogTense })}
                              {isTenseGendered(targetLanguage, unlockDialogTense) && ` ${t('loveLog.unlock.genderedNote', t('loveLog.unlock.pastNote'))}`}
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
                      <table className="w-full text-scale-label">
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {ctx.gender && (
                            <tr>
                              <td className="py-2 text-[var(--text-secondary)] text-scale-caption">{t('loveLog.nounForms.gender')}</td>
                              <td className="py-2 font-bold text-[var(--accent-color)] capitalize">{ctx.gender}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-2 text-[var(--text-secondary)] text-scale-caption">{t('loveLog.nounForms.singular')}</td>
                            <td className="py-2 font-bold text-[var(--accent-color)]">{entry.word}</td>
                          </tr>
                          {ctx.plural && (
                            <tr>
                              <td className="py-2 text-[var(--text-secondary)] text-scale-caption">{t('loveLog.nounForms.plural')}</td>
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
                    <h4 className="text-scale-caption font-bold font-header uppercase tracking-wider text-[var(--accent-color)] mb-2">
                      {t('loveLog.adjectiveForms.title')}
                    </h4>
                    <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
                      <table className="w-full text-scale-label">
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {[
                            { label: t('loveLog.adjectiveForms.masculine'), value: ctx.adjectiveForms.masculine, key: 'masculine' },
                            { label: t('loveLog.adjectiveForms.feminine'), value: ctx.adjectiveForms.feminine, key: 'feminine' },
                            { label: t('loveLog.adjectiveForms.neuter'), value: ctx.adjectiveForms.neuter, key: 'neuter' },
                            { label: t('loveLog.adjectiveForms.plural'), value: ctx.adjectiveForms.plural, key: 'plural' }
                          ].map(row => (
                            <tr key={row.key} className="hover:bg-[var(--border-color)]/30">
                              <td className="px-4 py-2 text-[var(--text-secondary)] text-scale-caption">{row.label}</td>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LoveLog;
